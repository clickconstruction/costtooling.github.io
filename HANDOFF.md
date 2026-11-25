# CostTooling handoff

Written Oct 20, 2026, for whoever takes over CostTooling next. When a fact here changes, fix the sentence that holds it.

CostTooling is a phone-first web app for tracking a construction job from the site: photos, progress, what the contractor billed against what is in place, costs and a one-page report. It is plain HTML, CSS and JavaScript with no build step, hosted on GitHub Pages at costtooling.com. It works on one phone with no account, and signing in syncs jobs to a Supabase project shared with CharityTooling.

It is a working prototype, built between Oct 12 and Oct 22, 2026. The last two changes made each line item a folder of its photos and notes by day, with Move to… on a photo, after a tester asked to see Day 1, Day 2 under a line item and to move photos between line items, and made Back return to the screen you came from. The open work below was last reviewed Nov 25, 2026. A direction for what comes next was chosen on Nov 25: see Where it is going. The same day its landing page went live on the front page of costtooling.com, ahead of the features it describes, and the app moved to costtooling.com/app. Version 18, also Nov 25, is the first piece of that direction: billed against in place.

## Where everything lives

The app is one repo, but its database and account functions live in the CharityTooling repo. Read `docs/multi-app-tenancy.md` there before any database change.

| Piece | Where | Access |
| --- | --- | --- |
| App code | [clickconstruction/costtooling.github.io](https://github.com/clickconstruction/costtooling.github.io), public, branch `main`, no branch protection | Owner adds you as a collaborator |
| Live site | [costtooling.com](https://costtooling.com) on GitHub Pages, HTTPS enforced. The front page is the landing page; the app is at [costtooling.com/app](https://costtooling.com/app/) | Deploys itself on every push to `main` |
| Domain and DNS | Cloudflare. The bare domain points at GitHub Pages; `www` is a CNAME to clickconstruction.github.io | Owner's Cloudflare account |
| Cloud backend | Supabase project `cjwybuhogxyayjnuxpem` ("charity-tooling"), shared with CharityTooling | Owner's Supabase organization |
| Database migrations and account functions | [charitytooling/charitytooling.github.io](https://github.com/charitytooling/charitytooling.github.io): `supabase/migrations/20261013010000_costtooling_tenancy.sql`, the shared Edge Functions, and `docs/multi-app-tenancy.md` | Owner adds you as a collaborator |
| Sign-in and invite emails | The `auth-email` Edge Function, sending through Resend | Owner's Resend account |
| User guide | [costtooling.com/guide](https://costtooling.com/guide/), from `guide/index.html` in the app repo | Same as app code |
| Ideas from users | The yellow bulb emails ideas to the address in `FEEDBACK_EMAIL`, near the top of `js/app.js` | Change that line to receive them yourself |

## Run it on your machine

There is nothing to install: any static file server will do. Use port 8766 if you will test team invites or join codes, because the account functions only accept local calls from that port.

1. Clone the repo.
2. From the repo folder, start a server.
3. Open http://127.0.0.1:8766/app/ and switch the browser to a phone size, such as 390 × 844. The landing page is at http://127.0.0.1:8766/.

```bash
git clone https://github.com/clickconstruction/costtooling.github.io.git
cd costtooling.github.io
python3 -m http.server 8766 --bind 127.0.0.1
```

The repo's `.claude/launch.json` starts the same server on port 8765. There, password sign-in and sync work, but the account functions (invite by email, join with a code, admin reset) fail on CORS. Emailed links, such as a sign-in link or a password reset, only come back to your machine if Supabase's redirect allow list includes its address, and the repos do not record that list.

Your test data lives in that browser only. The yellow bulb's **Start over** wipes it and brings back the sample job. The service worker only registers over HTTPS, so local runs never serve stale files.

These address-bar switches save clicks. Add them to the app's address, `/app/`; the front page passes them on, so links from before the move, such as `costtooling.com/?for=Diane`, still work.

| Add to the URL | What it does |
| --- | --- |
| `?tour=1` | Starts Show me around |
| `?welcome=1` | Shows the welcome card again |
| `?for=Diane` | Greets Diane by name on the welcome card, and signs her emailed ideas |
| `?s=cover` | Opens a screen directly: `projects`, `home`, `log`, `photo`, `cover`, `sov` (Progress), `item`, `report` |
| `?s=log&new=1` | Opens a new log entry |
| `?s=sov&m=bill` | Opens Progress on the Bill list; `m=gantt` opens it on the schedule |
| `?s=home&job=sample` | Opens the sample job, if it is still on the phone. The landing page's Try the sample job uses it |
| `?shot=1` | Pins the layout to 390 × 844 for screenshots |
| `?debug=1` | Overlays viewport sizes, safe areas, the focused field, render time and the last log lines |

## How it fits together

Everything a user does runs in the browser. `cloud.js` is the only script that calls Supabase, and only while someone is signed in.

```text
GitHub Pages: serves the repo files as they are, no build step
   │
   ▼
ON THE PHONE, IN THE BROWSER
   index.html      the landing page, on the front page: one file, styles inline. Its one script
                   passes anything headed for the app on to /app/
   app/index.html  the app: markup for every screen and sheet; loads the scripts in order
   sw.js           service worker: keeps both pages and the app files in a cache so they open offline
   app.js        the controller: app state, navigation, every action a button calls
    ├─ ui.js       draws every screen from the job, plus the icons
    ├─ data.js     the job model, templates, the sample job and the sums
    ├─ cover.js    paints the cover page and the report as images
    ├─ photos.js   imports and shrinks photos; draws the sample photos
    ├─ tour.js     Show me around: the guided tour over the sample job
    ├─ cloud.js    sign-in, teams and sync; the only file that calls Supabase
    └─ db.js       jobs in localStorage (ct-data-v2), photos in IndexedDB (ct-photos)
   │
   ▼  from cloud.js only, and only while signed in
SUPABASE PROJECT cjwybuhogxyayjnuxpem, SHARED WITH CHARITYTOOLING
   Auth               email and password, or a sign-in link
   ct_ tables         companies, members, invites, jobs as JSON
   ct-photos bucket   private, one folder per company
   Edge Functions     invites, join codes, admin reset, the auth-email hook
                       └─► Resend sends the sign-in and invite emails
```

- There is no framework and no bundler. Each script defines one global (`App`, `UI`, `Data`, `Render`, `Photos`, `DB`, `Cloud`, `Tour`), and `app/index.html` loads them in order. The scripts, stylesheet, icons, manifest and service worker stay at the repo root; only the app's page moved.
- Buttons mostly call `App` functions through inline `onclick` handlers. `App.go(screen)` redraws a whole screen; sliders, filters and cover picks update the page in place. Back follows `PARENT` in `app.js`, except the photo, line item and entry form screens, which return to the screen that opened them: a short `trail` kept with the session, cleared whenever a tab root opens.
- The one outside library is supabase-js 2.49.4, loaded from jsDelivr.
- **The front page passes people on.** The app lived at the front page until Nov 25, 2026. The script at the top of `index.html` sends on to `/app/`, with the query and hash kept: a home-screen app (one installed before the move still opens the front page), any address with a query other than an ad tag such as `utm_source`, and any address whose hash carries a sign-in token or error. Emailed sign-in, reset and invite links still come back to the front page (`SITE` in `js/cloud.js`, and `redirectBase` in the CharityTooling repo), so nothing in Supabase's redirect list had to change. Remove that script and those links break.

## Data and cloud sync

The phone is the source of truth. Signed in, each job is copied whole to Supabase, and the last device to push a job wins.

### On the phone

| What | Stored in | Notes |
| --- | --- | --- |
| Jobs: line items with their billed figures and costs, log entries, cover settings | localStorage key `ct-data-v2`, one JSON object (`js/db.js`) | The sample job is drawn by `Data.sampleProject()`, dated from today, and never syncs |
| Photos | IndexedDB database `ct-photos`, a 360 px thumb and a 1600 px JPEG each | Kept as ArrayBuffers, because WebKit could not store Blobs in IndexedDB under test |
| An unsaved entry and the open screen | localStorage `ct-session`, kept 6 hours | iOS reloads the page after the camera; this brings the form back |
| Sync bookkeeping | localStorage `ct-sync` and `ct-company` | Which jobs and photos are already up, and the chosen company |
| Ideas and diagnostics | localStorage `ct-ideas` and `ct-log` (last 50 lines) | Both go out with **Email all ideas** |
| First-run flags | localStorage `ct-welcomed`, `ct-toured`, `ct-for`, `ct-sample-bill` | Welcome card seen, tour finished, name from `?for=`, and the stored sample job checked once for its bill |

### Billed against in place

Since version 18 a line item can carry what the contractor billed, beside the percent the user sets with the slider.

- **The field.** `billed` on a line item is the percent the contractor's latest bill shows as complete, 0 to 100, and `billedAt` is the day it was typed. Both are plain JSON on the job, so nothing in the database changed. A line with no `billed` is "not billed yet". Typing an amount stores the percent of the line's budget; a figure past 100% is cut to 100.
- **One running figure.** There are no numbered or dated bills. Each new bill overwrites the last figure.
- **Where it is typed.** On the Progress tab, the Bill choice between Line items and Schedule lists every line with a percent box. A line item's own screen has the same figure under its slider, as a percent or an amount.
- **A job with a bill, and a job without.** A job is drawn the new way once any of its line items has `billed`. Its home screen then shows in place, billed, billed ahead and days left, with a Check before you pay card; its report, cover and email carry the same numbers and name each line billed ahead; its line items show billed where they showed spent; and the Costs card folds to one row. A job with no `billed` anywhere draws exactly as it did in version 17, apart from the quiet Bill choice and one empty "Billed to date" row. `qa/walkthrough.js` checks both, and that a job saved before version 18 is not rewritten.
- **Billed ahead** is the sum, over the lines billed past what is in place, of that gap times the line's budget. A line billed under the work does not cancel one billed ahead. There is no tolerance: a 62% bill against a 60% slider counts.
- **Costs** are kept. The data is untouched; in a job with a bill the cost numbers leave the home screen, the report and the Progress list, and stay in the folded Costs card on each line item.
- **The sample job** has Framing billed at 100% with 85% in place, and its other started lines billed at what is in place: 36% in place, 38% billed, $3,420 billed ahead, the numbers on the landing page. A sample stored on a phone before version 18 is given that bill once, by line item name (`ct-sample-bill` records that it was checked). Nothing else on a phone is changed.
- **The code.** The sums and sentences are in `js/data.js` under "billed against in place"; `App.setBilled` in `js/app.js` is the one place a figure is saved.

### In the cloud

CostTooling's own tables all start with `ct_` and have row-level security keyed to company membership.

- `ct_companies` and `ct_company_members` hold teams. Roles are `admin` and `member`.
- `ct_invitations` and `ct_join_codes` hold invites. An email invite or one-time code serves one person for 7 days. A join code serves up to 25 people for 30 days.
- `ct_projects` holds one row per job, the whole job as JSON in `data`. Deleting a job sets `deleted_at`; the row stays.
- Photos go to the private `ct-photos` storage bucket as `<company id>/<photo id>-thumb.jpg` and `-full.jpg`, 5 MB each at most.
- The app calls four database functions (`ct_create_company`, `ct_create_invite_code`, `ct_rotate_join_code`, `ct_list_members`) and three shared Edge Functions (`invite-user`, `join-with-code`, `admin-reset`), sending `app: 'ct'` so they use the CostTooling tables.
- People sign in with email and password, or with an emailed sign-in link. New passwords need 10 characters.

### When sync runs

1. **Push**, 1.5 s after any save: every job whose contents changed since its last sync is uploaded whole, then any photo not yet uploaded.
2. **Pull**, on sign-in, each time the app comes back to the screen, on a company switch and on **Sync now**: a job changed elsewhere replaces the local copy only when this phone has no unsynced edits to it.
3. **Conflicts**: there is no merge. If two phones edit the same job before syncing, the second push overwrites the first.

The Edge Functions and the sign-up triggers are shared with CharityTooling. Deploying a function or changing `private.handle_new_user()` changes both apps.

## Ship a change

A push to `main` is live in about a minute. There are no pull requests, no automated tests and no branch protection, so check your change before you push.

1. **Bump the version when you change any file that is not a page:** a stylesheet, a script, an icon or a guide photo. The service worker serves those from its cache first, so phones keep the old ones until the version moves. Three places, all one number up (today 18):
   - every `?v=18` in `app/index.html`
   - every `?v=18` in the `SHELL` list in `sw.js`
   - `VERSION = 'ct-v18'` in `sw.js`
2. **A new script or stylesheet** goes in both `app/index.html` and the `SHELL` list in `sw.js`. The landing page needs neither: it is one file, and the service worker fetches it fresh whenever the phone is online.
3. **Commit and push to `main`.** The workflow `.github/workflows/pages.yml` uploads the whole repo and deploys it. The last deploy took 54 seconds. If the deploy step fails with "No artifacts named github-pages were found", as it did on two pushes in a row on Nov 25, do not re-run the failed job, which then finds two artifacts and fails again. Start a fresh run with `gh workflow run pages.yml --ref main`.
4. **Check it is live.** `gh run list` shows the deploy. Then load the live app and look for the new version number. Phones that had the old version see an **Update ready. Reload** message the next time they open the app.

The repo is public and every file in it is served, including `qa/`, `mockups/` and this file. Never commit keys other than the publishable one already in `js/cloud.js`, and never commit customer data.

The guide page itself always loads fresh. Its photos do not, so a retaken guide photo needs the version bump like any other file.

Database and Edge Function changes ship from the CharityTooling repo, not this one: migrations with `supabase db push`, functions with `supabase functions deploy --project-ref cjwybuhogxyayjnuxpem`. That one project serves both live apps, and neither repo describes a staging copy.

## Test it

Testing is Playwright scripts plus a manual iPhone checklist. Playwright is not in the repo, so install it once anywhere and point `NODE_PATH` at that folder's `node_modules`.

```bash
mkdir -p ~/pw && cd ~/pw && npm i playwright && npx playwright install chromium webkit
```

| Script in `qa/` | What it checks | Run it with |
| --- | --- | --- |
| `walkthrough.js` | Every screen of the app at iPhone size, as a fresh user, screenshots into `qa/shots/`. It also checks the sample job's bill, a job with no bill, a job saved before bills existed, and the tour's stops. Last run Nov 25, 2026 against a local server on version 18, in Chromium: 78 screens, no issues. One earlier run on a busy machine failed its draft-restore step, because the script reloaded before a photo had finished importing; the script now waits for the import | `NODE_PATH=~/pw/node_modules node qa/walkthrough.js <url>`; add `ENGINE=webkit` for Safari's engine |
| `offline.js` | The app, at `/app/`, opens from the service worker with the network off. Passed against the live site on Nov 25, 2026 | `node qa/offline.js <url>` |
| `cloud-e2e.js` | Sign in, create a company, sync a job with a photo, mint codes, then see it all arrive in a second browser | `E2E_EMAIL=… E2E_PASSWORD=… node qa/cloud-e2e.js <url>` |
| `guide-shots.js` | Retakes the ten "Your first day" photos in `guide/`. Last run Nov 25, 2026 in Chromium, because WebKit was not installed on that machine | `ENGINE=webkit node qa/guide-shots.js http://127.0.0.1:8766` |

Give each script the site's address without `/app`; it adds that itself. Leave out the URL and `walkthrough.js`, `offline.js` and `guide-shots.js` run against the live site, while `cloud-e2e.js` runs against http://127.0.0.1:8766. The screenshot folders are git-ignored.

`cloud-e2e.js` writes to the live Supabase project. Use a test user whose address is not on example.com, which Resend refuses. Afterwards delete the test company with SQL, and its photos through the Storage API, since direct deletes on storage are blocked.

For anything the browser cannot fake, use `qa/ios-checklist.md`: 60 steps to run in a Safari tab and again as a home-screen app. Its pass and fail columns are still blank. `qa/ios-findings.md` logs what the iPhone simulator turned up, wave by wave.

`mockups/` holds a storyboard of 15 screens from Oct 12. It predates accounts, the guide and the tour. Its links open the app at `/app/`. `mockups/owner-side/` is newer and separate: the Nov 25 mockups of the next direction, as plain HTML pages.

## Recent changes

The app's history runs from Oct 12 to Oct 22, 2026; the landing page, the move to `/app/` and billed against in place came on Nov 25. Newest first. `git log` has every commit.

| Date | Change | Commit |
| --- | --- | --- |
| Nov 25 | Billed against in place: a billed figure on each line item, typed on Progress under Bill or on the line item as a percent or an amount; a job with a bill leads with in place, billed and billed ahead on its home screen, report, cover and email, with a Check before you pay card; the sample job's bill runs $3,420 ahead on Framing; costs fold away in a job with a bill; two tour stops and a guide step; all ten guide photos retaken; version 18 | 23b4ae4 |
| Nov 25 | The owner's side landing page is the front page of costtooling.com, with its copy as drawn; the app moves to `/app/` and the front page passes on home-screen apps, emailed links and old links; the service worker caches both pages; the manifest starts at `/app/`; `?job=sample`; version 17 | 4941f68 |
| Oct 22 | Back, Cancel and Delete return to the screen that opened a photo, a line item or the entry form (Home, the log, a folder or a photo) instead of a fixed parent; the untagged save toast says so; a line item with notes only says so; + Add to this day is a button with a wide tap target; a line item or project edit that was saved no longer reopens its form after a reload; a note typed just before the app is backgrounded survives the reload | 9417c98 |
| Oct 22 | Line item as a folder: its photos and notes grouped as Day 1, Day 2… (its own first day is Day 1), Add a photo to it and Add to this day; Move to… on the photo screen moves an entry, or one photo as its own entry, to another line item; Save entry lands in the line item's folder with the entry outlined; log day headers carry the job day | 7c5ad38 |
| Oct 20 | Every line item in the site log: a chip with its photo count for each, an untagged chip when entries have no line item, Add a photo to an empty item already tagged, the line item picker above the note on New entry, a tour stop and guide step 5 | 92f2b0d |
| Oct 19 | Show me around: a guided tour over the sample job, now the welcome card's first button, also in the bulb menu and at `?tour=1` | 59022cd |
| Oct 16 | "Your first day" guide in nine photo steps; the welcome card rewritten in plain English | 69c9ffa |
| Oct 16 | On a computer the app fills the window; the phone frame and notes column are gone | 2f5b8aa |
| Oct 13 | Photo guide at `/guide/`, its page left out of the app's offline cache | 4b35528 |
| Oct 13 | Accounts, companies, invites and cloud sync on the shared Supabase project, with an end-to-end test | 809591d, bd72714 |
| Oct 13 | Four waves of iPhone fixes: in-place updates, keyboard layout, photo import, draft restore, WebKit storage, offline start, home-screen install | a63f981 to 96238ad |
| Oct 12 | Working prototype: real jobs, photos, costs and reports stored on the phone; deploys moved to GitHub Actions | dde3511, b884fc3 |
| Oct 12 | First hosted click-through with idea capture; domain set up | d38a720 to ba47eed |

## Where it is going

Chosen Nov 25, 2026. The first piece is built: version 18 has billed against in place and a sample job that shows it. The rest of the four phone screens is drawn, not built. The landing page went live the same day, at the owner's request, with its copy as drawn.

The app is being aimed at the person who walks the job for an owner: an owner's rep, or an owner's assistant doing the same job. The promise is "see what's really done before you pay for it". That needed one thing the app could not do, which is compare what the contractor billed with what is in place, per line item. Version 18 does it; Billed against in place, under Data and cloud sync, says how.

- **The plan, every idea that was weighed, and what is not settled:** [mockups/owner-side/README.md](mockups/owner-side/README.md).
- **The screens:** open `mockups/owner-side/index.html`, or [costtooling.com/mockups/owner-side](https://costtooling.com/mockups/owner-side/). Four phone screens of the first release and the draft the landing page was built from.
- **Still to ask the tester:** when you finish a site visit, who do you send your report to, and what do they decide with it? The owner chose to build billed against in place before that answer. The direction rests on one tester and on reasoning, not on market research.
- **The order:** that question; then a first release that adds billed against in place and a sample job that shows it (both built), pasting a job's lines from the contractor's bill, a rewritten welcome card and owner's side wording (not built); then a second release for the owner update, issues, and time and place on photos. The landing page was to come last and went first instead.
- **What the landing page says that version 18 makes true:** it compares what you saw with what was billed; each line the contractor bills has its photos and your own percent, and when the two disagree, it shows; you enter what the contractor billed beside the slider; and the sample job has a bill that runs ahead of the work.
- **What the landing page says that the app still cannot do:** the page you send is called the owner update. In the app it is still the Report, with a Cover page beside it. The landing page's sample card also shows 67 days left where the app's sample shows 68, and says "each part of the job" where the app says line item.

## Open work

Nothing here is broken for one person on one phone. The first three items matter once teams share jobs.

- [ ] **Finish making the landing page true.** Billed against in place is built. The page still calls the one page you send the owner update; the app calls it the Report. Rename it with the rest of the owner's side wording, or change the page.
- [ ] **Try the bill fields on a real iPhone.** They were checked only in Chromium at phone size: the decimal keyboard on the percent and amount boxes, and that a figure saves when the keyboard is dismissed.
- [ ] **Numbered and dated bills.** Each new bill overwrites the last figure, so there is no history and no "since the last bill". `billedAt` is stored so a history can start from it.
- [ ] **Retake the team guide photos that show the job list.** `guide/ct-01-*` and `ct-04-*` show the sample job's card with its old last line, "$108,330 to finish"; it now reads "36% in place · 38% billed". No script takes those photos.
- [ ] **Check the move to `/app/` on a real iPhone.** It was tested in Chromium by serving version 16 and then version 17 to the same browser: the job survived, the worker updated, old links and emailed links reached the app, and both pages opened offline. In the iPhone simulator's Safari the landing page, Try the sample job and an old `/?s=report` link were checked by eye. Not yet checked on a phone: a home-screen app installed before the move, and a real emailed sign-in link.
- [ ] **Merge edits instead of overwriting.** Sync swaps whole jobs, so when two phones edit one job before syncing, the second push erases the first one's changes.
- [ ] **Clean up cloud photos.** Deleting a photo, an entry or a job never removes its files from the `ct-photos` bucket.
- [ ] **Verify costtooling.com in Resend.** Its DNS has no Resend records, so sign-in emails most likely come from the charitytooling.com fallback sender.
- [ ] **Ask the tester two things about line item folders.** Whether Day 1 should sit at the top or the bottom of a line item's folder (today the newest day is first, like the log), and what a sub folder would hold: days, rooms and areas, or stages of the work. Two meanings of Day now coexist, the job day in the log and the line item's own day in its folder. An alternative that groups the log itself by line item, with one meaning of Day, was mocked up and not chosen; it is the fallback if the tester finds the folders hard to reach from the Progress tab.
- [ ] **Try the tour on a real iPhone,** in Safari and as a home-screen app. So far it was only checked in a desktop browser at phone size.
- [ ] **Put line item folders in the guide and the tour.** Neither mentions them: a line item's photos and notes by day, Add a photo to a line item, Move to… on a photo, or Save entry landing in the folder. The guide needs steps with photos, which `qa/guide-shots.js` can take, and the tour needs a stop after Update progress. The guide also says Temp password where the Team screen's button reads Temporary password.
- [ ] **Put photos in the backup.** Back up my data exports jobs as JSON without photos, and tells the user so.
- [ ] **Line up the local ports.** Add `http://127.0.0.1:8765` to the CORS list in the CharityTooling repo, or move `.claude/launch.json` to 8766.
- [ ] **Run the iOS checklist on a real phone** and fill in its pass and fail columns.
- [ ] **Check iOS finding 1.** The welcome card did not show on a first live open with `?for=`, probably because of an old `ct-welcomed` flag.
- [ ] **Refresh or retire the storyboard** in `mockups/`.

## Questions for the owner

The repo cannot answer these. Settle them in the first conversation.

1. **Access:** which of these do you get? Collaborator on both GitHub repos, the Supabase project, Cloudflare, and Resend.
2. **Users:** one real company is syncing: the tester's, with one job, last synced Oct 20, 2026 (checked Nov 19). Treat `ct_projects` as real data from here on, and ask whether more companies are coming. The only other company is the one `cloud-e2e.js` left behind on Oct 13, with no jobs; delete it as Test it describes.
3. **Ideas inbox:** should the bulb keep emailing the owner, or you?
4. **What next:** a direction is written down in Where it is going, and its first piece is built. As of Nov 25 the tester had not been asked the question it rests on. Settle the open points in `mockups/owner-side/README.md`: the bottom tabs, the owner update's name, and sub folders. The README still calls the app a functional mock-up.
5. **The shared project:** will CostTooling stay on the CharityTooling Supabase project, or move to its own?
