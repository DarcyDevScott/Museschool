/* Mendday — milestone counting.
 *
 * The only thing in this app that talks to a network. It exists to answer one
 * question: does anyone actually get anywhere with this?
 *
 * Constraints it is built to:
 *   - it can only ever send one of seven fixed words. Not a session id, not a
 *     score, not a date, and never anything anyone typed.
 *   - each milestone fires at most once, ever, on a device
 *   - off entirely unless an endpoint is configured, so a self-hosted or
 *     offline copy sends nothing at all
 *   - honours Do Not Track and Global Privacy Control without being asked
 *   - fails silently: no error, no retry, no effect on the app
 */
(function (MS) {
  'use strict';

  // Set by the deployment. Absent means this whole file does nothing.
  var ENDPOINT = (window.MENDDAY_INSIGHT_ENDPOINT || '').trim();

  var MILESTONES = [
    'quiz_started', 'quiz_finished', 'installed_open',
    'day_7', 'day_30', 'day_84', 'rescored'
  ];

  function signalsNo() {
    try {
      if (navigator.globalPrivacyControl === true) return true;
      var dnt = navigator.doNotTrack || window.doNotTrack;
      return dnt === '1' || dnt === 'yes';
    } catch (e) { return false; }
  }

  function launchedFromHomeScreen() {
    try {
      return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;   // iOS Safari's own flag
    } catch (e) { return false; }
  }

  MS.insight = {
    milestones: MILESTONES,

    configured: function () { return !!ENDPOINT; },

    /* Off when: not deployed with an endpoint, the person turned it off, or
     * their browser says not to track. */
    enabled: function () {
      if (!ENDPOINT || signalsNo()) return false;
      var st = MS.store.get();
      return st.settings.insight !== false;
    },

    /* Has this milestone already been counted on this device? */
    marked: function (name) {
      return !!(MS.store.get().marks || {})[name];
    },

    /* Count a milestone, once ever. Returns true if something was sent. */
    mark: function (name) {
      if (MILESTONES.indexOf(name) === -1) return false;   // never send anything else
      var st = MS.store.get();
      if (!st.marks) st.marks = {};
      if (st.marks[name]) return false;

      // Recorded locally whether or not it is sent, so turning counting on
      // later cannot backfill a burst of milestones already passed.
      st.marks[name] = MS.dayKey();
      MS.store.save();

      if (!this.enabled()) return false;
      try {
        var body = JSON.stringify({ m: name });
        // keepalive so a milestone fired as the app closes still goes.
        if (navigator.sendBeacon) {
          navigator.sendBeacon(ENDPOINT + '/e', new Blob([body], { type: 'application/json' }));
        } else {
          fetch(ENDPOINT + '/e', {
            method: 'POST', body: body, keepalive: true,
            headers: { 'Content-Type': 'application/json' }
          }).catch(function () {});
        }
        return true;
      } catch (e) {
        return false;   // never let counting break the app
      }
    },

    /* Called on every open: notes an installed launch and how far in they are. */
    check: function () {
      if (launchedFromHomeScreen()) this.mark('installed_open');
      var st = MS.store.get();
      if (!st.plan) return;
      var day = MS.dayInfo(st.plan, MS.dayKey()).dayNumber;
      if (day >= 7) this.mark('day_7');
      if (day >= 30) this.mark('day_30');
      if (day >= 84) this.mark('day_84');
    }
  };
})(window.MS = window.MS || {});
