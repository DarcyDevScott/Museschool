/* Mendday milestone counter.
 *
 * Counts how many people reach each stage. It is deliberately incapable of
 * doing anything else:
 *
 *   - only seven fixed milestone names are accepted; anything else is rejected
 *   - the request body carries no identifier, no session, no content
 *   - nothing is stored per person — a milestone is a number that goes up
 *   - IP addresses and user agents are never read or written
 *
 * That means it cannot answer "what did this person do", only "how many
 * people got this far", which is the only question worth asking here.
 *
 * Deploy: see analytics/README.md. Needs one KV namespace bound as COUNTS.
 */

const MILESTONES = [
  'quiz_started',    // opened the first question
  'quiz_finished',   // built a plan
  'installed_open',  // launched from a home screen icon
  'day_7',           // still going after a week
  'day_30',          // still going after a month
  'day_84',          // finished the twelve weeks
  'rescored'         // completed a phase-end re-score
];

// Counters are spread over a few keys so simultaneous writes to one hot key
// cannot collide. Reading sums them back up.
const SHARDS = 8;

const today = () => new Date().toISOString().slice(0, 10);

function cors(origin, allowed) {
  const ok = allowed.length === 0 || allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? (origin || '*') : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const headers = cors(request.headers.get('Origin'), allowed);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    /* ---- record a milestone ---- */
    if (url.pathname === '/e' && request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response('bad json', { status: 400, headers });
      }
      // An allowlist, not a filter: anything not on it never reaches storage,
      // so a bug or a tampered client cannot turn this into a data collector.
      if (!body || !MILESTONES.includes(body.m)) {
        return new Response('unknown milestone', { status: 400, headers });
      }
      // Read-then-write is not atomic and KV is eventually consistent, so
      // these counts are approximate by nature. Spreading over shards keeps
      // simultaneous writes off the same key; for a funnel, close enough is
      // the right target and precision would cost far more than it is worth.
      const key = `m:${body.m}:${today()}:${Math.floor(Math.random() * SHARDS)}`;
      const current = parseInt((await env.COUNTS.get(key)) || '0', 10);
      await env.COUNTS.put(key, String(current + 1));
      // 204: nothing to say back, and nothing to set.
      return new Response(null, { status: 204, headers });
    }

    /* ---- read the funnel ---- */
    if (url.pathname === '/stats' && request.method === 'GET') {
      if (env.STATS_TOKEN && url.searchParams.get('token') !== env.STATS_TOKEN) {
        return new Response('unauthorized', { status: 401, headers });
      }
      const days = Math.min(parseInt(url.searchParams.get('days') || '30', 10) || 30, 365);
      const dates = [];
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - i);
        dates.push(d.toISOString().slice(0, 10));
      }

      const totals = {}, daily = {};
      for (const m of MILESTONES) totals[m] = 0;

      // Resolve every read first, then add up. `sum += await x` would read sum
      // before awaiting, so concurrent reads would overwrite each other's work.
      const reads = [];
      for (const m of MILESTONES) {
        for (const date of dates) {
          for (let s = 0; s < SHARDS; s++) {
            reads.push(env.COUNTS.get(`m:${m}:${date}:${s}`)
              .then((v) => ({ m, date, n: parseInt(v || '0', 10) })));
          }
        }
      }
      for (const { m, date, n } of await Promise.all(reads)) {
        if (!n) continue;
        totals[m] += n;
        daily[date] = daily[date] || {};
        daily[date][m] = (daily[date][m] || 0) + n;
      }

      return new Response(JSON.stringify({ days, totals, daily }, null, 2), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    return new Response('not found', { status: 404, headers });
  }
};

export { MILESTONES, SHARDS };
