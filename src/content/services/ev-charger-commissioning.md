---
title: "EV Charger Commissioning: Tests, OCPP, Handover | Proline"
description: "EV charger commissioning for AC and DC chargers of any brand: insulation, earth and RCD tests, OCPP and app setup, a test charge and a handover pack."
label: EV charger commissioning
h1: EV charger commissioning and testing
eyebrow: Commissioning
intro: "EV charger commissioning is the testing and setup that proves a charger is safe and works with its app or CMS before anyone uses it: insulation, earth and RCD tests, voltage and phase checks, network and OCPP settings, and a test charge with a real vehicle. Proline commissions AC, DC and light-EV chargers of any brand and hands over a pack with the results, photos and settings, for charge point operators, charger brands, businesses and homes in 10 states."
keyword: EV charger commissioning
summary: Electrical tests, OCPP and app setup, a test charge and a handover pack.
icon: checkCircle
order: 6
image: ac-pedestal-charger
highlights:
  - Insulation, earth and RCD tests recorded
  - Network, OCPP and app set up
  - Test charge and handover pack
serviceType: EV charger commissioning
need: EV charger installation
form: quote
steps:
  - title: Share the details
    text: The charger model and its manual, your checklist and handover format if you have one, and the network and OCPP details from your CMS or app provider.
  - title: Check before power
    text: A visual inspection, then earth continuity, insulation resistance and earth resistance tests, with the charger's supply off.
  - title: Power up and test
    text: Supply voltage, polarity and phase sequence, neutral-to-earth voltage, the RCD trip test, the protective devices and the emergency stop.
  - title: Configure
    text: The network, the OCPP backend URL and charge point ID, firmware, the current limit, and the tariff or app settings.
  - title: Test charge
    text: A real vehicle charges on every gun, and the session, energy and status are checked on the charger and in the software.
  - title: Hand over
    text: The test results, photos and settings in one pack, and a short session on using the charger safely.
faqs:
  - q: What tests are done when commissioning an EV charger?
    a: "With the supply off: a visual inspection, earth continuity, insulation resistance and earth resistance. With it on: supply voltage, polarity and phase sequence, neutral-to-earth voltage, an RCD trip test, the protective devices, the emergency stop, and the charging cable and gun. Then the network and software settings, and a test charge with a real vehicle."
  - q: Can you commission a charger that someone else installed?
    a: "Yes. We test the installation first, as we would our own, before we power up. If something fails, such as a high earth resistance or the wrong RCD type, we tell you what needs fixing, and we can do the work."
  - q: Can you connect the charger to our CMS?
    a: "Yes. We set up the charger's network and its OCPP connection with the backend URL, charge point ID and security details you give us, then check that a test session, its energy and the charger's status show up in your CMS. If you don't run one yet, [Proline CMS](/cms/) is our own."
  - q: Do you commission to our checklist and handover format?
    a: "Yes. For charge point operators and charger brands we follow your checklist, take the photos you ask for and fill in your handover format, in many cities. See [charge point operators](/for/charge-point-operators/) and [charger brands](/for/charger-brands/)."
  - q: What is in the handover pack?
    a: "The test results with the measured values, photos of the installation, the charger's settings, such as its network, OCPP details, firmware version and current limit, and the maker's manual and warranty papers. The people who will use the charger also get a short session on using it safely."
  - q: Why won't my new charger start a charge?
    a: "Common causes are an earth fault or a high neutral-to-earth voltage, low voltage at the end of a long cable run, a missing phase or the wrong phase sequence on a three-phase charger, or a charger waiting for authorisation from an app, RFID card or CMS it isn't connected to. The car can be the cause too, if a charging schedule or charge limit is set. Commissioning checks each of these before handover."
related:
  - /cms/
  - /for/charge-point-operators/
  - /for/charger-brands/
  - /services/ev-charger-earthing/
  - /services/ev-charger-installation/
  - /tools/installation-checklist/
updated: 2026-10-24
---

## What commissioning proves

Installation puts a charger on the wall or plinth. Commissioning proves it is ready for drivers, and records the evidence:

- **It is safe.** The earth, insulation and protection pass their tests, and the readings are written down.
- **It is set up right.** Voltage, phase sequence, current limit, network and firmware suit the charger's manual and the site.
- **It works with its software.** Sessions start and stop from the app or CMS, and energy and status reach the operator.
- **It is documented.** A handover pack shows what was tested, the values found and how the charger is set.

We commission every charger we install, AC and DC, of any brand. On DC chargers it follows the panel, cable and foundation work described on [DC fast charger installation](/services/dc-fast-charger-installation/).

## The commissioning test checklist

Tests with the supply off come first, so a fault is found before power is applied. The live tests follow.

| Test | What we check |
|---|---|
| **Visual inspection** | Mounting, clearances, glands and terminations, labels, covers and seals, and that the breaker and RCD match the design |
| **Earth continuity** | A sound, low-resistance path from the charger's body and the DB box to the main earth bar and the earth pit |
| **Insulation resistance** | The supply cable, between its conductors and from each conductor to earth, tested with an insulation tester. The charger's electronics and the surge protection are disconnected first, so the test voltage can't damage them or spoil the reading |
| **Earth resistance** | The earth pit, tested with an earth resistance tester and recorded against its target. See [earthing](/services/ev-charger-earthing/) |
| **Polarity and phase sequence** | Live and neutral the right way round on single phase; on three phase, every phase present, in the sequence the charger's manual asks for |
| **Supply voltage** | Voltage at the charger with no load and during the test charge, within the charger's input range, and neutral-to-earth voltage within the maker's limit |
| **RCD trip test** | The RCD is the type the manual asks for, often Type A with 6 mA DC detection or Type B, and an RCD tester shows it trips at its rated current within the time its standard allows |
| **Protective devices** | Breaker ratings match the cable and the charger, surge protection is fitted and healthy, and terminals are tightened to the torque their maker gives |
| **Emergency stop** | On chargers that have one, pressing it during a session stops charging and cuts the output, and the charger resets properly afterwards |
| **Cable and gun** | The charging cable and connector are undamaged, the gun locks in the car's inlet while charging and releases after, and the holster keeps it off the ground |

The charger maker's manual comes first. Beyond it, the work follows the CEA safety regulations and the Indian Standards that apply, such as IS 17017 for EV charging, IS 732 for wiring and IS 3043 for earthing.

## Configuration: network, OCPP, firmware and tariff

- **Network.** The charger's 4G SIM, Wi-Fi or wired connection, with the signal checked where it stands.
- **OCPP.** Most networked chargers talk to their charge management system (CMS) over OCPP, the open protocol for this. We enter the backend URL, the charge point ID and the security settings your CMS asks for, and check that the CMS accepts the charger.
- **Firmware.** Updated to the version the maker or operator has approved, before the charger goes live.
- **Current limit.** Set to suit the breaker, the cable and your sanctioned load. Where the charger has load management, its sensor is fitted and set up.
- **Tariff or app.** On a networked charger, the price per kWh and any time-of-day rates are set in the CMS, and the test charge shows whether the session is billed at the right rate. At home, we pair the maker's app with your phone and set any charging schedule you want.
- **Access.** RFID cards registered, or the charger set to start without a card for private use, as the site needs.

If the chargers run on [Proline CMS](/cms/), its technician app takes the crew through commissioning in eight guided steps on a phone, binds each QR sticker to its gun with a real plug-in, and proves each gun with a small test payment.

## The test charge

Tests on their own don't prove a charger works with a car, so each gun gets a test charge with a real vehicle. At home it is your own car; on other sites we agree beforehand which vehicle will be used. We check that:

- the session starts the way drivers will start it: plug-in, app, RFID card or QR code
- the car takes the power expected for its on-board charger or battery, and the voltage holds up under load
- the energy reading climbs on the charger and in the CMS, and status changes reach the operator
- the session stops cleanly, from the car and from the software, and the gun releases

## The handover pack

Every charger we commission comes with a handover pack:

- **Test results:** each test, the value measured and the target it was checked against, with the date.
- **Photos:** the charger, the DB box or panel with its cover open, the terminations, the earth pit chamber, the cable route and the charger's nameplate with its serial number.
- **Settings:** network details, the OCPP backend URL and charge point ID, the firmware version and the current limit.
- **Documents:** the maker's manual and warranty papers, and the maker's own commissioning form where it has one.
- **Training:** a short session for the owner or site staff on starting and stopping a charge, the emergency stop, what the charger's lights and error codes mean, resetting a tripped RCD, and the number to call.

## Commissioning for charge point operators and charger brands

Operators and brands need the same result on every site, whoever does the work. Where you have your own checklist, we commission to it:

- your test sheet, with the pass values you set
- your photo list, file names and upload to your portal or shared folder
- your OCPP settings, with your operations team bringing each charger online in your CMS
- your handover format, signed off on site

The job is done when the charger shows online in your CMS and a test session has completed. For brands, every unit your customers buy is commissioned and documented the same way, which helps when a warranty claim comes in later. See [charge point operators](/for/charge-point-operators/) and [charger brands](/for/charger-brands/).

After handover, an [EV charger AMC](/services/ev-charger-amc/) repeats the key tests on planned visits and records them, so faults are caught early.

We are based in Delhi and commission chargers in all 10 states we work in. We have installed more than 500 chargers and DB boxes, AC and DC, including work for TATA, ThunderPlus, Bolt.Earth and KIA.

Planning the installation too? The [installation checklist](/tools/installation-checklist/) lists the cable, earthing, DB box and civil work your charger needs in a minute.
