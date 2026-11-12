"""Proline's own job photos (owner's zip, Nov 2026) -> WebP for the site, merged into src/data/images.json.

Rules (PROGRESS.md 11 and the build plan):
- GPS stamps show a customer's house to within a few metres: crop them off, or blur the
  map, plus code and coordinates when the stamp itself is the point (geotagged proof).
- Number plates and handwritten labels are blurred.
- Client brands that are not cleared are blurred by default. Bolt.Earth, TATA, ThunderPlus
  and KIA are cleared names (rule 5), so their marks stay.
- Originals are WhatsApp copies and stay out of git (they carry the GPS stamps).

Run:  python3 scripts/photos/process-jobs.py <folder with the WhatsApp images>
"""
import json, os, sys
from PIL import Image, ImageFilter

SRC = sys.argv[1].rstrip("/") + "/" if len(sys.argv) > 1 else "./"
OUT = "public/images/"
MANIFEST = "src/data/images.json"

# key: (file, crop box or None, [blur boxes in original pixels], alt, caption)
JOBS = {
 "job-canopy-install": ("WhatsApp Image 2026-10-30 at 3.09.57 PM (1).jpeg", None, [],
     "Charging canopy and power panel during installation, with the DC charger still in its wrapping",
     "A DC charging canopy going up, with the power panel in place"),
 "job-dc-station": ("WhatsApp Image 2026-10-30 at 3.11.19 PM (1).jpeg", None, [
     (330, 92, 506, 130),    # network name on the canopy
     (335, 158, 488, 202),   # network slogan
     (436, 200, 492, 312),   # large logo on the backdrop
     (378, 210, 428, 248),   # logo on the charger head
     (368, 315, 446, 366),   # labels on the charger body
     (20, 192, 84, 338),     # left poster
     (698, 202, 770, 348)],  # right poster
     "DC fast charger at a public charging station at dusk",
     "A public DC charging station at dusk"),
 "job-basement-row": ("WhatsApp Image 2026-10-30 at 3.08.40 PM (2).jpeg", None, [],
     "Row of shielded charging points along a stack-parking basement",
     "Charging points along a stack-parking basement"),
 "job-basement-points": ("WhatsApp Image 2026-10-30 at 3.08.41 PM (6).jpeg", (406, 110, 960, 830), [  # crop leaves the plate out
     (285, 405, 405, 510)],  # number plate seen through the shield
     "Shielded charging points with user instructions in a basement car park",
     "Charging points with user instructions, in a basement car park"),
 "job-wallbox-stand": ("WhatsApp Image 2026-10-30 at 3.08.39 PM (2).jpeg", None, [],
     "AC charger on a steel stand with a clear shield, next to a cable tray",
     "An AC charger on a steel stand, fed from a cable tray"),
 "job-wallbox-closeup": ("WhatsApp Image 2026-10-30 at 3.08.42 PM (2).jpeg", None, [
     (200, 580, 290, 640),   # number plate
     (505, 652, 568, 710)],  # handwritten label
     "Close-up of a shielded AC charger on a stand in a basement car park",
     "A shielded AC charger in a basement car park"),
 "job-home-db-box": ("WhatsApp Image 2026-11-10 at 11.04.35 PM (10).jpeg", (0, 0, 780, 785), [],
     "DB box with MCB, RCD and a charging socket on a house wall, with the car's portable charger plugged in",
     "3.3 kW home charging point with its DB box, Maharashtra village, May 2026"),
 "job-earth-pit": ("WhatsApp Image 2026-11-10 at 11.04.35 PM (12).jpeg", (0, 0, 780, 785), [],
     "Earth pit with a copper earth rod and conductor, before it is closed",
     "Earth pit with a copper rod, before closing"),
 "job-earth-chamber": ("WhatsApp Image 2026-11-10 at 11.04.35 PM (11).jpeg", None, [
     (34, 826, 234, 1026),   # map thumbnail
     (255, 910, 740, 935),   # plus code and address line
     (255, 935, 740, 960)],  # latitude and longitude (date stays readable)
     "Finished earth chamber with its cover and conduit, with a geotagged photo stamp",
     "Finished earth chamber, photographed with a geotag stamp"),
 "job-socket-test": ("WhatsApp Image 2026-11-10 at 11.04.35 PM (14).jpeg", (0, 0, 780, 785), [],
     "Technician testing a charging socket with a multimeter after installation",
     "Testing the socket with a multimeter before handover"),
}

def hide(im, box):
    x0, y0, x1, y1 = box
    reg = im.crop(box)
    w, h = reg.size
    k = max(4, min(w, h) // 8)
    small = reg.resize((max(1, w // k), max(1, h // k)), Image.BILINEAR)
    reg = small.resize((w, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(radius=max(3, min(w, h) / 5)))
    im.paste(reg, (x0, y0))

def main():
    manifest = json.load(open(MANIFEST))
    for name, (fname, crop, boxes, alt, caption) in JOBS.items():
        im = Image.open(SRC + fname).convert("RGB")   # convert() drops EXIF
        for b in boxes:
            hide(im, b)
        if crop:
            im = im.crop(crop)
        sizes = {}
        for w, suffix in [(1600, ""), (800, "-800")]:
            ww = min(w, im.size[0]); hh = round(im.size[1] * ww / im.size[0])
            sizes[str(w)] = [ww, hh]
            if suffix and ww == im.size[0] and im.size[0] <= 800:
                continue  # photo is already 800 px or less: one file, no srcset (see Photo.astro)
            out = OUT + name + suffix + ".webp"
            q = 74
            while True:
                im.resize((ww, hh), Image.LANCZOS).save(out, "WEBP", quality=q, method=6)
                if os.path.getsize(out) <= 120_000 or q <= 50:
                    break
                q -= 6
        manifest[name] = {"alt": alt, "caption": caption, "job": True, "sizes": sizes, "blurred": len(boxes)}
        print(name, im.size, len(boxes), "boxes")
    json.dump(manifest, open(MANIFEST, "w"), indent=1)

if __name__ == "__main__":
    main()
