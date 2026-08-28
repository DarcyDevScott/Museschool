/* Build outputs:
 *   dist/standalone.html   a complete document you can open from disk
 *   dist/mendday.html   the same page as an Artifact fragment (the
 *                          doctype/head/body wrapper is added at publish time)
 *   docs/                  the deployable site — exactly the files a host
 *                          should serve, and nothing else
 *
 * docs/ exists because a static host pointed at the repository root will try
 * to publish everything in it. Cloudflare installs wrangler during its build,
 * which drops a 145 MiB workerd binary into node_modules, and the deploy dies
 * on a per-file size cap. Serving a folder that only ever contains the app
 * avoids that class of problem entirely, and /docs is also a folder GitHub
 * Pages can serve directly, so the same layout works on both.
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';

const SRC = [
  'src/data/quiz.js',
  'src/data/tasks.js',
  'src/data/lessons.js',
  'src/data/phases.js',
  'src/engine/engine.js',
  'src/store.js',
  'src/backup.js',
  'src/insight.js',
  'src/ui/quiz-ui.js',
  'src/ui/app-ui.js'
];

// The service worker caches the app shell by hand, so a new source file that
// nobody adds to it would be missing offline — and stale for anyone who has
// already installed the app unless VERSION also moves.
const sw = readFileSync('sw.js', 'utf8');
const missing = [...SRC, 'src/styles.css'].filter((f) => !sw.includes(`'./${f}'`));
if (missing.length) {
  console.error('sw.js is missing from its cache list:\n  ' + missing.join('\n  ') +
    '\nAdd them to SHELL and bump VERSION.');
  process.exit(1);
}

const css = readFileSync('src/styles.css', 'utf8');
const js = SRC.map((f) => `/* ---- ${f} ---- */\n${readFileSync(f, 'utf8')}`).join('\n');

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spectral:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">';

const BODY =
  '<div id="app"></div>\n' +
  '<div id="toast" class="toast" role="status" aria-live="polite"></div>\n' +
  `<script>\n${js}\nMS.boot();\n<\/script>`;

mkdirSync('dist', { recursive: true });

// Artifact fragment: title + styles + markup, no document wrapper.
writeFileSync('dist/mendday.html',
  `<title>Mendday</title>\n${FONTS}\n<style>\n${css}\n</style>\n${BODY}\n`);

// Standalone: a full document that works straight from the filesystem.
writeFileSync('dist/standalone.html',
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n` +
  `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n` +
  `<title>Mendday</title>\n${FONTS}\n<style>\n${css}\n</style>\n</head>\n<body>\n${BODY}\n</body>\n</html>\n`);

// ---- docs/: the deployable site ----
const SITE_FILES = ['index.html', 'sw.js', 'manifest.webmanifest'];
const SITE_DIRS = ['src', 'icons'];

rmSync('docs', { recursive: true, force: true });
mkdirSync('docs', { recursive: true });
for (const f of SITE_FILES) cpSync(f, `docs/${f}`);
for (const d of SITE_DIRS) cpSync(d, `docs/${d}`, { recursive: true });

// The service worker names every file it caches; if one of those is missing
// from docs/ the deployed app breaks offline in a way local testing misses.
const shellPaths = [...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]).filter(Boolean);
const absent = shellPaths.filter((f) => !existsSync(`docs/${f}`));
if (absent.length) {
  console.error('docs/ is missing files the service worker caches:\n  ' + absent.join('\n  '));
  process.exit(1);
}

console.log('built dist/mendday.html, dist/standalone.html and docs/ (' +
  shellPaths.length + ' cached files verified)');
