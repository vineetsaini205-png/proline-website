// Calculator maths, shared by the pages (default results rendered in HTML for crawlers)
// and by the browser scripts (live results). No Proline or brand prices anywhere: costs come from public
// tariffs and charging rates or from the visitor; payback only from the visitor's own project cost.

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

// ---------------- Charging station earnings (strategy plan, 13 Nov 2026) ----------------
// Revenue, operating surplus and cash after finance are separate numbers, never all called "profit".
// A cost the visitor has not entered is null: it counts as zero in the sums but is listed in `missing`,
// and the page says the surplus is before those costs. Nothing unknown silently becomes zero.

export interface StationInput {
  chargerId: string;
  count: number;
  hoursPerDay: number;            // charging hours a day per charger, once usage has built up
  days?: number;                  // operating days a month (30)
  availability?: number;          // 0–1 share of time the charger works (0.95)
  pricePerKwh: number;            // what drivers pay
  priceIncludesGst: boolean;
  gstPct: number;
  tariff: number;                 // EV tariff ₹/unit
  fixedPerKw: number;             // ₹ per kW of the chargers' rated power, a month
  fixedFlat?: number;             // ₹ a month
  solarShare?: number | null;     // 0–1 share of charging in solar hours, or null when the time-of-day rule is off
  auxKwh?: number | null;         // auxiliary electricity a month: lights, cooling, standby
  rentMonthly?: number | null;
  revenueSharePct?: number | null;   // % of revenue (after GST) to the landowner
  appCommissionPct?: number | null;  // % of revenue to an app or aggregator
  paymentFeePct?: number | null;     // % of revenue to the payment gateway
  staffMonthly?: number | null;
  maintenanceMonthly?: number | null;
  cmsMonthly?: number | null;        // charging software and hosting
  otherMonthly?: number | null;      // internet, insurance, upkeep
  projectCost?: number | null;       // from the visitor's own estimate or quote
  workingCapital?: number | null;
  loanAmount?: number | null;
  loanRatePct?: number | null;       // % a year
  loanYears?: number | null;
  rampStartPct?: number;             // usage in the first month, % of the built-up level (30)
  rampMonths?: number;               // months for usage to build up (12)
}

export const COST_LABELS: Record<string, string> = {
  auxKwh: 'auxiliary electricity (lights, cooling)', rentMonthly: 'rent or land share', revenueSharePct: 'revenue share',
  paymentFeePct: 'payment fees', staffMonthly: 'staff', maintenanceMonthly: 'maintenance', cmsMonthly: 'software and hosting', otherMonthly: 'other site costs',
};

export interface MonthResult {
  kwhSold: number;
  revenue: number;      // after GST
  electricity: number;  // energy bought for charging (with losses) and auxiliary use
  fixed: number;        // fixed or demand charges
  siteCosts: number;    // rent, shares, fees, staff, maintenance, software, other
  surplus: number;      // operating surplus = revenue − electricity − fixed − site costs
}

export interface StationResult extends MonthResult {
  emi: number;                 // finance payment a month while the loan runs
  cashAfterFinance: number;    // surplus − finance payment
  equity: number | null;       // project cost + working capital − loan
  paybackMonths: number | null;  // from cumulative cash flow, with the ramp-up
  neverPaysBack: boolean;        // true when a project cost is entered and cash never recovers it within 10 years
  missing: string[];             // cost fields not entered
}

const n0 = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? 0 : v);

export function charger(id: string): ChargerPreset {
  return CHARGERS.find((c) => c.id === id) ?? CHARGERS[4];
}

/** One month at a given usage (0–1 of the built-up level). */
export function stationMonth(i: StationInput, usage = 1): MonthResult {
  const c = charger(i.chargerId);
  const days = i.days ?? 30;
  const avail = i.availability ?? 0.95;
  const count = Math.max(1, Math.round(i.count || 1));
  const kwhSold = c.avgKw * Math.max(0, i.hoursPerDay) * days * count * avail * usage;
  const revenue = kwhSold * i.pricePerKwh / (i.priceIncludesGst ? 1 + i.gstPct / 100 : 1);
  const todFactor = i.solarShare == null ? 1 : 0.7 * i.solarShare + 1.3 * (1 - i.solarShare);
  const electricity = ((kwhSold / c.efficiency) + n0(i.auxKwh)) * i.tariff * todFactor;
  const fixed = i.fixedPerKw * c.kw * count + (i.fixedFlat ?? 0);
  const pct = n0(i.revenueSharePct) + n0(i.appCommissionPct) + n0(i.paymentFeePct);
  const siteCosts = n0(i.rentMonthly) + revenue * pct / 100 + n0(i.staffMonthly) + n0(i.maintenanceMonthly) + n0(i.cmsMonthly) + n0(i.otherMonthly);
  return { kwhSold, revenue, electricity, fixed, siteCosts, surplus: revenue - electricity - fixed - siteCosts };
}

export function emi(principal: number, ratePct: number, years: number): number {
  const n = Math.round(years * 12);
  if (principal <= 0 || n <= 0) return 0;
  const r = ratePct / 1200;
  return r === 0 ? principal / n : principal * r * (1 + r) ** n / ((1 + r) ** n - 1);
}

export function station(i: StationInput): StationResult {
  const full = stationMonth(i, 1);
  const loan = Math.max(0, n0(i.loanAmount));
  const term = n0(i.loanYears);
  const pay = emi(loan, n0(i.loanRatePct), term);
  const missing = (['auxKwh', 'rentMonthly', 'paymentFeePct', 'staffMonthly', 'maintenanceMonthly', 'cmsMonthly', 'otherMonthly'] as const)
    .filter((k) => i[k] == null).map((k) => COST_LABELS[k]);
  const hasCost = i.projectCost != null && i.projectCost > 0;
  const equity = hasCost ? n0(i.projectCost) + n0(i.workingCapital) - loan : null;
  let paybackMonths: number | null = null;
  let neverPaysBack = false;
  if (equity != null) {
    const start = (i.rampStartPct ?? 30) / 100;
    const ramp = Math.max(0, Math.round(i.rampMonths ?? 12));
    let cum = -equity;
    for (let m = 1; m <= 120; m++) {
      const usage = ramp > 0 ? Math.min(1, start + (1 - start) * (m - 1) / ramp) : 1;
      cum += stationMonth(i, usage).surplus - (m <= Math.round(term * 12) ? pay : 0);
      if (cum >= 0) { paybackMonths = m; break; }
    }
    neverPaysBack = paybackMonths == null;
  }
  return { ...full, emi: pay, cashAfterFinance: full.surplus - pay, equity, paybackMonths, neverPaysBack, missing };
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
