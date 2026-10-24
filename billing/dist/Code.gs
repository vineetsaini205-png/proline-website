// Proline Billing 2026-10-24 11:54 — built from billing/src (shared.js + server.js). Edit the source, not this file.

/*
 * Proline Billing — shared rules, used by the server (Code.gs) and the browser (Index.html).
 * Pure functions only: GST maths, Indian money format, amount in words, GSTIN checks,
 * financial year and document numbers. Tested by billing/test/shared.test.mjs.
 */
var PB = (function () {
  'use strict';

  // GST state codes (first two digits of a GSTIN).
  var STATES = [
    ['01', 'Jammu and Kashmir'], ['02', 'Himachal Pradesh'], ['03', 'Punjab'], ['04', 'Chandigarh'],
    ['05', 'Uttarakhand'], ['06', 'Haryana'], ['07', 'Delhi'], ['08', 'Rajasthan'], ['09', 'Uttar Pradesh'],
    ['10', 'Bihar'], ['11', 'Sikkim'], ['12', 'Arunachal Pradesh'], ['13', 'Nagaland'], ['14', 'Manipur'],
    ['15', 'Mizoram'], ['16', 'Tripura'], ['17', 'Meghalaya'], ['18', 'Assam'], ['19', 'West Bengal'],
    ['20', 'Jharkhand'], ['21', 'Odisha'], ['22', 'Chhattisgarh'], ['23', 'Madhya Pradesh'], ['24', 'Gujarat'],
    ['25', 'Daman and Diu (old code)'], ['26', 'Dadra and Nagar Haveli and Daman and Diu'], ['27', 'Maharashtra'],
    ['29', 'Karnataka'], ['30', 'Goa'], ['31', 'Lakshadweep'], ['32', 'Kerala'], ['33', 'Tamil Nadu'],
    ['34', 'Puducherry'], ['35', 'Andaman and Nicobar Islands'], ['36', 'Telangana'], ['37', 'Andhra Pradesh'],
    ['38', 'Ladakh'], ['97', 'Other Territory'], ['96', 'Other Country (export)']
  ];
  // Union territories without a legislature: intra-UT supplies carry UTGST instead of SGST.
  var UT_CODES = ['04', '25', '26', '31', '35', '38'];
  var GST_RATES = [0, 0.25, 3, 5, 12, 18, 28, 40];
  var UNITS = ['Nos', 'Set', 'Pcs', 'Mtr', 'Kg', 'Ltr', 'Sq m', 'Job', 'Lot', 'Visit', 'Month', 'Year', 'Hrs', 'Days', 'kWh', 'kWp'];
  var TYPES = {
    INV: { code: 'INV', title: 'Tax Invoice', short: 'Invoice', folder: 'Tax Invoices', defaultPrefix: 'PEW' },
    PI: { code: 'PI', title: 'Proforma Invoice', short: 'Proforma', folder: 'Proforma Invoices', defaultPrefix: 'PEW-PI' },
    PO: { code: 'PO', title: 'Purchase Order', short: 'PO', folder: 'Purchase Orders', defaultPrefix: 'PEW-PO' }
  };

  function stateName(code) {
    for (var i = 0; i < STATES.length; i++) if (STATES[i][0] === code) return STATES[i][1];
    return '';
  }

  // ---- Money ---------------------------------------------------------------
  /** Round to paise, half away from zero, without floating-point surprises (1.005 → 1.01). */
  function r2(x) {
    x = Number(x) || 0;
    var s = x < 0 ? -1 : 1;
    return s * Math.round(Math.abs(x) * 100 + 1e-7) / 100;
  }
  function num(x) { var n = parseFloat(String(x == null ? '' : x).replace(/,/g, '')); return isFinite(n) ? n : 0; }

  /** 1234567.5 → "12,34,567.50" (Indian grouping). */
  function money(x, decimals) {
    if (decimals == null) decimals = 2;
    var v = r2(x), neg = v < 0;
    var parts = Math.abs(v).toFixed(decimals).split('.');
    var int = parts[0], last3 = int.slice(-3), rest = int.slice(0, -3);
    if (rest) last3 = ',' + last3;
    var grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + last3;
    return (neg ? '-' : '') + grouped + (decimals ? '.' + parts[1] : '');
  }

  var ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
    'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function upto99(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''); }
  function upto999(n) {
    var h = Math.floor(n / 100), r = n % 100;
    return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? upto99(r) : '');
  }
  /** Whole number in the Indian system: crore, lakh, thousand. */
  function words(n) {
    n = Math.floor(Math.abs(n));
    if (n === 0) return 'Zero';
    var out = [];
    var crore = Math.floor(n / 10000000); n %= 10000000;
    var lakh = Math.floor(n / 100000); n %= 100000;
    var thousand = Math.floor(n / 1000); n %= 1000;
    if (crore) out.push(words(crore) + ' Crore');
    if (lakh) out.push(upto99(lakh) + ' Lakh');
    if (thousand) out.push(upto99(thousand) + ' Thousand');
    if (n) out.push(upto999(n));
    return out.join(' ');
  }
  /** 123456.5 → "Indian Rupees One Lakh Twenty-Three Thousand Four Hundred Fifty-Six and Fifty Paise Only" */
  function amountInWords(x) {
    var v = r2(Math.abs(x));
    var rupees = Math.floor(v + 1e-9), paise = Math.round((v - rupees) * 100);
    return 'Indian Rupees ' + words(rupees) + (paise ? ' and ' + upto99(paise) + ' Paise' : '') + ' Only';
  }

  // ---- GSTIN, PAN, HSN -----------------------------------------------------
  var CP = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function gstinCheckChar(first14) {
    var factor = 2, sum = 0;
    for (var i = first14.length - 1; i >= 0; i--) {
      var addend = factor * CP.indexOf(first14.charAt(i));
      factor = factor === 2 ? 1 : 2;
      sum += Math.floor(addend / 36) + (addend % 36);
    }
    return CP.charAt((36 - (sum % 36)) % 36);
  }
  /** Returns { ok, error, stateCode, stateName, pan } for a GSTIN. */
  function checkGstin(g) {
    g = String(g || '').trim().toUpperCase();
    if (!g) return { ok: false, error: 'GSTIN is empty' };
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][Z][0-9A-Z]$/.test(g)) return { ok: false, error: 'GSTIN must be 15 characters like 07ABCDE1234F1Z5' };
    if (!stateName(g.slice(0, 2))) return { ok: false, error: 'The first two digits are not a GST state code' };
    if (gstinCheckChar(g.slice(0, 14)) !== g.charAt(14)) return { ok: false, error: 'The last character (check digit) does not match; please re-check the GSTIN' };
    return { ok: true, gstin: g, stateCode: g.slice(0, 2), stateName: stateName(g.slice(0, 2)), pan: g.slice(2, 12) };
  }
  function checkPan(p) { return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(p || '').trim().toUpperCase()); }
  /** HSN for goods: 4, 6 or 8 digits. SAC for services: 6 digits starting 99. */
  function checkHsn(code, type) {
    code = String(code || '').trim();
    if (!code) return 'HSN/SAC code is missing';
    if (type === 'Service') return /^99\d{4}$/.test(code) ? '' : 'A service needs a 6-digit SAC starting with 99';
    return /^\d{4}(\d{2}(\d{2})?)?$/.test(code) ? '' : 'An HSN code for goods has 4, 6 or 8 digits';
  }

  // ---- Financial year and numbers ------------------------------------------
  /** "2026-10-24" → { start: 2026, short: "26-27", long: "2026-27" } (April to March). */
  function fy(dateStr) {
    var m = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    var y = m ? +m[1] : new Date().getFullYear(), mo = m ? +m[2] : new Date().getMonth() + 1;
    var start = mo >= 4 ? y : y - 1;
    var a = String(start).slice(2), b = String(start + 1).slice(2);
    return { start: start, short: a + '-' + b, long: start + '-' + b };
  }
  /** Document number from the series settings, e.g. PEW/26-27/0007. */
  function formatNumber(prefix, fyShort, n, pad) {
    var s = String(n);
    while (s.length < (pad || 4)) s = '0' + s;
    return (prefix ? prefix + '/' : '') + fyShort + '/' + s;
  }
  /** GST rule 46(b): up to 16 characters; letters, digits, "/" and "-" only. */
  function checkInvoiceNumber(no) {
    if (no.length > 16) return 'A tax invoice number can have at most 16 characters (' + no + ' has ' + no.length + '). Shorten the prefix in Settings.';
    if (!/^[A-Za-z0-9\/-]+$/.test(no)) return 'A tax invoice number may only use letters, digits, "/" and "-".';
    return '';
  }

  // ---- GST maths -----------------------------------------------------------
  /**
   * Works out every line and the totals.
   * supplierState: GST state code of the supplier (Proline for INV/PI, the vendor for a PO).
   * doc.pos.code: place of supply. Same state → CGST + SGST (or UTGST); different → IGST.
   */
  function compute(doc, supplierState) {
    var pos = doc.pos && doc.pos.code ? String(doc.pos.code) : '';
    var intra = !!pos && !!supplierState && pos === String(supplierState);
    var sgstLabel = intra && UT_CODES.indexOf(pos) >= 0 ? 'UTGST' : 'SGST';
    var incl = !!doc.pricesIncludeGst;
    var lines = [], hsn = {}, order = [];
    var t = { gross: 0, discount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    (doc.items || []).forEach(function (it, i) {
      var qty = num(it.qty), rate = num(it.rate), disc = Math.min(Math.max(num(it.discountPct), 0), 100), gr = num(it.gstRate);
      var gross = r2(qty * rate);
      var afterDisc = r2(gross * (1 - disc / 100));
      var taxable = incl ? r2(afterDisc / (1 + gr / 100)) : afterDisc;
      var cgst = 0, sgst = 0, igst = 0;
      if (intra) { cgst = r2(taxable * gr / 200); sgst = cgst; } else { igst = r2(taxable * gr / 100); }
      var line = {
        n: i + 1, name: it.name || '', description: it.description || '', type: it.type || 'Goods', hsn: String(it.hsn || ''),
        qty: qty, unit: it.unit || '', rate: rate, discountPct: disc, gstRate: gr,
        gross: gross, discount: r2(gross - afterDisc), taxable: taxable, cgst: cgst, sgst: sgst, igst: igst,
        total: r2(taxable + cgst + sgst + igst)
      };
      lines.push(line);
      t.gross += gross; t.discount += line.discount; t.taxable += taxable; t.cgst += cgst; t.sgst += sgst; t.igst += igst;
      var key = line.hsn + '|' + gr;
      if (!hsn[key]) { hsn[key] = { hsn: line.hsn, rate: gr, taxable: 0, cgst: 0, sgst: 0, igst: 0 }; order.push(key); }
      hsn[key].taxable += taxable; hsn[key].cgst += cgst; hsn[key].sgst += sgst; hsn[key].igst += igst;
    });
    ['gross', 'discount', 'taxable', 'cgst', 'sgst', 'igst'].forEach(function (k) { t[k] = r2(t[k]); });
    var tax = r2(t.cgst + t.sgst + t.igst);
    var total = r2(t.taxable + tax);
    var payable = doc.roundOff === false ? total : Math.round(total);
    var hsnSummary = order.map(function (k) {
      var h = hsn[k];
      return { hsn: h.hsn, rate: h.rate, taxable: r2(h.taxable), cgst: r2(h.cgst), sgst: r2(h.sgst), igst: r2(h.igst), tax: r2(h.cgst + h.sgst + h.igst) };
    });
    return {
      intra: intra, sgstLabel: sgstLabel, lines: lines, hsnSummary: hsnSummary,
      gross: t.gross, discount: t.discount, taxable: t.taxable, cgst: t.cgst, sgst: t.sgst, igst: t.igst, tax: tax,
      total: total, roundOff: r2(payable - total), payable: r2(payable), words: amountInWords(payable)
    };
  }

  /** Problems that stop a document from being finalised (empty list = fine). */
  function validate(doc, firm) {
    var p = [];
    var isPO = doc.type === 'PO';
    if (!doc.date) p.push('Pick the document date.');
    if (!doc.party || !doc.party.name) p.push(isPO ? 'Choose the vendor.' : 'Choose the customer.');
    if (!doc.pos || !doc.pos.code) p.push('Choose the place of supply.');
    if (!firm || !firm.legalName) p.push('Add your firm name in Settings.');
    if (!firm || !firm.gstin) p.push('Add your GSTIN in Settings.');
    else if (!checkGstin(firm.gstin).ok) p.push('Your GSTIN in Settings is not valid.');
    if (!firm || !firm.address1) p.push('Add your firm address in Settings (it must be on GST invoices).');
    if (doc.type === 'INV' && doc.party && doc.party.gstin && !checkGstin(doc.party.gstin).ok) p.push('The customer GSTIN is not valid.');
    if (isPO && doc.party && doc.party.gstin && !checkGstin(doc.party.gstin).ok) p.push('The vendor GSTIN is not valid.');
    if (!doc.items || !doc.items.length) p.push('Add at least one item.');
    (doc.items || []).forEach(function (it, i) {
      var n = 'Line ' + (i + 1) + ': ';
      if (!String(it.name || '').trim()) p.push(n + 'add a description.');
      if (!(num(it.qty) > 0)) p.push(n + 'quantity must be more than 0.');
      if (num(it.rate) < 0) p.push(n + 'rate cannot be negative.');
      if (GST_RATES.indexOf(num(it.gstRate)) < 0) p.push(n + 'choose a GST rate.');
      if (doc.type === 'INV') { var h = checkHsn(it.hsn, it.type); if (h) p.push(n + h + '.'); }
    });
    return p;
  }

  function today() {
    var d = new Date(), z = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  /** "2026-10-24" → "24 Oct 2026" */
  function prettyDate(s) {
    var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : '';
  }

  return {
    STATES: STATES, UT_CODES: UT_CODES, GST_RATES: GST_RATES, UNITS: UNITS, TYPES: TYPES,
    stateName: stateName, r2: r2, num: num, money: money, words: words, amountInWords: amountInWords,
    gstinCheckChar: gstinCheckChar, checkGstin: checkGstin, checkPan: checkPan, checkHsn: checkHsn,
    fy: fy, formatNumber: formatNumber, checkInvoiceNumber: checkInvoiceNumber,
    compute: compute, validate: validate, today: today, prettyDate: prettyDate
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = PB;


/*
 * Proline Billing — server side (Google Apps Script, bound to the "Proline Billing" Google Sheet).
 *
 * - Data: tabs in this Sheet (Settings, Series, Parties, Registrations, Products, Documents, Register, Log).
 * - PDFs: made in the browser (pdfmake), saved here to Google Drive: Proline Billing / 2026-27 / Tax Invoices …
 * - Email: each finalised PDF is emailed to the address in Settings (Sales@prolineelectricalworks.com).
 * - Numbers: given only when a document is finalised, one after another per type and financial year,
 *   never reused. Drafts have no number, so abandoned drafts never leave gaps.
 *
 * Deploy: Deploy → New deployment → Web app → Execute as: Me, Who has access: Only myself.
 * Source of truth: billing/src in the website repository (built into Code.gs and Index.html).
 */

var APP_NAME = 'Proline Billing';
var TZ = 'Asia/Kolkata';
var JSON_CHUNK = 45000;

var SHEETS = {
  Settings: ['key', 'value'],
  Series: ['type', 'fy', 'last', 'updated'],
  Parties: ['id', 'role', 'name', 'contact', 'phone', 'email', 'pan', 'notes', 'created', 'updated'],
  Registrations: ['id', 'partyId', 'label', 'gstin', 'legalName', 'address', 'city', 'stateCode', 'pin', 'isDefault'],
  Products: ['id', 'name', 'description', 'type', 'hsn', 'unit', 'rate', 'gstRate', 'category', 'active', 'updated'],
  Documents: ['id', 'type', 'status', 'number', 'fy', 'date', 'partyId', 'partyName', 'gstin', 'posCode', 'taxable', 'tax', 'payable',
    'pdfUrl', 'pdfFileId', 'emailedAt', 'createdAt', 'updatedAt', 'finalisedAt', 'cancelledAt', 'cancelReason', 'sourceId',
    'json1', 'json2', 'json3', 'json4'],
  Register: ['invoiceNumber', 'date', 'party', 'gstin', 'posCode', 'placeOfSupply', 'rate', 'taxable', 'igst', 'cgst', 'sgst', 'invoiceValue', 'status', 'docId'],
  Log: ['time', 'user', 'action', 'docId', 'details']
};
// Columns stored as numbers (everything else is stored as plain text, so "07" stays "07").
var NUMERIC = {
  Series: { last: 1 },
  Products: { rate: 1, gstRate: 1 },
  Documents: { taxable: 1, tax: 1, payable: 1 },
  Register: { rate: 1, taxable: 1, igst: 1, cgst: 1, sgst: 1, invoiceValue: 1 }
};

var DEFAULT_SETTINGS = {
  'firm.legalName': 'Proline Electrical Works',
  'firm.tradeName': 'Proline Electrical Works',
  'firm.address1': '', 'firm.address2': '', 'firm.city': 'Delhi', 'firm.stateCode': '07', 'firm.pin': '',
  'firm.gstin': '', 'firm.pan': '', 'firm.phone': '+91 73038 87364', 'firm.email': 'Sales@prolineelectricalworks.com',
  'firm.website': 'www.prolineelectricalworks.com', 'firm.udyam': '',
  'bank.name': '', 'bank.accountName': 'Proline Electrical Works', 'bank.accountNo': '', 'bank.ifsc': '', 'bank.branch': '', 'bank.upi': '',
  'sign.name': 'Vineet Saini', 'sign.designation': 'Proprietor',
  'brand.logoFileId': '', 'brand.signatureFileId': '',
  'series.INV.prefix': 'PEW', 'series.PI.prefix': 'PEW-PI', 'series.PO.prefix': 'PEW-PO', 'series.pad': '4',
  'pdf.copies': 'Original', 'pdf.showUpiQr': 'yes',
  'terms.INV': '1. Payment is due by the due date shown. Please quote the invoice number when you pay.\n2. Warranty on chargers, batteries and other equipment is as per the manufacturer\'s terms.\n3. Goods once supplied are not taken back except under the manufacturer\'s warranty.\n4. Subject to Delhi jurisdiction.',
  'terms.PI': '1. This is a proforma invoice and not a tax invoice. A tax invoice will be issued on supply.\n2. Prices are valid until the date shown.\n3. Work starts after the advance payment is received.\n4. Subject to Delhi jurisdiction.',
  'terms.PO': '1. Please quote this PO number on your invoice, delivery challan and all letters.\n2. Supply must match the specifications and quantities in this order; goods that do not may be returned at your cost.\n3. Send your tax invoice with GSTIN and HSN codes, and the e-way bill where required.\n4. Payment as per the terms in this order, after the goods are received and checked.\n5. Subject to Delhi jurisdiction.',
  'notes.INV': 'Thank you for your business.', 'notes.PI': '', 'notes.PO': '',
  'email.to': 'Sales@prolineelectricalworks.com', 'email.cc': '', 'email.onFinalise': 'yes',
  'drive.rootFolderId': ''
};

// Starter items. HSN/SAC codes and GST rates must be checked with your CA before the first invoice.
var STARTER_PRODUCTS = [
  ['AC EV charger (7.4 kW)', 'Wall-mounted AC charger, Type 2', 'Goods', '85044090', 'Nos', 5, 'Chargers'],
  ['DC fast charger', 'CCS2 DC charger, power as specified', 'Goods', '85044090', 'Nos', 5, 'Chargers'],
  ['Lithium-ion battery pack', 'Capacity and voltage as specified', 'Goods', '85076000', 'Nos', 18, 'Batteries'],
  ['Lead-acid battery', 'Inverter / UPS battery', 'Goods', '85072000', 'Nos', 18, 'Batteries'],
  ['Solar PV module', 'Wattage as specified', 'Goods', '85414300', 'Nos', 5, 'Solar'],
  ['DB box with MCB and RCD', 'Distribution box for EV charger', 'Goods', '8537', 'Nos', 18, 'Electrical'],
  ['Armoured copper cable', 'Size as specified', 'Goods', '8544', 'Mtr', 18, 'Electrical'],
  ['Installation and commissioning of EV charger', 'Electrical installation, testing and handover', 'Service', '995461', 'Job', 18, 'Services'],
  ['Site survey', 'Site and power survey with report', 'Service', '998346', 'Visit', 18, 'Services'],
  ['Annual maintenance contract (AMC)', 'Preventive maintenance visits as agreed', 'Service', '998719', 'Year', 18, 'Services']
];

// ---------------------------------------------------------------- web app
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Run once from the Apps Script editor: creates the tabs, default settings and the Drive folder. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function (name) { sheet_(name); });
  var first = ss.getSheets()[0];
  if (first && !SHEETS[first.getName()] && first.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(first);
  var s = settingsRaw_();
  var add = {};
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) { if (!(k in s)) add[k] = DEFAULT_SETTINGS[k]; });
  if (Object.keys(add).length) saveSettingsRaw_(add);
  rootFolder_();
  MailApp.getRemainingDailyQuota();
  log_('setup', '', 'Sheets, settings and Drive folder ready');
  return 'Ready. Now deploy as a web app (Execute as: Me, Who has access: Only myself).';
}

// ---------------------------------------------------------------- API used by Index.html
function apiBootstrap() {
  ensureSetup_();
  return {
    settings: settings_(),
    parties: parties_(),
    products: rows_('Products').map(productOut_),
    documents: rows_('Documents').map(docSummary_).reverse(),
    series: seriesStatus_(),
    user: userEmail_(),
    sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    driveUrl: rootFolder_().getUrl()
  };
}

function apiSaveSettings(obj) {
  var clean = {};
  Object.keys(obj || {}).forEach(function (k) {
    if (!(k in DEFAULT_SETTINGS)) return;
    if (k === 'brand.logoFileId' || k === 'brand.signatureFileId' || k === 'drive.rootFolderId') return;
    clean[k] = String(obj[k] == null ? '' : obj[k]).trim();
  });
  if (clean['firm.gstin']) {
    clean['firm.gstin'] = clean['firm.gstin'].toUpperCase();
    var g = PB.checkGstin(clean['firm.gstin']);
    if (!g.ok) throw new Error('Your GSTIN: ' + g.error);
    clean['firm.stateCode'] = g.stateCode;
    if (!clean['firm.pan']) clean['firm.pan'] = g.pan;
  }
  ['INV', 'PI', 'PO'].forEach(function (t) {
    var p = clean['series.' + t + '.prefix'];
    if (p != null && !/^[A-Za-z0-9\-]{0,10}$/.test(p)) throw new Error('A number prefix may use letters, digits and "-", up to 10 characters.');
  });
  if (clean['series.INV.prefix'] != null || clean['series.pad'] != null) {
    var cur = settings_();
    var pre = clean['series.INV.prefix'] != null ? clean['series.INV.prefix'] : cur.series.INV.prefix;
    var pad = +(clean['series.pad'] || cur.series.pad || 4);
    var sample = PB.formatNumber(pre, '26-27', Math.pow(10, pad) - 1, pad);
    var e = PB.checkInvoiceNumber(sample);
    if (e) throw new Error(e);
  }
  saveSettingsRaw_(clean);
  log_('settings', '', Object.keys(clean).join(', '));
  return { settings: settings_(), series: seriesStatus_() };
}

/** Saves a logo or signature image (data URL) to Drive and remembers it. */
function apiUploadImage(kind, dataUrl) {
  if (kind !== 'logo' && kind !== 'signature') throw new Error('Unknown image');
  var m = String(dataUrl || '').match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
  if (!m) throw new Error('Please choose a PNG or JPG image.');
  var bytes = Utilities.base64Decode(m[3]);
  if (bytes.length > 1500000) throw new Error('Please choose an image under 1.5 MB.');
  var folder = subFolder_(rootFolder_(), 'Brand');
  var file = folder.createFile(Utilities.newBlob(bytes, m[1], kind + (m[2] === 'png' ? '.png' : '.jpg')));
  var key = kind === 'logo' ? 'brand.logoFileId' : 'brand.signatureFileId';
  var old = settingsRaw_()[key];
  if (old) { try { DriveApp.getFileById(old).setTrashed(true); } catch (e) { /* already gone */ } }
  var o = {}; o[key] = file.getId(); saveSettingsRaw_(o);
  log_('image', '', kind + ' uploaded');
  return apiGetImages();
}

function apiRemoveImage(kind) {
  var key = kind === 'logo' ? 'brand.logoFileId' : 'brand.signatureFileId';
  var o = {}; o[key] = ''; saveSettingsRaw_(o);
  return apiGetImages();
}

/** Logo and signature as data URLs for the PDFs (null when not set). */
function apiGetImages() {
  var s = settingsRaw_();
  return { logo: imageDataUrl_(s['brand.logoFileId']), signature: imageDataUrl_(s['brand.signatureFileId']) };
}

function apiSaveParty(p) {
  p = p || {};
  var name = String(p.name || '').trim();
  if (!name) throw new Error('Add the name.');
  var role = ['Customer', 'Vendor', 'Both'].indexOf(p.role) >= 0 ? p.role : 'Customer';
  var regs = (p.registrations || []).filter(function (r) { return r && (r.gstin || r.address || r.stateCode); });
  if (!regs.length) throw new Error('Add at least one address with its state (and GSTIN if registered).');
  var seen = {};
  regs.forEach(function (r, i) {
    r.gstin = String(r.gstin || '').trim().toUpperCase();
    if (r.gstin) {
      var g = PB.checkGstin(r.gstin);
      if (!g.ok) throw new Error('GSTIN ' + r.gstin + ': ' + g.error);
      if (seen[r.gstin]) throw new Error('GSTIN ' + r.gstin + ' is listed twice.');
      seen[r.gstin] = 1;
      r.stateCode = g.stateCode;
    }
    if (!PB.stateName(String(r.stateCode || ''))) throw new Error('Address ' + (i + 1) + ': choose the state.');
  });
  if (!regs.some(function (r) { return r.isDefault; })) regs[0].isDefault = true;
  var now = stamp_();
  var id = p.id || newId_('p');
  var existing = findRow_('Parties', id);
  var row = { id: id, role: role, name: name, contact: p.contact || '', phone: p.phone || '', email: p.email || '',
    pan: String(p.pan || (regs[0].gstin ? regs[0].gstin.slice(2, 12) : '')).toUpperCase(), notes: p.notes || '',
    created: existing ? existing.created : now, updated: now };
  writeRow_('Parties', existing ? existing._row : 0, row);
  // Replace this party's registrations.
  deleteWhere_('Registrations', function (r) { return r.partyId === id; });
  regs.forEach(function (r) {
    writeRow_('Registrations', 0, { id: r.id || newId_('g'), partyId: id, label: r.label || '', gstin: r.gstin, legalName: r.legalName || '',
      address: r.address || '', city: r.city || '', stateCode: String(r.stateCode), pin: r.pin || '', isDefault: r.isDefault ? 'yes' : '' });
  });
  log_('party', '', (existing ? 'updated ' : 'added ') + name);
  return partyOut_(id);
}

function apiDeleteParty(id) {
  if (rows_('Documents').some(function (d) { return d.partyId === id; })) throw new Error('This customer or vendor is used on documents, so it cannot be deleted.');
  deleteWhere_('Registrations', function (r) { return r.partyId === id; });
  deleteWhere_('Parties', function (r) { return r.id === id; });
  log_('party', '', 'deleted ' + id);
  return true;
}

function apiSaveProduct(p) {
  p = p || {};
  var name = String(p.name || '').trim();
  if (!name) throw new Error('Add the item name.');
  var type = p.type === 'Service' ? 'Service' : 'Goods';
  var hsn = String(p.hsn || '').trim();
  if (hsn) { var e = PB.checkHsn(hsn, type); if (e) throw new Error(e + '.'); }
  var gr = PB.num(p.gstRate);
  if (PB.GST_RATES.indexOf(gr) < 0) throw new Error('Choose a GST rate.');
  var id = p.id || newId_('i');
  var existing = findRow_('Products', id);
  var row = { id: id, name: name, description: p.description || '', type: type, hsn: hsn, unit: p.unit || 'Nos', rate: PB.num(p.rate),
    gstRate: gr, category: p.category || '', active: p.active === false ? 'no' : 'yes', updated: stamp_() };
  writeRow_('Products', existing ? existing._row : 0, row);
  return productOut_(row);
}

function apiDeleteProduct(id) {
  deleteWhere_('Products', function (r) { return r.id === id; });
  return true;
}

function apiAddStarterProducts() {
  var have = {};
  rows_('Products').forEach(function (r) { have[r.name.toLowerCase()] = 1; });
  STARTER_PRODUCTS.forEach(function (s) {
    if (have[s[0].toLowerCase()]) return;
    writeRow_('Products', 0, { id: newId_('i'), name: s[0], description: s[1], type: s[2], hsn: s[3], unit: s[4], rate: 0, gstRate: s[5], category: s[6], active: 'yes', updated: stamp_() });
  });
  return rows_('Products').map(productOut_);
}

function apiGetDocument(id) {
  var r = findRow_('Documents', id);
  if (!r) throw new Error('Document not found.');
  return docFromRow_(r);
}

function apiSaveDraft(doc) {
  doc = normaliseDoc_(doc);
  var existing = doc.id ? findRow_('Documents', doc.id) : null;
  if (existing && existing.status !== 'DRAFT') throw new Error('This document is final and cannot be changed. Duplicate it to make a new one.');
  doc.id = doc.id || newId_('d');
  doc.status = 'DRAFT';
  doc.number = '';
  doc.meta = doc.meta || {};
  doc.meta.createdAt = existing ? existing.createdAt : stamp_();
  doc.meta.updatedAt = stamp_();
  doc.calc = calcFor_(doc);
  writeDoc_(existing ? existing._row : 0, doc);
  return { doc: doc, summary: docSummary_(findRow_('Documents', doc.id)) };
}

function apiDeleteDraft(id) {
  var r = findRow_('Documents', id);
  if (!r) return true;
  if (r.status !== 'DRAFT') throw new Error('Only drafts can be deleted. A final document can be cancelled instead.');
  sheet_('Documents').deleteRow(r._row);
  log_('delete draft', id, '');
  return true;
}

/**
 * Finalises a document: checks it, gives it the next number in its series and locks it.
 * The browser then makes the PDF and calls apiStorePdf.
 */
function apiFinalise(doc) {
  doc = normaliseDoc_(doc);
  var s = settings_();
  var problems = PB.validate(doc, s.firm);
  if (problems.length) throw new Error('Please fix these first:\n• ' + problems.join('\n• '));
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var existing = doc.id ? findRow_('Documents', doc.id) : null;
    if (existing && existing.status !== 'DRAFT') throw new Error('This document is already final (' + existing.number + ').');
    var fy = PB.fy(doc.date);
    var series = seriesRow_(doc.type, fy.short);
    var next = (+series.last || 0) + 1;
    var number = PB.formatNumber(s.series[doc.type].prefix, fy.short, next, +s.series.pad || 4);
    if (doc.type === 'INV') { var e = PB.checkInvoiceNumber(number); if (e) throw new Error(e); }
    if (rows_('Documents').some(function (d) { return d.type === doc.type && d.number === number; })) {
      throw new Error('Number ' + number + ' is already used. Check the series in Settings.');
    }
    doc.id = doc.id || newId_('d');
    doc.status = 'FINAL';
    doc.number = number;
    doc.fy = fy.long;
    doc.meta = doc.meta || {};
    doc.meta.createdAt = existing ? existing.createdAt : stamp_();
    doc.meta.updatedAt = stamp_();
    doc.meta.finalisedAt = stamp_();
    doc.firm = s.firm;              // snapshot: later Settings changes never alter a final document
    doc.bank = s.bank;
    doc.sign = s.sign;
    doc.calc = calcFor_(doc);
    writeSeries_(series, next);
    writeDoc_(existing ? existing._row : 0, doc);
    if (doc.type === 'INV') writeRegister_(doc);
    log_('finalise', doc.id, number + ' ' + doc.party.name + ' ₹' + PB.money(doc.calc.payable));
  } finally {
    lock.releaseLock();
  }
  return { doc: doc, summary: docSummary_(findRow_('Documents', doc.id)), series: seriesStatus_() };
}

/** Saves the PDF made in the browser to Drive and, if asked, emails it. */
function apiStorePdf(id, base64, opts) {
  opts = opts || {};
  var r = findRow_('Documents', id);
  if (!r) throw new Error('Document not found.');
  if (r.status === 'DRAFT') throw new Error('Finalise the document before saving its PDF.');
  var doc = docFromRow_(r);
  var bytes = Utilities.base64Decode(String(base64).replace(/^data:application\/pdf;base64,/, ''));
  var name = fileName_(doc) + (r.status === 'CANCELLED' ? ' (CANCELLED)' : '') + '.pdf';
  var folder = docFolder_(doc);
  var file = folder.createFile(Utilities.newBlob(bytes, 'application/pdf', name));
  // A re-made final PDF replaces the old one (moved to Drive's bin). A cancelled copy is kept next to the original.
  if (r.status === 'FINAL' && r.pdfFileId && r.pdfFileId !== file.getId()) { try { DriveApp.getFileById(r.pdfFileId).setTrashed(true); } catch (e) { /* gone */ } }
  r.pdfFileId = file.getId();
  r.pdfUrl = file.getUrl();
  writeRow_('Documents', r._row, r);
  var result = { pdfUrl: r.pdfUrl, pdfFileId: r.pdfFileId, emailed: false };
  var s = settings_();
  if (opts.email && s.email.onFinalise !== 'no' && s.email.to) {
    sendDocEmail_(doc, file, s.email.to, s.email.cc, '');
    r.emailedAt = stamp_();
    writeRow_('Documents', r._row, r);
    result.emailed = true;
  }
  log_('pdf', id, name + (result.emailed ? ', emailed' : ''));
  result.summary = docSummary_(findRow_('Documents', id));
  return result;
}

function apiEmailDocument(id, to, cc, message) {
  var r = findRow_('Documents', id);
  if (!r || !r.pdfFileId) throw new Error('Save the PDF first.');
  to = String(to || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+(\s*,\s*[^@\s]+@[^@\s]+\.[^@\s]+)*$/.test(to)) throw new Error('Check the email address.');
  var doc = docFromRow_(r);
  sendDocEmail_(doc, DriveApp.getFileById(r.pdfFileId), to, cc, message);
  r.emailedAt = stamp_();
  writeRow_('Documents', r._row, r);
  log_('email', id, to);
  return docSummary_(findRow_('Documents', id));
}

function apiCancel(id, reason) {
  reason = String(reason || '').trim();
  if (!reason) throw new Error('Give a reason for cancelling.');
  var r = findRow_('Documents', id);
  if (!r || r.status !== 'FINAL') throw new Error('Only a final document can be cancelled.');
  var doc = docFromRow_(r);
  doc.status = 'CANCELLED';
  doc.meta.cancelledAt = stamp_();
  doc.meta.cancelReason = reason;
  writeDoc_(r._row, doc);
  rows_('Register').forEach(function (g) { if (g.docId === id) { g.status = 'CANCELLED'; writeRow_('Register', g._row, g); } });
  log_('cancel', id, doc.number + ': ' + reason);
  return { doc: doc, summary: docSummary_(findRow_('Documents', id)) };
}

/** Sets where a series continues from, e.g. 45 so the next invoice is …/0046. Never below a used number. */
function apiSetSeries(type, fyShort, last) {
  if (!PB.TYPES[type]) throw new Error('Unknown document type.');
  if (!/^\d{2}-\d{2}$/.test(fyShort)) throw new Error('Financial year looks like 26-27.');
  last = Math.floor(+last);
  if (!(last >= 0)) throw new Error('Enter 0 or a positive whole number.');
  var used = maxUsed_(type, fyShort);
  if (last < used) throw new Error('Number ' + used + ' is already used in this series, so it can only continue from ' + used + ' or higher.');
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { writeSeries_(seriesRow_(type, fyShort), last); } finally { lock.releaseLock(); }
  log_('series', '', type + ' ' + fyShort + ' continues after ' + last);
  return seriesStatus_();
}

/** Checks every series for gaps or duplicates between its first and last number used in this app. */
function apiCheckSeries() {
  var by = {};
  rows_('Documents').forEach(function (d) {
    if (!d.number) return;
    var m = d.number.match(/(\d+)$/);
    var k = PB.TYPES[d.type].title + ' ' + PB.fy(d.date).long;
    (by[k] = by[k] || []).push(m ? +m[1] : 0);
  });
  return Object.keys(by).map(function (k) {
    var nums = by[k].sort(function (a, b) { return a - b; });
    var dup = nums.filter(function (n, i) { return i && n === nums[i - 1]; });
    var gaps = [];
    for (var i = 1; i < nums.length; i++) for (var n = nums[i - 1] + 1; n < nums[i]; n++) gaps.push(n);
    return { series: k, count: nums.length, first: nums[0], last: nums[nums.length - 1], gaps: gaps, duplicates: dup };
  });
}

// ---------------------------------------------------------------- internals: documents
function normaliseDoc_(doc) {
  doc = JSON.parse(JSON.stringify(doc || {}));
  if (!PB.TYPES[doc.type]) throw new Error('Unknown document type.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(doc.date || ''))) throw new Error('Pick the document date.');
  doc.party = doc.party || {};
  doc.pos = doc.pos || {};
  if (doc.pos.code) doc.pos.name = PB.stateName(String(doc.pos.code));
  doc.items = (doc.items || []).map(function (it) {
    return { productId: it.productId || '', name: String(it.name || '').trim(), description: String(it.description || '').trim(),
      type: it.type === 'Service' ? 'Service' : 'Goods', hsn: String(it.hsn || '').trim(), qty: PB.num(it.qty), unit: it.unit || '',
      rate: PB.num(it.rate), discountPct: PB.num(it.discountPct), gstRate: PB.num(it.gstRate) };
  });
  doc.refs = doc.refs || {};
  doc.shipTo = doc.shipTo || { same: true };
  doc.annexure = doc.annexure || { enabled: false };
  return doc;
}

function calcFor_(doc) {
  var s = settings_();
  var supplier = doc.type === 'PO' ? String(doc.party.stateCode || '') : (s.firm.stateCode || '07');
  return PB.compute(doc, supplier);
}

function writeDoc_(row, doc) {
  var json = JSON.stringify(doc);
  if (json.length > JSON_CHUNK * 4) throw new Error('This document is too long to save. Shorten the annexure or notes.');
  var c = doc.calc || {};
  var meta = doc.meta || {};
  var old = row ? rowAt_('Documents', row) : {};
  writeRow_('Documents', row, {
    id: doc.id, type: doc.type, status: doc.status, number: doc.number || '', fy: doc.fy || PB.fy(doc.date).long, date: doc.date,
    partyId: doc.party.id || '', partyName: doc.party.name || '', gstin: doc.party.gstin || '', posCode: doc.pos.code || '',
    taxable: c.taxable || 0, tax: c.tax || 0, payable: c.payable || 0,
    pdfUrl: old.pdfUrl || '', pdfFileId: old.pdfFileId || '', emailedAt: old.emailedAt || '',
    createdAt: meta.createdAt || stamp_(), updatedAt: meta.updatedAt || stamp_(), finalisedAt: meta.finalisedAt || '',
    cancelledAt: meta.cancelledAt || '', cancelReason: meta.cancelReason || '', sourceId: meta.sourceId || '',
    json1: json.slice(0, JSON_CHUNK), json2: json.slice(JSON_CHUNK, JSON_CHUNK * 2),
    json3: json.slice(JSON_CHUNK * 2, JSON_CHUNK * 3), json4: json.slice(JSON_CHUNK * 3)
  });
}

function docFromRow_(r) {
  var doc = JSON.parse(r.json1 + r.json2 + r.json3 + r.json4);
  doc.status = r.status;
  doc.number = r.number;
  doc.meta = doc.meta || {};
  doc.meta.pdfUrl = r.pdfUrl; doc.meta.pdfFileId = r.pdfFileId; doc.meta.emailedAt = r.emailedAt;
  return doc;
}

function docSummary_(r) {
  return { id: r.id, type: r.type, status: r.status, number: r.number, fy: r.fy, date: r.date, partyId: r.partyId, partyName: r.partyName,
    gstin: r.gstin, posCode: r.posCode, taxable: +r.taxable || 0, tax: +r.tax || 0, payable: +r.payable || 0, pdfUrl: r.pdfUrl,
    emailedAt: r.emailedAt, updatedAt: r.updatedAt, finalisedAt: r.finalisedAt, cancelReason: r.cancelReason };
}

function writeRegister_(doc) {
  var byRate = {};
  doc.calc.hsnSummary.forEach(function (h) {
    var k = String(h.rate);
    byRate[k] = byRate[k] || { rate: h.rate, taxable: 0, igst: 0, cgst: 0, sgst: 0 };
    byRate[k].taxable += h.taxable; byRate[k].igst += h.igst; byRate[k].cgst += h.cgst; byRate[k].sgst += h.sgst;
  });
  Object.keys(byRate).forEach(function (k) {
    var b = byRate[k];
    writeRow_('Register', 0, { invoiceNumber: doc.number, date: doc.date, party: doc.party.name, gstin: doc.party.gstin || 'Unregistered',
      posCode: doc.pos.code, placeOfSupply: doc.pos.name, rate: b.rate, taxable: PB.r2(b.taxable), igst: PB.r2(b.igst), cgst: PB.r2(b.cgst),
      sgst: PB.r2(b.sgst), invoiceValue: doc.calc.payable, status: 'FINAL', docId: doc.id });
  });
}

function sendDocEmail_(doc, file, to, cc, message) {
  var t = PB.TYPES[doc.type];
  var s = settings_();
  var subject = t.title + ' ' + doc.number + ' – ' + doc.party.name + ' – ₹' + PB.money(doc.calc.payable) + (doc.status === 'CANCELLED' ? ' (CANCELLED)' : '');
  var lines = [
    message ? esc_(message) + '<br><br>' : '',
    '<b>' + t.title + ' ' + esc_(doc.number) + '</b> dated ' + PB.prettyDate(doc.date) + '<br>',
    (doc.type === 'PO' ? 'Vendor: ' : 'Customer: ') + esc_(doc.party.name) + (doc.party.gstin ? ' (GSTIN ' + esc_(doc.party.gstin) + ')' : '') + '<br>',
    'Amount: ₹' + PB.money(doc.calc.payable) + '<br>',
    doc.status === 'CANCELLED' ? '<b>Cancelled:</b> ' + esc_(doc.meta.cancelReason || '') + '<br>' : '',
    '<br>The PDF is attached and saved in Google Drive: <a href="' + file.getUrl() + '">open it</a>.<br><br>',
    esc_(s.firm.tradeName || s.firm.legalName)
  ];
  var mail = { to: to, subject: subject.slice(0, 200), htmlBody: lines.join(''), attachments: [file.getBlob()], name: s.firm.tradeName || APP_NAME };
  if (cc) mail.cc = cc;
  MailApp.sendEmail(mail);
}

function fileName_(doc) {
  return (doc.number || 'DRAFT').replace(/[\/\\]/g, '-') + ' ' + String(doc.party.name || '').replace(/[\\\/:*?"<>|]/g, '').slice(0, 60);
}

// ---------------------------------------------------------------- internals: series
function seriesRow_(type, fyShort) {
  var found = null;
  rows_('Series').forEach(function (r) { if (r.type === type && r.fy === fyShort) found = r; });
  return found || { _row: 0, type: type, fy: fyShort, last: 0 };
}
function writeSeries_(row, last) {
  row.last = last;
  row.updated = stamp_();
  writeRow_('Series', row._row || 0, row);
}
function maxUsed_(type, fyShort) {
  var max = 0;
  rows_('Documents').forEach(function (d) {
    if (d.type !== type || !d.number || PB.fy(d.date).short !== fyShort) return;
    var m = d.number.match(/(\d+)$/);
    if (m && +m[1] > max) max = +m[1];
  });
  return max;
}
function seriesStatus_() {
  var s = settings_();
  var cur = PB.fy(PB.today());
  var out = {};
  Object.keys(PB.TYPES).forEach(function (t) {
    var r = seriesRow_(t, cur.short);
    out[t] = { fy: cur.short, last: +r.last || 0, next: PB.formatNumber(s.series[t].prefix, cur.short, (+r.last || 0) + 1, +s.series.pad || 4) };
  });
  return out;
}

// ---------------------------------------------------------------- internals: parties, products, settings
function parties_() {
  var regs = rows_('Registrations');
  return rows_('Parties').map(function (p) { return partyShape_(p, regs); });
}
function partyOut_(id) {
  var p = findRow_('Parties', id);
  return partyShape_(p, rows_('Registrations'));
}
function partyShape_(p, regs) {
  return { id: p.id, role: p.role, name: p.name, contact: p.contact, phone: p.phone, email: p.email, pan: p.pan, notes: p.notes,
    registrations: regs.filter(function (r) { return r.partyId === p.id; }).map(function (r) {
      return { id: r.id, label: r.label, gstin: r.gstin, legalName: r.legalName, address: r.address, city: r.city,
        stateCode: r.stateCode, stateName: PB.stateName(r.stateCode), pin: r.pin, isDefault: r.isDefault === 'yes' };
    }) };
}
function productOut_(r) {
  return { id: r.id, name: r.name, description: r.description, type: r.type, hsn: r.hsn, unit: r.unit, rate: +r.rate || 0,
    gstRate: +r.gstRate || 0, category: r.category, active: r.active !== 'no' };
}

function settingsRaw_() {
  var o = {};
  rows_('Settings').forEach(function (r) { if (r.key) o[r.key] = r.value; });
  return o;
}
function saveSettingsRaw_(obj) {
  var rows = rows_('Settings');
  Object.keys(obj).forEach(function (k) {
    var hit = null;
    rows.forEach(function (r) { if (r.key === k) hit = r; });
    if (hit) { hit.value = obj[k]; writeRow_('Settings', hit._row, hit); }
    else { var r = { key: k, value: obj[k] }; r._row = writeRow_('Settings', 0, r); rows.push(r); }
  });
  CACHE_.Settings = null;
}
/** Settings grouped for the app and the PDFs. */
function settings_() {
  var raw = settingsRaw_();
  var g = function (k) { return raw[k] != null ? raw[k] : (DEFAULT_SETTINGS[k] || ''); };
  var out = { firm: {}, bank: {}, sign: {}, brand: {}, series: { INV: {}, PI: {}, PO: {} }, pdf: {}, terms: {}, notes: {}, email: {}, drive: {} };
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) {
    var parts = k.split('.');
    if (parts.length === 3) out[parts[0]][parts[1]][parts[2]] = g(k);
    else out[parts[0]][parts[1]] = g(k);
  });
  out.firm.stateName = PB.stateName(out.firm.stateCode);
  return out;
}

// ---------------------------------------------------------------- internals: Drive
function rootFolder_() {
  var raw = settingsRaw_();
  var id = raw['drive.rootFolderId'];
  if (id) { try { var f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) { /* recreate */ } }
  var folder = DriveApp.createFolder(APP_NAME);
  saveSettingsRaw_({ 'drive.rootFolderId': folder.getId() });
  return folder;
}
function subFolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}
function docFolder_(doc) {
  return subFolder_(subFolder_(rootFolder_(), PB.fy(doc.date).long), PB.TYPES[doc.type].folder);
}
function imageDataUrl_(fileId) {
  if (!fileId) return null;
  try {
    var blob = DriveApp.getFileById(fileId).getBlob();
    return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (e) { return null; }
}

// ---------------------------------------------------------------- internals: sheets
var CACHE_ = {};
function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    var h = SHEETS[name];
    sh.getRange(1, 1, 1, h.length).setNumberFormat('@').setValues([h]).setFontWeight('bold').setBackground('#E4EDF7');
    sh.setFrozenRows(1);
  }
  return sh;
}
function ensureSetup_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Settings') || !ss.getSheetByName('Documents')) setup();
}
function rows_(name) {
  if (CACHE_[name]) return CACHE_[name];
  var sh = sheet_(name), h = SHEETS[name], last = sh.getLastRow();
  var vals = last > 1 ? sh.getRange(2, 1, last - 1, h.length).getValues() : [];
  var out = [];
  vals.forEach(function (v, i) {
    var o = { _row: i + 2 };
    h.forEach(function (k, j) { o[k] = cell_(v[j]); });
    if (o[h[0]] !== '') out.push(o);
  });
  CACHE_[name] = out;
  return out;
}
function cell_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  return v == null ? '' : (typeof v === 'number' ? v : String(v));
}
function rowAt_(name, row) {
  var hit = {};
  rows_(name).forEach(function (r) { if (r._row === row) hit = r; });
  return hit;
}
function findRow_(name, id) {
  var key = SHEETS[name][0], hit = null;
  rows_(name).forEach(function (r) { if (r[key] === id) hit = r; });
  return hit;
}
/** Writes one row (row 0 = append) as text, except the numeric columns. Returns the row number. */
function writeRow_(name, row, obj) {
  var sh = sheet_(name), h = SHEETS[name], numeric = NUMERIC[name] || {};
  var r = row || sh.getLastRow() + 1;
  var fmts = h.map(function (k) { return numeric[k] ? '0.00' : '@'; });
  var vals = h.map(function (k) {
    var v = obj[k];
    if (numeric[k]) return +v || 0;
    return v == null ? '' : String(v);
  });
  var range = sh.getRange(r, 1, 1, h.length);
  range.setNumberFormats([fmts]);
  range.setValues([vals]);
  CACHE_[name] = null;
  return r;
}
function deleteWhere_(name, test) {
  var sh = sheet_(name);
  var hits = rows_(name).filter(test).map(function (r) { return r._row; }).sort(function (a, b) { return b - a; });
  hits.forEach(function (r) { sh.deleteRow(r); });
  CACHE_[name] = null;
}

// ---------------------------------------------------------------- small helpers
function stamp_() { return Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss"); }
function newId_(p) { return p + '_' + new Date().getTime().toString(36) + Math.floor(Math.random() * 1679616).toString(36); }
function userEmail_() { try { return Session.getActiveUser().getEmail() || ''; } catch (e) { return ''; } }
function esc_(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function log_(action, docId, details) {
  try { writeRow_('Log', 0, { time: stamp_(), user: userEmail_(), action: action, docId: docId, details: String(details || '').slice(0, 500) }); } catch (e) { /* never block on the log */ }
}
