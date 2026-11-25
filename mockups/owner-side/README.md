# The owner's side: plan and mockups

Chosen Nov 25, 2026. **One piece is built:** version 18 of the app has billed against in place and a sample job that shows it, in the app's own layout and words, not pixel for pixel as drawn here. **The rest of the phone screens is drawn, not built:** see What is built. **The landing page is live:** the owner had it built the same day, with its copy as drawn, as the front page of costtooling.com, and the app moved to costtooling.com/app. Open `index.html` in this folder to see every screen, or https://costtooling.com/mockups/owner-side/.

Read `HANDOFF.md` at the repo root first. It says how the app is put together, shipped and tested.

## Who it is for

The person who walks the job for an owner. That is an owner's rep, or an owner's assistant doing the same job without the title.

Once a month the contractor sends a bill that says "Framing, 100% complete", and this person has to tell the owner whether to pay it. Today they answer from a camera roll and memory.

- **The promise:** see what's really done before you pay for it.
- **The tagline under the name:** The owner's eyes on the job.
- **For the assistant:** you don't have to be a builder to report like one. The list of parts tells you what to look at.

Why the owner's side and not the builder's: the app's core loop is already theirs (walk, photograph, tag to a line item, set a percent, send one page), it works best for one person on one phone, and the one tester asked for exactly what someone keeping a record asks for. Builders already have crowded tools and need crews, estimating and invoicing.

**How sure this is:** it rests on what the app does and on two notes from one tester. It is not market research.

## The gate

Ask the tester before building any of it:

> When you finish a site visit, who do you send your report to, and what do they decide with it?

If the answer is an owner, go ahead. If it is a builder, the billing ideas below change shape and the rest still hold. Two or three more owner's side testers would help, since one tester is not a market.

## What is built

Version 18, Nov 25, 2026. HANDOFF.md, under Billed against in place, says how it works.

| Drawn here | In the app |
| --- | --- |
| `home.html`: in place, billed, billed ahead, days left | Built, for a job that has a bill. A job with no bill keeps its old four numbers |
| `home.html`: Check before you pay card | Built. It says "line items", not "parts" |
| `home.html`: Mark what you saw, Enter a bill and Owner update buttons | Not built. The buttons are as they were; the card has an Enter a new bill link |
| `home.html` and `item.html`: Home, Log, Parts, Bills, Owner update tabs | Not built. The tabs are still Home, Log, Cover, Progress, Report |
| `item.html`: what the contractor billed, as a percent or an amount | Built, as one row under the slider in the Progress card, with a tick on the slider at the billed percent |
| `item.html`: the amber "Billed ahead by" banner | Built as the second tile at the top, which turns amber |
| `item.html`: Bill 1, Bill 2 with dates | Not built. One running figure; each new bill overwrites it |
| `item.html`: the Costs card gone | Costs are kept, folded to one row at the bottom, in a job with a bill |
| Not drawn: typing a whole bill in one pass | Built: Progress has a Bill choice beside Line items and Schedule |
| Not drawn: the report and cover | Built: with a bill, both carry the four numbers, and the report names each line billed ahead |
| `paste.html` | Not built |
| `welcome.html` | Not built |

Landing page claims that are now true: it compares what you saw with what was billed; when your percent and the bill disagree, it shows; you enter what the contractor billed beside the slider; the sample has a bill that runs ahead of the work. Still not true: the page you send is not yet called the owner update.

## The screens

| File | What it shows | Ideas |
| --- | --- | --- |
| `welcome.html` | The welcome card rewritten around the promise, with the tagline | 6, 8 |
| `home.html` | Job home: in place, billed, billed ahead, days left, and a "Check before you pay" card | 3, 4, 7 |
| `item.html` | One part of the job: the slider for what you saw, and a new card for what the contractor billed | 3 |
| `paste.html` | New job: paste the lines from the contractor's bill and see what was read | 5 |
| `landing.html` | Landing page, first draft, with the owner update as the hero. Built from this draft as `/index.html` at the repo root | 12 |

The sample numbers are the app's sample job, with one change: the contractor has billed Framing at 100% while 85% is in place. That is $3,420 billed ahead on a $22,800 line, so the job is 36% in place and 38% billed.

## Every idea that was weighed

The test for each: does it help this person say whether the bill matches the building?

| # | Idea | Why it matters | Effort | Call |
| --- | --- | --- | --- | --- |
| 1 | Ask the tester who gets the report and what they decide | Confirms or sinks the direction | Free | Before anything |
| 2 | Find two or three more owner's side testers | One tester is not a market | Low | Alongside |
| 3 | Billed against in place, per line item | It is the promise, and the app could not do it | Medium | Built, version 18 |
| 4 | Sample job where the bill runs ahead of the work | A visitor sees the point with no words | Small, needs 3 | Built, version 18 |
| 5 | Paste in the contractor's line items | Setting up a real job is the barrier | Small | First release |
| 6 | Welcome card rewrite | It is the whole first impression today | Small | First release |
| 7 | Words: "Billed", "Owner update", "parts of the job" | The app speaks builder, not owner | Small | First release. "Billed", "in place" and "billed ahead" are in; the other two are not |
| 8 | Tagline under the name | The name says cost, which points at builders | Tiny | First release |
| 9 | Owner update that leads with the gap | It is the page the owner sees | Medium, needs 3 | Second release |
| 10 | Issues with open and closed status | The tester had this in an inspection app | Medium | Second release |
| 11 | Time and place recorded on every photo | The record may settle a dispute | Small to medium | Second release |
| 12 | Landing page in front of the app | For strangers, once the promise is true | Medium, drafted | Live Nov 25, ahead of 3 and 9 |
| 13 | Guide and tour rewritten for this user | Already overdue, see HANDOFF.md | Medium | After the first release. Both already cover the bill: two tour stops and a guide step |
| 14 | Payment periods: "since the last request" | How reps work month to month | Large | Later |
| 15 | Multi-page PDF with photos by line item | A file for the rep's records | Medium | Later |
| 16 | "What to look for" hints per line item | Makes a non-builder competent; the advice must be right | Medium | Later |
| 17 | Areas inside a line item, the tester's "sub folders" | The tester asked | Medium | Wait for the tester |
| 18 | Live link the owner can open | Nicer than a picture; needs server work | Large | Skip for now |

## The order of work

1. **The gate.** Idea 1, with idea 2 beside it. Not done: the owner chose on Nov 25 to build ideas 3 and 4 before the tester's answer.
2. **First release: make the promise true and say it.** Ideas 3 to 8. Ideas 3 and 4 are built; 5, 6, 8 and most of 7 are next.
3. **Second release: a record worth keeping.** Ideas 9, 10 and 11.
4. **The landing page** was to come here, when everything it claims exists. It went live first, on Nov 25. The comparison it describes is in the app since version 18; the owner update it names is not, until idea 9 or the wording in idea 7.

Merging edits from two phones, the hardest item in HANDOFF.md's open work, can wait: this user works alone.

## Not settled

- **The bottom tabs.** The screens use Home, Log, Parts, Bills and Owner update. That folds today's Cover and Report tabs into one and adds Bills. Version 18 left the tabs alone and put the bill inside Progress; whether they change later is still open.
- **The owner update's name.** The Report keeps its name for now. Renaming it was held for the wording pass, so all the words change at once.
- **Numbered and dated bills.** Version 18 keeps one running figure per line item. Bills as a set, like "Bill 2 · Oct 15", are drawn but not designed.
- **Sub folders.** The tester has not said whether they mean days, areas or stages.

## Settled

- **What happens to Costs** (Nov 25). Kept below: the data is untouched, and in a job with a bill the Costs card folds to one row at the bottom of the line item. A job with no bill shows costs as before.
- **How a bill is entered** (Nov 25). One running "billed to date" figure per line item, typed as a percent or an amount, overwritten by each new bill.
- **When the new numbers show** (Nov 25). Only in a job that has a bill. Someone who never enters one sees the app as it was.
- **A sample job already on a phone** (Nov 25). It is given the sample bill once. Nothing else stored on a phone is changed.
- **The landing page's place** (Nov 25). It replaces the front page, and the app lives at `/app/`. The front page passes on home-screen apps, emailed links and old links; HANDOFF.md says how.

## Notes for whoever builds the first release

- A job is one JSON object, on the phone and in the cloud, so a new field on a line item needs no database change: `billed` and `billedAt` went in that way. Keep old jobs working when a field is missing. One real company syncs a job, so `ct_projects` holds real data.
- The sample job is in `js/data.js` (`sampleProject`). The app's page is `app/index.html`. The job home, the line item screen and the new job form are in `js/ui.js`. Their actions are in `js/app.js`.
- The tour (`js/tour.js`) and the guide (`guide/index.html`) cover the bill but still use the old words, such as line item and report. Change them with the wording.
- Bump the version in the three places HANDOFF.md lists.
- `qa/walkthrough.js` ran clean on Nov 25 against a local copy of version 18 in Chromium. Nothing from versions 14 to 18 has been checked on a real phone.

## Where these pages came from

They were drawn on a Claude design canvas on Nov 25, 2026 and exported here as plain HTML, so they open in any browser with no tools. Edit them directly.

## Picking this up with Claude Code

Paste this after cloning the repo. The gate question had not been put to the tester as of Nov 25:

```text
I'm picking up CostTooling, a phone-first web app at costtooling.com. This folder is its repo.

Read HANDOFF.md first, then mockups/owner-side/README.md, and look at the pages in mockups/owner-side/.

Then tell me, briefly:
1. Where the live app stands and what version it is on.
2. What direction was chosen, and what is drawn but not built.
3. What is built, what is waiting on the tester, and what is not settled.
4. What you would do first, and why.

Do not change anything yet. Keep these rules for the whole session:
- The repo is public and every committed file is served on the site. Never commit names, emails, keys or customer data.
- The database and account functions live in the charitytooling repo. One live Supabase project serves two apps and there is no staging copy, so make no database change without asking me.
- A push to main deploys in about a minute. Bump the version as HANDOFF.md says when a script or stylesheet changes.
- Before building more of the first release, confirm with me the tester's answer to the gate question and the items under "Not settled".
- Keep HANDOFF.md current when a fact in it changes.
```
