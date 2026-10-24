// Screenshots of built pages for review. Serves dist/ on a local port.
// Usage: node scripts/shots.mjs <outDir> /path/ [/path2/ ...]   (env FULL=1 for full-page, W=width)
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [outDir, ...paths] = process.argv.slice(2);
const DIST = new URL('../dist/', import.meta.url).pathname;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = join(DIST, p);
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); } catch { f = join(DIST, '404.html'); res.statusCode = 404; }
  try { res.setHeader('content-type', types[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)); } catch { res.statusCode = 404; res.end('nf'); }
}).listen(4329);
const browser = await chromium.launch();
const sizes = process.env.W ? [{ name: 'w' + process.env.W, width: Number(process.env.W), height: 900 }] : [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 390, height: 844 }];
for (const p of paths) {
  for (const s of sizes) {
    const page = await browser.newPage({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: s.width < 500 ? 2 : 1 });
    await page.goto('http://localhost:4329' + p, { waitUntil: 'networkidle' });
    if (process.env.FULL) {
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
      await page.waitForTimeout(400);
    } else await page.waitForTimeout(200);
    const name = (p.replace(/\//g, '_').replace(/^_|_$/g, '') || 'home') + '-' + s.name + '.png';
    await page.screenshot({ path: join(outDir, name), fullPage: !!process.env.FULL });
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    if (w > s.width) console.log('HORIZONTAL OVERFLOW', p, s.name, w);
    await page.close();
    console.log('shot', name);
  }
}
await browser.close();
server.close();
