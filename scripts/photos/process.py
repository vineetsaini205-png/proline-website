"""Blur only what is required on the Pexels photos, then export WebP for the site.

Owner's rule (24 Oct 2026): "do not blur if it is not required". Pexels allows free
commercial use but says: "Don't imply endorsement of your product by people or brands
on the image." So we hide ONLY readable charger / charging-network brand marks
(they would look like partnerships Proline does not have). Car badges, number plates,
spec stickers and cable labels are left as they are.

Originals are the Pexels downloads the owner attached in the chat (not in git):
  SRC=/mnt/user-data/attachments/<chat-id>/<hash>-image.jpg
Run:  python3 scripts/photos/process.py [SRC_DIR]
"""
import json, sys
from PIL import Image, ImageFilter

SRC = sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/attachments/2909b95e-07e3-511d-98f7-d768b5b8ce1a/"
OUT = "public/images/"
# name: (source hash, width the boxes were measured at, [boxes], alt text)
JOBS = {
 "dc-hub-canopy": ("770e148c", 1000, [], "DC fast chargers under a canopy at an EV charging hub"),
 "dc-hub-bays": ("14efe53e", 1000, [], "A row of DC fast chargers under a canopy at a charging hub"),
 "solar-canopy-cars": ("66dbec4d", 5099, [
     (1880,1095,2280,1230),   # network logo on canopy arm
     (1700,2088,1805,2142),   # network logo on charger
     (785,2110,880,2155),     # network logo on charger
     (735,2135,765,2350)],    # logo strip on charger head
     "Electric cars charging under a solar panel canopy"),
 "solar-canopy-aerial": ("9488e54d", 4000, [
     (1485,1680,1530,1725), (1540,1725,1730,1870)],  # network logo on canopy arm
     "Aerial view of EV chargers under a solar panel canopy"),
 "solar-canopy-tall": ("534cb658", 1000, [
     (358,590,474,630),       # network logo on canopy
     (232,804,262,842), (454,804,484,842),  # logos on charger heads
     (342,724,368,792)],      # network label on pole
     "Solar carport canopy with EV chargers in a car park"),
 "dc-charger-car": ("105ac1ea", 2576, [(1745,698,1935,798)],  # charger brand logo
     "Electric car parked at a DC fast charger"),
 "ac-charger-plug": ("85c85c04", 6000, [(3440,4810,3820,5070)],  # plug maker name
     "Type 2 AC charging plugs docked on a charger"),
 "ev-charging-suv": ("eb7cb51d", 1000, [], "SUV plugged in at an EV charging point"),
 "ac-pedestal-charger": ("1eb97269", 1000, [(406,472,452,507)],  # plug maker name
     "AC pedestal charger with Type 2 sockets and a charging cable"),
 "ev-pedestal-crossover": ("bff39966", 1000, [
     (126,158,182,328), (46,390,106,477), (0,448,32,502)],  # charger brand labels
     "Electric crossover charging at a pedestal AC charger"),
 "dc-cabinet-charging": ("87136749", 1000, [], "Car charging at a DC charger cabinet"),
 "ac-charger-closeup": ("12661b16", 1000, [], "Close-up of an AC EV charger and plug"),
}

def hide(im, box):
    x0, y0, x1, y1 = box
    reg = im.crop(box)
    w, h = reg.size
    k = max(4, min(w, h) // 10)
    small = reg.resize((max(1, w // k), max(1, h // k)), Image.BILINEAR)
    reg = small.resize((w, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(radius=max(3, min(w, h) / 6)))
    im.paste(reg, (x0, y0))

def main(only=None):
    manifest = {}
    for name, (src, pw, boxes, alt) in JOBS.items():
        if only and name not in only:
            continue
        im = Image.open(SRC + src + "-image.jpg").convert("RGB")
        s = im.size[0] / pw
        for b in boxes:
            pad = 0.08
            bw, bh = b[2] - b[0], b[3] - b[1]
            ob = (int((b[0] - bw * pad) * s), int((b[1] - bh * pad) * s), int((b[2] + bw * pad) * s), int((b[3] + bh * pad) * s))
            ob = (max(0, ob[0]), max(0, ob[1]), min(im.size[0], ob[2]), min(im.size[1], ob[3]))
            hide(im, ob)
        sizes = {}
        for w, suffix in [(1600, ""), (800, "-800")]:
            ww = min(w, im.size[0]); hh = round(im.size[1] * ww / im.size[0])
            im.resize((ww, hh), Image.LANCZOS).save(OUT + name + suffix + ".webp", "WEBP", quality=76, method=6)
            sizes[str(w)] = [ww, hh]
        manifest[name] = {"alt": alt, "sizes": sizes, "blurred": len(boxes)}
        print(name, im.size, len(boxes), "boxes")
    if not only:
        json.dump(manifest, open("src/data/images.json", "w"), indent=1)

if __name__ == "__main__":
    main()
