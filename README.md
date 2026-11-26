# costtooling.github.io

Source for https://costtooling.com (GitHub Pages).

**Taking over?** Start with [HANDOFF.md](HANDOFF.md): where every piece lives (the database is in another repo), how to run, ship and test the app, and what is open.

**Status: functional mock-up.** The front page is a landing page; the app, at `/app/`, is a working, phone-first app. Jobs, their parts, what the contractor billed, costs, notes and photos are stored on the device (localStorage + IndexedDB). A sample job is included. Tell us what is confusing, under Help, collects ideas and emails them.

- `index.html` — the landing page, which also passes old links and home-screen apps on to `/app/`
- `app/index.html` — app shell; `css/app.css`; `js/db.js` (storage), `js/photos.js` (import, downscale, sample photos), `js/data.js` (model, sample job, templates, calc), `js/cover.js` (cover + report canvas renderers, sharing), `js/ui.js` (screens), `js/tour.js` (Show me around: the guided tour over the sample job), `js/app.js` (state, navigation, actions). No build step, no dependencies.
- `mockups/` — storyboard of every screen as PNG, captured with headless Chrome
- `mockups/owner-side/` — the next direction, drawn Nov 25, 2026: plain HTML mockups (`index.html`) and the plan (`README.md`). Billed against in place is built (version 18), and so is the plain-words pass for the owner's assistant (version 19; `plain-words.md` there says what was planned, what was built and what differs); pasting a job's lines from the bill is not built; the landing page draft is live as the front page
- `icons/`, `manifest.webmanifest` — home-screen install
- **Show me around** — the welcome card's first button (also under the Help button on every screen, and `/app/?tour=1`) walks a first-timer through the real app over the sample job: a mask with one bright hole moves from the job card to the sentence on how the job is going, the bill warning, the four steps, the photos, the list of parts, the bill, the owner update, its send button and, when the cloud is on, Sign in. Tap the mask, swipe or press Next; nothing it does changes the user's data.
- `guide/` — plain-English step guide with a photo of every button (your first day, adding people, passwords); linked from the Help button. `qa/guide-shots.js` regenerates the first-day photos against a local server.
- `.claude/launch.json` — local static server for previewing

Useful URLs: `/app/?for=Diane` personalises the welcome card; `/app/?s=cover` opens a screen directly (`projects`, `projform`, `home`, `log` (Photos), `entryform` via `log&new=1`, `photo`, `sov` (Parts), `bill`, `item`, `itemform`, `report` (Send), `cover` (the picture to text)); `/app/?welcome=1` re-shows the welcome card; `/app/?tour=1` starts Show me around; `/app/?shot=1` pins the layout to 390×844 for screenshots. The same switches on the front page are passed on to the app.

Regenerate the storyboard with headless Chrome against a local static server (see `.claude/launch.json`); each `mockups/screens/*.png` is one `?shot=1&…` URL.
