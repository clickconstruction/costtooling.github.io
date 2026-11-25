# The owner's side: plan and mockups

Chosen Nov 25, 2026. **Drawn, not built.** The live app has none of this. Open `index.html` in this folder to see every screen, or https://costtooling.com/mockups/owner-side/ once it is deployed.

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

## The screens

| File | What it shows | Ideas |
| --- | --- | --- |
| `welcome.html` | The welcome card rewritten around the promise, with the tagline | 6, 8 |
| `home.html` | Job home: in place, billed, billed ahead, days left, and a "Check before you pay" card | 3, 4, 7 |
| `item.html` | One part of the job: the slider for what you saw, and a new card for what the contractor billed | 3 |
| `paste.html` | New job: paste the lines from the contractor's bill and see what was read | 5 |
| `landing.html` | Landing page, first draft, with the owner update as the hero | 12 |

The sample numbers are the app's sample job, with one change: the contractor has billed Framing at 100% while 85% is in place. That is $3,420 billed ahead on a $22,800 line, so the job is 36% in place and 38% billed.

## Every idea that was weighed

The test for each: does it help this person say whether the bill matches the building?

| # | Idea | Why it matters | Effort | Call |
| --- | --- | --- | --- | --- |
| 1 | Ask the tester who gets the report and what they decide | Confirms or sinks the direction | Free | Before anything |
| 2 | Find two or three more owner's side testers | One tester is not a market | Low | Alongside |
| 3 | Billed against in place, per line item | It is the promise, and the app cannot do it yet | Medium | First release |
| 4 | Sample job where the bill runs ahead of the work | A visitor sees the point with no words | Small, needs 3 | First release |
| 5 | Paste in the contractor's line items | Setting up a real job is the barrier | Small | First release |
| 6 | Welcome card rewrite | It is the whole first impression today | Small | First release |
| 7 | Words: "Billed", "Owner update", "parts of the job" | The app speaks builder, not owner | Small | First release |
| 8 | Tagline under the name | The name says cost, which points at builders | Tiny | First release |
| 9 | Owner update that leads with the gap | It is the page the owner sees | Medium, needs 3 | Second release |
| 10 | Issues with open and closed status | The tester had this in an inspection app | Medium | Second release |
| 11 | Time and place recorded on every photo | The record may settle a dispute | Small to medium | Second release |
| 12 | Landing page in front of the app | For strangers, once the promise is true | Medium, drafted | After 3 and 9 |
| 13 | Guide and tour rewritten for this user | Already overdue, see HANDOFF.md | Medium | After the first release |
| 14 | Payment periods: "since the last request" | How reps work month to month | Large | Later |
| 15 | Multi-page PDF with photos by line item | A file for the rep's records | Medium | Later |
| 16 | "What to look for" hints per line item | Makes a non-builder competent; the advice must be right | Medium | Later |
| 17 | Areas inside a line item, the tester's "sub folders" | The tester asked | Medium | Wait for the tester |
| 18 | Live link the owner can open | Nicer than a picture; needs server work | Large | Skip for now |

## The order of work

1. **The gate.** Idea 1, with idea 2 beside it.
2. **First release: make the promise true and say it.** Ideas 3 to 8.
3. **Second release: a record worth keeping.** Ideas 9, 10 and 11.
4. **Then the landing page,** when everything it claims exists.

Merging edits from two phones, the hardest item in HANDOFF.md's open work, can wait: this user works alone.

## Not settled

- **The bottom tabs.** The screens use Home, Log, Parts, Bills and Owner update. That folds today's Cover and Report tabs into one and adds Bills. It follows from the direction, but the owner has not confirmed it.
- **What happens to Costs.** A line item tracks what a builder spent today. The screens replace that card with what was billed. Decide whether costs are removed, hidden or kept below.
- **How a bill is entered.** The screens take a percent or an amount per part, per bill. Whether bills are numbered and dated as a set, like "Bill 2 · Oct 15", is drawn but not designed.
- **Sub folders.** The tester has not said whether they mean days, areas or stages.
- **The landing page's place.** The site opens straight into the app today. The draft does not decide whether the landing page replaces that or sits beside it.

## Notes for whoever builds the first release

- A job is one JSON object, on the phone and in the cloud, so a new field on a line item needs no database change. Keep old jobs working when the field is missing. One real company syncs a job, so `ct_projects` holds real data.
- The sample job is in `js/data.js` (`sampleProject`). The job home, the line item screen and the new job form are in `js/ui.js`. Their actions are in `js/app.js`.
- The tour (`js/tour.js`) and the guide (`guide/index.html`) still describe the old words. Change them in the same release.
- Bump the version in the three places HANDOFF.md lists.
- Nothing from versions 14 to 16 was checked by eye or on a real phone. `qa/walkthrough.js` was edited for those versions and never run.

## Where these pages came from

They were drawn on a Claude design canvas on Nov 25, 2026 and exported here as plain HTML, so they open in any browser with no tools. Edit them directly.

## Picking this up with Claude Code

Paste this after cloning the repo:

```text
I'm picking up CostTooling, a phone-first web app at costtooling.com. This folder is its repo.

Read HANDOFF.md first, then mockups/owner-side/README.md, and look at the pages in mockups/owner-side/.

Then tell me, briefly:
1. Where the live app stands and what version it is on.
2. What direction was chosen, and what is drawn but not built.
3. What is waiting on the tester, and what is not settled.
4. What you would do first, and why.

Do not change anything yet. Keep these rules for the whole session:
- The repo is public and every committed file is served on the site. Never commit names, emails, keys or customer data.
- The database and account functions live in the charitytooling repo. One live Supabase project serves two apps and there is no staging copy, so make no database change without asking me.
- A push to main deploys in about a minute. Bump the version as HANDOFF.md says when a script or stylesheet changes.
- Before building the first release, confirm with me the tester's answer to the gate question and the items under "Not settled".
- Keep HANDOFF.md current when a fact in it changes.
```
