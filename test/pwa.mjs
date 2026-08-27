/* Checks the app is genuinely installable and works with the network cut.
 * Needs the app served over http (a service worker will not register on file://):
 *   python3 -m http.server 8123 && APP_URL=http://localhost:8123/index.html node test/pwa.mjs
 */
import { chromium } from 'playwright';
const URL_ = process.env.APP_URL || 'http://localhost:8123/index.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
const pg = await ctx.newPage();
const fail = [];
pg.on('pageerror', (e) => fail.push('PAGEERROR: ' + e.message));

await pg.goto(URL_);
await pg.waitForSelector('#app h1');

// --- the install metadata iOS and Android read ---
const meta = await pg.evaluate(() => ({
  manifest: document.querySelector('link[rel=manifest]')?.getAttribute('href'),
  appleIcon: document.querySelector('link[rel=apple-touch-icon]')?.getAttribute('href'),
  appleCapable: document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.content,
  appleTitle: document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content,
  themeColor: document.querySelector('meta[name=theme-color]')?.content
}));
console.log('install metadata:', JSON.stringify(meta));
for (const [k, v] of Object.entries(meta)) if (!v) fail.push(`missing ${k}`);

const mf = await (await ctx.request.get(new URL(meta.manifest, URL_).href)).json();
console.log('manifest:', mf.name, '|', mf.display, '| icons:', mf.icons.length);
if (mf.display !== 'standalone') fail.push('manifest display is not standalone');
for (const ic of mf.icons) {
  const r = await ctx.request.get(new URL(ic.src, URL_).href);
  if (!r.ok()) fail.push(`icon missing: ${ic.src}`);
}
const appleIconRes = await ctx.request.get(new URL(meta.appleIcon, URL_).href);
if (!appleIconRes.ok()) fail.push('apple-touch-icon missing');
console.log('all icons resolve:', !fail.some((f) => f.includes('icon')));

// --- service worker ---
const reg = await pg.evaluate(() =>
  navigator.serviceWorker.ready.then((r) => !!r.active).catch(() => false));
console.log('service worker active:', reg);
if (!reg) fail.push('service worker did not activate');

// Let the shell finish caching before pulling the plug.
await pg.waitForTimeout(1500);

// --- offline ---
await ctx.setOffline(true);
await pg.reload();
const bootedOffline = await pg.waitForSelector('#app h1', { timeout: 8000 })
  .then(() => true).catch(() => false);
console.log('boots with the network cut:', bootedOffline);
if (!bootedOffline) fail.push('app did not boot offline');

if (bootedOffline) {
  // And the whole flow is still usable, not just the shell.
  const usable = await pg.evaluate(() => {
    const a = { name: 'Offline', goals: ['partnership'], primaryGoal: 'partnership',
                kids: '2', minutes: '20', days: '6' };
    MS.QUIZ.forEach((s) => { if (s.when && !s.when(a)) return;
      s.questions.forEach((q) => { if (q.type === 'scale') a[q.id] = 3; }); });
    const st = MS.store.get();
    st.answers = a; st.plan = MS.buildPlan(a, MS.dayKey());
    MS.store.save(); MS.view = 'today'; MS.render();
    return document.querySelectorAll('.task').length;
  });
  console.log('offline: plan builds and renders', usable, 'tasks');
  if (!usable) fail.push('could not build a plan offline');
}

await ctx.setOffline(false);
console.log(fail.length ? '\nFAILURES:\n' + fail.join('\n') : '\nall PWA checks passed');
await b.close();
process.exit(fail.length ? 1 : 0);
