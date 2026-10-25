/* Proline Billing — the app in the browser. Needs PB (shared.js), PBPDF (pdf.js) and pdfmake. */
(function () {
  'use strict';

  // ---------------------------------------------------------------- state
  var S = {
    settings: null, parties: [], products: [], docs: [], series: {}, images: null, sheetUrl: '', driveUrl: '', user: '',
    view: 'docs', filter: { type: 'ALL', status: 'ALL', fy: '', q: '' }, doc: null, dirty: false, errors: [],
    amending: false, amendBase: null, imp: { kind: 'documents', parsed: null }
  };
  /** The open document can be changed: a draft, or a final one being amended. */
  function editable() { return !!(S.doc && (S.doc.status === 'DRAFT' || S.amending)); }
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var main = function () { return $('#main'); };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rupees(x) { return '₹ ' + PB.money(x); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function get(o, path) { return path.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function set(o, path, v) { var k = path.split('.'), last = k.pop(); var t = k.reduce(function (a, x) { if (a[x] == null || typeof a[x] !== 'object') a[x] = {}; return a[x]; }, o); t[last] = v; }
  function stateOptions(sel, blank) {
    return (blank ? '<option value="">' + esc(blank) + '</option>' : '') + PB.STATES.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === sel ? ' selected' : '') + '>' + esc(s[1]) + ' (' + s[0] + ')</option>'; }).join('');
  }
  function options(list, sel) { return list.map(function (v) { var val = Array.isArray(v) ? v[0] : v, lab = Array.isArray(v) ? v[1] : v; return '<option value="' + esc(val) + '"' + (String(val) === String(sel) ? ' selected' : '') + '>' + esc(lab) + '</option>'; }).join(''); }

  // ---------------------------------------------------------------- server calls
  function call(fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    return new Promise(function (resolve, reject) {
      var r = google.script.run.withSuccessHandler(resolve).withFailureHandler(function (e) { reject(e && e.message ? e : new Error(String(e))); });
      r[fn].apply(r, args);
    });
  }
  var busyCount = 0;
  function busy(on, text) {
    busyCount += on ? 1 : -1;
    var b = $('#busy');
    if (on && text) $('#busy-text').textContent = text;
    b.hidden = busyCount <= 0;
  }
  async function run(text, fn) {
    busy(true, text);
    try { return await fn(); }
    catch (e) { showError(e); throw e; }
    finally { busy(false); }
  }
  function cleanMsg(e) { return String((e && e.message) || e || 'Something went wrong').replace(/^Exception:\s*/, '').replace(/^Error:\s*/, ''); }
  function showError(e) {
    var msg = cleanMsg(e);
    if (msg.indexOf('\n') >= 0) modal('<h2>Please check</h2><p class="pre">' + esc(msg) + '</p><div class="actions"><button class="btn primary" data-close>OK</button></div>');
    else toast(msg, 'error');
  }
  function toast(msg, kind) {
    var t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show ' + (kind || '');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.className = 'toast'; }, kind === 'error' ? 7000 : 4000);
  }

  // ---------------------------------------------------------------- modal
  function modal(html, onOpen) {
    var m = $('#modal');
    $('#modal-body').innerHTML = html;
    m.hidden = false;
    document.body.classList.add('noscroll');
    if (onOpen) onOpen($('#modal-body'));
    var f = $('#modal-body input, #modal-body textarea, #modal-body select');
    // Focus the first field, unless a field in the dialog already has the focus.
    if (f) setTimeout(function () { if (!m.contains(document.activeElement)) f.focus(); }, 30);
  }
  function closeModal() {
    var m = $('#modal');
    m.hidden = true;
    $('#modal-body').innerHTML = '';
    document.body.classList.remove('noscroll');
    if (closeModal.after) { var a = closeModal.after; closeModal.after = null; a(); }
  }
  function confirmBox(title, text, okLabel) {
    return new Promise(function (resolve) {
      modal('<h2>' + esc(title) + '</h2><p class="pre">' + esc(text) + '</p><div class="actions"><button class="btn" data-close>Back</button><button class="btn primary" id="cb-ok">' + esc(okLabel || 'OK') + '</button></div>', function (root) {
        $('#cb-ok', root).onclick = function () { closeModal.after = null; closeModal(); resolve(true); };
        closeModal.after = function () { resolve(false); };
      });
    });
  }

  // ---------------------------------------------------------------- navigation
  function go(view) {
    if (S.view === 'doc' && S.dirty && view !== 'doc' && !window.confirm('Leave without saving your changes?')) return;
    if (view !== 'doc') { S.doc = null; S.dirty = false; S.errors = []; S.amending = false; S.amendBase = null; }
    S.view = view;
    $$('.tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.view === view); });
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    var v = S.view;
    if (v === 'docs') main().innerHTML = viewDocs();
    else if (v === 'parties') main().innerHTML = viewParties();
    else if (v === 'items') main().innerHTML = viewItems();
    else if (v === 'settings') main().innerHTML = viewSettings();
    else if (v === 'import') main().innerHTML = viewImport();
    else if (v === 'doc') { main().innerHTML = viewDoc(); refreshTotals(); }
  }

  // ---------------------------------------------------------------- documents list
  function typeBadge(t) { return '<span class="badge t-' + t + '">' + esc(PB.TYPES[t].short) + '</span>'; }
  function statusPill(s) { return '<span class="pill s-' + s + '">' + ({ DRAFT: 'Draft', FINAL: 'Final', CANCELLED: 'Cancelled' }[s] || s) + '</span>'; }
  function viewDocs() {
    var f = S.filter, cur = PB.fy(PB.today());
    var fys = {}; S.docs.forEach(function (d) { fys[d.fy || PB.fy(d.date).long] = 1; });
    var list = S.docs.filter(function (d) {
      if (f.type !== 'ALL' && d.type !== f.type) return false;
      if (f.status !== 'ALL' && d.status !== f.status) return false;
      if (f.fy && (d.fy || PB.fy(d.date).long) !== f.fy) return false;
      if (f.q) { var q = f.q.toLowerCase(); if ((d.partyName + ' ' + d.number + ' ' + d.gstin).toLowerCase().indexOf(q) < 0) return false; }
      return true;
    });
    var invFy = S.docs.filter(function (d) { return d.type === 'INV' && d.status === 'FINAL' && (d.fy || PB.fy(d.date).long) === cur.long; });
    var invTotal = invFy.reduce(function (a, d) { return a + (+d.payable || 0); }, 0);
    var drafts = S.docs.filter(function (d) { return d.status === 'DRAFT'; }).length;
    var seriesLine = ['INV', 'PI', 'PO'].map(function (t) { return '<div><span class="muted">' + esc(PB.TYPES[t].short) + '</span> <b>' + esc((S.series[t] || {}).next || '') + '</b></div>'; }).join('');
    var rows = list.map(function (d) {
      var id = esc(d.id);
      var acts = d.status === 'FINAL' ? '<span class="row-acts"><button class="btn small" data-row-action="amend" data-id="' + id + '">Amend</button><button class="btn small danger ghost" data-row-action="cancel" data-id="' + id + '">Cancel</button></span>' : '';
      return '<tr data-open="' + id + '" tabindex="0"><td>' + typeBadge(d.type) + '</td><td class="nowrap"><b>' + esc(d.number || 'Draft') + '</b></td><td class="nowrap">' + esc(PB.prettyDate(d.date)) + '</td><td>' + esc(d.partyName || '—') + '</td><td class="num nowrap">' + rupees(d.payable) + '</td><td>' + statusPill(d.status) +
        (d.amendedAt ? ' <span class="pill">Amended</span>' : '') + (d.imported && d.status !== 'DRAFT' ? ' <span class="pill">Imported</span>' : '') +
        (d.status === 'FINAL' && !d.pdfUrl && !d.imported ? ' <span class="pill s-warn">PDF missing</span>' : '') + '</td><td>' + (d.pdfUrl ? '<a href="' + esc(d.pdfUrl) + '" target="_blank" rel="noopener" data-stop>PDF</a>' : '') + '</td><td class="nowrap">' + acts + '</td></tr>';
    }).join('');
    return '' +
      '<section class="tiles">' +
      '<div class="tile"><span class="muted">Invoiced in ' + esc(cur.long) + '</span><b>' + rupees(invTotal) + '</b><span class="muted">' + invFy.length + ' tax invoice' + (invFy.length === 1 ? '' : 's') + '</span></div>' +
      '<div class="tile"><span class="muted">Drafts</span><b>' + drafts + '</b><span class="muted">not numbered yet</span></div>' +
      '<div class="tile"><span class="muted">Next numbers</span>' + seriesLine + '</div>' +
      '</section>' +
      '<section class="card">' +
      '<div class="filters">' +
      '<div class="seg">' + [['ALL', 'All'], ['INV', 'Invoices'], ['PI', 'Proforma'], ['PO', 'POs']].map(function (o) { return '<button data-ftype="' + o[0] + '" class="' + (f.type === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      '<select data-fstatus aria-label="Status">' + options([['ALL', 'Any status'], ['DRAFT', 'Drafts'], ['FINAL', 'Final'], ['CANCELLED', 'Cancelled']], f.status) + '</select>' +
      '<select data-ffy aria-label="Financial year"><option value="">All years</option>' + options(Object.keys(fys).sort().reverse(), f.fy) + '</select>' +
      '<input type="search" data-fq placeholder="Search name, number or GSTIN" value="' + esc(f.q) + '">' +
      '<button class="btn small" data-view="import">Import from Excel</button>' +
      '</div>' +
      (rows ? '<div class="table-wrap"><table class="list"><thead><tr><th>Type</th><th>Number</th><th>Date</th><th>Customer / vendor</th><th class="num">Amount</th><th>Status</th><th></th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<div class="empty"><p>No documents yet.</p><p class="muted">Start with <b>+ Invoice</b>, <b>+ Proforma</b> or <b>+ PO</b> at the top, or <a href="#" data-view="import">import from Excel</a>. Add your firm details in <a href="#" data-view="settings">Settings</a> first.</p></div>') +
      '</section>';
  }

  // ---------------------------------------------------------------- parties
  function regLine(r) { return [r.label, r.gstin || 'Unregistered', r.stateName || PB.stateName(r.stateCode)].filter(Boolean).join(' · '); }
  function viewParties() {
    var q = (S.partyQ || '').toLowerCase();
    var list = S.parties.filter(function (p) { return !q || (p.name + ' ' + p.registrations.map(function (r) { return r.gstin; }).join(' ')).toLowerCase().indexOf(q) >= 0; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); });
    return '<section class="card"><div class="head-row"><h1>Customers and vendors</h1><button class="btn primary" data-action="party-new">+ Add</button></div>' +
      '<p class="muted">One customer can have several GST registrations (one per state) and site addresses. Pick the right one on each document.</p>' +
      '<div class="filters"><input type="search" data-partyq placeholder="Search name or GSTIN" value="' + esc(S.partyQ || '') + '"></div>' +
      (list.length ? '<div class="grid-cards">' + list.map(function (p) {
        return '<button class="pcard" data-party="' + esc(p.id) + '"><span class="badge r-' + esc(p.role) + '">' + esc(p.role) + '</span><b>' + esc(p.name) + '</b>' +
          p.registrations.map(function (r) { return '<span class="muted small">' + esc(regLine(r)) + '</span>'; }).join('') +
          (p.phone || p.email ? '<span class="small">' + esc([p.phone, p.email].filter(Boolean).join(' · ')) + '</span>' : '') + '</button>';
      }).join('') + '</div>' : '<div class="empty"><p>No customers or vendors yet.</p></div>') + '</section>';
  }
  function partyForm(p) {
    p = p ? clone(p) : { role: S.view === 'doc' && S.doc && S.doc.type === 'PO' ? 'Vendor' : 'Customer', registrations: [{ isDefault: true }] };
    if (!p.registrations.length) p.registrations.push({ isDefault: true });
    var regs = p.registrations.map(function (r, i) { return regForm(r, i); }).join('');
    return '<h2>' + (p.id ? 'Edit ' : 'Add a ') + 'customer or vendor</h2>' +
      '<form id="party-form" data-id="' + esc(p.id || '') + '">' +
      '<div class="grid2"><label>Name<input name="name" required value="' + esc(p.name) + '"></label>' +
      '<label>Type<select name="role">' + options([['Customer', 'Customer'], ['Vendor', 'Vendor (for POs)'], ['Both', 'Both']], p.role) + '</select></label>' +
      '<label>Contact person<input name="contact" value="' + esc(p.contact) + '"></label>' +
      '<label>Phone<input name="phone" inputmode="tel" value="' + esc(p.phone) + '"></label>' +
      '<label>Email<input name="email" type="email" value="' + esc(p.email) + '"></label>' +
      '<label>PAN<input name="pan" value="' + esc(p.pan) + '" placeholder="Filled from the GSTIN"></label></div>' +
      '<h3>GST registrations and addresses</h3><p class="muted small">Add one block for each GSTIN (state) or site. Leave GSTIN empty for an unregistered customer.</p>' +
      '<div id="regs">' + regs + '</div>' +
      '<button type="button" class="btn ghost" data-action="reg-add">+ Add another GSTIN or address</button>' +
      '<label>Notes<textarea name="notes" rows="2">' + esc(p.notes) + '</textarea></label>' +
      '<div class="actions">' + (p.id ? '<button type="button" class="btn danger" data-action="party-delete" data-id="' + esc(p.id) + '">Delete</button>' : '') +
      '<span class="grow"></span><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save</button></div></form>';
  }
  function regForm(r, i) {
    var g = r.gstin ? PB.checkGstin(r.gstin) : null;
    return '<fieldset class="reg" data-reg="' + i + '"><legend>Address ' + (i + 1) + '</legend>' +
      '<div class="grid2"><label>GSTIN<input data-r="gstin" value="' + esc(r.gstin) + '" placeholder="e.g. 07ABCDE1234F1Z5" autocapitalize="characters"><span class="hint ' + (g && !g.ok ? 'bad' : 'good') + '">' + (g ? (g.ok ? '✓ ' + esc(g.stateName) : esc(g.error)) : 'Unregistered if empty') + '</span></label>' +
      '<label>Label<input data-r="label" value="' + esc(r.label) + '" placeholder="e.g. Head office, Pune site"></label>' +
      '<label class="span2">Legal name as per GST (if different)<input data-r="legalName" value="' + esc(r.legalName) + '"></label>' +
      '<label class="span2">Address<textarea data-r="address" rows="2">' + esc(r.address) + '</textarea></label>' +
      '<label>City<input data-r="city" value="' + esc(r.city) + '"></label>' +
      '<label>PIN<input data-r="pin" inputmode="numeric" value="' + esc(r.pin) + '"></label>' +
      '<label>State<select data-r="stateCode">' + stateOptions(r.stateCode, 'Choose the state') + '</select></label>' +
      '<label class="check"><input type="radio" name="regdefault" data-r="isDefault"' + (r.isDefault ? ' checked' : '') + '> Main address</label></div>' +
      '<button type="button" class="link danger" data-action="reg-remove">Remove this address</button></fieldset>';
  }
  function readPartyForm(form) {
    var p = { id: form.dataset.id || '', registrations: [] };
    ['name', 'role', 'contact', 'phone', 'email', 'pan', 'notes'].forEach(function (k) { p[k] = form.elements[k].value.trim(); });
    $$('fieldset.reg', form).forEach(function (fs) {
      var r = {};
      $$('[data-r]', fs).forEach(function (el) { r[el.dataset.r] = el.type === 'radio' ? el.checked : el.value.trim(); });
      p.registrations.push(r);
    });
    return p;
  }
  function openParty(id, after) {
    var p = id ? S.parties.filter(function (x) { return x.id === id; })[0] : null;
    modal(partyForm(p));
    $('#party-form').onsubmit = async function (e) {
      e.preventDefault();
      var data = readPartyForm(e.target);
      var saved = await run('Saving…', function () { return call('apiSaveParty', data); });
      var i = S.parties.findIndex(function (x) { return x.id === saved.id; });
      if (i >= 0) S.parties[i] = saved; else S.parties.push(saved);
      closeModal();
      toast('Saved ' + saved.name);
      if (after) after(saved); else render();
    };
  }

  // ---------------------------------------------------------------- items (products)
  function viewItems() {
    var list = S.products.slice().sort(function (a, b) { return (a.category + a.name).localeCompare(b.category + b.name); });
    return '<section class="card"><div class="head-row"><h1>Items and services</h1><span class="grow"></span>' +
      (list.length < 3 ? '<button class="btn" data-action="items-starter">Add starter items</button>' : '') +
      '<button class="btn primary" data-action="item-new">+ Add item</button></div>' +
      '<p class="muted">Saved items fill in the HSN/SAC code, unit, rate and GST rate on documents. Please check codes and GST rates with your CA.</p>' +
      (list.length ? '<div class="table-wrap"><table class="list"><thead><tr><th>Item</th><th>Type</th><th>HSN/SAC</th><th>Unit</th><th class="num">Rate</th><th class="num">GST</th><th></th></tr></thead><tbody>' +
        list.map(function (p) { return '<tr data-item-edit="' + esc(p.id) + '" tabindex="0"><td><b>' + esc(p.name) + '</b>' + (p.category ? '<br><span class="muted small">' + esc(p.category) + '</span>' : '') + '</td><td>' + esc(p.type) + '</td><td>' + esc(p.hsn) + '</td><td>' + esc(p.unit) + '</td><td class="num">' + (p.rate ? rupees(p.rate) : '—') + '</td><td class="num">' + p.gstRate + '%</td><td>' + (p.active ? '' : '<span class="pill s-CANCELLED">Hidden</span>') + '</td></tr>'; }).join('') +
        '</tbody></table></div>' : '<div class="empty"><p>No items yet.</p></div>') + '</section>';
  }
  function itemForm(p) {
    p = p || { type: 'Goods', unit: 'Nos', gstRate: 18, active: true };
    return '<h2>' + (p.id ? 'Edit item' : 'Add an item') + '</h2><form id="item-form" data-id="' + esc(p.id || '') + '"><div class="grid2">' +
      '<label class="span2">Name<input name="name" required value="' + esc(p.name) + '"></label>' +
      '<label class="span2">Description (printed under the name)<textarea name="description" rows="2">' + esc(p.description) + '</textarea></label>' +
      '<label>Type<select name="type">' + options(['Goods', 'Service'], p.type) + '</select></label>' +
      '<label>HSN / SAC<input name="hsn" inputmode="numeric" value="' + esc(p.hsn) + '"><span class="hint">Goods: HSN, 4–8 digits. Services: SAC, 6 digits starting 99.</span></label>' +
      '<label>Unit<select name="unit">' + options(PB.UNITS, p.unit) + '</select></label>' +
      '<label>Rate (₹, before GST)<input name="rate" inputmode="decimal" value="' + esc(p.rate || '') + '"></label>' +
      '<label>GST rate<select name="gstRate">' + options(PB.GST_RATES.map(function (r) { return [r, r + '%']; }), p.gstRate) + '</select></label>' +
      '<label>Category<input name="category" value="' + esc(p.category) + '" placeholder="e.g. Chargers, Services"></label>' +
      '<label class="check span2"><input type="checkbox" name="active"' + (p.active ? ' checked' : '') + '> Show this item when making documents</label>' +
      '</div><div class="actions">' + (p.id ? '<button type="button" class="btn danger" data-action="item-delete" data-id="' + esc(p.id) + '">Delete</button>' : '') +
      '<span class="grow"></span><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save</button></div></form>';
  }
  function openItem(id) {
    var p = id ? S.products.filter(function (x) { return x.id === id; })[0] : null;
    modal(itemForm(p));
    $('#item-form').onsubmit = async function (e) {
      e.preventDefault();
      var f = e.target.elements;
      var data = { id: e.target.dataset.id, name: f.name.value, description: f.description.value, type: f.type.value, hsn: f.hsn.value, unit: f.unit.value, rate: f.rate.value, gstRate: f.gstRate.value, category: f.category.value, active: f.active.checked };
      var saved = await run('Saving…', function () { return call('apiSaveProduct', data); });
      var i = S.products.findIndex(function (x) { return x.id === saved.id; });
      if (i >= 0) S.products[i] = saved; else S.products.push(saved);
      closeModal(); toast('Saved ' + saved.name); render();
    };
  }

  // ---------------------------------------------------------------- settings
  function sField(key, label, opts) {
    opts = opts || {};
    var v = get(S.settings, key);
    var input = opts.textarea ? '<textarea data-s="' + key + '" rows="' + (opts.rows || 4) + '">' + esc(v) + '</textarea>'
      : opts.select ? '<select data-s="' + key + '">' + opts.select + '</select>'
        : '<input data-s="' + key + '" value="' + esc(v) + '"' + (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : '') + (opts.inputmode ? ' inputmode="' + opts.inputmode + '"' : '') + '>';
    return '<label' + (opts.span ? ' class="span2"' : '') + '>' + esc(label) + input + (opts.hint ? '<span class="hint">' + esc(opts.hint) + '</span>' : '') + '</label>';
  }
  function viewSettings() {
    var s = S.settings, g = s.firm.gstin ? PB.checkGstin(s.firm.gstin) : null;
    var series = ['INV', 'PI', 'PO'].map(function (t) {
      var st = S.series[t] || {};
      return '<div class="series-row"><b>' + esc(PB.TYPES[t].title) + '</b><span>Next: <code>' + esc(st.next || '') + '</code>' +
        ((st.reuse || []).length ? '<br><span class="muted small">Can be given again: ' + esc(st.reuse.join(', ')) + '</span>' : '') + '</span>' +
        '<span class="inline">Continue after <input data-series-last="' + t + '" inputmode="numeric" value="' + esc(st.last || 0) + '" size="5"> <button class="btn small" data-action="series-set" data-type="' + t + '">Set</button></span></div>';
    }).join('');
    return '<section class="card"><div class="head-row"><h1>Settings</h1><span class="grow"></span><button class="btn primary" data-action="settings-save">Save settings</button></div>' +
      '<p class="muted">These details print on every new document. A finalised document keeps the details it was made with.</p></section>' +
      '<section class="card"><h2>Your firm</h2><div class="grid2">' +
      sField('firm.legalName', 'Legal name (as per GST)') + sField('firm.tradeName', 'Trade name (shown large)') +
      sField('firm.address1', 'Address line 1', { span: true }) + sField('firm.address2', 'Address line 2', { span: true }) +
      sField('firm.city', 'City') + sField('firm.pin', 'PIN', { inputmode: 'numeric' }) +
      '<label>GSTIN<input data-s="firm.gstin" value="' + esc(s.firm.gstin) + '" autocapitalize="characters"><span class="hint ' + (g && !g.ok ? 'bad' : 'good') + '">' + (g ? (g.ok ? '✓ ' + esc(g.stateName) : esc(g.error)) : 'Needed for tax invoices') + '</span></label>' +
      sField('firm.stateCode', 'State', { select: stateOptions(s.firm.stateCode), hint: 'Set from your GSTIN when you save' }) +
      sField('firm.pan', 'PAN') + sField('firm.udyam', 'Udyam number (optional)') +
      sField('firm.phone', 'Phone on documents') + sField('firm.email', 'Email on documents') + sField('firm.website', 'Website') +
      '</div></section>' +
      '<section class="card"><h2>Bank and UPI (on invoices and proformas)</h2><div class="grid2">' +
      sField('bank.name', 'Bank name') + sField('bank.accountName', 'Account name') + sField('bank.accountNo', 'Account number', { inputmode: 'numeric' }) +
      sField('bank.ifsc', 'IFSC') + sField('bank.branch', 'Branch') + sField('bank.upi', 'UPI ID', { placeholder: 'name@bank' }) +
      '</div></section>' +
      '<section class="card"><h2>Logo and signature</h2><div class="grid2">' +
      '<div><b>Logo</b><div class="imgbox" id="img-logo">' + imgPreview('logo') + '</div><input type="file" accept="image/png,image/jpeg" data-upload="logo"><button class="link" data-action="img-remove" data-kind="logo">Use the standard logo</button></div>' +
      '<div><b>Signature</b><div class="imgbox" id="img-signature">' + imgPreview('signature') + '</div><input type="file" accept="image/png,image/jpeg" data-upload="signature"><button class="link" data-action="img-remove" data-kind="signature">Remove</button></div>' +
      sField('sign.name', 'Signatory name') + sField('sign.designation', 'Designation') +
      '</div><p class="muted small">PNG or JPG, under 1.5 MB. A signature on a white or clear background looks best.</p></section>' +
      '<section class="card"><h2>Numbering</h2><p class="muted">Each type has its own series per financial year (April–March). A document gets its number when you finalise it: the next in the series, a cancelled number given again, or one you type (for documents issued before this app). The series always continues after the highest number recorded in it.</p><div class="grid3">' +
      sField('series.INV.prefix', 'Tax invoice prefix', { hint: 'A tax invoice number can have at most 16 characters' }) + sField('series.PI.prefix', 'Proforma prefix') + sField('series.PO.prefix', 'PO prefix') +
      sField('series.fyStyle', 'Year in the number', { select: options([['26-27', '26-27, e.g. PEW/26-27/0001'], ['2627', '2627, e.g. PEW/2627/07']], s.series.fyStyle) }) +
      sField('series.pad', 'Digits in the number', { select: options([['1', '1, e.g. 7'], ['2', '2, e.g. 07'], ['3', '3, e.g. 007'], ['4', '4, e.g. 0007'], ['5', '5, e.g. 00007']], s.series.pad) }) +
      sField('pdf.copies', 'Tax invoice copies in the PDF', { select: options([['Original', 'Original only'], ['Original + Duplicate', 'Original + duplicate'], ['Original + Duplicate + Triplicate', 'Original + duplicate + triplicate (goods)']], s.pdf.copies) }) +
      '</div><div class="series">' + series + '</div>' +
      '<h3>Cancelled numbers you can give again</h3><p class="muted small">Numbers of documents cancelled outside this app, separated by commas, e.g. PEW/2627/0002, PEW/2627/0003. Documents cancelled in this app are offered by themselves. Each number is offered under Number until it is used.</p><div class="grid3">' +
      sField('series.INV.reuse', 'Tax invoices', { textarea: true, rows: 2 }) + sField('series.PI.reuse', 'Proformas', { textarea: true, rows: 2 }) + sField('series.PO.reuse', 'Purchase orders', { textarea: true, rows: 2 }) +
      '</div><p class="hint warn">GST rule 46: each invoice number is used once in a financial year. Give a cancelled number again only if that invoice was never sent or reported in GSTR-1. Ask your CA if unsure.</p>' +
      '<div class="actions left"><button class="btn" data-action="series-check">Check all series for gaps</button></div><div id="series-result"></div></section>' +
      '<section class="card"><h2>Default notes and terms</h2><div class="grid2">' +
      sField('notes.INV', 'Note on tax invoices', { textarea: true, rows: 2 }) + sField('terms.INV', 'Terms on tax invoices', { textarea: true }) +
      sField('notes.PI', 'Note on proformas', { textarea: true, rows: 2 }) + sField('terms.PI', 'Terms on proformas', { textarea: true }) +
      sField('notes.PO', 'Note on purchase orders', { textarea: true, rows: 2 }) + sField('terms.PO', 'Terms on purchase orders', { textarea: true }) +
      '</div></section>' +
      '<section class="card"><h2>Email and storage</h2><div class="grid2">' +
      sField('email.to', 'Email each final PDF to') + sField('email.cc', 'Copy to (optional)') +
      sField('email.onFinalise', 'When a document is finalised', { select: options([['yes', 'Email the PDF'], ['no', 'Only save it to Drive']], s.email.onFinalise) }) +
      '</div><p>PDFs are saved in Google Drive: <a href="' + esc(S.driveUrl) + '" target="_blank" rel="noopener">open the Proline Billing folder</a>. All data is in the <a href="' + esc(S.sheetUrl) + '" target="_blank" rel="noopener">Proline Billing sheet</a>; its Register tab lists every tax invoice by GST rate for your CA.</p></section>' +
      '<div class="sticky-actions"><button class="btn primary" data-action="settings-save">Save settings</button></div>';
  }
  function imgPreview(kind) {
    var src = S.images && S.images[kind];
    if (src) return '<img src="' + src + '" alt="">';
    return kind === 'logo' ? '<span class="muted small">Standard Proline logo</span>' + PBPDF.LOGO_SVG.replace('<svg ', '<svg class="std" ') : '<span class="muted small">No signature</span>';
  }
  async function loadImages() {
    if (S.images) return S.images;
    S.images = await call('apiGetImages');
    return S.images;
  }

  // ---------------------------------------------------------------- document editor
  function blankLine() { return { name: '', description: '', type: 'Goods', hsn: '', qty: 1, unit: 'Nos', rate: '', discountPct: '', gstRate: 18 }; }
  function newDoc(type) {
    var s = S.settings;
    return {
      type: type, status: 'DRAFT', number: '', date: PB.today(), party: {}, pos: { code: type === 'PO' ? s.firm.stateCode : '' }, posAuto: true,
      reverseCharge: false, pricesIncludeGst: false, roundOff: true, refs: {}, shipTo: { same: true },
      items: [blankLine()], notes: s.notes[type] || '', terms: s.terms[type] || '',
      annexure: { enabled: false, title: 'Annexure A', intro: '', rows: [], notes: '' }, meta: {}
    };
  }
  function openNew(type, from) {
    if (S.view === 'doc' && S.dirty && !window.confirm('Leave without saving your changes?')) return;
    S.doc = from || newDoc(type);
    S.dirty = !!from;
    S.errors = [];
    S.view = 'doc';
    $$('.tabs button').forEach(function (b) { b.classList.remove('on'); });
    render();
    window.scrollTo(0, 0);
  }
  async function openDoc(id) {
    var doc = await run('Opening…', function () { return call('apiGetDocument', id); });
    S.doc = doc; S.dirty = false; S.errors = []; S.view = 'doc';
    $$('.tabs button').forEach(function (b) { b.classList.remove('on'); });
    render();
    window.scrollTo(0, 0);
  }
  function supplierState(doc) { return doc.type === 'PO' ? String(doc.party.stateCode || '') : String((doc.firm || S.settings.firm).stateCode || ''); }
  function calc(doc) { return PB.compute(doc, supplierState(doc)); }
  function partiesFor(type) { return S.parties.filter(function (p) { return type === 'PO' ? p.role !== 'Customer' : p.role !== 'Vendor'; }).sort(function (a, b) { return a.name.localeCompare(b.name); }); }

  function viewDoc() {
    var d = S.doc, T = PB.TYPES[d.type], ro = !editable(), isPO = d.type === 'PO';
    var dis = ro ? ' disabled' : '';
    var party = d.party || {};
    var p = party.id ? S.parties.filter(function (x) { return x.id === party.id; })[0] : null;
    var regs = p ? p.registrations : [];
    var title = S.amending ? 'Amending ' + T.title.toLowerCase() + ' ' + d.number : (d.number ? T.title + ' ' + d.number : 'New ' + T.title.toLowerCase());
    var hist = (d.meta && d.meta.amendments) || [];
    var histNote = hist.length ? '<p class="muted small">Amended ' + (hist.length === 1 ? 'once' : hist.length + ' times') + '. Last: ' + esc(PB.prettyDate(String(hist[hist.length - 1].at).slice(0, 10))) + ', ' + esc(hist[hist.length - 1].reason) + '</p>' : '';
    var sameLabel = isPO ? 'Our address' : 'Same as bill to';
    var refsHtml = {
      INV: refField('refs.poNumber', 'Customer PO no.') + refField('refs.poDate', 'PO date', 'date') + refField('refs.dueDate', 'Due date', 'date') + refField('refs.eWayBill', 'E-way bill no.') + refField('refs.vehicleNo', 'Vehicle no.') + refField('refs.piNumber', 'Proforma ref.'),
      PI: refField('refs.validTill', 'Valid till', 'date') + refField('refs.deliveryPeriod', 'Delivery period', null, 'e.g. 3–4 weeks from advance') + refField('refs.paymentTerms', 'Payment terms', null, 'e.g. 50% advance') + refField('refs.poNumber', 'Customer ref.'),
      PO: refField('refs.deliveryDate', 'Deliver by', 'date') + refField('refs.paymentTerms', 'Payment terms', null, 'e.g. 30 days after delivery') + refField('refs.deliveryTerms', 'Delivery terms', null, 'e.g. freight included') + refField('refs.quoteRef', 'Vendor quotation ref.')
    }[d.type];
    function refField(path, label, type, ph) { return '<label>' + esc(label) + '<input data-f="' + path + '"' + (type ? ' type="' + type + '"' : '') + ' value="' + esc(get(d, path)) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + dis + '></label>'; }
    var shipDiff = !(d.shipTo && d.shipTo.same !== false);
    var posHint = (!isPO && shipDiff && d.shipTo.stateCode && d.pos.code && d.shipTo.stateCode !== d.pos.code) ?
      '<span class="hint warn">Installing at the site? The place of supply is then usually the site’s state (' + esc(PB.stateName(d.shipTo.stateCode)) + '). Ask your CA if unsure.</span>' : '';
    var vendorHint = (isPO && party.name && !party.gstin) ? '<span class="hint warn">Unregistered vendor: they usually cannot charge GST, so set GST to 0%.</span>' : '';

    var head = '<div class="doc-head"><div><button class="link" data-view="docs">← Documents</button><h1>' + esc(title) + ' ' + statusPill(d.status) + '</h1>' +
      (d.status === 'CANCELLED' && d.meta && d.meta.cancelReason ? '<p class="bad">Cancelled: ' + esc(d.meta.cancelReason) + '</p>' : '') + histNote +
      (S.amending ? '<p class="hint warn">You are changing an issued document. Amend only if it is not yet reported in your GSTR-1; after filing, use a credit or debit note. Ask your CA if unsure.</p>' : '') + '</div>' + docActions(d) + '</div>';
    var errs = S.errors.length ? '<div class="alert"><b>Please fix these before finalising:</b><ul>' + S.errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>' : '';

    var partyCard = '<section class="card"><h2>' + (isPO ? 'Vendor' : 'Customer') + '</h2><div class="grid2">' +
      '<label>' + (isPO ? 'Vendor' : 'Customer') + '<div class="with-btn"><input list="dl-parties" data-party-pick value="' + esc(party.name) + '" placeholder="Start typing a name"' + dis + '>' + (ro ? '' : '<button type="button" class="btn small" data-action="party-new-doc">+ New</button>') + '</div></label>' +
      (regs.length > 1 ? '<label>GST registration / address<select data-reg-pick' + dis + '>' + regs.map(function (r) { return '<option value="' + esc(r.id) + '"' + (r.id === party.regId ? ' selected' : '') + '>' + esc(regLine(r)) + '</option>'; }).join('') + '</select></label>' : '<div></div>') +
      '</div>' + (party.name ? '<div class="party-box"><b>' + esc(party.legalName || party.name) + '</b><br>' + esc([party.address, [party.city, party.pin].filter(Boolean).join(' – '), party.stateCode ? PB.stateName(party.stateCode) + ' (' + party.stateCode + ')' : ''].filter(Boolean).join(', ')) +
        '<br>' + (party.gstin ? 'GSTIN <b>' + esc(party.gstin) + '</b>' : '<span class="muted">Unregistered (no GSTIN)</span>') + (p && !ro ? ' · <button class="link" data-action="party-edit-doc">Edit</button>' : '') + '</div>' : '') + vendorHint +
      '<datalist id="dl-parties">' + partiesFor(d.type).map(function (x) { return '<option value="' + esc(x.name) + '">'; }).join('') + '</datalist></section>';

    var detailsCard = '<section class="card"><h2>Details</h2><div class="grid3">' + numberField(d, ro) +
      '<label>Date<input type="date" data-f="date" value="' + esc(d.date) + '"' + dis + '></label>' +
      '<label>Place of supply<select data-pos' + dis + '>' + stateOptions(d.pos && d.pos.code, 'Choose the state') + '</select>' + posHint + '</label>' +
      (isPO ? '<div></div>' : '<label>Reverse charge<select data-f="reverseCharge" data-bool' + dis + '>' + options([['false', 'No'], ['true', 'Yes']], String(!!d.reverseCharge)) + '</select></label>') +
      refsHtml + '</div>' +
      '<div class="toggles"><label class="check"><input type="checkbox" data-f="pricesIncludeGst" data-check' + (d.pricesIncludeGst ? ' checked' : '') + dis + '> Rates include GST</label>' +
      '<label class="check"><input type="checkbox" data-f="roundOff" data-check' + (d.roundOff !== false ? ' checked' : '') + dis + '> Round the total to the nearest rupee</label></div>' +
      '<h3>' + (isPO ? 'Deliver to' : 'Ship to / site') + '</h3><div class="seg small">' +
      '<button type="button" data-ship="same" class="' + (shipDiff ? '' : 'on') + '"' + dis + '>' + sameLabel + '</button><button type="button" data-ship="diff" class="' + (shipDiff ? 'on' : '') + '"' + dis + '>Another address</button></div>' +
      (shipDiff ? '<div class="grid3">' + ['name:Name', 'gstin:GSTIN (optional)', 'city:City', 'pin:PIN'].map(function (x) { var k = x.split(':'); return '<label>' + k[1] + '<input data-f="shipTo.' + k[0] + '" value="' + esc(d.shipTo[k[0]]) + '"' + dis + '></label>'; }).join('') +
        '<label class="span2">Address<textarea data-f="shipTo.address" rows="2"' + dis + '>' + esc(d.shipTo.address) + '</textarea></label>' +
        '<label>State<select data-f="shipTo.stateCode"' + dis + '>' + stateOptions(d.shipTo.stateCode, 'Choose the state') + '</select></label></div>' : '') +
      '</section>';

    var lines = d.items.map(function (it, i) { return lineHtml(it, i, ro); }).join('');
    var itemsCard = '<section class="card"><div class="head-row"><h2>Items</h2><span class="grow"></span><span class="muted small" id="tax-mode"></span></div>' +
      '<div class="lines-head"><span>Item or service</span><span>HSN/SAC</span><span>Qty and unit</span><span>Rate (₹)</span><span>Disc %</span><span>GST</span><span class="num">Amount</span></div>' +
      '<div id="lines">' + lines + '</div>' + (ro ? '' : '<div class="actions left"><button class="btn ghost" data-action="line-add">+ Add a line</button><button class="btn ghost" data-action="lines-paste">Paste lines from Excel</button></div>') +
      '<datalist id="dl-products">' + S.products.filter(function (x) { return x.active; }).map(function (x) { return '<option value="' + esc(x.name) + '">'; }).join('') + '</datalist>' +
      '<div class="totals" id="totals"></div></section>';

    var a = d.annexure || { enabled: false };
    var annexCard = '<section class="card"><div class="head-row"><h2>Annexure</h2><span class="grow"></span><label class="check"><input type="checkbox" data-f="annexure.enabled" data-check' + (a.enabled ? ' checked' : '') + dis + ' data-rerender> Add an annexure page</label></div>' +
      (a.enabled ? '<p class="muted small">Printed on its own page after the document, e.g. scope of work, specifications, site list or exclusions.</p><div class="grid2">' +
        '<label class="span2">Title<input data-f="annexure.title" value="' + esc(a.title) + '"' + dis + '></label>' +
        '<label class="span2">Introduction<textarea data-f="annexure.intro" rows="2"' + dis + '>' + esc(a.intro) + '</textarea></label></div>' +
        '<div class="annex-head"><span>Description</span><span>Specification / details</span><span>Qty</span><span>Unit</span><span>Remarks</span></div>' +
        (a.rows || []).map(function (r, i) {
          return '<div class="annex-row" data-ai="' + i + '">' + ['description', 'spec', 'qty', 'unit', 'remarks'].map(function (k) { return '<input data-ak="' + k + '" value="' + esc(r[k]) + '" aria-label="' + k + '"' + dis + '>'; }).join('') + (ro ? '' : '<button class="icon" data-action="annex-del" title="Remove">✕</button>') + '</div>';
        }).join('') + (ro ? '' : '<button class="btn ghost" data-action="annex-add">+ Add a row</button>') +
        '<label>Notes (exclusions, timelines, conditions)<textarea data-f="annexure.notes" rows="3"' + dis + '>' + esc(a.notes) + '</textarea></label>' : '') + '</section>';

    var notesCard = '<section class="card"><h2>Notes and terms</h2><div class="grid2"><label>Note<textarea data-f="notes" rows="3"' + dis + '>' + esc(d.notes) + '</textarea></label>' +
      '<label>Terms and conditions<textarea data-f="terms" rows="5"' + dis + '>' + esc(d.terms) + '</textarea></label></div></section>';

    return head + errs + partyCard + detailsCard + itemsCard + annexCard + notesCard + '<div class="sticky-actions">' + docActions(d) + '</div>';
  }

  var WARN = {
    reuse: 'This number was cancelled before. GST rule 46 needs each invoice number to be used once in a financial year, so give it again only if that invoice was never sent or reported in GSTR-1. Ask your CA if unsure.',
    manual: 'Type a number only for a document already issued outside this app, or to fill a gap. It must not be used twice in a financial year. Later documents continue after the highest number in the series.',
    amend: 'The customer may already have the old number. The old number stays in the amendment history.'
  };
  /** Number: next in series, a cancelled number given again, or typed. When amending: keep or change it. */
  function numberField(d, ro) {
    if (ro) return '';
    var st = S.series[d.type] || {}, f = PB.fy(d.date || PB.today());
    var n = d.numbering || { mode: S.amending ? 'keep' : 'auto' };
    var opts = [];
    if (S.amending) opts.push(['keep', 'Keep ' + d.number]);
    else {
      opts.push(['auto', st.fy === f.short ? 'Next in series: ' + st.next : 'Next in the ' + f.long + ' series']);
      if (st.fy === f.short) (st.reuse || []).forEach(function (no) { opts.push(['reuse:' + no, no + ' (cancelled, give again)']); });
    }
    opts.push(['manual', S.amending ? 'Change the number…' : 'Type a number…']);
    var sel = n.mode === 'reuse' ? 'reuse:' + n.number : n.mode;
    var html = '<label>Number<select data-numsel>' + options(opts, sel) + '</select>';
    if (n.mode === 'manual') html += '<input data-numtext value="' + esc(n.number || '') + '" placeholder="e.g. ' + esc(st.next || '') + '" autocapitalize="characters" aria-label="Number">';
    if (n.mode === 'reuse') html += '<span class="hint warn">' + esc(WARN.reuse) + '</span>';
    if (n.mode === 'manual') html += '<span class="hint warn">' + esc(S.amending ? WARN.amend : WARN.manual) + '</span>';
    return html + '</label>';
  }
  function numberProblem(d) {
    var n = d.numbering || {};
    if (n.mode !== 'manual' && n.mode !== 'reuse') return '';
    var no = String(n.number || '').trim();
    if (!no) return 'Type the number, or choose “Next in series”.';
    if (d.type === 'INV') { var e = PB.checkInvoiceNumber(no); if (e) return e; }
    var f = PB.fy(d.date);
    var clash = S.docs.filter(function (x) { return x.type === d.type && x.status === 'FINAL' && x.id !== d.id && String(x.number).toUpperCase() === no.toUpperCase() && (x.fy || PB.fy(x.date).long) === f.long; })[0];
    return clash ? 'Number ' + clash.number + ' is already used by a final ' + PB.TYPES[d.type].short.toLowerCase() + ' (' + clash.partyName + ').' : '';
  }

  function lineHtml(it, i, ro) {
    var dis = ro ? ' disabled' : '';
    // Each field has a small caption that shows only on phones (desktop has the header row).
    var cap = function (t) { return '<span class="cap">' + t + '</span>'; };
    return '<div class="line" data-i="' + i + '">' +
      '<div class="c-name"><input list="dl-products" data-k="name" value="' + esc(it.name) + '" placeholder="Item or service" aria-label="Item"' + dis + '><textarea data-k="description" rows="1" placeholder="Details (optional)" aria-label="Details"' + dis + '>' + esc(it.description) + '</textarea></div>' +
      '<div class="c-hsn"><label class="ml">' + cap('HSN/SAC') + '<input data-k="hsn" value="' + esc(it.hsn) + '" inputmode="numeric" placeholder="HSN/SAC" aria-label="HSN or SAC"' + dis + '></label><select data-k="type" aria-label="Goods or service"' + dis + '>' + options(['Goods', 'Service'], it.type) + '</select></div>' +
      '<div class="c-qty"><label class="ml">' + cap('Qty') + '<input data-k="qty" value="' + esc(it.qty) + '" inputmode="decimal" aria-label="Quantity"' + dis + '></label><select data-k="unit" aria-label="Unit"' + dis + '>' + options(PB.UNITS.indexOf(it.unit) >= 0 || !it.unit ? PB.UNITS : PB.UNITS.concat([it.unit]), it.unit) + '</select></div>' +
      '<div class="c-rate"><label class="ml">' + cap('Rate (₹)') + '<input data-k="rate" value="' + esc(it.rate) + '" inputmode="decimal" placeholder="0.00" aria-label="Rate"' + dis + '></label></div>' +
      '<div class="c-disc"><label class="ml">' + cap('Disc %') + '<input data-k="discountPct" value="' + esc(it.discountPct) + '" inputmode="decimal" placeholder="0" aria-label="Discount %"' + dis + '></label></div>' +
      '<div class="c-gst"><label class="ml">' + cap('GST') + '<select data-k="gstRate" aria-label="GST rate"' + dis + '>' + options(PB.GST_RATES.map(function (r) { return [r, r + '%']; }), it.gstRate) + '</select></label></div>' +
      '<div class="c-amt"><b class="line-total">—</b>' + (ro ? '' : '<span class="line-tools"><button class="icon" data-action="line-up" title="Move up">↑</button><button class="icon" data-action="line-down" title="Move down">↓</button><button class="icon" data-action="line-del" title="Remove">✕</button></span>') + '</div>' +
      '</div>';
  }

  function docActions(d) {
    var b = [];
    if (S.amending && d.status === 'FINAL') {
      b.push('<button class="btn primary" data-action="amend-save">Save amendment</button>');
      b.push('<button class="btn" data-action="doc-preview">Preview PDF</button>');
      b.push('<button class="btn" data-action="amend-discard">Discard changes</button>');
    } else if (d.status === 'DRAFT') {
      b.push('<button class="btn" data-action="doc-save">Save draft</button>');
      b.push('<button class="btn" data-action="doc-preview">Preview PDF</button>');
      b.push('<button class="btn primary" data-action="doc-finalise">Finalise</button>');
      if (d.id) b.push('<button class="btn danger ghost" data-action="doc-delete">Delete draft</button>');
    } else {
      var url = d.meta && d.meta.pdfUrl;
      if (url) b.push('<a class="btn primary" href="' + esc(url) + '" target="_blank" rel="noopener">Open PDF in Drive</a>');
      else if (d.status === 'FINAL') b.push('<button class="btn primary" data-action="doc-storepdf">Save the PDF to Drive</button>');
      b.push('<button class="btn" data-action="doc-download">Download PDF</button>');
      if (url) b.push('<button class="btn" data-action="doc-email">Email…</button>');
      b.push('<button class="btn" data-action="doc-duplicate">Duplicate</button>');
      if (d.type === 'PI' && d.status === 'FINAL') b.push('<button class="btn" data-action="doc-to-invoice">Make tax invoice</button>');
      if (d.status === 'FINAL') b.push('<button class="btn" data-action="doc-amend">Amend…</button>');
      if (d.status === 'FINAL') b.push('<button class="btn danger ghost" data-action="doc-cancel">Cancel…</button>');
    }
    return '<div class="actions">' + b.join('') + '</div>';
  }

  function refreshTotals() {
    if (S.view !== 'doc' || !S.doc) return;
    var c = calc(S.doc);
    $$('#lines .line').forEach(function (el) {
      var l = c.lines[+el.dataset.i];
      var t = $('.line-total', el);
      if (t && l) t.textContent = l.qty && (l.rate || l.rate === 0) ? rupees(l.total) : '—';
    });
    var mode = $('#tax-mode');
    if (mode) mode.textContent = S.doc.pos && S.doc.pos.code ? (c.intra ? 'Same state: CGST + ' + c.sgstLabel : 'Other state: IGST') + (S.doc.pricesIncludeGst ? ' · rates include GST' : '') : 'Choose the place of supply to work out the tax';
    var rows = [];
    if (c.discount > 0) { rows.push(['Gross amount', rupees(c.gross)]); rows.push(['Discount', '- ' + rupees(c.discount)]); }
    rows.push(['Taxable value', rupees(c.taxable)]);
    if (c.intra) { rows.push(['CGST', rupees(c.cgst)]); rows.push([c.sgstLabel, rupees(c.sgst)]); } else rows.push(['IGST', rupees(c.igst)]);
    if (c.roundOff) rows.push(['Round off', (c.roundOff > 0 ? '+ ' : '- ') + rupees(Math.abs(c.roundOff))]);
    var tot = $('#totals');
    if (tot) tot.innerHTML = '<div class="words">' + esc(c.words) + '</div><table>' + rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td class="num">' + r[1] + '</td></tr>'; }).join('') +
      '<tr class="grand"><td>Total</td><td class="num">' + rupees(c.payable) + '</td></tr></table>';
  }

  // Applies a party (and one of its registrations) to the document.
  function applyParty(p, regId) {
    var d = S.doc;
    var r = p.registrations.filter(function (x) { return x.id === regId; })[0] || p.registrations.filter(function (x) { return x.isDefault; })[0] || p.registrations[0] || {};
    d.party = { id: p.id, name: p.name, regId: r.id, label: r.label, gstin: r.gstin || '', legalName: r.legalName || '', address: r.address || '', city: r.city || '',
      stateCode: r.stateCode || '', pin: r.pin || '', email: p.email || '', phone: p.phone || '', contact: p.contact || '' };
    if (d.posAuto !== false) d.pos = { code: d.type === 'PO' ? (S.settings.firm.stateCode || '07') : (r.stateCode || '') };
    S.dirty = true;
  }
  function applyProduct(line, name) {
    var p = S.products.filter(function (x) { return x.name.toLowerCase() === String(name).toLowerCase(); })[0];
    if (!p) return false;
    line.productId = p.id; line.name = p.name; line.type = p.type; line.hsn = p.hsn; line.unit = p.unit; line.gstRate = p.gstRate;
    if (p.rate) line.rate = p.rate;
    if (!line.description && p.description) line.description = p.description;
    return true;
  }

  // ---------------------------------------------------------------- PDFs
  function makePdf(doc, watermark) {
    var c = calc(doc);
    var dd = PBPDF.build(doc, c, S.settings, S.images || {}, { watermark: watermark });
    return pdfMake.createPdf(dd);
  }
  // Inline preview: Chrome's own PDF viewer is blocked inside the Apps Script frame (and on phones),
  // so pages are drawn with pdf.js, loaded only when needed.
  var PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  var PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  function loadScript(src, failMsg) {
    return new Promise(function (resolve, reject) {
      var el = document.createElement('script');
      el.src = src; el.onload = resolve; el.onerror = function () { reject(new Error(failMsg || 'Could not load the PDF viewer. Use Download instead.')); };
      document.head.appendChild(el);
    });
  }
  async function pdfjs() {
    if (!window.pdfjsLib) { await loadScript(PDFJS_URL); window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; }
    return window.pdfjsLib;
  }
  async function previewPdf(doc) {
    busy(true, 'Making the PDF…');
    try {
      await loadImages();
      var pdf = makePdf(doc, doc.status === 'DRAFT' ? 'DRAFT' : (doc.status === 'CANCELLED' ? 'CANCELLED' : (S.amending ? 'PREVIEW' : null)));
      var buf = await new Promise(function (resolve) { pdf.getBuffer(resolve); });
      var url = URL.createObjectURL(new Blob([buf], { type: 'application/pdf' }));
      var name = PBPDF.fileName(doc);
      modal('<div class="pdf-head"><h2>' + esc(name) + '</h2><span class="grow"></span><button class="btn" id="pdf-dl">Download</button><a class="btn" href="' + url + '" target="_blank" rel="noopener">Open in a new tab</a><button class="btn primary" data-close>Close</button></div><div class="pdf-pages" id="pdf-pages"><p class="muted">Drawing the pages…</p></div>');
      $('#modal').classList.add('wide');
      $('#pdf-dl').onclick = function () { pdf.download(name); };
      closeModal.after = function () { $('#modal').classList.remove('wide'); setTimeout(function () { URL.revokeObjectURL(url); }, 60000); };
      var holder = $('#pdf-pages');
      try {
        var lib = await pdfjs();
        var pdfDoc = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
        holder.innerHTML = '';
        var cssWidth = Math.min(holder.clientWidth || 800, 900);
        for (var i = 1; i <= pdfDoc.numPages; i++) {
          var page = await pdfDoc.getPage(i);
          var base = page.getViewport({ scale: 1 });
          var vp = page.getViewport({ scale: (cssWidth / base.width) * Math.min(window.devicePixelRatio || 1, 2) });
          var c = document.createElement('canvas');
          c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
          c.setAttribute('aria-label', 'Page ' + i + ' of ' + pdfDoc.numPages);
          holder.appendChild(c);
          await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        }
      } catch (e) {
        holder.innerHTML = '<p class="bad">' + esc(cleanMsg(e)) + '</p>';
      }
    } catch (e) { showError(e); }
    finally { busy(false); }
  }
  async function storePdf(doc, email) {
    await loadImages();
    var pdf = makePdf(doc, doc.status === 'CANCELLED' ? 'CANCELLED' : null);
    var b64 = await new Promise(function (resolve) { pdf.getBase64(resolve); });
    var res = await call('apiStorePdf', doc.id, b64, { email: email });
    doc.meta = doc.meta || {};
    doc.meta.pdfUrl = res.pdfUrl; doc.meta.pdfFileId = res.pdfFileId;
    upsertSummary(res.summary);
    return res;
  }
  function upsertSummary(sum) {
    if (!sum) return;
    var i = S.docs.findIndex(function (x) { return x.id === sum.id; });
    if (i >= 0) S.docs[i] = sum; else S.docs.unshift(sum);
  }


  // ---------------------------------------------------------------- import from Excel, CSV or pasted rows
  var XLSX_URLS = ['https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js', 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'];
  async function xlsxLib() {
    if (window.XLSX) return window.XLSX;
    for (var i = 0; i < XLSX_URLS.length; i++) {
      try { await loadScript(XLSX_URLS[i], 'x'); if (window.XLSX) return window.XLSX; } catch (e) { /* try the next copy */ }
    }
    throw new Error('Could not load the Excel reader. Save the file as CSV, or copy the rows in Excel and paste them here.');
  }
  function cellStr(v) { return v == null ? '' : String(v).trim(); }
  function cellNum(v) {
    if (typeof v === 'number') return v;
    var t = String(v == null ? '' : v).replace(/[^\d.\-]/g, '');
    return t === '' || t === '-' || t === '.' ? NaN : parseFloat(t);
  }
  function hsnStr(v) { return cellStr(v).replace(/\.0+$/, '').replace(/\s+/g, ''); }
  /** Rows from CSV or from cells copied in Excel (tab-separated). Handles quoted cells. */
  function parseDelimited(text) {
    text = String(text || '').replace(/^﻿/, '');
    var first = text.split(/\r?\n/)[0] || '';
    var delim = first.indexOf('\t') >= 0 ? '\t' : (first.split(';').length > first.split(',').length ? ';' : ',');
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else if (ch === '"' && cell === '') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ''; }); });
  }
  /** Finds the header row (first 10 rows) and which column holds each field. */
  function headerMap(rows, kind, minHits) {
    var F = PB.IMPORT[kind].fields;
    for (var i = 0; i < Math.min(rows.length, 10); i++) {
      var map = {}, hits = 0;
      (rows[i] || []).forEach(function (cell, c) {
        var k = PB.normKey(cell);
        if (!k) return;
        Object.keys(F).forEach(function (f) { if (map[f] == null && F[f].indexOf(k) >= 0) { map[f] = c; hits++; } });
      });
      if (hits >= (minHits || 3)) return { headerRow: i, map: map };
    }
    return null;
  }
  function buildImport(kind, rows, source) {
    var t = headerMap(rows, kind);
    if (!t) return { kind: kind, source: source, items: [], skipped: 0, problems: ['The header row was not found. Keep the template’s first row (' + PB.IMPORT[kind].columns.slice(0, 5).join(', ') + ' …).'] };
    var data = rows.slice(t.headerRow + 1).map(function (r, i) {
      return { n: t.headerRow + 2 + i, get: function (f) { return t.map[f] != null ? r[t.map[f]] : ''; }, blank: !r.some(function (c) { return cellStr(c) !== ''; }) };
    }).filter(function (r) { return !r.blank; });
    var out = kind === 'documents' ? buildDocs(data) : kind === 'parties' ? buildParties(data) : buildItems(data);
    out.kind = kind; out.source = source;
    return out;
  }
  function isExample(v) { return /^example\b/i.test(cellStr(v)); }
  /** One GST registration / address from a row. */
  function regOf(get) {
    var gstin = cellStr(get('gstin')).toUpperCase().replace(/\s+/g, '');
    var base = { label: cellStr(get('label')), legalName: cellStr(get('legal')), address: cellStr(get('address')), city: cellStr(get('city')), pin: hsnStr(get('pin')) };
    if (gstin) {
      var g = PB.checkGstin(gstin);
      if (!g.ok) return { problem: 'GSTIN ' + gstin + ': ' + g.error, bad: true };
      base.gstin = gstin; base.stateCode = g.stateCode; return { reg: base };
    }
    var sc = PB.stateCodeOf(get('state'));
    if (!sc) return { problem: 'a new customer or vendor needs its State (name or code) or GSTIN.' };
    base.gstin = ''; base.stateCode = sc; return { reg: base };
  }
  function buildItems(data) {
    var problems = [], items = [], skipped = 0;
    data.forEach(function (r) {
      var name = cellStr(r.get('name'));
      if (isExample(name)) { skipped++; return; }
      if (!name) { problems.push('Row ' + r.n + ': the name is empty.'); return; }
      var hsn = hsnStr(r.get('hsn')), kv = cellStr(r.get('kind'));
      var type = /serv/i.test(kv) ? 'Service' : /good/i.test(kv) ? 'Goods' : (/^99\d{4}$/.test(hsn) ? 'Service' : 'Goods');
      var gr = cellNum(r.get('gst')), rate = cellNum(r.get('rate'));
      if (PB.GST_RATES.indexOf(gr) < 0) problems.push('Row ' + r.n + ' (' + name + '): GST % must be one of ' + PB.GST_RATES.join(', ') + '.');
      if (hsn) { var e = PB.checkHsn(hsn, type); if (e) problems.push('Row ' + r.n + ' (' + name + '): ' + e + '.'); }
      items.push({ row: r.n, name: name, description: cellStr(r.get('details')), type: type, hsn: hsn, unit: cellStr(r.get('unit')) || 'Nos', rate: isNaN(rate) ? 0 : rate, gstRate: gr, category: cellStr(r.get('category')) });
    });
    var have = {}; S.products.forEach(function (p) { have[p.name.toLowerCase()] = 1; });
    var upd = items.filter(function (x) { return have[x.name.toLowerCase()]; }).length;
    return { problems: problems, items: items, skipped: skipped, summary: items.length + ' item' + (items.length === 1 ? '' : 's') + ': ' + (items.length - upd) + ' new, ' + upd + ' to update' };
  }
  function buildParties(data) {
    var problems = [], by = {}, order = [], skipped = 0;
    data.forEach(function (r) {
      var name = cellStr(r.get('name'));
      if (isExample(name)) { skipped++; return; }
      if (!name) { problems.push('Row ' + r.n + ': the name is empty.'); return; }
      var rv = PB.normKey(r.get('role'));
      var role = !rv || rv.indexOf('cust') === 0 ? 'Customer' : (rv.indexOf('vend') === 0 || rv === 'supplier') ? 'Vendor' : rv === 'both' ? 'Both' : '';
      if (!role) problems.push('Row ' + r.n + ' (' + name + '): Type must be Customer, Vendor or Both.');
      var ro = regOf(r.get);
      if (ro.problem) problems.push('Row ' + r.n + ' (' + name + '): ' + ro.problem);
      var k = name.toLowerCase(), p = by[k];
      if (!p) { p = by[k] = { row: r.n, name: name, role: role || 'Customer', contact: '', phone: '', email: '', registrations: [] }; order.push(k); }
      else if (role && p.role !== role) p.role = 'Both';
      ['contact', 'phone', 'email'].forEach(function (f) { if (!p[f]) p[f] = cellStr(r.get(f)); });
      if (ro.reg) p.registrations.push(ro.reg);
    });
    var items = order.map(function (k) { var p = by[k]; if (p.registrations.length) p.registrations[0].isDefault = true; return p; });
    var have = {}; S.parties.forEach(function (p) { have[p.name.toLowerCase()] = 1; });
    var upd = items.filter(function (x) { return have[x.name.toLowerCase()]; }).length;
    return { problems: problems, items: items, skipped: skipped, summary: items.length + ' customer' + (items.length === 1 ? '' : 's') + ' or vendor' + (items.length === 1 ? '' : 's') + ': ' + (items.length - upd) + ' new, ' + upd + ' already here (new GSTINs or addresses are added)' };
  }
  function lineFromRow(r, type, status, label, problems, warnings) {
    var name = cellStr(r.get('item')), hsn = hsnStr(r.get('hsn')), kv = cellStr(r.get('kind'));
    var itype = /serv/i.test(kv) ? 'Service' : /good/i.test(kv) ? 'Goods' : (/^99\d{4}$/.test(hsn) ? 'Service' : 'Goods');
    var qty = cellNum(r.get('qty')), rate = cellNum(r.get('rate')), gr = cellNum(r.get('gst')), disc = cellNum(r.get('disc'));
    var p = S.products.filter(function (x) { return x.name.toLowerCase() === name.toLowerCase(); })[0];
    if (p) { if (!hsn) hsn = p.hsn; if (isNaN(gr)) gr = p.gstRate; if (isNaN(rate) && p.rate) rate = p.rate; if (!kv) itype = p.type; }
    var where = label + ', row ' + r.n + ' (' + name + ')';
    if (isNaN(qty)) qty = 1;
    if (!(qty > 0)) problems.push(where + ': Qty must be more than 0.');
    if (isNaN(rate)) { if (status === 'DRAFT') rate = ''; else problems.push(where + ': the Rate is empty.'); }
    if (isNaN(gr) && status === 'DRAFT') { gr = 18; warnings.push(where + ': GST % was empty, set to 18%. Check it in the draft.'); }
    if (PB.GST_RATES.indexOf(gr) < 0) problems.push(where + ': GST % must be one of ' + PB.GST_RATES.join(', ') + '.');
    if (type === 'INV' && status !== 'DRAFT') { var e = PB.checkHsn(hsn, itype); if (e) problems.push(where + ': ' + e + '.'); }
    return { productId: p ? p.id : '', name: name, description: cellStr(r.get('details')) || (p ? p.description || '' : ''), type: itype, hsn: hsn,
      qty: qty, unit: cellStr(r.get('unit')) || (p ? p.unit : 'Nos'), rate: rate, discountPct: isNaN(disc) ? '' : disc, gstRate: gr };
  }
  function docFromGroup(g, problems, warnings) {
    var r = g.first, T = PB.TYPES[g.type];
    var label = T.short + ' ' + g.ref + ' (row ' + r.n + ')';
    var status = PB.statusOf(r.get('status'));
    if (!status) { problems.push(label + ': Status must be Draft, Final, Issued or Cancelled.'); return null; }
    var dv = cellStr(r.get('date')), date = PB.parseDate(r.get('date'));
    if (!date) {
      if (status === 'DRAFT' && !dv) date = PB.today();
      else { problems.push(label + ': ' + (dv ? 'the Date “' + dv + '” is not a date. Write it day first, e.g. 28-09-2026.' : 'the Date is empty.')); return null; }
    }
    var partyName = cellStr(r.get('party'));
    if (!partyName) { problems.push(label + ': the ' + (g.type === 'PO' ? 'vendor' : 'customer') + ' is empty.'); return null; }
    var posRaw = cellStr(r.get('pos')), pos = PB.stateCodeOf(posRaw);
    if (posRaw && !pos) problems.push(label + ': the Place of supply “' + posRaw + '” is not a state.');
    if (status !== 'DRAFT' && g.type === 'INV') { var ne = PB.checkInvoiceNumber(g.ref); if (ne) problems.push(label + ': ' + ne); }
    var items = g.lines.map(function (lr) { return lineFromRow(lr, g.type, status, label, problems, warnings); });
    if (!items.length) { problems.push(label + ': no item lines.'); return null; }
    var refV = cellStr(r.get('reference'));
    var ro = regOf(r.get);
    if (ro.bad) problems.push(label + ': ' + ro.problem);
    return {
      label: label, cancelReason: cellStr(r.get('reason')),
      who: { name: partyName, gstin: ro.reg ? ro.reg.gstin : '', stateCode: ro.reg ? ro.reg.stateCode : '', reg: ro.reg || null, regProblem: ro.problem || '' },
      doc: {
        type: g.type, status: status, number: status === 'DRAFT' ? '' : g.ref, date: date, party: {}, pos: { code: pos }, posAuto: !pos,
        reverseCharge: PB.yesNo(r.get('rc'), false), pricesIncludeGst: PB.yesNo(r.get('incl'), false), roundOff: PB.yesNo(r.get('round'), true),
        refs: refV ? (g.type === 'PO' ? { quoteRef: refV } : { poNumber: refV }) : {}, shipTo: { same: true }, items: items,
        notes: cellStr(r.get('notes')) || (S.settings.notes[g.type] || ''), terms: S.settings.terms[g.type] || '',
        annexure: { enabled: false, title: 'Annexure A', intro: '', rows: [], notes: '' }, meta: {}
      }
    };
  }
  /** An existing customer or vendor for a document row: by GSTIN first, then by name. */
  function findParty(who, type) {
    var list = partiesFor(type);
    if (who.gstin) {
      for (var i = 0; i < list.length; i++) {
        var hit = list[i].registrations.filter(function (rg) { return String(rg.gstin || '').toUpperCase() === who.gstin; })[0];
        if (hit) return { p: list[i], reg: hit };
      }
    }
    var p = list.filter(function (x) { return x.name.toLowerCase() === who.name.toLowerCase(); })[0];
    if (!p || who.gstin) return null;
    var reg = p.registrations.filter(function (rg) { return who.stateCode && rg.stateCode === who.stateCode; })[0] ||
      p.registrations.filter(function (rg) { return rg.isDefault; })[0] || p.registrations[0];
    return reg ? { p: p, reg: reg } : null;
  }
  function partySnapshot(p, r) {
    return { id: p.id, name: p.name, regId: r.id, label: r.label, gstin: r.gstin || '', legalName: r.legalName || '', address: r.address || '', city: r.city || '',
      stateCode: r.stateCode || '', pin: r.pin || '', email: p.email || '', phone: p.phone || '', contact: p.contact || '' };
  }
  function buildDocs(data) {
    var problems = [], warnings = [], groups = {}, order = [], skipped = 0;
    data.forEach(function (r) {
      if (isExample(r.get('party')) || isExample(r.get('item'))) { skipped++; return; }
      var type = PB.docTypeOf(r.get('type')), ref = cellStr(r.get('ref'));
      if (!type) { problems.push('Row ' + r.n + ': Type must be Invoice, Proforma or PO.'); return; }
      if (!ref) { problems.push('Row ' + r.n + ': Doc no. is empty. Write the same value on every line of one document.'); return; }
      var key = type + '|' + ref.toUpperCase(), g = groups[key];
      if (!g) { g = groups[key] = { type: type, ref: ref, first: r, lines: [] }; order.push(key); }
      if (cellStr(r.get('item'))) g.lines.push(r);
      else if (cellStr(r.get('qty')) || cellStr(r.get('rate'))) problems.push('Row ' + r.n + ': the Item is empty.');
    });
    var docs = order.map(function (k) { return docFromGroup(groups[k], problems, warnings); }).filter(Boolean);
    var seen = {};
    docs.forEach(function (x) {
      var d = x.doc;
      if (d.status !== 'FINAL') return;
      var fyl = PB.fy(d.date).long, k = d.type + '|' + fyl + '|' + d.number.toUpperCase();
      if (seen[k]) problems.push(x.label + ': number ' + d.number + ' is twice in the file as final.');
      seen[k] = 1;
      var clash = S.docs.filter(function (o) { return o.type === d.type && o.status === 'FINAL' && String(o.number).toUpperCase() === d.number.toUpperCase() && (o.fy || PB.fy(o.date).long) === fyl; })[0];
      if (clash) problems.push(x.label + ': number ' + d.number + ' is already used in this app (' + clash.partyName + ').');
    });
    // Customers and vendors: matched, or added (new ones, or a new GSTIN for one that exists).
    var by = {}, newParties = [];
    docs.forEach(function (x) {
      var w = x.who, role = x.doc.type === 'PO' ? 'Vendor' : 'Customer';
      x.match = findParty(w, x.doc.type);
      if (x.match) return;
      if (!w.reg) { if (w.regProblem && !/^GSTIN/.test(w.regProblem)) problems.push(x.label + ': ' + w.regProblem); return; }
      var same = S.parties.filter(function (p) { return p.name.toLowerCase() === w.name.toLowerCase(); })[0];
      var k = w.name.toLowerCase();
      if (!by[k]) { by[k] = { row: 0, name: same ? same.name : w.name, role: role, registrations: [] }; newParties.push(by[k]); }
      else if (by[k].role !== role) by[k].role = 'Both';
      var dup = by[k].registrations.some(function (rg) { return (rg.gstin && rg.gstin === w.reg.gstin) || (!rg.gstin && !w.reg.gstin && rg.address === w.reg.address && rg.stateCode === w.reg.stateCode); });
      if (!dup) by[k].registrations.push(w.reg);
    });
    newParties.forEach(function (p) { p.registrations[0].isDefault = true; });
    var counts = {}, order2 = [];
    docs.forEach(function (x) { var k = x.doc.type + '|' + x.doc.status; if (!counts[k]) { counts[k] = 0; order2.push(k); } counts[k]++; });
    var label2 = function (k) {
      var t = k.split('|')[0], st = k.split('|')[1], n = counts[k];
      var name = t === 'PO' ? 'PO' : PB.TYPES[t].short.toLowerCase();
      return n + ' ' + name + (n === 1 ? '' : 's') + ' ' + ({ DRAFT: 'to finish (draft)', FINAL: 'issued', CANCELLED: 'cancelled' }[st]);
    };
    return { problems: problems, warnings: warnings, items: docs, newParties: newParties, skipped: skipped,
      summary: docs.length + ' document' + (docs.length === 1 ? '' : 's') + (docs.length ? ': ' + order2.map(label2).join(', ') : '') +
        (newParties.length ? '. Customers or vendors to add: ' + newParties.map(function (p) { return p.name; }).join(', ') : '') };
  }
  function previewCalc(x) {
    var d = x.doc, reg = x.match ? x.match.reg : (x.who.reg || {});
    var firmState = String(S.settings.firm.stateCode || '07');
    var pos = d.pos.code || (d.type === 'PO' ? firmState : reg.stateCode || '');
    return PB.compute(Object.assign({}, d, { pos: { code: pos } }), d.type === 'PO' ? String(reg.stateCode || '') : firmState);
  }
  var IMPORT_HELP = {
    documents: '<p>One row per item line. Lines with the same <b>Type</b> and <b>Doc no.</b> make one document.</p><ul class="checks">' +
      '<li><b>Final</b> or <b>Issued</b>: already issued (for example before this app). Recorded with its own number, not emailed, no PDF until you ask for one.</li>' +
      '<li><b>Cancelled</b>: recorded as cancelled. Its number can be given again later.</li>' +
      '<li><b>Draft</b>: opens in the app to check and finalise. It gets its number then.</li>' +
      '<li>New customers and vendors are added. Each series continues after its highest number.</li></ul>',
    parties: '<p>One row per GST registration or address. Repeat the name for a customer with several GSTINs or sites. A name that already exists gets the new GSTINs or addresses added; nothing is removed.</p>',
    items: '<p>One row per item or service. A name that already exists is updated with the new code, unit, rate and GST rate.</p>'
  };
  function viewImport() {
    var k = S.imp.kind, T = PB.IMPORT[k];
    return '<section class="card"><div class="head-row"><h1>Import from Excel</h1></div>' +
      '<p class="muted">Fill the template in Excel or Google Sheets. Upload it as .xlsx or .csv, or copy the rows with the header row and paste them here. You see everything before it is saved.</p>' +
      '<div class="seg">' + [['documents', 'Invoices, proformas, POs'], ['parties', 'Customers and vendors'], ['items', 'Items']].map(function (o) {
        return '<button data-impkind="' + o[0] + '" class="' + (k === o[0] ? 'on' : '') + '">' + o[1] + '</button>';
      }).join('') + '</div></section>' +
      '<section class="card"><h2>' + esc(T.title) + '</h2>' + IMPORT_HELP[k] +
      '<div class="actions left"><button class="btn" data-action="tpl-xlsx">Download template (.xlsx)</button><button class="btn" data-action="tpl-csv">Download template (.csv)</button></div>' +
      '<div class="grid2"><label>Upload the filled file (.xlsx, .xls or .csv)<input type="file" accept=".xlsx,.xls,.csv,.txt" data-impfile></label>' +
      '<label>Or paste rows copied from Excel, with the header row<textarea data-imppaste rows="4" placeholder="Paste here"></textarea></label></div>' +
      '<div class="actions left"><button class="btn" data-action="imp-read-paste">Read the pasted rows</button></div></section>' +
      (S.imp.parsed && S.imp.parsed.kind === k ? previewHtml() : '');
  }
  function previewHtml() {
    var P = S.imp.parsed, k = P.kind, blocked = P.problems.length > 0;
    var out = '<section class="card" id="imp-preview"><div class="head-row"><h2>Check before importing</h2><span class="grow"></span><button class="btn small" data-action="imp-clear">Clear</button></div>' +
      (P.source ? '<p class="muted small">From ' + esc(P.source) + '</p>' : '') +
      (P.summary ? '<p><b>' + esc(P.summary) + '</b></p>' : '') +
      (P.skipped ? '<p class="muted small">' + P.skipped + ' EXAMPLE row' + (P.skipped === 1 ? '' : 's') + ' skipped.</p>' : '') +
      (blocked ? '<div class="alert"><b>Nothing can be imported until these are fixed in the file:</b><ul>' + P.problems.slice(0, 40).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') +
        (P.problems.length > 40 ? '<li>…and ' + (P.problems.length - 40) + ' more</li>' : '') + '</ul></div>' : '') +
      ((P.warnings || []).length ? '<ul class="checks">' + P.warnings.map(function (w) { return '<li class="bad">' + esc(w) + '</li>'; }).join('') + '</ul>' : '');
    var rows = '';
    if (k === 'documents') {
      rows = '<thead><tr><th>Type</th><th>Number</th><th>Status</th><th>Date</th><th>Customer / vendor</th><th class="num">Lines</th><th class="num">Total</th></tr></thead><tbody>' +
        P.items.map(function (x) {
          var d = x.doc, c = previewCalc(x);
          return '<tr><td>' + typeBadge(d.type) + '</td><td class="nowrap">' + esc(d.number || 'given at finalise') + '</td><td>' + statusPill(d.status) + '</td><td class="nowrap">' + esc(PB.prettyDate(d.date)) + '</td><td>' + esc(x.match ? x.match.p.name : x.who.name) +
            (x.match ? '' : ' <span class="pill">new</span>') + '</td><td class="num">' + d.items.length + '</td><td class="num nowrap">' + rupees(c.payable) + '</td></tr>';
        }).join('') + '</tbody>';
    } else if (k === 'parties') {
      rows = '<thead><tr><th>Name</th><th>Type</th><th>GSTINs and addresses</th></tr></thead><tbody>' + P.items.map(function (p) {
        return '<tr><td><b>' + esc(p.name) + '</b></td><td>' + esc(p.role) + '</td><td>' + p.registrations.map(function (r) { return esc([r.label, r.gstin || 'Unregistered', PB.stateName(r.stateCode)].filter(Boolean).join(' · ')); }).join('<br>') + '</td></tr>';
      }).join('') + '</tbody>';
    } else {
      rows = '<thead><tr><th>Item</th><th>Type</th><th>HSN/SAC</th><th>Unit</th><th class="num">Rate</th><th class="num">GST</th></tr></thead><tbody>' + P.items.map(function (p) {
        return '<tr><td><b>' + esc(p.name) + '</b></td><td>' + esc(p.type) + '</td><td>' + esc(p.hsn) + '</td><td>' + esc(p.unit) + '</td><td class="num">' + (p.rate ? rupees(p.rate) : '—') + '</td><td class="num">' + esc(p.gstRate) + '%</td></tr>';
      }).join('') + '</tbody>';
    }
    if (P.items.length) out += '<div class="table-wrap"><table class="list preview">' + rows + '</table></div>';
    out += '<div class="actions left"><button class="btn primary" data-action="imp-run"' + (blocked || !P.items.length ? ' disabled' : '') + '>Import ' + (P.items.length || '') + '</button></div></section>';
    return out;
  }
  async function readImportFile(file) {
    if (!file) return;
    var kind = S.imp.kind;
    try {
      var rows;
      if (/\.(csv|txt|tsv)$/i.test(file.name)) rows = parseDelimited(await file.text());
      else {
        var X = await run('Reading the file…', xlsxLib);
        var wb = X.read(await file.arrayBuffer(), { type: 'array' });
        var name = wb.SheetNames.filter(function (n) { return !/how to fill|instruction/i.test(n); })[0] || wb.SheetNames[0];
        rows = X.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '' });
      }
      S.imp.parsed = buildImport(kind, rows, file.name);
    } catch (e) { S.imp.parsed = { kind: kind, problems: [cleanMsg(e)], items: [], skipped: 0 }; }
    render();
    var pv = $('#imp-preview'); if (pv) pv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function csvOf(rows) {
    return rows.map(function (r) { return r.map(function (c) { var v = c == null ? '' : String(c); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n');
  }
  function saveBlob(name, blob) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 4000);
  }
  async function downloadTemplate(kind, fmt) {
    var T = PB.IMPORT[kind], rows = [T.columns].concat(T.examples);
    if (fmt === 'csv') { saveBlob(T.file + '.csv', new Blob(['﻿' + csvOf(rows)], { type: 'text/csv;charset=utf-8' })); return; }
    var X = await run('Preparing the template…', xlsxLib);
    var wb = X.utils.book_new();
    var ws = X.utils.aoa_to_sheet(rows);
    ws['!cols'] = T.columns.map(function (h, i) {
      var w = rows.reduce(function (a, r) { return Math.max(a, String(r[i] == null ? '' : r[i]).length); }, 0);
      return { wch: Math.min(Math.max(10, w + 2), 40) };
    });
    X.utils.book_append_sheet(wb, ws, 'Fill here');
    var notes = X.utils.aoa_to_sheet([['Column', 'What to write']].concat(T.notes).concat([[''], ['Rows that start with EXAMPLE', 'are skipped when you import. Delete them or type over them.']]));
    notes['!cols'] = [{ wch: 30 }, { wch: 110 }];
    X.utils.book_append_sheet(wb, notes, 'How to fill');
    X.writeFile(wb, T.file + '.xlsx');
  }
  /** Adds item lines pasted from Excel to the open document. */
  function pasteLines(rows) {
    if (!rows.length) return 0;
    var ORDER = ['item', 'details', 'hsn', 'qty', 'unit', 'rate', 'gst', 'disc'];
    var t = headerMap(rows, 'documents', 2), getters;
    if (t && t.map.item != null) getters = rows.slice(t.headerRow + 1).map(function (r) { return function (f) { return t.map[f] != null ? r[t.map[f]] : ''; }; });
    else getters = rows.map(function (r) { return function (f) { var i = ORDER.indexOf(f); return i >= 0 ? r[i] : ''; }; });
    var d = S.doc, added = 0;
    if (d.items.length === 1 && !String(d.items[0].name || '').trim()) d.items = [];
    getters.forEach(function (get) {
      var name = cellStr(get('item'));
      if (!name) return;
      var line = blankLine();
      applyProduct(line, name);
      line.name = name;
      var det = cellStr(get('details')); if (det) line.description = det;
      var hsn = hsnStr(get('hsn')); if (hsn) { line.hsn = hsn; line.type = /^99\d{4}$/.test(hsn) ? 'Service' : 'Goods'; }
      var q = cellNum(get('qty')); if (!isNaN(q)) line.qty = q;
      var u = cellStr(get('unit')); if (u) line.unit = u;
      var r = cellNum(get('rate')); if (!isNaN(r)) line.rate = r;
      var g = cellNum(get('gst')); if (PB.GST_RATES.indexOf(g) >= 0) line.gstRate = g;
      var dc = cellNum(get('disc')); if (!isNaN(dc)) line.discountPct = dc;
      d.items.push(line); added++;
    });
    if (!d.items.length) d.items.push(blankLine());
    return added;
  }

  // ---------------------------------------------------------------- document actions
  var actions = {
    'doc-save': async function () {
      var res = await run('Saving draft…', function () { return call('apiSaveDraft', S.doc); });
      S.doc = res.doc; S.dirty = false; upsertSummary(res.summary); toast('Draft saved'); render();
    },
    'doc-preview': function () { previewPdf(S.doc); },
    'doc-finalise': async function () {
      var d = S.doc;
      S.errors = PB.validate(d, S.settings.firm);
      var np = numberProblem(d); if (np) S.errors.push(np);
      if (S.errors.length) { render(); window.scrollTo(0, 0); return; }
      var T = PB.TYPES[d.type], fy = PB.fy(d.date), st = S.series[d.type] || {};
      var n = d.numbering || { mode: 'auto' };
      var num = n.mode === 'auto' ? (st.fy === fy.short ? st.next : 'the next number in ' + fy.long) : n.number;
      var to = S.settings.email.onFinalise !== 'no' && S.settings.email.to ? S.settings.email.to : '';
      var choice = await finaliseBox(T, num, calc(d), to, n.mode !== 'manual');
      if (!choice) return;
      var res = await run('Finalising…', function () { return call('apiFinalise', d); });
      S.doc = res.doc; S.dirty = false; S.errors = []; upsertSummary(res.summary); if (res.series) S.series = res.series;
      render();
      try {
        var r2 = await run('Saving the PDF to Drive…', function () { return storePdf(S.doc, choice.email); });
        toast(S.doc.number + ' is final. PDF saved' + (r2.emailed ? ' and emailed.' : '.'));
      } catch (e) { toast('The document is final, but the PDF was not saved. Use “Save the PDF to Drive”.', 'error'); }
      render();
    },
    'doc-amend': function () { startAmend(); },
    'amend-discard': function () {
      S.doc = S.amendBase || S.doc; S.amending = false; S.amendBase = null; S.dirty = false; S.errors = [];
      render(); toast('Changes discarded');
    },
    'amend-save': async function () {
      var d = S.doc, base = S.amendBase || {};
      S.errors = PB.validate(d, d.firm || S.settings.firm);
      var np = d.numbering && d.numbering.mode === 'manual' ? numberProblem(d) : ''; if (np) S.errors.push(np);
      if (S.errors.length) { render(); window.scrollTo(0, 0); return; }
      var c = calc(d), was = base.calc ? base.calc.payable : null;
      var newNo = d.numbering && d.numbering.mode === 'manual' && d.numbering.number && d.numbering.number !== d.number ? d.numbering.number : '';
      var to = S.settings.email.onFinalise !== 'no' && S.settings.email.to ? S.settings.email.to : '';
      var summary = 'Number: ' + d.number + (newNo ? ' → ' + newNo : ' (unchanged)') + '\nTotal: ' + (was != null && was !== c.payable ? rupees(was) + ' → ' : '') + rupees(c.payable) +
        '\n\nA new PDF is saved to Drive. The old PDF is kept there, renamed.';
      modal('<h2>Save the amendment?</h2><p class="pre">' + esc(summary) + '</p><form id="amend-form"><label>Reason (kept in the history)<input name="reason" required placeholder="e.g. Quantity corrected; customer GSTIN fixed"></label>' +
        (to ? '<label class="check"><input type="checkbox" name="email" checked> Email the amended PDF to ' + esc(to) + '</label>' : '') +
        '<div class="actions"><button type="button" class="btn" data-close>Back</button><button class="btn primary">Save amendment</button></div></form>', function (root) {
        $('#amend-form', root).onsubmit = async function (e) {
          e.preventDefault();
          var f = e.target.elements, reason = f.reason.value, email = !!(f.email && f.email.checked);
          var res = await run('Saving the amendment…', function () { return call('apiAmend', d, reason); });
          closeModal();
          S.doc = res.doc; S.amending = false; S.amendBase = null; S.dirty = false; S.errors = []; upsertSummary(res.summary); if (res.series) S.series = res.series;
          render();
          try {
            var r2 = await run('Saving the new PDF to Drive…', function () { return storePdf(S.doc, email); });
            toast(S.doc.number + ' amended. New PDF saved' + (r2.emailed ? ' and emailed.' : '.'));
          } catch (err) { toast('Amended, but the PDF was not saved. Use “Save the PDF to Drive”.', 'error'); }
          render();
        };
      });
    },
    'doc-storepdf': async function () {
      var r = await run('Saving the PDF to Drive…', function () { return storePdf(S.doc, true); });
      toast('PDF saved' + (r.emailed ? ' and emailed.' : '.')); render();
    },
    'doc-download': async function () {
      await run('Making the PDF…', loadImages);
      makePdf(S.doc, S.doc.status === 'CANCELLED' ? 'CANCELLED' : null).download(PBPDF.fileName(S.doc));
    },
    'doc-delete': async function () {
      if (!(await confirmBox('Delete this draft?', 'The draft is removed. Drafts have no number, so the series is not affected.', 'Delete'))) return;
      await run('Deleting…', function () { return call('apiDeleteDraft', S.doc.id); });
      S.docs = S.docs.filter(function (x) { return x.id !== S.doc.id; });
      S.dirty = false; go('docs'); toast('Draft deleted');
    },
    'doc-duplicate': function () { openNew(S.doc.type, copyDoc(S.doc, S.doc.type)); toast('Copy made. It is a new draft.'); },
    'doc-to-invoice': function () {
      var inv = copyDoc(S.doc, 'INV');
      inv.refs.piNumber = S.doc.number;
      openNew('INV', inv); toast('Tax invoice draft made from ' + S.doc.number + '. Check it and finalise.');
    },
    'doc-email': function () {
      var d = S.doc;
      var to = [S.settings.email.to, d.party.email].filter(Boolean).join(', ');
      modal('<h2>Email ' + esc(d.number) + '</h2><form id="mail-form"><label>To<input name="to" value="' + esc(to) + '"><span class="hint">Separate addresses with commas.</span></label><label>Copy to<input name="cc" value="' + esc(S.settings.email.cc) + '"></label><label>Message<textarea name="message" rows="3">Please find ' + esc(PB.TYPES[d.type].title.toLowerCase()) + ' ' + esc(d.number) + ' attached.</textarea></label><div class="actions"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Send</button></div></form>', function (root) {
        $('#mail-form', root).onsubmit = async function (e) {
          e.preventDefault();
          var f = e.target.elements;
          var sum = await run('Sending…', function () { return call('apiEmailDocument', d.id, f.to.value, f.cc.value, f.message.value); });
          upsertSummary(sum); closeModal(); toast('Email sent');
        };
      });
    },
    'doc-cancel': function () { cancelFlow(S.doc); },
    'line-add': function () { S.doc.items.push(blankLine()); S.dirty = true; render(); var l = $$('#lines .line'); if (l.length) $('[data-k="name"]', l[l.length - 1]).focus(); },
    'party-new-doc': function () { openParty(null, function (saved) { applyParty(saved); render(); }); },
    'party-edit-doc': function () { openParty(S.doc.party.id, function (saved) { applyParty(saved, S.doc.party.regId); render(); }); },
    'annex-add': function () { S.doc.annexure.rows = S.doc.annexure.rows || []; S.doc.annexure.rows.push({ description: '', spec: '', qty: '', unit: '', remarks: '' }); S.dirty = true; render(); },
    'party-new': function () { openParty(null); },
    'item-new': function () { openItem(null); },
    'items-starter': async function () {
      S.products = await run('Adding starter items…', function () { return call('apiAddStarterProducts'); });
      toast('Starter items added. Check their HSN/SAC codes and GST rates with your CA.'); render();
    },
    'settings-save': async function () {
      var data = {};
      $$('[data-s]').forEach(function (el) { data[el.dataset.s] = el.value; });
      var saved = await run('Saving settings…', function () { return call('apiSaveSettings', data); });
      S.settings = saved.settings;
      S.series = saved.series;
      toast('Settings saved'); render();
    },
    'series-set': async function (el) {
      var t = el.dataset.type, v = $('[data-series-last="' + t + '"]').value;
      var fy = (S.series[t] || {}).fy || PB.fy(PB.today()).short;
      S.series = await run('Saving…', function () { return call('apiSetSeries', t, fy, v); });
      toast('The next ' + PB.TYPES[t].short.toLowerCase() + ' number is ' + S.series[t].next); render();
    },
    'series-check': async function () {
      var res = await run('Checking…', function () { return call('apiCheckSeries'); });
      $('#series-result').innerHTML = res.length ? '<ul class="checks">' + res.map(function (r) {
        var ok = !r.gaps.length && !r.duplicates.length;
        return '<li class="' + (ok ? 'good' : 'bad') + '">' + (ok ? '✓ ' : '⚠ ') + esc(r.series) + ': ' + r.count + ' numbers, ' + r.first + ' to ' + r.last + (r.gaps.length ? '. Not in this app: ' + r.gaps.slice(0, 20).join(', ') + (r.gaps.length > 20 ? '…' : '') : '') + (r.duplicates.length ? '. Used twice: ' + r.duplicates.join(', ') : '') + (ok ? ', no gaps' : '') +
          (r.reissued && r.reissued.length ? '. Given again after cancelling: ' + r.reissued.join(', ') : '') + (r.other ? '. ' + r.other + ' number(s) outside this series' : '') + '</li>';
      }).join('') + '</ul>' : '<p class="muted">No final documents yet.</p>';
    },
    'imp-read-paste': function () {
      var ta = $('[data-imppaste]'), text = ta ? ta.value : '';
      if (!text.trim()) { toast('Paste the rows first, with the header row.', 'error'); return; }
      try { S.imp.parsed = buildImport(S.imp.kind, parseDelimited(text), 'pasted rows'); }
      catch (e) { S.imp.parsed = { kind: S.imp.kind, problems: [cleanMsg(e)], items: [], skipped: 0 }; }
      render();
      var pv = $('#imp-preview'); if (pv) pv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    'imp-clear': function () { S.imp.parsed = null; render(); },
    'tpl-xlsx': function () { return downloadTemplate(S.imp.kind, 'xlsx'); },
    'tpl-csv': function () { return downloadTemplate(S.imp.kind, 'csv'); },
    'imp-run': async function () {
      var P = S.imp.parsed;
      if (!P || P.problems.length || !P.items.length) return;
      if (P.kind === 'items') {
        var ri = await run('Importing items…', function () { return call('apiImportProducts', P.items); });
        S.products = ri.products; S.imp.parsed = null; toast(ri.added + ' items added, ' + ri.updated + ' updated'); render(); return;
      }
      if (P.kind === 'parties') {
        var rp = await run('Importing customers and vendors…', function () { return call('apiImportParties', P.items); });
        S.parties = rp.parties; S.imp.parsed = null; toast(rp.added + ' added, ' + rp.updated + ' updated'); render(); return;
      }
      var recorded = P.items.filter(function (x) { return x.doc.status !== 'DRAFT'; }).length;
      if (recorded && !(await confirmBox('Record ' + recorded + ' issued or cancelled document' + (recorded === 1 ? '' : 's') + '?',
        'They are saved with the numbers in the file, as they were issued. They are not emailed, and no PDF is made until you open one and choose “Save the PDF to Drive”. Each series continues after its highest number.', 'Import'))) return;
      if (P.newParties.length) {
        var np = await run('Adding customers and vendors…', function () { return call('apiImportParties', P.newParties); });
        S.parties = np.parties;
      }
      var list = [];
      for (var i = 0; i < P.items.length; i++) {
        var x = P.items[i], found = findParty(x.who, x.doc.type);
        if (!found) { showError(new Error(x.label + ': the customer or vendor could not be matched. No documents were imported.')); return; }
        x.doc.party = partySnapshot(found.p, found.reg);
        if (!x.doc.pos.code) x.doc.pos = { code: x.doc.type === 'PO' ? String(S.settings.firm.stateCode || '07') : found.reg.stateCode };
        var item = clone(x.doc); item.ref = x.label; item.cancelReason = x.cancelReason;
        list.push(item);
      }
      var res = await run('Importing documents…', function () { return call('apiImportDocuments', list); });
      res.summaries.forEach(upsertSummary); S.series = res.series; S.imp.parsed = null;
      toast(res.summaries.length + ' document' + (res.summaries.length === 1 ? '' : 's') + ' imported');
      go('docs');
    },
    'lines-paste': function () {
      modal('<h2>Paste lines from Excel</h2><p class="muted">Copy the rows in Excel and paste them here. With a header row, columns are matched by name (Item, Item details, HSN/SAC, Qty, Unit, Rate, GST %, Discount %). Without one, use this order: Item, Details, HSN/SAC, Qty, Unit, Rate, GST %, Discount %.</p>' +
        '<form id="paste-form"><textarea name="rows" rows="8" placeholder="Paste here" aria-label="Rows"></textarea><div class="actions"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Add the lines</button></div></form>', function (root) {
        $('#paste-form', root).onsubmit = function (e) {
          e.preventDefault();
          var added = pasteLines(parseDelimited(e.target.elements.rows.value));
          if (!added) { toast('No lines found. Each line needs an item name.', 'error'); return; }
          closeModal(); S.dirty = true; render(); toast(added + ' line' + (added === 1 ? '' : 's') + ' added');
        };
      });
    },
    'img-remove': async function (el) {
      S.images = await run('Saving…', function () { return call('apiRemoveImage', el.dataset.kind); });
      render();
    }
  };
  function finaliseBox(T, num, c, to, emailDefault) {
    return new Promise(function (resolve) {
      modal('<h2>Finalise this ' + esc(T.title.toLowerCase()) + '?</h2><p class="pre">' + esc('It gets number ' + num + ' and is locked. You can amend or cancel it later.\n\nTotal: ' + rupees(c.payable) + '\nThe PDF is saved to Google Drive.') + '</p>' +
        (to ? '<label class="check"><input type="checkbox" id="fb-email"' + (emailDefault ? ' checked' : '') + '> Email the PDF to ' + esc(to) + '</label>' : '') +
        '<div class="actions"><button class="btn" data-close>Back</button><button class="btn primary" id="cb-ok">Finalise</button></div>', function (root) {
        $('#cb-ok', root).onclick = function () { var em = $('#fb-email', root); closeModal.after = null; closeModal(); resolve({ email: !!(em && em.checked) }); };
        closeModal.after = function () { resolve(null); };
      });
    });
  }
  function cancelFlow(d) {
    var to = S.settings.email.onFinalise !== 'no' && S.settings.email.to ? S.settings.email.to : '';
    modal('<h2>Cancel ' + esc(d.number) + '?</h2><p>The number stays recorded and the document is marked CANCELLED, with a cancelled copy of the PDF. The number can be given again to a new document (choose it under Number). For an invoice already filed in GSTR-1, ask your CA about a credit note instead.</p>' +
      '<form id="cancel-form"><label>Reason<input name="reason" required placeholder="e.g. Wrong customer GSTIN; reissued as …"></label>' +
      (to ? '<label class="check"><input type="checkbox" name="email" checked> Email the cancelled PDF to ' + esc(to) + '</label>' : '') +
      '<div class="actions"><button type="button" class="btn" data-close>Back</button><button class="btn danger">Cancel the document</button></div></form>', function (root) {
      $('#cancel-form', root).onsubmit = async function (e) {
        e.preventDefault();
        var f = e.target.elements, reason = f.reason.value, email = !!(f.email && f.email.checked);
        var res = await run('Cancelling…', function () { return call('apiCancel', d.id, reason); });
        upsertSummary(res.summary); if (res.series) S.series = res.series; closeModal();
        if (S.view === 'doc' && S.doc && S.doc.id === d.id) S.doc = res.doc;
        try { await run('Saving the cancelled PDF…', function () { return storePdf(res.doc, email); }); } catch (err) { /* shown */ }
        toast(d.number + ' cancelled'); render();
      };
    });
  }
  async function startAmend() {
    var d = S.doc;
    if (!d || d.status !== 'FINAL') return;
    var ok = await confirmBox('Amend ' + d.number + '?', 'Use this to correct a document already issued. It keeps its number (you can change it), gets the new contents and a new PDF. The old PDF is kept in Drive, renamed, and the change is recorded with your reason.\n\nGST: change an invoice only if it is not yet reported in your GSTR-1. After filing, a change in value needs a credit or debit note, and other corrections go in a GSTR-1 amendment. Ask your CA if unsure.', 'Start amending');
    if (!ok) return;
    S.amendBase = clone(S.doc);
    S.amending = true;
    S.doc.numbering = { mode: 'keep', number: S.doc.number };
    S.dirty = false; S.errors = [];
    render(); window.scrollTo(0, 0);
  }
  async function rowAction(kind, id) {
    try {
      if (kind === 'amend') { await openDoc(id); await startAmend(); }
      else if (kind === 'cancel') { var doc = await run('Opening…', function () { return call('apiGetDocument', id); }); cancelFlow(doc); }
    } catch (e) { /* already shown */ }
  }

  function copyDoc(src, type) {
    var d = clone(src);
    var fresh = newDoc(type);
    fresh.party = d.party; fresh.pos = d.pos; fresh.posAuto = false; fresh.shipTo = d.shipTo || { same: true };
    fresh.items = d.items; fresh.pricesIncludeGst = d.pricesIncludeGst; fresh.roundOff = d.roundOff; fresh.reverseCharge = d.reverseCharge;
    fresh.annexure = d.annexure || fresh.annexure;
    if (type === d.type) { fresh.notes = d.notes; fresh.terms = d.terms; }
    fresh.refs = type === d.type ? { poNumber: (d.refs || {}).poNumber, paymentTerms: (d.refs || {}).paymentTerms, deliveryTerms: (d.refs || {}).deliveryTerms, deliveryPeriod: (d.refs || {}).deliveryPeriod } : {};
    fresh.meta = { sourceId: src.id };
    return fresh;
  }

  // ---------------------------------------------------------------- events
  document.addEventListener('click', async function (e) {
    var el = e.target.closest('[data-close]');
    if (el) { e.preventDefault(); closeModal(); return; }
    if (e.target.id === 'modal') { closeModal(); return; }
    el = e.target.closest('[data-view]');
    if (el) { e.preventDefault(); go(el.dataset.view); return; }
    el = e.target.closest('[data-new]');
    if (el) { openNew(el.dataset.new); return; }
    el = e.target.closest('[data-row-action]');
    if (el) { e.preventDefault(); rowAction(el.dataset.rowAction, el.dataset.id); return; }
    el = e.target.closest('[data-impkind]');
    if (el) { S.imp = { kind: el.dataset.impkind, parsed: null }; render(); return; }
    if (e.target.closest('[data-stop]')) return;
    el = e.target.closest('[data-open]');
    if (el) { openDoc(el.dataset.open).catch(function () {}); return; }
    el = e.target.closest('[data-party]');
    if (el) { openParty(el.dataset.party); return; }
    el = e.target.closest('[data-item-edit]');
    if (el) { openItem(el.dataset.itemEdit); return; }
    el = e.target.closest('[data-ftype]');
    if (el) { S.filter.type = el.dataset.ftype; render(); return; }
    el = e.target.closest('[data-ship]');
    if (el && S.doc) { S.doc.shipTo = S.doc.shipTo || {}; S.doc.shipTo.same = el.dataset.ship === 'same'; S.dirty = true; render(); return; }
    el = e.target.closest('[data-action]');
    if (!el) return;
    var a = el.dataset.action;
    var line = el.closest('.line');
    if (line && S.doc) {
      var i = +line.dataset.i, items = S.doc.items;
      if (a === 'line-del') { items.splice(i, 1); if (!items.length) items.push(blankLine()); }
      if (a === 'line-up' && i > 0) items.splice(i - 1, 0, items.splice(i, 1)[0]);
      if (a === 'line-down' && i < items.length - 1) items.splice(i + 1, 0, items.splice(i, 1)[0]);
      S.dirty = true; render(); return;
    }
    var arow = el.closest('.annex-row');
    if (arow && a === 'annex-del') { S.doc.annexure.rows.splice(+arow.dataset.ai, 1); S.dirty = true; render(); return; }
    if (a === 'reg-add') { var box = $('#regs'); var n = $$('fieldset.reg', box).length; box.insertAdjacentHTML('beforeend', regForm({}, n)); return; }
    if (a === 'reg-remove') { var fs = el.closest('fieldset.reg'); if ($$('fieldset.reg').length > 1) fs.remove(); return; }
    if (a === 'party-delete') {
      if (!window.confirm('Delete this customer or vendor?')) return;
      await run('Deleting…', function () { return call('apiDeleteParty', el.dataset.id); });
      S.parties = S.parties.filter(function (x) { return x.id !== el.dataset.id; }); closeModal(); render(); return;
    }
    if (a === 'item-delete') {
      if (!window.confirm('Delete this item? Documents that used it are not changed.')) return;
      await run('Deleting…', function () { return call('apiDeleteProduct', el.dataset.id); });
      S.products = S.products.filter(function (x) { return x.id !== el.dataset.id; }); closeModal(); render(); return;
    }
    if (actions[a]) { e.preventDefault(); try { await actions[a](el); } catch (err) { /* already shown */ } }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
    if (e.key === 'Enter' && e.target.matches('tr[data-open], tr[data-item-edit]')) e.target.click();
  });

  // Inputs in the document editor update S.doc without re-rendering, so focus is kept.
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.matches('[data-fq]')) { S.filter.q = t.value; var pos = t.selectionStart; render(); var n = $('[data-fq]'); n.focus(); n.setSelectionRange(pos, pos); return; }
    if (t.matches('[data-partyq]')) { S.partyQ = t.value; var p2 = t.selectionStart; render(); var n2 = $('[data-partyq]'); n2.focus(); n2.setSelectionRange(p2, p2); return; }
    if (t.matches('fieldset.reg [data-r="gstin"]')) {
      var g = t.value.trim() ? PB.checkGstin(t.value) : null, hint = t.parentNode.querySelector('.hint'), fs = t.closest('fieldset.reg');
      hint.className = 'hint ' + (g && !g.ok ? 'bad' : 'good');
      hint.textContent = g ? (g.ok ? '✓ ' + g.stateName : (t.value.trim().length < 15 ? 'Keep typing…' : g.error)) : 'Unregistered if empty';
      if (g && g.ok) { $('[data-r="stateCode"]', fs).value = g.stateCode; var pan = $('#party-form [name="pan"]'); if (pan && !pan.value) pan.value = g.pan; }
      return;
    }
    if (t.matches('[data-s="firm.gstin"]')) {
      var gg = t.value.trim() ? PB.checkGstin(t.value) : null, h = t.parentNode.querySelector('.hint');
      h.className = 'hint ' + (gg && !gg.ok ? 'bad' : 'good');
      h.textContent = gg ? (gg.ok ? '✓ ' + gg.stateName : (t.value.trim().length < 15 ? 'Keep typing…' : gg.error)) : 'Needed for tax invoices';
      if (gg && gg.ok) { $('[data-s="firm.stateCode"]').value = gg.stateCode; var p = $('[data-s="firm.pan"]'); if (p && !p.value) p.value = gg.pan; }
      return;
    }
    if (S.view !== 'doc' || !editable()) return;
    if (t.matches('[data-numtext]')) { S.doc.numbering = { mode: 'manual', number: t.value.trim() }; S.dirty = true; return; }
    var line = t.closest('.line');
    if (line && t.dataset.k) {
      var it = S.doc.items[+line.dataset.i];
      it[t.dataset.k] = t.dataset.k === 'gstRate' ? +t.value : t.value;
      S.dirty = true; refreshTotals(); return;
    }
    var ar = t.closest('.annex-row');
    if (ar && t.dataset.ak) { S.doc.annexure.rows[+ar.dataset.ai][t.dataset.ak] = t.value; S.dirty = true; return; }
    if (t.dataset.f && !t.matches('[data-check], [data-bool], select')) { set(S.doc, t.dataset.f, t.value); S.dirty = true; refreshTotals(); }
  });

  document.addEventListener('change', async function (e) {
    var t = e.target;
    if (t.matches('[data-fstatus]')) { S.filter.status = t.value; render(); return; }
    if (t.matches('[data-ffy]')) { S.filter.fy = t.value; render(); return; }
    if (t.matches('[data-upload]')) {
      var file = t.files && t.files[0];
      if (!file) return;
      if (file.size > 1500000) { toast('Please choose an image under 1.5 MB.', 'error'); return; }
      var dataUrl = await new Promise(function (resolve) { var r = new FileReader(); r.onload = function () { resolve(r.result); }; r.readAsDataURL(file); });
      S.images = await run('Uploading…', function () { return call('apiUploadImage', t.dataset.upload, dataUrl); });
      toast('Image saved'); render(); return;
    }
    if (t.matches('[data-impfile]')) { readImportFile(t.files && t.files[0]); return; }
    if (S.view !== 'doc' || !editable()) return;
    var d = S.doc;
    if (t.matches('[data-numsel]')) {
      var v = t.value, prev = d.numbering || {};
      if (v.indexOf('reuse:') === 0) d.numbering = { mode: 'reuse', number: v.slice(6) };
      else if (v === 'manual') d.numbering = { mode: 'manual', number: prev.mode === 'manual' ? prev.number : (S.amending ? d.number : '') };
      else d.numbering = { mode: v, number: v === 'keep' ? d.number : '' };
      S.dirty = true; render(); return;
    }
    if (t.matches('[data-party-pick]')) {
      var p = partiesFor(d.type).filter(function (x) { return x.name.toLowerCase() === t.value.trim().toLowerCase(); })[0];
      if (p) { applyParty(p); render(); }
      else if (t.value.trim()) toast('Pick a name from the list, or use “+ New” to add it.', 'error');
      return;
    }
    if (t.matches('[data-reg-pick]')) { var pp = S.parties.filter(function (x) { return x.id === d.party.id; })[0]; if (pp) { applyParty(pp, t.value); render(); } return; }
    if (t.matches('[data-pos]')) { d.pos = { code: t.value }; d.posAuto = false; S.dirty = true; render(); return; }
    var line = t.closest('.line');
    if (line && t.dataset.k === 'name') { if (applyProduct(d.items[+line.dataset.i], t.value)) { S.dirty = true; render(); } return; }
    if (line && (t.dataset.k === 'type' || t.dataset.k === 'unit' || t.dataset.k === 'gstRate')) { var it = d.items[+line.dataset.i]; it[t.dataset.k] = t.dataset.k === 'gstRate' ? +t.value : t.value; S.dirty = true; refreshTotals(); return; }
    if (t.dataset.f) {
      var v = t.matches('[data-check]') ? t.checked : t.matches('[data-bool]') ? t.value === 'true' : t.value;
      set(d, t.dataset.f, v); S.dirty = true;
      if (t.matches('[data-rerender]') || t.dataset.f === 'shipTo.stateCode' || t.dataset.f === 'pricesIncludeGst') render(); else refreshTotals();
    }
  });

  window.addEventListener('beforeunload', function (e) { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

  // ---------------------------------------------------------------- start
  async function start() {
    try {
      busy(true, 'Loading…');
      var b = await call('apiBootstrap');
      S.settings = b.settings; S.parties = b.parties; S.products = b.products; S.docs = b.documents; S.series = b.series;
      S.sheetUrl = b.sheetUrl; S.driveUrl = b.driveUrl; S.user = b.user;
      $('#user').textContent = b.user || '';
      if (!S.settings.firm.gstin || !S.settings.firm.address1) S.view = 'settings';
      go(S.view);
      if (S.view === 'settings') toast('Welcome. Add your GSTIN, address and bank details first.');
      loadImages().catch(function () {});
    } catch (e) {
      main().innerHTML = '<section class="card"><h1>Could not load</h1><p>' + esc(cleanMsg(e)) + '</p><p class="muted">Reload the page. If it keeps happening, open the Apps Script editor and run “setup” once.</p></section>';
    } finally { busy(false); }
  }
  window.PBApp = { S: S, start: start, actions: actions };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
