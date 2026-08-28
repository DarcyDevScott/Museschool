# Mendday — where the project is

Written to bring a fresh machine, or a fresh Claude, fully up to speed.
The complete source is in `SOURCE.md`; this explains what it is and why.

---

## 1. What it is

A self-directed personal growth programme that runs entirely in the browser.
Someone answers a long questionnaire, gets a reading of where they actually
are, and then a twelve-week plan with daily tasks sized to the time they said
they have.

Three things make it different from the paid apps in this space:

- **Free, with no account.** No signup, no email, no premium tier.
- **Nothing they write leaves the device.** There is no server and no database.
  Answers, journal, scores and progress live in `localStorage`.
- **It tells them when not to trust it.** The response-quality check flags
  careless or contradictory answering instead of printing a confident score
  over noise. No competitor does this.

It began as one person's tool for a specific situation — a relationship
breakdown, two children — and was generalised. The relationship material is
deliberately built around the user's own regulation, accountability and repair
skills rather than tactics aimed at another person.

---

## 2. Status

| | |
|---|---|
| Domain | `mendday.com`, on Cloudflare Registrar, WHOIS privacy on |
| App | Live. Deployed to Cloudflare Pages by zip upload |
| Landing page | Built, not yet deployed |
| Intended split | `mendday.com` → landing, `app.mendday.com` → the app |
| Repository | `github.com/DarcyDevScott/Museschool`, private, branch `claude/personal-growth-plan-builder-l65xsw` |
| Milestone counting | Written and tested, **not deployed** |
| Content | 86 questions, 10 dimensions, 135 tasks, 19 lessons |
| Tests | 7 suites, all passing |

**The repository is the loose end.** Every commit is authored with a real name
and email, which cannot be edited out — only rewritten or abandoned. The plan
is a fresh repository under a new account with a single initial commit. Until
then, deployment is by zip upload, which sidesteps git entirely.

---

## 3. Stack, and why

No framework, no build step for the app itself, no server, no database, no
dependencies at runtime. Plain ES5-flavoured JavaScript attached to one global
`MS` namespace, loaded as classic scripts in order.

This is deliberate:

- **Zero marginal cost per user.** Static files on a CDN. A hundred thousand
  users cost the same as one. That is what makes "free, forever" survivable.
- **Nothing to breach.** No server means no database of people's journals about
  their marriages and their children.
- **Works offline.** A service worker caches the shell, so the app opens on a
  train with no signal.
- **Nothing to maintain.** No dependency upgrades, no framework churn.

Node is used only for the build, the tests and the MCP server — never at
runtime.

---

## 4. Repository map

```
index.html              app shell; loads src/* as classic scripts in order
sw.js                   service worker — offline only, never touches user data
manifest.webmanifest    makes it installable
build.mjs               bundles dist/* and assembles the deployable docs/
rename.mjs              one-command rebrand across every file
make-source-md.mjs      regenerates SOURCE.md
wrangler.jsonc          tells Cloudflare to serve docs/, never the repo root

src/data/quiz.js        86 questions across 15 sections, and how each maps
src/data/tasks.js       135 tasks, tagged by dimension, phase, minutes, track
src/data/lessons.js     19 lessons, tagged by track, delivered in sequence
src/data/phases.js      the four-phase arc, milestones, per-dimension copy
src/engine/engine.js    scoring, keystones, plan generation, daily selection,
                        adjustments, attachment, response quality
src/store.js            localStorage persistence, export and restore
src/backup.js           saving to a file — share sheet, picker, download, viewer
src/insight.js          milestone counting; the only code that touches a network
src/ui/quiz-ui.js       welcome, quiz, the plan reveal
src/ui/app-ui.js        today, plan, learn, progress, journal, settings, routing
src/styles.css          one stylesheet; light and dark defined at token level

landing/index.html      the landing page (real copy, deliberately under-designed)
analytics/worker.js     the milestone counter: seven words in, a funnel out
mcp/server.mjs          MCP server — lets Claude read and adjust a plan
brand/                  the logo and where each asset is used
icons/                  app icons, generated from the logo
docs/                   THE DEPLOYABLE. Built by build.mjs. Never deploy the root
test/                   seven suites, described in section 11
```

---

## 5. The content model

### Ten dimensions

`regulation`, `worth`, `communication`, `ownership`, `consistency`, `vitality`,
`purpose`, `connection`, `presence`, `partnership`.

Each is scored 0–100 from 4–6 Likert items, some reverse-worded. A dimension
whose section the user never saw is excluded entirely rather than defaulting
to a neutral 50 — otherwise a skipped section could produce a keystone.

### Attachment, as a lens rather than a dimension

Two axes — fear of being left, discomfort with closeness — the standard
two-dimensional model in adult attachment research. Split at the midpoint into
secure / anxious / avoidant / fearful.

It is deliberately **not** a scored dimension: a style is not a skill to be
ranked and improved. It shapes the reading and gates a small set of tasks.

**The items were written for this app on those constructs. They are not the
ECR-R or any validated instrument, and the app says so where the result is
shown.** Reproducing a real instrument was the alternative, but the
authoritative item text could not be verified, and shipping a half-remembered
scale under a validated name would be worse than writing honest ones.

### Tracks

Content is gated so nobody gets tasks about a partner or children they do not
have:

| Track | Turned on by |
|---|---|
| `relationship` | a rupture they want to repair |
| `partner` | having a partner, or wanting one back |
| `parenting` | having children |
| `att_anxious` / `att_avoidant` / `att_fearful` | a non-secure attachment profile |

**Dimensions drive the daily drills; tracks drive the reading.** That split
matters — without it, a parent whose keystones land on follow-through gets
almost no parenting content, which was a real bug during development.

### Four phases, twelve weeks

1. **Stabilise** (weeks 1–3) — sleep, daylight, movement, feeling something
   without acting on it. The best-evidenced material, and the least impressive.
2. **Look straight at it** (4–6) — patterns, in writing. Most people quit here.
3. **Show up** (7–9) — out of the journal and into rooms with people in them.
4. **Make it yours** (10–12) — what survives after the plan ends.

### Lessons

19 short pieces from mainstream couples and family research — Gottman's
observational work on bids, the four horsemen, flooding, repair, perpetual
problems; Sue Johnson's pursue–withdraw cycle; and the parenting literature on
conflict, repair in front of children, the mental load and co-parenting apart.

One arrives on the Today screen every third day, in an order that builds. The
whole library is browsable under Learn. It carries a standing note that this is
educational material rather than therapy, that couples work needs both people,
and that where there is fear or coercion the standard advice does not apply.

---

## 6. How a plan is actually built

1. **Score** each dimension: sum the Likert answers, reverse the reversed ones,
   normalise to 0–100. That is all a score is — an average, rescaled. It is not
   norm-referenced and there is no comparison population.

2. **Pick two keystones.** Rank by urgency = score, minus 22 if it is a stated
   goal, minus 15 if it is the primary goal, minus 20 more if regulation or
   vitality is below 40 (a weak floor outranks everything). Lowest two win.
   A genuinely low score beats a stated goal; with flat scores the goals decide
   outright, which is a real limit and is stated in the README.

3. **Pick a strength** — the highest-scoring dimension that is not a keystone.

4. **Build four phases.** Each takes its own base dimensions plus the
   keystones, topped up to a minimum of three so no phase is thin.

5. **Each day**, select tasks: the anchors always, a lesson every third day,
   then fill from a rotating category cycle sized by the remaining minutes.
   The cycle is what keeps a ten-minute commitment getting its turn at the
   written work; a fixed template starved it.

Everything is deterministic — the same answers and the same date always produce
the same plan and the same day.

### The adjustments layer

Changes laid *over* the generated plan, never rewriting it: a note, an eased
day, an added or dropped task, a temporary change of focus. Each is dated,
attributed, carries its reason, and is undoable under **You → Changes**. This
is what lets a conversation with Claude actually move the plan.

### The response-quality check

Looks for three patterns that make a set of answers mean less: using only one
or two of the five options, answers within one dimension scattering instead of
agreeing, and agreeing with both a statement and its opposite. Calibrated
against simulated respondents — no honest profile flagged across five styles
and 1500 runs; straight-lined, random, alternating and acquiescent patterns all
caught.

It cannot catch a confident, coherent, self-flattering respondent. Nothing can.

---

## 7. Storage and privacy

Everything lives in `localStorage` under `mendday.v1`, on one device in one
browser. Nothing syncs. If storage is unavailable the app still runs, it just
cannot remember.

**Saving is automatic.** Every change writes immediately; typing writes 350ms
after the last keystroke, on the next tap, and again when the app is
backgrounded or the screen locks — because neither swiping an app away nor
locking a phone fires `unload`. A half-finished re-score is kept as a draft.

**Backup** picks the best route the browser offers: `navigator.share` on iOS
(the share sheet → Save to Files → iCloud Drive), `showSaveFilePicker` on
desktop Chrome and Edge with the handle remembered for automatic rewrites, a
plain download elsewhere, and the viewer's own save prompt inside an embedded
artifact. Restore is a file picker, offered on the welcome screen as well as in
settings — a new phone has no navigation bar to reach settings through.

The app nags for a backup once there is something worth losing, then fortnightly.

**One remaining leak:** both the app and the landing page load fonts from
Google, so Google sees an IP on every visit. Self-hosting the two families
closes it. Worth doing before marketing on privacy.

---

## 8. The MCP server

`mcp/server.mjs` hands a plan to whichever Claude the user is already talking
to — Claude Desktop, Claude Code, anywhere that speaks MCP. It is not an LLM
and holds no key.

Eight tools: read the plan, a day, or what has actually been happening; search
the task library; leave a note, ease a day, add or drop a task, refocus the
drills; list and undo; write to the journal. It never rewrites the plan, and
the tests assert that answers, log and plan come back byte-identical.

It works on one backup file. On desktop the app can keep that file updated
automatically; on iPhone it is a manual **Restore from a file**, because Safari
cannot read a file on its own and there is no server in this design to poll.

---

## 9. Milestone counting

Written and tested, **not yet deployed.**

Page views come free from Cloudflare's own analytics. The pings cover only what
Cloudflare cannot see, because an installed app opened offline never touches a
server: started the quiz, finished it, opened from a home screen, reached day
7 / 30 / 84, re-scored.

The worker accepts **seven fixed words** and rejects everything else before
storage. That is structural, not policy — the test proves it by smuggling an
email, a journal entry and an id through an otherwise valid ping. Each
milestone fires once ever per device. The client is inert unless an endpoint is
configured, honours Do Not Track and Global Privacy Control, and has an off
switch.

Deploying it changes the claim from "nothing is sent" to a precise version, and
the welcome screen already carries that wording.

---

## 10. Deployment

**Never deploy the repository root.** Cloudflare installs wrangler during its
build, which drops a 145 MB `workerd` binary into `node_modules`, and the
upload dies on a 25 MB per-file cap. `.gitignore` does not help — those files
are created during the build.

`node build.mjs` produces **`docs/`**: exactly the files a host should serve,
nothing else. `wrangler.jsonc` points at it, and `/docs` is also a folder
GitHub Pages serves directly, so one layout covers both hosts. The build fails
if any file the service worker caches is missing from `docs/` — that bug would
ship a site that works online and breaks offline.

Current method is zip upload through the Cloudflare dashboard, which needs no
terminal and no git. `mendday-site.zip` and `mendday-landing.zip` are built by
the `package:*` npm scripts.

**Moving the app to a subdomain needs no code changes** — every path is
relative and the manifest scope is `"./"`. But `localStorage` is per-origin, so
anyone who used it at the apex must back up and restore.

---

## 11. Tests

| Suite | Covers |
|---|---|
| `tailoring.mjs` | that different people get different plans, that scores beat stated goals, the attachment lens, the response-quality calibration |
| `mcp.mjs` | all eight MCP tools over a real stdio transport, the untouched-data guarantees, five kinds of bad input |
| `insight.mjs` | counting, and that it cannot be made to store anything else |
| `smoke.mjs` | the whole quiz through to a ticked day, the reading, then a reload |
| `persistence.mjs` | destroys the page mid-action and checks the data survived |
| `pwa.mjs` | install metadata, icon resolution, a full offline boot |
| `backup.mjs` | all four save routes, restore, a corrupt file refused |

`npm test` runs the fast engine ones; `npm run test:browser` runs the
Playwright ones. The browser suites need the app served over http — a service
worker will not register on `file://`.

---

## 12. Brand

- `brand/logo-full.png` — the kintsugi logo: a broken vessel repaired with gold.
  Conceptually the right mark; that idea is the app's whole argument.
- `icons/` — square crops of it, with a light unsharp mask below 256px. The
  leaves and figure soften at the 60px a home screen renders; the disc and gold
  veins still read. Accepted trade.
- The hero is WebP at 24 KB with a JPEG fallback. PNG was 375 KB for something
  displayed 340px wide.

**Open decision.** A second logo direction exists — a white silhouette version.
It is mechanically better (a silhouette recolours onto any background, solving
the dark-plate problem) but conceptually weaker: it has no kintsugi in it, so
the mend is gone from a product called Mendday. The silhouette extracts cleanly
from its glow and tints well in the app's pine and cream. Not decided.

**Also unresolved:** the logo is dark and luxe; the app is a pale field logbook
in cool drafting paper, pine and ochre. They are currently two different visual
products. One has to move to the other or the seam shows when someone taps
through from the site to the app.

---

## 13. Identity

Intended to be a brand not fronted by a person. Cleaned: no name, email or
machine path anywhere in the tracked files.

**Not cleaned, and not cleanable:** every commit is authored with a real name
and email. The fix is a fresh repository with a single commit, not a rewrite.

**Worth being precise:** this makes it *not publicly linked*, not untraceable.
The registrar, Cloudflare and the card that paid for the domain all know who
the owner is. WHOIS privacy hides it from the public, not from them.

---

## 14. The plan

**Now**
1. Split the deployment: `app.mendday.com` for the app, `mendday.com` for the
   landing page. Back up any existing local data first.
2. Decide the logo direction, then reconcile the palettes.
3. Design the landing page. The copy is written and is real; the styling is
   deliberately plain so it is built on rather than fought.

**Then**
4. Self-host the fonts. Last thing undercutting the privacy claim.
5. Deploy the milestone counter, so there is a funnel rather than a guess.
6. Fresh repository under the new account, one commit, no history.

**Distribution** — free, so paid ads are pure cost with no return. The plan is
organic:

- **SEO first.** The 19 lessons are already-written articles on high-volume
  searches — "how to be a better partner", "what children learn from parents
  arguing", "mental load in relationships". The results that currently rank are
  thin. This compounds and costs nothing.
- **Short-form video.** The ideas are the hooks. Faceless works.
- **Reddit.** Post the content, not the app.

Explicitly ruled out: AI-generated testimonials. Fabricated endorsements are an
ASA and FTC problem, and they are exactly what this product was built against.

---

## 15. Things that bit us

Kept so they are not re-broken:

- **A fixed daily template starved the ten-minute tier of written work.** Now a
  rotating category cycle.
- **The `focus` adjustment was a no-op** — it reordered the day's dimension list,
  but selection filters by that list and then sorts by a stable hash, so
  ordering changed nothing. It now narrows the pool.
- **The response-quality check was calibrated backwards** — it flagged consistent
  respondents and passed pure random answering, because it counted runs of
  identical answers and adjacent items share a dimension. Now it measures
  spread across the whole set and coherence within each dimension.
- **The re-score used one question per dimension**, snapping every score to a
  quintile. Two now, averaged.
- **Typing then tapping a meter blanked the field on screen** and the next edit
  would save over it. Clicks now flush the pending write first.
- **A backup could not be restored on a fresh install** — the nav bar only exists
  once a plan does, so restoring meant answering 86 questions to reach settings.
- **A source file was added to the service worker's cache list without bumping
  its version**, which would have served a stale shell to anyone already
  installed. The build now fails if the two disagree.
- **A test asserted a focused day drills one dimension on `TODAY+2`** — a rest
  day on a six-day plan depending on the weekday. It passed Thursday and failed
  Friday.

---

## 16. Working on it

```sh
npm install
node build.mjs                  # dist/ and docs/
python3 -m http.server 8123     # then localhost:8123
npm test                        # fast engine tests
npm run test:browser            # the Playwright suites
node rename.mjs <NewName>       # rebrand everything in one command
node make-source-md.mjs         # regenerate SOURCE.md
```

Editing anything in `src/` means rebuilding, because `docs/` is what deploys.
