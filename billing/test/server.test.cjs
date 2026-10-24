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
   apiSetSeries, apiCheckSeries, apiCancel, apiDeleteDraft, apiGetDocument, apiEmailDocument, FAKE, PB */

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

console.log(`${n} server checks passed`);
