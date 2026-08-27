/* Seeds a plan already 25 days in, so the screens that only appear mid-plan
 * get exercised: reflect tasks with their journal box, the phase-end re-score,
 * dark mode and the desktop layout. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const SHOT = process.env.SHOT_DIR || '/tmp/museschool-shots';
mkdirSync(SHOT, { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errors = [];

async function seed(page, { minutes = '40', days = '6', theme = 'auto', back = 25 } = {}) {
  await page.goto('file:///home/user/Museschool/dist/standalone.html');
  await page.evaluate(({ minutes, days, theme, back }) => {
    const a = { name: 'Alex', goals: ['relationship', 'ownership', 'worth'],
                primaryGoal: 'relationship', minutes, days,
                relStatus: 'ended_recent', relContact: 'none_theirs', relSpace: 'no',
                relWant: 'reconcile', relLegacy: 'Someone my kids would describe as steady.' };
    MS.QUIZ.forEach(s => s.questions.forEach(q => {
      if (q.type === 'scale') a[q.id] = (q.dim === 'ownership' || q.dim === 'worth') ? 2 : 4;
    }));
    const start = MS.addDays(MS.dayKey(), -back);
    const st = MS.store.get();
    st.answers = a;
    st.plan = MS.buildPlan(a, start);
    st.settings.theme = theme;
    // A fortnight of history so the progress chart has something to draw.
    for (let i = 0; i < back; i++) {
      const k = MS.addDays(start, i);
      const t = MS.tasksFor(st.plan, k).tasks;
      if (!t.length) continue;
      st.log[k] = { tasks: {}, done: 0, mood: 2 + (i % 4), energy: 2 + ((i + 2) % 4), note: '' };
      t.slice(0, Math.max(1, t.length - (i % 2))).forEach(x => { st.log[k].tasks[x.id] = true; });
      st.log[k].done = Object.keys(st.log[k].tasks).length;
    }
    MS.store.save();
    MS.view = 'today';
    MS.render();
  }, { minutes, days, theme, back });
  await page.waitForSelector('.task');
}

// --- mid-plan today, with a reflect task ---
let pg = await b.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
pg.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
await seed(pg);
const info = await pg.evaluate(() => {
  const r = MS.tasksFor(MS.store.get().plan, MS.dayKey());
  return { phase: r.info.phaseN, day: r.info.dayNumber, cats: r.tasks.map(t => t.cat) };
});
console.log('mid-plan day:', JSON.stringify(info));
const jbox = pg.locator('textarea[data-input="journal"]');
console.log('journal boxes on screen:', await jbox.count());
if (await jbox.count()) {
  await jbox.first().fill('Wrote something honest here.');
  await pg.locator('.tick').first().click();          // forces a re-render
  await pg.waitForTimeout(500);
  console.log('journal text held through re-render:',
    (await jbox.first().inputValue()) === 'Wrote something honest here.');
}
await pg.screenshot({ path: `${SHOT}/10-midplan-today.png`, fullPage: true });

// --- progress + the re-score that becomes due at a phase boundary ---
await pg.locator('.nav [data-view="progress"]').click();
await pg.waitForTimeout(300);
const due = await pg.locator('[data-act="recheck"]').count();
console.log('re-score offered at phase boundary:', due > 0);
await pg.screenshot({ path: `${SHOT}/11-progress.png`, fullPage: true });

if (due) {
  await pg.locator('[data-act="recheck"]').click();
  await pg.waitForSelector('[data-act="recheck-save"]');
  console.log('re-score save disabled before answering:',
    await pg.locator('[data-act="recheck-save"]').isDisabled());
  for (const q of await pg.locator('.q').all()) await q.locator('.scale button').nth(3).click();
  console.log('re-score save enabled after answering:',
    !(await pg.locator('[data-act="recheck-save"]').isDisabled()));
  await pg.locator('[data-act="recheck-save"]').click();
  await pg.waitForTimeout(300);
  const deltas = await pg.locator('.bar-val').allInnerTexts();
  console.log('bars now show movement:', deltas.some(t => t.includes('+')));
  await pg.screenshot({ path: `${SHOT}/12-progress-rescored.png`, fullPage: true });
}
await pg.close();

// --- dark mode ---
pg = await b.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2,
                       colorScheme: 'dark' });
pg.on('pageerror', e => errors.push('PAGEERROR(dark): ' + e.message));
await seed(pg, { theme: 'auto' });
const bg = await pg.evaluate(() => getComputedStyle(document.body).backgroundColor);
console.log('dark body background:', bg);
await pg.screenshot({ path: `${SHOT}/13-dark.png`, fullPage: true });
await pg.locator('.nav [data-view="plan"]').click();
await pg.waitForTimeout(250);
await pg.screenshot({ path: `${SHOT}/14-dark-plan.png`, fullPage: true });
await pg.close();

// --- desktop ---
pg = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
pg.on('pageerror', e => errors.push('PAGEERROR(desktop): ' + e.message));
await seed(pg, { minutes: '60' });
const overflow = await pg.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log('desktop horizontal overflow (should be 0):', overflow);
await pg.screenshot({ path: `${SHOT}/15-desktop.png`, fullPage: false });
await pg.close();

console.log(errors.length ? '\nERRORS:\n' + errors.join('\n') : '\nno JS errors');
await b.close();
