// Run: node billing/test/shared.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const PB = createRequire(import.meta.url)('../src/shared.js');

let n = 0;
const t = (name, fn) => { fn(); n++; };

t('rounding to paise', () => {
  assert.equal(PB.r2(1.005), 1.01);
  assert.equal(PB.r2(2.675), 2.68);
  assert.equal(PB.r2(-1.005), -1.01);
  assert.equal(PB.r2(0.1 + 0.2), 0.3);
});

t('Indian money format', () => {
  assert.equal(PB.money(1234567.5), '12,34,567.50');
  assert.equal(PB.money(999), '999.00');
  assert.equal(PB.money(100000), '1,00,000.00');
  assert.equal(PB.money(12345678.9), '1,23,45,678.90');
  assert.equal(PB.money(-1500), '-1,500.00');
  assert.equal(PB.money(1500, 0), '1,500');
});

t('amount in words', () => {
  assert.equal(PB.amountInWords(64301), 'Indian Rupees Sixty-Four Thousand Three Hundred One Only');
  assert.equal(PB.amountInWords(12345678), 'Indian Rupees One Crore Twenty-Three Lakh Forty-Five Thousand Six Hundred Seventy-Eight Only');
  assert.equal(PB.amountInWords(100000), 'Indian Rupees One Lakh Only');
  assert.equal(PB.amountInWords(1050.5), 'Indian Rupees One Thousand Fifty and Fifty Paise Only');
  assert.equal(PB.amountInWords(0), 'Indian Rupees Zero Only');
  assert.equal(PB.amountInWords(1500000000), 'Indian Rupees One Hundred Fifty Crore Only');
});

t('GSTIN check digit and parts', () => {
  const ok = PB.checkGstin('27AAPFU0939F1ZV');
  assert.equal(ok.ok, true, ok.error);
  assert.equal(ok.stateCode, '27');
  assert.equal(ok.stateName, 'Maharashtra');
  assert.equal(ok.pan, 'AAPFU0939F');
  assert.equal(PB.checkGstin('27AAPFU0939F1ZA').ok, false);
  assert.equal(PB.checkGstin('27AAPFU0939F1Z').ok, false);
  assert.equal(PB.checkGstin('').ok, false);
  // A made-up Delhi GSTIN gets the right check digit, and lower case is accepted.
  const d14 = '07ABCDE1234F1Z';
  const d = (d14 + PB.gstinCheckChar(d14)).toLowerCase();
  assert.equal(PB.checkGstin(d).ok, true);
  assert.equal(PB.checkGstin(d).stateName, 'Delhi');
});

t('HSN and SAC', () => {
  assert.equal(PB.checkHsn('8504', 'Goods'), '');
  assert.equal(PB.checkHsn('85044090', 'Goods'), '');
  assert.notEqual(PB.checkHsn('850', 'Goods'), '');
  assert.equal(PB.checkHsn('995461', 'Service'), '');
  assert.notEqual(PB.checkHsn('8504', 'Service'), '');
});

t('financial year and numbers', () => {
  assert.equal(PB.fy('2026-03-31').short, '25-26');
  assert.equal(PB.fy('2026-04-01').short, '26-27');
  assert.equal(PB.fy('2027-01-15').long, '2026-27');
  assert.equal(PB.formatNumber('PEW', '26-27', 7, 4), 'PEW/26-27/0007');
  assert.equal(PB.checkInvoiceNumber('PEW/26-27/0007'), '');
  assert.notEqual(PB.checkInvoiceNumber('PROLINE-INV/26-27/0007'), '');
  assert.notEqual(PB.checkInvoiceNumber('PEW 26-27 7'), '');
});

const items = [
  { name: 'AC charger 7.4 kW', type: 'Goods', hsn: '85044090', qty: 1, unit: 'Nos', rate: 50000, discountPct: 0, gstRate: 5 },
  { name: 'Installation and commissioning', type: 'Service', hsn: '995461', qty: 1, unit: 'Job', rate: 10000, discountPct: 0, gstRate: 18 },
];

t('intra-state: CGST + SGST', () => {
  const c = PB.compute({ items, pos: { code: '07' } }, '07');
  assert.equal(c.intra, true);
  assert.equal(c.taxable, 60000);
  assert.equal(c.cgst, 2150);
  assert.equal(c.sgst, 2150);
  assert.equal(c.igst, 0);
  assert.equal(c.total, 64300);
  assert.equal(c.payable, 64300);
  assert.equal(c.roundOff, 0);
  assert.equal(c.hsnSummary.length, 2);
  assert.equal(c.sgstLabel, 'SGST');
});

t('inter-state: IGST', () => {
  const c = PB.compute({ items, pos: { code: '27' } }, '07');
  assert.equal(c.intra, false);
  assert.equal(c.igst, 4300);
  assert.equal(c.cgst + c.sgst, 0);
  assert.equal(c.payable, 64300);
});

t('union territory without legislature: UTGST label', () => {
  const c = PB.compute({ items, pos: { code: '04' } }, '04');
  assert.equal(c.sgstLabel, 'UTGST');
});

t('prices including GST', () => {
  const c = PB.compute({ pricesIncludeGst: true, pos: { code: '07' }, items: [{ name: 'x', qty: 1, rate: 1180, gstRate: 18 }] }, '07');
  assert.equal(c.taxable, 1000);
  assert.equal(c.cgst, 90);
  assert.equal(c.sgst, 90);
  assert.equal(c.payable, 1180);
});

t('discount and round off', () => {
  const c = PB.compute({ pos: { code: '07' }, items: [{ name: 'x', qty: 3, rate: 333.33, discountPct: 10, gstRate: 18 }] }, '07');
  // 3 × 333.33 = 999.99; −10% = 899.99; CGST 9% = 81.00 (80.9991); total 1061.99 → 1062
  assert.equal(c.gross, 999.99);
  assert.equal(c.taxable, 899.99);
  assert.equal(c.cgst, 81);
  assert.equal(c.total, 1061.99);
  assert.equal(c.payable, 1062);
  assert.equal(c.roundOff, 0.01);
  const noRound = PB.compute({ roundOff: false, pos: { code: '07' }, items: [{ name: 'x', qty: 3, rate: 333.33, discountPct: 10, gstRate: 18 }] }, '07');
  assert.equal(noRound.payable, 1061.99);
  assert.equal(noRound.roundOff, 0);
});

t('purchase order uses the vendor state', () => {
  // Vendor in Haryana (06), goods delivered to Proline in Delhi (07): IGST.
  const c = PB.compute({ type: 'PO', pos: { code: '07' }, items }, '06');
  assert.equal(c.intra, false);
  assert.equal(c.igst, 4300);
});

t('validation messages', () => {
  const firm = { legalName: 'Proline Electrical Works', gstin: '07ABCDE1234F1Z' + PB.gstinCheckChar('07ABCDE1234F1Z'), address1: 'Delhi' };
  assert.deepEqual(PB.validate({ type: 'INV', date: '2026-10-24', party: { name: 'A' }, pos: { code: '07' }, items }, firm), []);
  const bad = PB.validate({ type: 'INV', date: '', party: {}, pos: {}, items: [{ name: '', qty: 0, rate: 5, gstRate: 7, hsn: '12', type: 'Goods' }] }, {});
  assert.ok(bad.length >= 8, bad.join('\n'));
});

t('numbers in the 2627 style, and reading numbers back', () => {
  const f = PB.fy('2026-10-25');
  assert.equal(f.compact, '2627');
  assert.equal(PB.formatNumber('PEW', PB.fyTag(f, '2627'), 7, 2), 'PEW/2627/07');
  assert.equal(PB.formatNumber('PEW', PB.fyTag(f, '26-27'), 7, 4), 'PEW/26-27/0007');
  assert.equal(PB.seqOf('PEW/2627/0001', 'PEW', f), 1);
  assert.equal(PB.seqOf('pew/26-27/12', 'PEW', f), 12);
  assert.equal(PB.seqOf('PEW-PI/2627/3', 'PEW', f), null, 'another series');
  assert.equal(PB.seqOf('PEW/2526/9', 'PEW', f), null, 'another year');
  assert.equal(PB.seqOf('PEW-PI/2627/384', 'PEW-PI', f), 384);
});

t('reading imported cells: dates day first, states, types, statuses', () => {
  assert.equal(PB.parseDate('28-09-2026'), '2026-09-28');
  assert.equal(PB.parseDate('28/9/26'), '2026-09-28');
  assert.equal(PB.parseDate('28 Sep 2026'), '2026-09-28');
  assert.equal(PB.parseDate('05-sept-26'), '2026-09-05');
  assert.equal(PB.parseDate(46293), '2026-09-28', 'an Excel date number');
  assert.equal(PB.parseDate('31-02-2026'), '', 'no 31 February');
  assert.equal(PB.stateCodeOf('Delhi'), '07');
  assert.equal(PB.stateCodeOf('7'), '07');
  assert.equal(PB.stateCodeOf('Karnataka (29)'), '29');
  assert.equal(PB.stateCodeOf('Narnia'), '');
  assert.equal(PB.docTypeOf('Tax invoice'), 'INV');
  assert.equal(PB.docTypeOf('Performa-Invoice'), 'PI');
  assert.equal(PB.docTypeOf('Pre-invoice'), 'PI');
  assert.equal(PB.docTypeOf('Purchase order'), 'PO');
  assert.equal(PB.statusOf('issued'), 'FINAL');
  assert.equal(PB.statusOf('Canceled'), 'CANCELLED');
  assert.equal(PB.statusOf(''), 'DRAFT');
  assert.equal(PB.yesNo('Y', false), true);
  assert.equal(PB.yesNo('', true), true);
  Object.values(PB.IMPORT).forEach((T) => T.examples.forEach((r) => assert.equal(r.length, T.columns.length)));
});

console.log(`${n} checks passed`);
