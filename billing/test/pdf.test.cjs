// Renders sample PDFs with the real layout code, for a visual check.
// Run: NODE_PATH=<dir with pdfmake@0.2.20> node billing/test/pdf.test.cjs <outDir>
const fs = require('fs');
const path = require('path');
global.PB = require('../src/shared.js');
const PBPDF = require('../src/pdf.js');
const PdfPrinter = require('pdfmake');
const vfs = require('pdfmake/build/vfs_fonts.js');
const v = vfs.pdfMake ? vfs.pdfMake.vfs : vfs;
const buf = (n) => Buffer.from(v[n], 'base64');
const printer = new PdfPrinter({ Roboto: { normal: buf('Roboto-Regular.ttf'), bold: buf('Roboto-Medium.ttf'), italics: buf('Roboto-Italic.ttf'), bolditalics: buf('Roboto-MediumItalic.ttf') } });

const out = process.argv[2] || '.';
const g = (s14) => s14 + PB.gstinCheckChar(s14);
const settings = {
  firm: { legalName: 'Proline Electrical Works', tradeName: 'Proline Electrical Works', address1: 'Sample address line 1', address2: '', city: 'New Delhi', stateCode: '07', pin: '110001', gstin: g('07ABCDE1234F1Z'), pan: 'ABCDE1234F', udyam: 'UDYAM-DL-00-0000000', phone: '+91 00000 00000', email: 'Sales@prolineelectricalworks.com', website: 'www.prolineelectricalworks.com' },
  bank: { name: 'Sample Bank', accountName: 'Proline Electrical Works', accountNo: '000000000000', ifsc: 'SAMP0000001', branch: 'New Delhi', upi: 'proline@upi' },
  sign: { name: 'Vineet Saini', designation: 'Proprietor' },
  pdf: { copies: 'Original + Duplicate' }
};
const items = [
  { name: 'AC EV charger 7.4 kW', description: 'Wall-mounted, Type 2 socket, OCPP 1.6J', type: 'Goods', hsn: '85044090', qty: 2, unit: 'Nos', rate: 48500, discountPct: 5, gstRate: 5 },
  { name: 'DB box with 40 A MCB, 30 mA Type A RCD and SPD', description: 'IP65 enclosure', type: 'Goods', hsn: '8537', qty: 2, unit: 'Nos', rate: 6200, discountPct: 0, gstRate: 18 },
  { name: 'Armoured copper cable 3C × 6 sq mm', type: 'Goods', hsn: '8544', qty: 45, unit: 'Mtr', rate: 310, discountPct: 0, gstRate: 18 },
  { name: 'Installation, testing and commissioning', description: 'Earth pit, cable laying, OCPP setup and handover report', type: 'Service', hsn: '995461', qty: 2, unit: 'Job', rate: 7500, discountPct: 0, gstRate: 18 },
];
const party = { id: 'p1', name: 'Sample Customer Pvt Ltd', legalName: 'Sample Customer Private Limited', gstin: g('07AAACS1234A1Z'), address: '12 Sample Road, Sector 5', city: 'New Delhi', pin: '110017', stateCode: '07', contact: 'Ms A. Sharma' };

// A made-up 'signature' (a blue box with a stroke), never anyone's real signature.
const TEST_SIGN = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAAYCAYAAACmwZ5SAAAAh0lEQVR42u3YsQ2AMAwEwA9iDuoMwHBUFFQMxwCpWSRpERIFViCx37/B5a3IMkCWAABx3jIDNh1rGNgaHu8vYBF5nWC6hh3sYAf3mSku+fUvbQ2nEvyEO9MeVINrw7oC/4VrAm6J+xzcG64aWANMDNaMEzesFSfatCxhfZcG28WD4bZF1zBdCvXGLh/4W73PAAAAAElFTkSuQmCC';
const samples = [
  { name: 'invoice-intra', doc: { type: 'INV', status: 'FINAL', number: 'PEW/26-27/0001', date: '2026-10-24', party, pos: { code: '07' }, refs: { dueDate: '2026-11-08', poNumber: 'SC/PO/778', poDate: '2026-10-20' }, items, notes: 'Thank you for your business.', terms: '1. Payment is due by the due date shown.\n2. Warranty as per the manufacturer.\n3. Subject to Delhi jurisdiction.', shipTo: { same: false, name: 'Sample Customer – Okhla site', address: 'Plot 4, Okhla Industrial Area Phase II', city: 'New Delhi', pin: '110020', stateCode: '07' } } },
  { name: 'proforma-inter-annexure', doc: { type: 'PI', status: 'FINAL', number: 'PEW-PI/26-27/0003', date: '2026-10-24', party: { ...party, gstin: g('27AAACS1234A1Z'), stateCode: '27', city: 'Pune', pin: '411001', address: 'Sample Tech Park, Hinjewadi' }, pos: { code: '27' }, refs: { validTill: '2026-11-23', paymentTerms: '50% advance, balance before dispatch', deliveryPeriod: '3–4 weeks from advance', vehicleNo: 'DL1AB1234' }, items: items.slice(0, 2), terms: '1. This is a proforma invoice and not a tax invoice.\n2. Prices valid until the date shown.', shipTo: { same: true },
    annexure: { enabled: true, title: 'Annexure A – Scope of supply and work', intro: 'The supply and work below are included in this proforma invoice.', rows: [
      { description: 'AC charger 7.4 kW', spec: 'Type 2 socket, RFID, OCPP 1.6J, IP54', qty: '2', unit: 'Nos', remarks: 'Brand as agreed' },
      { description: 'Earthing', spec: 'Dedicated pipe earth pit, tested', qty: '2', unit: 'Nos', remarks: '' },
      { description: 'Cabling', spec: '3C × 6 sq mm armoured copper, up to 45 m', qty: '45', unit: 'Mtr', remarks: 'Extra length at actuals' } ],
      notes: 'Exclusions: civil work beyond cable trenching, electricity connection or load increase from the DISCOM.' } } },
  { name: 'purchase-order', doc: { type: 'PO', status: 'FINAL', number: 'PEW-PO/26-27/0002', date: '2026-10-24', party: { id: 'v1', name: 'Sample Charger Maker', gstin: g('06AABCS9999K1Z'), address: 'Sample Industrial Area', city: 'Faridabad', pin: '121003', stateCode: '06' }, pos: { code: '07' }, refs: { deliveryDate: '2026-11-05', paymentTerms: '30 days after delivery', deliveryTerms: 'Delivered to our address, freight included', quoteRef: 'SCM/Q/1021' }, items: items.slice(0, 1), terms: '1. Please quote this PO number on your invoice.\n2. Subject to Delhi jurisdiction.', shipTo: { same: true } } },
  { name: 'challan', doc: { type: 'DC', status: 'FINAL', number: 'PEW-DC/2627/01', date: '2026-11-24', party: { ...party, gstin: g('29AAACS1234A1Z'), stateCode: '29', city: 'Bengaluru', pin: '560001', address: 'Sample Tech Park, Sample Road' }, pos: { code: '29' }, declaredValue: 49000,
    refs: { purpose: 'Supply', vehicleNo: 'DL1AB1234', poNumber: 'SC/PO/912' }, items: [
      { name: 'Cable tray with cover', type: 'Goods', hsn: '73089090', qty: 15, unit: 'Mtr' },
      { name: 'Fastener 8 mm', type: 'Goods', hsn: '73181500', qty: 34, unit: 'Nos' },
      { name: 'Cable tie 300 mm', type: 'Goods', hsn: '39269099', qty: 1, unit: 'Pkt' },
      { name: '4 core 10 sq mm copper flexible cable', description: 'For the charger feeder', type: 'Goods', hsn: '85444999', qty: 55, unit: 'Mtr' }],
    terms: '1. Please check the goods when they arrive, then sign and stamp this challan.\n2. This challan is not a tax invoice.\n3. Subject to Delhi jurisdiction.',
    shipTo: { same: false, name: 'Sample Site Ltd', address: 'Plot 5, Sample Industrial Area', city: 'Noida', pin: '201301', stateCode: '09' } } },
  { name: 'challan-priced-draft', doc: { type: 'DC', status: 'DRAFT', number: '', date: '2026-11-24', party, pos: {}, refs: {}, items: items.slice(1, 3).map((i) => ({ ...i, discountPct: 0 })), terms: '', shipTo: { same: true } }, watermark: 'DRAFT' },
  { name: 'invoice-signed-bw', bw: true, images: { logo: null, signature: TEST_SIGN }, doc: { type: 'INV', status: 'FINAL', number: 'PEW/26-27/0004', date: '2026-11-24', party, pos: { code: '07' }, refs: { vehicleNo: 'DL1AB1234' }, items: items.slice(0, 3), terms: 'Subject to Delhi jurisdiction.', shipTo: { same: true } } },
  { name: 'invoice-draft', doc: { type: 'INV', status: 'DRAFT', number: '', date: '2026-10-24', party, pos: { code: '07' }, refs: {}, items: items.slice(3), terms: 'Subject to Delhi jurisdiction.', shipTo: { same: true } }, watermark: 'DRAFT' },
];

let done = 0;
for (const s of samples) {
  const doc = { ...s.doc, firm: settings.firm, bank: settings.bank, sign: settings.sign };
  const supplier = doc.type === 'PO' ? doc.party.stateCode : settings.firm.stateCode;
  const calc = PB.compute(doc, supplier);
  const dd = PBPDF.build(doc, calc, settings, s.images || { logo: null, signature: null }, { watermark: s.watermark, bw: !!s.bw });
  const pdf = printer.createPdfKitDocument(dd);
  const file = path.join(out, s.name + '.pdf');
  const ws = fs.createWriteStream(file);
  pdf.pipe(ws);
  pdf.end();
  ws.on('finish', () => { console.log('wrote', file, 'payable', PB.money(calc.payable)); if (++done === samples.length) console.log('all done'); });
}
