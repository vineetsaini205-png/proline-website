// Charger finder rules. Plain, explainable rules of thumb; the survey confirms.
export type Vehicle = '2w' | '3w' | 'car' | 'bus';
export type Place = 'home' | 'society' | 'business' | 'public' | 'depot';
export type Stay = 'long' | 'medium' | 'short';
export type Supply = 'single' | 'three' | 'unknown';
export type Budget = 'basic' | 'mid' | 'premium';

export interface FinderInput { vehicles: Vehicle[]; place: Place; stay: Stay; supply: Supply; loadKw?: number | null; budget: Budget; count?: number }
export interface Pick { title: string; power: string; connector: string; why: string; kind: 'ac' | 'dc' | 'lev' }
export interface FinderResult { picks: Pick[]; features: string[]; install: string[]; notes: string[] }

const FEATURES: Record<Budget, string[]> = {
  basic: ['Plug-and-charge or RFID start', 'Built-in protection the maker certifies', 'Simple status lights', 'Warranty with a service contact in your city'],
  mid: ['App with Wi-Fi or 4G: schedule, see sessions and energy', 'RFID cards for staff or residents', 'Energy meter in the charger', 'Weather-sealed body for outdoor use'],
  premium: ['OCPP 1.6J, so a CMS such as Proline CMS can run and bill it', 'Load management across several chargers', 'Display, RFID and QR payment ready', 'Remote diagnostics and firmware updates'],
};

export function findCharger(i: FinderInput): FinderResult {
  const picks: Pick[] = [];
  const notes: string[] = [];
  const install: string[] = [];
  const v = new Set(i.vehicles.length ? i.vehicles : ['car']);
  const single = i.supply === 'single';

  if (v.has('bus')) {
    picks.push({ kind: 'dc', title: 'High-power DC charger', power: '120–240 kW, often two or more guns', connector: 'CCS2', why: 'Buses and trucks carry large batteries; depot charging overnight or between shifts needs high-power DC with load management across chargers.' });
    notes.push('High-power DC usually needs a large three-phase commercial or HT connection, sometimes with its own transformer. The survey checks what your site can take.');
  }
  if (v.has('car')) {
    if (i.place === 'public' || i.stay === 'short') {
      picks.push({ kind: 'dc', title: 'DC fast charger', power: i.place === 'public' && i.budget === 'premium' ? '120 kW, two guns' : '60 kW (30 kW where load is limited)', connector: 'CCS2', why: 'Drivers stop for under an hour, so they need DC fast charging. 60 kW adds a useful charge to most cars in 30–45 minutes.' });
      notes.push('DC chargers need a three-phase commercial connection with enough sanctioned load. A 60 kW charger draws roughly 90–100 A per phase.');
    } else if (i.place === 'depot') {
      picks.push({ kind: 'ac', title: 'AC chargers for overnight, plus one DC for top-ups', power: '7.4–11 kW AC per vehicle; 30–60 kW DC shared', connector: 'Type 2 (AC), CCS2 (DC)', why: 'Fleet cars parked overnight charge fully on AC; a shared DC charger handles quick top-ups between shifts.' });
    } else {
      const kw = single ? (i.loadKw != null && i.loadKw < 6 ? '3.3 kW' : '7.4 kW') : '7.4 kW (11 kW if your car accepts it)';
      picks.push({ kind: 'ac', title: i.place === 'home' ? 'AC wall box' : 'AC chargers', power: kw, connector: 'Type 2', why: i.stay === 'long' ? 'Cars parked for hours or overnight charge fully on AC. Most cars in India accept up to 7.2 kW on AC, some 11 kW.' : 'Cars parked for a few hours get a good top-up from 7.4 kW AC; 22 kW helps only cars that accept it.' });
      if (i.place === 'society') notes.push('Shared chargers in a society need the RWA’s permission and a fair way to bill residents: a sub-meter per charger, RFID cards, or OCPP chargers run on a CMS with members’ prices.');
      if (i.place === 'business' && i.stay === 'medium') picks.push({ kind: 'ac', title: 'Option: 22 kW AC', power: '22 kW, three phase', connector: 'Type 2', why: 'Useful where many cars that accept 11–22 kW visit for 1–3 hours, such as malls and hotels.' });
    }
  }
  if (v.has('3w')) picks.push({ kind: 'lev', title: 'E-rickshaw and 3-wheeler charging', power: 'Off-board battery chargers (48/60 V) on 16 A socket points; DC Type 7 for 3Ws that support it', connector: '16 A sockets, Type 7 (LECCS)', why: 'Most e-rickshaws charge their packs from a portable charger on a socket; newer 3Ws can fast-charge on Type 7 DC.' });
  if (v.has('2w')) picks.push({ kind: 'lev', title: 'Two-wheeler charging points', power: '3.3 kW AC socket points; Type 6 AC or Type 7 DC where scooters support them', connector: '16 A sockets, Type 6, Type 7', why: 'Most e-scooters use a portable charger on a 16 A socket; some models also accept Type 6 or Type 7 charging.' });

  if (single && picks.some((p) => p.kind === 'dc')) notes.push('You chose a single-phase supply: DC charging needs a three-phase connection, so a new connection or load increase comes first.');
  if (single && !v.has('bus') && i.place !== 'home') notes.push('Three-phase supply opens up 11–22 kW AC and spreads the load better across many chargers.');
  if (i.loadKw != null && i.loadKw > 0) {
    const need = picks.some((p) => p.kind === 'dc') ? 35 : 8;
    if (i.loadKw < need) notes.push(`Your sanctioned load of ${i.loadKw} kW looks low for this. Expect to need a load increase; the survey checks your actual spare capacity.`);
  }
  if (i.supply === 'unknown') notes.push('Not sure of your supply? It is printed on your electricity bill (sanctioned load and phase), or send us a photo of the meter.');

  install.push('A dedicated circuit from your meter or panel, with cable sized for the charger');
  install.push('A DB box with the right MCB, RCD or RCBO and surge protection');
  install.push('A dedicated, tested earth pit');
  if (picks.some((p) => p.kind === 'dc') || i.place === 'public' || i.place === 'depot') install.push('Civil work: charger foundations, cable trench, bollards and possibly a canopy');
  if (i.place === 'society') install.push('Society NOC and a cable route through common areas or the basement');

  return { picks, features: FEATURES[i.budget], install, notes };
}
