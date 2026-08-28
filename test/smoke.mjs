/* End-to-end smoke test: drives the whole quiz, ticks a day, visits every
 * screen and reloads to confirm persistence. Screenshots land in SHOT_DIR.
 *   node build.mjs && node test/smoke.mjs
 */
import { chromium } from 'playwright';
const SHOT = process.env.SHOT_DIR || '/tmp/mendday-shots';
import { mkdirSync } from 'node:fs';
mkdirSync(SHOT, { recursive: true });

const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await b.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
pg.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
pg.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await pg.goto(`${process.env.APP_URL || 'file://' + process.cwd() + '/dist/standalone.html'}`);
await pg.waitForSelector('#app h1');
console.log('welcome:', await pg.locator('h1').first().innerText());
await pg.screenshot({ path: `${SHOT}/01-welcome.png`, fullPage: true });

await pg.getByText('Start the quiz').click();

// Answer every section until the finish button appears.
let section = 0;
for (;;) {
  await pg.waitForSelector('.q, [data-act="quiz-finish"]');
  const title = await pg.locator('#app h2').first().innerText();
  const qs = await pg.locator('.q').all();
  for (const q of qs) {
    const scale = q.locator('.scale button');
    const opts = q.locator('.opt');
    const ta = q.locator('textarea, input[type="text"]');
    if (await scale.count()) {
      // Deliberately weak on regulation/ownership so keystones are predictable.
      const txt = await q.locator('.q-text').innerText();
      await scale.nth(2).click();
    } else if (await opts.count()) {
      const note = await q.locator('.q-note').count() ? await q.locator('.q-note').innerText() : '';
      const n = /up to (\d)/.exec(note);
      if (n) { for (let i = 0; i < Number(n[1]); i++) await opts.nth(i).click(); }
      else if ((await q.locator('.q-text').innerText()).startsWith('Do you have children')) {
        await q.getByText('Two', { exact: true }).click();   // exercise the family sections
      } else await opts.nth(0).click();
    } else if (await ta.count()) {
      await ta.first().fill(await ta.first().evaluate(e => e.tagName) === 'INPUT' ? 'Alex' : 'Test answer for ' + title);
    }
  }
  section++;
  if (section === 1) await pg.screenshot({ path: `${SHOT}/02-quiz.png`, fullPage: true });
  const finish = pg.locator('[data-act="quiz-finish"]');
  if (await finish.count()) {
    const disabled = await finish.isDisabled();
    console.log(`section ${section} (${title}) — finish, disabled=${disabled}`);
    if (disabled) { console.log('!! FINISH BLOCKED'); break; }
    await finish.click();
    break;
  }
  const next = pg.locator('[data-act="quiz-next"]');
  if (await next.isDisabled()) { console.log(`!! BLOCKED at section ${section}: ${title}`); break; }
  await next.click();
}

await pg.waitForSelector('[data-act="begin"]', { timeout: 5000 });
console.log('reveal reached. sections:', section);
console.log('keystones shown:', (await pg.locator('.card .eyebrow').allInnerTexts()).slice(0,3).join(' / '));
await pg.screenshot({ path: `${SHOT}/03-reveal.png`, fullPage: true });

await pg.getByText('Start day one').click();
await pg.waitForSelector('.task');
console.log('today tasks:', await pg.locator('.task').count());
console.log('today head:', await pg.locator('#app h2').first().innerText());

// Tick everything and write in the journal box if present.
const ticks = await pg.locator('.tick').all();
for (const t of ticks) await t.click();
const jt = pg.locator('textarea[data-input="journal"]');
if (await jt.count()) await jt.first().fill('A written test entry.');
await pg.locator('textarea[data-input="note"]').fill('Closing line for today.');
await pg.locator('[data-act="meter"][data-field="mood"][data-v="4"]').click();
await pg.locator('[data-act="meter"][data-field="energy"][data-v="3"]').click();
await pg.waitForTimeout(600);
const noteNow = await pg.locator('textarea[data-input="note"]').inputValue();
console.log(noteNow === 'Closing line for today.'
  ? 'note survives re-render: OK'
  : `!! NOTE LOST after re-render, got ${JSON.stringify(noteNow)}`);
await pg.screenshot({ path: `${SHOT}/04-today.png`, fullPage: true });

// The reading: library lists, a lesson opens, and it is marked read.
await pg.locator('.nav [data-view="learn"]').click();
await pg.waitForSelector('.lesson-row');
const lessonCount = await pg.locator('.lesson-row').count();
await pg.locator('.lesson-head').first().click();
await pg.waitForSelector('.lesson-body');
const readMarked = await pg.evaluate(() => Object.keys(MS.store.get().lessonsRead || {}).length);
console.log('learn:', lessonCount, 'lessons listed, opened one, marked read:', readMarked);
if (!lessonCount || !readMarked) console.log('!! LEARN TAB BROKEN');

for (const v of ['plan', 'progress', 'journal', 'settings']) {
  await pg.locator(`.nav [data-view="${v}"]`).click();
  await pg.waitForTimeout(250);
  await pg.screenshot({ path: `${SHOT}/05-${v}.png`, fullPage: true });
  console.log(v, '->', (await pg.locator('#app h2').first().innerText()).slice(0, 60));
}

// Reload: does everything persist?
await pg.reload();
await pg.waitForSelector('.task');
const persisted = await pg.locator('.task.done').count();
console.log('after reload, completed tasks persisted:', persisted);
const noteBack = await pg.locator('textarea[data-input="note"]').inputValue();
console.log('note after reload:', JSON.stringify(noteBack));
await pg.locator('.nav [data-view="journal"]').click();
await pg.waitForTimeout(200);
console.log('journal shows the line:',
  (await pg.locator('#app').innerText()).includes('Closing line for today.'));

console.log(errors.length ? '\nERRORS:\n' + errors.join('\n') : '\nno JS errors');
await b.close();
