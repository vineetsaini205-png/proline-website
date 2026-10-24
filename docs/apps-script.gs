/**
 * Proline website enquiry forms → Google Sheet + email to Sales@.
 *
 * Setup (once, about 10 minutes) — see docs/GO-LIVE.md step 5:
 *  1. In the Google account that should own the enquiries, create a Google Sheet named "Proline website enquiries".
 *  2. In the Sheet: Extensions → Apps Script. Delete the sample code, paste this whole file, Save.
 *  3. Deploy → New deployment → type "Web app". Execute as: Me. Who has access: Anyone. Deploy, allow access.
 *  4. Copy the Web app URL (ends in /exec) into the admin: Site settings → Contact details → "Form web app address".
 *     (Or edit "formEndpoint" in src/data/site.json.) From then on, every form also lands here.
 */

const NOTIFY_EMAIL = 'Sales@prolineelectricalworks.com';
const SHEET_NAME = 'Enquiries';
const COLUMNS = [
  'time', 'form', 'name', 'phone', 'company', 'city', 'state', 'need', 'site_type', 'sanctioned_load',
  'chargers', 'sites_per_month', 'states_types', 'charger_types', 'website', 'experience', 'skills',
  'message', 'publish_ok', 'extra', 'page',
];
const TITLES = {
  quote: 'Website enquiry', survey: 'Site survey request', station: 'Charging station enquiry', demo: 'Proline CMS demo request',
  b2b: 'Partnership enquiry', brand: 'Brand partner enquiry', technician: 'Technician application', ask: 'Question for an expert',
};

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.company_website) return json({ ok: true }); // spam trap: humans never fill this field

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet();
    const row = COLUMNS.map((c) => (c === 'time' ? new Date() : clean(p[c])));
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }

  const title = TITLES[p.form] || 'Website enquiry';
  const subject = `${title}: ${clean(p.name)}${p.city ? ' (' + clean(p.city) + ')' : ''}${p.need ? ' – ' + clean(p.need) : ''}`;
  const lines = COLUMNS.filter((c) => c !== 'time' && p[c]).map((c) => `${label(c)}: ${clean(p[c])}`);
  const phone = String(p.phone || '').replace(/\D/g, '');
  if (phone) lines.push('', `WhatsApp: https://wa.me/91${phone.slice(-10)}`, `Call: tel:+91${phone.slice(-10)}`);
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: subject.slice(0, 180), body: lines.join('\n') });
  return json({ ok: true });
}

function doGet() {
  return json({ ok: true, info: 'Proline enquiry endpoint. Forms send data here with POST.' });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(COLUMNS.map(label));
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
  }
  return sh;
}

// Text only, max 2,000 characters, and never a formula (cells starting with = + - @ are made safe).
function clean(v) {
  let s = String(v == null ? '' : v).slice(0, 2000);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function label(c) {
  return c.replace(/_/g, ' ').replace(/^./, (x) => x.toUpperCase());
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
