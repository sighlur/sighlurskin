#!/usr/bin/env python3
"""Generate every sighlurskin droplet icon, drawn fresh from the brand spec.

The droplet and its "@" come from droplet.py (font: identity/fonts/Baloo2-Variable.ttf),
so every size is rendered directly instead of shrunk from one big PNG.

Round crops (anything that sits in a circle) use the bone circle and nudge the
droplet up and right by 2.2% of its size, per BRAND_STYLE_GUIDE.md section 3.

Usage: python3 make_favicon.py

Outputs, at the repo root:
  favicon-32.png        32, transparent droplet with a 4% margin: browser tab (the small rel="icon")
  favicon.ico           16/32/48 of the same, the default /favicon.ico browsers and crawlers ask for
  favicon.png           512, bone circle, droplet 56%: high-res master (not linked from pages)
  search-icon.png       192, bone circle, the large rel="icon" Google Search picks up.
                        Keep this URL stable: Google asks that favicon URLs not change often.
  apple-touch-icon.png  180, transparent droplet with a 4% margin, used for iMessage link
                        previews (the droplet sits right on the message bubble). Trade-off:
                        iOS fills transparency with black if someone saves the site to their
                        home screen.

And in identity/logo/:
  droplet-mark.png      1000, transparent droplet, the master mark
  favicon-source.png    512, the bone-circle favicon
  instagram-avatar.png  1080, bone square, droplet 50%: Instagram profile picture
"""
import os
from droplet import render, BONE

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, "identity", "logo")

FAVICON_D = 0.56      # droplet size inside the bone circle
INSTAGRAM_D = 0.50    # droplet size on the bone square
CLEAR_MARGIN = 0.04   # padding on each side of the transparent icons (tab, iMessage)


def favicon(size):
    """Bone circle, for round crops like Google Search."""
    return render(size, size * FAVICON_D, background=BONE, circle=True, nudge=True)


def clear(size):
    """Transparent droplet, for the browser tab and iMessage."""
    return render(size, size * (1 - 2 * CLEAR_MARGIN))


def save(img, *path):
    out = os.path.join(*path)
    img.save(out, optimize=True)
    print("wrote", os.path.relpath(out, HERE))


def main():
    save(clear(32), HERE, "favicon-32.png")
    save(favicon(512), HERE, "favicon.png")
    save(favicon(192), HERE, "search-icon.png")
    ico = clear(48)
    ico.save(os.path.join(HERE, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)],
             append_images=[clear(16), clear(32)])
    print("wrote favicon.ico")
    save(clear(180), HERE, "apple-touch-icon.png")

    save(render(1000, 1000), LOGO, "droplet-mark.png")
    save(favicon(512), LOGO, "favicon-source.png")
    save(render(1080, 1080 * INSTAGRAM_D, background=BONE, nudge=True), LOGO, "instagram-avatar.png")


if __name__ == "__main__":
    main()
