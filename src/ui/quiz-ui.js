/* Museschool — welcome, the quiz itself, and the plan reveal. */
(function (MS) {
  'use strict';

  var U = MS.ui = MS.ui || {};

  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var esc = U.esc;

  /* Sections whose `when` gate passes, given the answers so far. */
  U.visibleSections = function (answers) {
    return MS.QUIZ.filter(function (s) { return !s.when || s.when(answers); });
  };

  /* A question counts as answered if it has a usable value. Free-text
   * questions marked optional never block progress. */
  function answered(q, answers) {
    var v = answers[q.id];
    if (q.optional) return true;
    if (q.type === 'multi') return Array.isArray(v) && v.length > 0;
    if (q.type === 'text') return typeof v === 'string' && v.trim().length > 0;
    return v !== undefined && v !== null && v !== '';
  }
  U.answered = answered;

  /* ---------- welcome ---------- */

  U.welcome = function (st) {
    var started = Object.keys(st.answers).length > 0;
    return '' +
      '<div class="wrap">' +
        '<p class="eyebrow">Museschool</p>' +
        '<h1 style="margin:10px 0 18px">Twelve weeks of getting yourself in order.</h1>' +
        '<p class="muted">A long, honest questionnaire, then a plan built from what you actually said — ' +
        'four phases, daily tasks sized to the time you really have, and a written record of what changes.</p>' +
        '<div class="note" style="margin:22px 0">' +
          '<strong>This stays on your device.</strong> No account, no server, nothing sent anywhere. ' +
          'The questions get personal and they only work if you answer them honestly, which is easier ' +
          'when nobody else can read the answers.' +
        '</div>' +
        '<div class="btn-row">' +
          '<button class="btn" data-act="quiz-start">' + (started ? 'Continue the quiz' : 'Start the quiz') + '</button>' +
          (started ? '<button class="btn btn-quiet" data-act="quiz-restart">Start over</button>' : '') +
        '</div>' +
        '<p class="dim tiny" style="margin-top:14px">About 10 minutes. 65 questions across 12 short sections. ' +
        'You can stop and come back — answers save as you go.</p>' +
        '<hr class="divider">' +
        '<p class="eyebrow">How it works</p>' +
        '<div class="stack" style="margin-top:12px">' +
          card('1 · The questionnaire', 'Nine dimensions get measured: steadiness, self-worth, communication, ownership, follow-through, energy, direction, connection and presence. Plus what you want, what derails you, and how much time you honestly have.') +
          card('2 · Your reading', 'Two keystones — the things holding the rest back — and one strength worth leaning on. Scored, not guessed.') +
          card('3 · The plan', 'Twelve weeks in four phases: stabilise, look straight at it, show up, make it yours. Each with its own focus and milestones.') +
          card('4 · Daily tasks', 'A handful each day, built from your phase and your keystones, sized to your time budget. Written work included, because that is where most of it happens.') +
        '</div>' +
      '</div>';
  };

  function card(title, body) {
    return '<div class="card card-tight"><h3>' + esc(title) + '</h3>' +
      '<p class="muted small" style="margin:6px 0 0">' + esc(body) + '</p></div>';
  }

  /* ---------- quiz ---------- */

  U.quiz = function (st) {
    var sections = U.visibleSections(st.answers);
    var i = Math.min(st.quizSection, sections.length - 1);
    var sec = sections[i];

    var done = 0, total = 0;
    sections.forEach(function (s, n) {
      s.questions.forEach(function (q) {
        total++;
        if (n < i || answered(q, st.answers)) done++;
      });
    });
    var pct = Math.round((done / total) * 100);

    var body = sec.questions.map(function (q) { return question(q, st.answers); }).join('');
    var blocked = sec.questions.some(function (q) { return !answered(q, st.answers); });
    var last = i === sections.length - 1;

    return '' +
      '<div class="wrap">' +
        '<div class="progressbar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="spread" style="margin:10px 0 26px">' +
          '<span class="eyebrow">Section ' + (i + 1) + ' of ' + sections.length + '</span>' +
          '<span class="dim tiny">' + pct + '%</span>' +
        '</div>' +
        '<h2>' + esc(sec.title) + '</h2>' +
        '<p class="muted" style="margin-top:8px">' + esc(sec.blurb) + '</p>' +
        body +
        '<div class="btn-row" style="margin-top:28px">' +
          (i > 0 ? '<button class="btn btn-ghost" data-act="quiz-back">Back</button>' : '') +
          '<button class="btn" data-act="' + (last ? 'quiz-finish' : 'quiz-next') + '"' +
            (blocked ? ' disabled' : '') + '>' +
            (last ? 'Build my plan' : 'Next') + '</button>' +
        '</div>' +
        (blocked ? '<p class="dim tiny" style="margin-top:10px">Answer everything on this page to continue.</p>' : '') +
      '</div>';
  };

  function question(q, answers) {
    var v = answers[q.id];
    var out = '<div class="q"><div class="q-text">' + esc(q.text) + '</div>';

    if (q.type === 'text') {
      out += q.optional ? '<p class="q-note">Optional, but worth doing.</p>' : '';
      out += q.short
        ? '<input type="text" data-input="' + q.id + '" value="' + esc(v || '') +
          '" placeholder="' + esc(q.placeholder || '') + '">'
        : '<textarea data-input="' + q.id + '" placeholder="' + esc(q.placeholder || '') + '">' +
          esc(v || '') + '</textarea>';

    } else if (q.type === 'scale') {
      out += '<div class="scale">';
      for (var n = 1; n <= 5; n++) {
        out += '<button type="button" data-act="set" data-q="' + q.id + '" data-v="' + n + '"' +
          ' aria-pressed="' + (v === n) + '">' +
          '<b>' + n + '</b><span>' + esc(q.labels[n - 1]) + '</span></button>';
      }
      out += '</div>';

    } else {
      var multi = q.type === 'multi';
      if (multi) {
        var chosen = Array.isArray(v) ? v.length : 0;
        out += '<p class="q-note">Choose up to ' + q.max + '. ' + chosen + ' selected.</p>';
      }
      out += q.options.map(function (o) {
        var on = multi ? (Array.isArray(v) && v.indexOf(o.v) !== -1) : v === o.v;
        return '<button type="button" class="opt" aria-pressed="' + on + '"' +
          ' data-act="' + (multi ? 'toggle' : 'set') + '" data-q="' + q.id + '" data-v="' + esc(o.v) + '"' +
          (multi ? ' data-max="' + q.max + '"' : '') + '>' +
          '<span class="opt-label">' + esc(o.label) + '</span>' +
          (o.note ? '<span class="opt-note">' + esc(o.note) + '</span>' : '') +
          '</button>';
      }).join('');
    }
    return out + '</div>';
  }

  /* ---------- plan reveal ---------- */

  U.reveal = function (st) {
    var plan = st.plan;
    var name = (st.answers.name || '').trim();
    var k0 = plan.keystones[0], k1 = plan.keystones[1];
    var D = MS.DIMENSIONS;

    return '' +
      '<div class="wrap">' +
        '<p class="eyebrow">Your reading</p>' +
        '<h1 style="margin:10px 0 20px">' +
          (name ? esc(name) + ', here' : 'Here') + ' is what the answers say.</h1>' +

        '<div class="card">' +
          '<p class="eyebrow">Keystone one · ' + esc(D[k0].label) + '</p>' +
          '<p class="muted" style="margin:8px 0 0">' + esc(MS.DIM_READ[k0]) + '</p>' +
        '</div>' +
        '<div class="card">' +
          '<p class="eyebrow">Keystone two · ' + esc(D[k1].label) + '</p>' +
          '<p class="muted" style="margin:8px 0 0">' + esc(MS.DIM_READ[k1]) + '</p>' +
        '</div>' +
        '<div class="card">' +
          '<p class="eyebrow">What you have going for you · ' + esc(D[plan.strength].label) + '</p>' +
          '<p class="muted" style="margin:8px 0 0">' + esc(MS.DIM_STRENGTH[plan.strength]) + '</p>' +
        '</div>' +

        '<hr class="divider">' +
        '<p class="eyebrow">Where you scored</p>' +
        '<div class="bars" style="margin-top:14px">' + U.bars(plan.scores, plan.keystones) + '</div>' +
        '<p class="dim tiny" style="margin-top:12px">These are a snapshot of how you answered today, not a verdict. ' +
        'You will re-score at the end of each phase and see the movement.</p>' +

        (plan.relationship ? U.relationshipNote(st) : '') +

        '<hr class="divider">' +
        '<p class="eyebrow">The twelve weeks</p>' +
        '<div style="margin-top:16px">' + U.phaseList(plan, 1) + '</div>' +

        '<hr class="divider">' +
        '<p class="eyebrow">Your daily anchor</p>' +
        plan.anchors.map(function (id) {
          var t = MS.taskById(id);
          return '<div class="card" style="margin-top:12px"><h3>' + esc(t.title) + '</h3>' +
            '<p class="muted small" style="margin:8px 0 0">' + esc(t.detail) + '</p></div>';
        }).join('') +
        '<p class="dim tiny" style="margin-top:12px">This one repeats every day, rest days included. ' +
        'Everything else rotates.</p>' +

        '<div class="btn-row" style="margin-top:30px">' +
          '<button class="btn btn-block" data-act="begin">Start day one</button>' +
        '</div>' +
      '</div>';
  };

  /* The honest framing, shown once at reveal and again on the plan screen.
   * It is the difference between a growth plan and a manipulation manual. */
  U.relationshipNote = function (st) {
    var want = st.answers.relWant;
    var space = st.answers.relSpace;
    return '' +
      '<hr class="divider">' +
      '<p class="eyebrow">About the relationship</p>' +
      '<div class="note" style="margin-top:14px">' +
        '<p style="margin:0 0 10px"><strong>This plan works on you, not on them.</strong> There are no scripts here for ' +
        'getting a particular response out of another person, and that is not squeamishness — tactics aimed at ' +
        'someone tend to be visible, and they do not survive contact with a real relationship anyway.</p>' +
        '<p style="margin:0 0 10px">What is here instead: steadiness under pressure, hearing something hard without ' +
        'defending, naming your part without an excuse attached, and building a life that is not resting entirely ' +
        'on one answer. If reconciliation happens, those are the things that make it hold. If it does not, they are ' +
        'still the things you wanted.</p>' +
        (space === 'no' || space === 'mostly'
          ? '<p style="margin:0 0 10px"><strong>You said you are not fully giving the space they asked for.</strong> ' +
            'Start there. Respecting a stated boundary is the only evidence of change that is visible from a distance, ' +
            'and it is the one piece of this you can do today.</p>'
          : '') +
        (want === 'reconcile'
          ? '<p style="margin:0">You said you want to rebuild it. Worth holding alongside that: they get to want ' +
            'something different, and no amount of work on your side obliges them. Phase three has a task that is ' +
            'specifically about holding both of those at once.</p>'
          : '<p style="margin:0">Whatever this ends up being, the work is the same.</p>') +
      '</div>';
  };

  /* ---------- shared renderers ---------- */

  U.bars = function (scores, keystones, previous) {
    return MS.DIM_KEYS
      .slice()
      .sort(function (a, b) { return scores[a] - scores[b]; })
      .map(function (k) {
        var key = keystones && keystones.indexOf(k) !== -1;
        var prev = previous && typeof previous[k] === 'number' ? previous[k] : null;
        var delta = prev !== null ? scores[k] - prev : null;
        return '<div class="bar-row' + (key ? ' key' : '') + '">' +
          '<span class="bar-key">' + esc(MS.DIMENSIONS[k].short) + '</span>' +
          '<span class="bar"><i style="width:' + scores[k] + '%"></i>' +
            (prev !== null ? '<u style="left:calc(' + prev + '% - 1px)"></u>' : '') +
          '</span>' +
          '<span class="bar-val">' + scores[k] +
            (delta ? '<br><span class="tiny" style="color:' + (delta > 0 ? 'var(--good)' : 'var(--ink-3)') + '">' +
              (delta > 0 ? '+' : '') + delta + '</span>' : '') +
          '</span>' +
        '</div>';
      }).join('');
  };

  U.phaseList = function (plan, currentN) {
    return plan.phases.map(function (p) {
      var cls = p.n === currentN ? ' now' : (p.n < currentN ? ' past' : '');
      return '<div class="phase' + cls + '">' +
        '<h3>' + esc(p.name) +
          '<span class="dim tiny" style="font-family:var(--font-body);font-weight:500">Weeks ' +
            p.weeks[0] + '–' + p.weeks[1] + '</span>' +
        '</h3>' +
        '<p class="muted small" style="margin:6px 0 0"><em>' + esc(p.line) + '</em></p>' +
        '<p class="muted small" style="margin:8px 0 0">' + esc(p.body) + '</p>' +
        '<ul class="ms">' + p.milestones.map(function (m) {
          return '<li>' + esc(m.text) + '</li>';
        }).join('') + '</ul>' +
      '</div>';
    }).join('');
  };
})(window.MS = window.MS || {});
