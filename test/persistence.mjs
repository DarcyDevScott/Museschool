/* Does progress actually survive? Each case does something, then destroys the
 * page without any graceful shutdown, and checks the data is still there.
 *   APP_URL=http://localhost:8123/index.html node test/persistence.mjs
 */
import { chromium } from 'playwright';
const URL_ = process.env.APP_URL || 'http://localhost:8123/index.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
// One context throughout: same origin, same storage, like one phone.
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const fail = [];
const ok = (label, cond, extra = '') =>
  console.log(`${cond ? '  ok  ' : '  FAIL'} ${label}${extra ? ' — ' + extra : ''}`) ||
  (cond || fail.push(label));

async function open_() {
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => fail.push('PAGEERROR: ' + e.message));
  await pg.goto(URL_);
  await pg.waitForFunction(() => window.MS && window.MS.buildPlan);
  return pg;
}
const read = (pg, fn) => pg.evaluate(fn);

console.log('\n1. Quiz answers save as you go, mid-quiz');
let pg = await open_();
await pg.evaluate(() => { MS.view = 'quiz'; MS.render(); });
await pg.locator('input[data-input="name"]').fill('Sam');
await pg.locator('.q').nth(1).locator('.opt').nth(2).click();     // age
await pg.locator('.q').nth(2).locator('.opt').nth(1).click();     // season
await pg.close();                                                  // no graceful exit
pg = await open_();
let st = await read(pg, () => MS.store.get());
ok('name survived', st.answers.name === 'Sam', JSON.stringify(st.answers.name));
ok('choices survived', !!st.answers.ageRange && !!st.answers.season);

console.log('\n2. Typing is flushed when the app is backgrounded');
await pg.evaluate(() => {
  const a = { name:'Sam', goals:['partnership'], primaryGoal:'partnership', kids:'2', minutes:'40', days:'6' };
  MS.QUIZ.forEach(s => { if (s.when && !s.when(a)) return;
    s.questions.forEach(q => { if (q.type === 'scale') a[q.id] = 3; }); });
  const s2 = MS.store.get(); s2.answers = a; s2.plan = MS.buildPlan(a, MS.dayKey());
  MS.store.save(); MS.view = 'today'; MS.render();
});
await pg.waitForSelector('.task');
await pg.locator('textarea[data-input="note"]').fill('Typed and immediately backgrounded.');
// Background it inside the 350ms debounce window, with no click to flush.
await pg.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
});
await pg.close();
pg = await open_();
st = await read(pg, () => MS.store.get());
const note = st.log[Object.keys(st.log)[0]]?.note;
ok('note written despite no graceful close', note === 'Typed and immediately backgrounded.', JSON.stringify(note));

console.log('\n3. Ticked tasks, mood, journal and lessons');
await pg.waitForSelector('.task');
for (const t of await pg.locator('.tick').all()) await t.click();
await pg.locator('[data-act="meter"][data-field="mood"][data-v="4"]').click();
const jbox = pg.locator('textarea[data-input="journal"]');
if (await jbox.count()) await jbox.first().fill('Journal entry that must survive.');
await pg.locator('.nav [data-view="learn"]').click();
await pg.waitForSelector('.lesson-row');
await pg.locator('.lesson-head').first().click();
await pg.waitForTimeout(500);
await pg.close();
pg = await open_();
st = await read(pg, () => MS.store.get());
const day = st.log[Object.keys(st.log)[0]];
ok('ticked tasks kept', day.done > 0, day.done + ' ticked');
ok('mood kept', day.mood === 4);
ok('journal kept', st.journal.some((j) => j.text === 'Journal entry that must survive.'));
ok('lesson marked read', Object.keys(st.lessonsRead).length > 0);

console.log('\n4. A re-score abandoned half way');
await pg.evaluate(() => {
  const s2 = MS.store.get();
  s2.plan.startKey = MS.addDays(MS.dayKey(), -22);   // push past a phase boundary
  MS.store.save(); MS.view = 'progress'; MS.render();
});
await pg.locator('[data-act="recheck"]').click();
await pg.waitForSelector('.q');
const qs = await pg.locator('.q').all();
for (const q of qs.slice(0, 5)) await q.locator('.scale button').nth(3).click();
await pg.close();                                    // killed mid re-score
pg = await open_();
const draft = await read(pg, () => Object.keys(MS.store.get().recheckDraft || {}).length);
ok('partial re-score kept', draft === 5, draft + ' of 18 answers');

console.log('\n5. Cancelling a re-score clears the draft');
await pg.evaluate(() => { MS.view = 'recheck'; MS.render(); });
await pg.waitForSelector('[data-act="recheck-cancel"]');
await pg.locator('[data-act="recheck-cancel"]').click();
await pg.waitForTimeout(200);
ok('draft cleared on cancel',
  (await read(pg, () => Object.keys(MS.store.get().recheckDraft || {}).length)) === 0);

console.log('\n6. Blocked storage degrades instead of crashing');
const pg2 = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await pg2.addInitScript(() => {
  const boom = () => { throw new Error('storage blocked'); };
  Object.defineProperty(window, 'localStorage', { get: boom, configurable: true });
});
const errs = [];
pg2.on('pageerror', (e) => errs.push(e.message));
await pg2.goto(URL_);
const booted = await pg2.waitForSelector('#app h1', { timeout: 5000 }).then(() => true).catch(() => false);
ok('app still boots with storage unavailable', booted && errs.length === 0, errs.join('; '));

console.log(fail.length ? '\nFAILURES:\n' + fail.join('\n') : '\nprogress is saved in every case tested');
await b.close();
process.exit(fail.length ? 1 : 0);
