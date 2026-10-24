// Checks titles, descriptions, H1s, canonicals and JSON-LD on every built page. Run after `npm run build`.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const DIST = new URL('../dist/', import.meta.url).pathname;
const pages = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) pages.push(p); } })(DIST);
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const titles = new Map();
let problems = 0;
const bad = (u, m) => { problems++; console.log(`${u}: ${m}`); };
for (const f of pages) {
  const u = '/' + f.slice(DIST.length).replace(/index\.html$/, '');
  if (u.startsWith('/admin')) continue;
  const h = readFileSync(f, 'utf8');
  const title = dec((h.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
  const desc = dec((h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  const h1s = (h.match(/<h1[\s>]/g) || []).length;
  if (!title) bad(u, 'no title'); else if (title.length > 60) bad(u, `title ${title.length} chars: ${title}`);
  if (!desc) bad(u, 'no description'); else if (desc.length < 70 || desc.length > 170) bad(u, `description ${desc.length} chars`);
  if (h1s !== 1) bad(u, `${h1s} h1 elements`);
  if (!/rel="canonical"/.test(h) && !u.includes('404')) bad(u, 'no canonical');
  if (!/property="og:image"/.test(h)) bad(u, 'no og:image');
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { bad(u, 'invalid JSON-LD'); } }
  if (titles.has(title)) bad(u, `same title as ${titles.get(title)}`); else titles.set(title, u);
}
console.log(`${pages.length} pages checked, ${problems} problems`);
process.exit(problems ? 1 : 0);
