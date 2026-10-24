/*
 * In-memory stand-ins for the Google Apps Script services the server code uses
 * (SpreadsheetApp, DriveApp, MailApp, Utilities, LockService, Session), so the real
 * server code can run in a browser page or in Node for tests.
 * Like Google Sheets, a cell NOT formatted as text turns "07" into 7 and "2026-10-24" into a Date,
 * so the tests catch any value the server forgets to protect.
 */
var FAKE = { sheets: [], folders: {}, files: {}, mails: [], seq: 1, log: [] };
(function (G) {
  function id(p) { return p + (FAKE.seq++); }
  function auto(v) {
    if (typeof v !== 'string') return v;
    if (/^-?\d+(\.\d+)?$/.test(v) && v.length < 15) return Number(v);
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + 'T00:00:00');
    return v;
  }
  function Range(sh, r, c, nr, nc) { this.sh = sh; this.r = r; this.c = c; this.nr = nr || 1; this.nc = nc || 1; }
  Range.prototype.each = function (fn) { for (var i = 0; i < this.nr; i++) for (var j = 0; j < this.nc; j++) fn(this.r - 1 + i, this.c - 1 + j, i, j); };
  Range.prototype.getValues = function () {
    var out = [], sh = this.sh;
    for (var i = 0; i < this.nr; i++) { var row = []; for (var j = 0; j < this.nc; j++) { var R = sh.data[this.r - 1 + i] || []; var v = R[this.c - 1 + j]; row.push(v === undefined ? '' : v); } out.push(row); }
    return out;
  };
  Range.prototype.setValues = function (vals) {
    var sh = this.sh;
    this.each(function (R, C, i, j) {
      sh.data[R] = sh.data[R] || [];
      var f = (sh.fmt[R] || [])[C];
      var v = vals[i][j];
      sh.data[R][C] = f === '@' ? String(v) : auto(v);
    });
    return this;
  };
  Range.prototype.setNumberFormat = function (f) { var sh = this.sh; this.each(function (R, C) { sh.fmt[R] = sh.fmt[R] || []; sh.fmt[R][C] = f; }); return this; };
  Range.prototype.setNumberFormats = function (fs) { var sh = this.sh; this.each(function (R, C, i, j) { sh.fmt[R] = sh.fmt[R] || []; sh.fmt[R][C] = fs[i][j]; }); return this; };
  Range.prototype.setFontWeight = function () { return this; };
  Range.prototype.setBackground = function () { return this; };

  function Sheet(name) { this.name = name; this.data = []; this.fmt = []; }
  Sheet.prototype.getName = function () { return this.name; };
  Sheet.prototype.getLastRow = function () { var n = 0; this.data.forEach(function (r, i) { if (r && r.some(function (v) { return v !== '' && v != null; })) n = i + 1; }); return n; };
  Sheet.prototype.getRange = function (r, c, nr, nc) { return new Range(this, r, c, nr, nc); };
  Sheet.prototype.deleteRow = function (r) { this.data.splice(r - 1, 1); this.fmt.splice(r - 1, 1); };
  Sheet.prototype.setFrozenRows = function () {};

  var ss = {
    getSheetByName: function (n) { return FAKE.sheets.filter(function (s) { return s.name === n; })[0] || null; },
    insertSheet: function (n) { var s = new Sheet(n); FAKE.sheets.push(s); return s; },
    getSheets: function () { return FAKE.sheets.slice(); },
    deleteSheet: function (s) { FAKE.sheets = FAKE.sheets.filter(function (x) { return x !== s; }); },
    getUrl: function () { return 'https://docs.google.com/spreadsheets/d/FAKE/edit'; }
  };
  FAKE.sheets.push(new Sheet('Sheet1'));
  G.SpreadsheetApp = { getActiveSpreadsheet: function () { return ss; } };

  function Blob(bytes, type, name) { this.bytes = bytes; this.type = type; this.name = name; }
  Blob.prototype.getBytes = function () { return this.bytes; };
  Blob.prototype.getContentType = function () { return this.type; };
  Blob.prototype.getName = function () { return this.name; };

  function File(blob, folder) { this.id = id('file'); this.blob = blob; this.folder = folder; this.trashed = false; FAKE.files[this.id] = this; }
  File.prototype.getId = function () { return this.id; };
  File.prototype.getUrl = function () { return 'https://drive.google.com/file/d/' + this.id + '/view'; };
  File.prototype.getBlob = function () { return this.blob; };
  File.prototype.getName = function () { return this.blob.name; };
  File.prototype.setTrashed = function (t) { this.trashed = t; return this; };
  File.prototype.setName = function (n) { this.blob.name = n; return this; };

  function Folder(name, parent) { this.id = id('folder'); this.name = name; this.parent = parent; this.trashed = false; FAKE.folders[this.id] = this; }
  Folder.prototype.getId = function () { return this.id; };
  Folder.prototype.getUrl = function () { return 'https://drive.google.com/drive/folders/' + this.id; };
  Folder.prototype.getName = function () { return this.name; };
  Folder.prototype.isTrashed = function () { return this.trashed; };
  Folder.prototype.createFolder = function (n) { return new Folder(n, this); };
  Folder.prototype.createFile = function (blob) { return new File(blob, this); };
  Folder.prototype.getFoldersByName = function (n) {
    var self = this, list = Object.keys(FAKE.folders).map(function (k) { return FAKE.folders[k]; }).filter(function (f) { return f.parent === self && f.name === n; }), i = 0;
    return { hasNext: function () { return i < list.length; }, next: function () { return list[i++]; } };
  };
  Folder.prototype.path = function () { return (this.parent ? this.parent.path() + '/' : '') + this.name; };

  G.DriveApp = {
    createFolder: function (n) { return new Folder(n, null); },
    getFolderById: function (i) { if (!FAKE.folders[i]) throw new Error('No folder ' + i); return FAKE.folders[i]; },
    getFileById: function (i) { if (!FAKE.files[i]) throw new Error('No file ' + i); return FAKE.files[i]; }
  };

  function b64ToBytes(s) {
    if (typeof atob === 'function') { var bin = atob(s), out = new Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
    return Array.from(Buffer.from(s, 'base64'));
  }
  function bytesToB64(b) {
    if (typeof btoa === 'function') { var s = ''; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i] & 255); return btoa(s); }
    return Buffer.from(b).toString('base64');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  G.Utilities = {
    base64Decode: b64ToBytes,
    base64Encode: bytesToB64,
    newBlob: function (bytes, type, name) { return new Blob(bytes, type, name); },
    getUuid: function () { return 'uuid-' + (FAKE.seq++); },
    formatDate: function (d, tz, f) {
      var s = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      return f === 'yyyy-MM-dd' ? s : s + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }
  };
  G.MailApp = { sendEmail: function (m) { FAKE.mails.push(m); }, getRemainingDailyQuota: function () { return 100; } };
  G.LockService = { getScriptLock: function () { return { waitLock: function () {}, releaseLock: function () {} }; } };
  G.Session = { getActiveUser: function () { return { getEmail: function () { return 'owner@example.com'; } }; } };
  G.HtmlService = { createHtmlOutputFromFile: function () { return { setTitle: function () { return this; }, addMetaTag: function () { return this; } }; } };
})(typeof window !== 'undefined' ? window : globalThis);
