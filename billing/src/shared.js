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
