# Credits

## Authorship and creative direction

**Jesal Mehta** (@cabofcuriosity): the original hand-coded p5.js sketches (*Perlin Contour* v1.0–v4.3 in 2020, *Perlin Topography*, *Domain Warping* and related noise experiments in 2021), including the noise → exponent → island blend → bands pipeline, its controls, and the written intentions in the 2020 notes. Also the brief for the 2026 tool and its creative direction: the single parameter space, the choice of outputs and styles, the control names and order, the separation of landscape, frame and print, the move into hachures (bringing in the reference reading), and the selection of the engraving settings from comparisons.

## AI assistance

From v5.0 (September 2026), the code was written by an AI coding assistant working to the author's brief, choices and reviews. It also proposed implementations, diagnosed problems (for example the circular islands, the hachure terraces and the on-screen engraving scale) and measured results. [HISTORY.md](HISTORY.md) records which decisions came from the author and which came from the assistant. The underlying approach of the tool isn't credited to the assistant just because the later code was generated with its help. The Git author field on a commit records who committed it, not a line-by-line account of who wrote what.

## Established techniques and their sources

None of these is claimed as an invention. Each is a published or widely known technique, implemented in this project's own code unless stated otherwise:

| Technique | Source / attribution | Where |
|---|---|---|
| Gradient (Perlin) noise and fractal sums (fBm) | Ken Perlin's gradient noise; the standard fBm construction | `model.js` `makeNoise`, `fbm` |
| Island shaping by blending noise with distance, `(1 + e − d) / 2` | Red Blob Games, [*Making maps with noise*](https://www.redblobgames.com/maps/terrain-from-noise/) (used in the 2020 sketches; credited in the page) | `model.js` `makeTerrain` |
| Ridged multifractal noise | Musgrave's ridged multifractal | `model.js` `ridged` |
| Domain warping | Standard technique (offsetting the sampling coordinates by further noise) | `model.js` `height` |
| Smooth minimum (log-sum-exp) | Standard technique | `model.js` `smin` |
| mulberry32 seeded random generator | A widely circulated small generator; its original source and terms are to be confirmed (see below) | `model.js` `rng` |
| Marching squares | Standard isoline algorithm | `model.js` `isolines` |
| Ramer–Douglas–Peucker line simplification | Ramer (1972); Douglas & Peucker (1973) | `model.js` `simplify` |
| Exact Euclidean distance transform | Felzenszwalb & Huttenlocher, *Distance Transforms of Sampled Functions* | `model.js` `distanceFromLand` |
| Slope hachures ("the steeper, the darker") | J. G. Lehmann (1799) | `model.js` `hachuresSteps` |
| Sun-weighted (oblique-light) hachure shading | The Swiss Dufour map tradition | `model.js` `shade` |
| Smoothed terrain and fine-interval dynamic hachures | Warren Davison, [blog post on dynamic hachure contours in ArcGIS Pro](https://warrenrdavison.wixsite.com/maps/post/revisiting-hachure-lines-dynamic-hachure-contours-in-arcgis-pro), brought in by the author as reference reading; method influence only, no code or images copied | `model.js` `blurField`, row spacing in `island_generator.js` |
| PNG file format, CRC-32 and zlib/deflate | The PNG specification; compression by the browser's `CompressionStream` | `island_generator.js` `png16` |

**Provenance still to confirm.** The compact implementations of mulberry32 and the Felzenszwalb–Huttenlocher distance transform closely follow well-known published forms. Before a licence is applied, their exact sources and any notices they require should be identified (see the README's licence section). This doesn't apply to the methods themselves.

## Software and fonts

| Component | Use | Licence | How it is included |
|---|---|---|---|
| [p5.js](https://p5js.org/) 1.9.0 | Canvas and draw loop for the current page | LGPL-2.1 | Loaded from cdnjs at runtime; not bundled |
| p5.js 0.5.8 and 1.3.1, p5.dom.js 0.3.2, p5.sound.js 0.3.2 | Libraries the archived 2020–2021 sketches were written against | LGPL-2.1 (p5.js and its add-ons) | Loaded from cdnjs by each sketch's `run.html`; not bundled (see [archive/README.md](archive/README.md)) |
| [Space Mono](https://fonts.google.com/specimen/Space+Mono) | Interface font | SIL Open Font License 1.1 (The Space Mono Project Authors) | Loaded from Google Fonts; not bundled |
| [Rajdhani](https://fonts.google.com/specimen/Rajdhani) | Interface font | SIL Open Font License 1.1 (Indian Type Foundry) | Loaded from Google Fonts; not bundled |

Any future licence for this repository's own code doesn't change the licences of these components.

## Historical sketches

The archived sketches are the author's own. The 2021 *Perlin Topography* page ends with the author's notice: *"Code is copyright by Jesal Mehta, 15/01/2021. The output of this program is free to use for non-commercial purposes (for your plotters, laser engravers etc). Contact me if you need a different license."* The same terms apply to the 2020 *Perlin Contour* sketches, whose pages don't repeat the notice. The code licence intended for the current tool doesn't cover the archive. A related 2020 heightmap sketch adapted from a Daniel Shiffman / The Coding Train example (edited by SacrificeProductions) isn't included, because its terms haven't been reviewed.

## Screenshots and outputs

- The images in `docs/images/` are screenshots and export crops of the author's tool, made during development in September 2026 under its former name. Screenshots and documentation in this repository are © Jesal Mehta, all rights reserved.
- Maps and drawings made with the tool belong to the person who made them, for non-commercial use only, with credit to Jesal Mehta or a tag of @cabofcuriosity when shared.
