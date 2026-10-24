---
title: "Fleet EV Charging: Depot Chargers and Batteries | Proline"
description: "Fleet EV charging for delivery, cab, logistics, e-bus and e-rickshaw depots: chargers and power sized per shift, batteries and monthly billing on Proline CMS."
label: Fleets
h1: Fleet EV charging for depots, cabs, e-buses and e-rickshaw hubs
eyebrow: For fleets
intro: "Fleet EV charging means having every vehicle charged for its next shift: enough power at the depot, chargers that keep working, and a record of the energy each vehicle or driver uses. Proline plans and installs depot charging for delivery, cab, logistics, e-bus and e-rickshaw fleets, with DC and AC chargers of any brand, their power supply and batteries, plus Proline CMS for RFID cards and fleet accounts billed monthly."
keyword: fleet EV charging
summary: "Depot charging for cabs, delivery, e-buses and e-rickshaws, with batteries and billing."
icon: truck
order: 6
image: dc-cabinet-charging
highlights:
  - Depot power planned around your shifts
  - DC, AC and 2W/3W chargers of any brand
  - RFID cards and monthly fleet billing
form: b2b
steps:
  - title: Share the fleet plan
    text: "Vehicle models and numbers, daily kilometres, shift times, the depot location, and your electricity bill or planned connection."
  - title: Work out the energy
    text: "We turn your duty cycle into energy per day and the charging power the depot needs, so every vehicle is ready for its shift without a bigger supply than you use."
  - title: Depot survey
    text: "An engineer checks the supply, space for a transformer, trench routes, earthing, the bay layout and mobile signal. The survey is paid, and the fee is adjusted against your order if you go ahead."
  - title: Design and quote
    text: "The charger mix and brands, the electrical design from the meter or transformer to each charger, batteries where they help, and a phased plan, in one quote. We tell you the load to apply for and what to prepare for your DISCOM."
  - title: Build and commission
    text: "Civil work, panels, cabling, earthing and chargers, then tests and a test charge with your own vehicles. Several depots get the same design and handover format."
  - title: Go live on software
    text: "Chargers connected over OCPP to Proline CMS or your own system, RFID cards issued and fleet accounts set up, with a handover pack of test results and photos."
faqs:
  - q: How many chargers does our depot need?
    a: "Work it out from energy, not vehicle numbers. Multiply vehicles by kilometres a day and divide by kilometres per kWh; divide that by the hours vehicles stand at the depot, and add about 10% for losses. For example, 20 cabs running 200 km a day at about 7 km per kWh need roughly 80 kW of charging over 8 hours. Add a spare charger, so one fault doesn't stop the shift."
  - q: Should a cab depot use AC or DC chargers?
    a: "AC suits cabs parked all night: one 7.4 or 11 kW charger per bay, no need to move cars, and far less supply per charger. DC suits quick turnarounds between shifts, with fewer chargers but someone moving cabs on and off them. A mix often works: AC for the night and a shared DC charger for top-ups."
  - q: How do we bill drivers or partner fleets for charging?
    a: "On [Proline CMS](/cms/), each fleet gets an account with RFID cards, postpaid charging up to a credit limit with warnings at 80% and 95%, and one monthly GST invoice listing every session. Fleets can also get their own price, and chargers only their vehicles can use."
  - q: What keeps the chargers running?
    a: "Design and monitoring. We plan a spare charger and a separate breaker for each one, so one fault doesn't stop the shift, and help you choose brands with service and spares in your state. Proline CMS shows every charger's status live and raises alerts with deadlines, and RFID cards can keep working on a fleet's own chargers even when the chargers are offline."
  - q: Can you supply batteries for our e-rickshaws or scooters?
    a: "Yes. We supply e-rickshaw and 2-wheeler batteries of different brands, and battery storage (BESS) for depots and charging hubs. Tell us the vehicle model, the battery voltage and how many packs you need; see [batteries](/batteries/)."
  - q: What does an e-bus depot need?
    a: "High-power DC chargers, usually on an HT connection with its own transformer, and bays laid out for bus lengths and turning. The Ministry of Power's 2024 guidelines ask e-bus depots to install chargers of at least 240 kW ([guidelines, Sep 2024](https://beeindia.gov.in/WriteReadData/L45218/2841453721548450.pdf)). See [bus and truck chargers](/chargers/bus-truck-chargers/)."
related:
  - /tools/charger-finder/
  - /chargers/bus-truck-chargers/
  - /batteries/
  - /chargers/2w-3w-chargers/
  - /services/dc-fast-charger-installation/
  - /cms/features/
updated: 2026-10-24
---

## What fleet managers ask

Once a fleet goes electric, charging becomes part of operations. The questions are practical:

- Will the depot's supply take the next batch of vehicles?
- Vehicles queue at the chargers before the morning shift. Do we need more chargers, or bigger ones?
- Drivers top up at public chargers. How do we control that cost?
- A charger went down and vehicles missed trips. How do we stop that happening again?
- Partner fleets or drivers on leased vehicles charge at our hub. How do we bill them?

The answers start with energy: how much your vehicles use in a day, and how long they stand still.

## Work out the energy first

Size a depot from the energy your vehicles need, not from the number of vehicles:

1. **Energy a day:** vehicles × kilometres a day ÷ kilometres per kWh.
2. **Charging power:** that energy ÷ the hours vehicles stand at the depot, plus about 10% for losses.
3. **Chargers:** enough guns at the right power to deliver it, plus a spare, laid out so drivers don't queue at shift change.

**Example, for illustration:** 20 cabs, each running 200 km a day at about 7 km per kWh, need about 570 kWh a night, or roughly 80 kW over 8 hours once losses are added. Twenty 7.4 kW AC chargers, one per bay, would do it in four to five hours, or share a smaller supply over the whole night with load management. Two 60 kW DC chargers can also do it, if someone moves cabs on and off them through the night. Use your vehicles' real kilometres per kWh from your trip data.

Energy at your own depot is billed at your connection's tariff, while drivers pay about ₹15–25 per kWh at public DC chargers ([Statiq, Oct 2026](https://statiq.in/blog/2026/10/12/public-ev-charging-cost-india/)). RFID cards on your chargers then show which vehicle or driver used what.

## Chargers for each kind of fleet

| Fleet | When it charges | What usually fits |
|---|---|---|
| Cabs and staff cars | Overnight at the depot, top-ups between shifts | 7.4 or 11 kW AC per bay, plus 30–60 kW DC (CCS2) for quick turnarounds |
| Delivery e-scooters | At hubs, between shifts | 16 A socket points, Type 6 (DC) or Type 7 (AC and DC) chargers where scooters support them, and spare batteries |
| E-rickshaws and 3W cargo | At hubs, mostly overnight | Battery chargers on 16 A socket points, Type 6 or Type 7 DC for 3Ws that support it, and spare batteries |
| Vans and light trucks | Overnight and between trips | 30–60 kW DC, or AC where vehicles stand all night |
| E-buses and heavy trucks | At the depot, overnight and between trips | High-power DC on HT supply; at least 240 kW per charger at e-bus depots under the 2024 guidelines |

Light EVs use IS 17017-2-6 "Type 6" connectors for DC charging, and IS 17017-2-7 "Type 7" (LECCS), which takes both AC and DC charging through one inlet. Lead-acid e-rickshaw batteries give off hydrogen while charging, so a hub that charges them needs good ventilation, with socket points on their own circuits, RCD protection and a sound earth. See [2W and 3W chargers](/chargers/2w-3w-chargers/) and [bus and truck chargers](/chargers/bus-truck-chargers/).

## Power for the depot

- **Captive charging.** The Ministry of Power's 2024 guidelines recognise captive charging stations, used only by vehicles the owner owns or controls, and name fleet owners, corporates and bus depots among them ([guidelines, Sep 2024](https://beeindia.gov.in/WriteReadData/L45218/2841453721548450.pdf)). Ask your DISCOM which tariff applies to captive charging at your depot.
- **LT or HT.** The guidelines provide for LT connections of up to 150 kW for charging stations. A bigger depot needs HT supply with its own transformer and HT panel, which takes space, money and time, so apply early. See [DC fast charger installation](/services/dc-fast-charger-installation/).
- **Time of day.** Where your tariff has time-of-day rates, night charging can cost more than charging in solar hours. Vehicles that rest at midday can charge then, and solar panels on the depot roof or a carport add daytime energy of your own.
- **Battery storage.** A BESS can store energy when it is cheaper and release it at peak hours, keep demand within your sanctioned load, or carry part of the load in a power cut. See [BESS for charging stations](/batteries/bess-for-ev-charging/).
- **Room to grow.** Spare ducts in every trench, spare ways in the panel and a transformer sized for the next phase cost far less now than digging up the depot later.

The connection or load increase is taken in your name; we work out the load to apply for and tell you what to prepare.

## Batteries for e-rickshaws, scooters and depots

We supply [batteries](/batteries/) of different brands for fleets: lithium packs for e-rickshaws and 3-wheelers, 2-wheeler batteries for delivery scooters, and BESS for depots and charging hubs. Spare packs let a vehicle go back out on a charged battery while its own pack charges, where your vehicles allow packs to be changed. Charge each pack on the charger its maker specifies, and never mix lead-acid and lithium packs on one charger.

## Uptime: keeping vehicles on the road

A charger that is down costs trips, so we plan for it:

- **A spare.** One more charger than the arithmetic needs, and a separate breaker for each, so one fault doesn't stop the shift.
- **Protection and earthing** to each maker's manual, with surge protection, so a supply fault is less likely to damage the chargers.
- **Cable management.** Gun holsters and cable hangers keep heavy charging cables off the ground, out from under the wheels.
- **Brands with service near you.** We work with many charger brands, so we compare warranty terms and who services each charger in your state.
- **Monitoring.** [Proline CMS](/cms/) shows every charger's status live, raises alerts with deadlines to acknowledge and fix, tracks faults as tickets with checklists, and lets your team reset or unlock a charger remotely.

## Fleet billing on Proline CMS

Proline CMS runs OCPP chargers of any brand, and fleets are built in:

- **RFID cards** for each driver or vehicle: add, import, block or report lost. Cards can keep working on a fleet's own chargers even when the chargers are offline.
- **Fleet accounts** with postpaid charging up to a credit limit, warnings at 80% and 95%, one monthly GST invoice listing every session, and payments recorded by bank reference.
- **Fleet prices and fleet-only chargers**, hidden from public maps.
- **Reports** on sessions, energy by charger and fleet accounts, with exports for TallyPrime and Zoho Books.

It suits a fleet that bills partner fleets or drivers on leased vehicles at its own depot, and a charging hub that sells to several fleets. Proline CMS is software you own, with no commission on charging payments and no fee per charger per month. Run it on your own server, or we host it on servers in India with 24/7 support for the CMS. An advanced fleet portal, with rider limits for 2W and 3W fleets and depot scheduling, is available on request.

## Why Proline

We are based in Delhi and work in 10 states across North, South and West India, with more than 200 technicians, so depots in different states can follow one design. In 2 years we have installed more than 500 chargers and DB boxes, AC and DC, including work for TATA, ThunderPlus, Bolt.Earth and KIA.

## What to send us

On WhatsApp to +91 73038 87364, by email to Sales@prolineelectricalworks.com, or through the form on this page:

1. Vehicle models and numbers, now and over the next year
2. Kilometres a day and shift times for each vehicle type
3. The depot location, with photos or a sketch of the layout
4. Your electricity bill, or the connection you plan: LT or HT, and the load
5. Chargers and batteries you already use, and your current software
6. Other depots or cities in your plan

Not sure which chargers suit your vehicles? The [charger finder](/tools/charger-finder/) suggests a charger type and power for a depot in a minute.
