---
title: "EV Charger DB Box: MCB, RCD and Surge Protection | Proline"
description: "EV charger DB box with isolator, MCB, the RCD or RCBO your charger needs, surge protection and a sub-meter, single or three phase, supplied and fitted."
label: EV charger DB box
h1: EV charger DB box, supplied and fitted
eyebrow: DB box service
intro: "An EV charger DB box is the small distribution board that feeds and protects a charger: an isolator, an MCB, the RCD or RCBO the charger maker asks for (Type A with 6 mA DC detection, or Type B) and a surge protection device, with a sub-meter where the charger's energy is billed separately. Proline supplies DB boxes of different brands, single phase or three phase, in an enclosure suited to indoor, outdoor or basement parking, and fits, wires and tests them with your charger."
keyword: EV charger DB box
summary: Isolator, MCB, RCD or RCBO, surge protection and metering, in the right enclosure.
icon: box
order: 9
highlights:
  - RCD type matched to the charger's manual
  - Surge protection, and a sub-meter if you bill
  - Single or three phase, indoor or outdoor
serviceType: EV charger DB box supply and installation
need: Earthing, cabling or DB box
costFactors:
  - "**Charger and supply:** AC or DC, the current it draws, and whether the box is single phase or three phase"
  - "**RCD type:** a Type A RCD with 6 mA DC detection, or a Type B RCD, which is a costlier device, as the charger maker asks"
  - "**Surge protection:** a Type 2 SPD for most sites, or a Type 1+2 device where there is a lightning conductor or an overhead supply"
  - "**Metering:** no meter, a simple energy meter, or one with a data port for billing software or load management"
  - "**Enclosure:** indoor or outdoor, metal or non-metallic, its IP rating, and a lockable door for shared or public parking"
  - "**Number of chargers:** one charger's box, or a main board or feeder pillar with a way for each charger and spares for later"
  - "**Load management:** a sensor or meter at your incomer and the data wiring to the chargers, if they share a limited supply"
  - "**Brand:** the make of switchgear you, your building or your company specify"
faqs:
  - q: What should be inside an EV charger DB box?
    a: An isolator or main switch, an MCB sized for the charger, the RCD its manual asks for and a surge protection device. Add a sub-meter if the charger's energy is billed separately. Some chargers have part of this protection built in, so we check the manual before we fit anything.
  - q: Can my charger run from my home's existing DB?
    a: Only from its own outgoing way, with the right rating and room for the RCD the charger needs, and only if your supply can carry the extra load. Most homes get a separate DB box for the charger, fed by its own cable from the meter or main DB. The charger never shares a circuit with sockets or lights.
  - q: Does an EV charger need a Type A or a Type B RCD?
    a: The type its manual names. If the charger has 6 mA DC fault detection built in, a Type A RCD in the DB box is enough; if it doesn't, the box needs a Type B. An ordinary Type AC RCCB is not suitable for an EV charger.
  - q: Is a sub-meter needed for a charger in a housing society?
    a: If the charger runs from the society's common supply, yes, so the society can bill you for the units you use. If it runs from your own flat's meter, the units are already on your bill. See [housing societies](/for/housing-societies/).
  - q: What IP rating does an outdoor DB box need?
    a: IP65 where it faces rain or hosing, and IP54 or IP55 in covered parking or a basement. Whatever the rating, mount the box above the level water reaches when the site floods, because a rating against jets of water doesn't make a box safe under water.
  - q: Do you supply the DB box or only fit it?
    a: Both. We supply DB boxes and switchgear of different brands, chosen for your charger and site, and fit, wire and test them. If you already have a box, or one came with your charger, we check it against the maker's manual before we connect it.
related:
  - /tools/installation-checklist/
  - /services/ev-charger-earthing/
  - /services/ev-charger-cabling/
  - /services/home-ev-charger-installation/
  - /for/housing-societies/
  - /services/ev-charger-commissioning/
updated: 2026-10-24
---

## What goes in an EV charger DB box

A DB box (distribution board) sits between your supply and the charger, with the devices that protect people, the cable and the charger. A box for one AC charger usually holds:

- **Isolator or incomer:** a switch that cuts the supply, so the charger can be serviced safely.
- **MCB (miniature circuit breaker):** trips on an overload or a short circuit, and is sized from the charger's current and the cable.
- **RCD, as an RCCB or an RCBO:** trips when current leaks to earth, which is what protects a person from a shock. An RCCB does only this and works alongside an MCB; an RCBO does both jobs in one device.
- **Surge protection device (SPD):** sends spikes from lightning or grid switching to earth before they reach the charger's electronics.
- **Sub-meter, where needed:** records the units the charger uses, when they are billed apart from the rest of the supply.
- **Fittings:** an earth bar, cable glands, a lockable door in shared or public parking, and a label on every device.

Some chargers have part of this built in, so we read the manual first and fit what it asks for, without doubling up or leaving gaps.

## Typical DB box for each charger

These are typical contents for a box serving one charger. The maker's manual and your supply decide the final ratings.

| Charger | Supply | What the box usually holds |
|---|---|---|
| 3.3 kW AC or socket point | Single phase, 16 A | 16 A MCB for a socket or 20 A for a wired charger, 30 mA RCD, SPD |
| 7.4 kW AC | Single phase, 32 A | Two-pole isolator, 40 A two-pole MCB, 30 mA RCD of the type the manual names, SPD |
| 11 kW AC | Three phase, 16 A | Four-pole isolator, 20 A four-pole MCB, four-pole 30 mA RCD, three-phase SPD |
| 22 kW AC | Three phase, 32 A | Four-pole isolator, 40 A four-pole MCB, four-pole 30 mA RCD, three-phase SPD |
| 30–60 kW DC | Three-phase LT, about 50–100 A | MCCB of about 63–125 A with the earth-fault protection the maker asks for, SPD and energy meter, often in a feeder pillar |

Chargers above 60 kW are usually fed from their own LT panel. See [DC fast charger installation](/services/dc-fast-charger-installation/).

## Which RCD: Type A or Type B

Not every RCD can protect an EV charger.

- **Type AC**, the ordinary RCCB found in many homes, detects only plain AC leakage. It is not suitable for an EV charger.
- **Type A** also detects pulsing DC leakage. But smooth DC leakage above about 6 mA, which a charger can produce during a fault, can blind it so that it fails to trip.
- So a charger needs either **a Type A RCD with 6 mA DC detection**, which is often built into the charger itself, **or a Type B RCD**, which detects smooth DC leakage on its own.

The charger maker's manual names the type, and we fit what it names. Each AC charger gets its own 30 mA RCD or RCBO, so a fault on one charger doesn't switch off the others.

State rules point the same way. Maharashtra's Chief Electrical Inspector, for example, asks for RCDs of 30 mA or less that perform at least as well as Type A, a surge protection device upstream of the RCD, and an emergency push button at the incomer of public charging stations ([safety advisory for EV charging stations](https://www.ceimah.in/uploads/cie/gallery/media/283_CEI%20_%20Safety%20Advisory_%20Standard%20Operating%20Procedure%20for%20EV%20Charging%20Stations%20%28EVCS%29%20across%20Maharashtra_organized.pdf)).

## Surge protection

Monsoon lightning and grid switching send voltage spikes down the supply, and a charger's electronics are sensitive to them. An SPD clamps those spikes and sends them to earth.

- **A Type 2 SPD** suits most charger DB boxes. **A Type 1+2 SPD** goes where the building has a lightning conductor, or the supply arrives on exposed overhead lines.
- **It sits upstream of the RCD,** with short, straight connections, so a surge sent to earth doesn't trip the RCD on its way.
- **It needs a sound earth** to work. See [earthing for EV chargers](/services/ev-charger-earthing/).

Many SPDs have a small window that changes colour when the device needs replacing. Look at it after a big storm.

## Sub-meters and billing

A sub-meter records the units a charger uses. It doesn't replace your DISCOM's meter; it is for your own records and billing.

- **Housing societies:** when a resident's charger runs from the society's common supply, a sub-meter lets the society bill that resident for exactly what they used. A charger on the resident's own flat meter needs none. See [housing societies](/for/housing-societies/).
- **Offices and fleets:** a meter for each charger shows what each one uses.
- **Meters with a data port:** a meter with an RS-485 (Modbus) port can be read by billing software or a load manager.

## Enclosure and IP rating

An IP rating has two digits: the first for dust, the second for water.

- **Indoors and dry:** a standard indoor DB is enough.
- **Covered parking and basements:** IP54 or IP55, protected against dust, and against splashing water (IP54) or the water jets used to clean floors (IP55).
- **Open to rain and sun:** IP65, which is dust-tight and keeps out water jets, in a UV-stable enclosure, with a hood where the sun is harsh.
- **Coastal sites, such as Chennai or Mumbai:** a non-metallic or well-coated box that won't rust in salty air.

An IP rating doesn't make a box safe under water. In a basement that floods, the box and every cable joint go above the highest water level. Cables enter from below through proper glands, so the rating holds.

## Single phase or three phase

- **Single-phase boxes**, often called SPN DBs, serve 3.3 and 7.4 kW chargers, with a two-pole isolator and RCD that switch the phase and neutral together.
- **Three-phase boxes**, or TPN DBs, use four-pole devices that switch all three phases and the neutral. 11 and 22 kW AC chargers and DC chargers need them.
- **Several single-phase chargers on a three-phase supply** are spread across the three phases, so no one phase is overloaded.

## DB boxes for several chargers, and load management

A society, an office car park or a fleet depot with several chargers needs a main board, often an outdoor feeder pillar, as well as protection for each charger:

- an incomer, usually an MCCB, sized for all the chargers together, with surge protection at the board
- an outgoing way for each charger with its own MCB and RCD, or an RCBO, and a meter where each charger is billed
- spare ways for the chargers you plan to add
- labels and a circuit chart showing which device feeds which charger

When the chargers together could draw more than your supply allows, **load management** keeps the total within your sanctioned load. Static load management sets a fixed maximum current for each charger. Dynamic load management reads the building's load through a sensor or meter at your incomer and slows the chargers whenever the building needs the power. The sensor and its data wiring go in the DB box, so plan them from the start, and check that your chargers support load management before you buy. See [AC and home chargers](/chargers/ac-chargers/).

## Supplied, fitted and tested

We supply DB boxes and switchgear of different brands, chosen for your charger, supply and site, or the make your building or company specifies. Then we:

- mount the box near the charger, where it is easy to reach, clear of parked cars and above flood level
- terminate the cables with glands and crimped lugs, tightened to the maker's torque, and connect the earth bar to a tested earth
- test insulation resistance, trip-test each RCD and record its trip time, and check the SPD
- label every device and leave a circuit chart inside the door

The results go into your handover pack at [commissioning](/services/ev-charger-commissioning/). We are based in Delhi, work in 10 states and have installed more than 500 chargers and DB boxes, AC and DC.

Not sure what your charger needs? The [installation checklist](/tools/installation-checklist/) lists the DB box, cable, earthing and civil work for your charger and site in a minute.
