/* Drives the MCP server over a real stdio transport, against a scratch backup
 * file, and checks every tool round-trips through the app's own engine.
 *   node test/mcp.mjs
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const fail = [];
const ok = (l, c, x = '') => (console.log(`  ${c ? 'ok  ' : 'FAIL'} ${l}${x ? ' — ' + x : ''}`), c || fail.push(l));

// Build a realistic backup with the app's own engine.
globalThis.window = globalThis;
for (const f of ['data/quiz','data/tasks','data/lessons','data/phases','engine/engine'])
  await import(pathToFileURL(resolve('src/' + f + '.js')).href);
const MS = globalThis.MS;

const dir = mkdtempSync(join(tmpdir(), 'museschool-mcp-'));
const FILE = join(dir, 'museschool-backup.json');
const answers = { name: 'Darcy', goals: ['relationship','partnership','ownership'],
                  primaryGoal: 'relationship', kids: '2', minutes: '20', days: '6',
                  famSetup: 'split_tense', relStatus: 'ended_recent', relSpace: 'no',
                  relWant: 'reconcile' };
MS.QUIZ.forEach(s => { if (s.when && !s.when(answers)) return;
  s.questions.forEach(q => { if (q.type === 'scale') answers[q.id] = 3; }); });
const plan = MS.buildPlan(answers, MS.addDays(MS.dayKey(), -10));
const log = {};
for (let i = 0; i < 10; i++) {
  const k = MS.addDays(plan.startKey, i);
  log[k] = { tasks: {}, done: 2, mood: 3, energy: 3, note: 'day ' + i };
}
writeFileSync(FILE, JSON.stringify({ v: 1, answers, plan, log, journal: [], checkins: [],
  lessonsRead: {}, adjustments: [], settings: { theme: 'auto' } }, null, 2));

const client = new Client({ name: 'test', version: '1.0.0' });
await client.connect(new StdioClientTransport({
  command: 'node', args: ['mcp/server.mjs'], env: { ...process.env, MUSESCHOOL_FILE: FILE }
}));

const call = async (name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  const t = r.content?.[0]?.text ?? '';
  try { return JSON.parse(t); } catch { return t; }
};
const reread = () => JSON.parse(readFileSync(FILE, 'utf8'));
const TODAY = MS.dayKey();

console.log('\n1. The server exposes its tools');
const { tools } = await client.listTools();
const names = tools.map(t => t.name).sort();
console.log('  ' + names.join(', '));
ok('all eight tools registered', names.length === 8, names.length + '');
ok('every tool has a description', tools.every(t => t.description && t.description.length > 20));
ok('every tool has an input schema', tools.every(t => t.inputSchema));

console.log('\n2. Reading');
const ov = await call('get_overview');
ok('overview names them', ov.name === 'Darcy');
ok('overview knows the day', ov.dayNumber === 11, 'day ' + ov.dayNumber);
ok('overview carries keystones and tracks', !!ov.keystones?.length && ov.tracks.includes('parenting'));
const day = await call('get_day');
ok('today has tasks', day.tasks.length > 0, day.tasks.length + ' tasks');
ok('tasks carry real detail', day.tasks.every(t => t.title && t.detail && t.id));
const recent = await call('get_recent', { days: 12 });
ok('recent history returned', recent.days.length >= 10, recent.days.length + ' days');

console.log('\n3. Finding a real task to work with');
const found = await call('search_tasks', { dimension: 'vitality', category: 'practice', maxMinutes: 15 });
ok('search returns matches', Array.isArray(found) && found.length > 0, found.length + ' hits');
ok('matches respect the filters',
   found.every(t => t.dimension === 'vitality' && t.category === 'practice' && t.minutes <= 15));
const pickId = found[0].id;

console.log('\n4. Changing the plan');
const note = await call('adjust_plan', { kind: 'note', reason: 'They had a rough weekend',
  text: 'You said Saturday went badly. Today is deliberately lighter.' });
ok('note lands on the day', note.dayNow.notes.some(n => n.includes('Saturday')));
await call('adjust_plan', { kind: 'add', reason: 'They asked for something physical', taskId: pickId });
ok('added task appears', (await call('get_day')).tasks.some(t => t.id === pickId));
const before = (await call('get_day')).tasks;
const dropId = before.find(t => t.category === 'practice' && t.id !== pickId)?.id;
if (dropId) {
  await call('adjust_plan', { kind: 'skip', reason: 'Too much for today', taskId: dropId });
  ok('skipped task disappears', !(await call('get_day')).tasks.some(t => t.id === dropId));
}
const tomorrow = MS.addDays(TODAY, 1);
await call('adjust_plan', { kind: 'ease', reason: 'Court date', from: tomorrow, to: tomorrow });
const eased = await call('get_day', { date: tomorrow });
ok('an eased day is shorter', eased.tasks.length <= 2, eased.tasks.length + ' tasks');
const dayAfter = MS.addDays(TODAY, 2);
await call('adjust_plan', { kind: 'focus', reason: 'Sleep has collapsed', dimension: 'vitality',
                            from: dayAfter, to: dayAfter });
const focused = await call('get_day', { date: dayAfter });
const drills = focused.tasks.filter(t => t.category === 'practice');
ok('a focused day drills that dimension', drills.length > 0 && drills.every(t => t.dimension === 'vitality'),
   JSON.stringify(drills.map(t => t.dimension)));

console.log('\n5. It only touches what it should');
const after = reread();
ok('the plan itself is untouched',
   JSON.stringify(after.plan) === JSON.stringify(plan));
ok('their answers are untouched', after.answers.name === 'Darcy' && after.answers.kids === '2');
ok('their log is untouched', Object.keys(after.log).length === 10);
ok('changes are recorded as adjustments', after.adjustments.length === 5, after.adjustments.length + '');
ok('every change is attributed and reasoned',
   after.adjustments.every(a => a.source === 'claude' && a.reason && a.id));

console.log('\n6. Journal, listing and undo');
await call('add_journal_entry', { title: 'What she actually said',
  body: 'Her words, not my summary of them.' });
ok('journal entry written', reread().journal.some(j => j.title === 'What she actually said'));
const active = await call('list_adjustments');
ok('active adjustments listed', active.length === 5, active.length + '');
await call('remove_adjustment', { id: active[0].id });
ok('adjustment removed', reread().adjustments.length === 4);
ok('and its effect is gone', !(await call('get_day')).notes.some(n => n.includes('Saturday')));

console.log('\n7. Bad input is refused, not guessed at');
const bad = async (name, args) => {
  const r = await client.callTool({ name, arguments: args });
  return !!r.isError;
};
ok('unknown task id refused', await bad('adjust_plan', { kind: 'add', reason: 'x', taskId: 'nope' }));
ok('unknown dimension refused', await bad('adjust_plan', { kind: 'focus', reason: 'x', dimension: 'vibes' }));
ok('note without text refused', await bad('adjust_plan', { kind: 'note', reason: 'x' }));
ok('backwards date range refused',
   await bad('adjust_plan', { kind: 'ease', reason: 'x', from: TODAY, to: MS.addDays(TODAY, -3) }));
ok('unknown adjustment id refused', await bad('remove_adjustment', { id: 'adj_nope' }));

console.log('\n8. A missing file fails with a usable message');
const c2 = new Client({ name: 'test2', version: '1.0.0' });
await c2.connect(new StdioClientTransport({ command: 'node', args: ['mcp/server.mjs'],
  env: { ...process.env, MUSESCHOOL_FILE: join(dir, 'nothing-here.json') } }));
const r2 = await c2.callTool({ name: 'get_overview', arguments: {} });
ok('it says where it looked and what to do',
   r2.isError && /No Museschool backup at/.test(r2.content[0].text) &&
   /You → Backup/.test(r2.content[0].text));
await c2.close();

await client.close();
rmSync(dir, { recursive: true, force: true });
console.log(fail.length ? '\nFAILURES:\n' + fail.join('\n') : '\nMCP server works end to end');
process.exit(fail.length ? 1 : 0);
