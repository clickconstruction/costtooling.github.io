# iOS checklist

Run on the iPhone simulator (or a real phone) in two launch modes: Safari tab, and Add to Home Screen. Mark each line pass/fail per mode. Expected result in the right column.

| # | Screen · action | Expect | Tab | Home |
|---|---|---|---|---|
| 1 | First open with `?for=Name` | Welcome card with the name; Let's go closes it | | |
| 2 | Projects · tap sample card | Project home opens; tap shows a pressed state | | |
| 3 | Projects · New project · fill · pick template · Create | Home for the new project; line items from the template; contract split | | |
| 4 | Home · each of the four action buttons | Entry form / Cover / Progress / share sheet | | |
| 5 | Home · latest photo thumbnail | Photo detail | | |
| 6 | Home · In progress row | Line item screen | | |
| 7 | Home · Schedule card | Progress in Schedule mode (one render) | | |
| 8 | Log · + · Camera | iOS camera opens; photo lands in the form | | |
| 9 | Log · + · Photos · pick 3 | "Importing n of 3…", thumbnails appear, Save disabled until done | | |
| 10 | Entry form · type note · tap weather · temp · crew · date | No focus loss; keyboard stays; header stays put | | |
| 11 | Entry form · reload the page mid-entry | Form restored with photos and note | | |
| 12 | Entry form · remove a photo (×) | Thumbnail gone; 44 pt target | | |
| 13 | Entry form · Save | Toast; lands in the line item's folder, or the log when untagged; the entry shows a +n badge | | |
| 14 | Entry form · Cancel | Returns to the screen it was opened from (Home, log, folder or photo); nothing saved; imported photos removed | | |
| 15 | Log · filter chips | Every line item has a chip with its count; entries and day headers filter in place; an empty item offers Add a photo to it | | |
| 16 | Log · tap entry | Photo detail; strip thumbnails switch the big image in place | | |
| 17 | Photo · Edit | Form prefilled; Save updates | | |
| 18 | Photo · Delete entry | Confirm sheet; entry gone; returns to where the photo was opened from (log or folder) | | |
| 19 | Photo · Use on cover | Cover opens with that photo first | | |
| 20 | Cover · pick / unpick photos | Selection toggles; canvas redraws without blanking | | |
| 21 | Cover · layouts | One big / 2×2 / Big + 2, empty slots filled with latest | | |
| 22 | Cover · type headline / note | Canvas updates after a pause; no focus loss | | |
| 23 | Cover · Type my own · edit numbers | Numbers band updates; no focus loss | | |
| 24 | Cover · Save to Photos | iOS share sheet on first tap; Save Image works | | |
| 25 | Cover · Share | Share sheet options; Share… opens iOS sheet | | |
| 26 | Progress · drag slider | Label and track live; no list rebuild; summary updates on release | | |
| 27 | Progress · quick chips | Same, in place | | |
| 28 | Progress · vertical scroll starting on a thumb | Page scrolls, value unchanged | | |
| 29 | Progress · Schedule toggle | Gantt with today line; forecast | | |
| 30 | Progress · + · add line item | Item appears; Progress list updated | | |
| 31 | Line item · slider | KPIs update in place | | |
| 32 | Line item · add cost | Row appears, totals and KPIs update, inputs cleared | | |
| 33 | Line item · remove cost (×) | Confirm sheet; row gone | | |
| 34 | Line item · Edit (pencil) · rename · Save | Name updated everywhere | | |
| 35 | Line item · Delete | Confirm; gone; tagged photos keep their entry | | |
| 36 | Report · open | Numbers match Home; recent photos present | | |
| 37 | Report · Share · Share… | iOS share sheet on first tap with the report JPEG | | |
| 38 | Report · Save image | Share sheet (Save Image) on iOS | | |
| 39 | Report · Print / PDF | Print preview shows the full report | | |
| 40 | Report · Email | Mail compose with the summary | | |
| 41 | Bulb · save idea · Email all ideas | Mail compose with ideas and diagnostics | | |
| 42 | Bulb · Back up my data | Share sheet with the JSON file | | |
| 43 | Bulb · Start over | Confirm; sample job back; ideas cleared | | |
| 44 | Project · Edit (pencil) · change · Save | Header and Projects list updated | | |
| 45 | Project · Delete | Confirm; back to Projects; photos removed | | |
| 46 | Projects · Bring back the sample job | Sample job returns | | |
| 47 | Any screen · idea sheet with keyboard | Sheet above the keyboard; buttons reachable | | |
| 48 | Any form · keyboard open then closed | Header back at the top; no blank band | | |
| 49 | Rotate to landscape and back | Layout intact | | |
| 50 | Background the app 2 minutes, return | Photos still load (IndexedDB reconnect) | | |
| 51 | Airplane mode, reopen | (Wave 4) app opens from cache | | |
| 52 | Home-screen install | Icon, standalone, status bar OK, safe areas respected | | |
| 53 | Line item · Photos and notes | Entries grouped Day 1, Day 2… newest day first, each with note and conditions; Add a photo to <item> opens New entry already tagged; + Add to this day keeps that date | | |
| 54 | Photo · Move to… | Sheet lists every line item with its photo count, the current one marked here now; tapping one moves the entry, toast, photo screen shows the new line item | | |
| 55 | Photo · Move to… · Just this photo | On an entry with 2+ photos: that photo becomes its own entry under the new line item; the note and other photos stay | | |
| 56 | Entry form · Save with a line item | Lands in that line item's folder with the entry outlined; toast "Saved under X · Day N" | | |
| 57 | Back from a folder or a photo | Returns to the screen that opened it: Home, Progress, the log or the folder; after Save, Back from the folder returns to where Add photo was tapped; a tab tap resets this | | |
