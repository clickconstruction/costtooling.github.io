# iOS checklist

Run on the iPhone simulator (or a real phone) in two launch modes: Safari tab, and Add to Home Screen. Mark each line pass/fail per mode. Expected result in the right column. The words are version 19's: Home, Photos, Parts, Bill and Send are the tabs; a part's screen is reached from Parts; Help is the yellow button at the top of every screen.

| # | Screen · action | Expect | Tab | Home |
|---|---|---|---|---|
| 1 | First open with `?for=Name` | Welcome card with the name; Let's go closes it | | |
| 2 | Job list · tap the sample job | The job opens on its four steps; the tap shows a pressed state | | |
| 3 | Job list · Start a new job · fill in · pick a list of parts · Create this job | Home for the new job; parts from the list; the total price split across the parts' budgets | | |
| 4 | Home · each of the four numbered steps | Add a photo / Parts / Bill / Send | | |
| 5 | Home · a Latest photos thumbnail | Photo screen | | |
| 6 | Home · the amber notice (See which part) | Opens the part billed more than you saw; with several such parts it opens Bill | | |
| 7 | Home · The numbers · See the schedule | The numbers open in place; See the schedule opens Parts on Schedule (one render) | | |
| 8 | Photos · Add a photo · Take a photo | iOS camera opens; photo lands in the form | | |
| 9 | Photos · Add a photo · Pick photos · pick 3 | "Importing n of 3…", thumbnails appear, Save disabled until done | | |
| 10 | Add a photo · type a note · More details · tap weather · temperature · people on site · date | More details opens in place; no focus loss; keyboard stays; header stays put | | |
| 11 | Add a photo · reload the page mid-way | Form restored with photos and note | | |
| 12 | Add a photo · remove a photo (×) | Thumbnail gone; 48 px target | | |
| 13 | Add a photo · Save | Message stays about 5 seconds; lands on the part's screen, or on Photos when no part was picked; several photos saved together show a +n badge | | |
| 14 | Add a photo · Cancel | Returns to the screen it was opened from (Home, Photos, a part or a photo); nothing saved; imported photos removed | | |
| 15 | Photos · Show photos of | Every part is in the list with its photo count; photos and day headers filter in place; a part with none offers Add a photo of it | | |
| 16 | Photos · tap a photo | Photo screen; strip thumbnails switch the big image in place | | |
| 17 | Photo · Change this photo | Form prefilled; Save updates | | |
| 18 | Photo · Delete this photo | Confirm sheet; photo gone; returns to where the photo was opened from (Photos or a part) | | |
| 19 | Photo · Use it in the picture to text | A picture to text opens with that photo first | | |
| 20 | Send · Make a picture to text instead · pick / unpick photos | A picture to text opens; Back reads Send; selection toggles; the picture redraws without blanking | | |
| 21 | A picture to text · How many photos | One / Three / Four, empty slots filled with the latest photos | | |
| 22 | A picture to text · type Words at the top / A note at the bottom | The picture updates after a pause; no focus loss | | |
| 23 | A picture to text · Type my own · edit numbers | Numbers band updates; no focus loss | | |
| 24 | A picture to text · Save it to my photos | iOS share sheet on first tap; Save Image works | | |
| 25 | A picture to text · Send this picture | Send sheet with four rows; Text it or send it opens the iOS share sheet | | |
| 26 | Part · tap a word (About half) | The word turns dark at once; message "Saved: about half"; no screen rebuild; the sentence about the bill follows | | |
| 27 | Part · Type an exact percent · type 85 · tap away | The box opens in place with the number keyboard; "Saved: 85% done"; Nearly done shows 85%; a number outside 0 to 100 is refused | | |
| 28 | Part · scroll with a finger starting on a word button | Page scrolls, nothing is marked; tapping the word already dark changes nothing | | |
| 29 | Parts · Schedule | Schedule with a today line; When it will finish | | |
| 30 | Parts · Add a part | Part appears in the list | | |
| 31 | Parts · tap a part | Its screen opens on How far along is it?; Back reads Parts; the list shows the new word on return | | |
| 32 | Part · Costs · Add cost | Row appears, total updates, inputs cleared (in a job with a bill, open Costs first) | | |
| 33 | Part · remove cost (×) | Confirm sheet; row gone | | |
| 34 | Part · Change the name, budget or dates · rename · Save | Name updated everywhere | | |
| 35 | Part · Delete this part | Confirm; gone; its photos stay under Photos with no part picked | | |
| 36 | Send · open | Owner update numbers match The numbers on Home; latest photos present | | |
| 37 | Send · Send it to the owner · Text it or send it | iOS share sheet on first tap with the owner update JPEG | | |
| 38 | Send · Send it to the owner · Save it as a picture | Share sheet (Save Image) on iOS | | |
| 39 | Send · Print it | Print preview shows the full owner update | | |
| 40 | Send · Send it to the owner · Email the numbers | Mail compose with the numbers | | |
| 41 | Bulb · Save idea · Email all ideas | Mail compose with ideas and diagnostics | | |
| 42 | Help · More · Back up my data | Share sheet with the JSON file | | |
| 43 | Help · More · Start over | Confirm; sample job back; ideas cleared | | |
| 44 | Home · Change this job's name or dates · change · Save | Header and job list updated | | |
| 45 | Change this job · Delete this job | Confirm; back to the job list; photos removed | | |
| 46 | Job list · Bring back the sample job | Sample job returns | | |
| 47 | Any screen · Help · Tell us what is confusing, with keyboard | Help is the yellow button at the top of every screen; the idea sheet sits above the keyboard; buttons reachable | | |
| 48 | Any form · keyboard open then closed | Header back at the top; no blank band | | |
| 49 | Rotate to landscape and back | Layout intact | | |
| 50 | Background the app 2 minutes, return | Photos still load (IndexedDB reconnect) | | |
| 51 | Airplane mode, reopen | (Wave 4) app opens from cache | | |
| 52 | Home-screen install | Icon, standalone, status bar OK, safe areas respected | | |
| 53 | Part · Photos and notes | Photos grouped Day 1, Day 2… newest day first, each with note and weather; Add a photo of <part> opens Add a photo with the part already picked; + Add to this day keeps that date | | |
| 54 | Photo · Move it to another part | Sheet lists every part with its photo count, the current one marked here now; tapping one moves the photo, message, photo screen shows the new part | | |
| 55 | Photo · Move it to another part · Just this photo | On a save with 2+ photos: that photo moves on its own to the new part; the note and other photos stay | | |
| 56 | Add a photo · Save with a part picked | Lands on that part's screen with the photo outlined; message "Saved under X · Day N" | | |
| 57 | Back from a part or a photo | The Back button names where it goes (Home, Parts, Photos) and returns to the screen that opened it; after Save, Back from the part returns to where Add a photo was tapped; a tab tap resets this | | |
| 58 | Bill · type a percent for a part · tap away | Decimal keyboard; the figure stays with a % sign; a part billed past what you marked reads The bill says more than you saw, with the dollars, in amber; The whole bill row follows | | |
| 59 | Part · The bill says · type an amount · tap away | The percent fills in; the amber sentence under it sets the bill beside the word you marked; clearing the box reads from the contractor's bill and the sentence goes | | |
| 60 | Home, Send and A picture to text of a job with a bill | Home: the amber notice gives the dollars billed more than you saw; The numbers: done, what the bill says, billed more than you saw, days left; the owner update names each part billed more than you saw; the picture shows the same four numbers. A job with no bill shows no notice, and its owner update shows cost so far and to finish as before | | |
