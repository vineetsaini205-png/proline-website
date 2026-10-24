/*
 * Proline Billing — PDF layout (pdfmake 0.2.x document definitions).
 * Used in the browser (Index.html) and by billing/test/pdf.test.mjs to render samples.
 * Depends on PB (shared.js).
 */
var PBPDF = (function () {
  'use strict';
  var C = {
    navy: '#0B2545', green: '#13B26B', greenText: '#0B7D4A', ink: '#0B2545', body: '#33435A', muted: '#5A6B82',
    line: '#D5DFEA', soft: '#F3F7FB', navy50: '#E4EDF7', green50: '#E3F4EB', red: '#B42318', white: '#FFFFFF'
  };
  var LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="#0B2545"/><path d="M22.5 7 L11 22.5 H19 L17.5 33 L29 17.5 H21 Z" fill="#13B26B"/></svg>';
  var PAGE_W = 595.28, M = 34, W = PAGE_W - 2 * M;

  var LABELS = {
    INV: { title: 'TAX INVOICE', no: 'Invoice No.', party: 'BILL TO', ship: 'SHIP TO / SITE', details: 'INVOICE DETAILS' },
    PI: { title: 'PROFORMA INVOICE', no: 'Proforma No.', party: 'BILL TO', ship: 'SHIP TO / SITE', details: 'DETAILS' },
    PO: { title: 'PURCHASE ORDER', no: 'PO No.', party: 'VENDOR', ship: 'DELIVER TO', details: 'ORDER DETAILS' }
  };

  function t(s) { return s == null ? '' : String(s); }
  function m(x) { return PB.money(x); }
  function label(text) { return { text: text, fontSize: 6.8, bold: true, color: C.greenText, characterSpacing: 0.8, margin: [0, 0, 0, 3] }; }
  function lines(arr) { return arr.filter(function (x) { return x !== null && x !== undefined && x !== ''; }); }
  function addr(o) {
    if (!o) return [];
    var cityLine = [t(o.city), t(o.pin)].filter(Boolean).join(' – ');
    var state = o.stateCode ? PB.stateName(o.stateCode) + ' (' + o.stateCode + ')' : '';
    return lines([t(o.address), cityLine, state]).map(function (l) { return { text: l }; });
  }

  /** Thin table lines. */
  var thin = {
    hLineWidth: function () { return 0.6; }, vLineWidth: function () { return 0.6; },
    hLineColor: function () { return C.line; }, vLineColor: function () { return C.line; },
    paddingLeft: function () { return 7; }, paddingRight: function () { return 7; },
    paddingTop: function () { return 5; }, paddingBottom: function () { return 5; }
  };
  var noLines = {
    hLineWidth: function () { return 0; }, vLineWidth: function () { return 0; },
    paddingLeft: function () { return 0; }, paddingRight: function () { return 0; },
    paddingTop: function () { return 1.5; }, paddingBottom: function () { return 1.5; }
  };
  function zebra(headerRows) {
    return {
      hLineWidth: function (i, node) { return i === headerRows || i === node.table.body.length ? 0.8 : 0.4; },
      vLineWidth: function () { return 0; },
      hLineColor: function (i) { return i === headerRows ? C.navy : C.line; },
      fillColor: function (i) { return i < headerRows ? C.navy : (i % 2 === 0 ? C.soft : null); },
      paddingLeft: function () { return 5; }, paddingRight: function () { return 5; },
      paddingTop: function () { return 4.5; }, paddingBottom: function () { return 4.5; }
    };
  }

  function header(doc, firm, images, copyLabel) {
    var L = LABELS[doc.type];
    var logo = images && images.logo ? { image: images.logo, fit: [52, 52] } : { svg: LOGO_SVG, width: 44 };
    var firmLines = lines([
      firm.legalName && firm.tradeName && firm.legalName !== firm.tradeName ? { text: firm.legalName, fontSize: 8, color: C.muted } : null,
      firm.address1 ? { text: firm.address1 } : null,
      firm.address2 ? { text: firm.address2 } : null,
      (firm.city || firm.pin || firm.stateCode) ? { text: lines([t(firm.city), t(firm.pin)]).join(' – ') + (firm.stateCode ? (firm.city || firm.pin ? ', ' : '') + PB.stateName(firm.stateCode) + ' (' + firm.stateCode + ')' : '') } : null,
      firm.gstin || firm.pan ? { text: lines([firm.gstin ? 'GSTIN ' + firm.gstin : '', firm.pan ? 'PAN ' + firm.pan : '', firm.udyam ? 'Udyam ' + firm.udyam : '']).join('   ·   '), bold: true, color: C.ink, margin: [0, 2, 0, 0] } : null,
      (firm.phone || firm.email) ? { text: lines([t(firm.phone), t(firm.email)]).join('   ·   '), color: C.muted } : null,
      firm.website ? { text: t(firm.website), color: C.muted } : null
    ]);
    var meta = [[{ text: L.no, color: C.muted }, { text: doc.number || 'DRAFT', bold: true, color: C.ink, alignment: 'right' }],
      [{ text: 'Date', color: C.muted }, { text: PB.prettyDate(doc.date), alignment: 'right', color: C.ink }]];
    var r = doc.refs || {};
    if (doc.type === 'INV' && r.dueDate) meta.push([{ text: 'Due date', color: C.muted }, { text: PB.prettyDate(r.dueDate), alignment: 'right', color: C.ink }]);
    if (doc.type === 'PI' && r.validTill) meta.push([{ text: 'Valid till', color: C.muted }, { text: PB.prettyDate(r.validTill), alignment: 'right', color: C.ink }]);
    if (doc.type === 'PO' && r.deliveryDate) meta.push([{ text: 'Deliver by', color: C.muted }, { text: PB.prettyDate(r.deliveryDate), alignment: 'right', color: C.ink }]);
    return {
      columns: [
        { width: 56, stack: [logo] },
        { width: '*', stack: [{ text: firm.tradeName || firm.legalName || '', fontSize: 15.5, bold: true, color: C.navy, margin: [0, 1, 0, 3] }].concat(firmLines), fontSize: 7.8, lineHeight: 1.25 },
        { width: 178, stack: lines([
          { text: L.title, fontSize: 15.5, bold: true, color: C.navy, alignment: 'right', characterSpacing: 1.2 },
          copyLabel ? { text: copyLabel.toUpperCase(), fontSize: 6.8, bold: true, color: C.greenText, alignment: 'right', characterSpacing: 0.8, margin: [0, 2, 0, 0] } : null,
          doc.type === 'PI' ? { text: 'Not a tax invoice', fontSize: 7, color: C.muted, alignment: 'right', margin: [0, 2, 0, 0] } : null,
          { margin: [0, 7, 0, 0], table: { widths: [62, '*'], body: meta }, layout: noLines, fontSize: 8.3 }
        ]) }
      ],
      columnGap: 10
    };
  }

  function rule() {
    return { canvas: [{ type: 'rect', x: 0, y: 0, w: W * 0.72, h: 2.4, color: C.navy }, { type: 'rect', x: W * 0.72, y: 0, w: W * 0.28, h: 2.4, color: C.green }], margin: [0, 10, 0, 10] };
  }

  function partyBlock(doc, firm) {
    var L = LABELS[doc.type], p = doc.party || {}, r = doc.refs || {};
    var party = [label(L.party), { text: t(p.legalName || p.name), bold: true, fontSize: 9.5, color: C.ink, margin: [0, 0, 0, 2] }]
      .concat(p.legalName && p.legalName !== p.name ? [{ text: p.name, color: C.muted }] : [])
      .concat(addr(p))
      .concat(p.gstin ? [{ text: 'GSTIN ' + p.gstin, bold: true, color: C.ink, margin: [0, 2, 0, 0] }] : [{ text: doc.type === 'PO' ? 'Unregistered vendor' : 'Unregistered (no GSTIN)', color: C.muted, margin: [0, 2, 0, 0] }])
      .concat(p.contact || p.phone ? [{ text: lines([t(p.contact), t(p.phone)]).join(', '), color: C.muted }] : []);
    var ship = [label(L.ship)];
    var st = doc.shipTo || { same: true };
    if (st.same) {
      if (doc.type === 'PO') ship = ship.concat([{ text: firm.tradeName || firm.legalName, bold: true, color: C.ink }]).concat(addr({ address: lines([firm.address1, firm.address2]).join(', '), city: firm.city, pin: firm.pin, stateCode: firm.stateCode }));
      else ship.push({ text: 'Same as bill to', color: C.muted });
    } else {
      ship = ship.concat([{ text: t(st.name), bold: true, color: C.ink }]).concat(addr(st)).concat(st.gstin ? [{ text: 'GSTIN ' + st.gstin, bold: true, color: C.ink }] : []);
    }
    var d = [];
    var row = function (k, v) { if (v) d.push([{ text: k, color: C.muted }, { text: v, color: C.ink }]); };
    row('Place of supply', doc.pos && doc.pos.code ? PB.stateName(doc.pos.code) + ' (' + doc.pos.code + ')' : '');
    if (doc.type !== 'PO') row('Reverse charge', doc.reverseCharge ? 'Yes' : 'No');
    if (doc.type === 'INV') {
      row('Customer PO', lines([t(r.poNumber), r.poDate ? 'dated ' + PB.prettyDate(r.poDate) : '']).join(' '));
      row('Proforma ref.', t(r.piNumber));
      row('E-way bill', t(r.eWayBill));
      row('Vehicle no.', t(r.vehicleNo));
    }
    if (doc.type === 'PI') { row('Delivery', t(r.deliveryPeriod)); row('Payment terms', t(r.paymentTerms)); row('Your ref.', t(r.poNumber)); }
    if (doc.type === 'PO') { row('Quotation ref.', t(r.quoteRef)); row('Payment terms', t(r.paymentTerms)); row('Delivery terms', t(r.deliveryTerms)); }
    var details = [label(L.details), { table: { widths: [66, '*'], body: d.length ? d : [[{ text: '' }, { text: '' }]] }, layout: noLines }];
    return {
      table: { widths: ['*', '*', 196], body: [[{ stack: party }, { stack: ship }, { stack: details }]] },
      layout: {
        hLineWidth: function () { return 0.6; }, vLineWidth: function (i) { return i === 0 || i === 3 ? 0.6 : 0.6; },
        hLineColor: function () { return C.line; }, vLineColor: function () { return C.line; },
        paddingLeft: function () { return 8; }, paddingRight: function () { return 8; }, paddingTop: function () { return 7; }, paddingBottom: function () { return 7; }
      },
      fontSize: 8, lineHeight: 1.2
    };
  }

  function itemsTable(calc) {
    var hasDisc = calc.lines.some(function (l) { return l.discountPct > 0; });
    var head = ['#', 'Item and description', 'HSN/SAC', 'Qty', 'Rate (₹)'].concat(hasDisc ? ['Disc %'] : []).concat(['Taxable (₹)', 'GST %', 'Amount (₹)']);
    var right = { 'Qty': 1, 'Rate (₹)': 1, 'Disc %': 1, 'Taxable (₹)': 1, 'GST %': 1, 'Amount (₹)': 1 };
    var body = [head.map(function (h) { return { text: h, bold: true, color: C.white, fontSize: 7.2, alignment: right[h] ? 'right' : 'left' }; })];
    calc.lines.forEach(function (l) {
      var desc = [{ text: l.name, bold: true, color: C.ink }];
      if (l.description) desc.push({ text: l.description, fontSize: 7.3, color: C.muted, margin: [0, 1, 0, 0] });
      var row = [{ text: String(l.n), color: C.muted }, { stack: desc }, { text: l.hsn }, { text: fmtQty(l.qty) + (l.unit ? ' ' + l.unit : ''), alignment: 'right' },
        { text: m(l.rate), alignment: 'right' }];
      if (hasDisc) row.push({ text: l.discountPct ? fmtQty(l.discountPct) : '–', alignment: 'right' });
      row.push({ text: m(l.taxable), alignment: 'right' }, { text: fmtQty(l.gstRate) + '%', alignment: 'right' }, { text: m(l.total), alignment: 'right', bold: true, color: C.ink });
      body.push(row);
    });
    var widths = [14, '*', 44, 40, 52].concat(hasDisc ? [28] : []).concat([58, 28, 60]);
    return { table: { headerRows: 1, widths: widths, body: body, dontBreakRows: true }, layout: zebra(1), fontSize: 8, margin: [0, 12, 0, 0] };
  }
  function fmtQty(q) { return (Math.round(q * 1000) / 1000).toString(); }

  function hsnTable(calc) {
    var intra = calc.intra, s = calc.sgstLabel;
    var head = intra ? ['HSN/SAC', 'Taxable (₹)', 'CGST', '₹', s, '₹', 'Total tax (₹)'] : ['HSN/SAC', 'Taxable (₹)', 'IGST', '₹', 'Total tax (₹)'];
    var body = [head.map(function (h, i) { return { text: h, bold: true, color: C.ink, fillColor: C.navy50, alignment: i ? 'right' : 'left' }; })];
    calc.hsnSummary.forEach(function (h) {
      var r = [{ text: h.hsn || '–' }, { text: m(h.taxable), alignment: 'right' }];
      if (intra) r.push({ text: fmtQty(h.rate / 2) + '%', alignment: 'right' }, { text: m(h.cgst), alignment: 'right' }, { text: fmtQty(h.rate / 2) + '%', alignment: 'right' }, { text: m(h.sgst), alignment: 'right' });
      else r.push({ text: fmtQty(h.rate) + '%', alignment: 'right' }, { text: m(h.igst), alignment: 'right' });
      r.push({ text: m(h.tax), alignment: 'right' });
      body.push(r);
    });
    var widths = intra ? ['*', 50, 24, 38, 24, 38, 46] : ['*', 58, 28, 50, 56];
    return { table: { widths: widths, body: body }, layout: { hLineWidth: function () { return 0.5; }, vLineWidth: function () { return 0; }, hLineColor: function () { return C.line; }, paddingLeft: function () { return 4; }, paddingRight: function () { return 4; }, paddingTop: function () { return 3; }, paddingBottom: function () { return 3; } }, fontSize: 7, margin: [0, 6, 0, 0] };
  }

  function totalsTable(calc) {
    var b = [];
    var row = function (k, v, opt) { b.push([{ text: k, color: C.muted }, { text: v, alignment: 'right', color: C.ink, bold: !!(opt && opt.bold) }]); };
    if (calc.discount > 0) { row('Gross amount', m(calc.gross)); row('Discount', '- ' + m(calc.discount)); }
    row('Taxable value', m(calc.taxable));
    if (calc.intra) { row('CGST', m(calc.cgst)); row(calc.sgstLabel, m(calc.sgst)); } else row('IGST', m(calc.igst));
    if (calc.roundOff) row('Round off', (calc.roundOff > 0 ? '+ ' : '- ') + m(Math.abs(calc.roundOff)));
    var t1 = { table: { widths: ['*', 'auto'], body: b }, layout: { hLineWidth: function (i) { return i === 0 ? 0 : 0.5; }, vLineWidth: function () { return 0; }, hLineColor: function () { return C.line; }, paddingLeft: function () { return 8; }, paddingRight: function () { return 8; }, paddingTop: function () { return 4; }, paddingBottom: function () { return 4; } }, fontSize: 8.3 };
    var t2 = { table: { widths: ['*', 'auto'], body: [[{ text: 'Total', bold: true, color: C.white, fontSize: 10 }, { text: '₹ ' + m(calc.payable), bold: true, color: C.white, fontSize: 12, alignment: 'right' }]] },
      layout: { hLineWidth: function () { return 0; }, vLineWidth: function () { return 0; }, fillColor: function () { return C.navy; }, paddingLeft: function () { return 8; }, paddingRight: function () { return 8; }, paddingTop: function () { return 7; }, paddingBottom: function () { return 7; } } };
    return { stack: [t1, t2] };
  }

  function bankBlock(doc, bank, calc, settings) {
    if (doc.type === 'PO' || !bank) return null;
    var rows = [];
    var r = function (k, v) { if (v) rows.push([{ text: k, color: C.muted }, { text: v, color: C.ink, bold: k === 'A/c no.' }]); };
    r('Bank', bank.name); r('A/c name', bank.accountName); r('A/c no.', bank.accountNo); r('IFSC', bank.ifsc); r('Branch', bank.branch); r('UPI', bank.upi);
    if (!rows.length) return null;
    var cols = [{ width: '*', stack: [label('PAY TO'), { table: { widths: [44, '*'], body: rows }, layout: noLines, fontSize: 7.8 }] }];
    if (bank.upi && (!settings || !settings.pdf || settings.pdf.showUpiQr !== 'no') && calc.payable > 0 && doc.status === 'FINAL') {
      var payee = encodeURIComponent((doc.firm && (doc.firm.tradeName || doc.firm.legalName)) || '');
      var note = encodeURIComponent((doc.type === 'INV' ? 'Invoice ' : 'Proforma ') + (doc.number || ''));
      var upi = 'upi://pay?pa=' + encodeURIComponent(bank.upi) + '&pn=' + payee + '&am=' + calc.payable.toFixed(2) + '&cu=INR&tn=' + note;
      cols.push({ width: 74, stack: [{ qr: upi, fit: 66, foreground: C.navy, alignment: 'center' }, { text: 'Scan to pay by UPI', fontSize: 6.5, color: C.muted, alignment: 'center', margin: [0, 2, 0, 0] }] });
    }
    return { columns: cols, columnGap: 8, margin: [0, 10, 0, 0] };
  }

  function signBlock(doc, firm, sign, images) {
    var st = [{ text: 'For ' + (firm.tradeName || firm.legalName || ''), bold: true, color: C.ink, alignment: 'right', fontSize: 8.3 }];
    if (images && images.signature) st.push({ image: images.signature, fit: [130, 46], alignment: 'right', margin: [0, 4, 0, 2] });
    else st.push({ text: ' ', margin: [0, 26, 0, 0] });
    st.push({ canvas: [{ type: 'line', x1: 30, y1: 0, x2: 170, y2: 0, lineWidth: 0.6, lineColor: C.line }], alignment: 'right' });
    st.push({ text: 'Authorised signatory', fontSize: 7.3, color: C.muted, alignment: 'right', margin: [0, 3, 0, 0] });
    if (sign && sign.name) st.push({ text: sign.name + (sign.designation ? ', ' + sign.designation : ''), fontSize: 7.3, color: C.ink, alignment: 'right' });
    return { stack: st };
  }

  function notesTerms(doc) {
    var out = [];
    if (doc.notes) out.push({ text: doc.notes, fontSize: 8, color: C.body, margin: [0, 0, 0, 6] });
    if (doc.terms) out.push(label('TERMS AND CONDITIONS'), { text: doc.terms, fontSize: 7.2, color: C.muted, lineHeight: 1.25 });
    return out;
  }

  function copyContent(doc, calc, firm, bank, sign, settings, images, copyLabel) {
    var left = [label('AMOUNT IN WORDS'), { text: calc.words, bold: true, color: C.ink, fontSize: 8.2 }];
    if (calc.tax > 0) left.push({ text: ' ', fontSize: 4 }, label('TAX SUMMARY'), hsnTable(calc));
    var bankB = bankBlock(doc, bank, calc, settings);
    if (bankB) left.push(bankB);
    var right = [totalsTable(calc), { margin: [0, 18, 0, 0], stack: [signBlock(doc, firm, sign, images)] }];
    var c = [
      header(doc, firm, images, copyLabel),
      rule(),
      partyBlock(doc, firm),
      itemsTable(calc),
      { columns: [{ width: '*', stack: left }, { width: 196, stack: right }], columnGap: 18, margin: [0, 12, 0, 0], unbreakable: true }
    ];
    var nt = notesTerms(doc);
    if (nt.length) c.push({ stack: nt, margin: [0, 14, 0, 0] });
    if (doc.type === 'PO') c.push({ margin: [0, 16, 0, 0], text: 'Accepted by the vendor (signature and stamp): ______________________________', fontSize: 7.5, color: C.muted });
    if (doc.status === 'CANCELLED' && doc.meta && doc.meta.cancelReason) {
      c.splice(2, 0, { text: 'CANCELLED on ' + PB.prettyDate(String(doc.meta.cancelledAt || '').slice(0, 10)) + ': ' + doc.meta.cancelReason, color: C.red, bold: true, fontSize: 8.5, margin: [0, 0, 0, 8] });
    }
    return c;
  }

  function annexureContent(doc) {
    var a = doc.annexure || {};
    var L = LABELS[doc.type];
    var out = [
      { text: (a.title || 'Annexure A').toUpperCase(), fontSize: 13, bold: true, color: C.navy, characterSpacing: 0.6, pageBreak: 'before' },
      { text: 'to ' + PB.TYPES[doc.type].title + ' ' + (doc.number || '(draft)') + ' dated ' + PB.prettyDate(doc.date) + (doc.party && doc.party.name ? ' · ' + doc.party.name : ''), fontSize: 8, color: C.muted, margin: [0, 3, 0, 0] },
      rule()
    ];
    if (a.intro) out.push({ text: a.intro, fontSize: 8.5, margin: [0, 0, 0, 8] });
    var rows = (a.rows || []).filter(function (r) { return r && (r.description || r.spec || r.qty || r.remarks); });
    if (rows.length) {
      var body = [['S. No.', 'Description', 'Specification / details', 'Qty', 'Unit', 'Remarks'].map(function (h, i) { return { text: h, bold: true, color: C.white, fontSize: 7.2, alignment: i === 3 ? 'right' : 'left' }; })];
      rows.forEach(function (r, i) {
        body.push([{ text: String(i + 1), color: C.muted }, { text: t(r.description), bold: true, color: C.ink }, { text: t(r.spec) }, { text: t(r.qty), alignment: 'right' }, { text: t(r.unit) }, { text: t(r.remarks), color: C.muted }]);
      });
      out.push({ table: { headerRows: 1, widths: [26, 120, '*', 34, 34, 90], body: body, dontBreakRows: true }, layout: zebra(1), fontSize: 8 });
    }
    if (a.notes) out.push({ text: a.notes, fontSize: 8, color: C.body, margin: [0, 10, 0, 0], lineHeight: 1.3 });
    void L;
    return out;
  }

  /**
   * doc: the document; calc: PB.compute(doc, …); settings: app settings (used for drafts);
   * images: { logo, signature } data URLs; opts.watermark: 'DRAFT' | 'CANCELLED'.
   */
  function build(doc, calc, settings, images, opts) {
    opts = opts || {};
    var firm = doc.firm || settings.firm || {};
    var bank = doc.bank || settings.bank || {};
    var sign = doc.sign || settings.sign || {};
    var copies = [doc.type === 'INV' ? 'Original for recipient' : null];
    if (doc.type === 'INV' && doc.status !== 'DRAFT') {
      var anyGoods = (doc.items || []).some(function (i) { return i.type !== 'Service'; });
      var mode = (settings.pdf && settings.pdf.copies) || 'Original';
      copies = ['Original for recipient'];
      if (/Duplicate/.test(mode)) copies.push(anyGoods ? 'Duplicate for transporter' : 'Duplicate for supplier');
      if (/Triplicate/.test(mode) && anyGoods) copies.push('Triplicate for supplier');
    }
    var content = [];
    copies.forEach(function (cl, i) {
      var part = copyContent(doc, calc, firm, bank, sign, settings, images, cl);
      if (i > 0) part[0] = { stack: [part[0]], pageBreak: 'before' };
      content = content.concat(part);
    });
    if (doc.annexure && doc.annexure.enabled) content = content.concat(annexureContent(doc));
    var dd = {
      pageSize: 'A4',
      pageMargins: [M, M, M, 44],
      info: { title: PB.TYPES[doc.type].title + ' ' + (doc.number || 'draft'), author: firm.tradeName || firm.legalName || '', creator: 'Proline Billing' },
      content: content,
      defaultStyle: { font: 'Roboto', fontSize: 8.5, color: C.body, lineHeight: 1.15 },
      footer: function (page, pages) {
        return { margin: [M, 14, M, 0], columns: [
          { text: 'Computer-generated document' + (doc.number ? ' · ' + doc.number : ''), fontSize: 6.8, color: C.muted },
          { text: t(firm.website), fontSize: 6.8, color: C.muted, alignment: 'center' },
          { text: 'Page ' + page + ' of ' + pages, fontSize: 6.8, color: C.muted, alignment: 'right' }
        ] };
      }
    };
    if (opts.watermark) dd.watermark = { text: opts.watermark, color: opts.watermark === 'CANCELLED' ? C.red : '#8A99AD', opacity: 0.09, bold: true, fontSize: 96, angle: -40 };
    return dd;
  }

  function fileName(doc) {
    return (doc.number || ('DRAFT ' + PB.TYPES[doc.type].short)).replace(/[\/\\]/g, '-') + ' ' + String((doc.party && doc.party.name) || '').replace(/[\\\/:*?"<>|]/g, '').slice(0, 50) + '.pdf';
  }

  return { build: build, fileName: fileName, COLORS: C, LOGO_SVG: LOGO_SVG };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = PBPDF;
