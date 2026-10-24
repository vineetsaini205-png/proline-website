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
