"""Car charger pages added on 15 Nov 2026 (owner: "add more cars ... many popular ones missing ... like Tata Curvv").
Picked from 2026 EV sales (Vahan, Autocar Professional, EVFY): Tata Curvv.ev, Tiago.ev, Harrier.ev, Mahindra XEV 9e,
XEV 9S, MG ZS EV, Comet EV, Maruti e Vitara, Kia Carens Clavis EV, VinFast VF6.
Every figure comes from the maker's page (or, where the maker's page has none, a named secondary source); the source
line at the end of each page says which. Run from the repo root: python3 scripts/cars/new-cars-2026-11-15.py
"""
import yaml

STEPS = [
    {"title": "Send photos", "text": "WhatsApp photos of your meter, main DB, electricity bill, parking spot and the charger's box or label. For most homes this is enough to plan the job."},
    {"title": "Plan and quote", "text": "We tell you the cable route, DB box, earthing and any permission the job needs, with one clear quote. If the photos leave questions, we suggest a site survey; it is paid, and the fee is adjusted against your order if you go ahead."},
    {"title": "Permissions", "text": "In a housing society, you apply for the NOC with the technical details we give you. For a separate EV connection, we tell you what to prepare for your DISCOM."},
    {"title": "Installation", "text": "We lay the cable, fit the DB box and earth, and mount the charger where its cable reaches your car's charging port, following the maker's manual."},
    {"title": "Test and handover", "text": "Insulation, earth and RCD tests, app setup, a test charge with your car, and a handover pack with the results and photos."},
]
COST = [
    "**Cable run:** the distance from your meter or DB to the parking spot, and how the cable is routed",
    "**Earthing:** a new earth pit or a tested connection to a good existing one",
    "**Protection:** a DB box with MCB and RCD sized for the charger",
    "**Civil work:** a trench, core cut or cable tray where the route needs it",
    "**Supply:** whether your sanctioned load covers the charger or needs an increase",
    "**Society rules:** approvals and the cable path in a shared parking area",
]
RELATED = ["/services/home-ev-charger-installation/", "/services/ev-charger-earthing/", "/chargers/ac-chargers/", "/for/housing-societies/"]
INSTALL_FAQ = lambda maker: {"q": f"Do you install a charger I bought from {maker} or another brand?", "a": "Yes. We install chargers of any brand, including one supplied with your car, and follow the maker's manual for cable size, protection and earthing."}

SUPPLY_1PH = """## Will your electricity connection take it?

A 7.2–7.4 kW wall box runs on a normal single-phase supply and draws about 32 A while it charges. Whether your connection can carry that depends on your sanctioned load and what else runs at the same time, such as air conditioners or a geyser. We check this from your electricity bill and photos of the meter. If the load is tight, the options are a load increase from your DISCOM, a lower current setting on the charger, or a charger with load management."""

SUPPLY_3PH = """## Single-phase or three-phase?

An 11 kW-class charger takes its power across three phases, so it needs a three-phase connection. On a normal single-phase supply, a 7.2–7.4 kW wall box is the one that fits: it draws about 32 A while it charges. If you want the faster charger and have single-phase power, a three-phase connection means an application to your DISCOM and often a load increase. We check your meter and bill before you decide, and for most owners the slower charger is enough, because the car is parked at home for longer than its charging time."""

INSTALL = """## How we install it

Every wall box goes on its own circuit from your meter or DB, with an MCB and the right type of RCD in a [DB box](/services/ev-charger-db-box/), and a [tested earth](/services/ev-charger-earthing/). If the car's portable charger is your backup, use it only from a dedicated 15/16 A socket with its own breaker, RCD and earth, not a shared plug point. The steps are below."""

SOCIETY = lambda car: f"""## In a housing society

Most {car} owners in apartments charge in the basement. The cable usually runs from your own meter in the meter room to your parking slot, and the society's permission comes first. Our page for [housing societies](/for/housing-societies/) explains the usual approvals and how shared chargers can work."""

BEFORE_BUY = lambda c: f"""## Before you buy a wall box

- **Match the car.** A charger only charges as fast as the car accepts on AC. The times above are the ones {c['maker']} quotes, so a bigger charger than those figures assume costs more without charging faster.
- **Check the supply.** Single-phase homes suit a 7.2–7.4 kW wall box; 11 kW-class chargers need three-phase.
- **Plan the cable.** Measure from your meter or DB to where the car's charging port sits when it is parked. The cable size grows with the distance.
- **Keep the records.** We hand over the test results and photos of the installation, which help with any warranty claim later."""

SEND_US = lambda c: f"""## What to send us

To tell you which charger fits and give you one clear quote, we need:

1. A photo of your electricity meter, which shows whether your supply is single-phase or three-phase.
2. A recent electricity bill, which shows your sanctioned load.
3. Photos of the main DB and the parking spot, and the path a cable would take between them.
4. Which {c['label']} battery you have, and the charger {c['maker']} supplied, if any."""

TATA_INSTALL = "Tata offers complimentary home-charger installation with eligible cars. Its [charging support page](https://ev.tatamotors.com/charging-support.html) says that installation does **not** include earthing or civil work, which are the two things that most often hold up a safe installation: an earth pit where the building's earth is not good enough, and a trench, core cut or cable tray where the parking spot is far from the meter. We do that part."


def table(head, rows):
    out = ["| " + " | ".join(head) + " |", "| " + " | ".join("---" for _ in head) + " |"]
    out += ["| " + " | ".join(r) + " |" for r in rows]
    return "\n".join(out)


CARS = [
 dict(slug="tata-curvv-ev", label="Tata Curvv.ev", maker="Tata", order=6, art="wallbox-7",
  title="Tata Curvv EV Home Charger Advice | Proline", keyword="tata curvv ev charger",
  description="Check the right home charger for your Tata Curvv.ev, Tata's charging times for the 45 and 55 kWh batteries, and what your parking and supply need.",
  h1="Tata Curvv EV charger at home, chosen and installed",
  intro="For a Tata Curvv EV charger at home, a 7.2–7.4 kW AC wall box is the right size. Tata lists 10–100% in 7.25 hours for the 45 kWh Curvv.ev and 7.6 hours for the 55 kWh one on a 7.2 kW wall box. Proline installs it on its own circuit, including the earthing and civil work that Tata's complimentary installation leaves out.",
  summary="The right home charger for the Curvv.ev, and what installing it involves.",
  highlights=["A 7.2–7.4 kW wall box charges either battery overnight", "Earthing and civil work Tata's complimentary installation leaves out", "Any brand of charger installed, including Tata's own"],
  faqs=[
   {"q": "Which home charger suits the Tata Curvv.ev?", "a": "A 7.2–7.4 kW AC wall box on its own circuit. Tata gives its home charging figures for a 7.2 kW wall box: 10–100% in 7.25 hours for the 45 kWh battery and 7.6 hours for the 55 kWh battery. Check your booking papers for the charger that came with your car."},
   {"q": "How long does the Curvv.ev take to charge from a normal socket?", "a": "Tata lists 17.5 to 21 hours for a full charge from a standard 15 A socket, depending on the variant. That works as a backup or for short daily drives, but only from a dedicated 15/16 A socket with its own breaker and earthing."},
   {"q": "How fast does the Curvv.ev charge on a DC fast charger?", "a": "Tata quotes 10–80% in about 40 minutes at up to 70 kW. The time depends on the power of the public charger you use."},
   {"q": "Tata installed my charger. What else might I need?", "a": "Tata's charging support page says its complimentary home-charger installation does not include earthing or civil work. If your parking needs an earth pit, a trench or a long cable run, we do that part."},
   INSTALL_FAQ("Tata"),
  ],
  body=lambda c: "\n\n".join([
   "## Which charger the Curvv.ev needs\n\nThe Curvv.ev charges at home in two ways, and Tata publishes the time for each:",
   table(["Way to charge", "What you need", "Tata's figure"], [
    ["15 A socket", "A dedicated 15/16 A socket with its own breaker and earthing", "17.5–21 hours for a full charge, depending on variant"],
    ["AC wall box", "A 7.2–7.4 kW wall box on its own circuit", "10–100% in 7.25 hours (45 kWh) or 7.6 hours (55 kWh)"],
    ["DC fast charger", "A public DC fast charger", "10–80% in about 40 minutes, at up to 70 kW"]]),
   "For most owners the answer is a **7.2–7.4 kW AC wall box** at home, with DC fast charging on trips. Tata gives its home figures for a 7.2 kW wall box, so an 11 kW or 22 kW charger costs more without a good reason; spend the difference on a sound installation instead.",
   "## What Tata's complimentary installation leaves out\n\n" + TATA_INSTALL,
   SUPPLY_1PH, BEFORE_BUY(c), INSTALL, SEND_US(c), SOCIETY("Curvv.ev"),
   "Charging figures are from Tata.ev's [Curvv.ev specifications page](https://ev.tatamotors.com/curvv/ev/specifications.html), checked on 15 Nov 2026."])),

 dict(slug="tata-tiago-ev", label="Tata Tiago.ev", maker="Tata", order=7, art="wallbox-7",
  title="Tata Tiago EV Home Charger Advice | Proline", keyword="tata tiago ev charger",
  description="Check the home charger for your Tata Tiago.ev: the 3.3 kW wall box Tata supplies, the faster 7.2 kW option, charging times and what your supply needs.",
  h1="Tata Tiago EV charger at home: 3.3 kW or 7.2 kW",
  intro="For a Tata Tiago EV charger at home, Tata supplies a 3.3 kW AC wall box and a portable cable for a 15 A socket. Tata lists 6.9 hours (19.2 kWh) and 8.7 hours (24 kWh) on the 3.3 kW wall box, and 2.6 and 3.6 hours on a 7.2 kW AC fast charger. Proline installs either one on its own circuit, with earthing.",
  summary="The 3.3 kW and 7.2 kW home options for the Tiago.ev, and installing them.",
  highlights=["Tata supplies a 3.3 kW wall box and a 15 A portable cable", "A 7.2 kW AC charger takes well under half the time", "Own circuit, protection and a tested earth"],
  faqs=[
   {"q": "Which charger comes with the Tata Tiago.ev?", "a": "Tata's Tiago.ev FAQ says the car comes with a 3.3 kW AC wall box charger, plus a portable charging cable for a standard 15 A plug point."},
   {"q": "How long does the Tiago.ev take to charge at home?", "a": "Tata lists 6.9 hours for the 19.2 kWh battery and 8.7 hours for the 24 kWh battery, on the 3.3 kW wall box or a 15 A plug point. On a 7.2 kW AC fast charger the figures are 2.6 and 3.6 hours."},
   {"q": "Is a 7.2 kW charger worth it for the Tiago.ev?", "a": "Only if you drive a lot or need quick top-ups at home. The 3.3 kW wall box fills either battery overnight. A 7.2 kW charger needs its own heavier circuit and draws about 32 A, so we check your sanctioned load first."},
   {"q": "Does the Tiago.ev take DC fast charging?", "a": "Yes. Tata quotes 10–80% in 35 minutes on a 30 kW DC fast charger, for both batteries."},
   INSTALL_FAQ("Tata"),
  ],
  body=lambda c: "\n\n".join([
   "## Which charger the Tiago.ev needs\n\nTata publishes the charging time for each way of charging the Tiago.ev:",
   table(["Way to charge", "19.2 kWh battery", "24 kWh battery"], [
    ["15 A plug point (portable cable)", "6.9 hours", "8.7 hours"],
    ["3.3 kW AC wall box (supplied)", "6.9 hours", "8.7 hours"],
    ["7.2 kW AC fast charger", "2.6 hours", "3.6 hours"],
    ["30 kW DC fast charger, 10–80%", "35 minutes", "35 minutes"]]),
   "For most owners the **3.3 kW wall box** that Tata supplies is enough: it fills either battery overnight. A **7.2 kW AC charger** makes sense if you drive long distances most days or share the car; it needs its own heavier circuit. The portable cable is a backup, and only from a dedicated 15/16 A socket with its own breaker and earth.",
   "## What Tata's complimentary installation leaves out\n\n" + TATA_INSTALL,
   SUPPLY_1PH, BEFORE_BUY(c), INSTALL, SEND_US(c), SOCIETY("Tiago.ev"),
   "Charging figures are from Tata.ev's [Tiago.ev FAQ](https://ev.tatamotors.com/tiago/ev/next-gen/faqs.html), checked on 15 Nov 2026."])),

 dict(slug="tata-harrier-ev", label="Tata Harrier.ev", maker="Tata", order=8, art="wallbox-7",
  title="Tata Harrier EV Home Charger Advice | Proline", keyword="tata harrier ev charger",
  description="Check the home charger for your Tata Harrier.ev: 7.2 kW AC charging times for the 65 and 75 kWh batteries, DC fast charging, and installing it right.",
  h1="Tata Harrier EV charger at home, chosen and installed",
  intro="For a Tata Harrier EV charger at home, a 7.2–7.4 kW AC wall box is the right size. By Tata's figures, a 7.2 kW charger takes the 65 kWh Harrier.ev from 10 to 100% in 9.3 hours and the 75 kWh one in 10.7 hours. Proline installs it on its own circuit, including the earthing and civil work that Tata's complimentary installation leaves out.",
  summary="The right home charger for the Harrier.ev, and what installing it involves.",
  highlights=["A 7.2–7.4 kW wall box charges it overnight", "Earthing and civil work Tata's complimentary installation leaves out", "Any brand of charger installed, including Tata's own"],
  faqs=[
   {"q": "Does the Harrier.ev come with a home charger?", "a": "Some versions are sold with a 7.2 kW AC fast charger; their variant name ends in \"ACFC\". Check your booking papers to see what your car came with."},
   {"q": "How long does the Harrier.ev take to charge at home?", "a": "Tata's figures on a 7.2 kW AC charger are 10–100% in 9.3 hours for the 65 kWh battery and 10.7 hours for the 75 kWh battery, rear- or all-wheel drive."},
   {"q": "How fast does the Harrier.ev charge on a DC fast charger?", "a": "Tata quotes 20–80% in about 25 minutes on a 100–120 kW DC fast charger. The time depends on the power of the public charger you use."},
   {"q": "Tata installed my charger. What else might I need?", "a": "Tata's charging support page says its complimentary home-charger installation does not include earthing or civil work. If your parking needs an earth pit, a trench or a long cable run, we do that part."},
   INSTALL_FAQ("Tata"),
  ],
  body=lambda c: "\n\n".join([
   "## Which charger the Harrier.ev needs\n\nTata publishes these charging times for the Harrier.ev:",
   table(["Battery", "7.2 kW AC charger, 10–100%", "DC fast charger, 20–80%"], [
    ["65 kWh, rear-wheel drive", "9.3 hours", "About 25 minutes (100 kW)"],
    ["75 kWh, rear-wheel drive", "10.7 hours", "About 25 minutes (120 kW)"],
    ["75 kWh, all-wheel drive", "10.7 hours", "–"]]),
   "For most owners the answer is a **7.2–7.4 kW AC wall box** at home, with DC fast charging on trips. Even the 75 kWh battery fills overnight. Tata gives its home figures for a 7.2 kW charger, so ask before you pay for a bigger AC charger: it only helps if the car accepts more power.",
   "## What Tata's complimentary installation leaves out\n\n" + TATA_INSTALL,
   SUPPLY_1PH, BEFORE_BUY(c), INSTALL, SEND_US(c), SOCIETY("Harrier.ev"),
   "Charging figures are Tata's, as reported by [Autocar India](https://www.autocarindia.com/car-news/tata-harrier-ev-65-range-revealed-435841) and [CarDekho](https://www.cardekho.com/india-car-news/tata-harrier-ev-variantwise-powertrain-options-detailed-34680.htm), checked on 15 Nov 2026."])),

 dict(slug="mahindra-xev-9e", label="Mahindra XEV 9e", maker="Mahindra", order=9, art="wallbox-11",
  title="Mahindra XEV 9e Home Charger Advice | Proline", keyword="mahindra xev 9e charger",
  description="Check the home charger for your Mahindra XEV 9e: 7.2 kW or 11.2 kW, which supply each needs, the charging times and what installing it involves.",
  h1="Mahindra XEV 9e charger at home, 7.2 kW or 11.2 kW",
  intro="For a Mahindra XEV 9e charger at home, Mahindra offers 7.2 kW and 11.2 kW wall chargers as options with the car. Mahindra's figures for the same 79 kWh battery in the BE 6 are about 11.7 hours for a full charge on 7.2 kW and 8 hours on 11.2 kW; the 11.2 kW charger needs a three-phase supply. Proline installs either one, with its own circuit and earthing.",
  summary="7.2 kW or 11.2 kW for the XEV 9e, the charging times, and installing it.",
  highlights=["7.2 kW for single-phase homes, 11.2 kW for three-phase", "Own circuit, protection and a tested earth", "Any brand of charger installed, including Mahindra's"],
  faqs=[
   {"q": "Does the XEV 9e come with a home charger?", "a": "Mahindra's XEV 9e leaflet says the car is billed with either a 7.2 kW or an 11.2 kW charger at extra cost, and its FAQ says the starting price does not include the charger or installation. The Cineluxe Edition includes a 3.3 kW portable charger. Check your booking papers."},
   {"q": "How long does the XEV 9e take to charge at home?", "a": "Mahindra's XEV 9e leaflet does not give AC times. For the same 59 kWh and 79 kWh batteries in the BE 6, Mahindra lists 8.7 and 11.7 hours on the 7.2 kW charger, and 6 and 8 hours on the 11.2 kW charger, for 0–100%."},
   {"q": "Do I need three-phase power for the 11.2 kW charger?", "a": "Yes. An 11 kW-class AC charger draws its power across three phases. On a single-phase connection the 7.2 kW charger is the right choice. We check your bill and meter before you decide."},
   {"q": "How fast does the XEV 9e charge on a DC fast charger?", "a": "Mahindra quotes 20–80% in 20 minutes: on a 140 kW charger for the 59 kWh battery and a 175 kW charger for the 79 kWh battery."},
   INSTALL_FAQ("Mahindra"),
  ],
  body=lambda c: "\n\n".join([
   "## Charging times by battery and charger\n\nMahindra's XEV 9e leaflet lists the two wall chargers but not their AC charging times. The XEV 9e uses the same 59 kWh and 79 kWh batteries as the BE 6, for which Mahindra publishes these 0–100% times:",
   table(["Battery", "7.2 kW charger", "11.2 kW charger"], [["59 kWh", "8.7 hours", "6 hours"], ["79 kWh", "11.7 hours", "8 hours"]]),
   "On public DC fast chargers, Mahindra quotes 20–80% in 20 minutes for the XEV 9e: on a 140 kW charger for the 59 kWh battery and a 175 kW charger for the 79 kWh battery.",
   "## 7.2 kW or 11.2 kW: how to choose\n\nThe XEV 9e charges faster on the 11.2 kW charger, so the choice is a real one:\n\n- **7.2 kW charger.** Runs on a normal single-phase supply and draws about 32 A. Even the 79 kWh battery charges fully overnight. This suits most homes.\n- **11.2 kW charger.** Needs a three-phase supply and saves a few hours on a full charge. It suits homes and offices that already have three-phase power, or owners who drive long distances most days.",
   "## What Mahindra supplies\n\nMahindra's leaflet says the XEV 9e is billed with either a 7.2 kW or an 11.2 kW charger at extra cost, and its FAQ says the starting price does not include the charger or installation costs. The Cineluxe Edition includes a 3.3 kW portable charger as standard. If the dealer arranges installation, ask what it includes; we can do the part it leaves out.",
   SUPPLY_3PH, BEFORE_BUY(c), INSTALL, SEND_US(c), SOCIETY("XEV 9e"),
   "Figures are from Mahindra's [XEV 9e leaflet](https://www.mahindraelectricsuv.com/on/demandware.static/-/Library-Sites-eSUVSharedLibrary/default/dwbe1e0571/Xev-9e/XEV-9E-Digital-leaflet.pdf) and [electric SUV FAQ](https://www.mahindraelectricsuv.com/faq.html), with AC times for the same batteries from Mahindra's BE 6 brochure, checked on 15 Nov 2026."])),

 dict(slug="mahindra-xev-9s", label="Mahindra XEV 9S", maker="Mahindra", order=10, art="wallbox-11",
  title="Mahindra XEV 9S Home Charger Advice | Proline", keyword="mahindra xev 9s charger",
  description="Check the home charger for your Mahindra XEV 9S: the 11.2 kW charger in its variant prices, the 7.2 kW option, charging times and installation needs.",
  h1="Mahindra XEV 9S charger at home, 11.2 kW or 7.2 kW",
  intro="For a Mahindra XEV 9S charger at home, Mahindra's variant prices include an 11.2 kW wall charger, and a 3.3 kW portable charger comes as standard. For the 79 kWh battery, the 11.2 kW charger gives a full charge in about 8 hours, against about 11.7 hours on a 7.2 kW charger, but it needs a three-phase supply. Proline installs either one, with its own circuit and earthing.",
  summary="The 11.2 kW and 7.2 kW home options for the XEV 9S, and installing them.",
  highlights=["11.2 kW for three-phase homes, 7.2 kW for single-phase", "3.3 kW portable charger as standard", "Own circuit, protection and a tested earth"],
  faqs=[
   {"q": "Which charger comes with the Mahindra XEV 9S?", "a": "Mahindra's FAQ says a 3.3 kW portable charger is included as standard, and the listed variant prices include the 11.2 kW charger. You can instead choose a no-charger (NCH) variant and buy a 7.2 kW charger as an accessory."},
   {"q": "How long does the XEV 9S take to charge at home?", "a": "For the 79 kWh battery, about 8 hours from 0 to 100% on the 11.2 kW charger and about 11.7 hours on a 7.2 kW charger. The smaller batteries take less time."},
   {"q": "My home has single-phase power. Which charger should I take?", "a": "The 7.2 kW charger. The 11.2 kW charger needs a three-phase supply; getting one means an application to your DISCOM and often a load increase. For most owners 7.2 kW is enough, because the car is parked at home for longer than its charging time."},
   {"q": "How fast does the XEV 9S charge on a DC fast charger?", "a": "Mahindra says it charges from 20% to 80% in about 20 minutes on a compatible DC fast charger, with DC charging of up to 180 kW."},
   INSTALL_FAQ("Mahindra"),
  ],
  body=lambda c: "\n\n".join([
   "## Charging times\n\nFor the 79 kWh XEV 9S, the published 0–100% times are:",
   table(["Charger", "79 kWh battery"], [["11.2 kW wall charger (three-phase)", "About 8 hours"], ["7.2 kW wall charger (single-phase)", "About 11.7 hours"], ["DC fast charger, 20–80%", "About 20 minutes, at up to 180 kW"]]),
   "The 59 kWh and 70 kWh batteries take less time on the same chargers.",
   "## What Mahindra supplies\n\nMahindra's FAQ says a **3.3 kW portable charger** is included as standard, and that the listed variant prices **include the 11.2 kW charger**. If your home has single-phase power, you can choose a no-charger (NCH) variant and buy a **7.2 kW charger** as an accessory instead. The portable charger is a backup: use it only from a dedicated 15/16 A socket with its own breaker, RCD and earth.",
   SUPPLY_3PH, BEFORE_BUY(c), INSTALL, SEND_US(c), SOCIETY("XEV 9S"),
   "Figures are from Mahindra's [electric SUV FAQ](https://www.mahindraelectricsuv.com/faq.html) and the XEV 9S specifications listed by [Autocar India](https://www.autocarindia.com/cars/mahindra/xev-9s/pack-two-above-79kwh), checked on 15 Nov 2026."])),

 dict(slug="mg-zs-ev", label="MG ZS EV", maker="MG", order=11, art="wallbox-7",
  title="MG ZS EV Home Charger Advice | Proline", keyword="mg zs ev charger",
  description="Check the home charger for your MG ZS EV: the 7.4 kW AC charging time for its 50.3 kWh battery, DC fast charging, and what your supply needs.",
  h1="MG ZS EV charger at home, installed safely",
  intro="For an MG ZS EV charger at home, a 7.4 kW AC wall box is the right size. MG lists 8.5 to 9 hours for a full charge of the 50.3 kWh battery on a 7.4 kW charger. Proline installs it, or any other wall box, on its own circuit with earthing and a safe cable route.",
  summary="The 7.4 kW wall box for the ZS EV, and what installing it involves.",
  highlights=["A 7.4 kW wall box charges it overnight", "Own circuit, protection and a tested earth", "Any brand of charger installed, including MG's"],
  faqs=[
   {"q": "How long does the MG ZS EV take to charge at home?", "a": "MG's specification table lists 8.5 to 9 hours for 0–100% on a 7.4 kW AC charger; its FAQ says about 9 to 10 hours. Plan on a night's charge."},
   {"q": "Does the MG ZS EV come with a home charger?", "a": "MG's ZS EV page does not say. Ask your dealer whether a wall box was supplied with your car; if it was, we install it."},
   {"q": "How fast does the ZS EV charge on a DC fast charger?", "a": "The India-spec ZS EV takes DC charging of up to 50 kW. MG's specification table says about 60 minutes to 80%; its FAQ says about 50 minutes."},
   {"q": "Will an 11 kW charger charge my ZS EV faster?", "a": "MG gives its home charging figures for a 7.4 kW AC charger, which runs on a normal single-phase supply. Ask us before you pay for a bigger charger: it only helps if the car accepts more power."},
   INSTALL_FAQ("MG"),
  ],
  body=lambda c: "\n\n".join([
   "## Which charger the ZS EV needs\n\nMG publishes these charging figures for the ZS EV's 50.3 kWh battery:",
   table(["Way to charge", "What you need", "MG's figure"], [
    ["AC wall box", "A 7.4 kW wall box on its own circuit", "0–100% in 8.5 to 9 hours (FAQ: about 9 to 10 hours)"],
    ["DC fast charger", "A public CCS2 charger, up to 50 kW", "About 60 minutes to 80% (FAQ: about 50 minutes)"]]),
   "For most owners the answer is a **7.4 kW AC wall box** at home, charging overnight, with DC fast charging on trips. The car has a Type 2 inlet for AC and CCS2 for DC.",
   "## What MG supplies\n\nMG's ZS EV page does not say whether a wall box comes with the car; it links to MG's own EV charger installation guide. Ask your dealer what your car came with. If MG arranges the installation, ask what it includes; we can do the earthing, civil work or long cable run it leaves out.",
   SUPPLY_1PH, BEFORE_BUY(c), INSTALL, SEND_US(c), SOCIETY("ZS EV"),
   "Figures are from MG Motor India's [ZS EV page](https://www.mgmotor.co.in/vehicles/mgzsev-electric-car-in-india), checked on 15 Nov 2026."])),

 dict(slug="mg-comet-ev", label="MG Comet EV", maker="MG", order=12, art="wallbox-7",
  title="MG Comet EV Home Charger Advice | Proline", keyword="mg comet ev charger",
  description="Check the home charger for your MG Comet EV: 3.3 kW or 7.4 kW AC, which variants take the faster charger, the charging times and a safe installation.",
  h1="MG Comet EV charger at home: 3.3 kW or 7.4 kW",
  intro="For an MG Comet EV charger at home, a 3.3 kW charger fills the 17.4 kWh battery in about 7 hours, by MG's figures. The Excite FC and Exclusive FC variants also take a 7.4 kW AC charger, which does it in about 3.5 hours. Proline installs either one on its own circuit, with earthing.",
  summary="The 3.3 kW and 7.4 kW home options for the Comet EV, and installing them.",
  highlights=["3.3 kW fills the battery overnight", "7.4 kW AC on the Excite FC and Exclusive FC", "Own circuit, protection and a tested earth"],
  faqs=[
   {"q": "How long does the MG Comet EV take to charge at home?", "a": "MG lists 0–100% in 7 hours on a 3.3 kW charger (0–80% in 5.5 hours). On the FC variants with a 7.4 kW charger it is 0–100% in 3.5 hours."},
   {"q": "Which Comet EV variants take the 7.4 kW charger?", "a": "MG lists AC fast charging only for the Excite FC and Exclusive FC variants. The other variants charge at 3.3 kW, so a bigger charger would not charge them any faster."},
   {"q": "Does the Comet EV take DC fast charging?", "a": "No. The Comet EV charges on AC only, so home charging is how most owners charge it."},
   {"q": "Can I charge the Comet EV from a normal socket?", "a": "Only from a dedicated 15/16 A socket with its own breaker, RCD and earth, not a shared plug point. We install that socket in a DB box if you need one."},
   INSTALL_FAQ("MG"),
  ],
  body=lambda c: "\n\n".join([
   "## Which charger the Comet EV needs\n\nMG publishes these times for the Comet EV's 17.4 kWh battery:",
   table(["Charger", "0–80%", "0–100%"], [["3.3 kW AC (all variants)", "5.5 hours", "7 hours"], ["7.4 kW AC (Excite FC and Exclusive FC)", "2.8 hours", "3.5 hours"]]),
   "The Comet EV has no DC fast charging, so home charging is the main way to charge it. With a small battery, the **3.3 kW** option fills it overnight for most owners. If you have an FC variant and want quick top-ups, a **7.4 kW** wall box halves the time; it needs its own heavier circuit.",
   "## What MG supplies\n\nMG's Comet EV page does not say whether a charger comes with the car; it links to MG's own EV charger installation guide. Ask your dealer what your car came with. We install MG's charger or any other brand, with the earthing, civil work or long cable run a dealer installation may leave out.",
   SUPPLY_1PH, BEFORE_BUY(c), INSTALL, SEND_US(c), SOCIETY("Comet EV"),
   "Figures are from MG Motor India's [Comet EV page](https://www.mgmotor.co.in/vehicles/comet-ev-electric-car-in-india), checked on 15 Nov 2026."])),

 dict(slug="maruti-suzuki-e-vitara", label="Maruti e Vitara", maker="Maruti Suzuki", order=13, art="wallbox-7",
  title="Maruti e Vitara Home Charger Advice | Proline", keyword="maruti e vitara charger",
  description="Check the home charger for your Maruti Suzuki e Vitara: 7.4 kW AC charging times for the 49 and 61 kWh batteries, DC charging and installation needs.",
  h1="Maruti e Vitara charger at home, chosen and installed",
  intro="For a Maruti e Vitara charger at home, a 7.4 kW AC wall box is the size Maruti Suzuki quotes. On it, the 49 kWh battery charges from 10 to 100% in about 6 hours 30 minutes and the 61 kWh battery in about 9 hours. Proline installs it on its own circuit, with earthing and a safe cable route.",
  summary="The 7.4 kW wall box for the e Vitara, and what installing it involves.",
  highlights=["A 7.4 kW wall box charges it overnight", "Own circuit, protection and a tested earth", "Any brand of charger installed"],
  faqs=[
   {"q": "How long does the Maruti e Vitara take to charge at home?", "a": "On a 7.4 kW AC home charger, Maruti Suzuki quotes about 6 hours 30 minutes from 10 to 100% for the 49 kWh battery and about 9 hours for the 61 kWh battery."},
   {"q": "Does the e Vitara come with a home charger?", "a": "NEXA's e Vitara page does not say. Ask your NEXA dealer what your car came with; we install it, or any other wall box."},
   {"q": "How fast does the e Vitara charge on a DC fast charger?", "a": "For the 61 kWh battery, Maruti Suzuki quotes 10–80% in 45 minutes, and says this needs a DC charger of at least 70 kW."},
   {"q": "Do I need three-phase power?", "a": "No. A 7.4 kW wall box runs on a normal single-phase supply and draws about 32 A. We check your sanctioned load from your bill first."},
   INSTALL_FAQ("Maruti Suzuki"),
  ],
  body=lambda c: "\n\n".join([
   "## Which charger the e Vitara needs\n\nMaruti Suzuki quotes these charging times for the e Vitara:",
   table(["Way to charge", "49 kWh battery", "61 kWh battery"], [["7.4 kW AC home charger, 10–100%", "About 6 hours 30 minutes", "About 9 hours"], ["DC fast charger (at least 70 kW), 10–80%", "–", "45 minutes"]]),
   "For most owners the answer is a **7.4 kW AC wall box** at home, charging overnight, with DC fast charging on trips.",
   "## What Maruti Suzuki supplies\n\nNEXA's e Vitara page gives the charging times for a 7.4 kW home charger but does not say whether one comes with the car. Ask your dealer what yours came with. We install the charger supplied with the car or any other brand, with the earthing, civil work or long cable run a dealer installation may leave out.",
   SUPPLY_1PH, BEFORE_BUY(c), INSTALL, SEND_US(c), SOCIETY("e Vitara"),
   "Figures are from NEXA's [e Vitara variant details](https://www.nexaexperience.com/fragments/evitara/evitara-variant-detail-tab), checked on 15 Nov 2026."])),

 dict(slug="kia-carens-clavis-ev", label="Kia Carens Clavis EV", maker="Kia", order=14, art="wallbox-11",
  title="Kia Carens Clavis EV Home Charger Advice | Proline", keyword="kia carens clavis ev charger",
  description="Check the home charger for your Kia Carens Clavis EV: 11 kW AC charging times for both batteries, the 3.3 kW portable cable and what your supply needs.",
  h1="Kia Carens Clavis EV charger at home, 11 kW or 7.4 kW",
  intro="For a Kia Carens Clavis EV charger at home, Kia quotes charging on an 11 kW AC wall box: about 4 hours for the 42 kWh battery and 4 hours 45 minutes for the 51.4 kWh battery, from 10 to 100%. An 11 kW charger needs a three-phase supply; on single-phase, a 7.4 kW wall box is the usual choice. Proline installs either one, with its own circuit and earthing.",
  summary="11 kW or 7.4 kW for the Carens Clavis EV, the charging times, and installing it.",
  highlights=["11 kW on three-phase, 7.4 kW on single-phase", "3.3 kW portable cable as standard", "Own circuit, protection and a tested earth"],
  faqs=[
   {"q": "How long does the Carens Clavis EV take to charge at home?", "a": "Kia's brochure gives about 4 hours (42 kWh) and 4 hours 45 minutes (51.4 kWh) from 10 to 100% on an 11 kW AC charger. On a 7.4 kW wall box it takes longer; Kia does not publish that figure."},
   {"q": "Which charger comes with the Carens Clavis EV?", "a": "Kia lists a 3.3 kW portable charging cable as standard. Ask your dealer whether a wall box was supplied with your car."},
   {"q": "Do I need three-phase power for the 11 kW charger?", "a": "Yes. An 11 kW AC charger draws its power across three phases. On a single-phase connection, a 7.4 kW wall box is the right choice."},
   {"q": "How fast does the Carens Clavis EV charge on a DC fast charger?", "a": "Kia quotes 10–80% in about 39 minutes on a 100 kW DC fast charger. The car uses the CCS2 connector."},
   INSTALL_FAQ("Kia"),
  ],
  body=lambda c: "\n\n".join([
   "## Charging times\n\nKia's brochure gives these estimated times:",
   table(["Charger", "42 kWh battery", "51.4 kWh battery"], [["11 kW AC, 10–100%", "About 4 hours", "About 4 hours 45 minutes"], ["100 kW DC, 10–80%", "About 39 minutes", "About 39 minutes"]]),
   "Kia lists a **3.3 kW portable charging cable** as standard; it is a backup, and only from a dedicated 15/16 A socket with its own breaker, RCD and earth. Kia notes that times vary with the battery's condition, the charger and the temperature.",
   "## 11 kW or 7.4 kW: how to choose\n\n- **11 kW wall box.** Gives Kia's quoted times, but needs a three-phase supply.\n- **7.4 kW wall box.** Runs on a normal single-phase supply and still fills either battery overnight. This suits most homes.",
   SUPPLY_3PH, BEFORE_BUY(c), INSTALL, SEND_US(c), SOCIETY("Carens Clavis EV"),
   "Figures are from Kia India's [Carens Clavis EV brochure](https://www.kia.com/content/dam/kia2/in/en/our-vehicles/kia-carens-clavis-ev/showroom/Kia_CarensClavisEV_Brochure_Desktop.pdf), checked on 15 Nov 2026."])),

 dict(slug="vinfast-vf6", label="VinFast VF6", maker="VinFast", order=15, art="wallbox-7",
  title="VinFast VF6 Home Charger Advice | Proline", keyword="vinfast vf6 charger",
  description="Check the home charger for your VinFast VF6: its 7.2 kW AC limit, about how long a full charge of the 59.6 kWh battery takes, DC charging and installation.",
  h1="VinFast VF6 charger at home, chosen and installed",
  intro="For a VinFast VF6 charger at home, a 7.2–7.4 kW AC wall box is the right size: VinFast lists AC charging of up to 7.2 kW. VinFast does not publish a home charging time; by our estimate, a full charge of the 59.6 kWh battery on such a charger takes around 9 hours. Proline installs it on its own circuit, with earthing and a safe cable route.",
  summary="The right home charger for the VF6, and what installing it involves.",
  highlights=["A 7.2–7.4 kW wall box is the most the car takes on AC", "Own circuit, protection and a tested earth", "Any brand of charger installed"],
  faqs=[
   {"q": "Which home charger suits the VinFast VF6?", "a": "A 7.2–7.4 kW AC wall box on its own circuit. VinFast lists AC charging of up to 7.2 kW, so an 11 kW or 22 kW charger would not charge it any faster."},
   {"q": "How long does the VF6 take to charge at home?", "a": "VinFast does not publish an AC charging time. At up to 7.2 kW, a full charge of the 59.6 kWh battery takes around 9 hours by our estimate, allowing for charging losses."},
   {"q": "How fast does the VF6 charge on a DC fast charger?", "a": "VinFast quotes 10–70% in about 25 minutes, with DC charging of up to 100 kW. The car uses the CCS2 connector."},
   {"q": "Does the VF6 come with a home charger?", "a": "VinFast's VF6 page does not say. Ask your dealer what your car came with; we install it, or any other wall box."},
   INSTALL_FAQ("VinFast"),
  ],
  body=lambda c: "\n\n".join([
   "## Which charger the VF6 needs\n\nVinFast publishes these charging figures for the VF6's 59.6 kWh battery:",
   table(["Way to charge", "What you need", "Figure"], [
    ["AC wall box", "A 7.2–7.4 kW wall box on its own circuit", "Up to 7.2 kW; around 9 hours for a full charge (our estimate)"],
    ["DC fast charger", "A public CCS2 charger, up to 100 kW", "10–70% in about 25 minutes (VinFast)"]]),
   "For most owners the answer is a **7.2–7.4 kW AC wall box** at home, charging overnight, with DC fast charging on trips. The car takes no more than 7.2 kW on AC, so a bigger AC charger costs more without charging it faster.",
   "## What VinFast supplies\n\nVinFast's VF6 page does not say whether a home charger comes with the car. Ask your dealer what yours came with. We install the charger supplied with the car or any other brand, with the earthing, civil work or long cable run a dealer installation may leave out.",
   SUPPLY_1PH, BEFORE_BUY(c), INSTALL, SEND_US(c), SOCIETY("VF6"),
   "Figures are from VinFast India's [VF6 page](https://vinfastauto.in/vf6), checked on 15 Nov 2026. The home charging time is our estimate, not VinFast's."])),
]

for c in CARS:
    fm = {
        "title": c["title"], "description": c["description"], "label": c["label"], "h1": c["h1"], "eyebrow": "Charger for your car",
        "intro": c["intro"], "keyword": c["keyword"], "summary": c["summary"], "icon": "car", "art": c["art"], "order": c["order"],
        "highlights": c["highlights"], "need": "Home charger installation", "form": "quote", "serviceType": "Home EV charger installation",
        "steps": STEPS, "costFactors": COST, "faqs": c["faqs"], "related": RELATED, "updated": "2026-11-15",
    }
    assert len(fm["title"]) <= 60, fm["title"]
    assert 70 <= len(fm["description"]) <= 170, (c["slug"], len(fm["description"]))
    text = "---\n" + yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=10000) + "---\n\n" + c["body"](c).strip() + "\n"
    open(f"src/content/cars/{c['slug']}.md", "w").write(text)
    print(c["slug"], len(c["body"](c).split()), "words")
