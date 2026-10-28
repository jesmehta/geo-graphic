# Archive: original Perlin Contour and Perlin Topography sketches

These are hand-coded p5.js sketches by Jesal Mehta from 2020 and 2021, made before any AI-assisted work on the project. Geo-Graphic (formerly Island Generator) grew out of them. They were developed outside Git, as folders on the author's computer, and copied into this repository in 2026 as ordinary files. Their commit dates are the import date; they haven't been backdated. [HISTORY.md](../HISTORY.md) explains what each stage contributed.

Each folder holds the original files, unchanged: `sketch.js`, `index.html`, and, for the 2021 sketch, the `timeStamps.js` save helper. The original `index.html` loads `libraries/p5.js`, `libraries/p5.dom.js` and `libraries/p5.sound.js`, a local copy of p5.js that is **not** included here. Comments, parameters, bugs and unfinished experiments have been left as they were.

| Version | Approximate date | Contribution | Functionality / limitations | Dependencies |
|---|---|---|---|---|
| [Perlin Contour v1.0](perlin-contour-v1.0/) | sketch file dated 12 Feb 2020 | The starting point: p5's `noise()` evaluated per pixel as grey values on a 400 × 400 canvas, with the field drifting frame to frame. | Works, but slowly (about 4 fps in a 2026 test): it draws ~160,000 ellipses per frame, and the image buffer it also fills is written with alpha 1 of 255, so it barely shows. No save. | p5.js 0.5.8 (+ p5.dom 0.3.2, p5.sound 0.3.2 loaded but unused) |
| [Perlin Contour v4.2 islands cleaned](perlin-contour-v4.2-islands-cleaned/) | 22 Feb 2020 | The full 2020 pipeline with working **sliders**: noise → elevation exponent → island mask `(1 + n − d) / 2` around the centre → bands. Bands 2–20 (default 15), Elevation exponent 0.1–5, Island factor 0.1–3. | Works. The colours run in HSB mode, where a single grey value is brightness out of 100, so band values above 100 (out of 255) render white. At the default settings most of the canvas is white, with only the lowest bands in grey (seen in the 2026 test). Pressing any key throws `s is not defined` (the save key compares against an undefined variable; reproduced in 2026). Logs to the console every frame. | as above |
| [Perlin Contour v4.3 nonIsland cleaned](perlin-contour-v4.3-nonisland-cleaned/) | sketch file dated 7 Mar 2020 (folder 6 Mar) | Island focus moved to a third of the width and height; A-series 420 × 594 canvas; **Save Image** and **New Scape** buttons; the header of notes and to-dos quoted in [HISTORY.md](../HISTORY.md). A colour (thermal) branch is present as commented-out code. | Works. The heights are mapped to a hard-coded maximum of 150 in HSB mode, so the highest ground is flat white. The third slider starts labelled "Max Elevation (255)", and the first frame relabels it "Island factor". Any key press throws `s is not defined` (reproduced in 2026). The Save Image button wasn't tested. | as above |
| [Perlin Topography v2.2 expNoise](perlin-topography-v2.2-expnoise/) | `sketch.js` dated 7 Jul 2021; other files 6 Jul 2021 | A later noise-terrain sketch with ideas the 2026 tool also uses: **no-banding option** (Bands ≤ 2 = smooth), Island factor (0 = off), **Ridge threshold** that folds heights above it into ridges, an elevation exponent that itself varies with a second noise field, and normalisation by the previous pass's maximum. | Works, slowly (about 12 fps in a 2026 test; 3 px blocks on a 600 × 600 canvas). The Ridge threshold slider's default (0) is below its minimum (0.1), so ridge folding is on from the first frame. The `s` save key (in `timeStamps.js`) didn't produce a download in the 2026 test, possibly because of the slow frame rate. | p5.js 1.3.1 (+ p5.dom 0.3.2, p5.sound 0.3.2 loaded but unused) |

## Running a sketch

Each folder has a **`run.html`**, added in 2026 and not part of the original work. It is the original `index.html` with only the three library paths changed to the same files on cdnjs:

- the 2020 Perlin Contour sketches: `https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.5.8/p5.js`
- Perlin Topography v2.2: `https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.3.1/p5.js`
- both: `https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.5.8/addons/p5.dom.js` and `…/0.5.8/addons/p5.sound.js`

These were checked in October 2026 to be byte-identical to the library files in the original folders. `run.html` pins them with Subresource Integrity hashes.

Open `run.html` in a browser with a network connection, or serve this folder with a static server (for example `python -m http.server`) and open `<folder>/run.html`. To use the untouched `index.html` instead, put the matching p5.js and add-on files in a `libraries/` folder next to it.

In a Chromium smoke test on 28 October 2026, all four `run.html` pages loaded their libraries and drew without script errors at start-up. The key errors described above appeared when a key was pressed.

## Not included

- **Perlin Contour v2.0, v2.2, v3 and v4.0**: the intermediate steps (banding, mouse-controlled bands, exponent and sea, the first island mask). They are summarised in [HISTORY.md](../HISTORY.md). The four included versions show the start, the complete working pipeline, the final 2020 version with its notes, and the most developed 2021 sketch.
- **Contour heightmap** sketches (2020): one is an adapted third-party example (credited to Daniel Shiffman / The Coding Train, edited by SacrificeProductions) whose terms haven't been reviewed, and the others are closely related to it.
- **Domain Warping**, **Perlin Circle** and **Perlin Topography v1.0–v2.1** (2021): related experiments, described in [HISTORY.md](../HISTORY.md).
- **Library files**: the `libraries/` folders, and unused root-level copies of `p5.js` and `p5.sound.js` in the 2020 folders. They are third-party (LGPL-2.1) and available from cdnjs as above.

## Notices

The 2021 *Perlin Topography* page ends with the author's notice: *"Code is copyright by Jesal Mehta, 15/01/2021. The output of this program is free to use for non-commercial purposes (for your plotters, laser engravers etc). Contact me if you need a different license."* The same terms apply to the 2020 *Perlin Contour* sketches, whose pages don't repeat the notice. The date in the notice is repeated across files made at different times and doesn't date any one sketch. The open-source licence intended for the current tool doesn't cover these historical files.
