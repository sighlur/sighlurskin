#!/usr/bin/env python3
"""Draw email-wordmark.png, the sighlurskin wordmark at the top of every email.

Emails can't count on the brand font loading, so the welcome email shows the
wordmark as an image (api/subscribe.js shows it at 142x30; the file is 3x that
for sharp screens). Baloo 2 ExtraBold, "sighlur" in cobalt, "skin" in azure,
on a transparent background with 6 px around the letters.

Usage: python3 make_wordmark.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
BALOO = os.path.join(HERE, "identity", "fonts", "Baloo2-Variable.ttf")

COBALT = (15, 47, 230)    # #0F2FE6
AZURE = (109, 168, 226)   # #6DA8E2

W, H = 427, 90
PAD = 6                   # transparent space around the letters
K = 8                     # supersample factor


def baloo(px):
    f = ImageFont.truetype(BALOO, px)
    f.set_variation_by_axes([800])
    return f


def layers(size, x, y, canvas):
    """Alpha of the whole wordmark and of "skin" alone, baseline origin at (x, y)."""
    f = baloo(size)
    alpha = Image.new("L", canvas, 0)
    skin = Image.new("L", canvas, 0)
    d = ImageDraw.Draw(alpha)
    w1 = d.textlength("sighlur", font=f)
    d.text((x, y), "sighlur", font=f, fill=255, anchor="ls")
    d.text((x + w1, y), "skin", font=f, fill=255, anchor="ls")
    ImageDraw.Draw(skin).text((x + w1, y), "skin", font=f, fill=255, anchor="ls")
    return alpha, skin


def main():
    box_w, box_h = (W - 2 * PAD) * K, (H - 2 * PAD) * K

    # Measure the drawn letters (not the font's text box) on a roomy scratch canvas,
    # then scale so they fill the padded box.
    scratch = (W * K * 3, H * K * 3)
    size = 80 * K
    l, t, r, b = layers(size, W * K * 0.2, H * K * 2, scratch)[0].getbbox()
    size = int(size * min(box_w / (r - l), box_h / (b - t)))
    l, t, r, b = layers(size, W * K * 0.2, H * K * 2, scratch)[0].getbbox()

    # Place the letters centered in the image.
    x = W * K * 0.2 + (W * K - (r - l)) / 2 - l
    y = H * K * 2 + (H * K - (b - t)) / 2 - t
    alpha, skin = layers(size, x, y, (W * K, H * K))

    rgb = Image.new("RGB", (W * K, H * K), COBALT)
    rgb.paste(AZURE, (0, 0), skin)
    out = rgb.reduce(K).convert("RGBA")
    out.putalpha(alpha.reduce(K))
    out.save(os.path.join(HERE, "email-wordmark.png"), optimize=True)
    print("wrote email-wordmark.png", out.size, "font size", round(size / K, 1))


if __name__ == "__main__":
    main()
