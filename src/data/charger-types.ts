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
};

export const chargerTypes: ChargerType[] = [
  { kind: 'home-socket', tag: '3.3 kW HOME', name: 'Home charging socket box', size: 'About 25 × 30 cm, on the wall', heightCm: 30, mount: 'Wall',
    suits: 'Charging at home with the portable charger that comes with many cars and scooters. A dedicated socket with its own breakers and earthing.', href: '/services/ev-charger-db-box/' },
  { kind: 'portable', tag: '3.3 kW PORTABLE', name: 'Portable charger', size: 'Control box about 20 cm, 5 m cable', heightCm: 8, mount: 'Portable',
    suits: 'A spare or travel charger that plugs into a 15/16 A socket. Slow, but it works almost anywhere with a safe socket.', href: '/chargers/ac-chargers/' },
  { kind: 'wallbox-7', tag: '7.4 kW AC', name: '7.4 kW home wallbox', size: 'About 35 × 25 cm, on the wall', heightCm: 35, mount: 'Wall',
    suits: 'Homes with a single-phase supply. The usual choice for a car at home: a full charge overnight for most cars.', href: '/chargers/ac-chargers/' },
  { kind: 'wallbox-11', tag: '11 kW AC', name: '11 kW wallbox (three-phase)', size: 'About 40 × 28 cm, on the wall', heightCm: 28, mount: 'Wall',
    suits: 'Homes and offices with a three-phase supply, for cars whose on-board charger accepts 11 kW. Faster than 7.4 kW for those cars only.', href: '/chargers/ac-chargers/' },
  { kind: 'ac-post-22', tag: '22 kW AC', name: '22 kW AC charging post', size: 'About 1.5 m tall, on the floor', heightCm: 150, mount: 'Floor',
    suits: 'Offices, malls, hotels and societies: two cars at once on a three-phase supply, with sockets or fixed cables.', href: '/chargers/ac-chargers/' },
  { kind: 'lev-ac', tag: '2W/3W AC', name: 'Smart socket point for scooters and e-rickshaws', size: 'About 20 × 30 cm, on the wall', heightCm: 30, mount: 'Wall',
    suits: 'Societies, offices and shops where scooters, e-rickshaws and cars charge with their own charger. Users scan, pay and plug in.', href: '/chargers/2w-3w-chargers/' },
  { kind: 'lev-dc', tag: '2W/3W DC', name: 'DC fast charger for scooters and 3-wheelers', size: 'About 45 × 60 cm, on a wall or stand', heightCm: 60, mount: 'Wall',
    suits: 'Fast charging for scooters and 3-wheelers with Type 6 or Type 7 connectors, at fleets, hubs and public spots.', href: '/chargers/2w-3w-chargers/' },
  { kind: 'dc-30', tag: '30 kW DC', name: '30 kW DC fast charger', size: 'About 1.5 m tall, on a stand', heightCm: 150, mount: 'Floor',
    suits: 'Hotels, offices, dealerships and small public stations: one car at a time, a big top-up in about an hour.', href: '/chargers/dc-fast-chargers/' },
  { kind: 'dc-60', tag: '60 kW DC', name: '60 kW DC fast charger', size: 'About 1.8 m tall, floor cabinet', heightCm: 180, mount: 'Floor',
    suits: 'Public charging stations and fleets: two cars at once, a common size at city stations.', href: '/chargers/dc-fast-chargers/' },
  { kind: 'dc-120', tag: '120 kW DC', name: '120 kW DC fast charger', size: 'About 2 m tall, floor cabinet', heightCm: 205, mount: 'Floor',
    suits: 'Highways and busy stations: quicker stops for cars that accept high DC power, with heavy cables held on arms.', href: '/chargers/dc-fast-chargers/' },
  { kind: 'dc-240', tag: '240 kW DC', name: '240 kW DC for bus and truck depots', size: 'Cabinet about 2.2 m tall, plus dispensers', heightCm: 220, mount: 'Floor',
    suits: 'Bus and truck depots and large hubs. A separate power cabinet feeds one or more slim dispensers at the bays.', href: '/chargers/bus-truck-chargers/' },
];
