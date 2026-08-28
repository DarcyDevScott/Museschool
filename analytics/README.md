# Milestone counting

Answers one question: **does anyone actually get anywhere with this?**

```
3,000  landed              ← Cloudflare's own analytics, no code
1,400  started the quiz    ┐
  520  finished it         │
  310  opened from home screen  ├ these, because an installed app
  180  reached day 7       │   opened offline never hits your server
   60  reached day 30      ┘
```

## What it can and cannot do

It accepts **seven fixed words** and nothing else. No identifier, no session,
no scores, nothing anyone typed. A milestone is a number that goes up.

That is a structural guarantee, not a policy: anything not on the allowlist is
rejected before it reaches storage, so neither a bug nor a tampered client can
turn this into a data collector. `test/insight.mjs` asserts it by trying to
smuggle an email, a journal entry and an id through a valid ping.

Counts are approximate — read-then-write isn't atomic and KV is eventually
consistent. For a funnel that's the right trade; precision would cost far more
than it's worth.

The client is off unless an endpoint is configured, so a self-hosted or
offline copy sends nothing at all. It also honours Do Not Track and Global
Privacy Control without being asked, and there's an off switch under **You**.

## Deploying

```sh
npx wrangler kv namespace create COUNTS
```

Then a `wrangler.jsonc` in this directory:

```jsonc
{
  "name": "mendday-counts",
  "main": "worker.js",
  "compatibility_date": "2026-08-26",
  "kv_namespaces": [{ "binding": "COUNTS", "id": "<id from the command above>" }],
  "vars": {
    "ALLOWED_ORIGINS": "https://your-domain",
    "STATS_TOKEN": "<any long random string>"
  }
}
```

```sh
npx wrangler deploy
```

Then point the app at it — in `index.html`, before the other scripts:

```html
<script>window.MENDDAY_INSIGHT_ENDPOINT = 'https://mendday-counts.<you>.workers.dev';</script>
```

Rebuild (`node build.mjs`) and deploy. Leave that line out and nothing is sent.

## Reading the funnel

```sh
curl 'https://mendday-counts.<you>.workers.dev/stats?days=30&token=<token>'
```

`totals` is the funnel; `daily` breaks it down by date.

## Free tier

Each person generates at most seven writes across twelve weeks, because every
milestone fires once and is then remembered locally. Even at thousands of
users that sits far inside the Workers KV free allowance.
