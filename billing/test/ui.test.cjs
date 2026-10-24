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
  await page.waitForSelector('[data-party-pick]');
  await idle();
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
  await page.waitForSelector('#pdf-pages canvas', { timeout: 30000 });
  await page.waitForTimeout(500);
  await shot('04b-preview');
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
  await page.waitForSelector('[data-party-pick]');
  await idle();
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
  await page.waitForSelector('[data-party-pick]');
  await idle();
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

  // ---- Numbering in the owner's style (PEW/2627/07), past invoices pasted from Excel, reuse, amend, cancel from the list
  await page.click('.tabs [data-view="settings"]');
  await page.selectOption('[data-s="series.fyStyle"]', '2627');
  await page.selectOption('[data-s="series.pad"]', '2');
  await page.click('.sticky-actions [data-action="settings-save"]');
  await page.waitForFunction(() => /Settings saved/.test(document.getElementById('toast').textContent));
  await idle();
  const fyC = await page.evaluate(() => PB.fy(PB.today()).compact);
  assert.equal(await page.evaluate(() => PBApp.S.series.INV.next), 'PEW/' + fyC + '/03', 'the 26-27 style numbers count in the same series');

  const dmy = await page.evaluate(() => { const t = PB.today().split('-'); return t[2] + '-' + t[1] + '-' + t[0]; });
  const puneGstin = await gst('27AAACS1234A1Z');
  const H = ['Type', 'Doc no.', 'Status', 'Date', 'Customer or vendor', 'GSTIN', 'Address', 'City', 'PIN', 'State', 'Place of supply', 'Item', 'Item details', 'Goods or service', 'HSN/SAC', 'Qty', 'Unit', 'Rate', 'Discount %', 'GST %', 'Rates include GST', 'Round off', 'Reverse charge', 'Reference', 'Notes', 'Cancel reason'];
  const row = (o) => H.map((h) => (o[h] == null ? '' : o[h])).join('\t');
  const base = { Type: 'Invoice', Date: dmy, 'Customer or vendor': 'Sample Customer Pvt Ltd', GSTIN: puneGstin, Item: 'Armoured copper cable', 'Goods or service': 'Goods', 'HSN/SAC': '8544', Qty: 45, Unit: 'Mtr', Rate: 310, 'GST %': 18, 'Round off': 'No' };
  const pasteRows = (rows) => [H.join('\t')].concat(rows.map(row)).join('\n');
  await page.click('.tabs [data-view="import"]');
  await page.waitForSelector('[data-imppaste]');
  // A number already used makes the import refuse everything.
  await page.fill('[data-imppaste]', pasteRows([{ ...base, 'Doc no.': 'PEW/26-27/0002', Status: 'Final' }]));
  await page.click('[data-action="imp-read-paste"]');
  await page.waitForSelector('#imp-preview .alert');
  assert.match(await page.textContent('#imp-preview .alert'), /already used in this app/);
  assert.equal(await page.$eval('[data-action="imp-run"]', (b) => b.disabled), true);
  await page.fill('[data-imppaste]', pasteRows([
    { ...base, 'Doc no.': `PEW/${fyC}/05`, Status: 'Issued' },
    { Type: 'Invoice', 'Doc no.': `PEW/${fyC}/05`, Item: 'Installation and commissioning of EV charger', 'HSN/SAC': '995461', Qty: 1, Unit: 'Job', Rate: 7500, 'GST %': 18 },
    { ...base, 'Doc no.': `PEW/${fyC}/06`, Status: 'Canceled', 'Cancel reason': 'Wrong rate' },
    { ...base, 'Doc no.': `PEW/${fyC}/07`, Status: 'Final' },
    { Type: 'Proforma', 'Doc no.': 'A', Status: 'Draft', Date: dmy, 'Customer or vendor': 'Imported Buyer LLP', Address: '5 Market Road', City: 'Noida', State: 'Uttar Pradesh', Item: 'DC fast charger', Qty: 1, Rate: 650000, 'GST %': 5, 'HSN/SAC': '85044090' },
    { ...base, 'Doc no.': 'X', 'Customer or vendor': 'EXAMPLE Customer Pvt Ltd', Status: 'Final' }
  ]));
  await page.click('[data-action="imp-read-paste"]');
  await page.waitForFunction(() => document.querySelector('#imp-preview') && !document.querySelector('#imp-preview .alert'));
  const prev = await page.textContent('#imp-preview');
  assert.match(prev, /4 documents/);
  assert.match(prev, /1 EXAMPLE row skipped/);
  assert.match(prev, /Imported Buyer LLP/);
  await shot('11-import-preview');
  const mailsBeforeImport = await page.evaluate(() => FAKE.mails.length);
  await page.click('[data-action="imp-run"]');
  await page.waitForSelector('#cb-ok');
  await page.click('#cb-ok');
  await page.waitForFunction(() => /4 documents imported/.test(document.getElementById('toast').textContent), null, { timeout: 20000 });
  await idle();
  assert.equal(await page.evaluate(() => PBApp.S.series.INV.next), 'PEW/' + fyC + '/08');
  assert.deepEqual(await page.evaluate(() => PBApp.S.series.INV.reuse), ['PEW/26-27/0001', 'PEW/' + fyC + '/06']);
  assert.equal(await page.evaluate(() => PBApp.S.parties.some((p) => p.name === 'Imported Buyer LLP')), true);
  assert.equal(await page.evaluate(() => FAKE.mails.length), mailsBeforeImport, 'imported documents are not emailed');

  // A new invoice takes a cancelled number again, chosen from the Number list.
  await page.click('.new [data-new="INV"]');
  await page.waitForSelector('[data-numsel]');
  await idle();
  const numOpts = await page.$$eval('[data-numsel] option', (o) => o.map((x) => x.textContent));
  assert.equal(numOpts[0], 'Next in series: PEW/' + fyC + '/08');
  assert.ok(numOpts.includes('PEW/' + fyC + '/06 (cancelled, give again)'), numOpts.join(' | '));
  assert.equal(numOpts[numOpts.length - 1], 'Type a number…');
  await page.fill('[data-party-pick]', 'Sample Customer Pvt Ltd');
  await page.dispatchEvent('[data-party-pick]', 'change');
  await page.waitForSelector('[data-reg-pick]');
  // Paste two lines copied from Excel.
  await page.click('[data-action="lines-paste"]');
  await page.fill('#paste-form [name="rows"]', 'Item\tHSN/SAC\tQty\tUnit\tRate\tGST %\nArmoured copper cable\t8544\t20\tMtr\t310\t18\nEarthing kit\t8538\t1\tSet\t3500\t18');
  await page.click('#paste-form .btn.primary');
  await page.waitForFunction(() => document.querySelectorAll('#lines .line').length === 2);
  assert.match(await page.textContent('#totals .grand'), /11,446\.00/);
  await page.selectOption('[data-numsel]', 'reuse:PEW/' + fyC + '/06');
  assert.match(await page.textContent('.hint.warn'), /GST rule 46/);
  await page.click('.doc-head [data-action="doc-finalise"]');
  await page.waitForSelector('#cb-ok');
  assert.match(await page.textContent('#modal-body'), new RegExp('PEW/' + fyC + '/06'));
  await page.click('#cb-ok');
  await page.waitForFunction((n) => document.querySelector('.doc-head h1') && document.querySelector('.doc-head h1').textContent.includes(n), 'PEW/' + fyC + '/06', { timeout: 20000 });
  await page.waitForFunction(() => /Open PDF in Drive/.test(document.querySelector('.doc-head').textContent), null, { timeout: 20000 });
  await idle();
  assert.deepEqual(await page.evaluate(() => PBApp.S.series.INV.reuse), ['PEW/26-27/0001']);

  // Typing a number that is already used is stopped before finalising.
  await page.click('.new [data-new="INV"]');
  await page.waitForSelector('[data-numsel]');
  await idle();
  await page.fill('[data-party-pick]', 'Sample Customer Pvt Ltd');
  await page.dispatchEvent('[data-party-pick]', 'change');
  await page.waitForSelector('[data-reg-pick]');
  await page.fill('.line[data-i="0"] [data-k="name"]', 'Armoured copper cable');
  await page.dispatchEvent('.line[data-i="0"] [data-k="name"]', 'change');
  await page.selectOption('[data-numsel]', 'manual');
  await page.fill('[data-numtext]', 'PEW/' + fyC + '/05');
  await page.click('.doc-head [data-action="doc-finalise"]');
  await page.waitForSelector('.alert');
  assert.match(await page.textContent('.alert'), /already used/);
  await page.click('.tabs [data-view="docs"]');

  // Amend from the list: same number, new contents, marked Amended.
  await page.waitForSelector('tr[data-open]');
  const inv05 = await page.evaluate((n) => PBApp.S.docs.find((d) => d.number === n).id, 'PEW/' + fyC + '/05');
  await page.click(`[data-row-action="amend"][data-id="${inv05}"]`);
  await page.waitForSelector('#cb-ok');
  await page.click('#cb-ok');
  await page.waitForSelector('[data-action="amend-save"]');
  assert.match(await page.textContent('.doc-head h1'), /Amending/);
  await page.fill('.line[data-i="0"] [data-k="qty"]', '50');
  await page.click('.doc-head [data-action="amend-save"]');
  await page.fill('#amend-form [name="reason"]', 'Cable length corrected');
  await page.click('#amend-form .btn.primary');
  await page.waitForFunction(() => /amended/.test(document.getElementById('toast').textContent), null, { timeout: 20000 });
  await idle();
  assert.match(await page.textContent('.doc-head'), /Amended once/);
  await shot('12-amended');
  await page.click('.tabs [data-view="docs"]');
  await page.waitForSelector('tr[data-open]');
  assert.match(await page.textContent(`tr[data-open="${inv05}"]`), /Amended/);

  // Cancel from the list.
  const inv07 = await page.evaluate((n) => PBApp.S.docs.find((d) => d.number === n).id, 'PEW/' + fyC + '/07');
  await page.click(`[data-row-action="cancel"][data-id="${inv07}"]`);
  await page.waitForSelector('#cancel-form');
  await page.fill('#cancel-form [name="reason"]', 'Order withdrawn');
  await page.click('#cancel-form .btn.danger');
  await page.waitForFunction((id) => PBApp.S.docs.find((d) => d.id === id).status === 'CANCELLED', inv07, { timeout: 20000 });
  await idle();
  assert.ok((await page.evaluate(() => PBApp.S.series.INV.reuse)).includes('PEW/' + fyC + '/07'));
  await shot('13-documents-after-import');

  // Templates download as .csv and .xlsx; an items .xlsx can be uploaded.
  await page.click('.tabs [data-view="import"]');
  await page.click('[data-impkind="items"]');
  const [dlCsv] = await Promise.all([page.waitForEvent('download'), page.click('[data-action="tpl-csv"]')]);
  assert.equal(dlCsv.suggestedFilename(), 'Proline billing import - items.csv');
  const [dlX] = await Promise.all([page.waitForEvent('download'), page.click('[data-action="tpl-xlsx"]')]);
  assert.equal(dlX.suggestedFilename(), 'Proline billing import - items.xlsx');
  const XLSX = require('xlsx');
  const tplPath = path.join(out, 'items-template.xlsx');
  await dlX.saveAs(tplPath);
  const twb = XLSX.readFile(tplPath);
  assert.deepEqual(twb.SheetNames, ['Fill here', 'How to fill']);
  const filled = XLSX.utils.sheet_to_json(twb.Sheets['Fill here'], { header: 1 });
  filled.push(['Surge protector Type 2', 'For DB box', 'Goods', 8536, 'Nos', 2400, 18, 'Electrical']);
  const upWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(upWb, XLSX.utils.aoa_to_sheet(filled), 'Fill here');
  const upPath = path.join(out, 'items-filled.xlsx');
  XLSX.writeFile(upWb, upPath);
  await page.setInputFiles('[data-impfile]', upPath);
  await page.waitForSelector('#imp-preview');
  assert.match(await page.textContent('#imp-preview'), /1 item: 1 new/);
  assert.match(await page.textContent('#imp-preview'), /2 EXAMPLE rows skipped/);
  await page.click('[data-action="imp-run"]');
  await page.waitForFunction(() => /1 items added/.test(document.getElementById('toast').textContent));
  assert.ok(await page.evaluate(() => PBApp.S.products.some((p) => p.name === 'Surge protector Type 2' && p.hsn === '8536')));

  // Series check: no gaps.
  await page.click('.tabs [data-view="settings"]');
  await page.click('[data-action="series-check"]');
  await page.waitForSelector('#series-result li');
  const check = await page.textContent('#series-result');
  assert.ok(!/Used twice/.test(check), check);
  assert.match(check, /Given again after cancelling: 6/);
  await shot('09-settings-series');

  // Phone layout.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('.new [data-new="INV"]');
  await page.waitForSelector('[data-party-pick]');
  await idle();
  await page.waitForSelector('.line');
  await page.screenshot({ path: path.join(out, '10-phone-invoice.png'), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assert.equal(overflow, false, 'no sideways scrolling on a phone');

  assert.deepEqual(errors, []);
  console.log('UI flow passed: settings, items, parties, invoice IGST, proforma + annexure → invoice, PO, cancel, number style 2627, import by paste, reuse a cancelled number, typed number check, paste lines, amend and cancel from the list, templates, xlsx upload, series check, phone layout');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
