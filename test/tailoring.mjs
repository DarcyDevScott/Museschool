/* Guards the claims made about tailoring, the attachment lens and the
 * response-quality check. Pure engine, no browser needed. */
global.window = {};
for (const f of ['data/quiz','data/tasks','data/lessons','data/phases','engine/engine'])
  await import('../src/' + f + '.js');
const MS = window.MS;
const fail = [];
const ok = (l, c, x = '') => (console.log(`  ${c ? 'ok  ' : 'FAIL'} ${l}${x ? ' — ' + x : ''}`), c || fail.push(l));

let seed = 4242; const rnd = () => (seed = (seed*1103515245+12345)&0x7fffffff)/0x7fffffff;
const pick = (a) => a[Math.floor(rnd()*a.length)];
const clamp = (v) => Math.max(1, Math.min(5, Math.round(v)));
const GOALS = MS.GOALS.map(g => g.v);

function person(over = {}) {
  const goals = []; while (goals.length < 3) { const g = pick(GOALS); if (!goals.includes(g)) goals.push(g); }
  const a = Object.assign({
    name: 'X', goals, primaryGoal: pick(goals), kids: pick(['none','1','2','3']),
    minutes: pick(['10','20','40','60']), days: pick(['5','6','7']),
    famSetup: pick(['together','split_tense']), relStatus: pick(['together_strained','ended_recent']),
    relSpace: pick(['na','no']), relWant: pick(['reconcile','ready'])
  }, over);
  const truth = {}; MS.DIM_KEYS.concat(['attachAnx','attachAvo']).forEach(d => truth[d] = 1 + rnd()*4);
  MS.QUIZ.forEach(s => { if (s.when && !s.when(a)) return;
    s.questions.forEach(q => { if (q.type !== 'scale' || a[q.id] !== undefined) return;
      const v = clamp(truth[q.dim] + (rnd()-0.5)*1.4);
      a[q.id] = q.reverse ? 6 - v : v; }); });
  return a;
}
const taskSet = (p) => {
  const s = new Set();
  for (let i = 0; i < 84; i++) MS.tasksFor(p, MS.addDays('2026-08-27', i)).tasks.forEach(t => s.add(t.id));
  return s;
};
const jac = (A, B) => { let n = 0; A.forEach(x => B.has(x) && n++); return n / (A.size + B.size - n); };

console.log('\n1. Different people get different plans');
const N = 200, plans = [];
for (let i = 0; i < N; i++) { const p = MS.buildPlan(person(), '2026-08-27'); plans.push({ p, set: taskSet(p) }); }
const days = plans.map(({p}) => { const d = [];
  for (let i = 0; i < 84; i++) d.push(MS.tasksFor(p, MS.addDays('2026-08-27', i)).tasks.map(t=>t.id).join('+'));
  return d.join('/'); });
ok('no two of ' + N + ' plans are identical', new Set(days).size === N,
   new Set(days).size + ' distinct');
let sum = 0, pairs = 0;
for (let i = 0; i < 60; i++) for (let j = i+1; j < 60; j++) { sum += jac(plans[i].set, plans[j].set); pairs++; }
const overlap = sum/pairs*100;
console.log('  (average task overlap between two people: ' + overlap.toFixed(1) + '%)');
ok('two random people share well under all their tasks', overlap < 70, overlap.toFixed(1) + '%');
ok('but do share a common core', overlap > 25, overlap.toFixed(1) + '%');

console.log('\n2. Answering differently changes the plan');
const fixed = { goals:['relationship','partnership','worth'], primaryGoal:'relationship',
                kids:'2', minutes:'20', days:'6', famSetup:'together',
                relStatus:'together_strained', relSpace:'na', relWant:'reconcile' };
// Same goals, but a different dimension is the weak one each time.
function scoredWeakAt(weak) {
  const a = { ...fixed };
  MS.QUIZ.forEach(s => { if (s.when && !s.when(a)) return;
    s.questions.forEach(q => { if (q.type !== 'scale') return;
      const v = q.dim === weak ? 1 : 4;
      a[q.id] = q.reverse ? 6 - v : v; }); });
  return MS.buildPlan(a, '2026-08-27');
}
const pReg = scoredWeakAt('regulation'), pVit = scoredWeakAt('vitality');
ok('the same goals with a different weak spot give different keystones',
   pReg.keystones.join() !== pVit.keystones.join(),
   pReg.keystones.join('+') + ' vs ' + pVit.keystones.join('+'));
ok('and different daily work', jac(taskSet(pReg), taskSet(pVit)) < 0.85,
   (jac(taskSet(pReg), taskSet(pVit))*100).toFixed(0) + '% overlap');

// The crux: a genuinely low score must outrank a stated goal.
ok('a real weakness outranks a stated goal',
   pReg.keystones.includes('regulation'),
   'goals were ' + fixed.goals.join('+') + ', keystones ' + pReg.keystones.join('+'));

// And with nothing to separate them, the stated goals decide — which is the
// honest limit of the instrument, so assert it rather than pretend otherwise.
const flatA = { ...fixed }, flatB = { ...fixed, goals: ['vitality','purpose','connection'], primaryGoal: 'vitality' };
[flatA, flatB].forEach(a => MS.QUIZ.forEach(s => { if (s.when && !s.when(a)) return;
  s.questions.forEach(q => { if (q.type === 'scale') a[q.id] = 3; }); }));
const kA = MS.buildPlan(flatA, '2026-08-27').keystones, kB = MS.buildPlan(flatB, '2026-08-27').keystones;
ok('with flat scores, the stated goals decide', kA.join() !== kB.join(),
   kA.join('+') + ' vs ' + kB.join('+'));

console.log('\n3. The attachment lens');
const styles = {};
for (const [name, anx, avo] of [['anxious',4.7,1.5],['avoidant',1.5,4.7],['fearful',4.7,4.7],['secure',1.5,1.5]]) {
  const over = {};
  MS.QUIZ.forEach(s => s.questions.forEach(q => {
    if (q.dim === 'attachAnx') over[q.id] = clamp(q.reverse ? 6-anx : anx);
    if (q.dim === 'attachAvo') over[q.id] = clamp(q.reverse ? 6-avo : avo); }));
  const p = MS.buildPlan(person({ goals:['relationship','partnership','worth'],
    primaryGoal:'relationship', kids:'2', minutes:'20', ...over }), '2026-08-27');
  styles[name] = p;
  ok(name + ' is identified', p.attachment.style === name, p.attachment.style);
}
const attTagsOf = (id) => { const t = MS.TASKS.find(x => x.id === id); return (t && t.tags) || []; };
const wrongStyle = Object.entries(styles).some(([name, p]) =>
  [...taskSet(p)].some(id => {
    const tags = attTagsOf(id);
    return tags.some(g => g.startsWith('att_')) && !tags.includes('att_' + name);
  }));
ok('nobody gets another style\'s tasks', !wrongStyle);
ok('a secure profile gets no attachment tasks',
   ![...taskSet(styles.secure)].some(id => attTagsOf(id).some(g => g.startsWith('att_'))));
ok('attachment never becomes a scored dimension',
   !MS.DIM_KEYS.includes('attachAnx') && !MS.DIM_KEYS.includes('attachAvo'));

console.log('\n4. The response-quality check');
function answered(fn) { const a = { goals:['relationship'], primaryGoal:'relationship', kids:'2', minutes:'20', days:'6' };
  MS.QUIZ.forEach(s => { if (s.when && !s.when(a)) return;
    s.questions.forEach(q => { if (q.type === 'scale') a[q.id] = fn(q); }); }); return a; }
let falsePos = 0;
for (let i = 0; i < 200; i++) if (MS.responseQuality(person()).verdict !== 'consistent') falsePos++;
ok('honest respondents are rarely flagged', falsePos / 200 < 0.1, (falsePos/2) + '%');
ok('all-one-answer is caught', MS.responseQuality(answered(() => 3)).flags.includes('straightline'));
ok('agreeing with everything is caught', MS.responseQuality(answered(() => 4)).flags.includes('acquiescent'));
let s2 = 1; const r2 = () => (s2 = (s2*1103515245+12345)&0x7fffffff)/0x7fffffff;
ok('random answering is caught',
   MS.responseQuality(answered(() => 1 + Math.floor(r2()*5))).flags.includes('incoherent'));

console.log(fail.length ? '\nFAILURES:\n' + fail.join('\n') : '\ntailoring claims hold');
process.exit(fail.length ? 1 : 0);
