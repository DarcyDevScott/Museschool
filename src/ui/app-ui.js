/* Museschool — the day-to-day screens, navigation and bootstrap. */
(function (MS) {
  'use strict';

  var U = MS.ui;
  var esc = U.esc;
  var root, toastEl, toastTimer;

  MS.view = 'today';

  var NAV = [
    { id: 'today', icon: '◉', label: 'Today' },
    { id: 'plan', icon: '◈', label: 'Plan' },
    { id: 'learn', icon: '▤', label: 'Learn' },
    { id: 'progress', icon: '◔', label: 'Progress' },
    { id: 'journal', icon: '✎', label: 'Journal' },
    { id: 'settings', icon: '⚙', label: 'You' }
  ];

  function longDate(key) {
    return MS.fromKey(key).toLocaleDateString(undefined, {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  }

  /* ---------- today ---------- */

  U.today = function (st) {
    var plan = st.plan;
    var key = MS.dayKey();
    var res = MS.tasksFor(plan, key);
    var info = res.info;
    var e = st.log[key] || { tasks: {}, done: 0 };

    if (info.beforeStart) {
      return page('<div class="wrap"><h2>Your plan starts ' + esc(longDate(plan.startKey)) + '.</h2>' +
        '<p class="muted" style="margin-top:10px">Nothing to do until then.</p></div>');
    }

    if (info.finished) {
      return page('<div class="wrap">' +
        '<p class="eyebrow">Twelve weeks, done</p>' +
        '<h1 style="margin:10px 0 16px">That is the whole plan.</h1>' +
        '<p class="muted">Look at Progress to see what moved. Then pick the three things worth keeping ' +
        'permanently and drop the rest — that was always the point of phase four.</p>' +
        '<div class="btn-row" style="margin-top:22px">' +
          '<button class="btn" data-act="go" data-view="progress">See what changed</button>' +
          '<button class="btn btn-ghost" data-act="restart-plan">Run another twelve weeks</button>' +
        '</div></div>');
    }

    var doneCount = res.tasks.filter(function (t) { return e.tasks[t.id]; }).length;
    var allDone = doneCount === res.tasks.length && res.tasks.length > 0;
    var total = res.tasks.reduce(function (n, t) { return n + t.min; }, 0);

    var head = '' +
      '<div class="spread">' +
        '<div>' +
          '<p class="eyebrow">Day ' + info.dayNumber + ' · Week ' + info.week + ' · Phase ' + info.phaseN + '</p>' +
          '<h2 style="margin-top:6px">' + esc(longDate(key)) + '</h2>' +
        '</div>' +
      '</div>' +
      '<p class="muted small" style="margin:10px 0 0"><em>' + esc(info.phase.line) + '</em> · ' +
        'about ' + total + ' minutes' + (res.light ? ' · rest day' : '') + '</p>';

    var tasks = res.tasks.map(function (t) {
      return taskCard(t, !!e.tasks[t.id], key);
    }).join('');

    var checkin = '' +
      '<hr class="divider">' +
      '<p class="eyebrow">Close the day</p>' +
      '<div class="card" style="margin-top:12px">' +
        meter('mood', 'How was your head today?', e.mood) +
        meter('energy', 'How was your energy?', e.energy) +
        '<label class="small muted" style="display:block;margin:16px 0 6px">One line about today</label>' +
        '<textarea data-input="note" data-day="' + key + '" style="min-height:70px" ' +
          'placeholder="Anything worth remembering.">' + esc(e.note || '') + '</textarea>' +
      '</div>';

    return page('<div class="wrap">' + head +
      (MS.backup.shouldNag()
        ? '<div class="note" style="margin:18px 0 0">' +
            '<strong>Worth taking a backup.</strong> ' + esc(U.backupAge(st)) + ' ' +
            'Everything lives in this browser only, so a cleared cache or a new phone loses it.' +
            '<div style="margin-top:12px"><button class="btn" data-act="backup-save">' +
            esc(U.backupVerb()) + '</button></div>' +
          '</div>'
        : '') +
      (allDone ? '<div class="note" style="margin:18px 0 0"><strong>Day done.</strong> ' +
        'That is the whole job today. The compounding is invisible for a few weeks and then it is not.</div>' : '') +
      '<div style="margin-top:20px">' + tasks + '</div>' +
      (res.light ? '<p class="dim tiny">A lighter day by design — you chose ' + plan.days +
        ' days a week. Rest is part of the plan, not a gap in it.</p>' : '') +
      checkin +
    '</div>');
  };

  function meter(field, label, value) {
    var out = '<label class="small muted" style="display:block;margin-bottom:6px">' + esc(label) + '</label>' +
      '<div class="scale" style="margin-bottom:6px">';
    for (var n = 1; n <= 5; n++) {
      out += '<button type="button" data-act="meter" data-field="' + field + '" data-v="' + n + '"' +
        ' aria-pressed="' + (value === n) + '"><b>' + n + '</b></button>';
    }
    return out + '</div>';
  }

  /* Lesson copy is authored in this repository and carries light inline
   * markup, so it is written out as-is. Never route anything a person typed
   * through this function. */
  U.lessonBody = function (l) {
    return '<div class="lesson-body">' +
      l.body.map(function (par) { return '<p>' + par + '</p>'; }).join('') +
      '<p class="lesson-practice"><strong>Try today.</strong> ' + esc(l.practice) + '</p>' +
      '</div>';
  };

  function lessonCard(t, done, key) {
    var l = t.lesson;
    var open = MS.openLesson === l.id;
    return '' +
      '<div class="task task-learn' + (done ? ' done' : '') + '">' +
        '<button class="tick" data-act="tick" data-task="' + esc(t.id) + '" ' +
          'aria-label="Mark done" aria-pressed="' + done + '">✓</button>' +
        '<div class="task-body">' +
          '<div class="task-meta">' +
            '<span class="chip chip-learn">reading</span>' +
            '<span class="chip">' + esc(l.track === 'self' ? 'the plan' : l.track) + '</span>' +
            '<span class="chip">' + l.min + ' min</span>' +
          '</div>' +
          '<div class="task-title">' + esc(l.title) + '</div>' +
          '<div class="task-detail">' + esc(l.dek) + '</div>' +
          (open ? U.lessonBody(l) : '') +
          '<button class="btn btn-ghost" data-act="lesson" data-lesson="' + esc(l.id) + '" ' +
            'style="margin-top:12px">' + (open ? 'Close' : 'Read it') + '</button>' +
        '</div>' +
      '</div>';
  }

  function taskCard(t, done, key) {
    if (t.cat === 'learn') return lessonCard(t, done, key);
    var isWriting = t.cat === 'reflect';
    var chipClass = t.cat === 'anchor' ? ' chip-anchor' : (isWriting ? ' chip-reflect' : '');
    var text = isWriting ? MS.store.journalFor(key, t.id) : '';
    return '' +
      '<div class="task' + (done ? ' done' : '') + '">' +
        '<button class="tick" data-act="tick" data-task="' + esc(t.id) + '" ' +
          'aria-label="Mark done" aria-pressed="' + done + '">✓</button>' +
        '<div class="task-body">' +
          '<div class="task-meta">' +
            '<span class="chip' + chipClass + '">' + esc(t.cat) + '</span>' +
            '<span class="chip">' + esc(MS.DIMENSIONS[t.dim].short) + '</span>' +
            '<span class="chip">' + t.min + ' min</span>' +
          '</div>' +
          '<div class="task-title">' + esc(t.title) + '</div>' +
          '<div class="task-detail">' + esc(t.detail) + '</div>' +
          (isWriting
            ? '<div class="task-journal">' +
                '<textarea data-input="journal" data-task="' + esc(t.id) + '" ' +
                  'data-title="' + esc(t.title) + '" data-day="' + key + '" ' +
                  'placeholder="Write it here. It saves as you type and stays on this device.">' +
                  esc(text) + '</textarea>' +
              '</div>'
            : '') +
        '</div>' +
      '</div>';
  }

  /* ---------- plan ---------- */

  U.plan = function (st) {
    var plan = st.plan;
    var info = MS.dayInfo(plan, MS.dayKey());
    var D = MS.DIMENSIONS;
    return page('<div class="wrap">' +
      '<p class="eyebrow">The plan</p>' +
      '<h2 style="margin:8px 0 16px">Twelve weeks, four phases</h2>' +
      '<div class="stats">' +
        stat(info.beforeStart ? '—' : Math.min(info.dayNumber, MS.TOTAL_DAYS), 'of 84 days') +
        stat(info.phaseN, 'phase') +
        stat(plan.minutes + 'm', 'per day') +
      '</div>' +
      '<hr class="divider">' +
      '<p class="eyebrow">Your keystones</p>' +
      '<p class="muted small" style="margin:8px 0 16px">Everything below is weighted toward these two. ' +
      'They were the lowest-scoring things you also said you cared about.</p>' +
      plan.keystones.map(function (k) {
        return '<div class="card card-tight"><h3>' + esc(D[k].label) + '</h3>' +
          '<p class="muted small" style="margin:6px 0 0">' + esc(MS.DIM_READ[k]) + '</p></div>';
      }).join('') +
      (plan.relationship ? U.relationshipNote(st) : '') +
      '<hr class="divider">' +
      '<div style="margin-top:16px">' + U.phaseList(plan, info.phaseN) + '</div>' +
    '</div>');
  };

  function stat(v, label) {
    return '<div class="stat"><b>' + esc(v) + '</b><span>' + esc(label) + '</span></div>';
  }

  /* ---------- progress ---------- */

  U.progress = function (st) {
    var plan = st.plan;
    var stats = MS.completionStats(st.log, plan);
    var streak = MS.streak(st.log, plan);
    var info = MS.dayInfo(plan, MS.dayKey());
    var latest = st.checkins.length ? st.checkins[st.checkins.length - 1].scores : null;

    // A re-score is due at the end of each phase.
    var phasesDone = Math.floor(Math.max(0, info.index) / MS.PHASE_DAYS);
    var due = phasesDone > st.checkins.length;

    var moods = Object.keys(st.log)
      .sort()
      .filter(function (k) { return st.log[k].mood; })
      .slice(-28);

    return page('<div class="wrap">' +
      '<p class="eyebrow">Progress</p>' +
      '<h2 style="margin:8px 0 18px">What you have actually done</h2>' +
      '<div class="stats">' +
        stat(streak, 'day streak') +
        stat(stats.rate + '%', 'tasks done') +
        stat(stats.daysActive, 'active days') +
      '</div>' +

      (due
        ? '<div class="note" style="margin-top:18px"><strong>Phase ' + phasesDone + ' is done — time to re-score.</strong> ' +
          'Nine questions, same as the ones from the quiz. It takes two minutes and it is the only way to see ' +
          'whether any of this is moving.' +
          '<div style="margin-top:12px"><button class="btn" data-act="recheck">Re-score now</button></div></div>'
        : '') +

      '<hr class="divider">' +
      '<p class="eyebrow">Your nine dimensions</p>' +
      '<p class="muted small" style="margin:8px 0 16px">' +
        (latest
          ? 'Bars show your latest re-score. The vertical mark is where you started.'
          : 'Where you started. Re-score at the end of each phase to see this move.') +
      '</p>' +
      '<div class="bars">' + U.bars(latest || plan.scores, plan.keystones, latest ? plan.scores : null, plan.dims) + '</div>' +

      (moods.length > 2 ? moodChart(st, moods) : '') +

      '<hr class="divider">' +
      '<p class="eyebrow">The arc</p>' +
      '<div style="margin-top:16px">' + U.phaseList(plan, info.phaseN) + '</div>' +
    '</div>');
  };

  /* A small inline SVG — mood and energy over the last few weeks. */
  function moodChart(st, keys) {
    var w = 320, h = 90, pad = 6;
    function line(field, color) {
      var pts = keys.map(function (k, i) {
        var v = st.log[k][field] || 3;
        var x = pad + (i / Math.max(1, keys.length - 1)) * (w - pad * 2);
        var y = h - pad - ((v - 1) / 4) * (h - pad * 2);
        return x.toFixed(1) + ',' + y.toFixed(1);
      }).join(' ');
      return '<polyline points="' + pts + '" fill="none" stroke="' + color +
        '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    }
    return '' +
      '<hr class="divider">' +
      '<p class="eyebrow">Head and energy · last ' + keys.length + ' logged days</p>' +
      '<div class="scroll-x" style="margin-top:14px">' +
        '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" ' +
          'preserveAspectRatio="none" role="img" aria-label="Mood and energy over time">' +
          line('mood', 'var(--accent)') + line('energy', 'var(--teal)') +
        '</svg>' +
      '</div>' +
      '<div class="row small dim" style="margin-top:8px;gap:18px">' +
        '<span><b style="color:var(--accent)">—</b> head</span>' +
        '<span><b style="color:var(--teal)">—</b> energy</span>' +
      '</div>';
  }

  /* ---------- re-score ---------- */

  /* Two questions per dimension. One would snap every score to a quintile,
   * which reads as precision the answer does not have next to the four-to-six
   * question average from the original quiz. */
  function recheckQuestions() {
    var byDim = {};
    MS.DIM_KEYS.forEach(function (d) { byDim[d] = []; });
    MS.QUIZ.forEach(function (s) {
      s.questions.forEach(function (q) {
        if (q.type === 'scale' && byDim[q.dim]) byDim[q.dim].push(q);
      });
    });
    var out = [];
    MS.DIM_KEYS.forEach(function (d) {
      // Prefer plainly-worded questions over the reverse-scored ones.
      var pool = byDim[d].filter(function (q) { return !q.reverse; });
      if (pool.length < 2) pool = pool.concat(byDim[d].filter(function (q) { return q.reverse; }));
      out = out.concat(pool.slice(0, 2));
    });
    return out;
  }

  U.recheck = function (st) {
    var qs = recheckQuestions();
    var pending = st.recheckDraft || {};
    var answeredCount = qs.filter(function (q) { return pending[q.id]; }).length;
    var ready = answeredCount === qs.length;

    return page('<div class="wrap">' +
      '<p class="eyebrow">Re-score</p>' +
      '<h2 style="margin:8px 0 6px">Same questions, today\'s answers</h2>' +
      '<p class="muted">Answer as of the last two weeks, not as of your best day. ' +
      qs.length + ' questions, about two minutes.</p>' +
      '<div class="progressbar" style="margin-top:16px"><i style="width:' +
        Math.round((answeredCount / qs.length) * 100) + '%"></i></div>' +
      qs.map(function (q) {
        var v = pending[q.id];
        var out = '<div class="q"><div class="q-text">' + esc(q.text) + '</div><div class="scale">';
        for (var n = 1; n <= 5; n++) {
          out += '<button type="button" data-act="recheck-set" data-q="' + q.id + '" data-v="' + n + '"' +
            ' aria-pressed="' + (v === n) + '"><b>' + n + '</b><span>' + esc(q.labels[n - 1]) + '</span></button>';
        }
        return out + '</div></div>';
      }).join('') +
      '<div class="btn-row" style="margin-top:26px">' +
        '<button class="btn btn-ghost" data-act="recheck-cancel">Cancel</button>' +
        '<button class="btn" data-act="recheck-save"' + (ready ? '' : ' disabled') + '>Save re-score</button>' +
      '</div>' +
      (ready ? '' : '<p class="dim tiny" style="margin-top:10px">' +
        (qs.length - answeredCount) + ' left.</p>') +
    '</div>');
  };

  /* ---------- the reading library ---------- */

  U.learn = function (st) {
    var plan = st.plan;
    var list = MS.lessonPlan(plan);
    var read = st.lessonsRead || {};
    var info = MS.dayInfo(plan, MS.dayKey());
    var readCount = list.filter(function (l) { return read[l.id]; }).length;

    if (!list.length) {
      return page('<div class="wrap"><p class="eyebrow">Reading</p>' +
        '<h2 style="margin:8px 0 14px">Nothing here yet</h2>' +
        '<p class="muted">The reading follows the tracks your plan is running. ' +
        'Yours does not include the partner or parenting material — retake the quiz from ' +
        'the You tab if that has changed.</p></div>');
    }

    var body = list.map(function (l, i) {
      var day = i * 3 + 1;
      var unlocked = info.beforeStart ? false : info.dayNumber >= day;
      var open = MS.openLesson === l.id;
      return '<div class="lesson-row' + (open ? ' open' : '') + '">' +
        '<button class="lesson-head" data-act="lesson" data-lesson="' + esc(l.id) + '">' +
          '<span class="lesson-day">' + (read[l.id] ? '✓' : (unlocked ? '·' : '')) + '</span>' +
          '<span class="lesson-main">' +
            '<span class="lesson-title">' + esc(l.title) + '</span>' +
            '<span class="lesson-dek">' + esc(l.dek) + '</span>' +
          '</span>' +
          '<span class="lesson-meta">' + (unlocked ? l.min + ' min' : 'day ' + day) + '</span>' +
        '</button>' +
        (open ? U.lessonBody(l) : '') +
      '</div>';
    }).join('');

    return page('<div class="wrap">' +
      '<p class="eyebrow">Reading</p>' +
      '<h2 style="margin:8px 0 12px">' + readCount + ' of ' + list.length + ' read</h2>' +
      '<p class="muted small">Short pieces from the research on couples and families — ' +
      'mostly Gottman\'s observational work and Emotionally Focused Therapy. One arrives ' +
      'on your Today screen every third day, but you can read ahead.</p>' +
      '<div class="note" style="margin:18px 0 22px">' +
        '<strong>This is educational material, not therapy.</strong> Couples work needs both ' +
        'people; what an app can do is your half. Where there is fear, coercion or violence ' +
        'in a relationship, standard couples advice does not apply and some of it makes things ' +
        'worse — that needs a professional service, not a task list.' +
      '</div>' +
      '<div class="lessons">' + body + '</div>' +
    '</div>');
  };

  /* ---------- journal ---------- */

  U.journal = function (st) {
    var entries = st.journal
      .filter(function (j) { return j.text && j.text.trim(); })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; });

    var notes = Object.keys(st.log)
      .filter(function (k) { return st.log[k].note && st.log[k].note.trim(); })
      .sort().reverse();

    var body = '';
    if (!entries.length && !notes.length) {
      body = '<p class="muted">Nothing yet. The written tasks on your Today screen land here, ' +
        'along with your end-of-day lines. In eight weeks this is the part you will actually want to read back.</p>';
    } else {
      body = entries.map(function (j) {
        return '<div class="jentry">' +
          '<div class="spread"><strong class="small">' + esc(j.title) + '</strong>' +
          '<span class="dim tiny">' + esc(longDate(j.date)) + '</span></div>' +
          '<pre>' + esc(j.text) + '</pre></div>';
      }).join('');
      if (notes.length) {
        body += '<hr class="divider"><p class="eyebrow">End-of-day lines</p>' +
          notes.map(function (k) {
            return '<div class="jentry"><div class="spread">' +
              '<span class="dim tiny">' + esc(longDate(k)) + '</span></div>' +
              '<pre>' + esc(st.log[k].note) + '</pre></div>';
          }).join('');
      }
    }

    return page('<div class="wrap">' +
      '<p class="eyebrow">Journal</p>' +
      '<h2 style="margin:8px 0 18px">' + entries.length + ' written ' +
        (entries.length === 1 ? 'entry' : 'entries') + '</h2>' +
      body +
    '</div>');
  };

  /* ---------- settings ---------- */

  U.settings = function (st) {
    var theme = st.settings.theme || 'auto';
    var rel = st.answers.relLegacy;
    return page('<div class="wrap">' +
      '<p class="eyebrow">You</p>' +
      '<h2 style="margin:8px 0 18px">' + esc(st.answers.name || 'Settings') + '</h2>' +

      (rel && rel.trim()
        ? '<div class="card"><p class="eyebrow">What you said you wanted to be true in a year</p>' +
          '<p style="margin:10px 0 0;font-family:var(--font-display);font-size:1.1rem;line-height:1.45">' +
          esc(rel) + '</p></div>'
        : '') +

      '<div class="card" style="margin-top:14px">' +
        '<p class="eyebrow">Appearance</p>' +
        '<div class="btn-row" style="margin-top:12px">' +
          ['auto', 'light', 'dark'].map(function (t) {
            return '<button class="btn ' + (theme === t ? '' : 'btn-ghost') +
              '" data-act="theme" data-v="' + t + '">' + t + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<p class="eyebrow">Backup</p>' +
        '<p class="muted small" style="margin:10px 0 4px">' + esc(U.backupBlurb()) + '</p>' +
        '<p class="dim tiny" style="margin:0 0 14px">' + esc(U.backupAge(st)) + '</p>' +
        '<div class="btn-row" style="flex-wrap:wrap">' +
          '<button class="btn" data-act="backup-save">' + esc(U.backupVerb()) + '</button>' +
          '<button class="btn btn-ghost" data-act="backup-restore">Restore from a file</button>' +
        '</div>' +
        '<input type="file" id="restore-file" accept="application/json,.json" class="hide">' +
        (MS.backup.canAutoSave()
          ? '<div class="autosave">' +
              '<button class="btn btn-ghost" data-act="backup-auto">' +
                (MS.autoSaveOn ? 'Stop keeping that file updated' : 'Keep a file updated automatically') +
              '</button>' +
              '<p class="dim tiny" style="margin:8px 0 0">' +
                (MS.autoSaveOn
                  ? 'Every change is written to the file you chose. Put it in your iCloud Drive folder and it syncs from there.'
                  : 'Pick a file once and it gets rewritten on every change. Not available in Safari, so not on an iPhone.') +
              '</p>' +
            '</div>'
          : '') +
        '<p class="dim tiny" style="margin:14px 0 0">There is no iCloud API for the web, so nothing here ' +
        'syncs on its own on a phone — and a version that did would mean your journal living on ' +
        'someone else\'s server. Saving a file to iCloud Drive keeps it yours.</p>' +
      '</div>' +

      '<div class="card">' +
        '<p class="eyebrow">Copy as text</p>' +
        '<p class="muted small" style="margin:10px 0 14px">The same data on your clipboard, ' +
        'if you would rather paste it somewhere yourself.</p>' +
        '<div class="btn-row" style="flex-wrap:wrap">' +
          '<button class="btn btn-ghost" data-act="export">Copy backup</button>' +
          '<button class="btn btn-quiet" data-act="import">Paste a backup</button>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<p class="eyebrow">Start again</p>' +
        '<p class="muted small" style="margin:10px 0 14px">Retake the quiz and build a fresh plan. ' +
        'Your journal and daily log are kept.</p>' +
        '<div class="btn-row" style="flex-wrap:wrap">' +
          '<button class="btn btn-ghost" data-act="retake">Retake the quiz</button>' +
          '<button class="btn btn-quiet" data-act="wipe">Erase everything</button>' +
        '</div>' +
      '</div>' +

      '<p class="dim tiny" style="margin-top:22px">Museschool is a structured self-directed programme, ' +
      'not therapy and not a substitute for it. If you are in crisis, or if what you are working through is ' +
      'heavier than a daily task list, please talk to a professional or someone you trust.</p>' +
    '</div>');
  };

  U.backupVerb = function () {
    return { share: 'Save to Files', pick: 'Save to a file', viewer: 'Save a backup file',
             download: 'Download a backup', clipboard: 'Copy backup' }[MS.backup.ability()];
  };

  U.backupBlurb = function () {
    return {
      share: 'Opens the share sheet — choose Save to Files, then iCloud Drive, and it is on all your devices.',
      viewer: 'Saves a JSON file through the viewer. For Save to Files and iCloud Drive, open the app from its own address.',
      pick: 'Choose where to put it. Your iCloud Drive folder works, and so does anywhere else.',
      download: 'Downloads a JSON file you can move wherever you keep things.',
      clipboard: 'This viewer blocks downloads, so the backup goes to your clipboard instead. ' +
                 'Open the app from its own address to save a file.'
    }[MS.backup.ability()];
  };

  U.backupAge = function (st) {
    if (!st.lastBackup) return 'Never backed up.';
    var d = MS.daysBetween(st.lastBackup, MS.dayKey());
    if (d <= 0) return 'Last backed up today.';
    if (d === 1) return 'Last backed up yesterday.';
    return 'Last backed up ' + d + ' days ago.';
  };

  /* ---------- chrome ---------- */

  function page(inner) {
    return nav() + inner;
  }

  function nav() {
    return '<nav class="nav">' + NAV.map(function (n) {
      return '<button data-act="go" data-view="' + n.id + '"' +
        (MS.view === n.id ? ' aria-current="page"' : '') + '>' +
        '<i>' + n.icon + '</i>' + n.label + '</button>';
    }).join('') + '</nav>';
  }

  U.toast = function (msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  };

  /* ---------- render ---------- */

  MS.render = function () {
    var st = MS.store.get();
    document.documentElement.setAttribute('data-theme', st.settings.theme || 'auto');

    var html;
    if (!st.plan) {
      html = MS.view === 'quiz' ? U.quiz(st)
           : MS.view === 'reveal' ? U.reveal(st)
           : U.welcome(st);
    } else if (MS.view === 'quiz') {
      html = U.quiz(st);
    } else if (MS.view === 'reveal') {
      html = U.reveal(st);
    } else if (MS.view === 'recheck') {
      html = U.recheck(st);
    } else {
      html = (U[MS.view] || U.today)(st);
    }

    // Preserve focus and caret across re-render for the field being typed in.
    var active = document.activeElement;
    var restore = active && active.tagName === 'TEXTAREA'
      ? { key: active.dataset.input + '|' + (active.dataset.task || '') , pos: active.selectionStart }
      : null;

    root.innerHTML = html;

    if (restore) {
      var next = Array.prototype.find.call(root.querySelectorAll('textarea'), function (t) {
        return t.dataset.input + '|' + (t.dataset.task || '') === restore.key;
      });
      if (next) { next.focus(); try { next.setSelectionRange(restore.pos, restore.pos); } catch (e) {} }
    }
  };

  /* ---------- events ---------- */

  function onClick(ev) {
    var btn = ev.target.closest('[data-act]');
    if (!btn) return;
    flushInput();
    var st = MS.store.get();
    var act = btn.dataset.act;
    var scroll = true;

    switch (act) {
      case 'quiz-start':
        MS.view = 'quiz'; break;

      case 'quiz-restart':
        st.answers = {}; st.quizSection = 0; MS.store.save();
        MS.view = 'quiz'; break;

      case 'quiz-next':
        st.quizSection++; MS.store.save(); break;

      case 'quiz-back':
        st.quizSection = Math.max(0, st.quizSection - 1); MS.store.save(); break;

      case 'quiz-finish':
        st.plan = MS.buildPlan(st.answers, MS.dayKey());
        MS.store.save();
        MS.view = 'reveal'; break;

      case 'begin':
        MS.view = 'today'; break;

      case 'set':
        MS.store.setAnswer(btn.dataset.q, coerce(btn.dataset.v));
        scroll = false; break;

      case 'toggle': {
        var q = btn.dataset.q;
        var max = parseInt(btn.dataset.max, 10) || 99;
        var cur = Array.isArray(st.answers[q]) ? st.answers[q].slice() : [];
        var i = cur.indexOf(btn.dataset.v);
        if (i !== -1) cur.splice(i, 1);
        else if (cur.length < max) cur.push(btn.dataset.v);
        else { U.toast('Pick at most ' + max + '.'); return; }
        MS.store.setAnswer(q, cur);
        scroll = false; break;
      }

      case 'go':
        MS.view = btn.dataset.view; break;

      case 'lesson': {
        var lid = btn.dataset.lesson;
        MS.openLesson = MS.openLesson === lid ? null : lid;
        if (MS.openLesson) MS.store.markRead(lid);
        scroll = false; break;
      }

      case 'tick': {
        var on = MS.store.toggleTask(MS.dayKey(), btn.dataset.task);
        if (on) U.toast('Done.');
        scroll = false; break;
      }

      case 'meter':
        MS.store.setCheckin(MS.dayKey(), btn.dataset.field, parseInt(btn.dataset.v, 10));
        scroll = false; break;

      case 'recheck':
        MS.store.clearRecheck(); MS.view = 'recheck'; break;

      case 'recheck-set':
        MS.store.setRecheck(btn.dataset.q, parseInt(btn.dataset.v, 10));
        scroll = false; break;

      case 'recheck-cancel':
        MS.store.clearRecheck(); MS.view = 'progress'; break;

      case 'recheck-save': {
        // Same normalisation as the original quiz, so the numbers are comparable.
        var sums = {}, counts = {}, scores = {};
        recheckQuestions().forEach(function (qq) {
          var v = (st.recheckDraft || {})[qq.id];
          if (typeof v !== 'number') return;
          if (qq.reverse) v = 6 - v;
          sums[qq.dim] = (sums[qq.dim] || 0) + v;
          counts[qq.dim] = (counts[qq.dim] || 0) + 1;
        });
        MS.DIM_KEYS.forEach(function (dim) {
          scores[dim] = counts[dim]
            ? Math.round(((sums[dim] - counts[dim]) / (4 * counts[dim])) * 100)
            : st.plan.scores[dim];
        });
        MS.store.addCheckin(scores);
        MS.store.clearRecheck();
        MS.view = 'progress';
        U.toast('Re-scored.');
        break;
      }

      case 'theme':
        st.settings.theme = btn.dataset.v; MS.store.save(); scroll = false; break;

      case 'export': {
        var text = MS.store.exportJSON();
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text)
            .then(function () { U.toast('Backup copied to clipboard.'); })
            .catch(function () { window.prompt('Copy your backup:', text); });
        } else {
          window.prompt('Copy your backup:', text);
        }
        return;
      }

      case 'backup-save':
        MS.backup.save().then(function (how) {
          U.toast({ shared: 'Saved.', saved: 'Saved.', downloaded: 'Downloaded.',
                    copied: 'Copied to clipboard.', cancelled: 'Cancelled.' }[how] || 'Saved.');
          MS.render();
        }).catch(function () { U.toast('Could not save. Try Copy backup.'); });
        return;

      case 'backup-restore': {
        var picker = document.getElementById('restore-file');
        if (!picker) return;
        picker.onchange = function () {
          var f = picker.files && picker.files[0];
          if (!f) return;
          MS.backup.restoreFrom(f).then(function () {
            U.toast('Backup restored.'); MS.view = 'today'; MS.render();
          }).catch(function () { U.toast('That file is not a Museschool backup.'); });
        };
        picker.click();
        return;
      }

      case 'backup-auto':
        if (MS.autoSaveOn) {
          MS.backup.stopAutoSave().then(function () { MS.autoSaveOn = false; MS.render(); });
        } else {
          // Picking the file is what turns it on.
          MS.backup.save().then(function (how) {
            if (how === 'cancelled') return;
            MS.backup.isAutoSaving().then(function (on) {
              MS.autoSaveOn = on;
              U.toast(on ? 'That file now stays updated.' : 'Saved.');
              MS.render();
            });
          }).catch(function () { U.toast('Could not set that up.'); });
        }
        return;

      case 'import': {
        var input = window.prompt('Paste a Museschool backup:');
        if (!input) return;
        try { MS.store.importJSON(input); U.toast('Backup restored.'); MS.view = 'today'; }
        catch (err) { U.toast('That did not look like a backup.'); return; }
        break;
      }

      case 'retake':
        if (!confirm('Retake the quiz and build a new plan? Your journal and daily log are kept.')) return;
        st.answers = {}; st.plan = null; st.quizSection = 0; MS.store.save();
        MS.view = 'quiz'; break;

      case 'restart-plan':
        st.plan = MS.buildPlan(st.answers, MS.dayKey());
        st.checkins = [];
        MS.store.save();
        MS.view = 'reveal'; break;

      case 'wipe':
        if (!confirm('Erase everything — answers, plan, journal and log? This cannot be undone.')) return;
        MS.store.reset(); MS.view = 'today'; break;

      default: return;
    }

    MS.render();
    if (MS.autoSaveOn) MS.backup.autoSave();
    if (scroll) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function coerce(v) {
    return /^\d+$/.test(v) ? parseInt(v, 10) : v;
  }

  /* Typing saves on a short debounce rather than on every keystroke. Any
   * click flushes the pending save first — otherwise a re-render triggered
   * between the keystroke and the timer would blank the field on screen and
   * the next edit would save over what was typed. */
  var typeTimer, pendingInput;

  function flushInput() {
    clearTimeout(typeTimer);
    var p = pendingInput;
    if (!p) return false;
    pendingInput = null;
    if (p.kind === 'journal') {
      MS.store.saveJournal(p.day, p.task, p.title, p.value);
    } else if (p.kind === 'note') {
      MS.store.setCheckin(p.day, 'note', p.value);
    } else {
      MS.store.setAnswer(p.kind, p.value);
    }
    return true;
  }

  function onInput(ev) {
    var el = ev.target;
    var kind = el.dataset.input;
    if (!kind) return;
    clearTimeout(typeTimer);
    pendingInput = {
      kind: kind, value: el.value,
      day: el.dataset.day, task: el.dataset.task, title: el.dataset.title
    };
    typeTimer = setTimeout(function () {
      var wasQuiz = MS.view === 'quiz';
      flushInput();
      // In the quiz, Next unlocks once a required field has content.
      if (wasQuiz) MS.render();
    }, 350);
  }

  /* ---------- boot ---------- */

  MS.boot = function () {
    root = document.getElementById('app');
    toastEl = document.getElementById('toast');
    var st = MS.store.load();
    MS.view = st.plan ? 'today' : 'welcome';
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);

    // On a phone the app is usually closed by being swiped away or by the
    // screen locking, neither of which fires unload. These two do, and they
    // write whatever is still sitting in the typing debounce.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flushInput();
    });
    window.addEventListener('pagehide', flushInput);

    // Does this browser already have a file it is keeping up to date?
    MS.backup.isAutoSaving().then(function (on) {
      if (on) { MS.autoSaveOn = true; MS.render(); }
    });

    // Inside the claude.ai viewer a save route may be granted, but only
    // asynchronously — so render without it and pick it up when it arrives.
    MS.backup.detect().then(function (changed) { if (changed) MS.render(); });

    MS.render();
  };
})(window.MS = window.MS || {});
