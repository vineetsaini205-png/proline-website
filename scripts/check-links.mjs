// Finds broken internal links and missing #anchors in the built site. Run after `npm run build`.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const DIST = new URL('../dist/', import.meta.url).pathname;
const pages = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) pages.push(p); } })(DIST);
const ids = new Map();
const urlOf = (file) => '/' + file.slice(DIST.length).replace(/index\.html$/, '').replace(/\.html$/, '/');
for (const f of pages) ids.set(urlOf(f), new Set([...readFileSync(f, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
let broken = 0;
for (const f of pages) {
  const html = readFileSync(f, 'utf8');
  const from = urlOf(f);
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    let href = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(href)) continue;
    const [path, hash] = href.split('#');
    const target = path === '' ? from : path;
    if (!target.startsWith('/')) continue;
    const clean = target.split('?')[0];
    const file = clean.endsWith('/') ? join(DIST, clean, 'index.html') : join(DIST, clean);
    if (!existsSync(file)) { broken++; console.log(`BROKEN  ${from} → ${href}`); continue; }
    if (hash && clean.endsWith('/') && !ids.get(clean)?.has(decodeURIComponent(hash))) { broken++; console.log(`ANCHOR  ${from} → ${href}`); }
  }
}
console.log(`${pages.length} pages checked, ${broken} problems`);
process.exit(broken ? 1 : 0);
