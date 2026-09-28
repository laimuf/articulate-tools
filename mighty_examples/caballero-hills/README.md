# Caballero Hills — extracted Mighty custom code

Source: https://zainabfawzul.github.io/Caballero-Hills/

Reference only. Not authored here — extracted from the published course to study how the
sticky section nav bar, FAB speed dial, and modals were built on top of Rise.

## How to extract Mighty custom code from any published Rise course

Mighty stores the Custom Code powerup inside the course JSON, not in `index.html`.

```bash
curl -sL "<course-url>/locales/en.js" -o en.js
python3 - <<'EOF'
import re, base64, json
s = open('en.js').read()
enc = re.search(r'__resolveJsonp\("course:en","([^"]+)"\)', s).group(1)
d = json.loads(base64.b64decode(enc))
data = d['course']['theme']['mightyPowerups'][2]['data']   # index varies; find the dict with customJavascript
open('custom.js','w').write(data['customJavascript'])
open('custom.css','w').write(data['customCss'])
EOF
```

The powerup array index is not stable — scan `mightyPowerups` for the entry whose `data`
has `customJavascript` / `customCss`.

## What's in custom.js

| Lines | Feature |
|-------|---------|
| 1–430 | Weather widget — live `api.weather.gov/stations/<id>/observations/latest` fetch, Font Awesome injected from CDN |
| 435–545 | Water tracker + weather modals |
| 546–631 | "Switch trail?" wayfinder modal — cross-lesson nav by clicking `a[href*="#/lessons/<id>"]`, hash fallback |
| 636–714 | FAB speed dial (bottom-right, 3 options) |
| 730–835 | Card image swapper |
| 839–1080 | **Sticky section nav bar** — per-lesson chip config keyed by reference block ID, scroll spy, arrow-key nav |
| 1085–1150 | Favicon swap |

## Nav bar mechanism (the part worth copying)

1. `LESSON_NAV_CONFIGS` maps a *reference* `data-block-id` (a block unique to that lesson) →
   array of `{id, label, blockId}` chips.
2. A `MutationObserver` on `document.body` detects which lesson is mounted by querying for
   each reference block ID, then builds/rebuilds/removes the bar.
3. Chips `scrollIntoView({behavior:'smooth'})` the target block.
4. An `IntersectionObserver` with `rootMargin: "0px 0px -70% 0px"` drives the `.active` state.
5. CSS: `#rise-tag-bar { position: sticky; top: 0; z-index: 9999; overflow-x: auto;
   scroll-snap-type: x mandatory }` — horizontal chip scroll on mobile.

Same skeleton as `brc_project/point_tracker/point_tracker.js`: wait for a gate block →
`document.body.prepend()` a fixed/sticky element → observe blocks → mutate the HUD.

## Local sandbox

`sandbox.html` renders the extracted `custom.js` + `custom.css` **unmodified** against a mock
Rise DOM, so the bar, FAB, and modals can be driven without publishing to Rise.

```bash
cd mighty_examples/caballero-hills
python3 -m http.server 8899
# open http://localhost:8899/sandbox.html
```

Serve it over HTTP — `file://` blocks the `api.weather.gov` fetch and the Google Fonts import.

What the mock provides:

- Blocks carrying the **real** `data-block-id` values from `LESSON_NAV_CONFIGS`, so the nav bar
  builds itself with no edits to `custom.js`.
- Three lessons behind `#/lessons/<id>` hashes plus `a[href*="#/lessons/…"]` links, so the
  "Switch trail?" modal's real navigation path (`custom.js:614`) works and the bar rebuilds
  with the next lesson's chips.
- A mock `.blocks-button--right` stack so the card-image swapper has something to rewrite.
- A bottom-left status readout: current lesson, chip count, active chip.

Verified working locally: chip click → smooth scroll, scroll spy `.active`, `←`/`→` chip
focus, FAB speed dial, wayfinder modal, lesson switch → bar rebuilt with `-L3` chip IDs.
The weather modal needs live network and only covers stations `KDMA` / `QHVA3` (Tucson).

Two sandbox-only compensations, both commented inline in `sandbox.html`:

1. `html, body { height: auto }` override — see limitation 6 below.
2. The card block mounts 400 ms late — see limitation 5 below.

## Known limitations

- Block IDs are per-copy. Lessons 2 and 3 have completely different ID formats from
  lesson 1 because they were duplicated; every duplicate needs a new config entry.
- All state lives in closure variables. Navigating to another lesson unmounts and rebuilds
  everything, so counters reset. Persist to `sessionStorage` if state must survive.
- Selectors like `.quiz-card__feedback` and `[data-test-id="quiz-card-option"]` are Rise
  internals and can break on a Rise release.
- **Live bug — `custom.js:819` calls `applyResponsiveCardStyles()`, which is defined nowhere
  in the file.** Every run of the card swapper throws `ReferenceError`. It survives in
  production only because Rise mounts blocks asynchronously, so the throw lands inside a
  MutationObserver callback after the script has finished evaluating. If that block were
  present at evaluation time, the uncaught error would abort the rest of the file and the
  nav bar IIFE at `custom.js:839` would never run. Confirmed in the sandbox — it happened.
  Fix before reusing: delete the call or define the function.
- `custom.css:4-9` sets `html, body { height: 100% }`. Harmless in Rise, where an inner
  container scrolls, but it caps the sticky travel of `#rise-tag-bar` whenever the body is
  the scroll container. Worth knowing if the bar ever "unsticks" after one viewport.
