# costtooling.github.io

Source for https://costtooling.com (GitHub Pages).

**Status: functional mock-up.** The site root is a working, phone-first app with no backend. Projects, line items, costs, log entries and photos are stored on the device (localStorage + IndexedDB). A sample job is included. The yellow bulb collects feature requests and emails them.

- `index.html` — app shell; `css/app.css`; `js/db.js` (storage), `js/photos.js` (import, downscale, sample photos), `js/data.js` (model, sample job, templates, calc), `js/cover.js` (cover + report canvas renderers, sharing), `js/ui.js` (screens), `js/app.js` (state, navigation, actions). No build step, no dependencies.
- `mockups/` — storyboard of every screen as PNG, captured with headless Chrome
- `icons/`, `manifest.webmanifest` — home-screen install
- `.claude/launch.json` — local static server for previewing

Useful URLs: `/?for=Diane` personalises the welcome card; `/?s=cover` opens a screen directly (`projects`, `projform`, `home`, `log`, `entryform` via `log&new=1`, `photo`, `cover`, `sov`, `item`, `itemform`, `report`); `/?welcome=1` re-shows the welcome card; `/?shot=1` pins the layout to 390×844 for screenshots.

Regenerate the storyboard with headless Chrome against a local static server (see `.claude/launch.json`); each `mockups/screens/*.png` is one `?shot=1&…` URL.
