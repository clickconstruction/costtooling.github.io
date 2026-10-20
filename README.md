# costtooling.github.io

Source for https://costtooling.com (GitHub Pages).

**Taking over?** Start with [HANDOFF.md](HANDOFF.md): where every piece lives (the database is in another repo), how to run, ship and test the app, and what is open.

**Status: functional mock-up.** The site root is a working, phone-first app with no backend. Projects, line items, costs, log entries and photos are stored on the device (localStorage + IndexedDB). A sample job is included. The yellow bulb collects feature requests and emails them.

- `index.html` — app shell; `css/app.css`; `js/db.js` (storage), `js/photos.js` (import, downscale, sample photos), `js/data.js` (model, sample job, templates, calc), `js/cover.js` (cover + report canvas renderers, sharing), `js/ui.js` (screens), `js/tour.js` (Show me around: the guided tour over the sample job), `js/app.js` (state, navigation, actions). No build step, no dependencies.
- `mockups/` — storyboard of every screen as PNG, captured with headless Chrome
- `icons/`, `manifest.webmanifest` — home-screen install
- **Show me around** — the welcome card's first button (also in the bulb menu, and `/?tour=1`) walks a first-timer through the real app over the sample job: a mask with one bright hole moves from the job card to the numbers, Add photo, the log, a progress slider, the cover page, the report, the share button and, when the cloud is on, Sign in. Tap the mask, swipe or press Next; nothing it does changes the user's data.
- `guide/` — plain-English step guide with a photo of every button (your first day, adding people, passwords); linked from the bulb menu. `qa/guide-shots.js` regenerates the first-day photos against a local server.
- `.claude/launch.json` — local static server for previewing

Useful URLs: `/?for=Diane` personalises the welcome card; `/?s=cover` opens a screen directly (`projects`, `projform`, `home`, `log`, `entryform` via `log&new=1`, `photo`, `cover`, `sov`, `item`, `itemform`, `report`); `/?welcome=1` re-shows the welcome card; `/?tour=1` starts Show me around; `/?shot=1` pins the layout to 390×844 for screenshots.

Regenerate the storyboard with headless Chrome against a local static server (see `.claude/launch.json`); each `mockups/screens/*.png` is one `?shot=1&…` URL.
