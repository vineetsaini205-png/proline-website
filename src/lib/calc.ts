// Calculator maths, shared by the pages (default results rendered in HTML for crawlers)
// and by the browser scripts (live results). No Proline or brand prices anywhere:
// costs come from public tariffs and charging rates, and payback only from the visitor's own quote.

export type Busy = 'quiet' | 'likely' | 'busy';

export interface ChargerPreset {
  id: string;
  label: string;
  kind: 'ac' | 'dc';
  kw: number;          // rated power
  avgKw: number;       // average power actually delivered while a vehicle charges
  efficiency: number;  // energy sold / energy bought
  hours: Record<Busy, number>; // hours of charging a day per charger
}

export const CHARGERS: ChargerPreset[] = [
  { id: 'ac-3', label: '3.3 kW AC (2W/3W and car sockets)', kind: 'ac', kw: 3.3, avgKw: 3, efficiency: 0.97, hours: { quiet: 3, likely: 6, busy: 9 } },
  { id: 'ac-7', label: '7.4 kW AC (cars)', kind: 'ac', kw: 7.4, avgKw: 6.5, efficiency: 0.97, hours: { quiet: 2, likely: 4, busy: 6 } },
  { id: 'ac-22', label: '22 kW AC (cars)', kind: 'ac', kw: 22, avgKw: 9, efficiency: 0.97, hours: { quiet: 2, likely: 4, busy: 6 } },
  { id: 'dc-30', label: '30 kW DC fast charger', kind: 'dc', kw: 30, avgKw: 24, efficiency: 0.94, hours: { quiet: 1.5, likely: 3, busy: 5 } },
  { id: 'dc-60', label: '60 kW DC fast charger', kind: 'dc', kw: 60, avgKw: 40, efficiency: 0.94, hours: { quiet: 1.5, likely: 3, busy: 5 } },
  { id: 'dc-120', label: '120 kW DC (two guns)', kind: 'dc', kw: 120, avgKw: 70, efficiency: 0.94, hours: { quiet: 1.5, likely: 3, busy: 5 } },
  { id: 'dc-240', label: '240 kW DC (bus, truck, highway hub)', kind: 'dc', kw: 240, avgKw: 120, efficiency: 0.94, hours: { quiet: 1.5, likely: 3, busy: 5 } },
];

export const BUSY_LABEL: Record<Busy, string> = { quiet: 'Quiet', likely: 'Likely', busy: 'Busy' };

export interface EarningsInput {
  chargerId: string;
  count: number;
  hoursPerDay: number;     // per charger
  pricePerKwh: number;     // what drivers pay
  priceIncludesGst: boolean;
  gstPct: number;
  tariff: number;          // EV tariff ₹/unit
  fixedPerKw: number;      // ₹ per kW per month
  fixedFlat?: number;      // ₹ per month
  solarShare?: number | null; // 0–1 share of charging in solar hours, or null when time-of-day rule is off
  rentMonthly: number;
  revenueSharePct: number; // % of net revenue paid to landowner
  appCommissionPct: number;// % of net revenue paid to an app/aggregator
  otherMonthly: number;    // staff, internet, upkeep
  quote?: number | null;   // the visitor's own all-in quote
  days?: number;
}

export interface EarningsResult {
  kwhSold: number;
  revenue: number;      // net of GST
  electricity: number;
  fixed: number;
  shares: number;       // rent + revenue share + app commission
  other: number;
  profit: number;       // per month
  paybackMonths: number | null;
  fiveYear: number | null;
}

export function charger(id: string): ChargerPreset {
  return CHARGERS.find((c) => c.id === id) ?? CHARGERS[4];
}

export function earnings(i: EarningsInput): EarningsResult {
  const c = charger(i.chargerId);
  const days = i.days ?? 30;
  const count = Math.max(1, Math.round(i.count || 1));
  const kwhSold = c.avgKw * Math.max(0, i.hoursPerDay) * days * count;
  const revenue = kwhSold * i.pricePerKwh / (i.priceIncludesGst ? 1 + i.gstPct / 100 : 1);
  const todFactor = i.solarShare == null ? 1 : 0.7 * i.solarShare + 1.3 * (1 - i.solarShare);
  const electricity = (kwhSold / c.efficiency) * i.tariff * todFactor;
  const fixed = i.fixedPerKw * c.kw * count + (i.fixedFlat ?? 0);
  const shares = i.rentMonthly + revenue * (i.revenueSharePct + i.appCommissionPct) / 100;
  const other = i.otherMonthly;
  const profit = revenue - electricity - fixed - shares - other;
  const q = i.quote && i.quote > 0 ? i.quote : null;
  return {
    kwhSold, revenue, electricity, fixed, shares, other, profit,
    paybackMonths: q && profit > 0 ? q / profit : null,
    fiveYear: q ? profit * 60 - q : null,
  };
}

/** Quiet / likely / busy profits for the same site. */
export function earningsRange(i: Omit<EarningsInput, 'hoursPerDay'>): Record<Busy, number> {
  const c = charger(i.chargerId);
  return {
    quiet: earnings({ ...i, hoursPerDay: c.hours.quiet }).profit,
    likely: earnings({ ...i, hoursPerDay: c.hours.likely }).profit,
    busy: earnings({ ...i, hoursPerDay: c.hours.busy }).profit,
  };
}

// ---------------- EV vs petrol / diesel / CNG ----------------

export type Fuel = 'petrol' | 'diesel' | 'cng';

export interface VehiclePreset {
  id: string;
  label: string;
  fuel: Fuel;
  mileage: number;     // km per litre (or per kg for CNG) of the fuel vehicle
  evKmPerKwh: number;  // km per unit of the matching EV, charging losses included
  kmPerDay: number;
  days: number;        // driving days a month
}

export const VEHICLES: VehiclePreset[] = [
  { id: 'scooter', label: 'Scooter or motorcycle', fuel: 'petrol', mileage: 45, evKmPerKwh: 30, kmPerDay: 30, days: 30 },
  { id: 'car', label: 'Hatchback or sedan', fuel: 'petrol', mileage: 15, evKmPerKwh: 7, kmPerDay: 40, days: 30 },
  { id: 'suv', label: 'SUV', fuel: 'diesel', mileage: 14, evKmPerKwh: 6, kmPerDay: 40, days: 30 },
  { id: 'auto', label: 'Auto-rickshaw (3-wheeler)', fuel: 'cng', mileage: 30, evKmPerKwh: 12, kmPerDay: 100, days: 26 },
  { id: 'taxi', label: 'Cab or taxi', fuel: 'cng', mileage: 22, evKmPerKwh: 7, kmPerDay: 150, days: 26 },
];

export interface SavingsInput {
  fuel: Fuel;
  kmPerDay: number;
  days: number;
  fuelPrice: number;
  mileage: number;
  evKmPerKwh: number;
  electricityRate: number;
  co2PerFuelUnit: number;
  gridKgPerKwh: number;
}

export interface SavingsResult {
  kmMonth: number;
  fuelCost: number;
  evCost: number;
  monthly: number;
  yearly: number;
  fiveYear: number;
  fuelPerKm: number;
  evPerKm: number;
  co2YearKg: number;
}

export function savings(i: SavingsInput): SavingsResult {
  const kmMonth = Math.max(0, i.kmPerDay) * Math.max(0, i.days);
  const fuelUnits = i.mileage > 0 ? kmMonth / i.mileage : 0;
  const kwh = i.evKmPerKwh > 0 ? kmMonth / i.evKmPerKwh : 0;
  const fuelCost = fuelUnits * i.fuelPrice;
  const evCost = kwh * i.electricityRate;
  const monthly = fuelCost - evCost;
  const co2YearKg = (fuelUnits * i.co2PerFuelUnit - kwh * i.gridKgPerKwh) * 12;
  return {
    kmMonth, fuelCost, evCost, monthly, yearly: monthly * 12, fiveYear: monthly * 60,
    fuelPerKm: i.mileage > 0 ? i.fuelPrice / i.mileage : 0,
    evPerKm: i.evKmPerKwh > 0 ? i.electricityRate / i.evKmPerKwh : 0,
    co2YearKg,
  };
}

/** ₹ format for results: 1,25,000 */
export function rupees(n: number): string {
  const v = Math.round(n);
  return (v < 0 ? '−₹' : '₹') + Math.abs(v).toLocaleString('en-IN');
}
