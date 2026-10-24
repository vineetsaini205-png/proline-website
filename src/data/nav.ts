// Main menu, footer and "related" link titles all come from here.
export type NavLink = { label: string; href: string; note?: string };
export type NavGroup = { label: string; href?: string; highlight?: boolean; items?: NavLink[] };

export const services: NavLink[] = [
  { label: 'EV charger installation', href: '/services/ev-charger-installation/', note: 'Any charger, any brand, across India' },
  { label: 'Home EV charger installation', href: '/services/home-ev-charger-installation/', note: 'Wall box fitted safely at home' },
  { label: 'DC fast charger installation', href: '/services/dc-fast-charger-installation/', note: '30–240 kW, power to plug' },
  { label: 'Charging station setup', href: '/services/ev-charging-station-setup/', note: 'Survey to go-live, turnkey' },
  { label: 'Site survey', href: '/services/site-survey/', note: 'What your site needs, before you buy' },
  { label: 'Commissioning and testing', href: '/services/ev-charger-commissioning/', note: 'Tests, OCPP setup, handover pack' },
  { label: 'Earthing', href: '/services/ev-charger-earthing/', note: 'Pipe or chemical earthing, tested' },
  { label: 'Cabling and wiring', href: '/services/ev-charger-cabling/', note: 'Sized, routed and trenched' },
  { label: 'DB boxes', href: '/services/ev-charger-db-box/', note: 'MCB, RCBO and surge protection' },
  { label: 'Civil work', href: '/services/ev-charging-civil-work/', note: 'Foundations and canopies' },
  { label: 'Solar installation', href: '/services/solar-installation/', note: 'Rooftop and carport solar' },
];

export const cms: NavLink[] = [
  { label: 'Proline CMS overview', href: '/cms/', note: 'Every charger, one console' },
  { label: 'Features', href: '/cms/features/', note: 'What the console does' },
  { label: 'Built for India', href: '/cms/built-for-india/', note: 'UPI, GST documents, Indian rules' },
  { label: 'Your server, your brand', href: '/cms/white-label-self-hosted/', note: 'Self-hosted and white-label' },
  { label: 'Book a demo', href: '/cms/demo/', note: 'See it working' },
];

export const products: NavLink[] = [
  { label: 'AC and home chargers', href: '/chargers/ac-chargers/', note: '3.3–22 kW' },
  { label: 'DC fast chargers', href: '/chargers/dc-fast-chargers/', note: '30–240 kW, CCS2' },
  { label: '2W and 3W chargers', href: '/chargers/2w-3w-chargers/', note: 'Scooters, e-rickshaws, autos' },
  { label: 'Bus and truck chargers', href: '/chargers/bus-truck-chargers/', note: 'High-power depot charging' },
  { label: 'White-label chargers', href: '/chargers/white-label-chargers/', note: 'Your brand on the charger' },
  { label: 'Batteries', href: '/batteries/', note: '2W, e-rickshaw, inverter, BESS' },
  { label: 'Solar + EV charging', href: '/solar-ev-charging/', note: 'Charge from the sun' },
];

export const audiences: NavLink[] = [
  { label: 'Charge point operators', href: '/for/charge-point-operators/', note: 'Crews for many cities' },
  { label: 'Charger brands', href: '/for/charger-brands/', note: 'Installers for every unit you sell' },
  { label: 'EV makers and dealers', href: '/for/ev-makers-and-dealers/', note: 'Showrooms and home deliveries' },
  { label: 'Businesses', href: '/for/businesses/', note: 'Hotels, malls, offices, fuel stations' },
  { label: 'Housing societies', href: '/for/housing-societies/', note: 'Shared chargers, fair billing' },
  { label: 'Fleets', href: '/for/fleets/', note: 'Depots, e-buses, e-rickshaw hubs' },
  { label: 'Government and PSUs', href: '/for/government-and-psu/', note: 'SITC tenders' },
  { label: 'Home owners', href: '/services/home-ev-charger-installation/', note: 'A charger at home' },
  { label: 'Investors and landowners', href: '/start-an-ev-charging-station/', note: 'Start a charging station' },
];

export const batteries: NavLink[] = [
  { label: '2-wheeler batteries', href: '/batteries/2-wheeler-batteries/', note: 'Lithium packs for e-scooters' },
  { label: 'E-rickshaw batteries', href: '/batteries/e-rickshaw-batteries/', note: 'Lithium for e-rickshaws and 3W' },
  { label: 'Inverter and solar batteries', href: '/batteries/inverter-solar-batteries/', note: 'Backup and solar storage' },
  { label: 'BESS for charging stations', href: '/batteries/bess-for-ev-charging/', note: 'Storage for stations' },
];

export const hubs: NavLink[] = [
  { label: 'All services', href: '/services/', note: 'Everything from survey to handover' },
  { label: 'Chargers', href: '/chargers/', note: 'Any brand, brand-neutral advice' },
  { label: 'Who we serve', href: '/for/', note: 'Pages for each kind of buyer' },
  { label: 'Tools', href: '/tools/', note: 'Calculators and checklists' },
];

export const tools: NavLink[] = [
  { label: 'Earnings calculator', href: '/tools/ev-charging-station-earnings-calculator/', note: 'What a station could earn' },
  { label: 'EV vs petrol savings', href: '/tools/ev-vs-petrol-savings-calculator/', note: 'Your running-cost savings' },
  { label: 'Charger finder', href: '/tools/charger-finder/', note: 'Which charger fits your need' },
  { label: 'Installation checklist', href: '/tools/installation-checklist/', note: 'What your installation needs' },
];

export const resources: NavLink[] = [
  { label: 'Start a charging station', href: '/start-an-ev-charging-station/', note: 'The investor’s guide' },
  { label: 'Blog', href: '/blog/', note: 'Guides and updates' },
  { label: 'FAQ', href: '/faq/', note: 'Answers by buyer' },
  { label: 'Ask an expert', href: '/ask/', note: 'Send us your question' },
  { label: 'Coverage', href: '/coverage/', note: 'States we work in' },
  { label: 'Brands we work with', href: '/brands/', note: 'Clients and charger brands' },
];

export const company: NavLink[] = [
  { label: 'About Proline', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
  { label: 'Partner with us', href: '/partner-with-us/' },
  { label: 'Sell your chargers through Proline', href: '/brand-partners/' },
  { label: 'Join as a technician', href: '/join-as-technician/' },
  { label: 'Privacy policy', href: '/privacy-policy/' },
  { label: 'Terms', href: '/terms/' },
];

export const mainNav: NavGroup[] = [
  { label: 'Services', href: '/services/', items: services },
  { label: 'Proline CMS', href: '/cms/', highlight: true },
  { label: 'Chargers', href: '/chargers/', items: products },
  { label: 'Who we serve', href: '/for/', items: audiences },
  { label: 'Tools', href: '/tools/' },
  { label: 'Resources', items: resources },
];

export const allLinks: NavLink[] = [...services, ...cms, ...products, ...batteries, ...audiences, ...tools, ...resources, ...company, ...hubs];

/** Title + note for any internal page, used by "Related" cards. */
export function linkInfo(href: string): NavLink | undefined {
  return allLinks.find((l) => l.href === href);
}
