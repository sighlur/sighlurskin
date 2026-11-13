#!/usr/bin/env python3
"""Generate every sighlurskin site icon from one source logo PNG.

The source is the cobalt droplet "@" mark on a transparent background
(identity/logo/favicon-source.png, 512x512). Its built-in padding is trimmed
so the mark fills the icon, which keeps it legible at 16px in a browser tab.

Usage: python3 make_favicon.py [path/to/source.png]

Outputs, at the repo root:
  favicon.ico           16/32/48, the default /favicon.ico browsers and crawlers ask for
  favicon-32.png        browser tab
  favicon-192.png       Google search results and Android
  favicon.png           512, high-res icon
  apple-touch-icon.png  180, on a solid bone background (iOS fills transparency
                        with black), used for iPhone home screens and iMessage
                        link previews
"""
import os
import sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "identity", "logo", "favicon-source.png")
BONE = (244, 238, 223, 255)  # #F4EEDF


def trimmed(src, margin):
    """Crop to the visible mark, then pad back to a square with `margin` (fraction of side)."""
    box = src.getchannel("A").getbbox()
    mark = src.crop(box)
    side = max(mark.size)
    canvas = int(round(side / (1 - 2 * margin)))
    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    out.paste(mark, ((canvas - mark.width) // 2, (canvas - mark.height) // 2))
    return out


def save(img, name, size):
    path = os.path.join(HERE, name)
    img.resize((size, size), Image.LANCZOS).save(path, optimize=True)
    print("wrote", name)


def main():
    src = Image.open(SOURCE).convert("RGBA")

    icon = trimmed(src, 0.04)
    save(icon, "favicon-32.png", 32)
    save(icon, "favicon-192.png", 192)
    save(icon, "favicon.png", 512)
    icon.resize((256, 256), Image.LANCZOS).save(
        os.path.join(HERE, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print("wrote favicon.ico")

    # iOS: solid background, mark inset so the rounded-corner mask doesn't clip it
    touch = Image.new("RGBA", (720, 720), BONE)
    mark = trimmed(src, 0.0).resize((540, 540), Image.LANCZOS)
    touch.alpha_composite(mark, (90, 90))
    save(touch.convert("RGB"), "apple-touch-icon.png", 180)


if __name__ == "__main__":
    main()
