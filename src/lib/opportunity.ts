// EV charging opportunity checker (owner, 15 Nov 2026): a first screen for a commercial charging site,
// from public data only. Every rule here is shown on the tool page ("How the rating works"),
// so the page and the score cannot drift apart.

export type StateRow = {
  state: string; ev25: number; ev26: number; per100: number | null; per100Text?: string;
  iemi: number; stations: number; fast: number; noGrowth?: string;
};

// State names differ between India Post, OpenStreetMap and the data sources.
const ALIASES: Record<string, string> = {
  chattisgarh: 'chhattisgarh', orissa: 'odisha', pondicherry: 'puducherry', uttaranchal: 'uttarakhand',
  nationalcapitalterritoryofdelhi: 'delhi', nctofdelhi: 'delhi', newdelhi: 'delhi', keralam: 'kerala',
  dadraandnagarhaveli: 'dadraandnagarhavelianddamananddiu', damananddiu: 'dadraandnagarhavelianddamananddiu',
  andamanandnicobar: 'andamanandnicobarislands', jammukashmir: 'jammuandkashmir',
};
export const normState = (s: string) => {
  const k = s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '');
  return ALIASES[k] ?? k;
};
export const findState = (rows: StateRow[], name?: string | null) =>
  name ? rows.find((r) => normState(r.state) === normState(name)) : undefined;

// Growth is shown only when the same months of 2025 had at least 500 EVs (the compiler's own rule).
export const MIN_BASE = 500;
export const growthPct = (r?: StateRow): number | null =>
  !r || r.noGrowth || r.ev25 < MIN_BASE ? null : Math.round((r.ev26 / r.ev25 - 1) * 100);

// Places that bring vehicles, counted within 2 km of the location in OpenStreetMap.
export type PoiKey = 'fuel' | 'retail' | 'hotels' | 'food' | 'hospitals' | 'colleges' | 'transit' | 'offices' | 'parking';
export const POIS: { key: PoiKey; label: string; weight: number; cap: number; query: string }[] = [
  { key: 'fuel', label: 'Fuel stations', weight: 2, cap: 15, query: 'nwr["amenity"="fuel"]' },
  { key: 'retail', label: 'Malls and supermarkets', weight: 3, cap: 20, query: 'nwr["shop"~"^(mall|supermarket|department_store)$"]' },
  { key: 'hotels', label: 'Hotels and guest houses', weight: 2, cap: 30, query: 'nwr["tourism"~"^(hotel|motel|guest_house)$"]' },
  { key: 'food', label: 'Restaurants and cafés', weight: 1, cap: 80, query: 'nwr["amenity"~"^(restaurant|cafe|fast_food|food_court)$"]' },
  { key: 'hospitals', label: 'Hospitals', weight: 3, cap: 10, query: 'nwr["amenity"="hospital"]' },
  { key: 'colleges', label: 'Colleges and universities', weight: 2, cap: 10, query: 'nwr["amenity"~"^(college|university)$"]' },
  { key: 'transit', label: 'Railway, metro and bus stations', weight: 3, cap: 10, query: '' }, // union, built below
  { key: 'offices', label: 'Offices', weight: 1, cap: 60, query: 'nwr["office"]' },
  { key: 'parking', label: 'Public car parks', weight: 1, cap: 30, query: 'nwr["amenity"="parking"]' },
];
export const ROADS = { highway: { label: 'National highway or expressway within 1 km', bonus: 25 }, main: { label: 'Main road within 500 m', bonus: 10 } };
export const RADIUS = { pois: 2000, chargers: 5000, gap: 3000, highway: 1000, main: 500 };

export type Poi = Record<PoiKey, number> & { highway: boolean; main: boolean };

export const footfallIndex = (p: Poi) =>
  POIS.reduce((s, x) => s + x.weight * Math.min(p[x.key] || 0, x.cap), 0) + (p.highway ? ROADS.highway.bonus : 0) + (p.main ? ROADS.main.bonus : 0);

// Bands: [threshold, points]. "min" bands give the points when the value is at least the threshold;
// "max" bands when it is at most the threshold. First match wins.
type Band = [number, number];
export const FACTORS = {
  footfall: { label: 'Busy places nearby', max: 40, kind: 'min' as const, unit: 'footfall index',
    bands: [[200, 40], [120, 34], [60, 27], [25, 19], [8, 11], [0, 4]] as Band[] },
  gap: { label: 'Room for a new charger', max: 20, kind: 'max' as const, unit: 'public chargers within 3 km',
    bands: [[0, 20], [2, 15], [5, 10], [10, 6], [Infinity, 3]] as Band[] },
  growth: { label: 'EV growth in your state', max: 20, kind: 'min' as const, unit: '% more EVs registered', missing: 10,
    bands: [[75, 20], [50, 17], [35, 14], [20, 11], [5, 7], [-Infinity, 4]] as Band[] },
  share: { label: 'EVs among new vehicles in your state', max: 20, kind: 'min' as const, unit: 'EVs per 100 new vehicles', missing: 3,
    bands: [[14, 20], [12, 17], [10, 14], [7, 10], [4, 6], [-Infinity, 3]] as Band[] },
};
export type FactorKey = keyof typeof FACTORS;
export const RATINGS: { min: number; label: 'High' | 'Medium' | 'Low' }[] = [{ min: 70, label: 'High' }, { min: 50, label: 'Medium' }, { min: 0, label: 'Low' }];

const band = (f: (typeof FACTORS)[FactorKey], v: number) =>
  (f.bands.find(([t]) => (f.kind === 'min' ? v >= t : v <= t)) ?? f.bands[f.bands.length - 1])[1];

export type Scored = { key: FactorKey; label: string; pts: number | null; max: number };
export function score(i: { poi: Poi | null; chargersNear: number | null; growth: number | null; per100: number | null; stateKnown: boolean }) {
  const parts: Scored[] = [
    { key: 'footfall', label: FACTORS.footfall.label, max: 40, pts: i.poi ? band(FACTORS.footfall, footfallIndex(i.poi)) : null },
    { key: 'gap', label: FACTORS.gap.label, max: 20, pts: i.chargersNear == null ? null : band(FACTORS.gap, i.chargersNear) },
    { key: 'growth', label: FACTORS.growth.label, max: 20, pts: !i.stateKnown ? null : i.growth == null ? FACTORS.growth.missing : band(FACTORS.growth, i.growth) },
    { key: 'share', label: FACTORS.share.label, max: 20, pts: !i.stateKnown ? null : i.per100 == null ? FACTORS.share.missing : band(FACTORS.share, i.per100) },
  ];
  const complete = parts.every((p) => p.pts != null);
  const total = parts.reduce((s, p) => s + (p.pts ?? 0), 0);
  const rating = complete ? RATINGS.find((r) => total >= r.min)!.label : null;
  return { parts, total, complete, rating };
}

// One Overpass request: chargers within 5 km (with tags, to list them), then a count for each kind of place.
export function overpassQuery(lat: number, lon: number) {
  const at = (r: number) => `(around:${r},${lat.toFixed(5)},${lon.toFixed(5)})`;
  const p = at(RADIUS.pois);
  const lines = [
    '[out:json][timeout:25];',
    `nwr["amenity"="charging_station"]${at(RADIUS.chargers)};out center tags;`,
    ...POIS.map((x) => x.key === 'transit'
      ? `(nwr["railway"="station"]${p};nwr["station"="subway"]${p};nwr["amenity"="bus_station"]${p};);out count;`
      : `${x.query}${p};out count;`),
    `way["highway"~"^(motorway|trunk)$"]${at(RADIUS.highway)};out count;`,
    `way["highway"="primary"]${at(RADIUS.main)};out count;`,
  ];
  return lines.join('\n');
}

export type Charger = { name: string; operator: string; km: number; dc: boolean; ac: boolean };
type OsmEl = { type: string; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

export function parseOverpass(json: { elements: OsmEl[] }, lat: number, lon: number) {
  const els = json.elements || [];
  const counts = els.filter((e) => e.type === 'count').map((e) => Number(e.tags?.total ?? 0));
  if (counts.length !== POIS.length + 2) throw new Error('Unexpected Overpass answer');
  const poi = Object.fromEntries(POIS.map((x, i) => [x.key, counts[i]])) as Poi;
  poi.highway = counts[POIS.length] > 0;
  poi.main = counts[POIS.length + 1] > 0;
  const chargers: Charger[] = els.filter((e) => e.type !== 'count').map((e) => {
    const t = e.tags || {};
    const la = e.lat ?? e.center?.lat ?? lat, lo = e.lon ?? e.center?.lon ?? lon;
    const keys = Object.keys(t);
    return {
      name: t.name || t.brand || t.operator || t.network || 'Charging point',
      operator: t.operator || t.network || t.brand || '',
      km: km(lat, lon, la, lo),
      dc: keys.some((k) => /^socket:(type2_combo|chademo|gb_t|ccs)/.test(k)),
      ac: keys.some((k) => /^socket:(type2|type1|type2_cable|iec_60309|bs1363|indian)/.test(k) && !/type2_combo/.test(k)),
    };
  }).sort((a, b) => a.km - b.km);
  return { poi, chargers };
}

export function km(a: number, b: number, c: number, d: number) {
  const R = 6371, r = Math.PI / 180;
  const x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
