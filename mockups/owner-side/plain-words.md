# The plain-words pass: plan and handoff

Written Nov 25, 2026. **Nothing in it is built.** The owner asked for this pass after a review of version 18 through the eyes of the person they most often have to onboard. The choices below are proposals until the owner confirms them: see Decide with the owner first.

Read [HANDOFF.md](../../HANDOFF.md) first. It says how the app is put together, shipped and tested. The two drawn screens are [plain-home.html](plain-home.html) and [plain-part.html](plain-part.html), also shown with the other mockups in this folder's [index.html](index.html).

## Where the work is

- **The code:** the branch `billed-in-place` on GitHub. It holds version 18 (billed against in place), this page, the two mockups and `qa/plain-check.js`. It is not merged into `main`, so the live site is still on version 17. Merging it puts version 18 live, so ask the owner first.
- **Build the pass on a new branch cut from `billed-in-place`.** It will be version 19.

To pick it up on another computer:

```bash
git clone https://github.com/clickconstruction/costtooling.github.io.git
```

```bash
cd costtooling.github.io && git checkout billed-in-place
```

```bash
python3 -m http.server 8766 --bind 127.0.0.1
```

Then open http://127.0.0.1:8766/app/ at a phone size such as 390 × 844, and http://127.0.0.1:8766/mockups/owner-side/ for the drawings. Test it, in HANDOFF.md, says how to install Playwright for the scripts in `qa/`. A prompt for Claude Code is at the end of this page.

## Who it is for

The person who walks the job for an owner is often the owner's assistant. In the owner's experience of onboarding them, many are older, are not at home on a phone or other devices, and need every step spelled out.

The bar the owner set: **a 12-year-old could use it without help.** On every screen the assistant should see at a glance what the screen is for and what to tap next, without stopping to work out what is going on.

A quick test for any screen: cover everything but the title and the first thing under it. Can you tell what the screen is for, and what to do first?

## What gets in the way today

Reviewed on version 18 with the sample job, at iPhone size.

1. **The job list opens with something else.** A "Save your jobs to the cloud" card and three number tiles (projects, active, dollars to finish) sit above the jobs themselves. Where: `UI.projects` in `js/ui.js`, `Cloud.promoHtml` in `js/cloud.js`.
2. **A job opens on numbers, not on what to do.** Four tiles of three lines each, then four buttons in a two-by-two grid, two dark and two light, with no order to follow. Where: `UI.home`.
3. **The words are a builder's.** Line item, earned value, forecast, schedule used, contract, site log, entry. Version 18 added two more: in place, and billed to date.
4. **One thing has several names.** The Progress tab is also "Update progress" on the home screen and "all items" on its card. Photos live under the Log tab, on a screen called Site log, behind a button called Add photo and a form called New entry.
5. **The percent asks for a builder's judgement.** "What percent complete is Framing?" is hard to answer by looking. The slider moves in steps of 5, and the 0% to 100% buttons under it are 34 px tall.
6. **The bill step assumes they can read a contractor's bill.** "Type the percent complete the latest bill shows" does not say which column that is. The Bill list is the middle choice of a three-way switch inside Progress, where it is easy to miss.
7. **Saving one photo shows seven things at once:** the photo, the line item, a note, the weather, the temperature, how many were on site, and the date. Where: `UI.entryform`.
8. **Many doors look alike.** Five tabs, two of which, Cover and Report, are both things to send. The share sheet offers four ways to send. The top-corner buttons are icons with no words, and the yellow one (a pencil, a plus or a share arrow, depending on the screen) has no label for a screen reader. Help is hard to find: Show me around and How do I… are in small print at the bottom of the bulb's ideas form, and the bulb floats over the content of most screens.
9. **Small print, small targets, quick messages.** Measured below. The "Saved" message disappears after 1.8 seconds (`toast` in `js/app.js`).

The baseline, from `qa/plain-check.js` on Nov 25, 2026: version 18, the sample job, iPhone size. A count is every element on the whole screen, scrolled into view or not.

| Screen | Text under 14 px | Smallest text | Targets under 48 px | Smallest target |
| --- | --- | --- | --- | --- |
| Job list | 10 | 11 px | 6 | 34 px |
| Welcome card | 0 | none | 0 | none |
| Job home | 35 | 9 px | 6 | 17 px |
| Log | 82 | 10.5 px | 13 | 35 px |
| New entry | 20 | 10.5 px | 11 | 36 px |
| Photo | 15 | 10.5 px | 3 | 36 px |
| Cover page | 20 | 10.5 px | 10 | 36 px |
| Progress | 95 | 10.5 px | 76 | 34 px |
| Bill | 26 | 10.5 px | 15 | 36 px |
| Line item | 54 | 10.5 px | 23 | 34 px |
| Report | 68 | 10 px | 2 | 36 px |
| Share sheet | 4 | 11 px | 0 | none |
| Bulb sheet | 10 | 12 px | 10 | 17 px |

The smallest text is the schedule's month labels (9 px), the report's number labels (10 px) and the tab labels (10.5 px). The smallest targets are text links such as "see log ›" and "Enter a new bill ›", and the help links in the bulb sheet, all 17 px tall.

## What already works

- No account and nothing to install.
- The sample job to practise on, and Show me around, which walks the real app.
- The guide's "Look for this" photos: a picture of the exact button, then one short sentence. That is the model for this whole pass.
- The welcome card's three lines are already plain.

## The plan, in order

Each step says where the change goes and what done looks like. Steps 1, 3 and 7 are drawn in the mockups.

1. **Make a job's first screen a short list of steps.** One plain sentence where the four tiles are ("About a third of the work is done."), the bill warning in words when there is one, then four numbered steps in the order of a site visit: Take photos, Mark what you saw, Type in the bill, Send the owner one page, each with one line on where it stands. Drawn in `plain-home.html`. Where: `UI.home` in `js/ui.js`. Done when the home screen reads top to bottom as what to do, and the numbers are one tap away instead of first.
2. **Use one plain name per thing, everywhere.** Apply the word list below in the app, the tour, the guide, the share sheet and the email, and line up the landing page with it. The welcome card takes the words drawn in `welcome.html`, with the tagline under the name (ideas 6 and 8 in README.md). Where: `js/ui.js`; `js/app.js` (the screen titles in `titles()`, `SCREEN_NAMES`, toasts, confirm texts and the email); `js/tour.js`; `js/cover.js` (the words on the images); `app/index.html` (tabs, welcome card, share and bulb sheets); `js/cloud.js` (sign-in screens); `guide/index.html`; `index.html`. Done when each thing has one name on every screen and none of the words in finding 3 is left on the assistant's screens.
3. **Mark each part with words.** "How far along is it?" with five buttons (Not started, Just started, About half, Nearly done, Done), and the exact percent one tap away for anyone who wants it. A stored percent shows as the word for its range, so the sample's 85% reads Nearly done and nothing stored changes. Drawn in `plain-part.html`. Where: `slider()` and `UI.item` in `js/ui.js`, `App.setPct` in `js/app.js`. Done when the slider is no longer the first thing on a part, and old jobs show the right word for the percent they hold.
4. **Give the bill its own door and spell it out.** A Bill tab (step 7). On it, a picture of a sample contractor's bill with the column to copy circled, then the list. Most pay applications use the AIA G703 form or a copy of it, where the column is "% (G ÷ C)" beside "total completed and stored to date". That figure counts materials stored on site but not yet installed, which can show up as billed more than you saw; the caption should say so. Where: `sovBillHtml` in `js/ui.js`, with the picture as a new file in `guide/` or drawn in HTML. Done when someone who has never read a bill can find the column and type it in.
5. **Cut the photo form to three things:** the photo, which part, and a note. The weather, temperature, people on site and date fold under "More details". Where: `UI.entryform`. Done when a photo with a part is saved in three taps after the camera.
6. **Raise the floor on size.** Nothing that carries meaning under 14 px. Every tap target at least 48 px. Words on the top-corner buttons (‹ Jobs, Help). A Help button on every screen that opens Show me around and the guide, in place of the links hidden in the bulb sheet. Messages such as "Saved" stay until tapped, or for at least 5 seconds. Where: `css/app.css` first, then the inline styles in `js/ui.js`. Done when `qa/plain-check.js` shows no text under 14 px and no target under 48 px on the assistant's screens. The report preview, which is the owner's page, may stay an exception if the owner agrees.
7. **Rename the tabs for what they do:** Home, Photos, Parts, Bill, Send. Send takes in today's Cover and Report tabs: the page for the owner, with "a picture to text" as one of its choices. Drawn in both mockups. Where: `.tabs` in `app/index.html`; `TABOF`, `PARENT` and `ROOTS` in `js/app.js`. Done when there are five tabs, each a word for something to do, and old links such as `?s=cover` and `?s=report` still open the right screen.

Then, as with every release: the tour (`js/tour.js`) and the guide (`guide/index.html`) use the new words; `qa/guide-shots.js` retakes the guide photos; `qa/walkthrough.js` passes; the version goes to 19 in the three places HANDOFF.md lists; and HANDOFF.md and this page say what is built.

## The word list

Proposed, not yet confirmed by the owner. Only the words on screen change. The names in the data (`items`, `pct`, `billed`) and in the code stay as they are, so stored and synced jobs need nothing.

| Today | Proposed | Where it shows today |
| --- | --- | --- |
| Line item | Part of the job, or part | Progress, the line item screen, the photo form, the log, the tour, the guide, the report table |
| Progress (tab), Update progress, all items | Parts (tab), Mark what you saw | Tab bar, home buttons and cards |
| Log (tab), Site log, New entry, Save entry, entries | Photos (tab), Add a photo, Save, photos | Tab bar, log screen, photo form, day headers |
| in place, complete (earned value) | what you saw, done | Home tiles, line item, report |
| billed to date | what the bill says | Line item, Bill list |
| billed ahead of the work | billed more than you saw | Home, line item, report |
| cost so far, to finish (forecast), contract | Off the assistant's screens (see decision 4) | Home tiles of a job with no bill, the Progress summary |
| 33% of schedule used · ahead | Day 35 of 103, or nothing | Home tile |
| Cover page, Report, Share report | Send, owner update | Tabs, home buttons, share sheet, the images |

The landing page already says "part of the job" three times and "line item" twice. Make it one word there too, the same as the app.

## What stays the same

- **The page the owner reads keeps its numbers.** Only the assistant's side gets simpler. The owner update may change its words; it does not lose its numbers.
- **The data:** no new field, no change to stored jobs and no database change. Jobs saved by versions 17 and 18 open and draw as they do now, apart from the words.
- **The sample job's numbers:** 36% in place, 38% billed, and $3,420 billed ahead on Framing at 85%. The landing page quotes them.
- **The script at the top of `index.html`** that passes old links on to `/app/`.
- **The address-bar switches** (`?s=cover`, `?s=report`, `?s=sov`, `?s=log`), which emailed and bookmarked links use.

## Decide with the owner first

1. **The words.** Confirm or change the word list. The contractor's bill will still say "item" or "line"; decide whether a part shows the bill's own name for its line.
2. **The tabs.** This plan proposes Home, Photos, Parts, Bill, Send. The owner's side mockups in this folder drew Home, Log, Parts, Bills, Owner update. Pick one set.
3. **The five words for how far along a part is, and what each stores.** Proposed: tapping Not started stores 0%, Just started 10%, About half 50%, Nearly done 90% and Done 100%; for display, 1 to 34% reads Just started, 35 to 65% About half and 66 to 99% Nearly done. Tapping Nearly done on the sample's Framing would store 90% and change the $3,420 the landing page quotes, so the sample keeps its exact 85%.
4. **The builder's numbers.** Cost so far and to finish still lead the home screen of a job with no bill. Keep them for builders behind a switch, keep them only on the Parts tab, or take them off the assistant's screens.
5. **The Cover page.** Fold it into Send as "a picture to text", or keep it as a place of its own.
6. **The Help button.** It is in both mockups but was not in the review the owner read. It replaces the help links in the bulb sheet.
7. **Setting up a job.** Parts, budgets and dates are builder's work. Decide whether someone sets the job up for the assistant, or the assistant waits for pasting the lines from the contractor's bill (`paste.html`, the piece after this one).

## How to check it

- **`qa/plain-check.js`** measures text and tap target sizes on every main screen of the sample job. Run it before and after; the target is in step 6.
- **`qa/walkthrough.js`** finds buttons by their words, so it breaks where the words change. Today it taps: Save entry, Cancel, Edit, New project, Create project, Move to…, Use on cover, Save to Photos, Type my own, From progress, 2 × 2, Schedule, Add cost, Save changes, Add line item, Share, Save image, Must have, Save idea, Back up my data, Start over, Delete this project, New garage / ADU and Blank. It checks that screens contain: cost so far, complete (earned value), in place, billed, billed ahead of the work, Check before you pay, Billed to date, In place, Billed, Enter the bill and That's the whole app. Change those in the same commit as the words, and add steps for the new home screen and the word buttons.
- **`qa/guide-shots.js` and `js/tour.js`** point at elements by id and class, such as `#homeBody .actions .btn`, `#homeBody .kpis` and `#modeSeg`. A new home screen moves those targets.
- **Someone who has never seen the app.** Hand them the phone on the sample job with three tasks: add a photo to Framing; mark Roofing as about half done; say which part the contractor billed too much for. Do not help. Note every place they stop or ask. This is the test that matters; the scripts only check the floor.
- **A real iPhone,** in Safari and as a home-screen app, with `qa/ios-checklist.md`.

## What design alone will not fix

- **Setting up a job** is builder's work: parts, budgets and dates. See decision 7.
- **Knowing what to look for.** Word buttons make the judgement easier, not right. "What to look for" hints per part (idea 16 in [README.md](README.md)) are what would make the assistant right.

## Picking this up with Claude Code

Paste this after cloning the repo:

```text
I'm picking up the plain-words pass for CostTooling, a phone-first web app at costtooling.com. This folder is its repo.

First run: git checkout billed-in-place

Read HANDOFF.md, then mockups/owner-side/plain-words.md, and look at mockups/owner-side/plain-home.html and plain-part.html.

Then tell me, briefly:
1. Where the app stands, and what is on the branch that is not live yet.
2. What the plain-words pass changes, in order.
3. Which of the decisions under "Decide with the owner first" you need from me before you start.

Do not change anything until I answer. Keep these rules for the whole session:
- The repo is public and every committed file is served on the site. Never commit names, emails, keys or customer data.
- The database and account functions live in the charitytooling repo. One live Supabase project serves two apps with no staging copy, so make no database change without asking me. This pass should not need one.
- One real company syncs a real job. Old jobs must keep working, and nothing may rewrite or drop stored data.
- Work on a new branch cut from billed-in-place. A push to main deploys to the live site in about a minute, so ask me before anything goes to main.
- Bump the version as HANDOFF.md says when a script or stylesheet changes.
- Keep HANDOFF.md and mockups/owner-side/plain-words.md current when a fact in them changes.
```
