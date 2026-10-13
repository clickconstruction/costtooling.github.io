# iOS findings log

Observed on the iPhone 17 Pro simulator (iOS Safari), live site. Newest wave first.

## Wave 0 — reproduce (2026-10-13)

| # | Screen · action | Observed | Status |
|---|---|---|---|
| 1 | Projects · first load (live) | Welcome card did not appear on first open with `?for=`; appeared on the local build. Likely stale `ct-welcomed` from an earlier visit. Watch. | open |
| 2 | Entry form | Date field overflows the card's right edge and is taller than Temp / On site (iOS date input min-width; `1fr` grid). | Wave 1 |
| 3 | Entry form · tap Note | iOS pans the whole fixed app up ~170 pt while the keyboard is open; header off-screen. Restores on keyboard close in the simulator. | Wave 1 |
| 4 | Progress · slider | Native thumb is small and white-on-light; drag works, numbers update; full list re-render on release (6 ms here). | Wave 1 (thumb, in-place update) |
| 5 | All screens | No pressed state on tap before the touch listener was added; now `:active` can apply. | Wave 1 |
| 6 | Home, Progress | Render times 6–14 ms on the simulator; not the bottleneck. Thumbnail re-creation + fade on each re-render is the visible flicker. | Wave 1 |

## Wave 1 — reactivity, touch, layout (2026-10-13)

Verified on the simulator against the local build:
- Progress: quick-set chip and slider update the label, track, chips, status and summary in place; no screen rebuild (render counter unchanged).
- Idea sheet with keyboard open: sheet sits above the keyboard (`--kb` from visualViewport), app frame does not pan.
- Pressed states now apply on iOS (touchstart listener + `:active` styles).
- Photos: sample thumbnails served as cached data URLs, real ones set `src` synchronously when cached; no fade on re-render.
- Cover: images load before painting; stale renders dropped; decoded images cached.

## Wave 2 — photos, storage, sharing (2026-10-13)

Verified on the simulator against the local build:
- Draft restore: typed a note, reloaded the page, entry form came back with the note ("Picked up where you left off").
- Photo Library import of two photos through the iOS picker: both imported, oriented correctly, draft intact; Save/Cancel locked during import.
- Entry saved from the form with both photos (+1 badge in the log).
- Cover page: real imported photo rendered on the canvas; Save to Photos opened the iOS share sheet on the first tap with a 575 KB JPEG and a Save Image option.
- Report · Share · Share…: iOS share sheet on the first tap with a 378 KB JPEG (blob pre-built when the Report screen opened).
- WebKit (Playwright) cannot store Blobs in IndexedDB ("Error preparing Blob/File data"); photos are now stored as ArrayBuffers and wrapped on read. Found by the WebKit walkthrough, not visible on the simulator.
- Boot-time crash fixed: restoring a draft with a photo attached referenced the controller before it existed; the screen never switched. Boot now runs after the controller is defined and photo hydration no longer reaches into it.
