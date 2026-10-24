// Builds the two Apps Script files from billing/src:
//   dist/Code.gs     = shared.js + server.js
//   dist/Index.html  = index.html with shared.js, pdf.js and app.js inlined
//   dist/test.html   = the same page wired to in-memory fakes (for local tests only, never deployed)
// Usage: node billing/build.mjs [--pdfmake-dir <dir with pdfmake.min.js and vfs_fonts.js>] [--pdfjs-dir <dir>] [--xlsx-path <xlsx.full.min.js>]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = (f) => readFileSync(join(here, 'src', f), 'utf8');
const dist = join(here, 'dist');
mkdirSync(dist, { recursive: true });

const shared = src('shared.js');
const server = src('server.js');
const pdf = src('pdf.js');
const app = src('app.js');
const html = src('index.html');
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

const code = `// Proline Billing ${stamp} — built from billing/src (shared.js + server.js). Edit the source, not this file.\n\n${shared}\n\n${server}`;
writeFileSync(join(dist, 'Code.gs'), code);

const page = html.replace('/*SHARED*/', () => shared).replace('/*PDF*/', () => pdf).replace('/*APP*/', () => app).replace('  <!--TEST_HOOK-->\n', '');
writeFileSync(join(dist, 'Index.html'), page);

// Test page: fakes + server code in the page, and google.script.run calling it.
const args = process.argv.slice(2);
const pm = args.includes('--pdfmake-dir') ? args[args.indexOf('--pdfmake-dir') + 1] : null;
const pj = args.includes('--pdfjs-dir') ? args[args.indexOf('--pdfjs-dir') + 1] : null;
const xl = args.includes('--xlsx-path') ? args[args.indexOf('--xlsx-path') + 1] : null;  // SheetJS, so the test page works offline
const fakes = readFileSync(join(here, 'test', 'gas-fakes.js'), 'utf8');
const runner = `
window.google = { script: { run: (function make(ok, fail) {
  return new Proxy({}, { get: function (t, prop) {
    if (prop === 'withSuccessHandler') return function (f) { return make(f, fail); };
    if (prop === 'withFailureHandler') return function (f) { return make(ok, f); };
    return function () {
      var a = JSON.parse(JSON.stringify(Array.prototype.slice.call(arguments)));
      setTimeout(function () {
        try { var r = window[prop].apply(null, a); window.__calls = (window.__calls || []).concat(prop); if (ok) ok(r === undefined ? undefined : JSON.parse(JSON.stringify(r))); }
        catch (e) { if (fail) fail(e); else console.error(e); }
      }, 20);
    };
  } });
})() } };`;
let testPage = html
  .replace('  <!--TEST_HOOK-->\n', () => `  <script>\n${fakes}\n</script>\n  <script>\n${shared}\n${server}\n</script>\n  <script>${runner}</script>\n`)
  .replace('/*SHARED*/', () => shared).replace('/*PDF*/', () => pdf).replace('/*APP*/', () => app);
if (pm) {
  testPage = testPage
    .replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/pdfmake.min.js', 'file://' + join(pm, 'pdfmake.min.js'))
    .replace('https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/vfs_fonts.js', 'file://' + join(pm, 'vfs_fonts.js'))
    .replace(/<link[^>]+fonts\.googleapis[^>]+>\n?/g, '');
}
if (pj) {
  testPage = testPage
    .replace('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js', 'file://' + join(pj, 'pdf.min.js'))
    .replace('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js', 'file://' + join(pj, 'pdf.worker.min.js'));
}
if (xl) testPage = testPage.replace('  <script>\n' + fakes, () => '  <script src="file://' + xl + '"></script>\n  <script>\n' + fakes);
writeFileSync(join(dist, 'test.html'), testPage);
console.log(`built ${join(dist, 'Code.gs')} (${code.length} chars), Index.html (${page.length} chars), test.html`);
