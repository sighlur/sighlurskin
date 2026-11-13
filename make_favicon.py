#!/usr/bin/env python3
"""Generate every sighlurskin site icon from two source logo PNGs.

The source is the cobalt droplet "@" mark on a transparent background
(identity/logo/favicon-source.png, 512x512). Its built-in padding is trimmed
so the mark fills the icon, which keeps it legible at 16px in a browser tab.

The Google Search icon comes from a second source: the same mark inside a
bone circle (identity/logo/search-icon-source.png, 512x512).

Usage: python3 make_favicon.py [path/to/source.png] [path/to/search-source.png]

Outputs, at the repo root:
  favicon.ico           16/32/48, the default /favicon.ico browsers and crawlers ask for
  favicon-32.png        browser tab (the small rel="icon")
  favicon.png           512, high-res transparent master (not linked from pages)
  search-icon.png       192, bone circle, the large rel="icon" Google Search
                        picks up. Keep this URL stable: Google asks that favicon
                        URLs not change often.
  apple-touch-icon.png  180, transparent, used for iMessage link previews (the
                        droplet sits right on the message bubble). Trade-off:
                        iOS fills transparency with black if someone saves the
                        site to their home screen.
"""
import os
import sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "identity", "logo", "favicon-source.png")
SEARCH_SOURCE = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "identity", "logo", "search-icon-source.png")


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
    save(icon, "favicon.png", 512)
    icon.resize((256, 256), Image.LANCZOS).save(
        os.path.join(HERE, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print("wrote favicon.ico")
    save(icon, "apple-touch-icon.png", 180)

    # Google Search: the bone circle as drawn (already full-bleed, no trimming)
    save(Image.open(SEARCH_SOURCE).convert("RGBA"), "search-icon.png", 192)


if __name__ == "__main__":
    main()
