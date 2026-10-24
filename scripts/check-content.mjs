// Checks Markdown content against the owner's rules and the SEO rules.
// Usage: node scripts/check-content.mjs [dir-or-file ...]   (default: all of src/content)
// Exit code 1 if any ERROR. WARN lines are for a human to look at.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const yaml = createRequire(import.meta.url)('js-yaml');

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const targets = args.length ? args : ['src/content'];

// Every internal URL the site has (from the menus) plus pages built from content files.
const nav = readFileSync(join(ROOT, 'src/data/nav.ts'), 'utf8');
const known = new Set([...nav.matchAll(/href: '([^']+)'/g)].map((m) => m[1]));
['/', '/cms/', '/tools/', '/blog/', '/faq/', '/ask/', '/coverage/', '/brands/', '/contact/', '/about/', '/privacy-policy/', '/terms/'].forEach((u) => known.add(u));
const contentDirs = { services: '/services/', chargers: '/chargers/', batteries: '/batteries/', audiences: '/for/', pages: '/', blog: '/blog/' };
for (const [dir, base] of Object.entries(contentDirs)) {
  const d = join(ROOT, 'src/content', dir);
  if (!existsSync(d)) continue;
  for (const f of readdirSync(d)) if (f.endsWith('.md')) known.add(`${base}${f.replace(/\.md$/, '')}/`);
}
// Planned pages that may not exist yet (other writers are working on them).
['/blog/ev-charging-station-earnings/', '/blog/home-ev-charger-installation-guide/', '/blog/ev-vs-petrol-savings/'].forEach((u) => known.add(u));

const FORBIDDEN = [
  [/\b(cheapest|lowest price|best price|affordable price|discount|offer price|starting (at|from) ₹|only ₹)/i, 'price talk'],
  [/\bprice list\b/i, 'price list'],
  [/\b(no\.?\s?1|number one|leading (ev|company|provider|installer|brand|player)|best[- ]in[- ]class|world[- ]class|india'?s (largest|biggest|best|top))\b/i, 'hype / unprovable claim'],
  [/\b(certified|accredited|iso[ -]?\d+|approved by|empanelled|licensed by)\b/i, 'certification claim (none confirmed)'],
  [/\bauthori[sz]ed (partner|dealer|distributor|installer)\b/i, '"authorised partner" (no brand has authorised Proline in writing yet)'],
  [/\b(guarantee[d]?|within \d+ (hours|days)|same[- ]day|24\s?[x×\/]\s?7)\b/i, 'promise / response time (owner has not set one)'],
  [/\b(\d+\+? years of experience|decades)\b/i, 'experience claim (Proline: 2 years)'],
  [/\b(testimonial|our clients say|rated \d|★)/i, 'testimonial / rating'],
  [/\b(chatbot|ai assistant)\b/i, 'AI assistant (owner said no)'],
  [/\b(office address|our office|visit us at|head office|showroom)\b/i, 'office (Proline has none: Delhi only)'],
  [/\b(razorpay|cashfree|paytm|phonepe pg|billdesk)\b/i, 'payment company named (not integrated yet)'],
];
const RUPEE_OK = /tariff|per unit|a unit|\/unit|kwh|petrol|diesel|cng|fuel|litre|example|e\.g\.|for instance|save|saving|earn|revenue|profit|charge drivers|drivers pay|public charging|electricity|bill|fee is adjusted/i;

let errors = 0, warns = 0;
const err = (f, m) => { errors++; console.log(`ERROR ${f}: ${m}`); };
const warn = (f, m) => { warns++; console.log(`WARN  ${f}: ${m}`); };

function files(p) {
  const full = join(ROOT, p);
  if (!existsSync(full)) return [];
  if (statSync(full).isFile()) return [p];
  return readdirSync(full).flatMap((f) => files(join(p, f)));
}

for (const file of targets.flatMap(files).filter((f) => f.endsWith('.md'))) {
  const raw = readFileSync(join(ROOT, file), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) { err(file, 'no frontmatter'); continue; }
  let fm;
  try { fm = yaml.load(m[1]); } catch (e) { err(file, 'YAML error: ' + e.message.split('\n')[0]); continue; }
  const body = m[2];
  const isFaq = file.includes('/faqs/');
  const isBlog = file.includes('/blog/');

  if (!isFaq) {
    if (!fm.title) err(file, 'missing title');
    else if (fm.title.length > 60) err(file, `title is ${fm.title.length} chars (max 60): ${fm.title}`);
    if (!fm.description) err(file, 'missing description');
    else if (fm.description.length < 120 || fm.description.length > 165) warn(file, `description is ${fm.description.length} chars (aim 140–160)`);
    if (!fm.keyword) err(file, 'missing keyword');
    if (!isBlog) {
      for (const k of ['label', 'h1', 'intro', 'summary', 'updated']) if (!fm[k]) err(file, `missing ${k}`);
      if (fm.keyword && fm.h1 && !fm.h1.toLowerCase().includes(fm.keyword.toLowerCase().split(' ').slice(0, 2).join(' '))) warn(file, `h1 does not contain the keyword "${fm.keyword}"`);
      if (fm.intro && fm.keyword && !fm.intro.toLowerCase().includes(fm.keyword.toLowerCase().split(' ')[0])) warn(file, 'intro does not mention the keyword');
      if (fm.image && !JSON.parse(readFileSync(join(ROOT, 'src/data/images.json'), 'utf8'))[fm.image]) err(file, `image "${fm.image}" is not in src/data/images.json`);
    } else {
      if (!fm.date) err(file, 'missing date');
    }
    const faqs = fm.faqs || [];
    if (faqs.length < 3) warn(file, `only ${faqs.length} FAQs (aim 3–6)`);
    for (const r of fm.related || []) if (!known.has(r)) err(file, `related link not a known page: ${r}`);
  } else {
    for (const k of ['question', 'answer', 'group']) if (!fm[k]) err(file, `missing ${k}`);
  }

  const text = [m[1], body].join('\n');
  for (const [re, why] of FORBIDDEN) {
    const hit = text.match(re);
    if (hit) err(file, `${why}: "${hit[0]}"`);
  }
  for (const line of text.split('\n')) {
    if (line.includes('₹') && !RUPEE_OK.test(line)) warn(file, `₹ amount: check it is not a Proline/brand price: ${line.trim().slice(0, 120)}`);
  }
  for (const lm of text.matchAll(/\]\((\/[^)\s#]*)(#[^)]*)?\)/g)) {
    if (!known.has(lm[1])) err(file, `internal link not a known page: ${lm[1]}`);
  }
  const words = body.split(/\s+/).filter(Boolean).length;
  if (!isFaq && words < (isBlog ? 900 : 500)) warn(file, `body is ${words} words`);
  if (!isFaq) console.log(`ok    ${file} (${words} words, ${(fm.faqs || []).length} FAQs)`);
}
console.log(`\n${errors} errors, ${warns} warnings`);
process.exit(errors ? 1 : 0);
