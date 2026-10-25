// Runs the real server code against in-memory Google services.
// Run: node billing/test/server.test.cjs
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const load = (f) => vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), { filename: f });
load('gas-fakes.js');
load('../src/shared.js');
load('../src/server.js');
/* global setup, apiBootstrap, apiSaveSettings, apiAddStarterProducts, apiSaveParty, apiDeleteParty, apiSaveDraft, apiFinalise, apiStorePdf,
   apiSetSeries, apiCheckSeries, apiCancel, apiDeleteDraft, apiGetDocument, apiEmailDocument, apiAmend, apiImportDocuments,
   apiImportParties, apiImportProducts, seriesRow_, reusable_, settings_, doGet, FAKE, PB */

let n = 0;
const t = (name, fn) => { try { fn(); n++; } catch (e) { console.error('FAIL', name); throw e; } };
const gst = (s14) => s14 + PB.gstinCheckChar(s14);
const firmGstin = gst('07ABCDE1234F1Z');
const raw = (sheet) => FAKE.sheets.find((s) => s.name === sheet).data;

t('setup creates the tabs and removes the empty first sheet', () => {
  setup();
  const names = FAKE.sheets.map((s) => s.name);
  ['Settings', 'Series', 'Parties', 'Registrations', 'Products', 'Documents', 'Register', 'Log'].forEach((n) => assert.ok(names.includes(n), n));
  assert.ok(!names.includes('Sheet1'));
});

let boot;
t('bootstrap before settings', () => {
  boot = apiBootstrap();
  assert.equal(boot.settings.firm.stateCode, '07');
  assert.equal(boot.series.INV.next, 'PEW/' + PB.fy(PB.today()).short + '/0001');
});

t('settings: GSTIN checked, state and PAN filled, "07" kept as text', () => {
  assert.throws(() => apiSaveSettings({ 'firm.gstin': '07ABCDE1234F1ZZ' }), /GSTIN/);
  const s = apiSaveSettings({ 'firm.gstin': firmGstin.toLowerCase(), 'firm.address1': '1 Sample Road', 'firm.pin': '110001', 'firm.pan': '', 'bank.upi': 'proline@upi' }).settings;
  assert.equal(s.firm.gstin, firmGstin);
  assert.equal(s.firm.pan, 'ABCDE1234F');
  const row = raw('Settings').find((r) => r[0] === 'firm.stateCode');
  assert.equal(row[1], '07');
  assert.throws(() => apiSaveSettings({ 'series.INV.prefix': 'PROLINE-IN' }), /16 characters/);
});

let products, cust, vendor;
t('starter items and parties with several GSTINs', () => {
  products = apiAddStarterProducts();
  assert.ok(products.length >= 8);
  assert.equal(apiAddStarterProducts().length, products.length, 'adding twice does not duplicate');
  cust = apiSaveParty({ name: 'Sample Customer', role: 'Customer', email: 'buyer@example.com', registrations: [
    { label: 'Delhi HO', gstin: gst('07AAACS1234A1Z'), address: '12 Road', city: 'New Delhi', pin: '110017', isDefault: true },
    { label: 'Pune', gstin: gst('27AAACS1234A1Z').toLowerCase(), address: 'Tech Park', city: 'Pune', pin: '411001' }] });
  assert.equal(cust.registrations.length, 2);
  assert.equal(cust.registrations[1].stateCode, '27');
  assert.equal(cust.pan, 'AAACS1234A');
  assert.throws(() => apiSaveParty({ name: 'Bad', registrations: [{ gstin: '07AAACS1234A1ZZ' }] }), /GSTIN/);
  assert.throws(() => apiSaveParty({ name: 'No state', registrations: [{ address: 'x' }] }), /state/);
  vendor = apiSaveParty({ name: 'Sample Charger Maker', role: 'Vendor', registrations: [{ gstin: gst('06AABCS9999K1Z'), address: 'Ind. Area', city: 'Faridabad' }] });
  const updated = apiSaveParty({ ...cust, phone: '99999' });
  assert.equal(updated.registrations.length, 2, 'edit keeps registrations');
});

const today = PB.today();
const fyS = PB.fy(today).short;
function invoiceDoc(regIndex) {
  const r = cust.registrations[regIndex];
  return { type: 'INV', date: today, party: { id: cust.id, name: cust.name, gstin: r.gstin, address: r.address, city: r.city, stateCode: r.stateCode, pin: r.pin },
    pos: { code: r.stateCode }, items: [
      { name: 'AC EV charger (7.4 kW)', type: 'Goods', hsn: '85044090', qty: 1, unit: 'Nos', rate: 50000, gstRate: 5 },
      { name: 'Installation', type: 'Service', hsn: '995461', qty: 1, unit: 'Job', rate: 10000, gstRate: 18 }] };
}

let d1;
t('draft saved without a number; server recomputes totals', () => {
  const res = apiSaveDraft(invoiceDoc(1));
  d1 = res.doc;
  assert.equal(d1.status, 'DRAFT');
  assert.equal(d1.number, '');
  assert.equal(d1.calc.igst, 4300);
  assert.equal(res.summary.payable, 64300);
  const docRow = raw('Documents')[1];
  assert.equal(typeof docRow[5], 'string', 'date stays text');
  assert.equal(docRow[9], '27', 'state code stays text');
});

let f1;
t('finalise gives the first number, snapshots firm details, writes the register', () => {
  const res = apiFinalise(d1);
  f1 = res.doc;
  assert.equal(f1.number, 'PEW/' + fyS + '/0001');
  assert.equal(f1.firm.gstin, firmGstin);
  assert.equal(res.series.INV.next, 'PEW/' + fyS + '/0002');
  const reg = raw('Register').slice(1);
  assert.equal(reg.length, 2, 'one row per GST rate');
  assert.equal(reg[0][0], f1.number);
  assert.throws(() => apiSaveDraft(f1), /final/);
  assert.throws(() => apiFinalise(f1), /already final/);
});

t('PDF saved to the FY / type folder and emailed to Sales@', () => {
  const res = apiStorePdf(f1.id, Buffer.from('%PDF-1.4 test').toString('base64'), { email: true });
  assert.ok(res.pdfUrl.includes('drive.google.com'));
  assert.equal(res.emailed, true);
  const file = FAKE.files[res.pdfFileId];
  assert.match(file.getName(), /^PEW-\d\d-\d\d-0001 Sample Customer\.pdf$/);
  assert.equal(file.folder.path(), 'Proline Billing/' + PB.fy(today).long + '/Tax Invoices');
  assert.equal(FAKE.mails.length, 1);
  assert.equal(FAKE.mails[0].to, 'Sales@prolineelectricalworks.com');
  assert.match(FAKE.mails[0].subject, /Tax Invoice PEW\/\d\d-\d\d\/0001 – Sample Customer – ₹64,300\.00/);
  assert.equal(FAKE.mails[0].attachments.length, 1);
});

t('intra-state invoice, numbering continues', () => {
  const res = apiFinalise(invoiceDoc(0));
  assert.equal(res.doc.number, 'PEW/' + fyS + '/0002');
  assert.equal(res.doc.calc.cgst, 2150);
});

t('validation stops an incomplete invoice and never uses a number', () => {
  const bad = invoiceDoc(0); bad.items[1].hsn = '12';
  assert.throws(() => apiFinalise(bad), /Please fix/);
  assert.equal(apiBootstrap().series.INV.next, 'PEW/' + fyS + '/0003');
});

t('series can continue from an older system, never below a used number', () => {
  assert.throws(() => apiSetSeries('INV', fyS, 1), /already used/);
  const st = apiSetSeries('INV', fyS, 45);
  assert.equal(st.INV.next, 'PEW/' + fyS + '/0046');
  const res = apiFinalise(invoiceDoc(0));
  assert.equal(res.doc.number, 'PEW/' + fyS + '/0046');
  const chk = apiCheckSeries();
  const inv = chk.find((c) => c.series.startsWith('Tax Invoice'));
  assert.equal(inv.count, 3);
  assert.equal(inv.gaps.length, 43, 'numbers 3–45 reported as not in this app');
});

t('proforma with annexure, and a PO with IGST from a Haryana vendor', () => {
  const pi = invoiceDoc(1); pi.type = 'PI'; pi.annexure = { enabled: true, title: 'Annexure A', rows: [{ description: 'Charger', spec: 'Type 2', qty: '1', unit: 'Nos' }] };
  const p = apiFinalise(pi);
  assert.equal(p.doc.number, 'PEW-PI/' + fyS + '/0001');
  const po = { type: 'PO', date: today, party: { id: vendor.id, name: vendor.name, gstin: vendor.registrations[0].gstin, stateCode: '06' }, pos: { code: '07' },
    items: [{ name: 'DC charger', type: 'Goods', hsn: '85044090', qty: 1, unit: 'Nos', rate: 600000, gstRate: 5 }] };
  const o = apiFinalise(po);
  assert.equal(o.doc.number, 'PEW-PO/' + fyS + '/0001');
  assert.equal(o.doc.calc.igst, 30000);
  assert.equal(raw('Register').length - 1, 3 * 2, 'register: 3 invoices × 2 GST rates; no PI or PO rows');
});

t('cancel keeps the number and marks the register', () => {
  const res = apiCancel(f1.id, 'Wrong GSTIN');
  assert.equal(res.doc.status, 'CANCELLED');
  assert.equal(res.doc.number, f1.number);
  const regRows = raw('Register').slice(1).filter((r) => r[13] === f1.id);
  assert.ok(regRows.every((r) => r[12] === 'CANCELLED'));
  const pdf = apiStorePdf(f1.id, Buffer.from('%PDF cancelled').toString('base64'), { email: false });
  assert.match(FAKE.files[pdf.pdfFileId].getName(), /\(CANCELLED\)\.pdf$/);
  assert.equal(FAKE.files[apiGetDocument(f1.id).meta.pdfFileId].getName().includes('CANCELLED'), true);
});

t('drafts can be deleted, final documents cannot; used parties cannot be deleted', () => {
  const d = apiSaveDraft(invoiceDoc(0)).doc;
  assert.equal(apiDeleteDraft(d.id), true);
  assert.throws(() => apiDeleteDraft(f1.id), /Only drafts/);
  assert.throws(() => apiDeleteParty(cust.id), /used on documents/);
});

t('email a document again', () => {
  const before = FAKE.mails.length;
  apiEmailDocument(f1.id, 'buyer@example.com, Sales@prolineelectricalworks.com', '', 'Please see attached');
  assert.equal(FAKE.mails.length, before + 1);
  assert.throws(() => apiEmailDocument(f1.id, 'not-an-email', '', ''), /email/);
});

t('bootstrap lists newest first', () => {
  const b = apiBootstrap();
  assert.equal(b.documents.length, 5);
  assert.equal(b.documents[0].type, 'PO');
});


// ---- numbering in the owner's style, past invoices, reused numbers, amendments, imports
const b64 = (txt) => Buffer.from(txt).toString('base64');
t('number format: year written 2627, two digits; the series counts numbers in either year style', () => {
  const st = apiSaveSettings({ 'series.fyStyle': '2627', 'series.pad': '2' });
  assert.equal(st.series.INV.next, 'PEW/' + PB.fy(today).compact + '/47', 'continues after PEW/26-27/0046');
  assert.throws(() => apiSaveSettings({ 'series.fyStyle': '2026' }), /year/);
  assert.throws(() => apiSaveSettings({ 'series.pad': '9' }), /digits/);
});

const past = '2025-09-28', f25 = PB.fy(past);
function pastParty() { const r = cust.registrations[0]; return { id: cust.id, name: cust.name, gstin: r.gstin, address: r.address, city: r.city, stateCode: r.stateCode, pin: r.pin }; }
function pastDoc(extra) {
  return Object.assign({ type: 'INV', date: past, party: pastParty(), pos: { code: '07' }, roundOff: false,
    items: [{ name: '5 core 4 sq mm copper cable', type: 'Goods', hsn: '8544', qty: 8, unit: 'Mtr', rate: 395, gstRate: 18 }] }, extra || {});
}
const ids = {};
t('import past invoices: issued and cancelled ones keep their numbers; the series continues after the highest', () => {
  const mails = FAKE.mails.length;
  const res = apiImportDocuments([
    pastDoc({ status: 'FINAL', number: 'PEW/2526/0001' }),
    pastDoc({ status: 'CANCELLED', number: 'PEW/2526/0002', cancelReason: 'Wrong rate' }),
    pastDoc({ status: 'CANCELLED', number: 'PEW/2526/0003' }),
    pastDoc({ status: 'CANCELLED', number: 'PEW/2526/0004' }),
    pastDoc({ status: 'FINAL', number: 'PEW/2526/05' }),
    pastDoc({ status: 'FINAL', number: 'PEW/2526/06' }),
    pastDoc({ status: 'DRAFT', number: 'ignored', date: today })
  ]);
  assert.equal(res.summaries.length, 7);
  res.summaries.forEach((x) => { ids[x.number || 'draft'] = x.id; });
  assert.ok(res.summaries.every((x) => x.imported));
  assert.equal(res.summaries[6].number, '', 'a draft gets no number');
  assert.equal(+seriesRow_('INV', f25.short).last, 6);
  assert.deepEqual(reusable_(settings_(), 'INV', f25), ['PEW/2526/0002', 'PEW/2526/0003', 'PEW/2526/0004']);
  const reg = raw('Register').slice(1).filter((r) => String(r[0]).startsWith('PEW/2526'));
  assert.equal(reg.length, 6);
  assert.equal(reg.filter((r) => r[12] === 'CANCELLED').length, 3);
  assert.equal(apiGetDocument(ids['PEW/2526/0002']).meta.cancelReason, 'Wrong rate');
  assert.equal(FAKE.mails.length, mails, 'recorded invoices are not emailed');
});

t('import is all-or-nothing and refuses a number already used', () => {
  const before = raw('Documents').length;
  assert.throws(() => apiImportDocuments([pastDoc({ status: 'FINAL', number: 'PEW/2526/07' }), pastDoc({ status: 'FINAL', number: 'PEW/2526/05' })]), /Nothing was imported[\s\S]*already used/);
  assert.throws(() => apiImportDocuments([pastDoc({ status: 'FINAL', number: '' })]), /needs its number/);
  assert.equal(raw('Documents').length, before);
  assert.equal(+seriesRow_('INV', f25.short).last, 6);
});

t('finalise: next in series, a cancelled number given again, or a number typed by hand', () => {
  const a = apiFinalise(pastDoc());
  assert.equal(a.doc.number, 'PEW/2526/07');
  ids['PEW/2526/07'] = a.doc.id;
  const b = apiFinalise(pastDoc({ numbering: { mode: 'reuse', number: 'PEW/2526/0002' } }));
  assert.equal(b.doc.number, 'PEW/2526/0002');
  assert.ok(!reusable_(settings_(), 'INV', f25).includes('PEW/2526/0002'));
  assert.throws(() => apiFinalise(pastDoc({ numbering: { mode: 'reuse', number: 'PEW/2526/0002' } })), /no longer free/);
  assert.throws(() => apiFinalise(pastDoc({ numbering: { mode: 'manual', number: 'PEW/2526/05' } })), /already used/);
  assert.throws(() => apiFinalise(pastDoc({ numbering: { mode: 'manual', number: 'PEW/2526/A B' } })), /letters, digits/);
  const c = apiFinalise(pastDoc({ numbering: { mode: 'manual', number: 'PEW/2526/12' } }));
  assert.equal(c.doc.number, 'PEW/2526/12');
  assert.equal(+seriesRow_('INV', f25.short).last, 12, 'series moves past a typed number');
  assert.equal(apiFinalise(pastDoc()).doc.number, 'PEW/2526/13');
  apiSaveSettings({ 'series.INV.reuse': 'PEW/2526/0008, pew/2526/0008\nPEW/2526/0009; OTHER/1' });
  assert.equal(settings_().series.INV.reuse, 'PEW/2526/0008, PEW/2526/0009, OTHER/1');
  assert.deepEqual(reusable_(settings_(), 'INV', f25), ['PEW/2526/0003', 'PEW/2526/0004', 'PEW/2526/0008', 'PEW/2526/0009']);
  apiFinalise(pastDoc({ numbering: { mode: 'reuse', number: 'PEW/2526/0008' } }));
  assert.equal(settings_().series.INV.reuse, 'PEW/2526/0009, OTHER/1', 'a listed number is taken off the list once used');
  const chk = apiCheckSeries().find((x) => x.series === 'Tax Invoice 2025-26');
  assert.deepEqual(chk.duplicates, []);
  assert.deepEqual(chk.reissued, [2]);
});

t('amend: new contents and a history; the old PDF is kept, renamed; the register is rewritten', () => {
  const id = ids['PEW/2526/07'];
  const pdf = apiStorePdf(id, b64('%PDF first'), { email: false });
  const doc = apiGetDocument(id);
  doc.items[0].qty = 10;
  assert.throws(() => apiAmend(doc, ' '), /reason/);
  const res = apiAmend(doc, 'Quantity corrected');
  assert.equal(res.doc.number, 'PEW/2526/07');
  assert.equal(res.doc.calc.taxable, 3950);
  assert.equal(res.doc.meta.amendments.length, 1);
  assert.equal(res.doc.meta.amendments[0].payable, 3728.8);
  assert.match(FAKE.files[pdf.pdfFileId].getName(), /\(before amendment 1\)\.pdf$/);
  assert.equal(FAKE.files[pdf.pdfFileId].trashed, false);
  assert.equal(res.summary.pdfUrl, '');
  assert.ok(res.summary.amendedAt);
  const again = apiStorePdf(id, b64('%PDF amended'), { email: false });
  assert.equal(FAKE.files[pdf.pdfFileId].trashed, false, 'saving the new PDF keeps the old one');
  assert.notEqual(again.pdfFileId, pdf.pdfFileId);
  const reg = raw('Register').slice(1).filter((r) => r[13] === id);
  assert.equal(reg.length, 1);
  assert.equal(+reg[0][7], 3950);
  const d2 = apiGetDocument(id);
  d2.numbering = { mode: 'manual', number: 'PEW/2526/05' };
  assert.throws(() => apiAmend(d2, 'Number'), /already used/);
  d2.numbering = { mode: 'manual', number: 'PEW/2526/20' };
  const r2 = apiAmend(d2, 'Number corrected');
  assert.equal(r2.doc.number, 'PEW/2526/20');
  assert.equal(r2.doc.meta.amendments.length, 2);
  assert.equal(+seriesRow_('INV', f25.short).last, 20);
  assert.throws(() => apiAmend(apiGetDocument(ids['PEW/2526/0003']), 'x'), /Only a final/);
});

t('import customers and vendors: new ones added, new GSTINs added to an existing name', () => {
  const res = apiImportParties([
    { row: 2, name: 'Sample Customer', role: 'Customer', registrations: [{ label: 'Bengaluru', gstin: gst('29AAACS1234A1Z').toLowerCase(), address: 'HSR Layout', city: 'Bengaluru' }] },
    { row: 3, name: 'Imported Buyer LLP', role: 'Customer', phone: '98100', registrations: [{ address: '5 Market', city: 'Noida', stateCode: '09' }] },
    { row: 4, name: 'Imported Buyer LLP', role: 'Customer', registrations: [{ address: '5 Market', city: 'Noida', stateCode: '09' }] }
  ]);
  assert.equal(res.added, 1);
  assert.equal(res.updated, 1);
  const sc = res.parties.find((p) => p.name === 'Sample Customer');
  assert.equal(sc.registrations.length, 3);
  assert.equal(res.parties.find((p) => p.name === 'Imported Buyer LLP').registrations.length, 1, 'the same address is not added twice');
  assert.throws(() => apiImportParties([{ row: 7, name: 'Bad', registrations: [{ gstin: '07AAACS1234A1ZZ' }] }]), /Row 7 \(Bad\).*GSTIN/);
});

t('import items: new ones added, same name updated', () => {
  const res = apiImportProducts([
    { row: 2, name: 'Armoured copper cable', type: 'Goods', hsn: '8544', unit: 'Mtr', rate: 310, gstRate: 18 },
    { row: 3, name: 'Earthing kit', type: 'Goods', hsn: '8538', unit: 'Set', rate: 3500, gstRate: 18, category: 'Electrical' }
  ]);
  assert.equal(res.updated, 1);
  assert.equal(res.added, 1);
  assert.equal(res.products.find((p) => p.name === 'Armoured copper cable').rate, 310);
  assert.throws(() => apiImportProducts([{ row: 9, name: 'Odd', type: 'Goods', hsn: '12', gstRate: 18 }]), /Row 9 \(Odd\)/);
});

t('web app page: title and the Proline tab icon', () => {
  const out = doGet();
  assert.equal(out.favicon, 'https://www.prolineelectricalworks.com/favicon-32.png');
});

console.log(`${n} server checks passed`);
