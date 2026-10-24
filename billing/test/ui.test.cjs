// Drives the real app page (dist/test.html, wired to in-memory fakes) in Chromium.
// Run: node billing/build.mjs --pdfmake-dir <pdfmake/build>; node billing/test/ui.test.cjs <screenshotDir>
const path = require('path');
const { chromium } = require('playwright');
const assert = require('assert/strict');
const out = process.argv[2] || '.';
const page_ = 'file://' + path.join(__dirname, '..', 'dist', 'test.html');

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('dialog', (d) => d.accept());
  const shot = (n) => page.screenshot({ path: path.join(out, n + '.png'), fullPage: true });
  const idle = () => page.waitForFunction(() => document.getElementById('busy').hidden, null, { timeout: 15000 });
  const gst = (s14) => page.evaluate((s) => s + PB.gstinCheckChar(s), s14);

  await page.goto(page_);
  await idle();
  // First run: no GSTIN yet, so the app opens Settings.
  await page.waitForSelector('[data-s="firm.gstin"]');
  await shot('01-settings-first-run');
  const firm = await gst('07ABCDE1234F1Z');
  await page.fill('[data-s="firm.address1"]', '1 Sample Road, Sample Nagar');
  await page.fill('[data-s="firm.pin"]', '110001');
  await page.fill('[data-s="firm.gstin"]', firm.toLowerCase());
  assert.match(await page.textContent('[data-s="firm.gstin"] + .hint'), /Delhi/);
  await page.fill('[data-s="bank.name"]', 'Sample Bank');
  await page.fill('[data-s="bank.accountNo"]', '000011112222');
  await page.fill('[data-s="bank.ifsc"]', 'SAMP0000001');
  await page.fill('[data-s="bank.upi"]', 'proline@upi');
  await page.click('.sticky-actions [data-action="settings-save"]');
  await page.waitForFunction(() => /Settings saved/.test(document.getElementById('toast').textContent));
  await idle();

  // Items: starter list.
  await page.click('.tabs [data-view="items"]');
  await page.click('[data-action="items-starter"]');
  await page.waitForSelector('tr[data-item-edit]');
  await idle();
  assert.ok((await page.$$('tr[data-item-edit]')).length >= 8);
  await shot('02-items');

  // Customer with two GSTINs.
  await page.click('.tabs [data-view="parties"]');
  await page.click('[data-action="party-new"]');
  await page.fill('#party-form [name="name"]', 'Sample Customer Pvt Ltd');
  await page.fill('#party-form [name="email"]', 'buyer@example.com');
  await page.fill('fieldset.reg[data-reg="0"] [data-r="gstin"]', await gst('07AAACS1234A1Z'));
  await page.fill('fieldset.reg[data-reg="0"] [data-r="label"]', 'Delhi HO');
  await page.fill('fieldset.reg[data-reg="0"] [data-r="address"]', '12 Sample Road');
  await page.fill('fieldset.reg[data-reg="0"] [data-r="city"]', 'New Delhi');
  await page.click('[data-action="reg-add"]');
  await page.fill('fieldset.reg[data-reg="1"] [data-r="gstin"]', await gst('27AAACS1234A1Z'));
  await page.fill('fieldset.reg[data-reg="1"] [data-r="label"]', 'Pune site');
  await page.fill('fieldset.reg[data-reg="1"] [data-r="city"]', 'Pune');
  assert.equal(await page.inputValue('fieldset.reg[data-reg="1"] [data-r="stateCode"]'), '27');
  await shot('03-party-form');
  await page.click('#party-form button.primary');
  await page.waitForSelector('[data-party]');
  await idle();
  assert.equal((await page.$$('[data-party]')).length, 1);
  // Vendor.
  await page.click('[data-action="party-new"]');
  await page.fill('#party-form [name="name"]', 'Sample Charger Maker');
  await page.selectOption('#party-form [name="role"]', 'Vendor');
  await page.fill('fieldset.reg[data-reg="0"] [data-r="gstin"]', await gst('06AABCS9999K1Z'));
  await page.click('#party-form button.primary');
  await page.waitForFunction(() => document.querySelectorAll('[data-party]').length === 2);
  await idle();

  // New tax invoice to the Pune registration: IGST.
  await page.click('.new [data-new="INV"]');
  await page.fill('[data-party-pick]', 'Sample Customer Pvt Ltd');
  await page.dispatchEvent('[data-party-pick]', 'change');
  await page.waitForSelector('[data-reg-pick]');
  const pune = await page.$eval('[data-reg-pick]', (s) => [...s.options].find((o) => o.textContent.includes('Pune')).value);
  await page.selectOption('[data-reg-pick]', pune);
  assert.equal(await page.inputValue('[data-pos]'), '27');
  await page.fill('.line[data-i="0"] [data-k="name"]', 'AC EV charger (7.4 kW)');
  await page.dispatchEvent('.line[data-i="0"] [data-k="name"]', 'change');
  assert.equal(await page.inputValue('.line[data-i="0"] [data-k="hsn"]'), '85044090');
  await page.fill('.line[data-i="0"] [data-k="rate"]', '50000');
  await page.click('[data-action="line-add"]');
  await page.fill('.line[data-i="1"] [data-k="name"]', 'Installation and commissioning of EV charger');
  await page.dispatchEvent('.line[data-i="1"] [data-k="name"]', 'change');
  await page.fill('.line[data-i="1"] [data-k="rate"]', '10000');
  assert.match(await page.textContent('#totals'), /IGST/);
  assert.match(await page.textContent('#totals .grand'), /64,300\.00/);
  assert.match(await page.textContent('#tax-mode'), /Other state: IGST/);
  await page.fill('[data-f="refs.dueDate"]', '2026-11-08');
  await shot('04-invoice-draft');
  await page.click('.doc-head [data-action="doc-save"]');
  await page.waitForFunction(() => /Draft saved/.test(document.getElementById('toast').textContent));
  await idle();
  // Preview.
  await page.click('.doc-head [data-action="doc-preview"]');
  await page.waitForSelector('iframe.pdf');
  await page.click('.pdf-head [data-close]');
  // Finalise.
  await page.click('.doc-head [data-action="doc-finalise"]');
  await page.waitForSelector('#cb-ok');
  assert.match(await page.textContent('#modal-body'), /PEW\/\d\d-\d\d\/0001/);
  await page.click('#cb-ok');
  await page.waitForFunction(() => document.querySelector('.doc-head h1') && /PEW\/\d\d-\d\d\/0001/.test(document.querySelector('.doc-head h1').textContent));
  await page.waitForFunction(() => /Open PDF in Drive/.test(document.querySelector('.doc-head').textContent), null, { timeout: 20000 });
  await idle();
  const mails = await page.evaluate(() => FAKE.mails.length);
  assert.equal(mails, 1);
  const pdfBytes = await page.evaluate(() => { const f = Object.values(FAKE.files).find((x) => /0001/.test(x.getName())); return f.getBytes ? 0 : f.getBlob().getBytes().length; });
  assert.ok(pdfBytes > 20000, 'a real PDF was stored (' + pdfBytes + ' bytes)');
  await shot('05-invoice-final');

  // Make a proforma with an annexure, finalise, then turn it into a tax invoice.
  await page.click('.new [data-new="PI"]');
  await page.fill('[data-party-pick]', 'Sample Customer Pvt Ltd');
  await page.dispatchEvent('[data-party-pick]', 'change');
  await page.waitForSelector('[data-reg-pick]');
  assert.equal(await page.inputValue('[data-pos]'), '07');
  await page.fill('.line[data-i="0"] [data-k="name"]', 'DC fast charger');
  await page.dispatchEvent('.line[data-i="0"] [data-k="name"]', 'change');
  await page.fill('.line[data-i="0"] [data-k="rate"]', '650000');
  await page.fill('.line[data-i="0"] [data-k="discountPct"]', '2');
  await page.check('[data-f="annexure.enabled"]');
  await page.waitForSelector('[data-action="annex-add"]');
  await page.click('[data-action="annex-add"]');
  await page.fill('.annex-row[data-ai="0"] [data-ak="description"]', 'DC charger 60 kW');
  await page.fill('.annex-row[data-ai="0"] [data-ak="spec"]', 'CCS2 dual gun, OCPP 1.6J');
  assert.match(await page.textContent('#totals'), /CGST/);
  await shot('06-proforma-annexure');
  await page.click('.doc-head [data-action="doc-finalise"]');
  await page.click('#cb-ok');
  await page.waitForFunction(() => /PEW-PI\/\d\d-\d\d\/0001/.test(document.querySelector('.doc-head h1').textContent));
  await page.waitForFunction(() => /Make tax invoice/.test(document.querySelector('.doc-head').textContent), null, { timeout: 20000 });
  await idle();
  await page.click('.doc-head [data-action="doc-to-invoice"]');
  assert.equal(await page.inputValue('[data-f="refs.piNumber"]'), await page.evaluate(() => PBApp.S.docs.find((d) => d.type === 'PI').number));
  await page.click('.doc-head [data-action="doc-finalise"]');
  await page.click('#cb-ok');
  await page.waitForFunction(() => /PEW\/\d\d-\d\d\/0002/.test(document.querySelector('.doc-head h1').textContent));
  await idle();

  // Purchase order from the Haryana vendor (IGST into Delhi).
  await page.click('.new [data-new="PO"]');
  await page.fill('[data-party-pick]', 'Sample Charger Maker');
  await page.dispatchEvent('[data-party-pick]', 'change');
  await page.waitForFunction(() => /Sample Charger Maker/.test(document.querySelector('.party-box') ? document.querySelector('.party-box').textContent : ''));
  await page.fill('.line[data-i="0"] [data-k="name"]', 'AC EV charger (7.4 kW)');
  await page.dispatchEvent('.line[data-i="0"] [data-k="name"]', 'change');
  await page.fill('.line[data-i="0"] [data-k="qty"]', '10');
  await page.fill('.line[data-i="0"] [data-k="rate"]', '38000');
  assert.match(await page.textContent('#tax-mode'), /IGST/);
  await page.click('.doc-head [data-action="doc-finalise"]');
  await page.click('#cb-ok');
  await page.waitForFunction(() => /PEW-PO\/\d\d-\d\d\/0001/.test(document.querySelector('.doc-head h1').textContent));
  await idle();
  await shot('07-po-final');

  // Cancel the first invoice.
  await page.click('.tabs [data-view="docs"]');
  await page.waitForSelector('tr[data-open]');
  await shot('08-documents');
  const firstInv = await page.evaluate(() => PBApp.S.docs.find((d) => /\/0001$/.test(d.number) && d.type === 'INV').id);
  await page.click(`tr[data-open="${firstInv}"]`);
  await page.waitForSelector('.doc-head [data-action="doc-cancel"]');
  await page.click('.doc-head [data-action="doc-cancel"]');
  await page.fill('#cancel-form [name="reason"]', 'Wrong registration chosen');
  await page.click('#cancel-form .btn.danger');
  await page.waitForFunction(() => /Cancelled/.test(document.querySelector('.doc-head').textContent), null, { timeout: 20000 });
  await idle();

  // Series check: no gaps.
  await page.click('.tabs [data-view="settings"]');
  await page.click('[data-action="series-check"]');
  await page.waitForSelector('#series-result li');
  const check = await page.textContent('#series-result');
  assert.ok(!/Missing/.test(check), check);
  await shot('09-settings-series');

  // Phone layout.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('.new [data-new="INV"]');
  await page.waitForSelector('.line');
  await page.screenshot({ path: path.join(out, '10-phone-invoice.png'), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assert.equal(overflow, false, 'no sideways scrolling on a phone');

  assert.deepEqual(errors, []);
  console.log('UI flow passed: settings, items, parties, invoice IGST, proforma + annexure → invoice, PO, cancel, series check, phone layout');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
