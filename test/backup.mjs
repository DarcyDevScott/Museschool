/* Backup and restore, including the iOS share-sheet path simulated by
 * stubbing navigator.share the way Safari exposes it.
 *   APP_URL=http://localhost:8123/index.html node test/backup.mjs
 */
import { chromium } from 'playwright';
const URL_ = process.env.APP_URL || 'http://localhost:8123/index.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const fail = [];
const ok = (l, c, x = '') => (console.log(`  ${c ? 'ok  ' : 'FAIL'} ${l}${x ? ' — ' + x : ''}`), c || fail.push(l));

async function fresh({ share = false, picker = true } = {}) {
  const ctx = await b.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ['clipboard-read', 'clipboard-write']
  });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => fail.push('PAGEERROR: ' + e.message));
  if (share) {
    // Safari on iOS: share + canShare exist and accept files.
    await pg.addInitScript(() => {
      window.__shared = null;
      navigator.canShare = (d) => !!(d && d.files && d.files.length);
      navigator.share = async (d) => {
        window.__shared = { name: d.files[0].name, type: d.files[0].type,
                            text: await d.files[0].text() };
      };
    });
  } else {
    await pg.addInitScript(() => { delete navigator.share; delete navigator.canShare; });
  }
  // Safari and Firefox have no showSaveFilePicker, so the download route runs.
  if (!picker) await pg.addInitScript(() => { delete window.showSaveFilePicker; });
  await pg.goto(URL_);
  await pg.waitForFunction(() => window.MS && window.MS.backup);
  return { ctx, pg };
}

const seed = (pg, days = 20) => pg.evaluate((days) => {
  const a = { name: 'Sam', goals: ['relationship', 'partnership'], primaryGoal: 'relationship',
              kids: '2', minutes: '20', days: '6' };
  MS.QUIZ.forEach((s) => { if (s.when && !s.when(a)) return;
    s.questions.forEach((q) => { if (q.type === 'scale') a[q.id] = 3; }); });
  const st = MS.store.get();
  st.answers = a;
  st.plan = MS.buildPlan(a, MS.addDays(MS.dayKey(), -days));
  for (let i = 0; i < days; i++) {
    const k = MS.addDays(st.plan.startKey, i);
    st.log[k] = { tasks: {}, done: 2, mood: 4, energy: 3, note: 'day ' + i };
  }
  st.journal = [{ date: MS.dayKey(), taskId: 'j_s1', title: 'Three lines',
                  text: 'Something private I would hate to lose.', ts: Date.now() }];
  MS.store.save(); MS.view = 'today'; MS.render();
}, days);

console.log('\n1. iOS: the share sheet gets a real .json file');
let { ctx, pg } = await fresh({ share: true });
await seed(pg);
ok('ability reported as share', (await pg.evaluate(() => MS.backup.ability())) === 'share');
ok('button says Save to Files',
  (await pg.evaluate(() => MS.ui.backupVerb())) === 'Save to Files');
await pg.locator('.nav [data-view="settings"]').click();
await pg.locator('[data-act="backup-save"]').click();
await pg.waitForTimeout(600);
const shared = await pg.evaluate(() => window.__shared);
ok('a file was handed to the share sheet', !!shared, shared && shared.name);
ok('it is json', shared && shared.type === 'application/json');
const parsed = shared && JSON.parse(shared.text);
ok('it contains the journal', !!parsed && parsed.journal[0].text.includes('private'));
ok('it contains the plan and log', !!parsed && !!parsed.plan && Object.keys(parsed.log).length === 20);
ok('last-backup date recorded', !!(await pg.evaluate(() => MS.store.get().lastBackup)));
const backupJson = shared && shared.text;
await ctx.close();

console.log('\n2. The nag appears only once there is something to lose');
({ ctx, pg } = await fresh({ share: true }));
ok('no nag on a brand-new install', !(await pg.evaluate(() => MS.backup.shouldNag())));
await seed(pg);
ok('nag once there is real data', await pg.evaluate(() => MS.backup.shouldNag()));
await pg.evaluate(() => { MS.view = 'today'; MS.render(); });
ok('nag is visible on Today',
  (await pg.locator('.note', { hasText: 'Worth taking a backup' }).count()) === 1);
await pg.evaluate(() => MS.store.markBackup());
ok('nag gone after backing up', !(await pg.evaluate(() => MS.backup.shouldNag())));
await pg.evaluate(() => {
  const st = MS.store.get(); st.lastBackup = MS.addDays(MS.dayKey(), -20); MS.store.save();
});
ok('nag returns after 20 days', await pg.evaluate(() => MS.backup.shouldNag()));
await ctx.close();

console.log('\n3. Restoring from a file, onto a wiped install');
({ ctx, pg } = await fresh({ share: true }));
ok('starts empty', !(await pg.evaluate(() => MS.store.get().plan)));
// A fresh install has no nav — restore must be reachable from the welcome screen.
ok('restore offered before any plan exists',
  (await pg.locator('[data-act="backup-restore"]').count()) === 1);
await pg.locator('[data-act="backup-restore"]').click();
await pg.locator('#restore-file').setInputFiles({
  name: 'museschool-backup.json', mimeType: 'application/json', buffer: Buffer.from(backupJson)
});
await pg.waitForTimeout(700);
const back = await pg.evaluate(() => {
  const st = MS.store.get();
  return { name: st.answers.name, days: Object.keys(st.log).length,
           journal: st.journal[0] && st.journal[0].text, plan: !!st.plan };
});
ok('answers restored', back.name === 'Sam');
ok('plan restored', back.plan);
ok('all 20 logged days restored', back.days === 20, back.days + ' days');
ok('journal restored', (back.journal || '').includes('private'));
await ctx.close();

console.log('\n4. A file that is not ours is refused, without damage');
({ ctx, pg } = await fresh({ share: true }));
await seed(pg);
await pg.locator('.nav [data-view="settings"]').click();
await pg.locator('[data-act="backup-restore"]').click();
await pg.locator('#restore-file').setInputFiles({
  name: 'holiday.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":"world"}')
});
await pg.waitForTimeout(600);
ok('rejected with a message',
  (await pg.locator('.toast').innerText()).toLowerCase().includes('not a museschool'));
ok('existing data untouched', (await pg.evaluate(() => MS.store.get().answers.name)) === 'Sam');
await ctx.close();

console.log('\n5. No share support: falls back to a download');
({ ctx, pg } = await fresh({ share: false }));
await seed(pg);
const ability = await pg.evaluate(() => MS.backup.ability());
console.log('  ability without share:', ability);
ok('falls back to a file route', ability === 'pick' || ability === 'download');
await pg.locator('.nav [data-view="settings"]').click();
const dl = pg.waitForEvent('download', { timeout: 6000 }).catch(() => null);
await pg.locator('[data-act="backup-save"]').click();
const got = await dl;
if (got) {
  ok('download filename is right', got.suggestedFilename() === 'museschool-backup.json',
     got.suggestedFilename());
} else {
  ok('download route reached (picker path)', ability === 'pick');
}
await ctx.close();

console.log('\n6. No share and no picker: a plain download');
({ ctx, pg } = await fresh({ share: false, picker: false }));
await seed(pg);
ok('ability reported as download', (await pg.evaluate(() => MS.backup.ability())) === 'download');
await pg.locator('.nav [data-view="settings"]').click();
const dl2 = pg.waitForEvent('download', { timeout: 6000 }).catch(() => null);
await pg.locator('[data-act="backup-save"]').click();
const file2 = await dl2;
ok('a file downloaded', !!file2, file2 && file2.suggestedFilename());
if (file2) {
  const { readFileSync } = await import('node:fs');
  const body = JSON.parse(readFileSync(await file2.path(), 'utf8'));
  ok('the downloaded file is a usable backup', body.v === 1 && !!body.plan && !!body.journal);
}
ok('auto-save correctly hidden without a picker',
  !(await pg.evaluate(() => MS.backup.canAutoSave())));
await ctx.close();

console.log('\n7. Framed with no save route granted');
{
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 },
                                    permissions: ['clipboard-read', 'clipboard-write'] });
  // Applies to every frame, so the app sees it inside the iframe.
  await ctx2.addInitScript(() => {
    window.claude = { use: () => new Promise((r) => setTimeout(() => r(null), 40)) };
  });
  const host = await ctx2.newPage();
  host.on('pageerror', (e) => fail.push('PAGEERROR(frame): ' + e.message));
  await host.goto('http://localhost:8123/');
  await host.setContent(`<iframe src="${URL_}" style="width:390px;height:800px;border:0"></iframe>`);
  const frame = await host.waitForSelector('iframe').then((h) => h.contentFrame());
  await frame.waitForFunction(() => window.MS && window.MS.backup);
  await host.waitForTimeout(900);
  const a7 = await frame.evaluate(() => MS.backup.ability());
  ok('framed with nothing granted falls back to the clipboard', a7 === 'clipboard', a7);
  ok('no download is attempted when framed', a7 !== 'download');
  await ctx2.close();
}

console.log('\n8. Framed with the viewer save route granted');
{
  const ctx3 = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx3.addInitScript(() => {
    window.__saved = null;
    window.claude = {
      use: (name) => new Promise((res) => setTimeout(() => res(
        name === 'downloads'
          ? { save: async (r) => { window.top.__saved = r; return { status: 'saved' }; } }
          : null), 40))
    };
  });
  const host = await ctx3.newPage();
  host.on('pageerror', (e) => fail.push('PAGEERROR(viewer): ' + e.message));
  await host.goto('http://localhost:8123/');
  await host.setContent(`<iframe src="${URL_}" style="width:390px;height:800px;border:0"></iframe>`);
  const frame = await host.waitForSelector('iframe').then((h) => h.contentFrame());
  await frame.waitForFunction(() => window.MS && window.MS.backup);
  const detected = await frame.waitForFunction(() => MS.backup.ability() === 'viewer', null, { timeout: 6000 })
    .then(() => true).catch(() => false);
  ok('viewer route detected once it resolves asynchronously', detected,
     detected ? '' : 'still ' + (await frame.evaluate(() => MS.backup.ability())));
  ok('button label matches the route',
     (await frame.evaluate(() => MS.ui.backupVerb())) === 'Save a backup file');

  await frame.evaluate(() => {
    const a = { name: 'Sam', goals: ['partnership'], primaryGoal: 'partnership',
                kids: '2', minutes: '20', days: '6' };
    MS.QUIZ.forEach((s) => { if (s.when && !s.when(a)) return;
      s.questions.forEach((q) => { if (q.type === 'scale') a[q.id] = 3; }); });
    const st = MS.store.get();
    st.answers = a; st.plan = MS.buildPlan(a, MS.dayKey());
    MS.store.save(); MS.view = 'settings'; MS.render();
  });
  await frame.waitForSelector('[data-act="backup-save"]');
  await frame.click('[data-act="backup-save"]');
  await host.waitForTimeout(800);
  const saved = await host.evaluate(() => window.__saved);
  ok('saved through the viewer', !!saved, saved && saved.filename);
  ok('filename ends .json', saved && /\.json$/.test(saved.filename));
  const body = saved && JSON.parse(saved.data);
  ok('the payload is a usable backup', !!body && body.v === 1 && !!body.plan);
  ok('backup date recorded', !!(await frame.evaluate(() => MS.store.get().lastBackup)));
  await ctx3.close();
}

console.log(fail.length ? '\nFAILURES:\n' + fail.join('\n') : '\nbackup and restore all good');
await b.close();
process.exit(fail.length ? 1 : 0);
