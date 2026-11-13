// Main menu, footer and "related" link titles all come from here.
export type NavLink = { label: string; href: string; note?: string };
export type NavGroup = { label: string; href?: string; allLabel?: string; highlight?: boolean; items?: NavLink[] };

export const services: NavLink[] = [
  { label: 'EV charger installation', href: '/services/ev-charger-installation/', note: 'Any charger, any brand, across India' },
  { label: 'Home EV charger installation', href: '/services/home-ev-charger-installation/', note: 'Wall box fitted safely at home' },
  { label: 'DC fast charger installation', href: '/services/dc-fast-charger-installation/', note: '30–240 kW, power to plug' },
  { label: 'Site survey', href: '/services/site-survey/', note: 'What your site needs, before you buy' },
  { label: 'Commissioning and testing', href: '/services/ev-charger-commissioning/', note: 'Tests, OCPP setup, handover pack' },
  { label: 'AMC and maintenance', href: '/services/ev-charger-amc/', note: 'Planned visits, tests and reports' },
  { label: 'Earthing', href: '/services/ev-charger-earthing/', note: 'Pipe or chemical earthing, tested' },
  { label: 'Cabling and wiring', href: '/services/ev-charger-cabling/', note: 'Sized, routed and trenched' },
  { label: 'DB boxes', href: '/services/ev-charger-db-box/', note: 'MCB, RCBO and surge protection' },
  { label: 'Civil work', href: '/services/ev-charging-civil-work/', note: 'Foundations and canopies' },
  { label: 'Solar installation', href: '/services/solar-installation/', note: 'Rooftop and carport solar' },
];

export const cms: NavLink[] = [
  { label: 'Proline CMS overview', href: '/cms/', note: 'Run chargers of many brands in your own brand' },
  { label: 'What it costs', href: '/cms/affordable-ev-charging-software/', note: 'No commission on charging payments' },
  { label: 'Request a demo', href: '/cms/demo/', note: 'See it working' },
];

// "Choose a charger" menu (strategy plan, 13 Nov 2026): personal charging, AC, 2W/3W, car guides, brands.
export const products: NavLink[] = [
  { label: 'Help me choose', href: '/chargers/#help-me-choose', note: 'Your vehicle, parking and supply' },
  { label: 'Chargers for your car', href: '/chargers/for/', note: 'Nexon.ev, Punch.ev, Windsor, BE 6, Creta Electric' },
  { label: 'AC and home chargers', href: '/chargers/ac-chargers/', note: '3.3–22 kW' },
  { label: '2W and 3W chargers', href: '/chargers/2w-3w-chargers/', note: 'Scooters, e-rickshaws, autos' },
  { label: 'DC fast chargers', href: '/chargers/dc-fast-chargers/', note: '30–240 kW, CCS2' },
  { label: 'Charger brands we compare', href: '/brands/', note: 'How we choose between brands' },
];

// Background product pages: kept and linked from the footer and their parent pages, not promoted (plan section 3).
export const moreProducts: NavLink[] = [
  { label: 'White-label chargers', href: '/chargers/white-label-chargers/', note: 'Your brand on the charger' },
  { label: 'Batteries', href: '/batteries/', note: '2W, e-rickshaw, inverter, BESS' },
  { label: 'Solar + EV charging', href: '/solar-ev-charging/', note: 'Charge from the sun' },
];

// One page per popular car model (owner, 13 Nov): which home charger suits it and how we install it.
export const cars: NavLink[] = [
  { label: 'Tata Nexon.ev charger', href: '/chargers/for/tata-nexon-ev/', note: '7.2–7.4 kW wall box' },
  { label: 'Tata Punch.ev charger', href: '/chargers/for/tata-punch-ev/', note: '3.3 or 7.2 kW at home' },
  { label: 'MG Windsor charger', href: '/chargers/for/mg-windsor-ev/', note: '7.4 kW wall box' },
  { label: 'Mahindra BE 6 charger', href: '/chargers/for/mahindra-be-6/', note: '7.2 or 11.2 kW wall box' },
  { label: 'Hyundai Creta Electric charger', href: '/chargers/for/hyundai-creta-electric/', note: '7.4 or 11 kW wall box' },
];

export const audiences: NavLink[] = [
  { label: 'Charger brands', href: '/for/charger-brands/', note: 'Installation partnership and supply' },
  { label: 'EV makers and dealers', href: '/for/ev-makers-and-dealers/', note: 'Showrooms and home deliveries' },
  { label: 'Businesses', href: '/for/businesses/', note: 'Hotels, malls, offices, fuel stations' },
  { label: 'Housing societies', href: '/for/housing-societies/', note: 'Shared chargers, fair billing' },
  { label: 'Fleets', href: '/for/fleets/', note: 'Depots, e-buses, trucks, e-rickshaw hubs' },
  { label: 'Government and PSUs', href: '/for/government-and-psu/', note: 'SITC tenders' },
  { label: 'Home owners', href: '/services/home-ev-charger-installation/', note: 'A charger at home' },
  { label: 'Investors and landowners', href: '/start-an-ev-charging-station/', note: 'Plan a charging station' },
];

export const batteries: NavLink[] = [
  { label: '2-wheeler batteries', href: '/batteries/2-wheeler-batteries/', note: 'Lithium packs for e-scooters' },
  { label: 'E-rickshaw batteries', href: '/batteries/e-rickshaw-batteries/', note: 'Lithium for e-rickshaws and 3W' },
  { label: 'Inverter and solar batteries', href: '/batteries/inverter-solar-batteries/', note: 'Backup and solar storage' },
  { label: 'BESS for charging stations', href: '/batteries/bess-for-ev-charging/', note: 'Storage for stations' },
];

export const hubs: NavLink[] = [
  { label: 'Installation', href: '/services/ev-charger-installation/', note: 'Survey to commissioning' },
  { label: 'Choose a charger', href: '/chargers/', note: 'Brand comparison and advice' },
  { label: 'Who we work with', href: '/for/', note: 'Pages for each kind of buyer' },
  { label: 'Our work', href: '/projects/', note: 'Real jobs and photos' },
];

export const tools: NavLink[] = [
  { label: 'Earnings calculator', href: '/tools/ev-charging-station-earnings-calculator/', note: 'Revenue, costs and payback' },
  { label: 'EV vs petrol savings', href: '/tools/ev-vs-petrol-savings-calculator/', note: 'Your running-cost savings' },
  { label: 'Installation checklist', href: '/tools/installation-checklist/', note: 'What your installation needs' },
];

export const resources: NavLink[] = [
  { label: 'Plan a charging station', href: '/start-an-ev-charging-station/', note: 'Site, costs and usage' },
  { label: 'Blog', href: '/blog/', note: 'Guides and updates' },
  { label: 'FAQ', href: '/faq/', note: 'Answers by buyer' },
  { label: 'Coverage', href: '/coverage/', note: 'States we work in' },
  { label: 'Charger brands we compare', href: '/brands/', note: 'Clients and charger brands' },
];

export const company: NavLink[] = [
  { label: 'Our work', href: '/projects/' },
  { label: 'About Proline', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
  { label: 'Join as a technician', href: '/join-as-technician/' },
  { label: 'Privacy policy', href: '/privacy-policy/' },
  { label: 'Terms', href: '/terms/' },
];

// "Commercial charging" menu: stations, DC, fleets, societies, businesses, earnings.
export const commercial: NavLink[] = [
  { label: 'Plan a charging station', href: '/start-an-ev-charging-station/', note: 'Site, chargers, costs, survey to go-live' },
  { label: 'DC fast chargers', href: '/chargers/dc-fast-chargers/', note: '30–240 kW, CCS2' },
  { label: 'Fleets', href: '/for/fleets/', note: 'Depots, e-buses, trucks, e-rickshaws' },
  { label: 'Housing societies', href: '/for/housing-societies/', note: 'Shared or private chargers' },
  { label: 'Businesses', href: '/for/businesses/', note: 'Hotels, malls, offices, fuel stations' },
  { label: 'Earnings calculator', href: '/tools/ev-charging-station-earnings-calculator/', note: 'Revenue, costs and payback' },
];

// "Installation" menu.
export const installation: NavLink[] = [
  { label: 'EV charger installation', href: '/services/ev-charger-installation/', note: 'What we do on site, across India' },
  { label: 'Home EV charger installation', href: '/services/home-ev-charger-installation/', note: 'Including chargers you already own' },
  { label: 'DC fast charger installation', href: '/services/dc-fast-charger-installation/', note: '30–240 kW, power to plug' },
  { label: 'Site survey', href: '/services/site-survey/', note: 'Before you buy or build' },
  { label: 'Installation checklist', href: '/tools/installation-checklist/', note: 'What to send us' },
  { label: 'Coverage', href: '/coverage/', note: 'Where we work' },
];

// "For charger brands" menu.
export const forBrands: NavLink[] = [
  { label: 'Installation partner for brands', href: '/for/charger-brands/', note: 'Your customers’ chargers, installed to your manual' },
  { label: 'EV makers and dealers', href: '/for/ev-makers-and-dealers/', note: 'Home installs for your buyers' },
];

// "Our work" menu.
export const ourWork: NavLink[] = [
  { label: 'Our work', href: '/projects/', note: 'Real jobs and photos' },
  { label: 'About Proline', href: '/about/', note: 'Who we are and how we work' },
  { label: 'Coverage', href: '/coverage/', note: 'States we work in' },
  { label: 'Contact', href: '/contact/', note: 'Call, WhatsApp or write to us' },
];

export const mainNav: NavGroup[] = [
  { label: 'Choose a charger', href: '/chargers/', allLabel: 'Choose a charger', items: products },
  { label: 'Commercial charging', href: '/start-an-ev-charging-station/', allLabel: 'Plan a charging station', items: commercial },
  { label: 'Installation', href: '/services/ev-charger-installation/', allLabel: 'EV charger installation', items: installation },
  { label: 'For charger brands', href: '/for/charger-brands/', allLabel: 'Installation partnership', items: forBrands },
  { label: 'Proline CMS', href: '/cms/', allLabel: 'Proline CMS', items: cms },
  { label: 'Our work', href: '/projects/', allLabel: 'Our work', items: ourWork },
];

export const allLinks: NavLink[] = [...services, ...cms, ...products, ...moreProducts, ...cars, ...batteries, ...audiences, ...tools, ...resources, ...company, ...hubs, ...commercial, ...installation, ...forBrands, ...ourWork];

/** Title + note for any internal page, used by "Related" cards. */
export function linkInfo(href: string): NavLink | undefined {
  return allLinks.find((l) => l.href === href);
}
