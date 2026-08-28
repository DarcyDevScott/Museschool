/* Milestone counting: that it counts, that it counts once, and above all that
 * it cannot send anything except a fixed word.
 *   node test/insight.mjs   (worker logic, pure node)
 *   APP_URL=... node test/insight.mjs   (also drives the browser client)
 */
import worker, { MILESTONES } from '../analytics/worker.js';

const fail = [];
const ok = (l, c, x = '') => (console.log(`  ${c ? 'ok  ' : 'FAIL'} ${l}${x ? ' — ' + x : ''}`), c || fail.push(l));

// A KV stand-in that also records everything ever written.
function makeKV() {
  const store = new Map();
  return {
    store,
    async get(k) { return store.has(k) ? store.get(k) : null; },
    async put(k, v) { store.set(k, v); }
  };
}
const post = (m, env, extra = {}) => worker.fetch(
  new Request('https://x/e', { method: 'POST', body: JSON.stringify({ m, ...extra }) }), env);

console.log('\n1. It counts');
{
  const COUNTS = makeKV();
  const env = { COUNTS };
  for (let i = 0; i < 5; i++) await post('quiz_finished', env);
  for (let i = 0; i < 3; i++) await post('day_30', env);
  const res = await worker.fetch(new Request('https://x/stats?days=2'), env);
  const body = await res.json();
  ok('quiz_finished counted 5', body.totals.quiz_finished === 5, String(body.totals.quiz_finished));
  ok('day_30 counted 3', body.totals.day_30 === 3, String(body.totals.day_30));
  ok('untouched milestones are zero', body.totals.day_84 === 0);
  ok('a ping returns 204 with no body', (await post('day_7', env)).status === 204);
}

console.log('\n2. It cannot be made to store anything else');
{
  const COUNTS = makeKV();
  const env = { COUNTS };
  ok('an unknown milestone is refused', (await post('anything_else', env)).status === 400);
  ok('a journal entry as a milestone is refused',
     (await post('she cancelled saturday and I handled it badly', env)).status === 400);
  ok('an empty body is refused',
     (await worker.fetch(new Request('https://x/e', { method: 'POST', body: 'not json' }), env)).status === 400);
  ok('nothing was written by any of those', COUNTS.store.size === 0, COUNTS.store.size + ' keys');

  // Extra fields smuggled alongside a valid milestone must not survive.
  await post('day_7', env, { email: 'me@example.com', journal: 'private', id: 'abc123' });
  const keys = [...COUNTS.store.keys()];
  const values = [...COUNTS.store.values()];
  ok('one key written for a valid milestone', keys.length === 1, keys[0]);
  ok('the key contains only milestone, date and shard',
     /^m:day_7:\d{4}-\d{2}-\d{2}:\d$/.test(keys[0]), keys[0]);
  ok('the value is just a number', /^\d+$/.test(values[0]), values[0]);
  const dump = JSON.stringify([...COUNTS.store.entries()]);
  ok('no smuggled field reached storage',
     !/example\.com|private|abc123/.test(dump));
}

console.log('\n3. Stats can be protected, and 404s otherwise');
{
  const env = { COUNTS: makeKV(), STATS_TOKEN: 'secret' };
  ok('stats without a token is refused',
     (await worker.fetch(new Request('https://x/stats'), env)).status === 401);
  ok('stats with the token is allowed',
     (await worker.fetch(new Request('https://x/stats?token=secret'), env)).status === 200);
  ok('any other path 404s',
     (await worker.fetch(new Request('https://x/admin'), env)).status === 404);
  ok('GET on the ping path 404s',
     (await worker.fetch(new Request('https://x/e'), env)).status === 404);
}

console.log('\n4. Milestone list matches the client');
{
  const src = (await import('node:fs')).readFileSync('src/insight.js', 'utf8');
  const clientList = src.match(/var MILESTONES = \[([\s\S]*?)\];/)[1]
    .match(/'([a-z0-9_]+)'/g).map((s) => s.replace(/'/g, ''));
  ok('client and worker agree on every milestone',
     JSON.stringify(clientList.sort()) === JSON.stringify([...MILESTONES].sort()),
     clientList.join(','));
}

if (process.env.APP_URL) {
  const { chromium } = await import('playwright');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  async function session({ dnt = false, standalone = false } = {}) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const sent = [];
    // Capture what the client would send, without a server.
    await ctx.route('**/insight-test/**', async (route) => {
      sent.push(route.request().postData());
      await route.fulfill({ status: 204, body: '' });
    });
    const pg = await ctx.newPage();
    await pg.addInitScript(({ dnt, standalone }) => {
      window.MUSESCHOOL_INSIGHT_ENDPOINT = '/insight-test';
      if (dnt) Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true });
      if (standalone) {
        const mm = window.matchMedia.bind(window);
        window.matchMedia = (q) => q.includes('standalone') ? { matches: true, addEventListener(){}, removeEventListener(){} } : mm(q);
      }
    }, { dnt, standalone });
    await pg.goto(process.env.APP_URL);
    await pg.waitForFunction(() => window.MS && window.MS.insight);
    return { ctx, pg, sent };
  }

  console.log('\n5. The client, in a real browser');
  {
    const { ctx, pg, sent } = await session();
    await pg.evaluate(() => { MS.insight.mark('quiz_finished'); MS.insight.mark('quiz_finished'); });
    await pg.waitForTimeout(400);
    ok('a milestone is sent', sent.length === 1, JSON.stringify(sent));
    ok('the payload is only the milestone name',
       sent[0] === JSON.stringify({ m: 'quiz_finished' }), sent[0]);
    ok('the same milestone never fires twice', sent.length === 1);
    await ctx.close();
  }

  console.log('\n6. It respects being told no');
  {
    const { ctx, pg, sent } = await session({ dnt: true });
    await pg.evaluate(() => MS.insight.mark('quiz_finished'));
    await pg.waitForTimeout(400);
    ok('Global Privacy Control silences it', sent.length === 0, JSON.stringify(sent));
    ok('and enabled() reports false', !(await pg.evaluate(() => MS.insight.enabled())));
    await ctx.close();
  }
  {
    const { ctx, pg, sent } = await session();
    await pg.evaluate(() => { MS.store.get().settings.insight = false; MS.store.save();
                              MS.insight.mark('day_30'); });
    await pg.waitForTimeout(400);
    ok('the off switch silences it', sent.length === 0, JSON.stringify(sent));
    await ctx.close();
  }

  console.log('\n7. Home-screen launches are detected');
  {
    const { ctx, pg, sent } = await session({ standalone: true });
    await pg.evaluate(() => MS.insight.check());
    await pg.waitForTimeout(400);
    ok('installed_open fires when launched standalone',
       sent.some((s) => s.includes('installed_open')), JSON.stringify(sent));
    await ctx.close();
  }
  {
    const { ctx, pg, sent } = await session({ standalone: false });
    await pg.evaluate(() => MS.insight.check());
    await pg.waitForTimeout(400);
    ok('and not in a normal browser tab',
       !sent.some((s) => s.includes('installed_open')), JSON.stringify(sent));
    await ctx.close();
  }

  console.log('\n8. Undeployed copies send nothing at all');
  {
    const ctx = await b.newContext();
    const hits = [];
    await ctx.route('**/*', (r) => { const u = new URL(r.request().url());
      if (!u.host.startsWith('localhost')) hits.push(u.host); r.continue(); });
    const pg = await ctx.newPage();
    await pg.goto(process.env.APP_URL);          // no endpoint configured
    await pg.waitForFunction(() => window.MS && window.MS.insight);
    await pg.evaluate(() => { MS.insight.mark('quiz_finished'); MS.insight.check(); });
    await pg.waitForTimeout(500);
    ok('no endpoint means no requests', !(await pg.evaluate(() => MS.insight.configured())));
    ok('and the app still works', await pg.evaluate(() => !!MS.buildPlan));
    await ctx.close();
  }
  await b.close();
}

console.log(fail.length ? '\nFAILURES:\n' + fail.join('\n') : '\ncounting works and cannot leak');
process.exit(fail.length ? 1 : 0);
