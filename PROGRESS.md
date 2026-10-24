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
| Live site today | prolineelectricalworks.com = old one-page site on Cloudflare Pages project "proline" (Direct Upload, cannot be linked to Git) |
| Owner | Vineet Saini, Proline Electrical Works, Delhi |
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
| How to write pages | `docs/content-brief.md` · approved plan copy: `docs/plan.md` |

## Owner's rules — never break these

1. **No prices anywhere** (no installation, charger, survey or CMS prices). Cost questions get the factors that decide cost + "Get a quote". Calculators use public tariffs/charging rates only; payback appears only when the visitor types their own quote.
2. **No AI assistant / chatbot.** Keep AI crawlers blocked (robots.txt + Cloudflare setting). Google and Bing allowed.
3. **Location = "Delhi" only.** Home-based, no office, no street address, no map pin.
4. Phone/WhatsApp **+91 73038 87364** — calls 10 am–7 pm, WhatsApp any time. Email **Sales@prolineelectricalworks.com**.
5. Facts allowed: 2 years in business · 500+ chargers installed (AC, DC, DB boxes) · 200+ technicians · North, South and West India · 10 states: Maharashtra, Chhattisgarh, Tamil Nadu, Telangana, Delhi, Himachal Pradesh, Uttarakhand, Uttar Pradesh, Haryana, Madhya Pradesh · installed for TATA, ThunderPlus, Bolt.Earth, KIA (write "TATA" — which Tata company is still unconfirmed).
6. **Do not invent** projects, testimonials, reviews, certifications/registrations, partner status, prices or response-time promises. "Authorised partner" only for a brand that authorised Proline in writing (none confirmed yet).
7. Site survey is **paid**; the fee is adjusted against the order if the customer goes ahead.
8. Proline CMS: claim only what works today. Not ready (keep off, or "on request"): a named live payment gateway, SMS sending, add-ons, OCPP 2.0.1. Deck screens are concept designs — label them so until real screenshots arrive. Never publish deck slide 22 (commercial).
9. Pages held back until the owner answers: AMC (`/services/ev-charger-amc/`), power approvals (`/services/ev-charging-power-approval/`). Hosted CMS: describe only the CPO Edition (customer's own server).
10. Hindi blogs/FAQs are phase 2 (at /hi/, written or checked by a Hindi speaker).
11. Photos: Pexels downloads from the owner. Owner (24 Oct): "do not blur if it is not required". We blur **only readable charger / charging-network brand marks** (Pexels licence: don't imply endorsement by brands in the image). Car badges and number plates stay. Tesla Supercharger photos are **not used** (the charger design itself is Tesla's, and Proline doesn't install them).
12. Commits end with the attribution lines in the session's instructions.

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
- [x] Placeholder logo (mark in `Logo.astro`, `public/favicon.svg`, `public/images/logo-512.png`); real Charge-O logo file still needed
- [x] Open Graph images: `public/images/og-default.jpg` (`scripts/og-default.mjs`), per-photo crops in `public/images/og/`
- [x] Content checker `scripts/check-content.mjs` and writing guide `docs/content-brief.md`

### Pages (launch set, ~60)
Home
- [x] `/` (draft screenshots sent to owner 24 Oct)

Services
- [x] `/services/` hub
- [x] `/services/ev-charger-installation/` (model page for writers)
- [ ] `/services/home-ev-charger-installation/`
- [ ] `/services/dc-fast-charger-installation/`
- [ ] `/services/ev-charging-station-setup/`
- [ ] `/services/site-survey/`
- [ ] `/services/ev-charger-commissioning/`
- [ ] `/services/ev-charger-earthing/`
- [ ] `/services/ev-charger-cabling/`
- [ ] `/services/ev-charger-db-box/`
- [ ] `/services/ev-charging-civil-work/`
- [ ] `/services/solar-installation/`
- held: `/services/ev-charger-amc/`, `/services/ev-charging-power-approval/` (owner to confirm)

Proline CMS (copy from owner's `proline-cms-website-copy.md`, sections 1–9; section 10 = not-ready list)
- [ ] `/cms/`
- [ ] `/cms/features/`
- [ ] `/cms/built-for-india/`
- [ ] `/cms/white-label-self-hosted/`
- [ ] `/cms/demo/`

Chargers and products
- [x] `/chargers/` hub (cards fill from content)
- [ ] `/chargers/ac-chargers/`
- [ ] `/chargers/dc-fast-chargers/` (+ "Inside a DC charger" animation, rebuilt — originals not available)
- [ ] `/chargers/2w-3w-chargers/`
- [ ] `/chargers/bus-truck-chargers/`
- [ ] `/chargers/white-label-chargers/` (+ "Your brand on the charger" demo, rebuilt)
- [x] `/batteries/` hub (cards fill from content)
- [ ] `/batteries/2-wheeler-batteries/`
- [ ] `/batteries/e-rickshaw-batteries/`
- [ ] `/batteries/inverter-solar-batteries/`
- [ ] `/batteries/bess-for-ev-charging/`
- [ ] `/solar-ev-charging/`

Who we serve
- [x] `/for/` hub (cards fill from content)
- [ ] `/for/charge-point-operators/`
- [ ] `/for/charger-brands/`
- [ ] `/for/ev-makers-and-dealers/`
- [ ] `/for/businesses/`
- [ ] `/for/housing-societies/`
- [ ] `/for/fleets/`
- [ ] `/for/government-and-psu/`

Tools (result first, no contact wall, no Proline prices)
- [ ] `/tools/` hub
- [ ] `/tools/ev-charging-station-earnings-calculator/`
- [ ] `/tools/ev-vs-petrol-savings-calculator/` (added 24 Oct for "EV cost saving" searches)
- [ ] `/tools/charger-finder/`
- [ ] `/tools/installation-checklist/`

Resources
- [ ] `/start-an-ev-charging-station/`
- [ ] `/coverage/` (state list by region — no India map, to avoid border-accuracy problems)
- [ ] `/blog/` + 3 posts: earnings, home installation, EV vs petrol savings
- [ ] `/faq/`
- [ ] `/ask/`
- [ ] `/brands/`

Company
- [ ] `/about/`
- [ ] `/contact/`
- [ ] `/partner-with-us/`
- [ ] `/brand-partners/`
- [ ] `/join-as-technician/`
- [ ] `/privacy-policy/`
- [ ] `/terms/`
- [ ] `404`

### Site-wide
- [ ] Enquiry forms → Google Apps Script (Sheet + email to Sales@); falls back to prefilled WhatsApp until the script URL is set
- [ ] SEO: titles < 60 chars, descriptions ~150, canonical, Open Graph image, sitemap, robots.txt (AI bots blocked), breadcrumbs
- [ ] Schema: Organization/Electrician (Delhi, hours, no street), Service, BreadcrumbList, BlogPosting, SoftwareApplication (/cms/)
- [ ] Brand search: "Proline Electrical Works", "Proline EV", "Proline CMS" in titles/schema `alternateName`
- [ ] `/admin` (Sveltia CMS): blog, FAQs, site settings, tariffs, pages
- [ ] Cloudflare `_headers` (security + caching)
- [ ] Checks: build passes, no broken internal links, titles/descriptions lengths, mobile screenshots, page weight
- [ ] Go-live guide `docs/GO-LIVE.md` (new Git-linked Pages project, domain move, Apps Script, admin login, Search Console, GBP)
- [ ] Final zip of `dist/` sent to owner

## Waiting on the owner (site works without these; add when they arrive)
- Charge-O logo file (SVG or PNG) — placeholder bolt logo used until then
- Which charger brands Proline sells/works with (for /brands/ and charger pages; no brand names shown until then)
- Real CMS screenshots (5 desktop, 6 phone) and a public PDF of the CMS deck without slide 22
- Which CMS features are live at launch (copy section 10)
- AMC and power approvals: offered or not? · Which Tata company (Tata Power EZ Charge / Tata Motors)? · Hosted CMS option?
- Project stories, client quotes (with permission), registrations (GST, Udyam, licence) — none received, so none shown
- Google account for the enquiry Sheet (Apps Script) and GitHub logins for admin users

## Decisions log
- 23 Oct: plan approved; build in chat; Astro on Cloudflare Pages.
- 24 Oct: Pexels photos approved ("these photos look good and professional"). Blur only charger/network brand marks (owner: no unneeded blur). Two photos brought back (solar-canopy-tall, ev-pedestal-crossover) now that car badges may stay.
- 24 Oct: add EV vs petrol savings calculator at launch; target searches: Proline (brand), EV charger installation, charging station earnings, EV cost savings.
- 24 Oct: coverage shown as a state list, not an India map (map borders are legally sensitive in India).

## Session log
- 24 Oct 2026: photos re-exported with minimal blur; PROGRESS.md created; first push.
- 24 Oct 2026: skeleton, homepage, templates and hubs built and pushed. Seven writers drafting Markdown in parallel: services (10), chargers (5), batteries (4) + /solar-ev-charging/, audiences (7), blog (3), start-a-station guide + FAQs. If a session ends before they report back, check which files exist in `src/content/` and run the checker; write only the missing ones.
