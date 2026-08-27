/* Museschool — persistence. Everything lives in this browser and nowhere else.
 * No account, no server, no network call. That is deliberate: the quiz asks
 * for things people would not type into someone else's database. */
(function (MS) {
  'use strict';

  var KEY = 'museschool.v1';

  function blank() {
    return {
      v: 1,
      createdAt: new Date().toISOString(),
      answers: {},
      plan: null,
      quizSection: 0,
      log: {},        // dayKey -> { tasks:{id:true}, done, mood, energy, note }
      journal: [],    // { date, taskId, title, text, ts }
      checkins: [],   // { date, scores }
      lessonsRead: {},// lessonId -> dayKey first read
      recheckDraft: {},// a re-score in progress, so closing the app mid-way loses nothing
      lastBackup: null,// dayKey of the last successful backup
      settings: { theme: 'auto' }
    };
  }

  var state = blank();

  MS.store = {
    get: function () { return state; },

    load: function () {
      try {
        var raw = localStorage.getItem(KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && parsed.v === 1) state = Object.assign(blank(), parsed);
        }
      } catch (e) {
        // Private mode, blocked site data, corrupt JSON — start fresh rather
        // than dying on load.
        console.warn('Museschool: could not read saved data', e);
      }
      return state;
    },

    save: function () {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        console.warn('Museschool: could not save', e);
      }
    },

    reset: function () {
      state = blank();
      try { localStorage.removeItem(KEY); } catch (e) {}
    },

    /* ----- answers ----- */
    setAnswer: function (id, value) {
      state.answers[id] = value;
      this.save();
    },

    /* ----- daily log ----- */
    entry: function (key) {
      if (!state.log[key]) {
        state.log[key] = { tasks: {}, done: 0, mood: null, energy: null, note: '' };
      }
      return state.log[key];
    },

    toggleTask: function (key, taskId) {
      var e = this.entry(key);
      if (e.tasks[taskId]) delete e.tasks[taskId];
      else e.tasks[taskId] = true;
      e.done = Object.keys(e.tasks).length;
      this.save();
      return !!e.tasks[taskId];
    },

    setCheckin: function (key, field, value) {
      var e = this.entry(key);
      e[field] = value;
      this.save();
    },

    /* ----- journal ----- */
    saveJournal: function (date, taskId, title, text) {
      var found = state.journal.filter(function (j) {
        return j.date === date && j.taskId === taskId;
      })[0];
      if (found) {
        found.text = text;
        found.ts = Date.now();
      } else {
        state.journal.push({ date: date, taskId: taskId, title: title, text: text, ts: Date.now() });
      }
      this.save();
    },

    journalFor: function (date, taskId) {
      var f = state.journal.filter(function (j) {
        return j.date === date && j.taskId === taskId;
      })[0];
      return f ? f.text : '';
    },

    /* ----- lessons ----- */
    markRead: function (id) {
      if (!state.lessonsRead) state.lessonsRead = {};
      if (!state.lessonsRead[id]) {
        state.lessonsRead[id] = MS.dayKey();
        this.save();
      }
    },

    /* ----- re-assessment ----- */
    setRecheck: function (id, value) {
      if (!state.recheckDraft) state.recheckDraft = {};
      state.recheckDraft[id] = value;
      this.save();
    },

    clearRecheck: function () {
      state.recheckDraft = {};
      this.save();
    },

    addCheckin: function (scores) {
      state.checkins.push({ date: MS.dayKey(), scores: scores });
      this.save();
    },

    /* ----- portability ----- */
    markBackup: function () {
      state.lastBackup = MS.dayKey();
      this.save();
    },

    exportJSON: function () {
      return JSON.stringify(state, null, 2);
    },

    importJSON: function (text) {
      var parsed = JSON.parse(text);
      if (!parsed || parsed.v !== 1) throw new Error('Not a Museschool backup file.');
      state = Object.assign(blank(), parsed);
      this.save();
    }
  };
})(window.MS = window.MS || {});
