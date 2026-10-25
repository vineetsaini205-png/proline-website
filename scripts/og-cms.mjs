// Renders public/images/og-cms.jpg (1200×630) for the Proline CMS pages. Run: node scripts/og-cms.mjs
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = fileURLToPath(new URL('..', import.meta.url));
const b64 = (p) => readFileSync(root + p).toString('base64');
const inter = b64('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
const jak = b64('node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff2');
const shot = b64('public/images/cms/d1-dashboard.webp');
const logo = b64('src/assets/logo/proline-horizontal-white.svg');
const html = `<!doctype html><html><head><style>
@font-face{font-family:Inter;src:url(data:font/woff2;base64,${inter}) format('woff2');font-weight:100 900}
@font-face{font-family:Jak;src:url(data:font/woff2;base64,${jak}) format('woff2');font-weight:800}
body{margin:0;width:1200px;height:630px;font-family:Inter;background:#0B2545;color:#fff;overflow:hidden;position:relative}
.l{position:absolute;left:64px;top:56px;width:520px}
.tag{display:inline-flex;align-items:center;gap:10px;background:rgba(19,178,107,.16);color:#13B26B;font-weight:700;font-size:20px;padding:8px 16px;border-radius:999px}
h1{font-family:Jak;font-size:54px;line-height:1.08;letter-spacing:-.02em;margin:28px 0 0}
p{font-size:22px;color:#C9D6E8;line-height:1.45;margin:22px 0 0}
.lap{position:absolute;right:-60px;top:110px;width:640px;background:#1B2B45;border-radius:16px 16px 6px 6px;padding:12px;box-shadow:0 24px 60px rgba(0,0,0,.45);transform:perspective(1400px) rotateY(-10deg)}
.lap img{width:100%;display:block;border-radius:6px}
.foot{position:absolute;left:64px;bottom:48px;width:190px;height:auto;display:block}
</style></head><body>
<div class="l"><span class="tag">● Proline CMS</span><h1>EV charging software you own</h1><p>Any charger brand · UPI payments with automatic refunds · GST documents · your brand, your server</p></div>
<div class="lap"><img src="data:image/webp;base64,${shot}"></div>
<img class="foot" src="data:image/svg+xml;base64,${logo}" alt="">
</body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(300);
writeFileSync(root + 'public/images/og-cms.jpg', await page.screenshot({ type: 'jpeg', quality: 85 }));
await browser.close();
console.log('og-cms.jpg written');
