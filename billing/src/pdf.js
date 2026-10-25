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
  // The owner's Charge-O logo (horizontal, colour version; master copy in src/assets/logo/). Used when no logo is uploaded.
  var LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="251.23" height="63.76" viewBox="0 0 251.23 63.76"><path d="M37.59 40.68V0.35H54.19Q59.4 0.35 63.18 1.91Q66.96 3.47 68.99 6.51Q71.01 9.55 71.01 14.05V14.92Q71.01 19.42 68.99 22.38Q67.01 25.17 63.62 26.7L73.42 40.68H61.7L53.59 28.4H47.78V40.68ZM0 40.68V0.35H15.4Q20.55 0.35 24.3 2.07Q28.05 3.8 30.08 7.03Q32.11 10.27 32.11 14.76V15.64Q32.11 20.07 30.08 23.31Q28.05 26.54 24.3 28.29Q20.55 30.05 15.4 30.05H10.19V40.68ZM47.78 8.9V20.57H54.79Q56.6 20.57 57.92 19.85Q59.23 19.14 59.97 17.83Q60.71 16.51 60.71 14.76Q60.71 12.95 59.97 11.64Q59.23 10.32 57.92 9.61Q56.6 8.9 54.79 8.9ZM10.19 9.12V21.28H15.67Q17.53 21.28 18.9 20.54Q20.27 19.8 21.04 18.43Q21.81 17.06 21.81 15.2Q21.81 13.28 21.04 11.91Q20.27 10.54 18.9 9.83Q17.53 9.12 15.67 9.12Z" fill="#0B2545"/><path d="M176.55 40.68V0.68H193.26L206.58 32.57H207.4V0.68H216.93V40.68H200.11L186.79 8.79H185.97V40.68ZM225.59 40.68V0.68H250.9V9.01H235.45V16.18H250.08V24.51H235.45V32.35H251.23V40.68ZM126.14 40.68V0.68H136.33V31.8H151.45V40.68ZM157.59 40.68V0.68H167.78V40.68Z" fill="#0B2545"/><path d="M118.48 20.62C118.48 32.01 109.25 41.24 97.86 41.24C86.47 41.24 77.24 32.01 77.24 20.62C77.24 9.23 86.47 0 97.86 0C109.25 0 118.48 9.23 118.48 20.62ZM109.72 20.62C109.72 14.07 104.41 8.76 97.86 8.76C91.31 8.76 86.01 14.07 86.01 20.62C86.01 27.17 91.31 32.48 97.86 32.48C104.41 32.48 109.72 27.17 109.72 20.62Z" fill="#13B26B"/><path d="M99.33 10.42 92.48 22.25H97.13L95.42 30.82L103.25 18.58H98.6L100.8 10.42Z" fill="#0B2545"/><path d="M195.01 63.76Q193.55 63.76 192.48 63.24Q191.4 62.72 190.7 61.89Q190 61.05 189.65 60.08Q189.3 59.11 189.3 58.21V57.88Q189.3 56.89 189.66 55.91Q190.01 54.93 190.73 54.13Q191.45 53.33 192.51 52.85Q193.58 52.37 195.01 52.37Q196.43 52.37 197.5 52.85Q198.56 53.33 199.28 54.13Q200 54.93 200.35 55.91Q200.71 56.89 200.71 57.88V58.21Q200.71 59.11 200.36 60.08Q200.01 61.05 199.31 61.89Q198.61 62.72 197.53 63.24Q196.46 63.76 195.01 63.76ZM169.7 63.48 166.95 52.68H169.12L171.28 61.73H171.68L173.37 53.09H175.65L177.6 61.73H178L179.89 52.68H181.95L179.49 63.48H176.15L174.49 56.29L172.98 63.48ZM78.95 63.48V52.6H82.96Q84.26 52.6 85.21 52.99Q86.17 53.37 86.68 54.16Q87.2 54.94 87.2 56.12V56.36Q87.2 57.56 86.68 58.33Q86.15 59.1 85.2 59.48L85.12 59.51L88 63.48H85.54L83 59.87H81.05V63.48ZM209.23 63.48V52.6H213.24Q214.54 52.6 215.5 52.99Q216.45 53.37 216.97 54.16Q217.49 54.94 217.49 56.12V56.36Q217.49 57.56 216.96 58.33Q216.44 59.1 215.49 59.48L215.4 59.51L218.28 63.48H215.83L213.28 59.87H211.33V63.48ZM124.56 63.48 128.24 52.68H131.68L135.46 63.48H133.3L132.31 60.61H127.61L126.66 63.48ZM50.07 63.76Q48.6 63.76 47.55 63.24Q46.5 62.72 45.84 61.89Q45.18 61.07 44.87 60.09Q44.56 59.11 44.56 58.21V57.88Q44.56 56.88 44.88 55.9Q45.2 54.93 45.86 54.13Q46.53 53.33 47.56 52.85Q48.59 52.37 49.99 52.37Q51.46 52.37 52.54 52.89Q53.63 53.42 54.28 54.37Q54.93 55.32 55.07 56.6H52.95Q52.83 55.86 52.43 55.35Q52.02 54.84 51.4 54.58Q50.78 54.32 49.99 54.32Q49.19 54.32 48.57 54.59Q47.95 54.87 47.54 55.37Q47.12 55.87 46.91 56.55Q46.69 57.23 46.69 58.06Q46.69 58.86 46.91 59.54Q47.12 60.22 47.55 60.73Q47.98 61.24 48.61 61.52Q49.24 61.8 50.07 61.8Q51.28 61.8 52.12 61.21Q52.95 60.61 53.13 59.53H55.24Q55.1 60.68 54.46 61.64Q53.82 62.6 52.71 63.18Q51.6 63.76 50.07 63.76ZM112.28 63.76Q110.81 63.76 109.76 63.24Q108.71 62.72 108.06 61.89Q107.4 61.07 107.09 60.09Q106.78 59.11 106.78 58.21V57.88Q106.78 56.88 107.09 55.9Q107.41 54.93 108.08 54.13Q108.74 53.33 109.77 52.85Q110.8 52.37 112.2 52.37Q113.67 52.37 114.76 52.89Q115.84 53.42 116.5 54.37Q117.15 55.32 117.28 56.6H115.16Q115.05 55.86 114.64 55.35Q114.23 54.84 113.61 54.58Q112.99 54.32 112.2 54.32Q111.41 54.32 110.78 54.59Q110.16 54.87 109.75 55.37Q109.33 55.87 109.12 56.55Q108.91 57.23 108.91 58.06Q108.91 58.86 109.12 59.54Q109.33 60.22 109.76 60.73Q110.19 61.24 110.82 61.52Q111.45 61.8 112.28 61.8Q113.49 61.8 114.33 61.21Q115.16 60.61 115.34 59.53H117.46Q117.31 60.68 116.67 61.64Q116.04 62.6 114.93 63.18Q113.82 63.76 112.28 63.76ZM246.87 63.76Q245.43 63.76 244.45 63.3Q243.47 62.84 242.95 62.03Q242.43 61.23 242.43 60.21H244.49Q244.49 60.64 244.72 61.04Q244.96 61.45 245.49 61.7Q246.01 61.95 246.87 61.95Q247.64 61.95 248.16 61.73Q248.67 61.51 248.92 61.15Q249.18 60.78 249.18 60.33Q249.18 59.75 248.69 59.4Q248.2 59.05 247.18 58.96L246.23 58.89Q244.68 58.76 243.75 57.92Q242.83 57.09 242.83 55.71Q242.83 54.67 243.32 53.93Q243.81 53.18 244.69 52.77Q245.57 52.37 246.75 52.37Q247.98 52.37 248.87 52.8Q249.75 53.22 250.24 54Q250.73 54.78 250.73 55.83H248.67Q248.67 55.38 248.46 55.01Q248.24 54.63 247.82 54.4Q247.4 54.17 246.75 54.17Q246.13 54.17 245.71 54.38Q245.3 54.59 245.09 54.94Q244.89 55.3 244.89 55.71Q244.89 56.21 245.26 56.59Q245.63 56.97 246.42 57.03L247.37 57.12Q248.53 57.2 249.4 57.6Q250.27 58 250.75 58.68Q251.23 59.36 251.23 60.33Q251.23 61.35 250.7 62.12Q250.17 62.9 249.18 63.33Q248.2 63.76 246.87 63.76ZM233.38 63.48 229.43 58.43H228.48V63.48H226.38V52.68H228.48V57.72L232.59 52.68H235L231.16 57.38L235.93 63.48ZM29.99 63.48V52.68H36.53V54.45H32.05V57.1H36.26V58.88H32.05V61.7H36.65V63.48ZM0 63.48V52.68H6.54V54.45H2.06V57.1H6.27V58.88H2.06V61.7H6.66V63.48ZM195.01 61.8Q195.84 61.8 196.5 61.51Q197.16 61.21 197.62 60.69Q198.09 60.16 198.33 59.49Q198.58 58.82 198.58 58.06Q198.58 57.25 198.33 56.57Q198.09 55.89 197.62 55.38Q197.16 54.88 196.49 54.6Q195.83 54.32 195.01 54.32Q194.18 54.32 193.52 54.6Q192.85 54.88 192.39 55.38Q191.92 55.89 191.68 56.57Q191.43 57.25 191.43 58.06Q191.43 58.82 191.68 59.49Q191.92 60.16 192.39 60.69Q192.85 61.21 193.52 61.51Q194.18 61.8 195.01 61.8ZM65.56 63.48V54.53H62.43V52.68H70.78V54.53H67.66V63.48ZM15.31 63.48V52.68H17.41V61.63H21.78V63.48ZM143.56 63.48V52.68H145.66V61.63H150.02V63.48ZM96.12 63.48V52.68H98.22V63.48ZM211.33 54.39V58.17H213.46Q214.04 58.17 214.46 57.93Q214.88 57.69 215.12 57.26Q215.36 56.83 215.36 56.29Q215.36 55.72 215.12 55.3Q214.88 54.87 214.46 54.63Q214.04 54.39 213.46 54.39ZM81.05 54.39V58.17H83.18Q83.75 58.17 84.18 57.93Q84.6 57.69 84.83 57.26Q85.07 56.83 85.07 56.29Q85.07 55.72 84.83 55.3Q84.6 54.87 84.18 54.63Q83.75 54.39 83.18 54.39ZM131.7 58.83 130.21 54.44H129.66L128.2 58.83Z" fill="#0A8A50"/></svg>';
  var LOGO_W = 128;
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
    // Standard logo: the full Charge-O logo (it carries the name), firm details below it.
    // An uploaded logo keeps the small square slot with the trade name beside it.
    var brand = images && images.logo
      ? { width: '*', columnGap: 10, columns: [
          { width: 56, stack: [{ image: images.logo, fit: [52, 52] }] },
          { width: '*', stack: [{ text: firm.tradeName || firm.legalName || '', fontSize: 15.5, bold: true, color: C.navy, margin: [0, 1, 0, 3] }].concat(firmLines), fontSize: 7.8, lineHeight: 1.25 }] }
      : { width: '*', stack: [{ svg: LOGO_SVG, width: LOGO_W, margin: [0, 1, 0, 8] }].concat(firmLines), fontSize: 7.8, lineHeight: 1.25 };
    return {
      columns: [brand,
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

  function totalsTable(calc) {
    var b = [];
    var row = function (k, v, opt) { b.push([{ text: k, color: C.muted }, { text: v, alignment: 'right', color: C.ink, bold: !!(opt && opt.bold) }]); };
    if (calc.discount > 0) { row('Gross amount', m(calc.gross)); row('Discount', '- ' + m(calc.discount)); }
    row('Taxable value', m(calc.taxable));
    // Tax by rate, e.g. CGST 9% and SGST 9%, or IGST 18% (GST rule 46: rate and amount of each tax).
    var rates = {}, order = [];
    calc.lines.forEach(function (l) {
      var k = String(l.gstRate);
      if (!rates[k]) { rates[k] = { rate: l.gstRate, cgst: 0, sgst: 0, igst: 0 }; order.push(k); }
      rates[k].cgst += l.cgst; rates[k].sgst += l.sgst; rates[k].igst += l.igst;
    });
    order.map(function (k) { return rates[k]; }).sort(function (a, b) { return b.rate - a.rate; }).forEach(function (g) {
      if (calc.intra) {
        if (g.cgst || g.sgst) { row('CGST ' + fmtQty(g.rate / 2) + '%', m(PB.r2(g.cgst))); row(calc.sgstLabel + ' ' + fmtQty(g.rate / 2) + '%', m(PB.r2(g.sgst))); }
      } else if (g.igst) row('IGST ' + fmtQty(g.rate) + '%', m(PB.r2(g.igst)));
    });
    if (calc.roundOff) row('Round off', (calc.roundOff > 0 ? '+ ' : '- ') + m(Math.abs(calc.roundOff)));
    var t1 = { table: { widths: ['*', 'auto'], body: b }, layout: { hLineWidth: function (i) { return i === 0 ? 0 : 0.5; }, vLineWidth: function () { return 0; }, hLineColor: function () { return C.line; }, paddingLeft: function () { return 8; }, paddingRight: function () { return 8; }, paddingTop: function () { return 4; }, paddingBottom: function () { return 4; } }, fontSize: 8.3 };
    var t2 = { table: { widths: ['*', 'auto'], body: [[{ text: 'Total', bold: true, color: C.white, fontSize: 10 }, { text: '₹ ' + m(calc.payable), bold: true, color: C.white, fontSize: 12, alignment: 'right' }]] },
      layout: { hLineWidth: function () { return 0; }, vLineWidth: function () { return 0; }, fillColor: function () { return C.navy; }, paddingLeft: function () { return 8; }, paddingRight: function () { return 8; }, paddingTop: function () { return 7; }, paddingBottom: function () { return 7; } } };
    return { stack: [t1, t2] };
  }

  function bankBlock(doc, bank) {
    if (doc.type === 'PO' || !bank) return null;
    var rows = [];
    var r = function (k, v) { if (v) rows.push([{ text: k, color: C.muted }, { text: v, color: C.ink, bold: k === 'A/c no.' }]); };
    r('Bank', bank.name); r('A/c name', bank.accountName); r('A/c no.', bank.accountNo); r('IFSC', bank.ifsc); r('Branch', bank.branch); r('UPI', bank.upi);
    if (!rows.length) return null;
    return { stack: [label('PAY TO'), { table: { widths: [44, '*'], body: rows }, layout: noLines, fontSize: 7.8 }], margin: [0, 10, 0, 0] };
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
    var bankB = bankBlock(doc, bank);
    if (bankB) left.push(bankB);
    var c = [
      header(doc, firm, images, copyLabel),
      rule(),
      partyBlock(doc, firm),
      itemsTable(calc),
      { columns: [{ width: '*', stack: left }, { width: 196, stack: [totalsTable(calc)] }], columnGap: 18, margin: [0, 12, 0, 0], unbreakable: true },
      // Notes and terms on the left, signature on the right, kept together on one page.
      { columns: [{ width: '*', stack: notesTerms(doc) }, { width: 196, stack: [signBlock(doc, firm, sign, images)] }], columnGap: 18, margin: [0, 16, 0, 0], unbreakable: true }
    ];
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
