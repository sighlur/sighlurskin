# sighlurskin — marketing site

Static HTML/CSS/JS landing page for the @sighlurskin face wash launch.

## Local preview

Just open `index.html` in your browser — no build step.

If you want a local server (clean URLs, proper file headers):

```bash
# Python (already on macOS)
python3 -m http.server 5173
# then visit http://localhost:5173
```

## Files

- `index.html` — the whole page (announcement → footer)
- `styles.css` — brand tokens + all styling
- `script.js` — smooth scroll + email form
- `.gitignore` — keeps junk out of git

## Brand tokens (from the design handoff)

| Token     | Hex       | Use                  |
|-----------|-----------|----------------------|
| powder    | `#E7F1FB` | softest blue tints   |
| sky       | `#B9D8F2` | section backgrounds  |
| azure     | `#6DA8E2` | mid blue             |
| marine    | `#2E62C4` | dark blue panels     |
| cobalt    | `#1438A0` | **primary brand**    |
| deep      | `#0A1F5C` | footer / shadows     |
| bone      | `#F4EEDF` | warm off-white       |
| cream     | `#FBF6EA` | card backgrounds     |
| butter    | `#F7D45A` | **accent pop**       |
| bg        | `#EFE9DA` | page background      |

Fonts: **Bagel Fat One** (display) / **Plus Jakarta Sans** (body) / **JetBrains Mono** (mono labels).
