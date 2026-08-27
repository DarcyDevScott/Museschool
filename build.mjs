/* Bundles the source files into two single-file outputs:
 *   dist/standalone.html   a complete document you can open from disk
 *   dist/museschool.html   the same page as an Artifact fragment (the
 *                          doctype/head/body wrapper is added at publish time)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SRC = [
  'src/data/quiz.js',
  'src/data/tasks.js',
  'src/data/lessons.js',
  'src/data/phases.js',
  'src/engine/engine.js',
  'src/store.js',
  'src/backup.js',
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
writeFileSync('dist/museschool.html',
  `<title>Museschool</title>\n${FONTS}\n<style>\n${css}\n</style>\n${BODY}\n`);

// Standalone: a full document that works straight from the filesystem.
writeFileSync('dist/standalone.html',
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n` +
  `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n` +
  `<title>Museschool</title>\n${FONTS}\n<style>\n${css}\n</style>\n</head>\n<body>\n${BODY}\n</body>\n</html>\n`);

console.log('built dist/museschool.html and dist/standalone.html');
