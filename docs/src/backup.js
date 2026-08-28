/* Museschool — getting your data out of the browser and back in.
 *
 * There is no iCloud API for the web, so nothing here syncs by itself on a
 * phone. What it does is make saving a file to iCloud Drive one tap, and
 * nag you when it has been a while.
 *
 * Four routes, best first:
 *   1. navigator.share with a file — the iOS share sheet, where "Save to
 *      Files" writes straight into iCloud Drive. Works in an installed PWA.
 *   2. showSaveFilePicker — desktop Chrome and Edge. The handle is kept, so
 *      after the first pick the same file can be rewritten automatically.
 *   3. a download link — most other browsers.
 *   4. the claude.ai viewer's own save prompt, where ordinary downloads are
 *      blocked. Absent everywhere else, and resolved asynchronously.
 *   5. the clipboard — the last resort.
 */
(function (MS) {
  'use strict';

  var FILENAME = 'museschool-backup.json';
  var TYPES = [{ description: 'Museschool backup', accept: { 'application/json': ['.json'] } }];

  function json() { return MS.store.exportJSON(); }
  function file() { return new File([json()], FILENAME, { type: 'application/json' }); }

  /* ---------- capabilities ---------- */

  function canShareFiles() {
    try {
      return !!(navigator.share && navigator.canShare &&
        navigator.canShare({ files: [new File(['{}'], FILENAME, { type: 'application/json' })] }));
    } catch (e) { return false; }
  }

  function canPick() { return typeof window.showSaveFilePicker === 'function'; }

  /* ---------- the claude.ai viewer ----------
   * A published artifact runs framed, with downloads blocked, but the viewer
   * offers its own save prompt. It arrives asynchronously and never on the
   * first run, so the UI renders without it and picks it up when it lands. */

  var viewerSave = null;

  function framed() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }

  MS.backup = MS.backup || {};

  /* Resolves true if the viewer granted a save route. Safe everywhere:
   * outside the viewer window.claude does not exist at all. */
  async function findViewerSave() {
    if (!window.claude || typeof window.claude.use !== 'function') return false;
    try {
      viewerSave = await window.claude.use('downloads');
    } catch (e) {
      viewerSave = null;
    }
    return !!viewerSave;
  }

  /* ---------- the remembered file handle (desktop only) ----------
   * File handles cannot go in localStorage, so they live in IndexedDB. */

  var DB = 'museschool-fs', STORE = 'handles';

  function withStore(mode, fn) {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('no indexedDB'));
      var req = indexedDB.open(DB, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
      req.onerror = function () { reject(req.error); };
      req.onsuccess = function () {
        var db = req.result;
        var tx = db.transaction(STORE, mode);
        var out = fn(tx.objectStore(STORE));
        tx.oncomplete = function () { db.close(); resolve(out && out.result); };
        tx.onerror = function () { db.close(); reject(tx.error); };
      };
    });
  }

  function putHandle(h) { return withStore('readwrite', function (s) { return s.put(h, 'backup'); }); }
  function getHandle() { return withStore('readonly', function (s) { return s.get('backup'); }); }
  function dropHandle() { return withStore('readwrite', function (s) { return s.delete('backup'); }); }

  async function writable(handle, ask) {
    if (!handle || !handle.queryPermission) return false;
    var opts = { mode: 'readwrite' };
    if (await handle.queryPermission(opts) === 'granted') return true;
    if (!ask) return false;
    return await handle.requestPermission(opts) === 'granted';
  }

  async function writeTo(handle) {
    var w = await handle.createWritable();
    await w.write(json());
    await w.close();
  }

  /* ---------- public ---------- */

  MS.backup = {
    filename: FILENAME,

    /* What this browser can actually do, so the UI can say so honestly. */
    ability: function () {
      // Framed, the share sheet and the file picker are usually blocked by the
      // sandbox even when the APIs exist, so the viewer's own route wins.
      if (framed()) return viewerSave ? 'viewer' : 'clipboard';
      if (canShareFiles()) return 'share';
      if (canPick()) return 'pick';
      return 'download';
    },

    /* Called once at boot. Resolves true if the answer changed the UI. */
    async detect() {
      if (!framed()) return false;
      return await findViewerSave();
    },

    /* Whether this browser can keep a file up to date without being asked
     * again. Safari cannot, which includes every browser on an iPhone. */
    canAutoSave: canPick,

    async isAutoSaving() {
      if (!canPick()) return false;
      try { return !!(await getHandle()); } catch (e) { return false; }
    },

    /* Save now. Returns 'shared' | 'saved' | 'downloaded' | 'copied' | 'cancelled'. */
    async save() {
      var how = this.ability();

      if (how === 'viewer') {
        try {
          await viewerSave.save({ filename: FILENAME, data: json() });
          MS.store.markBackup();
          return 'saved';
        } catch (e) {
          // The viewer declining is not a failure worth a fallback.
          if (e && e.code === 'declined') return 'cancelled';
          how = 'clipboard';
        }
      }

      if (how === 'share') {
        try {
          await navigator.share({ files: [file()], title: 'Museschool backup' });
          MS.store.markBackup();
          return 'shared';
        } catch (e) {
          if (e && e.name === 'AbortError') return 'cancelled';
          how = canPick() ? 'pick' : 'download';   // share refused; fall through
        }
      }

      if (how === 'pick') {
        try {
          var handle = await getHandle().catch(function () { return null; });
          if (!handle || !(await writable(handle, true))) {
            handle = await window.showSaveFilePicker({ suggestedName: FILENAME, types: TYPES });
            await putHandle(handle).catch(function () {});
          }
          await writeTo(handle);
          MS.store.markBackup();
          return 'saved';
        } catch (e) {
          if (e && e.name === 'AbortError') return 'cancelled';
          how = 'download';
        }
      }

      if (how === 'download') {
        try {
          var url = URL.createObjectURL(new Blob([json()], { type: 'application/json' }));
          var a = document.createElement('a');
          a.href = url; a.download = FILENAME;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
          MS.store.markBackup();
          return 'downloaded';
        } catch (e) { /* fall through to the clipboard */ }
      }

      await navigator.clipboard.writeText(json());
      MS.store.markBackup();
      return 'copied';
    },

    /* Rewrite the remembered file with no prompt. Silent by design — it runs
     * after ordinary edits and must never interrupt anything. */
    async autoSave() {
      if (!canPick()) return false;
      try {
        var handle = await getHandle();
        if (!handle || !(await writable(handle, false))) return false;
        await writeTo(handle);
        MS.store.markBackup();
        return true;
      } catch (e) { return false; }
    },

    async stopAutoSave() { try { await dropHandle(); } catch (e) {} },

    /* Read a file the user picked and load it. Throws if it is not ours. */
    async restoreFrom(f) {
      var text = await f.text();
      MS.store.importJSON(text);
    },

    /* Days since the last backup, or null if there has never been one. */
    staleness: function () {
      var st = MS.store.get();
      if (!st.lastBackup) return null;
      return MS.daysBetween(st.lastBackup, MS.dayKey());
    },

    /* Whether to nag. Only once there is something worth losing. */
    shouldNag: function () {
      var st = MS.store.get();
      var worth = (st.journal || []).length >= 3 || Object.keys(st.log || {}).length >= 7;
      if (!worth) return false;
      var days = this.staleness();
      return days === null ? true : days >= 14;
    }
  };
})(window.MS = window.MS || {});
