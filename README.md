# Mendday

A self-directed personal growth programme. A long questionnaire, then a
twelve-week plan built from the answers, with daily tasks sized to the time
you actually have.

No account, no server, no network calls. Everything you type is stored in
your own browser and nothing leaves the device. The questions only work if
they are answered honestly, which is easier when nobody else can read them.

## How it works

**1 · The questionnaire** — up to 86 questions across 15 sections; sections
you have no use for are skipped. Ten dimensions get scored: emotional
steadiness, self-worth, communication, ownership, follow-through, body and
energy, direction, connection, presence and partnership. Plus what you want,
what derails you, how you respond to stress, your children if you have any,
and how many minutes a day you will realistically give this.

**2 · How you are with closeness** — two axes, fear of being left and
discomfort with closeness, which is the standard two-dimensional model in adult
attachment research. It is a lens over the plan rather than a scored dimension:
it changes the reading, and it gates a small set of tasks. The items were
written for this app on those constructs — **they are not the ECR-R or any
other validated questionnaire**, and the split is a plain midpoint rather than
a norm-referenced cutoff.

**3 · How much to trust it** — the plan is only as good as the self-report
under it, so the answers get checked for the three patterns that make a set of
responses mean less: using only one or two of the five options, answers within
one area scattering rather than agreeing, and agreeing with both a statement
and its opposite. Where it finds them it says so on the reveal, instead of
printing confident numbers over noise. Calibrated against simulated
respondents: 0% of honest profiles flagged, all of straight-lined, random,
alternating and acquiescent patterns caught.

**4 · The reading** — two *keystones* (the lowest-scoring things you also
said you cared about, with a weak physical or emotional floor promoted above
everything else) and one strength worth leaning on.

**5 · The plan** — twelve weeks in four three-week phases:

| Phase | Weeks | Focus |
|---|---|---|
| Stabilise | 1–3 | Sleep, daylight, movement, feeling something without acting on it |
| Look straight at it | 4–6 | Your patterns, in writing. The part most people quit in |
| Show up | 7–9 | Out of your head and into rooms with people in them |
| Make it yours | 10–12 | What survives after the plan ends |

Each phase weights its own base dimensions plus your keystones, and carries
its own milestones.

**6 · Daily tasks** — an *anchor* that repeats every day, plus a rotating mix
of practice drills, written reflection and outward action. The mix comes from
a rotating cycle rather than a fixed template, so a ten-minute commitment
still gets its turn at the written work.

**7 · The lessons** — 19 short pieces drawn from mainstream couples and
family research, mostly Gottman's observational work and Emotionally Focused
Therapy: bids for connection, the four horsemen, flooding, the pursue–withdraw
cycle, repair attempts, perpetual problems, what children take from your
arguments, the invisible mental load, co-parenting apart. One arrives on the
Today screen every third day, in a sequence that builds; the whole library is
browsable under Learn.

**8 · Tracking** — tick-off, streaks, an end-of-day mood and energy line, a
journal that collects everything you write, and a re-score at the end of each
phase so you can see which dimensions actually moved.

### How tailored is it, really

Measured rather than claimed — `test/tailoring.mjs` guards these:

- 200 simulated people produced **200 distinct day-by-day plans**; none repeated
- two random people share about **half** their tasks over twelve weeks
- the same stated goals with a different weak spot give **different keystones**
- a genuinely low score **outranks a stated goal** — saying you want to work on
  something does not override scoring badly somewhere else

And the honest limits:

- the **four phases, their names, order and text are identical for everyone**.
  The structure is shared; the emphasis and the daily work are not
- **milestone wording per dimension is fixed** — the selection varies, the
  sentences do not
- with **flat scores the stated goals decide** the keystones outright, because
  there is nothing else to separate them
- it is **self-report**, with everything that implies. The check in step 3 finds
  careless answering; it cannot find a confident, coherent, self-flattering
  respondent, and no questionnaire can

### Tracks

Content is gated to what applies to you, so nobody gets tasks about a partner
they do not have:

| Track | Turned on by | Adds |
|---|---|---|
| `relationship` | a rupture you want to repair | ownership and space-giving work |
| `partner` | having a partner, or wanting one back | the couples skills and lessons |
| `parenting` | having children | mental load, repair in front of them, co-parenting |
| `att_*` | a non-secure attachment profile | the specific work for that pattern |

Dimensions drive the daily *drills*; tracks drive the *reading*. That split is
deliberate — it means a parent whose keystones land on, say, follow-through
still gets the parenting material.

## Talking to it

There is an MCP server in [`mcp/`](mcp/README.md) that hands your plan to
Claude — in Claude Desktop, Claude Code, or anywhere else that speaks MCP — so
a conversation about a bad week can change what tomorrow says. It reads and
writes one backup file; it never rewrites the plan itself, only lays dated,
attributed adjustments over it that you can see and undo under **You →
Changes**.

This is deliberately not an embedded chatbot: no API key, no per-message cost,
and nothing about your journal goes anywhere except the file on your own
machine.

## Deploying it

`node build.mjs` produces **`docs/`** — exactly the files a host should serve
and nothing else. Deploy that folder, never the repository root: a host pointed
at the root will try to publish `node_modules` too, and on Cloudflare that
includes the 145 MiB `workerd` binary its own build installs, which blows past
the 25 MiB per-file limit.

- **Cloudflare, from git** — `wrangler.jsonc` already points at `./docs`, so
  connect the repo and deploy. Works with a private repo.
- **Cloudflare, without git** — `npm run package` zips `docs/` with `index.html`
  at the archive root, ready for Pages → Upload assets. Useful from a phone, and
  it means a deployment can carry no repository history at all.
- **GitHub Pages** — Settings → Pages → your branch, folder **`/docs`**.
  Needs a public repo unless you're on a paid plan.

`docs/` is committed, so neither host needs to run a build. If you change
anything under `src/`, run `node build.mjs` and commit the result — the build
fails if a file the service worker caches is missing from `docs/`.

## Installing it on a phone

The app is a PWA, so it installs from the browser with no App Store involved.
Serve it over HTTPS (GitHub Pages works), open it in Safari on iOS, then
**Share → Add to Home Screen**. You get a real icon, it launches without
browser chrome, and it works offline.

iOS exempts home-screen web apps from the seven-day script-storage eviction
that applies to ordinary Safari tabs, so your data persists — but it is still
only on that device, so take a backup from the You tab if it matters.

## On the relationship track

If you pick the relationship goal, the plan works on you and not on the other
person. There are no scripts for producing a particular response from someone,
and that is a design decision rather than squeamishness: tactics aimed at a
person tend to be visible, and they do not survive contact with a real
relationship. What is there instead is steadiness under pressure, hearing
something hard without defending, naming your part without an excuse attached,
respecting a stated boundary, and building a life that is not resting entirely
on one answer.

Mendday is a structured self-directed programme, not therapy and not a
substitute for it.

## Running it

Open `index.html` through any static server:

```sh
python3 -m http.server 8000     # then visit localhost:8000
```

Or build the single-file versions:

```sh
node build.mjs
```

- `dist/standalone.html` — a complete page you can open straight from disk or
  put on any host
- `dist/mendday.html` — the same page as an Artifact fragment

## Tests

End-to-end, driven in a real browser:

```sh
npm install
node build.mjs
python3 -m http.server 8123 &
APP_URL=http://localhost:8123/index.html node test/smoke.mjs   # whole quiz, a ticked day, the reading, a reload
node test/deep.mjs                                            # mid-plan, the re-score, dark, desktop
APP_URL=http://localhost:8123/index.html node test/pwa.mjs     # installability and offline
node test/persistence.mjs                                     # kills the page mid-action
APP_URL=http://localhost:8123/index.html node test/backup.mjs  # all four save routes, and restore
node test/tailoring.mjs                                       # the tailoring and scoring claims
node test/mcp.mjs                                             # drives the MCP server over stdio
node test/insight.mjs                                        # counting, and that it cannot leak
```

`smoke` and `pwa` need the app served over http — a service worker will not
register on `file://`.

Screenshots land in `$SHOT_DIR` (default `/tmp/mendday-shots`).

## Layout

```
src/data/quiz.js      65 questions, and how each maps to a dimension
src/data/tasks.js     the task library, tagged by dimension, phase and minutes
src/data/lessons.js   the reading, tagged by track and delivered in sequence
src/data/phases.js    the four-phase arc, milestones, dimension copy
src/engine/engine.js  scoring, plan generation, daily task selection
src/store.js          localStorage persistence, export and restore
src/backup.js         saving to a file — share sheet, picker, download, clipboard
src/insight.js        milestone counting — the only code that touches a network
analytics/worker.js   the counter itself: seven words in, a funnel out
mcp/server.mjs        the MCP server: eight tools over one backup file
src/ui/quiz-ui.js     welcome, quiz, plan reveal
src/ui/app-ui.js      today, plan, learn, progress, journal, settings, routing
build.mjs             bundles into dist/ and assembles the deployable docs/
wrangler.jsonc        tells Cloudflare to serve docs/, not the repo root
sw.js                 service worker — offline only, never touches your data
manifest.webmanifest  makes it installable
```

Scoring and task selection are deterministic: the same answers and the same
date always produce the same plan and the same day.

## Your data

### Saving

There is no save button. Every change is written to `localStorage` the moment
it happens — a ticked task, a choice in the quiz, a mood score, a lesson you
opened. Typing is written 350ms after you stop, immediately when you tap
anything else, and again when the app is backgrounded or the screen locks
(`visibilitychange` and `pagehide`, since neither swiping an app away nor
locking a phone fires `unload`).

A re-score you abandon half way is kept as a draft, so closing the app in the
middle of it loses nothing.

`test/persistence.mjs` covers this by destroying the page mid-action, with no
graceful shutdown, and checking the data is still there on the next load.

### Counting

There is one exception to "nothing leaves your device", and only where the app
is deployed with a counter endpoint configured — [`analytics/`](analytics/README.md).
Seven fixed words get counted: starting the quiz, finishing it, opening from a
home screen, reaching day 7, 30 and 84, and completing a re-score. Each fires
once ever, per device.

No identifier, no session, no scores, nothing anyone typed. The worker accepts
those seven words and rejects everything else before it reaches storage, so a
bug or a tampered client cannot turn it into a data collector — `test/insight.mjs`
proves it by trying to smuggle an email, a journal entry and an id through a
valid ping.

It's off entirely unless an endpoint is configured, honours Do Not Track and
Global Privacy Control, and has an off switch under **You**.

### Where it lives

`localStorage` under `mendday.v1`, on that one device in that one browser.
Nothing syncs. Safari and Chrome do not share it, and neither do your phone
and your laptop. If storage is unavailable altogether — a private window, site
data blocked — the app still runs, it just cannot remember anything.

### Backups, and why there is no iCloud sync

There is no iCloud API for the web, so a web app cannot sync to iCloud by
itself. The version that could would need a server holding your journal, which
is the thing this app is built to avoid. What it does instead is make saving a
file somewhere you control as close to one tap as the platform allows.

**You → Backup** picks the best route the browser offers:

| Route | Where | What happens |
|---|---|---|
| `navigator.share` | Safari on iOS, incl. installed | The share sheet — **Save to Files → iCloud Drive**, then it syncs like any other file |
| `showSaveFilePicker` | Chrome / Edge on desktop | Choose a file. The handle is kept, so it can be rewritten automatically after that |
| download | most other browsers | A plain `mendday-backup.json` |
| `claude.use("downloads")` | the claude.ai artifact viewer | Ordinary downloads are blocked there, so the viewer's own save prompt is used |
| clipboard | anywhere framed with no save route | The JSON goes to the clipboard instead |

**Keep a file updated automatically** appears only where the File System
Access API exists — Chrome and Edge on desktop. Point it at a file inside your
iCloud Drive folder and every change is written straight through. Safari has no
equivalent, so this does not appear on an iPhone.

Restore is a file picker, which on iOS can browse iCloud Drive. It is offered
on the welcome screen as well as in settings, because a new phone has no
navigation bar to reach settings through.

The app nags you to back up once there is something worth losing — three
journal entries or a week of logged days — and again every fortnight after
that.
