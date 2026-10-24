// Structured data (schema.org JSON-LD). Facts only: Delhi as locality, no street address,
// no prices, no ratings. Call hours are in the page text; days are not stated, so no openingHours here.
import site from '../data/site.json';
import { plainText } from './text';

export const ORG_ID = `${site.url}/#organization`;
export const SITE_ID = `${site.url}/#website`;

export const abs = (path: string) => (path.startsWith('http') ? path : `${site.url}${path}`);

export function orgNode() {
  return {
    '@type': ['Organization', 'Electrician'],
    '@id': ORG_ID,
    name: site.name,
    alternateName: site.alternateNames,
    url: `${site.url}/`,
    logo: { '@type': 'ImageObject', url: abs('/images/logo-512.png'), width: 512, height: 512 },
    image: abs('/images/og-default.jpg'),
    description: 'Pan-India EV charger installation and commissioning: AC and DC chargers, DB boxes, earthing, cabling, civil work and solar, for charge point operators, charger brands, EV makers, businesses and homes. Maker of Proline CMS.',
    telephone: site.phoneE164,
    email: site.email,
    address: { '@type': 'PostalAddress', addressLocality: 'Delhi', addressRegion: 'Delhi', addressCountry: 'IN' },
    areaServed: [{ '@type': 'Country', name: 'India' }, ...site.regions.flatMap((r) => r.states).map((s) => ({ '@type': 'State', name: s }))],
    contactPoint: [
      { '@type': 'ContactPoint', contactType: 'sales', telephone: site.phoneE164, email: site.email, areaServed: 'IN', availableLanguage: ['en', 'hi'] },
    ],
    knowsAbout: ['EV charger installation', 'EV charger commissioning', 'DC fast charger installation', 'EV charging station setup', 'Earthing', 'Electrical cabling', 'Solar installation', 'Charge management software', 'OCPP'],
    slogan: 'Brand-neutral EV charging partner',
    ...(Object.values(site.social as Record<string, string>).filter(Boolean).length ? { sameAs: Object.values(site.social as Record<string, string>).filter(Boolean) } : {}),
  };
}

export function websiteNode() {
  return { '@type': 'WebSite', '@id': SITE_ID, url: `${site.url}/`, name: site.name, alternateName: ['Proline', 'Proline EV'], publisher: { '@id': ORG_ID }, inLanguage: 'en-IN' };
}

export function webPageNode(path: string, title: string, description: string, crumbsId?: string) {
  return {
    '@type': 'WebPage', '@id': `${abs(path)}#webpage`, url: abs(path), name: title, description,
    isPartOf: { '@id': SITE_ID }, about: { '@id': ORG_ID }, inLanguage: 'en-IN',
    ...(crumbsId ? { breadcrumb: { '@id': crumbsId } } : {}),
  };
}

export function breadcrumbNode(path: string, crumbs: { label: string; href?: string }[]) {
  const list = [{ label: 'Home', href: '/' }, ...crumbs];
  return {
    '@type': 'BreadcrumbList', '@id': `${abs(path)}#breadcrumb`,
    itemListElement: list.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: abs(c.href ?? path) })),
  };
}

export function serviceNode(path: string, name: string, description: string, serviceType: string) {
  return {
    '@type': 'Service', '@id': `${abs(path)}#service`, name, description, serviceType,
    provider: { '@id': ORG_ID }, areaServed: { '@type': 'Country', name: 'India' }, url: abs(path),
  };
}

export function faqNode(path: string, faqs: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage', '@id': `${abs(path)}#faq`,
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: plainText(f.a) } })),
  };
}

export function articleNode(path: string, a: { title: string; description: string; date: Date; updated?: Date; image?: string; author?: string }) {
  return {
    '@type': 'BlogPosting', '@id': `${abs(path)}#article`, headline: a.title, description: a.description,
    datePublished: a.date.toISOString(), dateModified: (a.updated ?? a.date).toISOString(),
    author: { '@type': 'Person', name: a.author ?? 'Vineet Saini', worksFor: { '@id': ORG_ID } },
    publisher: { '@id': ORG_ID }, mainEntityOfPage: { '@id': `${abs(path)}#webpage` },
    image: a.image ? abs(a.image) : abs('/images/og-default.jpg'), inLanguage: 'en-IN',
  };
}

export function softwareNode(path: string) {
  return {
    '@type': 'SoftwareApplication', '@id': `${site.url}/cms/#software`, name: 'Proline CMS',
    applicationCategory: 'BusinessApplication', applicationSubCategory: 'EV charging management software',
    operatingSystem: 'Web browser (console, driver pages and an installable technician web app)',
    description: 'Charge management system built in India for EV charge point operators: chargers of any brand over OCPP 1.6J, QR and UPI payments with automatic refunds, GST documents and daily reconciliation, on your own server in your brand.',
    publisher: { '@id': ORG_ID }, url: abs(path),
  };
}

export function toolNode(path: string, name: string, description: string) {
  return {
    '@type': 'WebApplication', '@id': `${abs(path)}#tool`, name, description, url: abs(path),
    applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any web browser', isAccessibleForFree: true,
    publisher: { '@id': ORG_ID },
  };
}
