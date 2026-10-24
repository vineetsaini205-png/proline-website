# Content brief: how to write pages for prolineelectricalworks.com

For anyone writing or editing pages (people or Claude sessions). The owner's rules in `PROGRESS.md` come first; this file explains how to follow them in the copy.

## 1. Facts you may use (nothing else about the company)

- Proline Electrical Works, **Delhi** (home-based: never an address, office, showroom or map pin).
- 2 years installing EV chargers. 500+ chargers installed (AC, DC and DB boxes). 200+ technicians.
- Works in North, South and West India, in 10 states: Delhi, Haryana, Uttar Pradesh, Uttarakhand, Himachal Pradesh, Maharashtra, Madhya Pradesh, Chhattisgarh, Telangana, Tamil Nadu.
- Has installed chargers for **TATA, ThunderPlus, Bolt.Earth and KIA** (write "TATA" exactly; don't say which Tata company).
- Services: EV charger installation and commissioning (AC, DC, 2W/3W), site survey ("recce"), DB boxes, earthing, cabling and wiring, civil work (foundations, canopies), solar supply and installation, charging station setup.
- Sells chargers of **many brands** through tie-ups (no direct manufacturing); free consultation on choosing a charger; white-label (own-brand) chargers arranged from makers it works with. Batteries of different brands: 2W, e-rickshaw/3W, inverter/UPS/solar, BESS for stations.
- Site survey is **paid**; the fee is adjusted against the order if the customer goes ahead.
- Contact: WhatsApp any time; calls 10 am–7 pm; Sales@prolineelectricalworks.com. **Never write the phone number as text** (owner, 24 Oct): write "WhatsApp us" or "call us"; in Markdown you may link them: `[WhatsApp us](https://wa.me/917303887364)`, `[call us](tel:+917303887364)`.
- AMC (annual maintenance contracts) for EV chargers: offered (owner, 24 Oct) → /services/ev-charger-amc/. No response times or uptime promises.
- Batteries: scooter and e-rickshaw packs are supplied and matched, not fitted; inverter, solar and BESS batteries are installed.
- Proline CMS: its own charge management software (see `/cms/` pages; owner's copy in the chat attachments; claims limited by section 10). Software the operator owns, built in their brand and handed over, not a charging network. **No commission on charging payments, no fee per charger per month.** Runs on the customer's server (CPO Edition) or hosted by Proline on servers in India at a low running cost with **24/7 support** (CMS only).

**Never write:** prices of any kind for Proline work, chargers, surveys or CMS (no "starting at", no ranges, no "affordable"); response-time promises ("within 24 hours", "same day", "24/7" — except "24/7 support" for Proline CMS, which the owner confirmed); certifications, licences, ISO, empanelment, awards; "authorised partner/dealer" for any brand; testimonials, ratings, reviews, project stories, client quotes; numbers of years beyond 2; "India's leading/largest/No. 1"; what Proline earns: any commission, margin or mark-up on chargers, batteries or anything else, or amounts (owner, 24 Oct); electricity-connection (DISCOM/CEIG) liaison as a Proline service (owner hasn't confirmed; you may explain what the customer needs and that we tell them what to prepare); a chatbot/AI assistant.

**₹ amounts are allowed only** for public facts with a source (EV tariffs, fuel prices, public charging rates) and clearly-labelled worked examples in earnings/savings content.

## 2. Voice

- Plain Indian English for busy buyers: short sentences, active voice, "you" and "we". British spelling (colour, metre, programme), Indian terms (DISCOM, sanctioned load, society NOC, lakh).
- The first two sentences of a page answer the search directly. Detail comes after.
- Service, product and audience pages show only the first part of the text (about the first two sections) before a "Read the full page" button. Put the main answer and what the job covers first; reference detail (tables, standards, long lists) later.
- Specific beats grand: "a dedicated earth pit, tested for resistance" not "world-class safety".
- No emojis, no exclamation marks, no filler ("In today's world…", "Look no further").
- Be honest about trade-offs (e.g. 22 kW AC is wasted on cars that accept 7.2 kW).

## 3. Technical facts to get right

- AC chargers: 3.3 kW (16 A single phase), 7.4 kW (32 A single phase), 11 kW and 22 kW (three phase). Many cars in India accept 7.2 kW AC; some 11 kW. Car connector: Type 2. DC: CCS2 (most new cars); older Bharat DC-001/GB/T exist. Light EVs (2W/3W): IS 17017-2-6 "Type 6" (DC only, up to 120 V) and IS 17017-2-7 "Type 7" (LECCS: AC and DC through one inlet). Source: EVreporter, Apr 2024.
- DC chargers: 30–60 kW (LT three phase), 120–240 kW (high LT load or HT with transformer, depends on the state's LT limit). Dual-gun units share power.
- Protection: dedicated circuit, MCB, RCD (Type A with 6 mA DC detection, or Type B, as the charger maker asks), surge protection (SPD). Cable sized for continuous current and voltage drop; armoured cable underground.
- Standards/rules to name (no clause numbers unless verified): charger maker's manual; CEA safety regulations; IS 17017 (EV charging), IS 732 (wiring), IS 3043 (earthing).
- Policy facts with sources (cite like this, don't stretch them):
  - Unified Bharat eCharge (UBC): national EV charging network launched by the Ministry of Heavy Industries in Aug 2026 with BHEL (implementing agency) and NPCI BHIM Services, on the Beckn protocol; drivers find chargers and pay by UPI in the BHIM app; operators keep their own chargers and brand (Autocar Professional, 17 Aug 2026). PM E-DRIVE-funded stations must be onboarded on the National Unified Hub before the second subsidy tranche (PM E-DRIVE EV PCS operational guidelines). Proline CMS connects customers to UBC "in a few simple steps", now or later (owner, 24 Oct).
  - Ministry of Power guidelines (2024): single-part tariff for public charging, capped at average cost of supply till 31 March 2028; time-of-day: solar hours cheaper (0.7×), non-solar dearer (1.3×). Source: Lok Sabha unstarred Q 3099, 7 Aug 2025.
  - State EV tariffs (LT, ₹/unit): Delhi 4.50, Haryana 6.62, UP 7.70, Uttarakhand 6.25, HP 5.82, Maharashtra 6.08 (+₹75/kW fixed), MP 6.79, Chhattisgarh 5.00, Telangana 6.00 (+₹50/kW), Tamil Nadu 6–9 by time of day, Gujarat 4.10, Karnataka 5.00. Source: BEE state-wise EV tariff list (Annexure A); data in `src/data/tariffs.json`.
  - Public charging prices: AC ₹8–15/kWh, DC ₹15–25/kWh (Statiq, Oct 2026).
  - PM E-DRIVE: proposals go through government nodal agencies; subsidies are approval-based, not automatic (ChargeZone). Up to 100% support at government premises open free to the public (AIR News, Sep 2025).
  - Delhi EV Policy 2026: OEMs must put a public station at each Delhi dealer, at least 3 points for 2W/3W and 2 for cars (Daily Pioneer, 2 Jul 2026).
  - New stations' usage typically builds over 6–12 months (Bolt.Earth).
  - Fuel (Delhi): petrol ₹102.12, diesel ₹95.20 (20 Oct 2026); CNG ₹86.98/kg (29 Aug 2026). Data in `src/data/rates.json`.

## 4. Page files

One Markdown file per page in `src/content/<collection>/<url-slug>.md`. Copy the shape of `src/content/services/ev-charger-installation.md` (the model page).

Frontmatter fields for service, charger, battery, audience and root pages:

| Field | Rule |
|---|---|
| `title` | ≤ 60 characters, "Main phrase … \| Proline" |
| `description` | 140–160 characters, includes the main phrase and an offer or reason to click |
| `label` | Short name for cards, menus, breadcrumbs |
| `h1` | Contains the main search phrase |
| `eyebrow` | 1–3 words above the H1 |
| `intro` | 2 sentences that answer the search; may contain `[links](/url/)` and `**bold**` |
| `keyword` | The one main search phrase |
| `summary` | One line for hub cards (≤ 90 characters) |
| `icon` | One of: bolt plug home gauge station clipboard check checkCircle earth cable box hardhat sun battery building users truck bus landmark store car scooter calculator search list leaf phone shield wrench layers clock map tag server qr chart question handshake factory fuel file info trending cpu wifi lock refresh user globe palette |
| `order` | Order on the hub page |
| `image` | Optional photo key from `src/data/images.json` |
| `highlights` | 3 short checks under the H1 |
| `costFactors` | 5–8 "what decides the cost" bullets (`**Factor:** explanation`) — for pages people search with "cost" |
| `steps` | Optional custom steps `[{title, text}]`; otherwise the six standard steps show |
| `showProcess` | `false` to hide the steps section |
| `faqs` | 4–6 `{q, a}` real customer questions; answers 1–4 sentences, may link |
| `related` | 4–6 internal URLs (must be real pages, see section 5) |
| `form` | `quote` (default), `survey`, `station`, `demo`, `b2b`, `brand`, `technician`, `ask` |
| `need` | Optional preselected option in the quote form (one of the options in `QuoteForm.astro`) |
| `serviceType` | For service pages: adds Service schema |
| `guide` | `true` for long guides (author box + article schema) |
| `widget` | Only on two pages: `dc-inside` (DC chargers) and `white-label` (white-label chargers) |
| `updated` | `2026-10-24` |

`need` options: EV charger installation · Home charger installation · DC fast charger or charging station · Help choosing a charger (any brand) · Site survey · EV charger AMC (maintenance) · Earthing, cabling or DB box · Civil work or canopy · Solar installation · Batteries · Proline CMS · Something else

Body: 700–1,400 words of Markdown. Start at `##` headings (the H1 comes from frontmatter). Use short paragraphs, bullet lists, and at most one or two tables. Link to 3–6 other pages in the body where it helps the reader. End with a line pointing to the most useful tool or next step.

## 5. Internal URLs that exist

Services: /services/ · /services/ev-charger-installation/ · /services/home-ev-charger-installation/ · /services/dc-fast-charger-installation/ · /services/ev-charging-station-setup/ · /services/site-survey/ · /services/ev-charger-commissioning/ · /services/ev-charger-amc/ · /services/ev-charger-earthing/ · /services/ev-charger-cabling/ · /services/ev-charger-db-box/ · /services/ev-charging-civil-work/ · /services/solar-installation/

Proline CMS: /cms/ · /cms/features/ · /cms/built-for-india/ · /cms/white-label-self-hosted/ · /cms/security/ · /cms/affordable-ev-charging-software/ · /cms/demo/

Chargers and products: /chargers/ · /chargers/ac-chargers/ · /chargers/dc-fast-chargers/ · /chargers/2w-3w-chargers/ · /chargers/bus-truck-chargers/ · /chargers/white-label-chargers/ · /batteries/ · /batteries/2-wheeler-batteries/ · /batteries/e-rickshaw-batteries/ · /batteries/inverter-solar-batteries/ · /batteries/bess-for-ev-charging/ · /solar-ev-charging/

Who we serve: /for/ · /for/charge-point-operators/ · /for/charger-brands/ · /for/ev-makers-and-dealers/ · /for/businesses/ · /for/housing-societies/ · /for/fleets/ · /for/government-and-psu/

Tools: /tools/ · /tools/ev-charging-station-earnings-calculator/ · /tools/ev-vs-petrol-savings-calculator/ · /tools/charger-finder/ · /tools/installation-checklist/

Resources and company: /start-an-ev-charging-station/ · /coverage/ · /blog/ · /blog/ev-charging-station-earnings/ · /blog/home-ev-charger-installation-guide/ · /blog/ev-vs-petrol-savings/ · /faq/ · /ask/ · /brands/ · /about/ · /contact/ · /partner-with-us/ · /brand-partners/ · /join-as-technician/ · /privacy-policy/ · /terms/

Photos (`image` keys): dc-hub-canopy (homepage hero only), dc-hub-bays, solar-canopy-cars, solar-canopy-aerial, solar-canopy-tall, dc-charger-car, ac-charger-plug, ev-charging-suv, ac-pedestal-charger, ev-pedestal-crossover, dc-cabinet-charging, ac-charger-closeup. They are stock photos: never caption them as Proline's own work or a named project.

## 6. Check before you finish

`node scripts/check-content.mjs src/content/<collection>` must show 0 errors. Read every WARN and fix it unless it is clearly fine (₹ in a sourced tariff is fine).
