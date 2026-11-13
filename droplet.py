"""The sighlurskin droplet mark, drawn to the brand spec (BRAND_STYLE_GUIDE.md, section 3).

Shared by make_favicon.py (site icons, Instagram avatar) and make_logo.py (email sign-off).

The spec, for a droplet of side D:
  - Shape: border-radius 50% 50% 50% 14% (bottom-left is the tight "drip" corner), cobalt.
  - "@": Baloo 2 ExtraBold, bone, font-size 0.64 x D, line-height 1, centered
    left-to-right, then raised by CSS padding-bottom 0.0074 x D.
  - Round crops (profile pictures, favicons): nudge the droplet up and right by
    2.2% of D, because the drip corner makes a centered droplet look low-left.

The "@" is placed exactly the way the browser places it (flex-centered line box,
line-height 1), so the PNGs match the CSS droplet on the brand sheet.
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
BALOO = os.path.join(HERE, "identity", "fonts", "Baloo2-Variable.ttf")  # variable, wght 400-800

COBALT = (15, 47, 230)    # #0F2FE6
BONE = (244, 238, 223)    # #F4EEDF

AT_SIZE = 0.64            # "@" font-size, as a fraction of D
RAISE = 0.0074            # padding-bottom, as a fraction of D
NUDGE = 0.022             # round crops: up and right, as a fraction of D
DRIP = 0.14               # bottom-left corner radius, as a fraction of D

K = 8                     # supersample factor


def baloo(px):
    f = ImageFont.truetype(BALOO, max(1, round(px)))
    f.set_variation_by_axes([800])  # ExtraBold, the only weight the brand uses
    return f


def _mask(side, x, y, D):
    """Droplet shape on an L canvas of `side` px: a circle plus a squared-off
    bottom-left quarter with a DRIP corner."""
    m = Image.new("L", (side, side), 0)
    d = ImageDraw.Draw(m)
    r = D / 2
    d.ellipse([x, y, x + D - 1, y + D - 1], fill=255)
    d.rounded_rectangle([x, y + r, x + r, y + D - 1], radius=D * DRIP, fill=255,
                        corners=(False, False, False, True))
    return m


def _at(draw, x, y, D, fill=BONE):
    """Draw the "@" for a droplet whose top-left corner is (x, y), as CSS lays it out:
    a line box `AT_SIZE * D` tall, flex-centered in the content box above the padding."""
    font = baloo(D * AT_SIZE)
    asc, desc = font.getmetrics()                 # hhea ascent/descent, in px
    line_h = D * AT_SIZE                           # line-height: 1
    line_top = y + (D * (1 - RAISE) - line_h) / 2
    baseline = line_top + (line_h - (asc + desc)) / 2 + asc
    adv = font.getlength("@")
    draw.text((x + (D - adv) / 2, baseline), "@", font=font, fill=fill, anchor="ls")


def render(size, D, background=None, circle=False, nudge=False, offset=(0, 0)):
    """Render a `size` x `size` RGBA image with a droplet of side D centered on it.

    background: None for transparent, or an RGB tuple for a filled square/circle.
    circle:     clip the background to a circle filling the square (transparent corners).
    nudge:      shift the droplet up and right by NUDGE x D (for round crops).
    offset:     extra (dx, dy) in px, for placing the droplet off-center.
    """
    k = K if size <= 600 else 4          # keep big canvases (1000+ px) light on memory
    S, d = size * k, D * k
    x = (S - d) / 2 + offset[0] * k
    y = (S - d) / 2 + offset[1] * k
    if nudge:
        x += NUDGE * d
        y -= NUDGE * d

    drop = _mask(S, x, y, d)
    # Paint plane: background color everywhere (or cobalt when transparent), the
    # droplet in cobalt, the "@" in bone. Alpha comes from a separate mask so edge
    # pixels never pick up dark fringes when we downsample.
    rgb = Image.new("RGB", (S, S), background or COBALT)
    rgb.paste(COBALT, (0, 0), drop)
    _at(ImageDraw.Draw(rgb), x, y, d)

    if background is None:
        alpha = drop
    elif circle:
        alpha = Image.new("L", (S, S), 0)
        ImageDraw.Draw(alpha).ellipse([0, 0, S - 1, S - 1], fill=255)
    else:
        alpha = Image.new("L", (S, S), 255)

    rgb = rgb.reduce(k)
    alpha = alpha.reduce(k)
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def paste_droplet(base, x, y, D):
    """Draw a droplet of side D (already in `base`'s pixels) with its top-left at (x, y).
    For scripts that supersample their own canvas, like make_logo.py."""
    W, H = base.size
    m = Image.new("L", (W, H), 0)
    side = max(W, H)
    shape = _mask(side, x, y, D).crop((0, 0, W, H))
    m.paste(shape, (0, 0))
    base.paste(COBALT + (255,) if base.mode == "RGBA" else COBALT, (0, 0), m)
    _at(ImageDraw.Draw(base), x, y, D, fill=BONE + (255,) if base.mode == "RGBA" else BONE)
