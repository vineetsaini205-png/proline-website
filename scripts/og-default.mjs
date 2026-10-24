// Renders public/images/og-default.jpg (1200×630) with the site fonts. Run: node scripts/og-default.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const b64 = (p) => readFileSync(root + p).toString('base64');
const inter = b64('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
const jak = b64('node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff2');
const photo = b64('public/images/og/dc-hub-canopy.jpg');
const html = `<!doctype html><html><head><style>
@font-face{font-family:Inter;src:url(data:font/woff2;base64,${inter}) format('woff2');font-weight:100 900}
@font-face{font-family:Jak;src:url(data:font/woff2;base64,${jak}) format('woff2');font-weight:800}
body{margin:0;width:1200px;height:630px;display:flex;font-family:Inter;background:#0B2545;color:#fff;overflow:hidden}
.l{width:640px;padding:56px 0 56px 64px;box-sizing:border-box;display:flex;flex-direction:column}
.logo{display:flex;align-items:center;gap:14px}.n{font-family:Jak;font-size:34px;line-height:1}.s{font-size:15px;letter-spacing:.14em;color:#A9BBD3;font-weight:600;margin-top:5px}
h1{font-family:Jak;font-size:56px;line-height:1.07;letter-spacing:-.02em;margin:54px 0 0}
h1 u{text-decoration-color:#13B26B;text-decoration-thickness:7px;text-underline-offset:9px}
p{margin:auto 0 0;font-size:22px;color:#C9D6E8;font-weight:500}
p b{color:#13B26B}
.r{flex:1;background:url(data:image/jpeg;base64,${photo}) center/cover;clip-path:polygon(14% 0,100% 0,100% 100%,0 100%)}
</style></head><body><div class="l"><div class="logo"><svg width="58" height="58" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="#13B26B"/><path d="M22.5 7 L11 22.5 H19 L17.5 33 L29 17.5 H21 Z" fill="#0B2545"/></svg><div><div class="n">Proline</div><div class="s">ELECTRICAL WORKS</div></div></div>
<h1>EV charger installation <u>across India</u></h1><p><b>●</b> Any brand · Survey to handover · 200+ technicians</p></div><div class="r"></div></body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(300);
writeFileSync(root + 'public/images/og-default.jpg', await page.screenshot({ type: 'jpeg', quality: 85 }));
await browser.close();
console.log('og-default.jpg written');
