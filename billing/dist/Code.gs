// Proline Billing 2026-10-25 05:50 — built from billing/src (shared.js + server.js). Edit the source, not this file.

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
  /** "2026-10-24" → { start: 2026, short: "26-27", compact: "2627", long: "2026-27" } (April to March). */
  function fy(dateStr) {
    var m = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    var y = m ? +m[1] : new Date().getFullYear(), mo = m ? +m[2] : new Date().getMonth() + 1;
    var start = mo >= 4 ? y : y - 1;
    var a = String(start).slice(2), b = String(start + 1).slice(2);
    return { start: start, short: a + '-' + b, compact: a + b, long: start + '-' + b };
  }
  /** The year part of a document number: "26-27" or, in the 2627 style, "2627". */
  function fyTag(f, style) { return style === '2627' ? f.compact : f.short; }
  /** Document number from the series settings, e.g. PEW/26-27/0007 or PEW/2627/07. */
  function formatNumber(prefix, tag, n, pad) {
    var s = String(n);
    while (s.length < (pad || 4)) s = '0' + s;
    return (prefix ? prefix + '/' : '') + tag + '/' + s;
  }
  /**
   * The running number inside a document number of this series, in either year style:
   * seqOf("PEW/2627/0005", "PEW", fy) → 5. Numbers from another series give null.
   */
  function seqOf(number, prefix, f) {
    var esc = function (x) { return String(x).replace(/[.*+?^${}()|[\]\\\/-]/g, '\\$&'); };
    var re = new RegExp('^' + (prefix ? esc(prefix) + '/' : '') + '(?:' + esc(f.short) + '|' + esc(f.compact) + ')/(\\d{1,9})$', 'i');
    var m = String(number || '').trim().match(re);
    return m ? +m[1] : null;
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

  // ---- Reading imported rows (Excel, CSV, pasted) ------------------------------------
  /** "Customer GSTIN" → "customergstin": header names compared without case, spaces or signs. */
  function normKey(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  var MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
  /** Dates as typed in India: 28-09-2026, 28/9/26, 28 Sep 2026, 2026-09-28, or an Excel date. → "2026-09-28" or "". */
  function parseDate(v) {
    if (v == null || v === '') return '';
    var z = function (n) { return (n < 10 ? '0' : '') + n; };
    var ok = function (y, mo, d) {
      if (y < 100) y += 2000;
      if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) return '';
      var dt = new Date(Date.UTC(y, mo - 1, d));
      return dt.getUTCMonth() === mo - 1 ? y + '-' + z(mo) + '-' + z(d) : '';
    };
    if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(v) ? '' : ok(v.getFullYear(), v.getMonth() + 1, v.getDate());
    if (typeof v === 'number' && v > 20000 && v < 80000) { var e = new Date(Date.UTC(1899, 11, 30) + v * 86400000); return ok(e.getUTCFullYear(), e.getUTCMonth() + 1, e.getUTCDate()); }
    var t = String(v).trim(), m;
    if ((m = t.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))) return ok(+m[1], +m[2], +m[3]);
    if ((m = t.match(/^(\d{1,2})[-\/. ](\d{1,2})[-\/. ](\d{2,4})$/))) return ok(+m[3], +m[2], +m[1]);
    if ((m = t.match(/^(\d{1,2})[-\/ ]?([A-Za-z]{3,9})[-\/ ,]*(\d{2,4})$/))) {
      var mo = MON[m[2].toLowerCase().slice(0, 4)] || MON[m[2].toLowerCase().slice(0, 3)];
      if (mo) return ok(+m[3], mo, +m[1]);
    }
    return '';
  }
  /** "07", "7", "Delhi", "delhi (07)" → "07"; unknown → "". */
  function stateCodeOf(v) {
    var t = String(v == null ? '' : v).trim();
    if (!t) return '';
    var m = t.match(/\((\d{1,2})\)\s*$/) || t.match(/^(\d{1,2})$/);
    if (m) { var c = (m[1].length === 1 ? '0' : '') + m[1]; return stateName(c) ? c : ''; }
    var k = normKey(t);
    for (var i = 0; i < STATES.length; i++) if (normKey(STATES[i][1]) === k) return STATES[i][0];
    var alias = { orissa: '21', pondicherry: '34', jammukashmir: '01', jk: '01', andaman: '35', dnhdd: '26', newdelhi: '07', nct: '07', nctofdelhi: '07' };
    return alias[k] || '';
  }
  /** "Tax invoice", "Invoice", "INV" → "INV"; "Proforma", "Performa", "PI" → "PI"; "PO", "Purchase order" → "PO". */
  function docTypeOf(v) {
    var k = normKey(v);
    if (!k) return '';
    if (k === 'pi' || k.indexOf('proforma') >= 0 || k.indexOf('performa') >= 0 || k.indexOf('preinvoice') >= 0) return 'PI';
    if (k === 'po' || k.indexOf('purchase') >= 0) return 'PO';
    if (k === 'inv' || k.indexOf('invoice') >= 0) return 'INV';
    return '';
  }
  /** "Final", "Issued" → FINAL; "Cancelled", "Canceled" → CANCELLED; "Draft" or empty → DRAFT. */
  function statusOf(v) {
    var k = normKey(v);
    if (!k || k === 'draft') return 'DRAFT';
    if (k.indexOf('cancel') === 0) return 'CANCELLED';
    if (k === 'final' || k === 'issued' || k === 'raised' || k === 'done' || k === 'finalised' || k === 'finalized') return 'FINAL';
    return '';
  }
  /** "Yes", "Y", "TRUE", "1" → true; "No", "N", "FALSE", "0" → false; empty → the default. */
  function yesNo(v, dflt) {
    var k = normKey(v);
    if (!k) return dflt;
    if (k === 'yes' || k === 'y' || k === 'true' || k === '1') return true;
    if (k === 'no' || k === 'n' || k === 'false' || k === '0') return false;
    return dflt;
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

  // ---- Import templates (the app's "Import" page and the downloadable files use these) -----------------
  var EX = 'EXAMPLE';
  function exGstin(s14) { return s14 + gstinCheckChar(s14); }
  var IMPORT = {
    documents: {
      title: 'Invoices, proformas and POs', file: 'Proline billing import - documents',
      columns: ['Type', 'Doc no.', 'Status', 'Date', 'Customer or vendor', 'GSTIN', 'Address', 'City', 'PIN', 'State', 'Place of supply',
        'Item', 'Item details', 'Goods or service', 'HSN/SAC', 'Qty', 'Unit', 'Rate', 'Discount %', 'GST %',
        'Rates include GST', 'Round off', 'Reverse charge', 'Reference', 'Notes', 'Cancel reason'],
      notes: [
        ['Type', 'Invoice, Proforma or PO.'],
        ['Doc no.', 'The same value on every line of one document. Final or Cancelled: the number it was issued with, e.g. PEW/2627/05. Draft: any label (1, 2, A…) just to group its lines; the number is given when you finalise it in the app.'],
        ['Status', 'Draft (to finish in the app), Final or Issued (already issued, recorded as it is), or Cancelled (recorded as cancelled; its number can be given again).'],
        ['Date', 'Day first: 28-09-2026, 28/09/2026 or 28 Sep 2026.'],
        ['Customer or vendor', 'Name. An existing customer or vendor is matched by GSTIN or name; a new one is added. Rows that start with EXAMPLE are skipped.'],
        ['GSTIN', 'Leave empty for an unregistered customer. The state is read from the GSTIN.'],
        ['Address, City, PIN, State', 'Needed only for a new customer or vendor. State (name or code) is needed when there is no GSTIN.'],
        ['Place of supply', 'State name or code. Empty: the customer’s state (for a PO: your state). Same state as yours → CGST + SGST; another state → IGST.'],
        ['Item, Item details', 'One row per item line. Item details is printed under the item.'],
        ['Goods or service', 'Goods or Service. Empty: Service when the code is a SAC (99…), otherwise Goods.'],
        ['HSN/SAC', 'Goods: HSN, 4, 6 or 8 digits. Services: SAC, 6 digits starting 99.'],
        ['Qty, Unit, Rate', 'Rate per unit in rupees, before GST unless Rates include GST is Yes.'],
        ['Discount %, GST %', 'GST %: 0, 0.25, 3, 5, 12, 18, 28 or 40.'],
        ['Rates include GST, Round off, Reverse charge', 'Yes or No. Empty: No, Yes, No.'],
        ['Reference', 'Customer PO number (for a PO: the vendor’s quotation).'],
        ['Notes, Cancel reason', 'Optional. Cancel reason is used for Cancelled rows.'],
        ['Header fields', 'On the 2nd and later lines of one document only Type, Doc no. and the item columns are needed.']
      ],
      examples: [
        ['Invoice', 'PEW/2627/05', 'Final', '28-09-2026', EX + ' Customer Pvt Ltd', exGstin('07AAACS1234A1Z'), '12 Sample Road, Sector 5', 'New Delhi', '110017', 'Delhi', '',
          'AC EV charger 7.4 kW', 'Wall-mounted, Type 2 socket', 'Goods', '85044090', 1, 'Nos', 48500, '', 5, 'No', 'Yes', 'No', 'PO-778', '', ''],
        ['Invoice', 'PEW/2627/05', '', '', EX + ' Customer Pvt Ltd', '', '', '', '', '', '',
          'Installation and commissioning', 'Earthing, cabling, testing and handover', 'Service', '995461', 1, 'Job', 7500, '', 18, '', '', '', '', '', ''],
        ['Proforma', '1', 'Draft', '25-10-2026', EX + ' Builders LLP', '', '5 Market Road', 'Noida', '201301', 'Uttar Pradesh', '',
          'DC fast charger 60 kW', 'CCS2, dual gun', 'Goods', '85044090', 2, 'Nos', 650000, 3, 5, 'No', 'Yes', 'No', '', '50% advance', '']
      ],
      fields: {
        type: ['type', 'doctype', 'documenttype', 'document'], ref: ['docno', 'documentno', 'docnumber', 'no', 'number', 'invoiceno', 'invoicenumber', 'invno', 'docref', 'ref'],
        status: ['status'], date: ['date', 'docdate', 'invoicedate'],
        party: ['customerorvendor', 'customer', 'vendor', 'party', 'partyname', 'customername', 'vendorname', 'billto', 'buyer', 'name'],
        gstin: ['gstin', 'gstno', 'gstnumber', 'customergstin', 'vendorgstin'], address: ['address', 'billingaddress'], city: ['city', 'town'],
        pin: ['pin', 'pincode', 'postalcode', 'zip'], state: ['state', 'statecode'], pos: ['placeofsupply', 'pos'],
        item: ['item', 'itemname', 'product', 'particulars', 'service'], details: ['itemdetails', 'details', 'description', 'itemdescription', 'specification'],
        kind: ['goodsorservice', 'goodsservice', 'itemtype', 'kind'], hsn: ['hsnsac', 'hsn', 'sac', 'hsncode', 'saccode', 'hsnsaccode'],
        qty: ['qty', 'quantity'], unit: ['unit', 'uom', 'units'], rate: ['rate', 'price', 'unitprice', 'rateperunit'],
        disc: ['discount%', 'discount', 'disc%', 'disc', 'discountpercent'], gst: ['gst%', 'gstrate', 'gstrate%', 'tax%', 'gstpercent', 'taxrate'],
        incl: ['ratesincludegst', 'inclusiveofgst', 'inclgst', 'includesgst', 'priceincludesgst'], round: ['roundoff', 'round'], rc: ['reversecharge', 'rcm'],
        reference: ['reference', 'customerpono', 'pono', 'yourref', 'quoteref', 'customerref'], notes: ['notes', 'note', 'remarks'],
        reason: ['cancelreason', 'reason', 'cancellationreason']
      }
    },
    parties: {
      title: 'Customers and vendors', file: 'Proline billing import - customers and vendors',
      columns: ['Name', 'Type', 'GSTIN', 'Label', 'Legal name', 'Address', 'City', 'PIN', 'State', 'Contact person', 'Phone', 'Email'],
      notes: [
        ['Name', 'One row per GST registration or address. Repeat the name on more rows for more GSTINs or sites. Rows that start with EXAMPLE are skipped.'],
        ['Type', 'Customer, Vendor (for POs) or Both. Empty: Customer.'],
        ['GSTIN', 'Leave empty if unregistered. The state is read from the GSTIN.'],
        ['Label', 'Optional, e.g. Head office, Pune site.'],
        ['Legal name', 'Only if different from the name, as on the GST certificate.'],
        ['State', 'Name or code. Needed when there is no GSTIN.'],
        ['Existing names', 'A name that already exists gets the new GSTINs or addresses added; nothing is deleted.']
      ],
      examples: [
        [EX + ' Customer Pvt Ltd', 'Customer', exGstin('07AAACS1234A1Z'), 'Head office', EX + ' Customer Private Limited', '12 Sample Road, Sector 5', 'New Delhi', '110017', 'Delhi', 'Ms A. Sharma', '', 'accounts@example.com'],
        [EX + ' Customer Pvt Ltd', 'Customer', exGstin('27AAACS1234A1Z'), 'Pune site', '', 'Tech Park, Hinjewadi', 'Pune', '411057', 'Maharashtra', '', '', ''],
        [EX + ' Cable Supplier', 'Vendor', '', '', '', 'Industrial Area', 'Faridabad', '121003', 'Haryana', '', '', '']
      ],
      fields: {
        name: ['name', 'partyname', 'customername', 'vendorname', 'customerorvendor', 'customer', 'vendor'], role: ['type', 'role'],
        gstin: ['gstin', 'gstno', 'gstnumber'], label: ['label', 'addresslabel', 'site', 'branch'], legal: ['legalname', 'legalnameasgst', 'legalnameaspergst'],
        address: ['address'], city: ['city', 'town'], pin: ['pin', 'pincode', 'postalcode', 'zip'], state: ['state', 'statecode'],
        contact: ['contactperson', 'contact', 'person'], phone: ['phone', 'mobile', 'phoneno', 'contactno'], email: ['email', 'emailid', 'mail']
      }
    },
    items: {
      title: 'Items', file: 'Proline billing import - items',
      columns: ['Name', 'Details', 'Goods or service', 'HSN/SAC', 'Unit', 'Rate', 'GST %', 'Category'],
      notes: [
        ['Name', 'One row per item. A name that already exists is updated. Rows that start with EXAMPLE are skipped.'],
        ['Details', 'Optional, printed under the item name.'],
        ['Goods or service', 'Goods or Service. Empty: Service when the code is a SAC (99…), otherwise Goods.'],
        ['HSN/SAC', 'Goods: HSN, 4, 6 or 8 digits. Services: SAC, 6 digits starting 99. Check with your CA.'],
        ['Unit, Rate', 'Rate per unit in rupees, before GST. Optional.'],
        ['GST %', '0, 0.25, 3, 5, 12, 18, 28 or 40.']
      ],
      examples: [
        [EX + ' Armoured copper cable 3C x 6 sq mm', '', 'Goods', '8544', 'Mtr', 310, 18, 'Electrical'],
        [EX + ' Installation and commissioning', 'Earthing, cabling, testing and handover', 'Service', '995461', 'Job', 7500, 18, 'Services']
      ],
      fields: {
        name: ['name', 'item', 'itemname', 'product', 'service'], details: ['details', 'description', 'itemdetails'],
        kind: ['goodsorservice', 'goodsservice', 'type', 'itemtype', 'kind'], hsn: ['hsnsac', 'hsn', 'sac', 'hsncode', 'saccode'],
        unit: ['unit', 'uom', 'units'], rate: ['rate', 'price', 'unitprice'], gst: ['gst%', 'gstrate', 'gstrate%', 'tax%', 'gstpercent', 'taxrate'],
        category: ['category', 'group']
      }
    }
  };

  return {
    STATES: STATES, UT_CODES: UT_CODES, GST_RATES: GST_RATES, UNITS: UNITS, TYPES: TYPES,
    stateName: stateName, r2: r2, num: num, money: money, words: words, amountInWords: amountInWords,
    gstinCheckChar: gstinCheckChar, checkGstin: checkGstin, checkPan: checkPan, checkHsn: checkHsn,
    fy: fy, fyTag: fyTag, formatNumber: formatNumber, seqOf: seqOf, checkInvoiceNumber: checkInvoiceNumber,
    normKey: normKey, parseDate: parseDate, stateCodeOf: stateCodeOf, docTypeOf: docTypeOf, statusOf: statusOf, yesNo: yesNo, IMPORT: IMPORT,
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
 * - Numbers: given when a document is finalised: the next in its series (type + financial year), a
 *   cancelled number given again, or one typed by hand (e.g. invoices issued before this app).
 *   Drafts have no number, so abandoned drafts never leave gaps. The series continues after the
 *   highest number recorded in it.
 *
 * Deploy: Deploy → New deployment → Web app → Execute as: Me, Who has access: Only myself.
 * Source of truth: billing/src in the website repository (built into Code.gs and Index.html).
 */

var APP_NAME = 'Proline Billing';
// Browser-tab icon: the Charge-O icon from the website (public file, no private data).
var FAVICON_URL = 'https://www.prolineelectricalworks.com/favicon-32.png';
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
    'json1', 'json2', 'json3', 'json4', 'amendedAt', 'source'],
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
  'series.INV.prefix': 'PEW', 'series.PI.prefix': 'PEW-PI', 'series.PO.prefix': 'PEW-PO', 'series.pad': '4', 'series.fyStyle': '26-27',
  'series.INV.reuse': '', 'series.PI.reuse': '', 'series.PO.reuse': '',
  'pdf.copies': 'Original',
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
  var out = HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  try { out.setFaviconUrl(FAVICON_URL); } catch (e) { /* keep Google's default tab icon */ }
  return out;
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
  ensureHeaders_();
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
    if (clean['series.' + t + '.reuse'] != null) clean['series.' + t + '.reuse'] = splitList_(clean['series.' + t + '.reuse']).join(', ');
  });
  if (clean['series.fyStyle'] != null && ['26-27', '2627'].indexOf(clean['series.fyStyle']) < 0) throw new Error('Choose how the year is written in numbers.');
  if (clean['series.pad'] != null && !/^[1-6]$/.test(clean['series.pad'])) throw new Error('Choose how many digits the number has.');
  if (clean['series.INV.prefix'] != null || clean['series.pad'] != null || clean['series.fyStyle'] != null) {
    var cur = settings_();
    var pre = clean['series.INV.prefix'] != null ? clean['series.INV.prefix'] : cur.series.INV.prefix;
    var pad = +(clean['series.pad'] || cur.series.pad || 4);
    var style = clean['series.fyStyle'] || cur.series.fyStyle;
    var sample = PB.formatNumber(pre, PB.fyTag(PB.fy(PB.today()), style), Math.pow(10, Math.max(pad, 3)) - 1, pad);
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
 * Finalises a document: checks it, gives it a number and locks it. The browser then makes the PDF
 * and calls apiStorePdf. doc.numbering.mode: 'auto' (next in series, the default), 'reuse' (a
 * cancelled number given again) or 'manual' (typed, e.g. an invoice issued before this app).
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
    var f = PB.fy(doc.date);
    var pick = pickNumber_(s, doc, f, existing ? existing.id : '');
    doc.id = doc.id || newId_('d');
    doc.status = 'FINAL';
    doc.number = pick.number;
    doc.fy = f.long;
    doc.numbering = { mode: pick.mode, number: pick.number };
    doc.meta = doc.meta || {};
    doc.meta.createdAt = existing ? existing.createdAt : stamp_();
    doc.meta.updatedAt = stamp_();
    doc.meta.finalisedAt = stamp_();
    doc.firm = s.firm;              // snapshot: later Settings changes never alter a final document
    doc.bank = s.bank;
    doc.sign = s.sign;
    doc.calc = calcFor_(doc);
    bumpSeries_(s, doc.type, f, pick.number);
    if (pick.mode === 'reuse') dropReuse_(doc.type, pick.number);
    writeDoc_(existing ? existing._row : 0, doc);
    if (doc.type === 'INV') writeRegister_(doc);
    log_('finalise', doc.id, pick.number + (pick.mode !== 'auto' ? ' (' + pick.mode + ')' : '') + ' ' + doc.party.name + ' ₹' + PB.money(doc.calc.payable));
  } finally {
    lock.releaseLock();
  }
  return { doc: doc, summary: docSummary_(findRow_('Documents', doc.id)), series: seriesStatus_() };
}

/**
 * Amends a final document: new contents (and, if asked, a new number), same document. Keeps a
 * history with the reason, renames the old PDF in Drive instead of deleting it, and rewrites the
 * Register rows. For an invoice already filed in GSTR-1, a credit or debit note is usually needed instead.
 */
function apiAmend(doc, reason) {
  reason = String(reason || '').trim();
  if (!reason) throw new Error('Give a reason for the amendment.');
  doc = normaliseDoc_(doc);
  var s = settings_();
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var r = doc.id ? findRow_('Documents', doc.id) : null;
    if (!r || r.status !== 'FINAL') throw new Error('Only a final document can be amended.');
    var before = docFromRow_(r);
    doc.firm = before.firm || s.firm; doc.bank = before.bank || s.bank; doc.sign = before.sign || s.sign;
    var problems = PB.validate(doc, doc.firm);
    if (problems.length) throw new Error('Please fix these first:\n• ' + problems.join('\n• '));
    var f = PB.fy(doc.date);
    var number = before.number;
    var wanted = String((doc.numbering && doc.numbering.mode === 'manual' && doc.numbering.number) || '').trim();
    if (wanted && wanted !== before.number) {
      checkTypedNumber_(doc.type, wanted, f, doc.id);
      number = wanted;
    }
    var calc = calcFor_(doc);
    var history = (before.meta && before.meta.amendments) || [];
    history.push({ at: stamp_(), reason: reason, number: before.number, newNumber: number !== before.number ? number : '',
      payable: (before.calc || {}).payable, newPayable: calc.payable });
    doc.status = 'FINAL';
    doc.number = number;
    doc.fy = f.long;
    doc.numbering = { mode: number === before.number ? 'keep' : 'manual', number: number };
    doc.meta = before.meta || {};
    doc.meta.amendments = history;
    doc.meta.amendedAt = stamp_();
    doc.meta.updatedAt = stamp_();
    doc.calc = calc;
    if (number !== before.number) bumpSeries_(s, doc.type, f, number);
    writeDoc_(r._row, doc);
    if (doc.type === 'INV') {
      deleteWhere_('Register', function (g) { return g.docId === doc.id; });
      writeRegister_(doc);
    }
    // Keep the old PDF, renamed; the browser saves the new one next.
    var row = findRow_('Documents', doc.id);
    if (row.pdfFileId) {
      try { var old = DriveApp.getFileById(row.pdfFileId); old.setName(old.getName().replace(/\.pdf$/i, '') + ' (before amendment ' + history.length + ').pdf'); } catch (e) { /* gone */ }
    }
    row.pdfFileId = ''; row.pdfUrl = ''; row.emailedAt = '';
    writeRow_('Documents', row._row, row);
    log_('amend', doc.id, before.number + (number !== before.number ? ' → ' + number : '') + ': ' + reason + ' (₹' + PB.money((before.calc || {}).payable) + ' → ₹' + PB.money(calc.payable) + ')');
  } finally {
    lock.releaseLock();
  }
  return { doc: docFromRow_(findRow_('Documents', doc.id)), summary: docSummary_(findRow_('Documents', doc.id)), series: seriesStatus_() };
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
  return { doc: doc, summary: docSummary_(findRow_('Documents', id)), series: seriesStatus_() };
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

/** Checks every series for gaps or duplicates between its first and last number recorded in this app. */
function apiCheckSeries() {
  var s = settings_();
  var by = {};
  rows_('Documents').forEach(function (d) {
    if (!d.number || d.status === 'DRAFT') return;
    var f = PB.fy(d.date);
    var seq = PB.seqOf(d.number, s.series[d.type].prefix, f);
    var k = PB.TYPES[d.type].title + ' ' + f.long;
    var g = by[k] = by[k] || { all: {}, live: {}, other: 0 };
    if (seq == null) { g.other++; return; }
    g.all[seq] = (g.all[seq] || 0) + 1;
    if (d.status === 'FINAL') g.live[seq] = (g.live[seq] || 0) + 1;
  });
  return Object.keys(by).map(function (k) {
    var g = by[k];
    var nums = Object.keys(g.all).map(Number).sort(function (a, b) { return a - b; });
    var dup = Object.keys(g.live).filter(function (n) { return g.live[n] > 1; }).map(Number);
    var reissued = Object.keys(g.all).filter(function (n) { return g.all[n] > 1 && g.live[n] === 1; }).map(Number);
    var gaps = [];
    for (var i = 1; i < nums.length; i++) for (var n = nums[i - 1] + 1; n < nums[i]; n++) gaps.push(n);
    return { series: k, count: nums.length, first: nums[0] || 0, last: nums[nums.length - 1] || 0, gaps: gaps, duplicates: dup, reissued: reissued, other: g.other };
  });
}

// ---------------------------------------------------------------- import (Excel, CSV, pasted rows)
/** Items: added, or updated when the name already exists. */
function apiImportProducts(list) {
  var have = {};
  rows_('Products').forEach(function (r) { have[r.name.toLowerCase()] = r.id; });
  var added = 0, updated = 0;
  (list || []).forEach(function (p, i) {
    try {
      var id = have[String(p.name || '').trim().toLowerCase()];
      apiSaveProduct({ id: id || '', name: p.name, description: p.description, type: p.type, hsn: p.hsn, unit: p.unit, rate: p.rate, gstRate: p.gstRate, category: p.category, active: true });
      if (id) updated++; else added++;
      have[String(p.name).trim().toLowerCase()] = id || 'new';
    } catch (e) { throw new Error('Row ' + (p.row || i + 1) + ' (' + (p.name || 'no name') + '): ' + cleanErr_(e)); }
  });
  CACHE_.Products = null;
  log_('import', '', added + ' items added, ' + updated + ' updated');
  return { products: rows_('Products').map(productOut_), added: added, updated: updated };
}

/** Customers and vendors: new names are added; for a name that exists, new GSTINs or addresses are added to it. */
function apiImportParties(list) {
  var added = 0, updated = 0, ids = {};
  (list || []).forEach(function (p, i) {
    try {
      var name = String(p.name || '').trim();
      var cur = null;
      parties_().forEach(function (x) { if (x.name.toLowerCase() === name.toLowerCase()) cur = x; });
      if (!cur) {
        var made = apiSaveParty({ name: name, role: p.role, contact: p.contact, phone: p.phone, email: p.email, registrations: p.registrations });
        ids[name.toLowerCase()] = made.id; added++;
        return;
      }
      var regs = cur.registrations.slice();
      var key = function (r) { return r.gstin ? 'G' + String(r.gstin).toUpperCase() : 'A' + String(r.address || '').toLowerCase().replace(/\s+/g, ' ') + '|' + r.stateCode; };
      var seen = {}; regs.forEach(function (r) { seen[key(r)] = 1; });
      var more = (p.registrations || []).filter(function (r) { if (r.gstin) r.gstin = String(r.gstin).toUpperCase(); return !seen[key(r)]; });
      if (more.length || (p.role && p.role !== cur.role && cur.role !== 'Both')) {
        var role = p.role && p.role !== cur.role ? 'Both' : cur.role;
        apiSaveParty({ id: cur.id, name: cur.name, role: role, contact: cur.contact || p.contact, phone: cur.phone || p.phone, email: cur.email || p.email,
          pan: cur.pan, notes: cur.notes, registrations: regs.concat(more) });
        updated++;
      }
      ids[name.toLowerCase()] = cur.id;
    } catch (e) { throw new Error('Row ' + (p.row || i + 1) + ' (' + (p.name || 'no name') + '): ' + cleanErr_(e)); }
  });
  log_('import', '', added + ' customers/vendors added, ' + updated + ' updated');
  return { parties: parties_(), added: added, updated: updated, ids: ids };
}

/**
 * Documents from a spreadsheet. Drafts get no number. Final and cancelled ones are recorded with the
 * number they were issued with (e.g. invoices raised before this app): no email, no PDF until asked for.
 * Everything is checked first; nothing is saved if any document has a problem.
 */
function apiImportDocuments(list) {
  var s = settings_();
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  var out = [];
  try {
    var docs = (list || []).map(function (d) { return { src: d, doc: normaliseDoc_(d) }; });
    var errors = [], seen = {};
    docs.forEach(function (x) {
      var d = x.doc, ref = x.src.ref || d.number || '';
      try {
        if (['DRAFT', 'FINAL', 'CANCELLED'].indexOf(d.status) < 0) throw new Error('status must be Draft, Final or Cancelled.');
        if (d.status !== 'DRAFT') {
          var problems = PB.validate(d, s.firm);
          if (problems.length) throw new Error(problems.join(' '));
          var f = PB.fy(d.date);
          d.number = String(d.number || '').trim();
          if (!d.number) throw new Error('a final or cancelled document needs its number.');
          if (d.type === 'INV') { var e = PB.checkInvoiceNumber(d.number); if (e) throw new Error(e); }
          if (d.status === 'FINAL') {
            var k = d.type + '|' + f.long + '|' + d.number.toUpperCase();
            if (seen[k]) throw new Error(d.number + ' is twice in the file as final.');
            seen[k] = 1;
            if (liveNumber_(d.type, d.number, f, '')) throw new Error(d.number + ' is already used by a final document in this app.');
          }
        }
      } catch (e) { errors.push(PB.TYPES[d.type].short + ' ' + ref + ': ' + cleanErr_(e)); }
    });
    if (errors.length) throw new Error('Nothing was imported. Please fix these:\n• ' + errors.slice(0, 30).join('\n• ') + (errors.length > 30 ? '\n…and ' + (errors.length - 30) + ' more' : ''));
    docs.forEach(function (x) {
      var d = x.doc, now = stamp_();
      d.id = newId_('d');
      d.meta = d.meta || {};
      d.meta.createdAt = now; d.meta.updatedAt = now; d.meta.imported = true;
      if (d.status === 'DRAFT') { d.number = ''; }
      else {
        var f = PB.fy(d.date);
        d.fy = f.long;
        d.numbering = { mode: 'manual', number: d.number };
        d.firm = s.firm; d.bank = s.bank; d.sign = s.sign;
        d.meta.finalisedAt = now;
        if (d.status === 'CANCELLED') { d.meta.cancelledAt = now; d.meta.cancelReason = String(x.src.cancelReason || '').trim() || 'Cancelled (recorded from import)'; }
        bumpSeries_(s, d.type, f, d.number);
      }
      d.calc = calcFor_(d);
      writeDoc_(0, d);
      var row = findRow_('Documents', d.id); row.source = 'import'; writeRow_('Documents', row._row, row);
      if (d.type === 'INV' && d.status !== 'DRAFT') writeRegister_(d);
      out.push(docSummary_(findRow_('Documents', d.id)));
    });
    log_('import', '', out.length + ' documents');
  } finally {
    lock.releaseLock();
  }
  return { summaries: out, series: seriesStatus_() };
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
    json3: json.slice(JSON_CHUNK * 2, JSON_CHUNK * 3), json4: json.slice(JSON_CHUNK * 3),
    amendedAt: meta.amendedAt || '', source: old.source || ''
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
    emailedAt: r.emailedAt, updatedAt: r.updatedAt, finalisedAt: r.finalisedAt, cancelReason: r.cancelReason, amendedAt: r.amendedAt || '',
    imported: r.source === 'import' };
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
      sgst: PB.r2(b.sgst), invoiceValue: doc.calc.payable, status: doc.status === 'CANCELLED' ? 'CANCELLED' : 'FINAL', docId: doc.id });
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
function numberFor_(s, type, f, n) {
  return PB.formatNumber(s.series[type].prefix, PB.fyTag(f, s.series.fyStyle), n, +s.series.pad || 4);
}
function sameNo_(a, b) { return String(a || '').trim().toUpperCase() === String(b || '').trim().toUpperCase(); }
/** The final document of this type and year that uses this number, if any. */
function liveNumber_(type, number, f, exceptId) {
  var hit = null;
  rows_('Documents').forEach(function (d) {
    if (d.type === type && d.status === 'FINAL' && d.id !== exceptId && sameNo_(d.number, number) && PB.fy(d.date).long === f.long) hit = d;
  });
  return hit;
}
function splitList_(v) {
  var seen = {}, out = [];
  String(v || '').split(/[\n,;]+/).forEach(function (x) { x = x.trim(); if (x && !seen[x.toUpperCase()]) { seen[x.toUpperCase()] = 1; out.push(x); } });
  return out;
}
/** Numbers that may be given again: listed in Settings, or cancelled in this app, and not used by a final document. */
function reusable_(s, type, f) {
  var list = splitList_(s.series[type].reuse).filter(function (n) {
    return PB.seqOf(n, s.series[type].prefix, f) != null || n.indexOf(f.compact) >= 0 || n.indexOf(f.short) >= 0;
  });
  rows_('Documents').forEach(function (d) {
    if (d.type === type && d.status === 'CANCELLED' && d.number && PB.fy(d.date).long === f.long) list.push(d.number);
  });
  var seen = {};
  return list.filter(function (n) { var k = n.toUpperCase(); if (seen[k]) return false; seen[k] = 1; return !liveNumber_(type, n, f, ''); })
    .sort(function (a, b) { return (PB.seqOf(a, s.series[type].prefix, f) || 0) - (PB.seqOf(b, s.series[type].prefix, f) || 0) || a.localeCompare(b); });
}
function dropReuse_(type, number) {
  var key = 'series.' + type + '.reuse', raw = settingsRaw_();
  var left = splitList_(raw[key]).filter(function (n) { return !sameNo_(n, number); });
  var o = {}; o[key] = left.join(', '); saveSettingsRaw_(o);
}
function checkTypedNumber_(type, number, f, exceptId) {
  if (!number) throw new Error('Type the number, or choose “Next in series”.');
  if (number.length > 30) throw new Error('That number is too long.');
  if (type === 'INV') { var e = PB.checkInvoiceNumber(number); if (e) throw new Error(e); }
  var clash = liveNumber_(type, number, f, exceptId);
  if (clash) throw new Error('Number ' + clash.number + ' is already used by a final ' + PB.TYPES[type].short.toLowerCase() + ' (' + clash.partyName + ', ' + PB.prettyDate(clash.date) + ').');
}
/** Picks the number for a document being finalised. */
function pickNumber_(s, doc, f, exceptId) {
  var mode = (doc.numbering && doc.numbering.mode) || 'auto';
  var typed = String((doc.numbering && doc.numbering.number) || '').trim();
  if (mode === 'reuse') {
    var free = reusable_(s, doc.type, f).filter(function (n) { return sameNo_(n, typed); })[0];
    if (!free) throw new Error('Number ' + (typed || '(none)') + ' is no longer free to give again. Choose another number.');
    checkTypedNumber_(doc.type, free, f, exceptId);
    return { mode: 'reuse', number: free };
  }
  if (mode === 'manual') {
    checkTypedNumber_(doc.type, typed, f, exceptId);
    return { mode: 'manual', number: typed };
  }
  var next = (+seriesRow_(doc.type, f.short).last || 0) + 1;
  var number = numberFor_(s, doc.type, f, next);
  var taken = function (no) { return rows_('Documents').some(function (d) { return d.type === doc.type && d.status !== 'DRAFT' && sameNo_(d.number, no) && PB.fy(d.date).long === f.long; }); };
  while (taken(number)) { next++; number = numberFor_(s, doc.type, f, next); }
  if (doc.type === 'INV') { var e = PB.checkInvoiceNumber(number); if (e) throw new Error(e); }
  return { mode: 'auto', number: number };
}
/** The series continues after the highest number recorded in it (auto, typed, imported). */
function bumpSeries_(s, type, f, number) {
  var seq = PB.seqOf(number, s.series[type].prefix, f);
  if (seq == null) return;
  var row = seriesRow_(type, f.short);
  if (seq > (+row.last || 0)) writeSeries_(row, seq);
}
function maxUsed_(type, fyShort) {
  var s = settings_(), max = 0;
  rows_('Documents').forEach(function (d) {
    if (d.type !== type || !d.number || d.status === 'DRAFT') return;
    var f = PB.fy(d.date);
    if (f.short !== fyShort) return;
    var seq = PB.seqOf(d.number, s.series[type].prefix, f);
    if (seq != null && seq > max) max = seq;
  });
  return max;
}
function seriesStatus_() {
  var s = settings_();
  var cur = PB.fy(PB.today());
  var out = {};
  Object.keys(PB.TYPES).forEach(function (t) {
    var r = seriesRow_(t, cur.short);
    out[t] = { fy: cur.short, fyLong: cur.long, last: +r.last || 0, next: numberFor_(s, t, cur, (+r.last || 0) + 1), reuse: reusable_(s, t, cur) };
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
/** Adds header cells for columns added in later versions (e.g. Documents: amendedAt, source). */
function ensureHeaders_() {
  Object.keys(SHEETS).forEach(function (name) {
    var sh = sheet_(name), h = SHEETS[name];
    var have = sh.getRange(1, 1, 1, h.length).getValues()[0];
    if (have.some(function (v, i) { return String(v) !== h[i]; })) {
      sh.getRange(1, 1, 1, h.length).setNumberFormat('@').setValues([h]).setFontWeight('bold').setBackground('#E4EDF7');
    }
  });
}
function cleanErr_(e) { return String((e && e.message) || e).replace(/^Error:\s*/, ''); }
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
