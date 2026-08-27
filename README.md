# Museschool

A self-directed personal growth programme. A long questionnaire, then a
twelve-week plan built from the answers, with daily tasks sized to the time
you actually have.

No account, no server, no network calls. Everything you type is stored in
your own browser and nothing leaves the device. The questions only work if
they are answered honestly, which is easier when nobody else can read them.

## How it works

**1 · The questionnaire** — 65 questions across 12 sections. Nine dimensions
get scored: emotional steadiness, self-worth, communication, ownership,
follow-through, body and energy, direction, connection and presence. Plus
what you want, what derails you, how you respond to stress, and how many
minutes a day you will realistically give this.

**2 · The reading** — two *keystones* (the lowest-scoring things you also
said you cared about, with a weak physical or emotional floor promoted above
everything else) and one strength worth leaning on.

**3 · The plan** — twelve weeks in four three-week phases:

| Phase | Weeks | Focus |
|---|---|---|
| Stabilise | 1–3 | Sleep, daylight, movement, feeling something without acting on it |
| Look straight at it | 4–6 | Your patterns, in writing. The part most people quit in |
| Show up | 7–9 | Out of your head and into rooms with people in them |
| Make it yours | 10–12 | What survives after the plan ends |

Each phase weights its own base dimensions plus your keystones, and carries
its own milestones.

**4 · Daily tasks** — an *anchor* that repeats every day, plus a rotating mix
of practice drills, written reflection and outward action. The mix comes from
a rotating cycle rather than a fixed template, so a ten-minute commitment
still gets its turn at the written work.

**5 · Tracking** — tick-off, streaks, an end-of-day mood and energy line, a
journal that collects everything you write, and a re-score at the end of each
phase so you can see which dimensions actually moved.

## On the relationship track

If you pick the relationship goal, the plan works on you and not on the other
person. There are no scripts for producing a particular response from someone,
and that is a design decision rather than squeamishness: tactics aimed at a
person tend to be visible, and they do not survive contact with a real
relationship. What is there instead is steadiness under pressure, hearing
something hard without defending, naming your part without an excuse attached,
respecting a stated boundary, and building a life that is not resting entirely
on one answer.

Museschool is a structured self-directed programme, not therapy and not a
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
- `dist/museschool.html` — the same page as an Artifact fragment

## Tests

End-to-end, driven in a real browser:

```sh
npm install
node build.mjs
node test/smoke.mjs    # whole quiz through to a ticked day, then a reload
node test/deep.mjs     # mid-plan state, the phase-end re-score, dark, desktop
```

Screenshots land in `$SHOT_DIR` (default `/tmp/museschool-shots`).

## Layout

```
src/data/quiz.js      65 questions, and how each maps to a dimension
src/data/tasks.js     the task library, tagged by dimension, phase and minutes
src/data/phases.js    the four-phase arc, milestones, dimension copy
src/engine/engine.js  scoring, plan generation, daily task selection
src/store.js          localStorage persistence, export and restore
src/ui/quiz-ui.js     welcome, quiz, plan reveal
src/ui/app-ui.js      today, plan, progress, journal, settings, routing
build.mjs             bundles the above into dist/
```

Scoring and task selection are deterministic: the same answers and the same
date always produce the same plan and the same day.

## Your data

It lives in `localStorage` under `museschool.v1` and nowhere else. Clearing
site data or moving to another device loses it — **You → Copy backup** puts
the whole thing on your clipboard as JSON, and **Restore backup** takes it
back.
