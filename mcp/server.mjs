#!/usr/bin/env node
/* Museschool MCP server.
 *
 * Gives Claude — in Claude Desktop, Claude Code, or anywhere else that speaks
 * MCP — read and write access to one Museschool backup file, so a conversation
 * about a bad week can actually change what tomorrow's plan says.
 *
 * It is not an LLM and it holds no key. It exposes your own data as tools to
 * whichever Claude you are already talking to.
 *
 *   MUSESCHOOL_FILE=~/path/to/museschool-backup.json node mcp/server.mjs
 *
 * Everything it writes goes into `adjustments` and `journal`. The generated
 * twelve weeks are never rewritten, so every change stays visible in the app
 * and can be undone there.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/* ---------- load the app's own engine, so this can never drift from it ---------- */
globalThis.window = globalThis;
const here = new URL('.', import.meta.url);
for (const f of ['data/quiz', 'data/tasks', 'data/lessons', 'data/phases', 'engine/engine']) {
  await import(pathToFileURL(resolve(new URL('../src/' + f + '.js', here).pathname)).href);
}
const MS = globalThis.MS;

/* ---------- the file ---------- */
const FILE = resolve((process.env.MUSESCHOOL_FILE || '~/museschool-backup.json')
  .replace(/^~/, homedir()));

function load() {
  if (!existsSync(FILE)) {
    throw new Error(
      `No Museschool backup at ${FILE}. In the app open You → Backup → save a file there first, ` +
      `or point MUSESCHOOL_FILE at an existing one.`);
  }
  const st = JSON.parse(readFileSync(FILE, 'utf8'));
  if (!st || st.v !== 1) throw new Error(`${FILE} is not a Museschool backup.`);
  st.adjustments = st.adjustments || [];
  st.journal = st.journal || [];
  st.log = st.log || {};
  return st;
}

// Write via a temp file so an interrupted write cannot leave a truncated backup.
function save(st) {
  const tmp = FILE + '.tmp';
  writeFileSync(tmp, JSON.stringify(st, null, 2));
  renameSync(tmp, FILE);
}

const today = () => MS.dayKey();
const newId = () => 'adj_' + Math.random().toString(36).slice(2, 10);
const text = (s) => ({ content: [{ type: 'text', text: s }] });
const json = (o) => text(JSON.stringify(o, null, 2));

function requirePlan(st) {
  if (!st.plan) throw new Error('This backup has no plan yet — finish the quiz in the app first.');
  return st.plan;
}

function dayView(st, key) {
  const plan = requirePlan(st);
  const res = MS.tasksFor(plan, key, st.adjustments);
  const entry = st.log[key] || { tasks: {}, done: 0 };
  return {
    date: key,
    dayNumber: res.info.dayNumber,
    week: res.info.week,
    phase: { n: res.info.phaseN, name: res.info.phase.name, line: res.info.phase.line },
    restDay: res.light,
    tasks: res.tasks.map((t) => ({
      id: t.id, category: t.cat, dimension: t.dim, minutes: t.min,
      title: t.title, detail: t.detail, done: !!entry.tasks[t.id]
    })),
    notes: MS.notesFor(st.adjustments, key).map((n) => n.text),
    checkIn: { mood: entry.mood ?? null, energy: entry.energy ?? null, note: entry.note || '' }
  };
}

/* ---------- server ---------- */
const server = new McpServer({ name: 'museschool', version: '1.0.0' });

server.registerTool('get_overview', {
  title: 'Read the plan and where they are in it',
  description:
    'The whole picture: their name, keystones, strength, attachment reading, dimension scores, ' +
    'streak, completion rate, active tracks and any adjustments currently in force. Start here.',
  inputSchema: {}
}, async () => {
  const st = load();
  const plan = requirePlan(st);
  const info = MS.dayInfo(plan, today());
  const latest = st.checkins?.length ? st.checkins[st.checkins.length - 1].scores : null;
  return json({
    name: st.answers?.name || null,
    startedOn: plan.startKey,
    dayNumber: info.dayNumber, week: info.week,
    phase: { n: info.phaseN, name: info.phase.name, line: info.phase.line, focus: info.phase.focus },
    keystones: plan.keystones, strength: plan.strength, tracks: plan.tracks,
    minutesPerDay: plan.minutes, daysPerWeek: plan.days,
    attachment: plan.attachment
      ? { style: plan.attachment.style, anxiety: plan.attachment.anxiety,
          avoidance: plan.attachment.avoidance }
      : null,
    scoresAtStart: plan.scores,
    scoresLatest: latest,
    streak: MS.streak(st.log, plan),
    completion: MS.completionStats(st.log, plan, st.adjustments),
    activeAdjustments: st.adjustments.filter((a) => (a.to || a.from) >= today()).length,
    goals: st.answers?.goals || [],
    children: st.answers?.kids || 'none'
  });
});

server.registerTool('get_day', {
  title: "Read one day's tasks",
  description: 'The tasks, notes and check-in for a date. Defaults to today.',
  inputSchema: { date: z.string().optional().describe('YYYY-MM-DD; defaults to today') }
}, async ({ date }) => json(dayView(load(), date || today())));

server.registerTool('get_recent', {
  title: 'Read what has actually been happening',
  description:
    'The last N days of completion, mood, energy and end-of-day notes, plus recent journal ' +
    'entries. Use this before adjusting anything — it shows whether they are struggling or fine.',
  inputSchema: { days: z.number().int().min(1).max(60).optional() }
}, async ({ days = 14 }) => {
  const st = load();
  const plan = requirePlan(st);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = MS.addDays(today(), -i);
    const e = st.log[key];
    const planned = MS.tasksFor(plan, key, st.adjustments).tasks.length;
    if (!planned && !e) continue;
    out.push({ date: key, planned, done: e?.done || 0,
               mood: e?.mood ?? null, energy: e?.energy ?? null, note: e?.note || '' });
  }
  return json({
    days: out,
    journal: st.journal.slice(-8).map((j) => ({ date: j.date, title: j.title, text: j.text }))
  });
});

server.registerTool('search_tasks', {
  title: 'Find tasks in the library',
  description:
    'Search the task library so an adjustment can reference a real task id. Filter by free text, ' +
    'dimension, category (anchor, practice, reflect, reach) or minutes.',
  inputSchema: {
    query: z.string().optional(),
    dimension: z.string().optional(),
    category: z.enum(['anchor', 'practice', 'reflect', 'reach']).optional(),
    maxMinutes: z.number().int().optional()
  }
}, async ({ query, dimension, category, maxMinutes }) => {
  const q = (query || '').toLowerCase();
  const hits = MS.TASKS.filter((t) =>
    (!q || (t.title + ' ' + t.detail).toLowerCase().includes(q)) &&
    (!dimension || t.dim === dimension) &&
    (!category || t.cat === category) &&
    (!maxMinutes || t.min <= maxMinutes)
  ).slice(0, 25);
  return json(hits.map((t) => ({
    id: t.id, category: t.cat, dimension: t.dim, minutes: t.min,
    title: t.title, tracks: t.tags || null
  })));
});

server.registerTool('adjust_plan', {
  title: 'Change the plan for a day or a stretch of days',
  description:
    'Lay a change over the generated plan. Kinds: "note" leaves a line on their Today screen; ' +
    '"ease" cuts the day back to the anchor plus one short thing; "add" and "skip" put a specific ' +
    'task in or take it out (use search_tasks for the id); "focus" points the day\'s drills at one ' +
    'dimension. Always give a reason — it is shown to them, and they can undo any of it in the app.',
  inputSchema: {
    kind: z.enum(['note', 'ease', 'add', 'skip', 'focus']),
    reason: z.string().describe('Why, in plain language. Shown in the app.'),
    from: z.string().optional().describe('YYYY-MM-DD; defaults to today'),
    to: z.string().optional().describe('YYYY-MM-DD; defaults to `from`'),
    text: z.string().optional().describe('For kind "note": the line they will read.'),
    taskId: z.string().optional().describe('For "add" and "skip".'),
    dimension: z.string().optional().describe('For "focus".')
  }
}, async ({ kind, reason, from, to, text: noteText, taskId, dimension }) => {
  const st = load();
  requirePlan(st);
  const start = from || today();
  const end = to || start;
  if (end < start) throw new Error('`to` is before `from`.');
  if (kind === 'note' && !noteText) throw new Error('kind "note" needs `text`.');
  if ((kind === 'add' || kind === 'skip')) {
    if (!taskId) throw new Error(`kind "${kind}" needs \`taskId\`.`);
    if (kind === 'add' && !MS.taskById(taskId)) {
      throw new Error(`No task "${taskId}". Use search_tasks to find one.`);
    }
  }
  if (kind === 'focus') {
    if (!dimension) throw new Error('kind "focus" needs `dimension`.');
    if (!MS.DIMENSIONS[dimension]) {
      throw new Error(`Unknown dimension "${dimension}". One of: ${MS.DIM_KEYS.join(', ')}`);
    }
  }
  const adj = { id: newId(), createdAt: new Date().toISOString(), source: 'claude',
                kind, reason, from: start, to: end };
  if (noteText) adj.text = noteText;
  if (taskId) adj.taskId = taskId;
  if (dimension) adj.dim = dimension;
  st.adjustments.push(adj);
  save(st);
  return json({ added: adj, dayNow: dayView(st, start) });
});

server.registerTool('list_adjustments', {
  title: 'List the changes currently laid over the plan',
  description: 'Every adjustment, so you can see what is already in force before adding more.',
  inputSchema: { includePast: z.boolean().optional() }
}, async ({ includePast = false }) => {
  const st = load();
  const all = st.adjustments || [];
  return json(includePast ? all : all.filter((a) => (a.to || a.from) >= today()));
});

server.registerTool('remove_adjustment', {
  title: 'Undo an adjustment',
  description: 'Remove one by id. Use when a change no longer applies.',
  inputSchema: { id: z.string() }
}, async ({ id }) => {
  const st = load();
  const before = st.adjustments.length;
  st.adjustments = st.adjustments.filter((a) => a.id !== id);
  if (st.adjustments.length === before) throw new Error(`No adjustment "${id}".`);
  save(st);
  return text(`Removed ${id}.`);
});

server.registerTool('add_journal_entry', {
  title: 'Write something into their journal',
  description:
    'Add an entry to the journal they read back. Use it to record something that came out of a ' +
    'conversation and is worth keeping — in their words where you have them, not a summary of ' +
    'your advice.',
  inputSchema: {
    title: z.string(),
    body: z.string(),
    date: z.string().optional().describe('YYYY-MM-DD; defaults to today')
  }
}, async ({ title, body, date }) => {
  const st = load();
  const key = date || today();
  st.journal.push({ date: key, taskId: 'conversation-' + newId(), title,
                    text: body, ts: Date.now(), source: 'claude' });
  save(st);
  return text(`Added "${title}" to the journal for ${key}.`);
});

await server.connect(new StdioServerTransport());
