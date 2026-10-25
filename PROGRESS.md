# Proline website — working file

**Read this first in every new session.** It says what is done, what is not, and the rules.
After finishing any step: tick it here, add a line to the session log, then commit and push.
Never redo a ticked item unless the owner asks for a change.

## Where things are

| What | Where |
|---|---|
| Code (this repo) | github.com/vineetsaini205-png/proline-website, branch `main` |
| Approved plan | Claude Docs: https://claude.ai/artifact/BbomKbPKuGQ3w2mU2rUbE9 |
| Approved first-screen design | https://claude.ai/artifact/5muNhLbEwLBg2W8et8yY3U (desktop + phone) |
| Live site | **https://www.prolineelectricalworks.com** (www is the main address; canonical URLs use www). New Cloudflare Pages project **proline-website** (Git-linked to `main`, build `npm run build`, output `dist`, NODE_VERSION 22) — every push to `main` redeploys in ~2 min. Bare domain prolineelectricalworks.com is also on the project and 301-redirects to www (Cloudflare → Rules → Redirect Rules → "Bare domain to www"). Old Direct Upload project "proline" was deleted by the owner on 24 Oct |
| Owner | Vineet Saini, Proline Electrical Works, Delhi |
| Billing app (invoices, proformas, POs) | Source `billing/` (see `billing/README.md`); runs as a Google Apps Script web app in the owner's Google account, data in the Sheet "Proline Billing", PDFs in Drive "Proline Billing/". Website link: /admin/billing/ |
| Stack | Astro 5 static site, Markdown content collections, Sveltia CMS at /admin, Cloudflare Pages |

Resume: `git clone https://github.com/vineetsaini205-png/proline-website && cd proline-website && npm install && npm run dev`
Build: `npm run build` (output in `dist/`). Content rules check: `node scripts/check-content.mjs`. Screenshots: `node scripts/shots.mjs <outDir> / /services/` (FULL=1 for full page).

## How the site is built (where to change what)

| To change | Edit |
|---|---|
| Phone, email, hours, offer strip, stats, clients, states, form URL | `src/data/site.json` |
| Menus and footer links | `src/data/nav.ts` |
| Fuel prices, public charging rates, CO2 factors | `src/data/rates.json` · state EV tariffs: `src/data/tariffs.json` |
| CMS screenshots (D1–D5, P1–P6) | `src/data/cms-screens.json` + files in `public/images/cms/` |
| Photos (blur boxes, alt text) | `scripts/photos/process.py` → `public/images/` + `src/data/images.json` |
| Service / charger / battery / audience / root pages | Markdown in `src/content/<collection>/` (schema: `src/content.config.ts`, template: `src/layouts/LandingPage.astro`) |
| Blog posts, FAQs | `src/content/blog/`, `src/content/faqs/` |
| Look and feel | `src/styles/global.css` (design tokens at the top) |
| Calculator maths | `src/lib/calc.ts` (shared by pages and browser scripts) |
| Schema.org data | `src/lib/schema.ts` |
| Logo | `src/assets/logo/` (Charge-O master SVGs; used by `Logo.astro`, the share-image scripts and, copied in, the billing PDFs and app). Favicons in `public/`. Share images: `node scripts/og-default.mjs`, `node scripts/og-cms.mjs`. Logo guide: don't stretch or recolour; at least 120 px wide on screen, smaller than that use the icon |
| How to write pages | `docs/content-brief.md` · approved plan copy: `docs/plan.md` |

## Owner's rules — never break these

1. **No prices anywhere** (no installation, charger, survey or CMS prices). Cost questions get the factors that decide cost + "Get a quote". Calculators use public tariffs/charging rates only; payback appears only when the visitor types their own quote.
2. **No AI assistant / chatbot.** Keep AI crawlers blocked (robots.txt + Cloudflare setting). Google and Bing allowed.
3. **Location = "Delhi" only.** Home-based, no office, no street address, no map pin.
4. Phone/WhatsApp **+91 73038 87364** — calls 10 am–7 pm, WhatsApp any time. Email **Sales@prolineelectricalworks.com**. **The number is never shown as text on the site (owner, 24 Oct):** only "WhatsApp us" / "Call us" buttons and links carry it (tel: and wa.me), plus the hidden schema.org data. The checker flags the number in content.
5. Facts allowed: 2 years in business · 500+ chargers installed (AC, DC, DB boxes) · 200+ technicians · North, South and West India · 10 states: Maharashtra, Chhattisgarh, Tamil Nadu, Telangana, Delhi, Himachal Pradesh, Uttarakhand, Uttar Pradesh, Haryana, Madhya Pradesh · installed for TATA, ThunderPlus, Bolt.Earth, KIA (write "TATA" — which Tata company is still unconfirmed).
6. **Do not invent** projects, testimonials, reviews, certifications/registrations, partner status, prices or response-time promises. "Authorised partner" only for a brand that authorised Proline in writing (none confirmed yet).
7. Site survey is **paid**; the fee is adjusted against the order if the customer goes ahead.
8. Proline CMS: claim only what works today. Not ready (keep off, or "on request"): a named live payment gateway, SMS sending, add-ons, OCPP 2.0.1. Deck screens are concept designs — label them so until real screenshots arrive (owner, 24 Oct: keep the "Concept design · sample data" label). Never publish deck slide 22 (commercial).
9. **AMC is offered** (owner, 24 Oct: "we can also work on AMCs") → `/services/ev-charger-amc/`. Still held until the owner answers: power approvals (`/services/ev-charging-power-approval/`).
13. Proline CMS business model (owner, 24 Oct): software the operator owns, built in their brand and handed over (not a charging network they join). **No commission on charging payments, no fee per charger per month.** Two ways to run it: CPO Edition on the customer's own server/cloud, or **hosted by Proline on Proline's servers at a low running cost with 24/7 support**. "24/7" is allowed for CMS support only (not installation). Hosted servers are in India (owner confirmed 24 Oct).
10. Hindi blogs/FAQs are phase 2 (at /hi/, written or checked by a Hindi speaker).
11. Photos: Pexels downloads from the owner. Owner (24 Oct): "do not blur if it is not required". We blur **only readable charger / charging-network brand marks** (Pexels licence: don't imply endorsement by brands in the image). Car badges and number plates stay. Tesla Supercharger photos are **not used** (the charger design itself is Tesla's, and Proline doesn't install them).
12. Commits end with the attribution lines in the session's instructions.
14. **Never say what Proline earns** (owner, 24 Oct: "we do not tell customer that we earn commission and how much we earn"): no commission, margin or mark-up that Proline earns on chargers, batteries or anything else, and no amounts. The CMS line "no commission on your charging payments" (Proline takes none) stays (owner, 24 Oct: "Keep it"). The checker flags "our commission/margin", "we earn a commission".
15. Batteries (owner confirmed 24 Oct): for scooter and e-rickshaw packs Proline supplies and matches the pack but does not fit it; it installs inverter, solar and station (BESS) batteries.
16. Unified Bharat eCharge (UBC, national charging network in the BHIM app, launched Aug 2026): owner says Proline CMS will connect customers to it, "in simple steps", now or later.
17. **Keep pages light** (owner, 24 Oct: "too much information on one page, very distracting"): home page = 6 short sections; compact footer (4 columns, main pages only); smaller type scale. Long page text shows the first part with "Read the full page"; cost factors and steps sit in tap-to-open rows; CMS screens are tabs; CMS feature groups open on tap; the long CMS FAQ list shows 6 and folds the rest (`<Faqs show={6}>`). Folded text stays in the HTML (Google reads it). Don't add new sections to the home page or footer without asking.
18. **The firm's private details never go in this repository** (it is public on GitHub): no street address, GSTIN, PAN, bank account or IFSC in code, docs or tests. They live only in the billing app's Settings, in the owner's private Sheet "Proline Billing". Tests and samples use made-up details.

## Status

Legend: [x] done · [~] in progress · [ ] not started

### Setup
- [x] Repo created by owner and cloned; Astro 5.18 + sitemap + fonts installed (`package.json`)
- [x] Photos exported to `public/images/` (12 photos × 1600w + 800w WebP) by `scripts/photos/process.py`; sizes/alt in `src/data/images.json`
- [x] Working file (this file)
- [x] Astro config, base layout, header (dropdowns), footer, mobile WhatsApp/Call bar, global CSS with design tokens
- [x] Site data: `src/data/site.json`, `rates.json` (fuel 20 Oct 2026, CNG 29 Aug 2026), `tariffs.json` (BEE list), `cms-screens.json`
- [x] Content collections schema (`src/content.config.ts`), templates `LandingPage.astro`, `HubPage.astro`
- [x] CMS screens extracted from the deck → `public/images/cms/` (stand-ins, labelled "Concept design · sample data")
- [x] Charge-O logo (owner's logo pack, 25 Oct: "choose a best logo … replace it everywhere"; Charge-O chosen over Plug-P and Volt-Leaf): header and phone menu (colour), footer (white version), favicons (SVG that turns light in dark browser tabs, 32 px PNG, `favicon.ico`, Apple icon), schema logo `public/images/logo-512.png`, both share images
- [x] Open Graph images: `public/images/og-default.jpg` (`scripts/og-default.mjs`), per-photo crops in `public/images/og/`
- [x] Content checker `scripts/check-content.mjs` and writing guide `docs/content-brief.md`

### Pages (launch set, ~60)
Home
- [x] `/` (draft screenshots sent to owner 24 Oct)

Services
- [x] `/services/` hub
- [x] `/services/ev-charger-installation/` (model page for writers)
- [x] `/services/home-ev-charger-installation/`
- [x] `/services/dc-fast-charger-installation/`
- [x] `/services/ev-charging-station-setup/`
- [x] `/services/site-survey/`
- [x] `/services/ev-charger-commissioning/`
- [x] `/services/ev-charger-earthing/`
- [x] `/services/ev-charger-cabling/`
- [x] `/services/ev-charger-db-box/`
- [x] `/services/ev-charging-civil-work/`
- [x] `/services/solar-installation/`
- [x] `/services/ev-charger-amc/` (owner confirmed AMC, 24 Oct) · held: `/services/ev-charging-power-approval/` (owner to confirm)

Proline CMS (copy from owner's `proline-cms-website-copy.md`, sections 1–9; section 10 = not-ready list)
- [x] `/cms/` (copy sections 1–9; section 10 limits applied; FAQs in `src/data/cms-faqs.ts`)
- [x] `/cms/features/` (re-titled "feature-rich")
- [x] `/cms/built-for-india/`
- [x] `/cms/white-label-self-hosted/` (re-titled "customisable"; CPO Edition + hosted by Proline)
- [x] `/cms/demo/`
- [x] `/cms/security/` (added 24 Oct: "safest CMS" searches)
- [x] `/cms/affordable-ev-charging-software/` (added 24 Oct: "cheapest CMS" searches — explains total cost and pricing model, no prices, never claims "cheapest")
- [x] `/blog/how-to-choose-ev-charging-cms/` (buyer's guide: "best / feature-rich / customisable CMS")

Chargers and products
- [x] `/chargers/` hub (cards fill from content)
- [x] `/chargers/ac-chargers/`
- [x] `/chargers/dc-fast-chargers/` (+ "Inside a DC charger" widget: done, `src/components/widgets/DcInside.astro`, shown via `widget: dc-inside`)
- [x] `/chargers/2w-3w-chargers/`
- [x] `/chargers/bus-truck-chargers/`
- [x] `/chargers/white-label-chargers/` (+ "Your brand on the charger" widget: done, `WhiteLabel.astro`, via `widget: white-label`)
- [x] `/batteries/` hub (cards fill from content)
- [x] `/batteries/2-wheeler-batteries/`
- [x] `/batteries/e-rickshaw-batteries/`
- [x] `/batteries/inverter-solar-batteries/`
- [x] `/batteries/bess-for-ev-charging/`
- [x] `/solar-ev-charging/`

Who we serve
- [x] `/for/` hub (cards fill from content)
- [x] `/for/charge-point-operators/`
- [x] `/for/charger-brands/`
- [x] `/for/ev-makers-and-dealers/`
- [x] `/for/businesses/`
- [x] `/for/housing-societies/`
- [x] `/for/fleets/`
- [x] `/for/government-and-psu/`

Tools (result first, no contact wall, no Proline prices)
- [x] `/tools/` hub
- [x] `/tools/ev-charging-station-earnings-calculator/` (BEE tariffs, GST, ToD, payback on own quote; tested in browser)
- [x] `/tools/ev-vs-petrol-savings-calculator/` (added 24 Oct for "EV cost saving" searches; tested)
- [x] `/tools/charger-finder/` (rules in `src/lib/finder.ts`)
- [x] `/tools/installation-checklist/` (rules in `src/lib/checklist.ts`, printable)

Resources
- [x] `/start-an-ev-charging-station/`
- [x] `/coverage/` (state list by region + BEE EV tariffs; no India map)
- [x] `/blog/` list and post template (`ArticlePage.astro`)
- [x] 3 posts: `/blog/ev-charging-station-earnings/`, `/blog/home-ev-charger-installation-guide/`, `/blog/ev-vs-petrol-savings/` (figures match `src/lib/calc.ts`)
- [x] `/faq/` page (groups fill from `src/content/faqs/`; CMS group from `cms-faqs.ts`)
- [x] `/ask/`
- [x] `/brands/` (client names as text until logo files arrive)

Company
- [x] `/about/`
- [x] `/contact/`
- [x] `/partner-with-us/`
- [x] `/brand-partners/`
- [x] `/join-as-technician/`
- [x] `/privacy-policy/` (owner should have it checked)
- [x] `/terms/` (owner should have it checked)
- [x] `404`

### Billing app (owner request 24 Oct: invoice, proforma with annexure, PO; draft/final; series; GST; Drive; email to Sales@)
- [x] Source in `billing/src` (shared GST maths, Apps Script server, pdfmake PDF layout, app); tests: `billing/test/*` (13 maths checks, 15 server checks with in-memory Google services, PDF samples, full UI flow in Chromium)
- [x] Installed in the owner's Google account, 24 Oct: Sheet "Proline Billing" (tabs Settings, Series, Parties, Registrations, Products, Documents, Register, Log; starter items added) with its Apps Script project; web app deployment **version 2**, Execute as Me, access **Only myself** (an anonymous visit is sent to Google sign-in — checked). Drive folder "Proline Billing/2026-27/…" is made on the first PDF. Update steps: `billing/README.md` → "Updating the live app"
- [x] Owner, 25 Oct (early hours): number dropdown on each draft (next in series / cancelled number given again / typed, with GST warnings), number style PEW/2627/07 (year as 2627, 2 digits, set in Settings), Amend and Cancel from the document list (amendment keeps a history and the old PDF), Import tab for documents (incl. past issued and cancelled invoices), customers/vendors and items from .xlsx/.csv/pasted rows, with templates; Paste lines from Excel on a draft. Tests: 15 maths, 22 server, full UI flow
- [x] PDF format (owner, 25 Oct): keep the app's own layout; **no HSN tax-summary table and no UPI QR code**; tax shown by rate in the totals. Owner's old Word invoices: use nothing from them (no logo, no details)
- [x] Charge-O logo (owner, 25 Oct): the full logo heads the tax invoice, proforma and PO PDFs with the firm details below it (an uploaded logo would keep the small square slot with the trade name); white icon in the app header; Proline tab icon. Live as web app **version 5**
- [x] Website link https://www.prolineelectricalworks.com/admin/billing/ (`public/admin/billing/index.html`, noindex) → the web app's /exec address
- [~] Settings, 25 Oct: legal name, address, PIN, bank name, IFSC and branch filled from the owner's GST certificate and cancelled cheque (values kept only in the Sheet, rule 18). Owner still types the GSTIN (PAN fills itself) and the account number, and uploads a signature if wanted. Then: "Continue after" if invoices were already issued this financial year; HSN codes and GST rates checked with the CA. No real documents made yet (test documents were not finalised, so no numbers are used and nothing was emailed)

### Site-wide
- [x] Enquiry forms (8 variants, `QuoteForm.astro` + `src/scripts/forms.ts`) → **live** Google Apps Script web app (owner's Sheet "Website Inquiry", tab "Enquiries"; Apps Script project "Proline website enquiries", deployed 24 Oct as the owner, access Anyone). URL in `site.json` → `formEndpoint`. Test row sent 24 Oct and arrived. If the script changes: Deploy → Manage deployments → Edit → New version (same URL)
- [x] SEO: titles ≤ 60, descriptions, canonical, Open Graph, sitemap, robots.txt (AI bots blocked), breadcrumbs (`npm run check:seo`)
- [x] Schema: Organization/Electrician (Delhi, no street; hours left out until days are confirmed), Service, BreadcrumbList, BlogPosting, FAQPage, SoftwareApplication (/cms/), WebApplication (tools)
- [x] Brand search: "Proline Electrical Works" in home title, `alternateName` Proline / Proline EV / Proline Electrical / Proline CMS
- [x] `/admin` (Sveltia CMS 0.230.1, `public/admin/config.yml`): blog, FAQs, all page collections, site settings, rates, tariffs, CMS screenshots. Sign-in setup is owner's step (GO-LIVE 6)
- [x] Cloudflare `_headers` (security, caching, noindex on *.pages.dev)
- [x] Checks: build passes, no broken internal links (`npm run check:links`), titles/descriptions (`npm run check:seo`), no sideways scrolling on phones 320–412 px wide (header button gets a short label under 400 px)
- [x] Go-live guide `docs/GO-LIVE.md`
- [x] Lighter layout (owner approved 24 Oct, rule 17): home page 10,300 → 3,850 px tall on a laptop; service pages about half; CMS features page 17,200 → 6,200 px on a phone; compact footer; smaller type; form heading fixed (it was white on white in the dark contact band)
- [x] Packaging: not needed. The site deploys from GitHub to Cloudflare Pages on every push (a `dist/` zip was only for the manual-upload fallback)

## Waiting on the owner (site works without these; add when they arrive)
- Which charger brands Proline sells/works with (for /brands/ and charger pages; no brand names shown until then)
- Real CMS screenshots (5 desktop, 6 phone) and a public PDF of the CMS deck without slide 22
- Which CMS features are live at launch (copy section 10)
- Power approvals: offered or not? (AMC: yes, 24 Oct) · Which Tata company (Tata Power EZ Charge / Tata Motors)?
- Project stories, client quotes (with permission), registrations (GST, Udyam, licence) — none received, so none shown
- GitHub logins for admin users

## Decisions log
- 23 Oct: plan approved; build in chat; Astro on Cloudflare Pages.
- 24 Oct: Pexels photos approved ("these photos look good and professional"). Blur only charger/network brand marks (owner: no unneeded blur). Two photos brought back (solar-canopy-tall, ev-pedestal-crossover) now that car badges may stay.
- 24 Oct: add EV vs petrol savings calculator at launch; target searches: Proline (brand), EV charger installation, charging station earnings, EV cost savings.
- 24 Oct: coverage shown as a state list, not an India map (map borders are legally sensitive in India).
- 24 Oct: owner wants the CMS found for "cheapest, safest, feature-full, customisable CMS" searches. No superlative claims (no prices on site; ASCI needs proof for "cheapest"): cost-of-ownership page (one-time licence + yearly maintenance, payments to operator's own account, no commission to Proline — owner asked to confirm), security page, Features page re-titled "feature-rich", white-label page re-titled "customisable", buyer's guide blog. Removed "AI assistant" from the CMS add-on list (owner said no AI assistant).

## Session log
- 24 Oct 2026: photos re-exported with minimal blur; PROGRESS.md created; first push.
- 24 Oct 2026: skeleton, homepage, templates and hubs built and pushed. Seven writers drafting Markdown in parallel: services (10), chargers (5), batteries (4) + /solar-ev-charging/, audiences (7), blog (3), start-a-station guide + FAQs. If a session ends before they report back, check which files exist in `src/content/` and run the checker; write only the missing ones.
- 24 Oct 2026: CMS pages (7), tools (4 + hub), company and resource pages, blog template, widgets built and pushed. Owner asked for cheapest/safest/feature-rich/customisable CMS searches → security + cost pages, re-titles, buyer's guide. Owner confirmed: no commission, no per-charger fee, hosted option with 24/7 support.
- 24 Oct 2026: enquiry Sheet connected: Apps Script set up in the owner's Sheet via Chrome (owner approved permissions), web app deployed, test enquiry arrived, URL added to site.json.
- 24 Oct 2026 (15:45 IST): the first writers stopped at 14:44 when a request was interrupted. Done by then: services ev-charger-installation, home, dc-fast, earthing, cabling; chargers/ac-chargers; pages/start-an-ev-charging-station; blog/how-to-choose-ev-charging-cms. Relaunched 8 writers for everything else (6 services, 4 chargers, 4 batteries + solar-ev-charging, 7 audiences, 3 blog posts, FAQs). If they stop again: check `ls src/content/*/` and write only what is missing.
- 24 Oct 2026: **site live** at https://www.prolineelectricalworks.com (owner: "put online … directly, I do not require a test"). New Git-linked Pages project proline-website; www moved from the old project; bare domain added and redirected to www (301, path and query kept). Zoho MX/TXT records untouched.
- 24 Oct 2026: writers finished services (6), chargers (4), audiences (4) and 3 blog posts; reviewed and pushed. Fixes: Type 6 is DC-only and Type 7 (LECCS) is AC+DC (brief, finder, start guide, FAQ, dealers page); "free advice and installation" reworded so installation never reads as free; signage and single-line diagram removed as unconfirmed services; customers never asked to open a DB cover; 3.3 kW breaker: 16 A for a socket, 20 A wired.
- 24 Oct 2026: last writers finished (4 battery pages, /solar-ev-charging/, businesses, housing societies, fleets); all ~60 launch pages are in. Type 6/7 fixed on the fleets and 2-wheeler battery pages too. Fixed sideways scrolling on 360 px phones (header button label, long email in contact lists). Content, link and SEO checks: 0 problems.
- 24 Oct 2026 (evening): owner asked: hide the phone number (done: buttons/links only), never say what Proline earns (rule 14), AMC confirmed (page added), batteries rule confirmed, UBC government network (added to CMS pages), check public charging prices (still match: AC ₹8–15, DC ₹15–25 across Procharge, NextCharge and network lists), CMS photos from the PPT (already the deck screens), admin picture uploads (added: upload field + automatic WebP), billing app (built and tested; install pending). Decluttering and footer: proposal sent, waiting for approval.
- 24 Oct 2026 (night): owner approved the decluttering (compact footer, shorter home page, fold long sections, smaller type: "less congested"); done and pushed (rule 17). Owner kept the CMS "no commission" line and the concept-design label. Billing app installed in the owner's Google account (web app v2, Only myself) and linked at /admin/billing/; owner still to fill Settings (GSTIN, address, bank).
- 25 Oct 2026: live check in the owner's Chrome: home page (6 sections, 4 footer columns, no phone number in text), service page folding, and /admin/billing/ opening the billing app on Settings. Sample PDFs of the tax invoice, proforma with annexure and PO (marked SAMPLE) sent to the owner. The PDF test sample's ship-to moved to a Delhi site (a Haryana site with a Delhi place of supply was a bad example).
- 25 Oct 2026: owner looked at their old Word invoices, then chose to keep the app's own layout and numbering and use nothing from the Word files. Removed the HSN tax-summary table and the UPI QR code from the PDFs (totals now list CGST/SGST/IGST by rate; terms sit beside the signature so each copy fits one page). Fixed the dialog autofocus stealing the cursor from a field already in use (made the app test fail at random). Billing web app updated to the new version.
- 25 Oct 2026: owner sent the GST certificate and a cancelled cheque to build the firm's details into the invoice maker. Filled them into billing Settings (not into code: the repo is public). The GSTIN and account number are left for the owner to type.
- 25 Oct 2026: owner asked for number choice with warnings, their series (PEW/2627/0001 issued, 0002–0004 cancelled and reusable, 05 and 06 issued, next 07), Excel/CSV/paste import with templates, and cancel/amend from the list. Built and tested (15 maths, 22 server checks, full UI flow), pushed, and deployed at 11:02 on 25 Oct as billing web app **version 4**. Numbering set in the live Settings: PEW, year 2627, 2 digits, tax invoices continue after 6 (next PEW/2627/07), PEW/2627/0002–0004 listed to give again. Proforma and PO series start at PEW-PI/2627/01 and PEW-PO/2627/01.
- 25 Oct 2026: owner sent a logo pack (Plug-P, Volt-Leaf, Charge-O) and asked for the best one everywhere. Chose Charge-O (the plan's logo; clearest wordmark; the power-ring O reads as charging; works small). Website: header, phone menu, footer (white version), favicons incl. `favicon.ico`, schema logo, both share images. Billing: full logo on invoice, proforma and PO PDFs, white icon in the app header, tab icon; web app version 5 live and checked. Site checks 0 problems; no sideways scrolling 320–412 px; billing tests 15 maths, 23 server, full UI flow.
- 25 Oct 2026: owner: site still too crowded on phones; compared with Tata Power EZ Charge (franchise page) and Statiq (home) on phone width. Plan sent (phone-first cleanup: one idea per screen, photo heroes, swipe rows/tabs/tap-to-open blocks, lighter chrome, footer groups; no words, URLs, titles or schema removed). Waiting for approval and two decisions: bottom bar style; client logo files and own install photos.
