# Matchpoint Tennis Club - Claude Context File

## 🎾 Project Overview
This is the official scheduling system for Matchpoint Tennis Club in Riga, Latvia. A web application for member booking, schedule management, and club communication.

## 📁 Project Structure & Files

### Core Files
- **index.html** - Main HTML structure with login, schedule, admin panel, club wall
- **styles.css** - Complete styling with tennis theme, mobile responsive design
- **script.js** - All JavaScript functionality and data management
- **README.md** - Public GitHub documentation (password removed for security)
- **CNAME** - Domain configuration file (auto-created by GitHub)

## 🌐 Deployment & Hosting

### GitHub Repository
- **URL:** https://github.com/Rkrizanovskis/matchpoint-tennis-club
- **GitHub Pages:** https://rkrizanovskis.github.io/matchpoint-tennis-club
- **Custom Domain:** https://matchpoint.lv (DNS processing on nic.lv)

### DNS Configuration
- **Provider:** nic.lv
- **Records Added:** 4 A records pointing to GitHub Pages IPs
- **Status:** DNS processing/propagating (can take 24-48 hours)

### Workflow
1. Edit files in `/matchpoint-tennis-github/`
2. Test on localhost:3000
3. Git add/commit/push to GitHub
4. Changes automatically deploy to live site

## 🔐 Authentication & Security

### Login System
- **Password:** `30:Love` (tennis-themed)
- **Security:** Password NOT in public README (removed for security)
- **Access:** Single password for all club members

### Function Names
- **IMPORTANT:** Use `postClubMessage()` not `postMessage()` (renamed to avoid browser conflicts)

## 🎨 Design & Features

### Tennis Theme
- **Colors:** Blue (#5A7AD9, #4F68CC) and Yellow (#FFBC4C, #FFB84D)
- **Branding:** "Matchpoint Tennis Club - Riga 2025 • Member Only"
- **Icons:** Tennis ball (🎾), trophy (🏆), etc.
- **Cursors:** Custom crosshair (+) for clickable elements

### Key Features Implemented
1. **Login Screen** - Tennis-themed with bouncing ball animation
2. **Weekly Schedule** - 4-day view (Mon-Thu) with time slots
3. **Player Management** - Add/edit/delete players with skill levels
4. **Booking System** - Click to book, capacity management (5 players max)
5. **Club Wall** - Community messaging with colored nicknames
6. **Admin Panel** - Sliding sidebar with player management
7. **Mobile Responsive** - Touch-friendly, swipe gestures

## 📱 Mobile Optimizations
- **Responsive design** with proper breakpoints
- **Touch targets** minimum 44px height
- **Swipe gestures** for week navigation
- **Mobile-specific layouts** and interactions
- **Optimized forms** and inputs

## 👥 Player & Schedule Data

### Current Players (in appData.players)
**Monday:** Ričards, Diāna, Elza, Agnese, Arta, Ilvija
**Tuesday:** Aivars, Līva, Klāvs, Agnese, Sintija, Kristīne, Elīza, Zelma  
**Wednesday:** Karīna, Rihards, Kristaps, Sam, Edgars, Jānis
**Thursday:** Jūlija, Dārta, Rita

### Coaches
- **Paša** - Monday, Wednesday, Thursday
- **Justīne** - Tuesday

### Skill Levels
- **Beginner** - Yellow background (#FEFFC4)
- **Regular** - Green background (#E8F0FF)  
- **Mixed** - Combined sessions

## 💾 Data Storage
- **Method:** localStorage (browser-based)
- **Structure:** appData object with players, schedules, clubWallMessages
- **Persistence:** Auto-save on changes
- **Limitation:** Data stored locally per device

## 🔧 Technical Details

### Technology Stack
- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks)
- **Hosting:** GitHub Pages
- **Domain:** Custom domain via DNS
- **Storage:** Browser localStorage
- **Server:** Python HTTP server for local development

### Local Development
```bash
cd /Users/ricardskrizanovskis/matchpoint-tennis-github
python3 -m http.server 3000
# Access at http://localhost:3000
```

### Git Workflow
```bash
git add .
git commit -m "Description of changes"
git push origin main
# Automatically deploys to GitHub Pages
```

## 🎯 Current Status & Next Steps

### Completed Features
✅ Complete tennis club scheduling system
✅ Mobile-responsive design
✅ GitHub Pages deployment
✅ Custom domain configuration (DNS processing)
✅ Security improvements (password removed from README)
✅ Club wall messaging system
✅ Admin panel with player management

### DNS Status
🟡 **In Progress:** DNS records added to nic.lv, waiting for propagation
🟡 **Timeline:** 24-48 hours for full global DNS propagation
🟡 **Next:** Enable HTTPS once GitHub recognizes custom domain

### Future Considerations
- Database migration (from localStorage to cloud storage)
- User authentication system
- Attendance tracking
- Payment integration
- Tournament management

## 🐛 Known Issues & Solutions

### Browser Compatibility
- **Custom cursors:** Work in modern browsers
- **localStorage:** Supported in all modern browsers
- **Mobile gestures:** Touch events for swipe navigation

### Security Notes
- **Password in code:** Currently hardcoded, consider environment variables for production
- **No HTTPS locally:** Use HTTPS in production only
- **Public repository:** No sensitive data in GitHub (password removed from README)

## 📞 Contact & Usage

### For Development
- **Primary folder:** `/Users/ricardskrizanovskis/matchpoint-tennis-github/`
- **Local server:** localhost:3000
- **GitHub:** Push changes trigger automatic deployment

### For Club Members
- **Website:** https://matchpoint.lv (when DNS completes)
- **Temporary:** https://rkrizanovskis.github.io/matchpoint-tennis-club
- **Access:** Contact club administration for password

---

**Last Updated:** January 2025
**Claude Project:** Matchpoint Tennis Club Development
**Status:** Production-ready, DNS propagating