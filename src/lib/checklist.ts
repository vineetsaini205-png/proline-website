// Installation checklist rules: what a charger installation is likely to need.
// Cable sizes are typical starting points for short runs; the survey confirms the final size.

export interface ChargerSpec { id: string; label: string; kind: 'ac' | 'dc'; phase: 1 | 3; amps: number; cable: string; cableLong: string; breaker: string }

export const SPECS: ChargerSpec[] = [
  { id: 'ac-3', label: '3.3 kW AC', kind: 'ac', phase: 1, amps: 16, cable: '2.5–4 sq mm copper', cableLong: '6 sq mm copper', breaker: 'a 20 A MCB (or as the maker asks)' },
  { id: 'ac-7', label: '7.4 kW AC', kind: 'ac', phase: 1, amps: 32, cable: '6 sq mm copper', cableLong: '10 sq mm copper', breaker: 'a 40 A MCB (or as the maker asks)' },
  { id: 'ac-11', label: '11 kW AC', kind: 'ac', phase: 3, amps: 16, cable: '4 sq mm copper, 5-core', cableLong: '6 sq mm copper, 5-core', breaker: 'a 20 A four-pole MCB' },
  { id: 'ac-22', label: '22 kW AC', kind: 'ac', phase: 3, amps: 32, cable: '6–10 sq mm copper, 5-core', cableLong: '16 sq mm copper, 5-core', breaker: 'a 40 A four-pole MCB' },
  { id: 'dc-30', label: '30 kW DC', kind: 'dc', phase: 3, amps: 50, cable: '16 sq mm copper or 25 sq mm aluminium, armoured', cableLong: '25 sq mm copper or 35 sq mm aluminium, armoured', breaker: 'a 63 A MCCB' },
  { id: 'dc-60', label: '60 kW DC', kind: 'dc', phase: 3, amps: 100, cable: '35 sq mm copper or 50–70 sq mm aluminium, armoured', cableLong: '50 sq mm copper or 95 sq mm aluminium, armoured', breaker: 'a 125 A MCCB' },
  { id: 'dc-120', label: '120 kW DC', kind: 'dc', phase: 3, amps: 200, cable: '95 sq mm copper or 150 sq mm aluminium, armoured', cableLong: '120 sq mm copper or 185 sq mm aluminium, armoured', breaker: 'a 250 A MCCB' },
  { id: 'dc-240', label: '240 kW DC', kind: 'dc', phase: 3, amps: 400, cable: '240 sq mm copper, or parallel runs as designed', cableLong: 'parallel runs, sized by design', breaker: 'a 400–500 A MCCB or ACB, as designed' },
];

export type Mount = 'wall' | 'pedestal';
export type Location = 'open' | 'covered' | 'public';
export type Earth = 'dedicated' | 'building' | 'unknown';
export type Db = 'spare' | 'new' | 'unknown';
export type SupplyKind = 'single' | 'three' | 'ht' | 'unknown';

export interface ChecklistInput { chargerId: string; distance: number; mount: Mount; location: Location; crossing: boolean; earth: Earth; db: Db; supply: SupplyKind; society: boolean }
export interface Section { title: string; items: string[] }

export function checklist(i: ChecklistInput): { sections: Section[]; flags: string[] } {
  const s = SPECS.find((x) => x.id === i.chargerId) ?? SPECS[1];
  const long = s.kind === 'ac' ? i.distance > 30 : i.distance > 50;
  const flags: string[] = [];
  const sections: Section[] = [];

  // Supply
  const supply: string[] = [];
  if (s.phase === 3 && i.supply === 'single') flags.push(`A ${s.label} charger needs three-phase supply. Your single-phase connection has to be upgraded first.`);
  if (s.kind === 'dc' && (i.supply === 'single' || i.supply === 'unknown')) supply.push('A three-phase commercial connection with enough sanctioned load for the charger');
  if (s.id === 'dc-120' || s.id === 'dc-240') supply.push('Check whether your state’s LT limit allows this load, or whether an HT connection with a transformer is needed');
  supply.push(`Spare capacity for about ${s.amps} A ${s.phase === 3 ? 'per phase' : 'on one phase'}, checked against your sanctioned load and what the building already uses`);
  if (s.kind === 'dc') supply.push('An EV tariff connection or meter for a public station, as your DISCOM allows');
  sections.push({ title: 'Electricity supply', items: supply });

  // Cable
  const cable = [`Cable for about ${i.distance} m: typically ${long ? s.cableLong : s.cable}${long ? ' (larger because of the long run and voltage drop)' : ''}`];
  if (i.location === 'covered') cable.push('Route in conduit or cable tray along the basement or parking ceiling, clear of vehicle height');
  if (i.location === 'open' || i.location === 'public' || i.crossing) cable.push('Armoured cable underground, in a trench with a protective pipe');
  if (i.crossing) cable.push('A road or driveway crossing: HDPE or GI pipe at proper depth, and making good the surface');
  if (i.distance > 60) cable.push('A long run: the survey checks whether a nearer supply point or a sub-panel is better');
  sections.push({ title: 'Cable and route', items: cable });

  // Protection
  const prot: string[] = [];
  if (s.kind === 'ac') {
    prot.push(`A ${i.db === 'spare' ? 'dedicated outgoing way in your existing DB, if it has room and the right rating' : 'new dedicated DB box for the charger'}, with ${s.breaker}`);
    prot.push('Residual-current protection the charger maker asks for: Type A RCD with 6 mA DC detection, or Type B (or an RCBO)');
  } else {
    prot.push(`An outgoing feeder in your LT panel with ${s.breaker}, metering and the protection the charger maker asks for`);
  }
  prot.push('A surge protection device (SPD)');
  if (i.society) prot.push('A sub-meter if the society bills the charger’s energy separately');
  sections.push({ title: 'DB box and protection', items: prot });

  // Earthing
  const earth: string[] = [];
  if (i.earth === 'dedicated') earth.push('Test the existing dedicated earth and record its resistance; repair or add a pit if it is too high');
  else earth.push(s.kind === 'dc' ? 'New dedicated earth pits for the charger (DC sites often need two or more, bonded together)' : 'A new dedicated earth pit for the charger');
  earth.push('Earth resistance test and neutral-to-earth voltage check, recorded in the handover pack');
  sections.push({ title: 'Earthing', items: earth });

  // Mounting and civil
  const civil: string[] = [];
  if (i.mount === 'wall') civil.push('Wall bracket at the height the maker asks for, with cable management for the gun');
  else civil.push(s.kind === 'dc' ? 'RCC plinth to the maker’s foundation drawing, with cable entry' : 'A pedestal or stand on a small concrete foundation');
  if (i.location === 'public' || s.kind === 'dc') civil.push('Bollards or wheel stops to protect the charger');
  if (i.location !== 'covered') civil.push('A canopy or shade if the charger or users need weather protection');
  if (i.location === 'public') civil.push('Floor marking and signage for the EV bay');
  sections.push({ title: 'Mounting and civil work', items: civil });

  // Permissions
  const perm: string[] = [];
  if (i.society) perm.push('Society or RWA permission (NOC) for the charger and the cable route');
  if (s.kind === 'dc' || i.location === 'public') perm.push('Local permissions for a public station, as your area requires');
  if (s.phase === 3 && i.supply === 'single') perm.push('A load increase or new three-phase connection from your DISCOM');
  if (perm.length) sections.push({ title: 'Permissions to arrange', items: perm });

  sections.push({ title: 'Testing and handover', items: ['Insulation, earth and RCD tests', 'Power-up, app or OCPP setup, and a test charge', 'Handover pack with test results and photos'] });

  return { sections, flags };
}
