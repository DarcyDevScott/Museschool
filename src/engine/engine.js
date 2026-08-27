/* Museschool — scoring, plan generation and daily task selection.
 * Everything here is deterministic: the same answers and the same date
 * always produce the same plan and the same day.
 */
(function (MS) {
  'use strict';

  var PHASE_DAYS = 21;   // three weeks per phase
  var TOTAL_DAYS = 84;   // twelve weeks

  MS.PHASE_DAYS = PHASE_DAYS;
  MS.TOTAL_DAYS = TOTAL_DAYS;

  /* ---------- dates ---------- */

  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function fromKey(k) {
    var p = k.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  // Whole days between two day-keys, immune to daylight saving shifts.
  function daysBetween(fromK, toK) {
    var a = fromKey(fromK), b = fromKey(toK);
    return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
                       Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
  }

  function addDays(k, n) {
    var d = fromKey(k);
    d.setDate(d.getDate() + n);
    return dayKey(d);
  }

  MS.dayKey = dayKey;
  MS.fromKey = fromKey;
  MS.daysBetween = daysBetween;
  MS.addDays = addDays;

  /* ---------- deterministic pseudo-randomness ---------- */

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0);
  }
  MS.hash = hash;

  /* ---------- scoring ---------- */

  /* Turns scale answers into a 0-100 score per dimension.
   * Dimensions with no answers come back at 50 so they neither
   * dominate nor disappear from the ranking. */
  /* Which dimensions the answers actually cover. A section the user never saw
   * (no children, no partner) must not produce a keystone. */
  MS.answeredDims = function (answers) {
    var seen = {};
    MS.QUIZ.forEach(function (section) {
      section.questions.forEach(function (q) {
        if (q.type === 'scale' && typeof answers[q.id] === 'number') seen[q.dim] = true;
      });
    });
    var keys = MS.DIM_KEYS.filter(function (k) { return seen[k]; });
    return keys.length ? keys : MS.DIM_KEYS.slice();
  };

  MS.score = function (answers) {
    var sums = {}, counts = {};
    MS.DIM_KEYS.forEach(function (k) { sums[k] = 0; counts[k] = 0; });

    MS.QUIZ.forEach(function (section) {
      section.questions.forEach(function (q) {
        if (q.type !== 'scale') return;
        var v = answers[q.id];
        if (typeof v !== 'number') return;
        if (q.reverse) v = 6 - v;
        sums[q.dim] += v;
        counts[q.dim] += 1;
      });
    });

    var out = {};
    MS.DIM_KEYS.forEach(function (k) {
      out[k] = counts[k]
        ? Math.round(((sums[k] - counts[k]) / (4 * counts[k])) * 100)
        : 50;
    });
    return out;
  };

  /* ---------- plan generation ---------- */

  function pickKeystones(scores, answers) {
    var goals = Array.isArray(answers.goals) ? answers.goals : [];
    var primary = answers.primaryGoal;

    var ranked = MS.answeredDims(answers).map(function (k) {
      var urgency = scores[k];                       // lower score = more urgent
      if (goals.indexOf(k) !== -1) urgency -= 22;    // they asked for this
      if (primary === k) urgency -= 15;              // they asked for it most
      // A weak floor outranks everything: you cannot do the rest without it.
      if ((k === 'vitality' || k === 'regulation') && scores[k] < 40) urgency -= 20;
      return { k: k, urgency: urgency, score: scores[k] };
    }).sort(function (a, b) { return a.urgency - b.urgency; });

    return ranked.slice(0, 2).map(function (r) { return r.k; });
  }

  function pickStrength(scores, keystones, dims) {
    return dims
      .filter(function (k) { return keystones.indexOf(k) === -1; })
      .sort(function (a, b) { return scores[b] - scores[a]; })[0];
  }

  /* The focus dimensions for a phase: its own base, with the keystones
   * woven in so they are never out of sight for long. */
  function phaseFocus(phase, keystones, dims) {
    dims = dims || MS.DIM_KEYS;
    var f = phase.base.filter(function (k) { return dims.indexOf(k) !== -1; });
    keystones.forEach(function (k) {
      // Keystone 1 is present in every phase; keystone 2 joins from phase 2.
      var idx = keystones.indexOf(k);
      if (idx === 0 || phase.n >= 2) {
        if (f.indexOf(k) === -1) f.push(k);
      }
    });
    // When the keystones are already part of the phase's own base, the focus
    // would be thin. Top it up so every phase carries at least three strands.
    for (var i = 0; f.length < 3 && i < keystones.length; i++) {
      if (f.indexOf(keystones[i]) === -1) f.push(keystones[i]);
    }
    for (var j = 0; f.length < 3 && j < dims.length; j++) {
      if (f.indexOf(dims[j]) === -1) f.push(dims[j]);
    }
    return f;
  }
  MS.phaseFocus = phaseFocus;

  MS.buildPlan = function (answers, startKey) {
    var scores = MS.score(answers);
    var dims = MS.answeredDims(answers);
    var keystones = pickKeystones(scores, answers);
    var strength = pickStrength(scores, keystones, dims);
    var goals = Array.isArray(answers.goals) ? answers.goals : [];
    var isRel = answers.primaryGoal === 'relationship' || goals.indexOf('relationship') !== -1;

    // Which bodies of content this plan draws on.
    var tracks = [];
    if (isRel) tracks.push('relationship');
    if (isRel || answers.primaryGoal === 'partnership' || goals.indexOf('partnership') !== -1 ||
        dims.indexOf('partnership') !== -1) tracks.push('partner');
    if (answers.kids && answers.kids !== 'none') tracks.push('parenting');

    var minutes = parseInt(answers.minutes || '20', 10);

    // The anchor is the daily habit for the primary keystone. With a bigger
    // time budget a second anchor comes from keystone two.
    var anchors = [anchorFor(keystones[0], tracks)];
    if (minutes >= 40 && keystones[1]) anchors.push(anchorFor(keystones[1], tracks));
    anchors = anchors.filter(Boolean);

    var phases = MS.PHASES.map(function (p) {
      var focus = phaseFocus(p, keystones, dims);
      return {
        n: p.n, name: p.name, line: p.line, body: p.body,
        weeks: p.weeks, focus: focus,
        milestones: focus.slice(0, 4).map(function (dim) {
          return { dim: dim, text: MS.MILESTONES[dim][p.n - 1] };
        })
      };
    });

    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      startKey: startKey || dayKey(),
      seed: hash(JSON.stringify(answers)),
      scores: scores,
      dims: dims,
      keystones: keystones,
      strength: strength,
      relationship: isRel,
      tracks: tracks,
      minutes: minutes,
      days: parseInt(answers.days || '6', 10),
      anchors: anchors.map(function (t) { return t.id; }),
      phases: phases
    };
  };

  function anchorFor(dim, tracks) {
    var pool = MS.TASKS.filter(function (t) {
      if (t.cat !== 'anchor' || t.dim !== dim) return false;
      return !t.tags || t.tags.some(function (g) { return tracks.indexOf(g) !== -1; });
    });
    // A track-specific anchor beats the general one — the child-led ten
    // minutes is a better daily habit for a parent than a generic presence drill.
    var tagged = pool.filter(function (t) { return t.tags; });
    return tagged[0] || pool[0];
  }

  MS.taskById = function (id) {
    for (var i = 0; i < MS.TASKS.length; i++) {
      if (MS.TASKS[i].id === id) return MS.TASKS[i];
    }
    return null;
  };

  /* ---------- where in the plan is a given day ---------- */

  MS.dayInfo = function (plan, key) {
    var idx = daysBetween(plan.startKey, key);
    var clamped = Math.max(0, Math.min(idx, TOTAL_DAYS - 1));
    var phaseN = Math.min(4, Math.floor(clamped / PHASE_DAYS) + 1);
    return {
      index: idx,                                   // may be negative or past the end
      dayNumber: idx + 1,
      phaseN: phaseN,
      phase: plan.phases[phaseN - 1],
      dayInPhase: (clamped % PHASE_DAYS) + 1,
      week: Math.floor(clamped / 7) + 1,
      weekInPhase: Math.floor((clamped % PHASE_DAYS) / 7) + 1,
      beforeStart: idx < 0,
      finished: idx >= TOTAL_DAYS
    };
  };

  /* Rest days come off the back of the week: 5 days/week rests Sat+Sun,
   * 6 rests Sun, 7 never rests. */
  MS.isLightDay = function (plan, key) {
    var dow = fromKey(key).getDay(); // 0 = Sunday
    if (plan.days >= 7) return false;
    if (plan.days === 6) return dow === 0;
    return dow === 0 || dow === 6;
  };

  /* ---------- daily task selection ---------- */

  function eligible(plan, info, cat, cats) {
    return MS.TASKS.filter(function (t) {
      if (t.cat !== cat) return false;
      if (t.phases.indexOf(info.phaseN) === -1) return false;
      if (t.tags && !t.tags.some(function (g) { return plan.tracks.indexOf(g) !== -1; })) return false;
      if (cats && cats.indexOf(t.dim) === -1) return false;
      return true;
    });
  }

  /* Rotate through a candidate list so a task does not repeat until the
   * list is exhausted, but the order is stable for a given plan. */
  function rotate(list, plan, salt, n) {
    if (!list.length) return [];
    var ordered = list.slice().sort(function (a, b) {
      return hash(a.id + plan.seed) - hash(b.id + plan.seed);
    });
    var out = [];
    for (var i = 0; i < n && i < ordered.length; i++) {
      out.push(ordered[(salt + i) % ordered.length]);
    }
    return out;
  }

  MS.tasksFor = function (plan, key) {
    var info = MS.dayInfo(plan, key);
    if (info.beforeStart) return { info: info, tasks: [], light: false };

    var light = MS.isLightDay(plan, key);
    var idx = Math.max(0, Math.min(info.index, TOTAL_DAYS - 1));
    var focus = info.phase.focus;
    var out = [];

    // Anchors run every day, rest days included. They are the spine.
    plan.anchors.forEach(function (id) {
      var t = MS.taskById(id);
      if (t) out.push(t);
    });

    var lesson = MS.lessonForDay(plan, key);
    if (lesson) out.push(MS.lessonTask(lesson));

    if (light) {
      // One short reflective task, then leave the day alone.
      var lightPick = rotate(eligible(plan, info, 'reflect'), plan, Math.floor(idx / 7), 1);
      return { info: info, tasks: out.concat(lightPick), light: true };
    }

    var used = out.reduce(function (n, t) { return n + t.min; }, 0);
    var budget = plan.minutes - used;

    // The day's shape comes from a rotating cycle rather than a fixed
    // template, so the mix of drill / writing / outward action stays balanced
    // at every time budget — a ten-minute commitment still gets its turn at
    // the written work, which is the part that actually moves things.
    var cycle = info.phaseN >= 2
      ? ['practice', 'reflect', 'practice', 'reach', 'practice', 'reflect', 'reach', 'practice']
      : ['practice', 'reflect', 'practice', 'practice', 'reflect', 'practice'];
    var slots = Math.max(1, Math.min(5, Math.round(budget / 10)));
    var order = [];
    for (var s = 0; s < slots; s++) order.push(cycle[(idx + s) % cycle.length]);

    var chosen = {};
    order.forEach(function (cat) {
      var pool = eligible(plan, info, cat, cat === 'practice' ? focus : null)
        .filter(function (t) { return !chosen[t.id]; });
      // Prefer something that fits the time left. Someone who said ten
      // minutes meant it, and a plan that quietly overruns is one they quit.
      var room = Math.max(budget, 5);
      var fits = pool.filter(function (t) { return t.min <= room; });
      // Widen a little if honouring the budget exactly would leave almost no
      // choice, so a tight plan does not collapse to the same three tasks.
      if (fits.length < 3) fits = pool.filter(function (t) { return t.min <= room + 5; });
      if (fits.length) pool = fits;
      // Each category advances at its own pace so they do not move in lockstep.
      var salt = cat === 'practice' ? idx : (cat === 'reflect' ? Math.floor(idx / 3) : Math.floor(idx / 2));
      var pick = rotate(pool, plan, salt, 1)[0];
      if (!pick) return;
      // The first secondary task always lands; later ones must fit the budget.
      var first = Object.keys(chosen).length === 0;
      if (!first && budget < pick.min - 5) return;
      chosen[pick.id] = true;
      out.push(pick);
      budget -= pick.min;
    });

    return { info: info, tasks: out, light: false };
  };

  /* ---------- lessons ---------- */

  var LESSON_EVERY = 3;   // one piece of reading every third day

  /* The reading list for a plan: the framing lesson first, then the relevant
   * tracks round-robined so a parent does not wait a month for the parenting
   * material. Order within a track is preserved — they build on each other. */
  MS.lessonPlan = function (plan) {
    if (!MS.LESSONS) return [];
    var tracks = plan.tracks || [];
    function byTrack(t) {
      return MS.LESSONS.filter(function (l) { return l.track === t; });
    }
    var intro = MS.LESSONS.filter(function (l) { return l.id === 'l_notherapy'; });
    var lists = [];
    if (tracks.indexOf('partner') !== -1) lists.push(byTrack('partner'));
    if (tracks.indexOf('parenting') !== -1) lists.push(byTrack('parenting'));
    lists.push(byTrack('self').filter(function (l) { return l.id !== 'l_notherapy'; }));

    var out = intro.slice();
    for (var i = 0, more = true; more; i++) {
      more = false;
      for (var j = 0; j < lists.length; j++) {
        if (lists[j][i]) { out.push(lists[j][i]); more = true; }
      }
    }
    return out;
  };

  /* Lessons are content, not drills, so they are chipped by track. */
  function lessonDim(l) {
    return l.track === 'self' ? 'ownership' : 'partnership';
  }

  MS.lessonTask = function (l) {
    return {
      id: l.id, cat: 'learn', dim: lessonDim(l), min: l.min,
      title: l.title, detail: l.dek, lesson: l
    };
  };

  MS.lessonForDay = function (plan, key) {
    var idx = daysBetween(plan.startKey, key);
    if (idx < 0 || idx >= TOTAL_DAYS) return null;
    if (idx % LESSON_EVERY !== 0) return null;
    var list = MS.lessonPlan(plan);
    return list[idx / LESSON_EVERY] || null;
  };

  /* ---------- progress ---------- */

  MS.streak = function (log, plan) {
    var k = dayKey(), n = 0, guard = 0;
    // A day counts if anything was ticked. Today not yet started does not
    // break a streak, so start from yesterday if today is empty.
    if (!(log[k] && log[k].done > 0)) k = addDays(k, -1);
    while (guard++ < 400) {
      var e = log[k];
      if (e && e.done > 0) { n++; k = addDays(k, -1); continue; }
      if (plan && MS.isLightDay(plan, k) && MS.daysBetween(plan.startKey, k) >= 0) {
        // Rest days do not count toward the streak but do not break it.
        k = addDays(k, -1);
        continue;
      }
      break;
    }
    return n;
  };

  MS.completionStats = function (log, plan) {
    var total = 0, done = 0, days = 0;
    var end = Math.min(daysBetween(plan.startKey, dayKey()), TOTAL_DAYS - 1);
    for (var i = 0; i <= end; i++) {
      var key = addDays(plan.startKey, i);
      var res = MS.tasksFor(plan, key);
      if (!res.tasks.length) continue;
      total += res.tasks.length;
      var e = log[key];
      if (e && e.done) { done += Math.min(e.done, res.tasks.length); days++; }
    }
    return {
      total: total, done: done, daysActive: days,
      daysElapsed: Math.max(0, end + 1),
      rate: total ? Math.round((done / total) * 100) : 0
    };
  };
})(window.MS = window.MS || {});
