# CostTooling handoff

Written Oct 20, 2026, for whoever takes over CostTooling next. When a fact here changes, fix the sentence that holds it.

CostTooling is a phone-first web app for the person who walks a construction job for an owner: photos, how far along each part of the job is, what the contractor billed against that, and one page to send the owner. It is plain HTML, CSS and JavaScript with no build step, hosted on GitHub Pages at costtooling.com. It works on one phone with no account, and signing in syncs jobs to a Supabase project shared with CharityTooling.

It is a working prototype, built between Oct 12 and Oct 22, 2026. The last two changes made each line item a folder of its photos and notes by day, with Move to… on a photo, after a tester asked to see Day 1, Day 2 under a line item and to move photos between line items, and made Back return to the screen you came from. The open work below was last reviewed Nov 26, 2026. A direction for what comes next was chosen on Nov 25: see Where it is going. The same day its landing page went live on the front page of costtooling.com, ahead of the features it describes, and the app moved to costtooling.com/app. Version 18, also Nov 25, is the first piece of that direction: billed against in place. Version 19 is the second: a plain-words pass that rewrote every screen for the owner's assistant. Plain words, under Data and cloud sync, says what it changed; `mockups/owner-side/plain-words.md` has the plan it was built from.

**Where the latest work is.** Everything is on `main`, and the live site is on version 22, merged Nov 25, 2026. There are no other branches. Google sign-in is switched on and published: see Google sign-in, under Data and cloud sync.

**Picking this up from someone else?** Go to the last section, Picking this up. It has what the owner has already decided, what is waiting on the owner, the one piece of work that was offered and not started, and a prompt to paste into Claude Code.

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
| Google sign-in | Google Cloud project `costtooling`, in the owner's Google Workspace organization: the consent screen and one OAuth client. Its client ID and secret are in Supabase, Authentication, Providers, Google | Owner's Google Cloud account |
| Support address | help@clickconstruction.com, a Google Group in the owner's Google Workspace, shown on Google's sign-in screen and on the Privacy and Terms pages | Owner's Google Workspace admin |
| User guide | [costtooling.com/guide](https://costtooling.com/guide/), from `guide/index.html` in the app repo | Same as app code |
| Admin page | [costtooling.com/admin](https://costtooling.com/admin/), from `admin/index.html`: one file, not linked from the app, not in the service worker's cache. It lists every account on the Supabase project, and blocks or unblocks one. The `admin-accounts` Edge Function behind it lives in the CharityTooling repo | The super admin's own sign-in |
| Ideas from users | Tell us what is confusing, under Help, saves ideas on the phone, and its Email all ideas sends them to the address in `FEEDBACK_EMAIL`, near the top of `js/app.js` | Change that line to receive them yourself |

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

Your test data lives in that browser only. **Start over**, under Help and then More, wipes it and brings back the sample job. The service worker only registers over HTTPS, so local runs never serve stale files.

These address-bar switches save clicks. Since version 20 the app drops the one-time ones (`s`, `job`, `new`, `m`, `welcome`, `tour`, `help`, `ideas`, `sheet`, `layout`) from the address once it has opened, so a reload restores what was open instead of replaying them. Add them to the app's address, `/app/`; the front page passes them on, so links from before the move, such as `costtooling.com/?for=Diane`, still work.

| Add to the URL | What it does |
| --- | --- |
| `?tour=1` | Starts Show me around |
| `?welcome=1` | Shows the welcome card again |
| `?for=Diane` | Greets Diane by name on the welcome card, and signs her emailed ideas |
| `?s=report` | Opens a screen directly: `projects`, `home`, `log` (Photos), `photo`, `sov` (Parts), `bill`, `item` (one part), `report` (Send, the owner update), `cover` (the picture to text) |
| `?s=log&new=1` | Opens the form to add a photo |
| `?s=sov&m=gantt` | Opens Parts on the schedule. `?s=sov&m=bill`, from version 18, still opens the Bill tab |
| `?s=home&help=1` | Opens the Help sheet; `ideas=1` opens the ideas sheet and `sheet=report` the send sheet |
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
   app/index.html  the app: markup for every screen and sheet; loads the scripts in order. It is marked
                   noindex, so search engines list the landing page and not the app
   sw.js           service worker: keeps both pages and the app files in a cache so they open offline
   app.js        the controller: app state, navigation, every action a button calls
    ├─ ui.js       draws every screen from the job, plus the icons
    ├─ data.js     the job model, templates, the sample job and the sums
    ├─ cover.js    paints the picture to text and the owner update as images
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
- Buttons mostly call `App` functions through inline `onclick` handlers. `App.go(screen)` redraws a whole screen; the word buttons on a part, the bill boxes, the photo filter and the picture's photo picks update the page in place. Back follows `PARENT` in `app.js`, except the photo, line item and entry form screens, which return to the screen that opened them: a short `trail` kept with the session, cleared whenever a tab root opens.
- The one outside library is supabase-js 2.49.4, loaded from jsDelivr.
- **The front page passes people on.** The app lived at the front page until Nov 25, 2026. The script at the top of `index.html` sends on to `/app/`, with the query and hash kept: a home-screen app (one installed before the move still opens the front page), any address with a query other than an ad tag such as `utm_source`, and any address whose hash carries a sign-in token or error. Emailed sign-in, reset and invite links still come back to the front page (`SITE` in `js/cloud.js`, and `redirectBase` in the CharityTooling repo), so nothing in Supabase's redirect list had to change. Remove that script and those links break.

## Data and cloud sync

The phone is the source of truth. Signed in, each job is copied whole to Supabase, and the last device to push a job wins.

### On the phone

| What | Stored in | Notes |
| --- | --- | --- |
| Jobs: parts (`items`) with their billed figures and costs, photos and notes (`entries`), settings for the picture to text (`cover`) | localStorage key `ct-data-v2`, one JSON object (`js/db.js`) | The sample job is drawn by `Data.sampleProject()`, dated from today, and never syncs |
| Photos | IndexedDB database `ct-photos`, a 360 px thumb and a 1600 px JPEG each | Kept as ArrayBuffers, because WebKit could not store Blobs in IndexedDB under test |
| An unsaved photo form and the open screen | localStorage `ct-session`, kept 6 hours | iOS reloads the page after the camera; this brings the form back |
| Sync bookkeeping | localStorage `ct-sync` and `ct-company` | Which jobs and photos are already up, and the chosen company |
| Ideas and diagnostics | localStorage `ct-ideas` and `ct-log` (last 50 lines) | Both go out with **Email all ideas** |
| First-run flags | localStorage `ct-welcomed`, `ct-toured`, `ct-for`, `ct-sample-bill` | Welcome card seen, tour finished, name from `?for=`, and the stored sample job checked once for its bill |
| The sender's name | localStorage `ct-me` | Typed on the Send tab, printed at the foot of the owner update. It stays on the phone and never syncs |

### Billed against in place

Since version 18 a part of the job (a line item, in the data and in this section) can carry what the contractor billed, beside the percent the user sets. This section is written in version 18's words; Plain words, below, gives the names version 19 puts on screen.

- **The field.** `billed` on a line item is the percent the contractor's latest bill shows as complete, 0 to 100, and `billedAt` is the day it was typed. Both are plain JSON on the job, so nothing in the database changed. A line with no `billed` is "not billed yet". Typing an amount stores the percent of the line's budget; a figure past 100% is refused.
- **One running figure.** There are no numbered or dated bills. Each new bill overwrites the last figure.
- **Where it is typed.** On the Bill tab, which lists every part with two boxes, a percent or dollars; each fills in the other. A part's own screen has the same two boxes under its word buttons. A figure that cannot be right, a percent over 100 or dollars over the part's budget, is refused and the box goes back to what it held; until version 20 it was cut to 100% and saved.
- **A job with a bill, and a job without.** A job is drawn the new way once any of its line items has `billed`. Its home screen then shows in place, billed, billed ahead and days left, with a Check before you pay card; its report, cover and email carry the same numbers and name each line billed ahead; its line items show billed where they showed spent; and the Costs card folds to one row. A job with no `billed` anywhere draws exactly as it did in version 17, apart from the quiet Bill choice and one empty "Billed to date" row. `qa/walkthrough.js` checks both, and that a job saved before version 18 is not rewritten.
- **Billed ahead** is the sum, over the lines billed past what is in place, of that gap times the line's budget. A line billed under the work does not cancel one billed ahead. There is no tolerance: a 62% bill against 60% marked counts. Since version 20 the two are compared as they are shown, to one decimal, so a bill a few dollars over that prints as the same percent is not flagged.
- **Costs** are kept. The data is untouched; in a job with a bill the cost numbers leave the home screen, the report and the Progress list, and stay in the folded Costs card on each line item.
- **The sample job** has Framing billed at 100% with 85% in place, and its other started lines billed at what is in place: 36% in place, 38% billed, $3,420 billed ahead, the numbers on the landing page. A sample stored on a phone before version 18 is given that bill once, by line item name (`ct-sample-bill` records that it was checked). Nothing else on a phone is changed.
- **The code.** The sums and sentences are in `js/data.js` under "billed against in place"; `App.setBilled` in `js/app.js` is the one place a figure is saved.

### Plain words

Version 19 rewrote the screens for the owner's assistant, who is often older and not at home on a phone. The bar the owner set is that a 12-year-old could use it without help. Only what is on screen changed: the names in the data and the code (`items`, `entries`, `pct`, `billed`, `cover`, the `sov` and `report` screens) are as they were, so stored and synced jobs need nothing. The plan, the word list and what differs from the plan are in `mockups/owner-side/plain-words.md`.

- **One name per thing.** A line item is a part of the job, or a part. The log and its entries are Photos. Progress is Parts. In place is done, or what you saw. Billed ahead of the work is billed more than you saw. The report is the owner update, and the cover page is a picture to text. A project is a job. The page the owner reads says done, billed, billed ahead and days left.
- **Five tabs:** Home, Photos, Parts, Bill and Send. `TABOF` in `js/app.js` maps each screen to its tab. Bill is its own screen (`bill`), no longer a choice inside Parts. Send opens the `report` screen; the `cover` screen is reached from it and goes back to it.
- **The top bar** has a Back button that says where it goes (`BACKWORD` and `backDest` in `js/app.js`) and a Help button on every screen. Help opens Show me around, the guide, the ideas form (Tell us what is confusing) and, under More, About, Back up my data and Start over. The yellow corner button with a pencil, a plus or a share arrow is gone: each of those actions is now a worded button on its screen.
- **A job opens on what to do** (`UI.home`): one sentence on how much is done (`Data.doneSentence`), the bill warning in words when the bill is more than what was seen, then four numbered steps in the order of a site visit. The numbers fold under The numbers. The builder's cost numbers, cost so far and cost to finish, are on the Parts tab only, under its list.
- **A part is marked with words** (`UI.item`, `Data.WORDS`): Not started, Just started, About half, Nearly done and Done store 0, 10, 50, 90 and 100. A stored percent reads as the word for its range (1 to 34, 35 to 65, 66 to 99), and tapping the word a part already reads as changes nothing, so the sample's Framing stays at 85%. Type an exact percent is one tap away. There are no sliders left. `App.setPct` is still the one place a percent is saved.
- **The Bill tab** (`UI.bill`) starts with a drawing of a contractor's bill with the percent column ringed, and says that the number counts stored materials.
- **Adding a photo** asks for the photo, which part and a note. The weather, the temperature, the people on site and the date fold under More details. A new photo no longer starts as sunny: version 18 and earlier recorded sun unless someone changed it.
- **Sizes.** Nothing that carries meaning is under 14 px and every tap target is at least 48 px, on every screen `qa/plain-check.js` opens. Messages such as Saved stay 5 seconds.
- **Not covered.** The sign-in, company and team screens in `js/cloud.js` kept their words and sizes. Setting up a job is still builder's work.
- **The code.** The words and sentences shared by screens are in `js/data.js` under "plain words"; the screens are in `js/ui.js`; the styles are at the end of `css/app.css` under "plain words".

### In the cloud

CostTooling's own tables all start with `ct_` and have row-level security keyed to company membership.

- `ct_companies` and `ct_company_members` hold teams. Roles are `admin` and `member`.
- `ct_invitations` and `ct_join_codes` hold invites. An email invite or one-time code serves one person for 7 days. A join code serves up to 25 people for 30 days.
- `ct_projects` holds one row per job, the whole job as JSON in `data`. Deleting a job sets `deleted_at`; the row stays.
- Photos go to the private `ct-photos` storage bucket as `<company id>/<photo id>-thumb.jpg` and `-full.jpg`, 5 MB each at most.
- The app calls four database functions (`ct_create_company`, `ct_create_invite_code`, `ct_rotate_join_code`, `ct_list_members`) and three shared Edge Functions (`invite-user`, `join-with-code`, `admin-reset`), sending `app: 'ct'` so they use the CostTooling tables.
- People sign in with email and password, or with an emailed sign-in link. New passwords need 10 characters.

### Who can manage what

There are two levels, and nothing between them.

- **A company's admin.** `ct_company_members.role` is `admin` or `member`. An admin uses the Team screen on their own company: invite by email, a join code, change a role, deactivate a member, reset a password. Deactivating is the only "remove": nothing deletes an account.
- **The super admin.** `profiles.is_super_admin` is one switch for the whole Supabase project. `private.is_super_admin()` makes every company check pass in every app on the project, CharityTooling included: read and change every company, member, invite, job and photo, and delete companies. The account functions (`invite-user`, `admin-reset`) accept a super admin for any company.
- **Who is the super admin.** `private.handle_new_user()` gives the flag to one address, written into the init migration in the CharityTooling repo and changeable with the database setting `app.bootstrap_admin_email`. A read of the live `profiles` table on Nov 26, 2026 found exactly one super admin, that address, which belongs to the owner. So the owner's wish for a global admin who can add and remove people needed no change to the data.
- **The admin page** (Nov 26, 2026). `costtooling.com/admin/` shows the super admin every account on the project: its ways in (email and password, Google), whether it is confirmed or turned off, and the sites it is on, with a role and counts. It opens no job and no photo. Its one action is Block, which stops an account signing in to every site on the project and removes nothing, and Unblock, which undoes it. The admin's own account and any super admin cannot be blocked there. Anyone else who opens it is told the page is for the admin. The same page is at `casetooling.com/admin/`, and both read the one `admin-accounts` function.
- **What the app does not have.** The Team screen works only on a company the signed-in person belongs to (`company()` in `js/cloud.js` comes from their own memberships), so a super admin has the rights for every company and no screen to pick one. There is no way to delete an account. There is no narrower level, such as someone who may manage people and may not read every job.
- **The live project on Nov 26, 2026:** 9 accounts, 2 CostTooling companies, 3 memberships in them, 1 charity. One of the two companies is the one `cloud-e2e.js` left behind.

### Google sign-in

Continue with Google is on the sign-in screen since version 21. It was switched on in Supabase, and the Google app was published, on Nov 25, 2026, so anyone with a Google account can reach Google's screen. The first real sign-in, the same day, came back signed out on version 21; version 22 fixed it, and it works on the live site: see The sign-in code and Tried for real, below.

- **How the app knows.** On each visit `loadAuthSettings` in `js/cloud.js` asks Supabase's public `/auth/v1/settings` which sign-in methods are on and whether new people may sign up. When `external.google` is true, the sign-in screen shows Continue with Google above the email form, and the job list's card changes its words. Switching the provider off in Supabase hides the button again, with no change to the code.
- **What the button does.** `signInGoogle` calls `signInWithOAuth` with `redirectTo` set to the front page plus `?auth=signin`, the same way back as an emailed sign-in link. A new person lands signed in with no company, on the Finish setting up card. If Google sends them back with an error, the sign-in screen says why.
- **What was set up, in the owner's accounts.**
  - Google Cloud: a project named CostTooling, ID `costtooling`, under the owner's Google Workspace organization. Its Google Auth Platform has the app name CostTooling, audience External, the support email help@clickconstruction.com, the home page `https://costtooling.com`, and one OAuth client of type Web application, "CostTooling web sign-in", with the origin `https://costtooling.com` and the redirect `https://cjwybuhogxyayjnuxpem.supabase.co/auth/v1/callback`.
  - Google Workspace: help@clickconstruction.com is a Google Group, "CostTooling Help", made for this. Anyone may email it; only invited people may join. Mail to it reaches its members, so add whoever should answer.
  - Supabase: the Google provider is on, with that client's ID and secret, which the owner pasted in. The redirect list already had `https://costtooling.com/**` and `http://127.0.0.1:8766/**`. New sign-ups are allowed, so Google makes an account for anyone on first use.
- **What is left.**
  1. Done Nov 25, 2026: the Privacy and Terms pages are live.
  2. Done Nov 25, 2026: Google's Branding page has `https://costtooling.com/privacy/` and `https://costtooling.com/terms/`.
  3. Done Nov 25, 2026: the Google app is In production, on Google's Audience page. It needed no verification, because it has no logo, fewer than ten domains and asks only for email and profile. Adding a logo there would start Google's verification review.
  4. Done Nov 25, 2026: version 22 is live.
  5. Still to do: sign in once with a Google address that has no CostTooling account, and once with one that has an email-and-password account, and check both land in the right place.
- **The sign-in code.** Google, an emailed sign-in link and a password link all send people back with `?code=` in the address, and Supabase's library trades that code for a session a moment after the page loads. `init` in `js/cloud.js` used to clean the address straight away, which wiped the code first, and people came back signed out with no message. Version 22 cleans the address only after `getSession` has returned, and says so on the sign-in screen when a code fails. `qa/google-signin.js` checks it against a local server, where it fails on version 21's code; over https the service worker hides the request from the script, so on the live site it checks only what the screen says.
- **Tried for real, Nov 25, 2026,** in Chrome on a computer, against version 22 on a local server and then on the live site: the owner's Google address, which already had an email-and-password account, went to Google and came back signed in to that same account, with Google added to it as a second way in. It has no CostTooling company, so it landed on Your company, as a new person would. On version 21 the same trip came back signed out.
- **What Google shows.** Its screens say "to continue to cjwybuhogxyayjnuxpem.supabase.co", not CostTooling, because the name shown is the address Google sends people back to. Showing a name of the owner's needs a custom domain for the Supabase project, a paid add-on, or Google's brand verification.
- **It is shared.** The provider, the sign-up switch and `private.handle_new_user()` belong to the one Supabase project, which serves CharityTooling and several other sites in its redirect list. Google sign-in is now on for all of them, and any of them that adds a Google button will show the name CostTooling on Google's screen. Check that the trigger in the CharityTooling repo handles a user who arrives from Google.
- **Not tested yet:** a Google address with no account at all; a real emailed sign-in link and a real password link, which share the fix; and an iPhone Home Screen app, where the trip to Google can finish in Safari and leave the Home Screen app signed out.
- **The check.** `qa/google-signin.js` answers the two network calls itself, so it needs neither Google nor the live project.

### When sync runs

1. **Push**, 1.5 s after any save: every job whose contents changed since its last sync is uploaded whole, then any photo not yet uploaded.
2. **Pull**, on sign-in, each time the app comes back to the screen, on a company switch and on **Sync now**: a job changed elsewhere replaces the local copy only when this phone has no unsynced edits to it.
3. **Conflicts**: there is no merge. If two phones edit the same job before syncing, the second push overwrites the first.

The Edge Functions and the sign-up triggers are shared with CharityTooling. Deploying a function or changing `private.handle_new_user()` changes both apps.

## Ship a change

A push to `main` is live in about a minute. There are no pull requests, no automated tests and no branch protection, so check your change before you push.

1. **Bump the version when you change any file that is not a page:** a stylesheet, a script, an icon or a guide photo. The service worker serves those from its cache first, so phones keep the old ones until the version moves. Three places, all one number up (today 22):
   - every `?v=22` in `app/index.html`
   - every `?v=22` in the `SHELL` list in `sw.js`
   - `VERSION = 'ct-v22'` in `sw.js`
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
| `walkthrough.js` | Every screen of the app at iPhone size, as a fresh user, screenshots into `qa/shots/` (`qa/shots-webkit/` with WebKit). It checks which screen and tab each tap lands on, reads every screen for the words version 19 retired, and checks the sample job's bill, the word buttons and the exact percent, the Bill tab, Help on 13 screens, a job with no bill, a job saved before bills existed, old links and the tour's stops. It ends with a count of issues, and with notes for behaviour nobody has decided. Last run Nov 25, 2026 on version 22, in WebKit, against a local server and then against the live site: 122 screens, no issues. Chromium was not installed on that machine, and WebKit fires no download event, so the backup file and the two saved pictures were checked only by their messages | `NODE_PATH=~/pw/node_modules node qa/walkthrough.js <url>`; add `ENGINE=webkit` for Safari's engine |
| `plain-check.js` | Text under 14 px and tap targets under 48 px on 15 screens and sheets of the sample job. It changes nothing and fails nothing. Last run Nov 25, 2026 on version 19, in WebKit: none of either on any screen. The numbers from version 18 are in `mockups/owner-side/plain-words.md` | `node qa/plain-check.js http://127.0.0.1:8766`; add `ENGINE=webkit` for Safari's engine |
| `offline.js` | The app, at `/app/`, opens from the service worker with the network off. Passed against the live site on Nov 25, 2026, on version 17. Not run on versions 19 to 22: it needs Chromium, which was not installed on that machine, and with WebKit the offline reload fails inside Playwright. On version 19 the live site's service worker was seen in control, with every file of the app in its `ct-v19` cache. It needs HTTPS, so run it against the live site; against a local server it never finishes | `node qa/offline.js <url>` |
| `cloud-e2e.js` | Sign in, create a company, sync a job with a photo, mint codes, then see it all arrive in a second browser | `E2E_EMAIL=… E2E_PASSWORD=… node qa/cloud-e2e.js <url>` |
| `google-signin.js` | Continue with Google with the provider off, on with sign-ups open, on with sign-ups closed, the trip to Google's address, coming back with an error, coming back with a sign-in code, and that the account button stays on the job list when the sync status repaints. It fakes Supabase's settings answer and stops the trip to Google, so it touches neither. Passed Nov 25, 2026 on version 22, in WebKit, against a local server and against the live site | `ENGINE=webkit node qa/google-signin.js http://127.0.0.1:8766` |
| `guide-shots.js` | Retakes the thirteen "Your first day" photos in `guide/`, each with its close-up. For the two steps that show a photo in the form it hands one of the sample's drawn photos to the app's own photo picker, then cancels, so the sample job is unchanged. Last run Nov 25, 2026 on version 19, in WebKit | `ENGINE=webkit node qa/guide-shots.js http://127.0.0.1:8766` |

Give each script the site's address without `/app`; it adds that itself. Leave out the URL and `walkthrough.js`, `offline.js` and `guide-shots.js` run against the live site, while `cloud-e2e.js` and `plain-check.js` run against http://127.0.0.1:8766. The screenshot folders are git-ignored.

`cloud-e2e.js` writes to the live Supabase project. Use a test user whose address is not on example.com, which Resend refuses. Afterwards delete the test company with SQL, and its photos through the Storage API, since direct deletes on storage are blocked.

For anything the browser cannot fake, use `qa/ios-checklist.md`: 60 steps to run in a Safari tab and again as a home-screen app, reworded for version 19. Its pass and fail columns are still blank. `qa/ios-findings.md` logs what the iPhone simulator turned up, wave by wave.

`mockups/` holds a storyboard of 15 screens from Oct 12. It predates accounts, the guide and the tour. Its links open the app at `/app/`. `mockups/owner-side/` is newer and separate: the Nov 25 mockups of the next direction, as plain HTML pages.

## Recent changes

The app's history runs from Oct 12 to Oct 22, 2026; the landing page, the move to `/app/` and billed against in place came on Nov 25. Newest first. `git log` has every commit.

| Date | Change | Commit |
| --- | --- | --- |
| Nov 25 | Coming back with a sign-in code, from Google or an emailed link, now signs in; version 21 wiped the code from the address before Supabase could use it. Found by the first real Google sign-in. The sign-out and deactivate confirmations say what they do. Version 22 | 0da84c7, e744303 |
| Nov 25 | Privacy and Terms pages at `/privacy/` and `/terms/`, linked from the front page and Help; Google sign-in switched on in Supabase and published in Google Cloud | ea3365e |
| Nov 25 | Continue with Google on the sign-in screen, shown only when Supabase has the Google provider on; the account button on the job list no longer disappears when the sync status repaints, which it did in versions 19 and 20 because `window.App` is never defined (`App` is a top-level const); Escape no longer closes a sheet under the tour; version 21 | 381166d |
| Nov 25 | Fixes from a review of the live site by six kinds of customer. Wrong before: a percent over 100 or dollars over the budget was saved as 100%, and is now refused; a bill a few dollars over was flagged while both percents printed the same; a reload lost the photo form for anyone who came by the landing page's button; a job with no dates showed tens of thousands of days left; Try the sample job opened another job when the sample was gone; a typed total price did not add up across the parts. Changed: the Bill tab takes a percent or dollars on every row and says Saved; the job list says jobs are saved on this phone and no longer offers a sign-in nobody can create; the owner update is marked Sample job on the sample, carries the sender's note and name and a line on what a bill's figures include; Save and add another on the photo form; the floating bulb is gone and ideas are under Help; messages show at the top, with a warning sign when something was not saved; the tour goes back to where it was started and has a Stop button; the reason for Add to Home Screen, shown again on a new job; the guide opens on CostTooling's steps from the app; version 20 | 6122c45 |
| Nov 25 | The plain-words pass: a job opens on one sentence, the bill warning in words and four numbered steps; a part is marked with five words, with an exact percent one tap away, and the sliders are gone; tabs are Home, Photos, Parts, Bill and Send; the Bill tab draws where to find the number on a bill; adding a photo asks three things; Back says where it goes and Help is on every screen; nothing under 14 px or 48 px; one plain name per thing in the app, the tour, the guide, both images and the landing page; saved pictures are named `costtooling-owner-update.jpg` and `costtooling-picture.jpg`; the guide has thirteen first-day steps with new photos; version 19 | 3c32cd2, b92ca18 |
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

Chosen Nov 25, 2026. Two pieces are built: version 18 has billed against in place and a sample job that shows it, and version 19 has the plain-words pass. Pasting a job's lines from the bill, issues, and time and place on photos are drawn or planned, not built. The landing page went live the same day, at the owner's request, with its copy as drawn.

The app is being aimed at the person who walks the job for an owner: an owner's rep, or an owner's assistant doing the same job. The promise is "see what's really done before you pay for it". That needed one thing the app could not do, which is compare what the contractor billed with what is in place, per line item. Version 18 does it; Billed against in place, under Data and cloud sync, says how.

- **The plan, every idea that was weighed, and what is not settled:** [mockups/owner-side/README.md](mockups/owner-side/README.md).
- **The screens:** open `mockups/owner-side/index.html`, or [costtooling.com/mockups/owner-side](https://costtooling.com/mockups/owner-side/). Four phone screens of the first release and the draft the landing page was built from.
- **Still to ask the tester:** when you finish a site visit, who do you send your report to, and what do they decide with it? The owner chose to build billed against in place before that answer. The direction rests on one tester and on reasoning, not on market research.
- **The order:** that question; then a first release that adds billed against in place and a sample job that shows it (built, version 18), a rewritten welcome card and owner's side wording (built, version 19), and pasting a job's lines from the contractor's bill (not built); then a second release for issues, and time and place on photos. The landing page was to come last and went first instead.
- **The plain-words pass** is built, as version 19. After reviewing version 18 through the eyes of the owner's assistant, who is often older and not at home on a phone, the owner asked for every screen to be simple enough for a 12-year-old. `mockups/owner-side/plain-words.md` has the findings, the plan in seven steps, the word list, what was decided, what was built and what differs from the plan. Pasting from the bill stays its own piece, and is next.
- **The landing page and the app now say the same thing.** Version 18 made true that it compares what you saw with what was billed. Version 19 calls the page you send the owner update, calls a line item a part of the job, and replaced the sliders with word buttons, so the landing page says "tap the words that fit" where it said "drag a slider", its sample card says done where it said in place, and 68 days left where it said 67. Those five phrases are the only changes to its copy.

### One dashboard for the suite

Asked for by the owner on Nov 26, 2026, and only planned. CostTooling is one of several Click Construction apps, and the owner wants one site to manage all of them from. The Supabase project already serves several apps with one sign-in (`docs/multi-app-tenancy.md` in the CharityTooling repo), which is most of the foundation. What to plan, in the order to do it:

1. **Inventory.** List every app in the suite and which Supabase project each one uses. Apps on this project can share a dashboard cheaply; an app on another project needs moving, or a bridge. Only this project was looked at.
2. **Scoped platform roles,** in place of the one super admin switch: owner, user manager, support, each optionally per app, with every action written to the `audit_log` table that already exists.
3. **A customer above the companies.** Each app has its own tenants (`ct_companies`, `charities`), so a firm that uses two apps is two unrelated rows. The dashboard needs one organization that links them.
4. **An admin API:** Edge Functions that list companies and people across apps, and add, deactivate, delete and reset. The dashboard calls these and never the tables.
5. **An app registry in the database.** The list of apps is the `APPS` object in `supabase/functions/_shared/supabase.ts`. A table lets the dashboard find apps without a code change.
6. **The same shape in every app:** the membership columns CostTooling has, a summary function per app (counts, last activity), and delete and export functions per app. The Privacy page already promises deletion and a copy on request, so those two are owed whatever happens to the dashboard.
7. **One name for sign-in.** Google's screen names the Supabase address and the Google app is called CostTooling. A custom domain for the Supabase project and a name for the suite fix both for every app.
8. **A staging copy.** There is one live database and no test copy. Admin tools that reach across apps should not be built against live data.
9. **The dashboard,** as its own site on the same sign-in: Sites, Companies, People, Invites, Audit log; billing later. Adding a site to the project follows Adding a third app in `docs/multi-app-tenancy.md`.

Start with 1, 2 and 4, then a dashboard that only reads, then the actions that write. All of the database work belongs in the CharityTooling repo.

## Open work

Nothing here is broken for one person on one phone. Merging edits and cleaning up cloud photos matter once teams share jobs.

- [ ] **Decide what a tapped word tells the owner.** From the review by customer type, and the most serious thing it left open. About half stores 50 for anything a person would call about half, and the owner update then prints "On site it is 50%" and a dollar gap to the dollar. Either keep a word as a range (flag only when the bill passes the top of the range, and print "about half done"), or keep the exact figure and accept that it claims more than was seen. It changes what the owner is told, so it is the owner's call.
- [ ] **The owner update for a contractor who pushes back.** Still missing, by an owner's rep's standard: the bill's number and date, retainage, the date each percent was marked beside its part (version 20 stores `pctAt` and prints only the latest), and the flagged part's own photo under its flag. The tile says billed ahead where the app says billed more than you saw.
- [ ] **A bill that is one total, and bills over time.** The Bill tab takes a percent or dollars per part; a one-page invoice with one total has nowhere to go. Each new bill still overwrites the last.
- [ ] **Setting up and getting out.** Parts are typed one form at a time, with no paste and no reorder; budgets from a template are a guess. The backup is JSON without photos and cannot be loaded back; Print it prints a picture, and there is no spreadsheet export.
- [ ] **An All companies screen for the super admin.** Offered to the owner on Nov 26, 2026 and not started; wait for a yes. A list of every company, shown only when `profile.is_super_admin`, that opens any company's Team screen. The database already allows it, so it is front-end work in `js/cloud.js`: read `ct_companies` without the membership filter, and let `company()` and `companyId` point at a company the person does not belong to. Check what sync does once a company is picked that way, so the super admin's phone does not pull every job of a company they only meant to look at. Version bump, `qa/google-signin.js` and the walkthrough as usual.
- [ ] **Deleting an account, and a level between admin and super admin.** Neither exists: see Who can manage what. Both are database and Edge Function work in the CharityTooling repo, and both are steps in One dashboard for the suite.
- [ ] **Two-step verification on the super admin's Google account.** That account can now sign in with Google, so Google's sign-in is what protects every company's data.
- [ ] **Finish trying sign-in for real.** Google works on the live site for an address that already had an account. Still to try: a Google address with no account; an emailed sign-in link and a password link, which were broken the same way; and an iPhone Home Screen app. Google sign-in, under Data and cloud sync, says what was tried and what to look for.
- [ ] **Google's screen names the Supabase address, not CostTooling.** See What Google shows, under Google sign-in.
- [ ] **Desktop and assistive use.** The browser's own Back leaves the app; Enter submits no form; photo rows and template choices are not reachable by keyboard; sheets do not take focus. Escape now closes a sheet, messages are announced, and the lit tab is exposed.
- [ ] **The landing page, for the owner to decide.** Reviewers playing an owner read "For owner's reps, and anyone who walks the job for an owner" as not for them; the sample card shows blank photo tiles and a literal [YOUR NAME]; nothing says where the data lives. Version 20 changed one phrase there: how many were on site, where it said who.
- [ ] **Hand the phone to someone who has never seen the app.** The test that matters for version 19, and not done: the sample job and three tasks with no help. Add a photo to Framing; mark Roofing as about half done; say which part the contractor billed too much for. Note every place they stop or ask.
- [ ] **Plain words on the sign-in, company and team screens.** `js/cloud.js` kept its words and sizes, and the account button on the job list is still an icon with no word.
- [ ] **Paste a job's lines from the contractor's bill.** Setting up a job is still builder's work: parts, budgets and dates. Drawn in `mockups/owner-side/paste.html`.
- [ ] **Try the bill fields and the exact percent on a real iPhone.** They were checked only in Chromium and WebKit at phone size: the decimal keyboard on the percent and amount boxes, and that a figure saves when the keyboard is dismissed.
- [ ] **Numbered and dated bills.** Each new bill overwrites the last figure, so there is no history and no "since the last bill". `billedAt` is stored so a history can start from it.
- [ ] **Retake the team guide photos.** No script takes the 26 `guide/ct-*.png` photos, and most need a signed-in account. All of them show the top bar from before version 19, with no Help button. The worst are `ct-01-*` and `ct-04-*`, which show the old job list with its number tiles. The close-ups of form buttons are still right. Two steps under Help someone who is locked out still say Photo coming.
- [ ] **Check the move to `/app/` on a real iPhone.** It was tested in Chromium by serving version 16 and then version 17 to the same browser: the job survived, the worker updated, old links and emailed links reached the app, and both pages opened offline. In the iPhone simulator's Safari the landing page, Try the sample job and an old `/?s=report` link were checked by eye. Not yet checked on a phone: a home-screen app installed before the move, and a real emailed sign-in link.
- [ ] **Merge edits instead of overwriting.** Sync swaps whole jobs, so when two phones edit one job before syncing, the second push erases the first one's changes.
- [ ] **Clean up cloud photos.** Deleting a photo, an entry or a job never removes its files from the `ct-photos` bucket.
- [ ] **Verify costtooling.com in Resend.** Its DNS has no Resend records, so sign-in emails most likely come from the charitytooling.com fallback sender.
- [ ] **Ask the tester two things about a part's photos by day.** Whether Day 1 should sit at the top or the bottom of a part's list (today the newest day is first, like the Photos tab), and what a sub folder would hold: days, rooms and areas, or stages of the work. Two meanings of Day now coexist, the job day on the Photos tab and the part's own day on its screen. An alternative that groups the Photos tab itself by part, with one meaning of Day, was mocked up and not chosen; it is the fallback if the tester finds a part's photos hard to reach from the Parts tab.
- [ ] **Try the tour on a real iPhone,** in Safari and as a home-screen app. So far it was only checked in a desktop browser at phone size.
- [ ] **Put a part's photos by day in the guide and the tour.** Neither mentions them: a part's photos and notes by day, Add a photo of a part, Move it to another part on a photo, or Save landing on the part's screen. The guide needs steps with photos, which `qa/guide-shots.js` can take, and the tour needs a stop after Mark what you saw.
- [ ] **Put photos in the backup.** Back up my data exports jobs as JSON without photos, and tells the user so.
- [ ] **Line up the local ports.** Add `http://127.0.0.1:8765` to the CORS list in the CharityTooling repo, or move `.claude/launch.json` to 8766.
- [ ] **Run the iOS checklist on a real phone** and fill in its pass and fail columns.
- [ ] **Check iOS finding 1.** The welcome card did not show on a first live open with `?for=`, probably because of an old `ct-welcomed` flag.
- [ ] **Refresh or retire the storyboard** in `mockups/`.

## Questions for the owner

The repo cannot answer these. Settle them in the first conversation.

1. **Access:** which of these do you get? Collaborator on both GitHub repos, the Supabase project, Cloudflare, and Resend.
2. **Users:** one real company is syncing: the tester's, with one job, last synced Oct 20, 2026 (checked Nov 19). Treat `ct_projects` as real data from here on, and ask whether more companies are coming. The only other company is the one `cloud-e2e.js` left behind on Oct 13, with no jobs; delete it as Test it describes.
3. **Ideas inbox:** should the ideas form keep emailing the owner, or you?
4. **What next:** a direction is written down in Where it is going, and its first two pieces are built. As of Nov 25 the tester had not been asked the question it rests on. Settle the open points in `mockups/owner-side/README.md` (sub folders, numbered bills) and the two left open in `mockups/owner-side/plain-words.md`: whether a part shows the bill's own name for its line, and who sets a job up. The README still calls the app a functional mock-up.
5. **The shared project:** will CostTooling stay on the CharityTooling Supabase project, or move to its own? The dashboard plan assumes it stays.
6. **The All companies screen:** build it? It was offered and not answered.
7. **The suite:** which other apps are in it, and which Supabase project is each on? Step 1 of One dashboard for the suite.
8. **Who runs it:** the Privacy and Terms pages say Click Construction. The owner approved that; confirm it is the legal name, and whether the terms should name a state's law.

## Picking this up

For whoever continues from another computer. Everything is pushed: `main` is the only branch, and the live site matches it.

### What happened on Nov 25 and 26, 2026

Versions 18 to 22 all went live in one long session with the owner: billed against in place (18), the plain-words pass (19), fixes from a review by six kinds of customer (20), Continue with Google and a fix to the account button (21), and a fix that makes coming back from Google sign in (22). The Privacy and Terms pages went live, and Google sign-in was set up in the owner's Google Cloud, Google Workspace and Supabase accounts and tried for real. Recent changes has each one with its commit.

### What the owner has already decided

Do not ask these again.

- **How work reaches the live site.** Build on a branch, test, tell the owner what changed, and merge to `main` only on a yes. After a merge, delete the branch.
- **The plain-words pass** was built to its plan's proposals, with the builder's cost numbers on the Parts tab only.
- **Google sign-in is open to anyone.** New sign-ups stay allowed in Supabase. The Google app is named CostTooling, its support address is help@clickconstruction.com, and it was published without a logo so that Google asks for no review.
- **The Privacy and Terms pages** are approved as written, naming Click Construction.
- **Left open on purpose,** after the review by customer type: what a tapped word tells the owner, the wording at the top of the landing page, and the larger features. Open work has each.

### What is waiting on the owner

Questions 6, 7 and 8 under Questions for the owner, and the open decisions in Open work. The first thing to ask is question 6.

### What the next person needs

- **To change the app:** this repo, and Playwright for the scripts (Test it). Nothing else.
- **To change the database or an account function:** the CharityTooling repo, and the owner's Supabase access. There is no test copy of the database.
- **To change Google sign-in:** the owner signed in to Google Cloud and Supabase. A password, a key or a client secret is always typed by the owner, never by a helper.
- **The test scripts take an engine.** `ENGINE=webkit` or the default, Chromium. The last session had only WebKit, so `offline.js` has not been run since version 17 and the file checks in the walkthrough were skipped.

### A prompt to paste into Claude Code

After cloning the repo and opening its folder:

```text
I'm taking over CostTooling, a phone-first web app at costtooling.com. This folder is its repo, and main is the only branch.

Read HANDOFF.md from top to bottom, then its last section, Picking this up, a second time.

Then tell me, briefly:
1. Where the app stands and which version is live.
2. What was offered or planned and not started.
3. What is waiting on the owner, and which question you would ask first.

Do not change anything until I answer. Keep these rules for the whole session:
- The repo is public and every committed file is served on the site. Never commit names, personal emails, keys or customer data.
- The database and the account functions live in the charitytooling repo. One live Supabase project serves several apps with no staging copy, so make no database change without asking me.
- Real companies sync real jobs. Old jobs must keep working, and nothing may rewrite or drop stored data.
- Build on a branch and test it. A push to main deploys to the live site in about a minute, so ask me before anything goes to main, and delete the branch after it is merged.
- Bump the version as HANDOFF.md says when a script or stylesheet changes, and run qa/walkthrough.js, qa/plain-check.js and qa/google-signin.js before asking to merge.
- Never type a password, a key or a client secret into any site. Ask me to do it.
- Keep HANDOFF.md current: when a fact in it changes, fix the sentence that holds it.
```
