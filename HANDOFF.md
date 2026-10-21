# CostTooling handoff

Written Oct 20, 2026, for whoever takes over CostTooling next. When a fact here changes, fix the sentence that holds it.

CostTooling is a phone-first web app for tracking a construction job from the site: photos, progress, costs and a one-page report. It is plain HTML, CSS and JavaScript with no build step, hosted on GitHub Pages at costtooling.com. It works on one phone with no account, and signing in syncs jobs to a Supabase project shared with CharityTooling.

It is a working prototype, built between Oct 12 and Oct 20, 2026. The last change put every line item in the site log, after a tester could not find the line items they had added there.

## Where everything lives

The app is one repo, but its database and account functions live in the CharityTooling repo. Read `docs/multi-app-tenancy.md` there before any database change.

| Piece | Where | Access |
| --- | --- | --- |
| App code | [clickconstruction/costtooling.github.io](https://github.com/clickconstruction/costtooling.github.io), public, branch `main`, no branch protection | Owner adds you as a collaborator |
| Live site | [costtooling.com](https://costtooling.com) on GitHub Pages, HTTPS enforced | Deploys itself on every push to `main` |
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
3. Open http://127.0.0.1:8766/ and switch the browser to a phone size, such as 390 × 844.

```bash
git clone https://github.com/clickconstruction/costtooling.github.io.git
cd costtooling.github.io
python3 -m http.server 8766 --bind 127.0.0.1
```

The repo's `.claude/launch.json` starts the same server on port 8765. There, password sign-in and sync work, but the account functions (invite by email, join with a code, admin reset) fail on CORS. Emailed links, such as a sign-in link or a password reset, only come back to your machine if Supabase's redirect allow list includes its address, and the repos do not record that list.

Your test data lives in that browser only. The yellow bulb's **Start over** wipes it and brings back the sample job. The service worker only registers over HTTPS, so local runs never serve stale files.

These address-bar switches save clicks:

| Add to the URL | What it does |
| --- | --- |
| `?tour=1` | Starts Show me around |
| `?welcome=1` | Shows the welcome card again |
| `?for=Diane` | Greets Diane by name on the welcome card, and signs her emailed ideas |
| `?s=cover` | Opens a screen directly: `projects`, `home`, `log`, `photo`, `cover`, `sov` (Progress), `item`, `report` |
| `?s=log&new=1` | Opens a new log entry |
| `?shot=1` | Pins the layout to 390 × 844 for screenshots |
| `?debug=1` | Overlays viewport sizes, safe areas, the focused field, render time and the last log lines |

## How it fits together

Everything a user does runs in the browser. `cloud.js` is the only script that calls Supabase, and only while someone is signed in.

```text
GitHub Pages: serves the repo files as they are, no build step
   │
   ▼
ON THE PHONE, IN THE BROWSER
   index.html    markup for every screen and sheet; loads the scripts in order
   sw.js         service worker: keeps the app files in a cache so it opens offline
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

- There is no framework and no bundler. Each script defines one global (`App`, `UI`, `Data`, `Render`, `Photos`, `DB`, `Cloud`, `Tour`), and `index.html` loads them in order.
- Buttons mostly call `App` functions through inline `onclick` handlers. `App.go(screen)` redraws a whole screen; sliders, filters and cover picks update the page in place.
- The one outside library is supabase-js 2.49.4, loaded from jsDelivr.

## Data and cloud sync

The phone is the source of truth. Signed in, each job is copied whole to Supabase, and the last device to push a job wins.

### On the phone

| What | Stored in | Notes |
| --- | --- | --- |
| Jobs: line items, costs, log entries, cover settings | localStorage key `ct-data-v2`, one JSON object (`js/db.js`) | The sample job is drawn by `Data.sampleProject()`, dated from today, and never syncs |
| Photos | IndexedDB database `ct-photos`, a 360 px thumb and a 1600 px JPEG each | Kept as ArrayBuffers, because WebKit could not store Blobs in IndexedDB under test |
| An unsaved entry and the open screen | localStorage `ct-session`, kept 6 hours | iOS reloads the page after the camera; this brings the form back |
| Sync bookkeeping | localStorage `ct-sync` and `ct-company` | Which jobs and photos are already up, and the chosen company |
| Ideas and diagnostics | localStorage `ct-ideas` and `ct-log` (last 50 lines) | Both go out with **Email all ideas** |
| First-run flags | localStorage `ct-welcomed`, `ct-toured`, `ct-for` | Welcome card seen, tour finished, name from `?for=` |

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

1. **Bump the version when you change any file that is not a page:** a stylesheet, a script, an icon or a guide photo. The service worker serves those from its cache first, so phones keep the old ones until the version moves. Three places, all one number up (today 14):
   - every `?v=14` in `index.html`
   - every `?v=14` in the `SHELL` list in `sw.js`
   - `VERSION = 'ct-v14'` in `sw.js`
2. **A new script or stylesheet** goes in both `index.html` and the `SHELL` list in `sw.js`.
3. **Commit and push to `main`.** The workflow `.github/workflows/pages.yml` uploads the whole repo and deploys it. The last deploy took 54 seconds.
4. **Check it is live.** `gh run list` shows the deploy. Then load the live page and look for the new version number. Phones that had the old version see an **Update ready. Reload** message the next time they open the app.

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
| `walkthrough.js` | Every screen at iPhone size, as a fresh user, screenshots into `qa/shots/` | `NODE_PATH=~/pw/node_modules node qa/walkthrough.js <url>`; add `ENGINE=webkit` for Safari's engine |
| `offline.js` | The app opens from the service worker with the network off | `node qa/offline.js <url>` |
| `cloud-e2e.js` | Sign in, create a company, sync a job with a photo, mint codes, then see it all arrive in a second browser | `E2E_EMAIL=… E2E_PASSWORD=… node qa/cloud-e2e.js <url>` |
| `guide-shots.js` | Retakes the nine "Your first day" photos in `guide/` | `ENGINE=webkit node qa/guide-shots.js http://127.0.0.1:8766` |

Leave out the URL and `walkthrough.js`, `offline.js` and `guide-shots.js` run against the live site, while `cloud-e2e.js` runs against http://127.0.0.1:8766. The screenshot folders are git-ignored.

`cloud-e2e.js` writes to the live Supabase project. Use a test user whose address is not on example.com, which Resend refuses. Afterwards delete the test company with SQL, and its photos through the Storage API, since direct deletes on storage are blocked.

For anything the browser cannot fake, use `qa/ios-checklist.md`: 52 steps to run in a Safari tab and again as a home-screen app. Its pass and fail columns are still blank. `qa/ios-findings.md` logs what the iPhone simulator turned up, wave by wave.

`mockups/` holds a storyboard of 15 screens from Oct 12. It predates accounts, the guide and the tour.

## Recent changes

The whole history is one week, newest first. `git log` has every commit.

| Date | Change | Commit |
| --- | --- | --- |
| Oct 20 | Every line item in the site log: a chip with its photo count for each, an untagged chip when entries have no line item, Add a photo to an empty item already tagged, the line item picker above the note on New entry, a tour stop and guide step 5 | 92f2b0d |
| Oct 19 | Show me around: a guided tour over the sample job, now the welcome card's first button, also in the bulb menu and at `?tour=1` | 59022cd |
| Oct 16 | "Your first day" guide in nine photo steps; the welcome card rewritten in plain English | 69c9ffa |
| Oct 16 | On a computer the app fills the window; the phone frame and notes column are gone | 2f5b8aa |
| Oct 13 | Photo guide at `/guide/`, its page left out of the app's offline cache | 4b35528 |
| Oct 13 | Accounts, companies, invites and cloud sync on the shared Supabase project, with an end-to-end test | 809591d, bd72714 |
| Oct 13 | Four waves of iPhone fixes: in-place updates, keyboard layout, photo import, draft restore, WebKit storage, offline start, home-screen install | a63f981 to 96238ad |
| Oct 12 | Working prototype: real jobs, photos, costs and reports stored on the phone; deploys moved to GitHub Actions | dde3511, b884fc3 |
| Oct 12 | First hosted click-through with idea capture; domain set up | d38a720 to ba47eed |

## Open work

Nothing here is broken for one person on one phone. The first three items matter once teams share jobs.

- [ ] **Merge edits instead of overwriting.** Sync swaps whole jobs, so when two phones edit one job before syncing, the second push erases the first one's changes.
- [ ] **Clean up cloud photos.** Deleting a photo, an entry or a job never removes its files from the `ct-photos` bucket.
- [ ] **Verify costtooling.com in Resend.** Its DNS has no Resend records, so sign-in emails most likely come from the charitytooling.com fallback sender.
- [ ] **Try the tour on a real iPhone,** in Safari and as a home-screen app. So far it was only checked in a desktop browser at phone size.
- [ ] **Retake the guide's step 1, 4 and 5 photos.** Step 1 still shows the old Show me how button; steps 4 and 5 show the entry form from before the line item picker moved above the note. Run `qa/guide-shots.js` against a local server and commit the new `guide/fd-01-*`, `fd-04-*` and `fd-05-*` images. Bump the version too, or installed phones keep showing the old photos.
- [ ] **Put photos in the backup.** Back up my data exports jobs as JSON without photos, and tells the user so.
- [ ] **Line up the local ports.** Add `http://127.0.0.1:8765` to the CORS list in the CharityTooling repo, or move `.claude/launch.json` to 8766.
- [ ] **Run the iOS checklist on a real phone** and fill in its pass and fail columns.
- [ ] **Check iOS finding 1.** The welcome card did not show on a first live open with `?for=`, probably because of an old `ct-welcomed` flag.
- [ ] **Refresh or retire the storyboard** in `mockups/`.

## Questions for the owner

The repo cannot answer these. Settle them in the first conversation.

1. **Access:** which of these do you get? Collaborator on both GitHub repos, the Supabase project, Cloudflare, and Resend.
2. **Users:** are real companies syncing jobs yet? That decides how careful any change to `ct_projects` has to be.
3. **Ideas inbox:** should the bulb keep emailing the owner, or you?
4. **What next:** there is no roadmap in the repo, and the README still calls the app a functional mock-up.
5. **The shared project:** will CostTooling stay on the CharityTooling Supabase project, or move to its own?
