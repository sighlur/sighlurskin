#!/usr/bin/env python3
"""Generate the sighlurskin droplet "@" favicon (browser tab icon).

Recreates the brand logo mark: a cobalt droplet (a circle with a pointed
bottom-left "drip", per the site's border-radius: 50% 50% 50% 14%) with a
bone "@" glyph in Baloo 2 ExtraBold (the site's display font).
Transparent background.

Usage: python3 make_favicon.py /path/to/Baloo2[wght].ttf
(download from https://github.com/google/fonts/tree/main/ofl/baloo2)

Outputs favicon.png (512) and favicon-32.png (32) at the repo root.
"""
import os
from PIL import Image, ImageDraw, ImageFont

COBALT = (15, 47, 230, 255)   # #0F2FE6
BONE   = (244, 238, 223, 255) # #F4EEDF
import sys
BALOO  = sys.argv[1] if len(sys.argv) > 1 else "Baloo2.ttf"
HERE   = os.path.dirname(__file__)


def render(out_size):
    K = 8 if out_size <= 64 else 4          # supersample factor
    W = out_size * K
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    m = int(W * 0.04)                       # small margin
    box = W - 2 * m
    left, top = m, m
    right, bottom = m + box, m + box
    cx = cy = W / 2

    # droplet = inscribed circle + a wedge filling the bottom-left to a point
    d.ellipse([left, top, right, bottom], fill=COBALT)
    d.polygon([(left, cy), (left, bottom), (cx, bottom)], fill=COBALT)
    # soften the drip tip just slightly (matches the 14% corner)
    tip_r = int(box * 0.10)
    d.ellipse([left, bottom - 2 * tip_r, left + 2 * tip_r, bottom], fill=COBALT)

    # "@" glyph, centered, in Baloo 2 ExtraBold (variable font, wght 800)
    font = ImageFont.truetype(BALOO, int(box * 0.66))
    font.set_variation_by_axes([800])
    d.text((cx, cy - box * 0.02), "@", font=font, fill=BONE, anchor="mm")

    img = img.resize((out_size, out_size), Image.LANCZOS)
    name = "favicon.png" if out_size >= 256 else f"favicon-{out_size}.png"
    path = os.path.join(HERE, name)
    img.save(path)
    print("wrote", path)


if __name__ == "__main__":
    render(512)
    render(32)
    print("done")
