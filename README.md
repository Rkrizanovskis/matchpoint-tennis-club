# Matchpoint Tennis Club — Member Portal

Password-protected scheduling app for Matchpoint Tennis Club, Riga.
Members view the weekly training schedule, book themselves (or others) into
slots, manage the roster, and post to a shared club wall.

**Live site:** https://matchpoint.lv

## How it works

- **Frontend:** plain HTML/CSS + a small ES-module JavaScript app (no build step).
- **Backend:** Firebase Firestore (real-time sync) with anonymous auth, using the
  modular **v10** SDK loaded straight from the CDN.
- **Hosting:** GitHub Pages (custom domain via `CNAME`).
- **Access:** a single shared member password gates the UI.

If Firestore can't be reached, the app shows a clear error and **blocks writes**
rather than silently saving to the local device.

## Current schedule (Summer 2026)

| Day | Coach | Slots |
|-----|-------|-------|
| Tuesday | Justīne | 19:00–20:00, 20:00–21:00 |
| Wednesday | Paša | 19:00–20:00, 20:00–21:00 |
| Thursday | Paša | 19:00–20:00 group · 20:00–21:00 individual/reserve (book ahead) |

Each group slot holds up to 5 players.

## File map

| File | Purpose |
|------|---------|
| `index.html` | The app shell (login, schedule, modals, club wall) |
| `app.js` | All application logic (ES module) |
| `firebase-init.js` | Firebase setup — one app, one Firestore handle, one sign-in |
| `season-config.js` | **Edit this to change the season** — days, slots, coaches, roster, template |
| `styles.css` + 6 more | Style sources |
| `bundle.css` | Generated: all stylesheets concatenated into one request (loaded by `index.html`) |
| `admin/seed-summer-season.html` | One-click tool to write the roster + template to Firestore |
| `AUDIT-2026.md` | Codebase audit & improvement roadmap |
| `deploy.sh`, `CNAME` | Deployment helpers |

## Changing the schedule between seasons

Edit `season-config.js` (days, time slots, coaches, default roster and template).
That's the only file that defines the schedule shape — `app.js` and the seed tool
both read from it.

To push a new default roster/template to the live database, open
`admin/seed-summer-season.html` on the site and run Step 1 (and optionally Step 2
to apply it to the current/upcoming weeks).

## After editing styles

`bundle.css` is generated from the source `.css` files. If you edit a source file,
regenerate the bundle:

```bash
for f in styles.css modal-styles.css booking-loading.css club-wall-styles.css \
         main-club-wall-styles.css instructor-styles.css loading-styles.css; do
  echo "/* ===== $f ===== */"; cat "$f"; echo "";
done > bundle.css
```

## Local development

```bash
python3 -m http.server 8001
# open http://localhost:8001
```

ES modules require a server (opening `index.html` via `file://` will not work).

---

© Matchpoint Tennis Club, Riga
