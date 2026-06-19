# Matchpoint Tennis Club — Comprehensive Audit & Improvement Plan

_Prepared June 2026 · scope: full codebase review of the live member portal_

---

## 1. Executive summary

The app works for its narrow purpose — a password-gated weekly booking board for Tue/Thu evening sessions, backed by Firebase Firestore with real-time sync. The core booking transaction is actually well thought out (it uses a Firestore transaction to prevent double-booking).

But the project is fragile and risky for three structural reasons:

1. **There is effectively no security.** The "password" is hardcoded in client JavaScript and gates nothing — the Firestore database appears to be wide open to anyone on the internet. There are no security rules committed to the repo.
2. **The repository is ~70% dead code.** 22 HTML files and 9 script variants coexist; only `index.html` + `script-firebase.js` + `firebase-config.js` are live. Nobody can tell what is real, which is why bugs keep coming back.
3. **A data-integrity bug ("ghost players")** is real and recurring, and the current "fix" is a hardcoded cleanup button targeting one specific player ID.

None of this requires a rewrite to *fix*, but the UI/UX modernization you want is a natural moment to migrate to a maintainable stack. My recommendation is a staged plan: **stop the bleeding first (security + dead code), then modernize the stack and UI** rather than redesigning on top of the current foundation.

---

## 2. What is actually running

Despite what the docs claim, the live application is just six files:

| File | Role |
|------|------|
| `index.html` | The only real entry point |
| `script-firebase.js` (1,823 lines) | All application logic |
| `firebase-config.js` | Firebase init + date helpers |
| `styles.css` + 6 more CSS files | Styling, loaded as 7 separate render-blocking requests |

Everything else — `index-backup.html`, `index-working.html`, `complete-app.html`, `script.js`, `script-simple.js`, `working-script.js`, `script-firebase.js.bak`, the `admin/` tools, the `debug-*.html` and `reset-*.html` pages — is abandoned. The markdown docs (`README.md`, `PROJECT_STATUS.md`, `CLAUDE_CONTEXT.md`) describe **three mutually contradictory versions** of the app:

- `README.md` says "localStorage, no frameworks, Mon–Thu 18:00–21:00."
- `PROJECT_STATUS.md` says "Firebase real-time, 18:00–21:00."
- The actual code does Firebase with **Tue/Thu only, 20:00–22:00**, and `CLAUDE_CONTEXT.md` even has the coaches assigned to the wrong days versus the code.

This documentation drift is itself a stability problem: anyone (human or AI) picking up the project starts from false assumptions.

---

## 3. Critical issues (fix before anything else)

### 3.1 The app has no real access control 🔴
The login check is literally `if (password === '30:Love')` in `script-firebase.js` (line 267). The password:
- is visible to anyone who opens DevTools or reads the public GitHub repo;
- gates **only the UI**, not the data.

Because every client signs in with Firebase **anonymous auth** and there are **no Firestore security rules in the repo**, the database is almost certainly in open/test mode. That means anyone who finds the project ID (it's in the public repo: `matchpoint-e5b00`) can read, edit, or wipe every player, booking, and message directly via the Firebase API — no password needed.

**Fix:** Write and deploy proper Firestore security rules immediately, even before any redesign. At minimum, lock writes to authenticated users and validate document shape. Longer term, replace the shared password with real per-member auth (see §6).

### 3.2 Stored XSS via player names 🔴
Club-wall messages are correctly escaped with `escapeHtml()`, but **player names are not**. They're injected straight into `innerHTML` in at least four places (lines 1067, 1108, 1117, 1156). Since anyone can add a player (open DB, §3.1), a name like `<img src=x onerror=...>` becomes persistent JavaScript that runs in every member's browser.

**Fix:** Run every dynamic value through `escapeHtml()` (or switch to `textContent` / a framework that escapes by default).

### 3.3 "Ghost players" data-integrity bug 🔴
This is the recurring bug behind the `⚠️ Unknown` tags and the hardcoded "🧹 Fix Template" button. Root cause: when a player is deleted, `deletePlayer()` removes them from the `players` collection and from current `schedules`, **but not from the `seasonTemplate` document.** `initializeWeekSchedule()` then re-seeds future weeks from that stale template, resurrecting the deleted player as an orphaned ID that no longer maps to a name.

The current workaround (`cleanupTemplate()`, lines 59–113) hardcodes a single player ID `kristines_1768246441500` — it only ever fixes that one ghost.

**Fix:** Make deletion atomic across `players`, `schedules`, **and** `seasonTemplate`. Then remove the band-aid button.

---

## 4. Functional bugs

| # | Location | Bug | Effect |
|---|----------|-----|--------|
| 1 | `confirmBooking`, localStorage branch (~line 721) | On a duplicate booking it `alert()`s and `return`s **without** calling `setBookingLoading(false)` | Loading overlay gets stuck permanently |
| 2 | `confirmBooking` (lines 609 & 639) | `const { day, time }` is declared twice | Works by scope accident; confusing and fragile |
| 3 | Club messages use `db` (from `firebase-config.js`) while everything else uses `database` (from `initializeFirebase`) | Two separate Firestore handles + **two** redundant anonymous sign-ins | Split-brain init; club wall can silently break if `firebase-config.js` load order changes |
| 4 | `loadClubMessages()` | Registers a new `onSnapshot` listener every call and never unsubscribes | Listener leak on repeated login/logout |
| 5 | `initializeApp()` (line 394) | Dead duplicate of `initializeAppWithLoading()`, still shows a removed tournament banner | Confusion; risk of wiring up the wrong one |
| 6 | `README.md` "swipe gestures for week navigation" | **No touch/swipe handlers exist** in the live script (`grep` confirms 0) | Documented feature doesn't exist |
| 7 | `initializeWeekSchedule()` | Sequential `await docRef.get()` inside nested loops | N network round-trips on every week change; slow, and re-run on each `changeWeek` |
| 8 | Date logic (`getInitialWeekOffset`, `getWeekStartDate`) | Hand-rolled, hardcodes a "Thursday after 20:30 → next week" rule; no timezone handling | Edge-case bugs around week boundaries and DST |

---

## 5. Stability, performance & code health

- **Dead code is the #1 maintainability risk.** 22 HTML files and 9 JS variants mean every change risks editing a file that isn't live. Delete everything except the six live files (move them to an `archive/` branch if you want history).
- **Legacy Firebase v8 SDK**, loaded as three full namespaced bundles from gstatic. Deprecated; no tree-shaking; larger than necessary. Migrate to the v9+ modular SDK.
- **7 render-blocking CSS files** loaded individually. Bundle to one, or adopt a build step.
- **Manual cache-busting** via hand-edited query strings (`?v=2026-01-18-v3`). Error-prone; a build tool does this automatically with content hashes.
- **No build, lint, type-checking, or tests.** No CI. Every deploy is a hand `git push` to GitHub Pages with no safety net.
- **`console.log` debug noise** ships to production, including a `🔍 DEBUG` block inside the booking transaction.
- **No error surfacing.** Firebase failures fall back to a per-device localStorage mode silently — a member could be quietly editing a local-only copy and think they booked a real slot.

---

## 6. UI / UX assessment

The current look is dated and inconsistent — emoji-as-iconography (🎾�brand, 🗑️ delete, ✏️ edit), gradient-heavy "2010s web app" styling spread across seven uncoordinated stylesheets, and no design system. Specific gaps:

- **Accessibility:** icon-only buttons with no accessible labels, no ARIA, modals aren't focus-trapped and can't be closed with Escape, color-only skill indicators (fails colorblind users), no form labels association in places.
- **Mobile:** responsive in places but the README's promised swipe navigation doesn't exist; touch targets and the sidebar admin pattern feel bolted on.
- **Feedback & states:** loading states exist (nice tennis-ball spinner) but empty/error states are thin, and the silent localStorage fallback gives false confidence.
- **Visual identity:** no consistent type scale, spacing system, or component library — each CSS file invents its own.

### Recommended design direction
A clean, modern, mobile-first redesign built on a real design system:

- **Component-driven UI** with a single source of truth for color, type, spacing (design tokens).
- **Calm, sporty identity** — keep the blue/yellow tennis palette but apply it through tokens, replace emoji icons with a proper icon set (e.g. Lucide), add real empty/error/skeleton states.
- **Card-based weekly schedule** that collapses gracefully to a single-column timeline on phones, with real swipe/scroll week navigation.
- **Accessible by default** — semantic landmarks, focus management, keyboard support, WCAG-AA contrast.

---

## 7. Recommended target architecture

You can modernize incrementally, but the highest-leverage move is to adopt a small modern stack at the redesign:

- **Framework:** React (or Svelte/SvelteKit if you prefer lighter) with **Vite** for build, bundling, and automatic cache-busting.
- **Styling:** Tailwind CSS or CSS modules with design tokens — replaces all 7 CSS files.
- **Backend:** Keep Firebase (it's a good fit) but migrate to the **v9+ modular SDK** and add **deployed Firestore security rules**. Move the schedule/template/booking logic into a small set of typed service modules.
- **Auth:** Replace the shared password with Firebase Auth — email-link or Google sign-in, with an `admins` allowlist for player/template management. Members get read + book; admins get edit.
- **Hosting:** Firebase Hosting (pairs naturally with the DB and gives you atomic deploys + preview channels) or keep GitHub Pages with a CI build.
- **Quality gates:** TypeScript, ESLint/Prettier, a couple of unit tests around the booking/date logic, and a GitHub Action that builds and deploys on push.

---

## 8. Prioritized roadmap

**Phase 0 — Stop the bleeding (days, do now)**
1. Write & deploy Firestore security rules (close the open database). 🔴
2. Escape player names everywhere to kill the stored-XSS vector. 🔴
3. Fix the ghost-player root cause (atomic delete across template) and remove the hardcoded cleanup button. 🔴
4. Fix the stuck-loading-overlay bug in the localStorage booking branch.

**Phase 1 — Clean house (a few days)**
5. Delete all dead files; keep only the 6 live ones (archive history on a branch).
6. Consolidate to one accurate `README` describing the *actual* app (Tue/Thu, 20:00–22:00, Firebase).
7. Strip debug logging; unify on a single Firestore handle and one anonymous sign-in.

**Phase 2 — Modernize stack (1–2 weeks)**
8. Migrate to Vite + React (or Svelte) + Firebase v9, with TypeScript, lint, and CI deploy.
9. Move booking/template/date logic into tested service modules; fix the date edge cases.

**Phase 3 — Redesign UI/UX (1–2 weeks)**
10. Build the design system + component library; ship the accessible, mobile-first redesign.
11. Replace shared password with real Firebase Auth + admin allowlist.

**Phase 4 — Enhancements (backlog)**
12. Waitlists for full slots, booking history/attendance, email/push reminders, PWA install, admin analytics.

---

## 9. The single most important takeaway

Before any redesign, **close the open database and remove the dead code.** Those two steps eliminate the security exposure and the root cause of most "it's buggy and keeps breaking" reports. With a clean, secured foundation, the modernization and visual redesign become straightforward rather than risky.

I'm happy to start on Phase 0 immediately — the security rules and the three critical fixes are small, contained changes I can implement and test next.
