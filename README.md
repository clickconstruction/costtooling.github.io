# costtooling.github.io

Source for https://costtooling.com (GitHub Pages).

**Status: prototype.** The site root is a clickable, phone-first prototype of CostTooling driven by one sample project. Nothing is persisted beyond the visitor's own device; the yellow bulb collects feature requests and emails them.

- `index.html` — the prototype (single file, no build step, no dependencies)
- `mockups/` — storyboard of every screen as PNG, captured with headless Chrome
- `icons/`, `manifest.webmanifest` — home-screen install
- `.claude/launch.json` — local static server for previewing

Useful URLs: `/?for=Diane` personalises the welcome card; `/?s=cover` opens a screen directly (`projects`, `newproj`, `home`, `log`, `photo`, `cover`, `sov`, `item`, `report`); `/?welcome=1` re-shows the welcome card.
