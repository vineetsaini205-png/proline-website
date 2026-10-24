# Proline Billing

GST tax invoices, proforma invoices (with an annexure page) and purchase orders for Proline Electrical Works. It runs as a Google Apps Script web app inside the owner's Google account:

- **Data** lives in the Google Sheet **"Proline Billing"**, in these tabs: Settings, Series, Parties, Registrations, Products, Documents, Register and Log.
- **PDFs** are saved in Google Drive under **Proline Billing / 2026-27 / Tax Invoices** (and Proforma Invoices, Purchase Orders).
- **Email:** each finalised PDF is emailed to Sales@prolineelectricalworks.com. The address can be changed in Settings.
- **Opening it:** from the website admin, go to www.prolineelectricalworks.com/admin/billing/, which forwards to the web app. Only the owner's Google account can open it.

## How it works

| Topic | Rule |
|---|---|
| Draft → final | Drafts can be edited and have no number. **Finalise** checks the document, gives it a number, locks it, saves the PDF to Drive and, if ticked, emails it. |
| Numbers | Each type has its own series per financial year (April–March). Settings → Numbering sets the prefix, how the year is written (`26-27` or `2627`) and the digits, e.g. `PEW/2627/07`. Abandoned drafts never leave gaps. A tax invoice number is checked against GST rule 46: at most 16 characters, using only letters, digits, "/" and "-", used once per financial year. |
| Choosing the number | On each draft, **Number**: *Next in series* (default), a *cancelled number given again* (numbers cancelled in the app, plus those listed in Settings → "Cancelled numbers you can give again"), or *Type a number…* (e.g. an invoice issued before this app). Each choice other than the default shows a warning. A number already used by a final document is refused. The series continues after the highest number recorded in it. |
| Continue a series | Settings → Numbering → "Continue after". Use it when documents were already issued this year in another system. The series can never be set below a number already used. "Check all series for gaps" lists gaps, duplicates and numbers given again after cancelling. |
| Amend | **Amend** (in the document list or on a final document) reopens it for changes; the number stays, or can be changed with a warning. A reason is required and kept in the document's history; the old PDF stays in Drive, renamed "(before amendment N)"; the Register rows are rewritten. Only for documents not yet reported in GSTR-1; after filing, a credit or debit note is usually needed (ask the CA). |
| Import | **Import** tab: invoices, proformas and POs (drafts, or documents already issued or cancelled, recorded with their own numbers, not emailed), customers and vendors (several GSTINs per name), and items. From .xlsx, .csv, or rows pasted from Excel; templates download from the same page; every row is checked and shown before anything is saved, and a document import is all-or-nothing. On a draft, **Paste lines from Excel** adds item lines. Excel files are read in the browser with SheetJS (cdn.sheetjs.com, falling back to jsDelivr). |
| GST | If the place of supply is the same state as the supplier, the tax is CGST + SGST (UTGST in Chandigarh, Ladakh, Lakshadweep, Andaman & Nicobar, and DNH & DD). If it is another state, the tax is IGST. For a PO, the supplier is the vendor. Rates can include or exclude GST, and there are line discounts, round-off to the rupee, the tax by rate in the totals (e.g. CGST 9% and SGST 9%) and the amount in words (lakh/crore). The PDFs have no HSN tax-summary table and no UPI QR code (owner, 25 Oct). |
| Customers | Each customer can have several GST registrations and addresses, one per state or site. You pick one on each document. GSTINs are checked with the official check digit, and the state and PAN are filled in from the GSTIN. |
| Items | Name, goods/service, HSN or SAC, unit, rate and GST rate. The starter list must be checked with the CA. |
| Cancel | A final document can be cancelled with a reason, from the list or the document. It is marked CANCELLED in the Register and a cancelled copy of the PDF is saved. Its number can then be given to a new document (with a GST warning). For invoices already filed in GSTR-1, the CA may advise a credit note instead. |
| Register | The Register tab has one row per tax invoice per GST rate, for the CA (GSTR-1). |
| Not included | E-invoicing (IRN/QR, compulsory above ₹5 crore turnover), e-way bill generation, credit/debit notes, SEZ/export, cess. |

## Source and build

The files to edit are in `billing/src`:

- `shared.js`: GST maths, money and words, GSTIN, financial year and numbers. Used by both the server and the browser.
- `server.js`: the Apps Script server (Sheets, Drive, email, numbering).
- `pdf.js`: the PDF layout (pdfmake 0.2.20).
- `app.js` and `index.html`: the app.

Build:

```
node billing/build.mjs                    # → billing/dist/Code.gs and billing/dist/Index.html
node billing/test/shared.test.mjs         # GST maths, words, GSTIN, numbers
node billing/test/server.test.cjs         # server against in-memory Sheets/Drive/Mail
# PDF samples and the full UI flow need pdfmake@0.2.20 and Playwright:
NODE_PATH=<dir>/node_modules node billing/test/pdf.test.cjs <outDir>
# full UI flow (needs pdfmake@0.2.20, pdfjs-dist@3.11.174, xlsx@0.18.5 and Playwright in <dir>):
node billing/build.mjs --pdfmake-dir <dir>/node_modules/pdfmake/build --pdfjs-dir <dir>/node_modules/pdfjs-dist/build --xlsx-path <dir>/node_modules/xlsx/dist/xlsx.full.min.js
NODE_PATH=<dir>/node_modules node billing/test/ui.test.cjs <outDir>
```

## Updating the live app

1. Open the "Proline Billing" Sheet → **Extensions → Apps Script**.
2. Replace `Code.gs` with `billing/dist/Code.gs`, and `Index.html` with `billing/dist/Index.html`. Click **Save**.
3. **Deploy → Manage deployments →** pencil icon → **Version: New version → Deploy**. The web app address stays the same.

The first install also needs **setup** to be run once from the editor: choose `setup` in the function list and click **Run**, then allow the permissions. After that, deploy it as a new web app with **Execute as: Me** and **Who has access: Only myself**.
