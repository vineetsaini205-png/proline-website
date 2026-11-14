// The 11 charger types shown in the chargers guide (owner, 13 Nov: show customers what each type
// looks like and how big it is; no prices — "Get a quote" and a call decide the exact brand and model).
// Sizes are typical for chargers of that type sold in India; the real size depends on the brand.
export type ChargerKind =
  | 'home-socket' | 'portable' | 'wallbox-7' | 'wallbox-11' | 'ac-post-22' | 'lev-ac'
  | 'lev-dc' | 'dc-30' | 'dc-60' | 'dc-120' | 'dc-240';

export type ChargerType = {
  kind: ChargerKind;
  tag: string;        // short label, also the WhatsApp "need"
  name: string;       // card heading
  size: string;       // typical size
  heightCm: number;   // typical height in cm, for the size comparison drawing
  mount: 'Wall' | 'Floor' | 'Portable';
  suits: string;      // who it suits, one sentence
  href: string;       // page with the details
  // Owner's charger-range design (15 Nov 2026): card heading, small category line, one-line use, "Where it fits".
  short: string; category: string; use: string; fits: string;
  art: string;        // symbol id in ChargerTypes.astro's drawing set
  dc: boolean;
};

export const chargerTypes: ChargerType[] = [
  { kind: 'home-socket', tag: '3.3 kW HOME', name: 'Home charging socket box', size: 'About 25 × 30 cm, on the wall', heightCm: 30, mount: 'Wall',
    suits: 'Charging at home with the portable charger that comes with many cars and scooters. A dedicated socket with its own breakers and earthing.', href: '/services/ev-charger-db-box/',
    short: 'Home charging socket box', category: 'Home essentials', use: 'A dedicated socket for your portable charger.',
    fits: 'Home parking spaces. We help check the circuit, protection and earthing for the charger you use.', art: 'home-socket', dc: false },
  { kind: 'portable', tag: '3.3 kW PORTABLE', name: 'Portable charger', size: 'Control box about 20 cm, 5 m cable', heightCm: 8, mount: 'Portable',
    suits: 'A spare or travel charger that plugs into a 15/16 A socket. Slow, but it works almost anywhere with a safe socket.', href: '/chargers/ac-chargers/',
    short: 'Portable charger', category: 'Take it with you', use: 'A compact charging option to carry in the car.',
    fits: 'Home or travel use with a suitable, correctly installed socket. Typical cable length is around 5 m; the exact kit varies by model.', art: 'portable', dc: false },
  { kind: 'wallbox-7', tag: '7.4 kW AC', name: '7.4 kW home wallbox', size: 'About 35 × 25 cm, on the wall', heightCm: 35, mount: 'Wall',
    suits: 'Homes with a single-phase supply. The usual choice for a car at home: a full charge overnight for most cars.', href: '/chargers/ac-chargers/',
    short: '7.4 kW home wallbox', category: 'Everyday home charging', use: 'A neat wall-mounted charger for home parking.',
    fits: 'Homes with a suitable single-phase supply. We match the charger to the vehicle, available electrical capacity and parking space.', art: 'wallbox', dc: false },
  { kind: 'wallbox-11', tag: '11 kW AC', name: '11 kW wallbox (three-phase)', size: 'About 40 × 28 cm, on the wall', heightCm: 28, mount: 'Wall',
    suits: 'Homes and offices with a three-phase supply, for cars whose on-board charger accepts 11 kW. Faster than 7.4 kW for those cars only.', href: '/chargers/ac-chargers/',
    short: '11 kW wallbox', category: 'Three-phase charging', use: 'For homes and offices with three-phase supply.',
    fits: 'Sites with a suitable three-phase connection. The vehicle’s on-board charger must support the required AC power.', art: 'wallbox-three', dc: false },
  { kind: 'ac-post-22', tag: '22 kW AC', name: '22 kW AC charging post', size: 'About 1.5 m tall, on the floor', heightCm: 150, mount: 'Floor',
    suits: 'Offices, malls, hotels and societies: two cars at once on a three-phase supply, with sockets or fixed cables.', href: '/chargers/ac-chargers/',
    short: '22 kW AC charging post', category: 'Shared parking', use: 'A slim charging post for shared parking spaces.',
    fits: 'Offices, shopping locations, hotels and residential parking. Output and connector options depend on the chosen model and vehicle.', art: 'ac-post', dc: false },
  { kind: 'lev-ac', tag: '2W/3W AC', name: 'Smart socket point for scooters and e-rickshaws', size: 'About 20 × 30 cm, on the wall', heightCm: 30, mount: 'Wall',
    suits: 'Societies, offices and shops where scooters, e-rickshaws and cars charge with their own charger. Users scan, pay and plug in.', href: '/chargers/2w-3w-chargers/',
    short: 'Smart socket charging point', category: 'Two- and three-wheelers', use: 'A tidy plug-in point for scooters and e-rickshaws.',
    fits: 'Housing societies, offices and shops. Use the vehicle’s compatible charger with a properly specified socket point.', art: 'smart-socket', dc: false },
  { kind: 'lev-dc', tag: '2W/3W DC', name: 'DC fast charger for scooters and 3-wheelers', size: 'About 45 × 60 cm, on a wall or stand', heightCm: 60, mount: 'Wall',
    suits: 'Fast charging for scooters and 3-wheelers with Type 6 or Type 7 connectors, at fleets, hubs and public spots.', href: '/chargers/2w-3w-chargers/',
    short: 'DC charger for 2- and 3-wheelers', category: 'Compact DC charging', use: 'Dedicated DC charging for compatible small EVs.',
    fits: 'Delivery fleets, e-rickshaw operations and public charging points. Vehicle, connector and charging-protocol compatibility must be checked.', art: 'compact-dc', dc: true },
  { kind: 'dc-30', tag: '30 kW DC', name: '30 kW DC fast charger', size: 'About 1.5 m tall, on a stand', heightCm: 150, mount: 'Floor',
    suits: 'Hotels, offices, dealerships and small public stations: one car at a time, a big top-up in about an hour.', href: '/chargers/dc-fast-chargers/',
    short: '30 kW DC fast charger', category: 'Commercial destinations', use: 'A compact DC setup for customer parking.',
    fits: 'Hotels, dealerships, offices and small public charging locations. We check site power and the vehicles you expect to serve.', art: 'dc-thirty', dc: true },
  { kind: 'dc-60', tag: '60 kW DC', name: '60 kW DC fast charger', size: 'About 1.8 m tall, floor cabinet', heightCm: 180, mount: 'Floor',
    suits: 'Public charging stations and fleets: two cars at once, a common size at city stations.', href: '/chargers/dc-fast-chargers/',
    short: '60 kW DC fast charger', category: 'Public and fleet charging', use: 'A floor-standing cabinet for commercial sites.',
    fits: 'Public charging stations and fleet parking. Connector count and power sharing vary with the selected charger.', art: 'dc-sixty', dc: true },
  { kind: 'dc-120', tag: '120 kW DC', name: '120 kW DC fast charger', size: 'About 2 m tall, floor cabinet', heightCm: 205, mount: 'Floor',
    suits: 'Highways and busy stations: quicker stops for cars that accept high DC power, with heavy cables held on arms.', href: '/chargers/dc-fast-chargers/',
    short: '120 kW DC fast charger', category: 'Busy charging locations', use: 'Higher-power charging for busy commercial stops.',
    fits: 'Highway locations and high-traffic charging sites. Charging performance depends on the vehicle and available site power.', art: 'dc-one-twenty', dc: true },
  { kind: 'dc-240', tag: '240 kW DC', name: '240 kW DC for bus and truck depots', size: 'Cabinet about 2.2 m tall, plus dispensers', heightCm: 220, mount: 'Floor',
    suits: 'Bus and truck depots and large hubs. A separate power cabinet feeds one or more slim dispensers at the bays.', href: '/for/fleets/',
    short: '240 kW DC depot system', category: 'Heavy vehicle operations', use: 'A power cabinet and dispenser layout for depots.',
    fits: 'Bus and truck depots and large fleets. Cabinet placement, dispenser count and power allocation are planned around the site.', art: 'dc-two-forty', dc: true },
];
