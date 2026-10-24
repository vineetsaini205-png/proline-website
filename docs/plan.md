<!-- Copy of the approved plan (Claude Docs: https://claude.ai/artifact/BbomKbPKuGQ3w2mU2rUbE9), rev 124, exported 24 Oct 2026. The Claude Doc is the master; this copy is for offline reference. -->


# Proline Electrical Works — Website Plan

2026-10-23 · @Vineet Saini

## Summary

Proline's site should grow from one page into about 50 SEO-built pages at launch, and 150+ pages within six months. It has two main jobs, selling installation and selling Proline CMS, and two more: charger sales (brand commission) and installation contracts from brands, CPOs and government buyers.

- **Position:** "Brand-neutral EV charging partner. We survey, install and commission any brand, help you choose the right charger, and give you Proline CMS to run them all." None of the three reference sites offers brand-neutral buying advice.
- **What pulls visitors in:** the earnings calculator (upgraded), a charger finder, an installation checklist, state-by-state guides to tariffs, subsidies and DISCOM approvals, and the Proline CMS pages with a demo booking.
- **What turns visitors into leads:** WhatsApp and call buttons on every page, a short enquiry form, a site-survey booking, and calculator results shown before any contact details are asked.
- **What stays:** Cloudflare Pages hosting (free), your Charge-O logo, the navy-and-green look, and the two animations you picked (Inside a DC charger, Your brand on the charger).

**Fix this week, whatever else we decide:** the version live on your Cloudflare project is still the first one-page site, and its phone number reads "+91 XXXXX XXXXX". Swapping in +91 73038 87364 now lets visitors reach you while the new site is built.

**Decided on 23 October** (open items are in the last section):

- **Enquiries:** call +91 73038 87364 (10 am to 7 pm) or WhatsApp it any time, or use the form on the site; every form entry lands in a Google Sheet (downloadable as Excel) and is emailed to Sales@prolineelectricalworks.com.
- **Location:** Delhi only, no street address, as you work from home. The Google Business Profile is set up as a service-area business.
- **Services added:** civil work (foundation, canopy) and solar supply and installation.
- **Site survey:** paid, and the fee is adjusted against the order if the customer goes ahead.
- **Prices:** none anywhere on the site. Cost questions get the factors that decide the cost and a "Get a quote" button.
- **AI assistants:** stay blocked.
- **Images:** a real photo in the homepage hero, best from one of your installs, with a free stock photo standing in until then; clean illustrations elsewhere until more site photos arrive.
- **Admin login****:** you and your staff publish blogs and FAQs yourselves and edit anything that changes often (details under Design and build).
- **Brand partners:** a page for charger brands that want more buyers, so a brand searching for distributors in India finds you and gets in touch.
- **Proline CMS:** a main product, with its own section and menu item, a homepage band, a Book a demo form, and space for desktop and phone screenshots on its pages.
- **Hindi:** Hindi blogs and FAQs on their own /hi/ pages, from phase 2.
- **Logos:** the brands' logos are yours to use.
- **Proof figures:** 2 years in business, 500+ chargers installed (AC, DC, DB boxes), 200+ technicians across North, South and West India, installations for TATA, ThunderPlus, Bolt.Earth and KIA.
- **States:** Maharashtra, Chhattisgarh, Tamil Nadu, Telangana, Delhi, Himachal Pradesh, Uttarakhand, Uttar Pradesh, Haryana, Madhya Pradesh.

## What the research found

Each reference site does one thing well, and none combines neutral buying advice, useful tools and real proof. That gap is Proline's opening.

| Site | What to copy | What to avoid |
|---|---|---|
| [Bolt.Earth](https://bolt.earth) | Chargers sorted by vehicle: 3.3 kW sockets, 2W/3W chargers (3–12 kW, Type 6 and Type 7), car AC 7.4–22 kW and DC 30–240 kW. A six-step setup story, from free site assessment to 24/7 support. A [franchise page](https://bolt.earth/franchise) whose calculator starts with two inputs (station format, how busy), lets you edit tariff, price and vehicle mix, shows quiet / likely / busy results and carries an honest disclaimer. Named testimonials, certifications, blog posts every few days. | It sells its own chargers and network, so its advice is never neutral. |
| [Gigforce](https://gigforce.in) | One page per service: turnkey projects, AMC, operations support, DISCOM liaisoning (including CEIG approvals), site acquisition. Pan-India proof: client logos, testimonials, a six-step process. | Its [savings calculator](https://gigforce.in/calculator.html) hides results behind a phone OTP. Its stats are counters that read "0" in the page code, which is what many crawlers and AI tools see. Its footer copies Bolt.Earth's text and calls Gigforce "India's largest EV charging network". |
| [HM Enterprise EV](https://hmenterprisesev.com) | Names earthing and AMC as services. Mentions its city (Noida) for local search. | Four thin pages on a site builder, stock and AI-generated images, a "15000+" claim with no proof, a quote form with no phone field, no tools, blog or FAQ. |
| [Proline today](https://proline-3da.pages.dev) | Clear title and description, a working earnings calculator that shows its method, a useful FAQ, the recce explained. | Everything sits on one page, so it can rank for only a handful of searches. Phone and WhatsApp still show placeholders. The four-page green version with your logo is not live yet. |

Three more fixes for the current site:

- **Tariff example.** The calculator says Karnataka's EV tariff is ₹4.50 a unit; [Statiq's October 2026 table](https://statiq.in/blog/2026/10/12/public-ev-charging-cost-india/) lists ₹5.00. The new calculator should use a state picker with dated, sourced tariffs.
- **AI assistants are locked out.** prolineelectricalworks.com refused my research tool as a blocked bot, while the same site on proline-3da.pages.dev opened normally. That points to Cloudflare's AI-bot blocking on your domain: Google still reads the site, ChatGPT-style assistants cannot, and you have chosen to keep it that way.
- **Original words only.** Gigforce shows the risk of copying a competitor's text: it ends up claiming someone else's numbers.

## Who the site is for

Eleven buyer groups reach Proline in different ways, so each gets its own landing page. The search phrases are starting points; real volumes get checked in Google Keyword Planner and Search Console after launch.

| Buyer | What they need | They search for (examples) | Lands on | How Proline earns |
|---|---|---|---|---|
| Charge point operators (CPOs) | Crews to survey, install and commission sites in many cities, to the CPO's checklist and handover format. ChargeZone, for one, provides [on-site service through partners](https://www.chargezone.co.in/franchise). | EV charger installation partner; EVSE installation and commissioning | /for/charge-point-operators/ | Per-site contracts, AMC |
| Operators buying software: CPOs, fleets, housing societies | One system for chargers of any brand, UPI payments with automatic refunds and GST documents, on their own server and in their own brand | EV charging management software; charge point operator software India; OCPP CMS | /cms/ | Build and licence fee, deployment, add-ons, AMC |
| Charger brands | Trained installers for every unit their customers buy, anywhere in India | EV charger installation service pan India | /for/charger-brands/ | Per-install rate card |
| Charger brands looking for more sales | Buyers in new cities and states, with installation and service there, without opening offices | EV charger distributor in India; EV charger channel partner | /brand-partners/ | Commission on each sale, or resale margin |
| EV makers and dealers | A home charger fitted at each delivery, chargers at showrooms. Delhi's EV Policy 2026 makes every OEM put a public station at each Delhi dealer, with at least 3 points for 2W/3W and 2 for cars ([Daily Pioneer](https://www.dailypioneer.com/news/slug-lite/delhi-notifies-ev-policy-2026-subsidies-within-60-days?year=2026)). | dealership EV charging station; home charger installation partner | /for/ev-makers-and-dealers/ | Installation contracts, charger supply |
| Businesses with parking: hotels, malls, hospitals, offices, fuel stations, highway dhabas | The right charger, an earnings estimate, a subsidy check, turnkey setup | EV charging station cost; EV charger for hotel | /for/businesses/ + earnings calculator | Charger sale or brand commission, installation |
| Investors and landowners | Is a station profitable, what does it cost, franchise or own? | how to start EV charging station business; EV charging station profit | /start-an-ev-charging-station/ + earnings calculator | Free consultation, then charger sale or commission and installation |
| Housing societies and builders | Shared chargers, load sharing, billing, society approval | EV charger for society | /for/housing-societies/ | Installation, chargers |
| Fleets: delivery, cabs, logistics, e-buses, e-rickshaw hubs | Depot charging, DC power, batteries, uptime | fleet EV charging; e-rickshaw charging station | /for/fleets/ | Installation, chargers, batteries |
| Government and PSUs | Supply-install-test-commission (SITC) tenders on GeM. PM E-DRIVE pays up to 100% at government premises open free to the public ([AIR News](https://www.newsonair.gov.in/centre-issues-guidelines-for-rollout-of-72300-ev-charging-stations-under-pm-e-drive/)). | SITC EV charging station | /for/government-and-psu/ | Tender contracts |
| Home EV owners | A safe wall-box fit, earthing, a separate EV meter, moving a charger | home EV charger installation near me | /services/home-ev-charger-installation/ | Installation fee, charger sale |

## Sitemap

Starred pages go live only if you offer that service; items marked (later) arrive in phases 2 and 3, and the shaded group is Proline CMS. URLs and target searches for each page are under Key pages, below.

## How the homepage will look

Sections 1–4 tell visitors who Proline serves, 5–10 show what it does, Proline CMS included, and what a station could earn, 11–13 give proof and the solar story, and 14–17 turn interest into an enquiry. The finished page keeps your logo colours and light theme; this drawing fixes only the order and layout.

## How the Proline CMS page will look

The screenshot spaces match the screens in your deck. Desktop: D1 dashboard, D2 add a charger, D3 tariffs, D4 reports, D5 health. Phone: P1 live charging, P2 scan, P3 choose, P4 pay, P5 technician connect, P6 sticker binding. The page is built so you can swap any screenshot yourself from the admin area.

## Key pages, one by one

Every page targets one main search and ends in one action: WhatsApp, call, the enquiry form or a survey booking. About 50 pages go live at launch; pages marked * go live only if you offer that service.

### Services

| Page | URL | Main search | What's on it |
|---|---|---|---|
| EV charger installation | /services/ev-charger-installation/ | EV charger installation | All charger types, the six-step process, what decides the cost, coverage map |
| Home charger installation | /services/home-ev-charger-installation/ | home EV charger installation | 7.4, 11 and 22 kW; single vs three phase; society permission; separate EV meter |
| DC fast charger installation | /services/dc-fast-charger-installation/ | DC fast charger installation | 30–240 kW; transformer and LT panel; foundation and cable trench |
| Charging station setup | /services/ev-charging-station-setup/ | EV charging station setup | Survey to go-live: approvals, civil work, canopy, branding, app or CMS onboarding |
| Site survey (recce) | /services/site-survey/ | EV charger site survey | What gets checked, a sample report, turnaround time, and that the fee is adjusted against the order |
| Commissioning and testing | /services/ev-charger-commissioning/ | EV charger commissioning | Test checklist, OCPP or app setup, handover pack |
| Earthing | /services/ev-charger-earthing/ | earthing for EV charger | Pipe vs chemical earthing, resistance test, diagrams |
| Cabling and wiring | /services/ev-charger-cabling/ | cable for EV charger | Sizing, armoured cable, trenching, routing |
| DB boxes | /services/ev-charger-db-box/ | EV charger DB box | MCB, RCCB or RCBO, surge protection; supply and fit |
| Civil work | /services/ev-charging-civil-work/ | EV charging station civil work | Charger foundations and canopies, built along with the installation |
| Solar supply and installation | /services/solar-installation/ | commercial rooftop solar installation | Panels and inverters supplied and fitted, on roofs or carports, sized for your load and your chargers |
| AMC * | /services/ev-charger-amc/ | EV charger AMC | Preventive visits, breakdown response time |
| Power approvals * | /services/ev-charging-power-approval/ | EV charging station electricity connection | Load increase, EV meter, CEIG inspection |

### Proline CMS

Proline CMS gets its own section and a place in the main menu. Sections 1–9 of the copy you sent fill these pages, and every page has spaces for desktop and phone screenshots, as drawn above.

| Page | URL | Main search | What's on it |
|---|---|---|---|
| Proline CMS | /cms/ | EV charging management software | Hero, three points, how it works, why operators choose it, built for India, FAQ and the demo form; 5 desktop and 6 phone screenshots |
| Features | /cms/features/ | charge point operator software India | Every feature group from your copy, each with its screenshot |
| Built for India | /cms/built-for-india/ | UPI EV charging payment | UPI, GST documents, DPDP Act, CERT-In, DLT SMS, BEE EV Yatra |
| Your server, your brand | /cms/white-label-self-hosted/ | white label EV charging software | Your server in India, your name and domain, what runs where, add-ons on request |
| Book a demo | /cms/demo/ | Proline CMS demo | Demo form to your Sheet and email, what the demo covers, the deck as a PDF |

Two checks before these pages go live:

- **Only what works today.** Section 10 of your copy lists what is not ready yet: a live payment company, SMS sending, the add-ons, OCPP 2.0.1. Those stay off the pages or are marked "on request".
- **Real screens, no real data.** Screenshots come from the working demo console with the sample brand "Your Brand". The screens in your deck are marked "concept design", so they stand in only until real ones are taken.

### Chargers and products

| Page | URL | Main search | What's on it |
|---|---|---|---|
| Chargers | /chargers/ | buy EV charger in India | Categories, the brand-neutral promise, "get quotes from 3 brands" |
| AC and home chargers | /chargers/ac-chargers/ | 7.4 kW EV charger | 3.3–22 kW, single or three phase, brands compared on features and warranty |
| DC fast chargers | /chargers/dc-fast-chargers/ | 60 kW DC charger | 30–240 kW, single or dual gun, CCS2; the Inside a DC charger animation |
| 2W and 3W chargers | /chargers/2w-3w-chargers/ | e-rickshaw charger | Type 6 and Type 7 fast chargers, socket points, e-rickshaw hubs |
| Bus and truck chargers | /chargers/bus-truck-chargers/ | electric bus charger | High-power DC, depot layouts |
| White-label chargers | /chargers/white-label-chargers/ | white label EV charger India | The Your brand on the charger demo, process, lead times |
| Batteries (hub + 4 pages) | /batteries/ | e-rickshaw lithium battery | 2W, e-rickshaw/3W, inverter and solar, BESS for charging stations |
| Solar + EV charging | /solar-ev-charging/ | solar EV charging station | The sun-to-EV story you already have: solar carport, storage |

### Who we serve

Seven pages, one per buyer group in the table above, on one template: their problem in their words, what Proline does, project proof, process and response times, FAQ, and a form shaped for them.

### Proof and resources

| Page | URL | What's on it |
|---|---|---|
| Projects | /projects/ and /projects/name/ | Site type, city, charger, days taken, client's words; illustrations now, real photos later |
| Coverage | /coverage/ | Map of states and cities served, linking to state guides |
| State guides | /ev-charging/state/ | DISCOM, EV tariff, state policy, approval steps, your projects there |
| Start a station | /start-an-ev-charging-station/ | The investor's guide: what decides the cost, approvals, choosing chargers, earnings |
| Blog | /blog/ | Guides, project stories, policy updates |
| FAQ | /faq/ | All questions, grouped by buyer |
| Ask an expert | /ask/ | Visitors send their doubts; answered ones become short Q&A pages, with permission |
| Brands we work with | /brands/ | Charger brands you sell and clients you've installed for (TATA, ThunderPlus, Bolt.Earth, KIA); logos shown; "authorised partner" only for brands that have authorised you in writing |

### Company

| Page | URL | What's on it |
|---|---|---|
| About | /about/ | Your story: 2 years, 500+ chargers, 200+ technicians, clients, licences |
| Contact and survey booking | /contact/ | Form, WhatsApp (any time) and phone (+91 73038 87364, 10 am to 7 pm), sales email, Delhi; no street address or map |
| Partner with us | /partner-with-us/ | B2B form and a capability deck (PDF) |
| Sell your chargers through Proline | /brand-partners/ | For charger brands: the buyers Proline reaches, the states it covers, installation and service by its technicians, how commission or resale works, and an onboarding form. Brand price lists stay private |
| Join as technician | /join-as-technician/ | Grows your 200+ technician network across states |
| Privacy and terms | /privacy-policy/ and /terms/ | Needed once forms collect phone numbers |

## Tools that pull visitors in

The earnings calculator stays the centrepiece; three tools launch with the site and six follow. Every tool shows its answer first and asks for contact details only after. No tool shows a Proline or brand price: earnings use public tariffs and charging rates, and payback appears only when the visitor enters their own quote.

| Tool | Visitor enters | Visitor gets | Phase |
|---|---|---|---|
| Earnings calculator (upgrade of today's) | Charger type and count, state (fills the EV tariff), how busy (quiet / likely / busy), price per kWh, vehicle mix, their own quote (optional, blank by default); advanced: share of charging in solar hours, rent or revenue share, app commission | Monthly profit and a quiet-to-busy range; payback and 5-year cash once a quote is entered; a report on WhatsApp | 1 |
| Charger finder | Vehicles (2W, 3W, car, bus), place (home, society, business, highway, depot), daily use, supply (single or three phase, sanctioned load), budget level (basic, mid, premium) | Charger type and kW, 2–3 matching brand options compared on features and warranty, what the installation needs, "Get quotes" | 1 |
| Installation checklist | Charger type, cable distance from the meter, wall or pedestal, earthing, DB box, city | The work the job needs (cable run, earthing, DB box, civil work) and what the survey will check, then "Get a quote" | 1 |
| EV vs petrol/diesel savings | Vehicle, km a day, fuel price, mileage, electricity rate | Monthly and yearly savings, CO2 saved, shown free (Gigforce hides its version behind an OTP) | 2 |
| Charging time | Battery kWh, charger kW, start and end % | Time to charge, plus a table for popular EVs | 2 |
| Load checker | Sanctioned load, big appliances, charger kW | "Fits" or "needs a load increase", with next steps | 2 |
| Subsidy and tariff finder | State, site type | EV tariff, state incentives, whether PM E-DRIVE could apply | 2 |
| E-rickshaw station earnings | Charging points, batteries a day, tariff, what you charge per battery | Daily and monthly income, in Hindi too | 3 |
| Solar + EV and BESS sizing | Daily charging kWh, roof or land area | Panel kW, battery kWh, share of charging from solar | 3 |

**Rules for every tool**

- **Result first, no OTP wall.** Then "Send this to WhatsApp" (the inputs travel in the prefilled message) and "Get an exact quote".
- **Defaults carry a source and a date.** Public charging runs ₹8–15/kWh on AC and ₹15–25/kWh on DC. EV tariffs include Delhi ₹4.50 (LT), Gujarat ₹4.10, Karnataka ₹5.00, Maharashtra ₹6.08 and Haryana ₹6.62 ([Statiq, Oct 2026](https://statiq.in/blog/2026/10/12/public-ev-charging-cost-india/), which links BEE's state list).
- **The tariff model follows the Ministry of Power's 2024 guidelines:** a single-part tariff capped at the average cost of supply till 31 March 2028, 30% cheaper in solar hours and 30% dearer outside them ([Lok Sabha answer, Aug 2025](https://eparlib.sansad.in/bitstream/123456789/2994845/1/AU3099_jxi0H3.pdf)).
- **Careful subsidy wording.** PM E-DRIVE proposals go through government nodal agencies, and ChargeZone warns these subsidies are approval-based, not an automatic entitlement ([ChargeZone](https://www.chargezone.co.in/franchise)).
- **An honest disclaimer**, like Bolt.Earth's, which notes that a new station's usage typically builds over 6–12 months ([Bolt.Earth](https://bolt.earth/franchise)).
- **Its own page.** Each tool gets a plain explainer, the method and an FAQ, so it can rank on its own.

## SEO plan

One page per search, original content, and guides that answer questions competitors skip. That is how a 50-page site grows to 150+ pages that rank, without thin copies. With no prices on the site, pages that meet cost searches explain what decides the cost and offer a quote; they will rank below pages that publish figures, so the plan leans on product, service and how-to searches.

### Keyword groups

| Group | Example searches | Pages that target them |
|---|---|---|
| Installation services | EV charger installation; DC charger installation; EV charger installation near me | Service pages, home |
| Charging software | EV charging management software; charge point operator software India; OCPP CMS; EV charger QR payment; GST invoices for EV charging | Proline CMS pages, CMS feature pages, blog |
| Starting a station | how to start EV charging station; EV charging station profit; EV charging station franchise; EV charging station requirements | Start-a-station guide, earnings calculator, blog |
| Buying chargers | 7.4 kW EV charger; 60 kW DC charger; best home EV charger; EV charger dealer | Charger pages, charger finder |
| Home and society | home EV charger installation; society EV charging rules | Home service page, society page, blog |
| Technical | earthing for EV charger; cable size for EV charger; EV charger DB box; EV charging station canopy | Service pages, blog |
| Policy and tariffs | EV tariff in a state; PM E-DRIVE charging subsidy; Delhi EV policy dealership | State guides, blog |
| Business partners | EV charger installation partner; EVSE commissioning services; SITC EV charging station; EV charger distributor in India | Audience pages, partner and brand-partner pages |
| Batteries and solar | e-rickshaw lithium battery; BESS for EV charging; solar EV charging; rooftop solar installation | Battery and solar pages |
| Your name | Proline Electrical Works; Proline EV charger | Home, about, Google Business Profile |

### Rules for every page

- One main search phrase per page, used in the title, H1, URL and first paragraph.
- Title under 60 characters ("Main phrase | Proline"), and a meta description of about 150 characters with an offer.
- The first two sentences answer the question; detail follows.
- 3–6 FAQs per page, taken from real customer questions.
- Internal links: each service page links to its chargers, the right tool and a state guide; each blog post links to one service and one tool.
- Images named for what they show, with alt text, compressed to WebP: illustrations now, real site photos as you add them.
- Guides carry an author box (your name, years in the trade) and a "last updated" date wherever tariffs or rules appear.
- The admin area holds these rules as fields: title and description with length counters, the main search phrase, required alt text, the page's FAQs and an automatic "last updated" date.

### Technical setup

- Static pages on Cloudflare Pages: fast, secure, free.
- sitemap.xml, robots.txt, and canonical tags pointing to prolineelectricalworks.com, so the pages.dev copy never competes.
- Mobile-first, with Core Web Vitals targets of LCP under 2.5 s, INP under 200 ms and CLS under 0.1.
- No important text drawn only by JavaScript (Gigforce's counters show "0").
- Breadcrumbs, a helpful 404 page, and 301 redirects whenever a URL changes.
- Hindi blogs and FAQs from phase 2, at /hi/ addresses, each linked to its English page with hreflang tags. A Hindi speaker writes or checks each one: Google's spam rules name automated translation that adds little value ([GSQi](https://www.gsqi.com/marketing-blog/auto-translating-content-google-scaled-content-abuse/)).

### Structured data

- Organization and LocalBusiness (Electrician) on every page: name, logo, phone, email, opening hours, Delhi as the locality (no street address), area served India, and links to LinkedIn, YouTube and IndiaMART.
- Service markup on service pages, breadcrumbs everywhere, BlogPosting with author on guides.
- SoftwareApplication markup on the Proline CMS pages, so search engines read them as software.
- FAQ markup is optional. Google stopped showing FAQ rich results on 7 May 2026 and says leftover markup causes no problems ([Search Engine Journal](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/)). FAQs stay for readers and AI answers, not for search snippets.

### Google Business Profile

- One profile as a service-area business: Google asks for your address to verify it, you hide it, and the profile shows Delhi, your call hours and the closest categories to EV charger installation and electrician.
- Google's guidelines keep a service area within about 2 hours' drive of your base ([Google](https://support.google.com/business/answer/3038177)), so the profile covers Delhi NCR; other states come through the site and its state guides.
- Weekly posts about finished jobs, and a Google review request after each one.
- No profiles at addresses you don't occupy: Google suspends those.
- The same name, phone (+91 73038 87364) and "Delhi" everywhere: site, profile, IndiaMART, JustDial, LinkedIn.

### State guides instead of thin city pages

- One guide per state: DISCOMs and EV tariff, state EV policy, approval steps and timelines, your projects there. Start with your ten: Maharashtra, Chhattisgarh, Tamil Nadu, Telangana, Delhi, Himachal Pradesh, Uttarakhand, Uttar Pradesh, Haryana and Madhya Pradesh.
- City pages only where you have real projects or crews. Copies with the city name swapped look like doorway pages to Google and can pull the whole site down.

### Blog calendar

Two posts a week, plus a project story every two weeks; the most useful posts and FAQs also get Hindi versions. The first fifteen:

1. What decides the cost of an EV charging station
2. How to start an EV charging station business, step by step
3. EV charging station earnings: how to work out yours
4. Home EV charger installation: what the job involves
5. AC or DC charger: which one do you need?
6. Earthing for EV chargers: pipe vs chemical, and how it's tested
7. Cable size for 7.4 kW, 22 kW and 60 kW chargers
8. EV charging station electricity connection: DISCOM steps and timelines
9. PM E-DRIVE charging subsidy: who qualifies and who doesn't
10. Delhi EV Policy 2026: what dealerships must install
11. Society EV charging: approvals, load sharing, billing
12. White-label EV chargers: launching your own brand
13. Selling EV chargers in India: how brands find buyers and installers in new states
14. What a charge management system does for a CPO, and what to ask before buying one
15. UPI payments at EV chargers: how automatic refunds work

First Hindi posts: how to open an EV charging station, home charger installation, and e-rickshaw charging stations.

### AI search

- Google's AI Overviews read the site through Google's normal crawler, so they can still quote pages that answer plainly, with facts and dates; the rules above serve them.
- Other AI assistants stay blocked, as you decided: those that respect your Cloudflare setting, my research tool among them, cannot read or quote your pages. One setting in Cloudflare changes that if you ever want to.
- Add the site to Bing Webmaster Tools as well as Google Search Console; Microsoft Copilot and some other assistants draw on Bing.
- Get listed where buyers and AI tools look: IndiaMART, JustDial, LinkedIn, industry directories, news of your projects.

### Measuring it

Check Search Console weekly (searches, clicks, new pages indexed) and review leads by page every month.

## How brands, CPOs and government buyers will find you

Brands and CPOs pick installers through vendor onboarding, referrals and search; government buyers use GeM tenders that often demand an OEM authorisation. Proline needs B2B pages, a tender-ready document pack, and a presence where procurement teams look.

**On the site**

- /partner-with-us/ with a B2B form (company, sites per month, states, charger types, response time needed) and a downloadable capability deck.
- /brand-partners/ for charger brands that want more buyers: Proline brings them customers through brand-neutral advice, the site's tools and its 200+ technicians, and earns a commission or a resale margin. It targets searches such as "EV charger distributor in India" and "EV charger channel partner".
- /cms/ and /cms/demo/ for operators choosing software: your copy, the screenshots, and a public version of your CMS deck as a PDF, without the commercial slide.
- Audience pages for CPOs, brands, EV makers and government, each with a coverage map, process, turnaround times and sample documents: survey report, commissioning checklist, handover photos.
- A compliance strip: GST, Udyam (MSME), electrical contractor licence, insurance, EPF and ESI, ISO if you hold it.

**Where to show up**

| Channel | Why it matters | First action |
|---|---|---|
| Vendor registration with CPOs, brands and OEMs | CPOs deliver on-site work through partners; ChargeZone says so on its [franchise page](https://www.chargezone.co.in/franchise) | List 30 target companies, register on their vendor portals, send the deck |
| OEM authorisation | SBI's October 2026 GeM tender for 19 charging stations in UP took only empanelled electrical contractors holding an OEM authorisation certificate, with 7+ years of HT/LT work ([tender](https://sbi.bank.in/documents/39129/51516783/NOTICE+INVITING+TENDER20261003063932872.pdf)) | Get authorisation letters from 2–3 brands you sell, and completion certificates for your TATA, ThunderPlus, Bolt.Earth and KIA jobs. Until you reach 7 years, bid on smaller tenders or work under an empanelled contractor |
| GeM seller registration | Public buyers such as SBI tender charger supply-and-installation on GeM | Register; set alerts for "EV charging station" bids |
| LinkedIn | Where project and procurement heads look for vendors | Company page plus a weekly project post from you |
| Directories | IndiaMART, TradeIndia and JustDial are where many buyers start | List with the same name, phone and site link everywhere |
| Expos | [EV Expo](https://evexpo.in/), Bharat Mandapam, Delhi, 23–25 Dec 2026; [Bharat Mobility Global Expo](https://en.wikipedia.org/wiki/Auto_Expo), New Delhi, 4–9 Feb 2027; [EV India Expo](https://evindiaexpo.in/), Greater Noida, Sept 2027 | Visit with the deck and a live CMS demo on a laptop, meet brand and CPO teams; exhibit later |
| Brands' installer lists | Each brand you work with can list Proline as its installer | Ask the brands you've installed for (TATA, ThunderPlus, Bolt.Earth, KIA) for a listing with a link to your site |
| Delhi dealership rule | Every OEM needs a public station at each Delhi dealer ([Daily Pioneer](https://www.dailypioneer.com/news/slug-lite/delhi-notifies-ev-policy-2026-subsidies-within-60-days?year=2026)) | A dealership-charging page, then outreach to OEM regional managers, with your KIA work as proof |

The OEM authorisation also lets the site honestly say "authorised partner" for those brands.

## Turning visitors into enquiries

Every page ends in one of three actions (WhatsApp or call on +91 73038 87364, the enquiry form, or a survey booking), and nothing asks for details before giving something useful.

- **Always in reach:** a bottom bar on phones with WhatsApp (any time) and Call (10 am to 7 pm); a "Get a quote" button in the header that opens the enquiry form ("Book a demo" on the CMS pages).
- **Short forms:** name, phone, city and need, four fields. CMS demo requests also ask for the company and number of chargers. Station enquiries add site details, as Bolt.Earth's form does: state, city, map pin, property type, sanctioned load.
- **WhatsApp Business:** prefilled messages that carry the page and calculator inputs, quick replies, and a catalogue of charger categories.
- **Lead handling:** each form entry becomes a row in a Google Sheet (open it or download it as Excel any time) and an email to Sales@prolineelectricalworks.com, with the page it came from and any calculator inputs. A free Google Apps Script does this, and Cloudflare Turnstile, also free, keeps spam bots out. The site shows your hours: calls 10 am to 7 pm, WhatsApp any time.
- **Proof beside every button:** 500+ chargers installed, 200+ technicians, the brands you've installed for, real Google reviews.
- **Tracking:** Google Search Console and Bing Webmaster Tools; Cloudflare Web Analytics (free, no cookies) or Google Analytics; Microsoft Clarity for heatmaps. WhatsApp clicks, calls, form sends and calculator uses count as goals.

## Design and build

The site keeps the look you already approved and moves to page templates, so 50 pages now and 200 later stay consistent and fast.

- **Look:** the Charge-O logo, navy #0B2545 and green #13B26B, light theme, and the solar section on the homepage. The two animations you chose move to their own pages (Inside a DC charger on the DC chargers page, Your brand on the charger on the white-label page) so the homepage loads fast.
- **Images:** a real photo in the homepage hero, like Bolt.Earth and Gigforce use. Best is one of your own installs; a free stock photo can stand in until then. Elsewhere, clean illustrations in your navy and green (a charger, a cable run, an earthing pit, a canopy) until more site photos arrive; AI-made photos, like HM Enterprise EV's, look generic. CMS screenshots come from the demo console, shown in laptop and phone frames.
- **Tech:** Astro, a static-site builder. Every page is plain HTML and JavaScript loads only for calculators. Hosting stays on Cloudflare Pages, free.
- **Templates:** service, charger, audience, state guide, project, blog and CMS feature, so a new page means filling in content, not designing.
- **Speed budget:** under 1 MB per page, WebP images, at most two fonts, a PageSpeed mobile score of 90+.
- **Admin area:** a login at prolineelectricalworks.com/admin, so you and your staff can change the site without a developer. You can edit blog posts, FAQs, project stories, state guides, the charger and brand lists, the calculator's tariff table, the trust numbers, the offer strip, contact details, the CMS screenshots, Hindi posts, and every page's title, description and images. New pages come from templates (blog post, FAQ, project, state guide, charger), and Publish puts a change live within a few minutes.
  - **How it works:** the site's files sit in a GitHub account in your name, and a free editor (Sveltia CMS or Decap CMS) turns them into simple forms. Each person signs in with their own free GitHub login, and every change is saved, so a mistake can be undone.
  - **Still needs a developer:** new page layouts, new tools and design changes.

- **Legal pages:** privacy policy and terms, plus a disclaimer on every calculator.

## Roadmap

Google usually takes weeks to index new pages and months to rank them, so search leads build through phases 2 and 3; WhatsApp, your Google Business Profile and B2B outreach bring enquiries sooner.

## What I need from you

Ticked items are in. Building starts once you approve the plan; anything still missing stays off the site rather than going in as a placeholder, and goes in when it arrives.

- Phone and WhatsApp: +91 73038 87364
- Enquiry email: Sales@prolineelectricalworks.com
- Location: Delhi, no street address
- Figures: 2 years, 500+ chargers, 200+ technicians, North, South and West India
- Clients: TATA, ThunderPlus, Bolt.Earth, KIA
- Ten states for the first state guides
- Hours: calls 10 am to 7 pm, WhatsApp any time
- Logos: yours to use; "authorised partner" only where a brand has authorised you
- 3–5 project stories (site, charger, city, days taken); photos later
- 3–5 client quotes with name and company, with their permission
- Registrations to show: GST, Udyam, electrical contractor licence, ISO, insurance
- A free GitHub account for each person who will use the admin area, and the Google account that should own the enquiry sheet
- CMS screenshots from the demo console: 5 desktop and 6 phone, as listed on the CMS page drawing
- A public PDF of the CMS deck, without the commercial slide
- Which CMS features are live at launch (section 10 of your copy)

**Open questions**

1. Do you offer AMC and power approvals (DISCOM connection, EV meter, CEIG inspection)? If not, those two pages are dropped.
2. Which Tata company did you install for: Tata Power EZ Charge, Tata Motors, or both? The site should name it exactly.
3. Do you also run Proline CMS for customers on your own servers (hosted), or only the CPO Edition on the customer's server? The CMS pages should say which.
4. Do you approve this plan, so building can start?

### Sources

- [Bolt.Earth home](https://bolt.earth) and [franchise page](https://bolt.earth/franchise)
- [Gigforce home](https://gigforce.in) and [savings calculator](https://gigforce.in/calculator.html)
- [HM Enterprise EV](https://hmenterprisesev.com)
- [Proline's current site](https://proline-3da.pages.dev)
- [Statiq: EV charging cost in India](https://statiq.in/blog/2026/10/12/public-ev-charging-cost-india/), 12 Oct 2026
- [Lok Sabha unstarred question 3099](https://eparlib.sansad.in/bitstream/123456789/2994845/1/AU3099_jxi0H3.pdf), 7 Aug 2025
- [AIR News: PM E-DRIVE charging guidelines](https://www.newsonair.gov.in/centre-issues-guidelines-for-rollout-of-72300-ev-charging-stations-under-pm-e-drive/), 29 Sep 2025
- [Daily Pioneer: Delhi notifies EV Policy 2026](https://www.dailypioneer.com/news/slug-lite/delhi-notifies-ev-policy-2026-subsidies-within-60-days?year=2026), 2 Jul 2026
- [ChargeZone franchise page](https://www.chargezone.co.in/franchise)
- [SBI tender GEM/2026/B/8089461](https://sbi.bank.in/documents/39129/51516783/NOTICE+INVITING+TENDER20261003063932872.pdf), Oct 2026
- [Search Engine Journal: Google drops FAQ rich results](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/), 10 May 2026
- [EV Expo Delhi 2026](https://evexpo.in/), [EV India Expo 2027](https://evindiaexpo.in/), [Bharat Mobility Global Expo (Wikipedia)](https://en.wikipedia.org/wiki/Auto_Expo)
- [Google Business Profile guidelines](https://support.google.com/business/answer/3038177)
