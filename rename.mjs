/* Rebrand the whole project in one go.
 *
 *   node rename.mjs Slowmend
 *
 * Renames every occurrence — the title, the manifest, the service worker
 * cache, the storage key, file names, env vars and the docs — then rebuilds.
 *
 * Note it changes the localStorage key, so anyone with existing data would
 * appear to start fresh. That is fine before a public launch and would not be
 * afterwards; after launch, keep the key and rename only what people see.
 */
import { readFileSync, writeFileSync, renameSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execSync } from 'node:child_process';

const Name = process.argv[2];
if (!Name || !/^[A-Z][A-Za-z]{2,15}$/.test(Name)) {
  console.error('Usage: node rename.mjs <NewName>   (one word, initial capital)');
  process.exit(1);
}
const lower = Name.toLowerCase();

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'docs', 'icons']);
const TEXT = new Set(['.js', '.mjs', '.json', '.jsonc', '.html', '.css', '.md', '.webmanifest', '']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (TEXT.has(extname(p))) out.push(p);
  }
  return out;
}

let files = 0, hits = 0;
for (const p of walk('.')) {
  const before = readFileSync(p, 'utf8');
  // Order matters: the all-caps env-var form first, then title case, then lower.
  const after = before
    .replace(/MENDDAY/g, Name.toUpperCase())
    .replace(/Mendday/g, Name)
    .replace(/mendday/g, lower);
  if (after !== before) {
    writeFileSync(p, after);
    files++;
    hits += before.split(/mendday/gi).length - 1;
  }
}

// The one file whose name carries the brand.
if (existsSync('dist/mendday.html')) renameSync('dist/mendday.html', `dist/${lower}.html`);

console.log(`renamed ${hits} occurrences across ${files} files`);
execSync('node build.mjs', { stdio: 'inherit' });
console.log(`\nNow: git commit, then set the Cloudflare project name to "${lower}".`);
