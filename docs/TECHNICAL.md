# Geo-Graphic: technical notes

How the current version (5.8.1) computes and draws a landscape. Everything here describes the code as it is in this repository. Proposed improvements are listed separately at the end and are not features. For what each control does from a user's point of view, see the [README](../README.md); for how the design came about, see [HISTORY.md](../HISTORY.md).

## Contents

- [Architecture](#architecture)
- [Coordinates: landscape, frame, print](#coordinates-landscape-frame-print)
- [Terrain](#terrain)
- [Sea level](#sea-level)
- [Bands and colours](#bands-and-colours)
- [Contours and simplification](#contours-and-simplification)
- [Engraving: hachures, stipple and water lines](#engraving-hachures-stipple-and-water-lines)
- [Screen rendering](#screen-rendering)
- [Export pipelines](#export-pipelines)
- [Limits and performance](#limits-and-performance)
- [Known limitations](#known-limitations)
- [Possible future work (not implemented)](#possible-future-work-not-implemented)

## Architecture

All computation happens in the visitor's browser, on the page's main thread. There is no server component, no Web Worker and no build step.

| File | Namespace | Responsibility |
|---|---|---|
| `model.js` | `IG.model` | Pure maths, no DOM and no p5: seeded noise, terrain, centres, field sampling, sea level and bands, marching squares, line simplification, smoothing, hachures, stipple, distance transform, page sizes, presets. |
| `ui.js` | `IG.settings`, `IG.ui` | The settings object, every control, the caption and *This map* facts, the address-bar state, centre edits, panels, tooltips, keys and the actual-size preview overlay. |
| `geo_graphic.js` | `IG.sketch` | The p5 instance: the view and frame, the change tiers, progressive sampling, colour palettes, on-screen contour and engraving rendering, the overlay, pointer input, and all exports including a minimal 16-bit PNG encoder. |
| `index.html`, `geo_graphic.css` | n/a | Markup, help text and styles. |

The scripts are plain scripts sharing `window.IG`, loaded in order p5 1.9.0 → `model.js` → `ui.js` → `geo_graphic.js`. p5 provides the canvas and draw loop. The terrain is a plain JavaScript function, so the screen, the statistics and every export call the same `height(x, y)`.

## Coordinates: landscape, frame, print

- **Landscape units.** The terrain is defined everywhere. Its **unit square** [0, 1] × [0, 1] holds the generated island centres and is the reference for sea level. The terrain is always built with aspect 1 (`terrainParams()`), so the landscape doesn't depend on the sheet.
- **Frame.** The sheet ratio (`ratio()`) gives a frame fitted at 92 % of the free area between the panels (`frameScreen()`). At zoom 100 % the unit square just fits inside the frame. Zoom (25–1600 %) and pan (`panX`, `panY`, the landscape point at the frame centre) give the mapping `toScreen` / `toPage` (`view()`). `frameRect()` is the rectangle of landscape under the frame, and it is what gets exported. With **Sheet: None**, the frame is the whole free area.
- **Print.** `printMM()` makes the long edge equal to the chosen print size (210, 297 or 420 mm from the buttons; 100–1000 mm accepted from a link) and derives the short edge from the ratio. `pagePixels(dpi)` converts to pixels and caps the total (see [Limits](#limits-and-performance)).

## Terrain

`makeTerrain(P)` in `model.js` returns `height(x, y)` (roughly 0..1) and the list of centres.

### Noise

- **Seeded gradient (Perlin) noise**, `makeNoise(seed)`: a 256-entry permutation shuffled by the mulberry32 generator, eight gradient directions, the quintic fade 6t⁵ − 15t⁴ + 10t³, and bilinear blending. The output is roughly −1..1. It is written in the page rather than taken from p5's `noise()`, so seeds reproduce exactly at any resolution and the model has no p5 dependency.
- Three independent fields come from the seed: `n1` (seed), `n2` (seed + 101), `n3` (seed + 202).

### fBm

`fbm(noise, x, y)` sums 6 octaves, each at 2.03 × the previous frequency and *gain* × the previous amplitude, with gain = 0.3 + 0.45 · *Surface roughness*. The sum is normalised by 1.4 / √(Σ amplitude²), by its spread rather than its peak. Dividing by the amplitude sum, as the first build did, left heights in a narrow band that the island mask overwhelmed, so every island came out round.

The base height is `e = 0.5 + 0.5 · fbm(n1, nx, ny)`, with `nx = x · scale + 37.1`, `ny = y · scale + 11.7`. *Feature smoothness* stores `scale`, the number of noise cycles across the landscape's width; the slider runs in reverse, so moving right makes features smoother.

### Domain warping (Coast warp)

When *Coast warp* is above 0, the input point is moved before both the noise and the island mask are read:

```text
bx, by = x · scale + 37.1, y · scale + 11.7
x += fbm(n2, 0.5·bx,       0.5·by      ) · 0.12 · warp
y += fbm(n3, 0.5·bx + 5.2, 0.5·by + 1.3) · 0.12 · warp
```

Warping the mask as well as the noise is what makes coastlines wander instead of following circles around the centres.

### Ridges

`ridged(n2, 0.7·nx + 9.1, 0.7·ny + 3.3)` is a ridged multifractal in the style of Musgrave, over 6 octaves:

```text
r    = 1 − |1.4 · noise(x·f, y·f)|      fold: zero crossings become crests
r    = r² · prev                         narrower crests, flatter ground between
prev = min(1, 1.6 · r)                   finer octaves show mostly on high ground
sum += amplitude · r;   ridged = sum / Σ amplitude
```

The result is blended in: `e = (1 − ridges) · e + ridges · ridged`, then clamped to 0..1.

**Correlation:** the ridge field uses noise field `n2`, which is also the field behind the x-direction warp, at a different scale and offset. The ridges are independent of the base terrain `n1`, but not of the warp.

### Elevation exponent

`e = e ^ exponent` (0.4–3 on the slider, default 1.3), the `pow(n0, elev)` of the 2020 sketches.

### Island mask (Land weight)

When *Land weight* (`focus`) is above 0 and there are centres (or the shape is Coast), a distance `d` is measured in units of the *Island factor* `R`, and the height is lifted near the centres:

```text
g = 0.7 · (1 − 1.8 · tanh(d / 1.8))
e = (1 − focus) · e + focus · (e + g) / 2
```

At full weight the second line is the 2020 sketches' `(1 + e − d) / 2`, with the distance term softened. `g` is 0.7 at a centre, falls through zero at about d ≈ 1.13, and approaches −0.56 far away, so distant ground is pushed down towards the sea without a hard edge. Versions 5.0–5.6.1 clamped the distance with a hard `min(d, 1.8)`. The lift's slope switched off abruptly there and creased the terrain along a line at 1.8 R; the `tanh` form approaches the same limit smoothly.

The distance `d` depends on the **Shape**:

- **Islands**: the distances to all centres, combined with a smooth minimum (log-sum-exp, width 0.12):
  `smin(d₁…dₙ) = m − 0.12 · ln Σ exp(−(dᵢ − m) / 0.12)`, where m = min dᵢ.
  A hard minimum would crease the terrain where the nearest centre changes. The smooth minimum rounds those seams and lets nearby centres merge.
- **Spine** (two or more centres): the distance to each segment of the polyline through the centres, in order, combined with the same smooth minimum. With one centre, Spine falls back to Islands.
- **Coast**: a tilted plane. `u` is the unit direction from (0.5, 0.5) to the first centre (straight down if they coincide), `s` is a point's position along `u`, and `d = (ext − s) / (3.2 · R)`, where `ext` is the unit square's half-extent along `u`. The land lies towards the marker.

With no centres (all removed) and a shape other than Coast, the mask is skipped.

### Centres

`generatedCentres()` places *Islands* centres using the seeded generator (`rng(seed · 31 + 7)`). One centre goes in the middle. More are placed by dart-throwing: up to 30 tries each, aiming for a minimum spacing of 0.55 · √(1/n), within a margin of min(0.3, 0.6 R). For Spine they are sorted top to bottom. `makeCentres()` then applies the user's edits: removals and moves keyed by generated index, plus added centres, which are appended. The interface discards index-keyed edits when the seed, count or shape changes.

## Sea level

`pageReference()` samples the unit square on a 96 × 96 grid and sorts the 9,216 heights. `levels(ref, sea, bands)` takes the sea-level height as the quantile at the *Sea level* share. Sea level therefore means "this share of the reference square is under water", whatever the other controls do, and panning or zooming never moves the coast. The quantile comes from a coarse grid, so the exact share is approximate, and the share of land *inside the frame* (shown in *This map*) is a different quantity.

**The coastline and the Elevation exponent.** The interface's help text says the coastline stays generally stable when the exponent changes. It is exactly unchanged only when **Land weight is 0**: the height is then `e^p`, a monotonic function of `e`, so the quantile picks out the same set of points. With Land weight above 0, the exponent is applied *before* the spatially varying mask term is added, so the order of heights across the map changes with the exponent. The amount of sea stays fixed, but its outline can move. As a check, the default landscape (seed 2020) was compared on a 192 × 192 grid at exponents 0.7 and 2.5. With Land weight 0, no cells changed between land and sea. With Land weight 0.9, 2.8 % of cells changed, while the land share stayed at about 38 %.

## Bands and colours

- **Land levels**: `step = (top − sea) / bands`, where `top` is the highest height in the reference square. The levels are `sea + b · step` for b = 0..bands−1. Terrain outside the reference square can be higher than `top`; it takes the top band.
- **Sea levels**: the same number of bands from the coast down to the deepest reference point, each with its own step `depthStep = (sea − min) / bands`, because the sea is usually much deeper than the hills are high.
- **Bands = 0** means smooth shading through a 256-step colour table; contour lines are then only the coast, and no depth lines are drawn.
- **Palettes** (`palette()` in `geo_graphic.js`): Grey (land 96–246 grey), Thermal (hue from 270° down to 0°, cold to hot), Topographic (a ramp of green, tan, brown, rock and snow). Without *Depth contours* the sea is a single flat colour; with it, the sea runs from a visible shallow tone to deep.

## Contours and simplification

- **Marching squares**, `isolines(field, level, pad)`: each grid cell is classified by which corners are at or above the level, and the crossing point on each edge is found by linear interpolation. Saddle cells (two opposite corners above) are resolved by the average of the four corners. Segments are chained through shared edges into polylines, open ends first, then closed rings, which repeat their first point.
  - `pad = false` (contour lines): lines stay open where they leave the grid.
  - `pad = true` (filled SVG layers): everything outside the grid is treated as −∞, so every region above the level closes along the border.
- **Simplification**: Ramer–Douglas–Peucker, `simplify(line, tol)`, keeps the end points, so closed rings stay closed. SVG exports use a tolerance of 0.08 mm of print.

## Engraving: hachures, stipple and water lines

All engraving sizes are in millimetres of print. The tracer works on a field sampled at `spmm` samples per millimetre: 4 per mm (or fewer on very large sheets) for exports and the preview, and whatever the screen resolution gives on screen.

**Shared steps** (`buildHachuresSteps()`):

1. **Smoothing**: the strokes are traced on a copy of the field blurred by three box blurs (close to a Gaussian) of radius 1.6 mm (`blurField()`), so they follow landforms rather than every ripple of the noise. The coast and water lines use the unsmoothed field.
2. **Steepness scale**: `g90` is the 90th percentile of gradient magnitude on land (sampled every third cell), so "steep" is relative to this landscape. A stroke's slope weight is `t = min(1, |gradient| / g90)`; ground with `t` below 0.12 is left white.

**Hachures**, `hachuresSteps(field, rows, opts)`, after Lehmann's slope hachures:

- The rows are finer than the display bands: `max(4, ceil(48 / bands))` rows per band, so at least 48 in all, aligned with the display bands. With 0 bands there are 48 rows.
- For each row between a lower contour and an upper one, there are two passes, with seeds every 0.6 mm (`pitch`) along the contour, staggered between rows:
  1. from the **upper** contour **downhill** to the lower one (strokes fan out going down, so nearly all reach it);
  2. from the **lower** contour **uphill**, only where space is still empty. This fills the wedges between fanning strokes, and is the only pass for the top row, which runs to the summit.
- Each stroke follows the gradient in 0.2 mm steps. It stops at the target contour, at the grid edge, where the ground flattens below 0.08 · g90, on reaching a cell of the occupancy grid (cell size 0.55 · pitch) already used by another stroke, or at the **length cap** (*Stroke length*, 1–2.5 mm, or unlimited when off).
- Each row reuses the previous row's upper contour as its lower one, so each contour is traced once.

**Stipple**, `stippleSteps(field, sea, opts)`:

- Seeds sit on a jittered grid with one seed per occupancy cell (cell = max(0.5 samples, spacing / 2)), shuffled with the seeded generator.
- Each stroke is centred on its seed and grows in both directions along the gradient, to a total length from 0.4 mm (gentle) up to *Stroke length* (1–5 mm, steepest), in proportion to `t`.
- A stroke stops when it comes within about *Spacing* (0.2–0.5 mm) of an existing stroke (a 3 × 3 cell neighbourhood check) or reaches the sea. It is dropped if that leaves it shorter than 0.2 mm.

**Weight and light**, after Dufour: `shade = (1 + ĝ · light) / 2` is 0 on a slope facing the light and 1 facing away, where ĝ is the stroke's summed uphill gradient direction. The stroke weight is `t · (0.15 + 0.85 · shade)`. Strokes are sorted into 10 weight buckets drawn from 0.04 to 0.34 mm. *Light from* is a compass bearing (0° north, default 315°). Strokes keep their slope and gradient, so moving the light only re-sorts them into buckets and never re-traces them.

**Coast and water lines**: the coast is drawn at 0.35 mm. For water-lining, `distanceFromLand()` computes an exact Euclidean distance transform (the Felzenszwalb–Huttenlocher algorithm) of the sea cells. Its isolines at 0.6 mm from the coast, then at gaps of 0.5 mm growing by 30 % each, give ten lines at 0.1 mm weight.

## Screen rendering

**Change tiers.** `ui.js` sends each change into one tier, and `geo_graphic.js` keeps dirty flags:

| Tier | What reruns | Typical settings |
|---|---|---|
| terrain | `makeTerrain`, the reference grid, the screen field | seed, terrain and land controls, centres, shape |
| view | the screen field is resampled | zoom, pan, window size, sheet ratio, panels |
| levels | recolour and re-contour the existing field | sea level, bands, style, depth, contour lines |
| none | readouts only | print size, dpi, marker visibility |

Switching between a paper style (Lines, Engraved) and a colour style resamples, because the paper styles stop at a coarser resolution.

**Progressive sampling.** The screen field is sampled in passes. The first uses the coarsest step from {1, 2, 3, 4, 6, 8, 12} pixels expected to take under about 25 ms, estimated from a running average of the measured cost per sample. Later passes halve the step down to 1 pixel (2 for paper styles). Each pass runs for at most 10 ms per frame (`sampleField().run(10)`). Until a new field is finished, the previous one is drawn at its own position, so panning and zooming never blank the view.

**Contours on screen** are traced at no finer than half resolution.

**Engraving on screen** is traced only once the field reaches half resolution. The tracer is a generator that yields between passes, rows and every 1,024 stipple seeds. The sketch runs it for about 12 ms per frame and drops unfinished work when the field or a stroke-moving setting changes. A finished engraving is drawn once into its own canvas (`rasterHach()`), which is then just placed and scaled each frame. Moving the light redraws that canvas without re-tracing. The previous engraving stays visible, positioned by its own view, until the new one is ready.

**Map facts** (`stats()`) sample the frame on a 96-wide grid, about 150 ms after the view stops changing. They count connected land with 4-neighbour flood fill, ignoring specks under 3 cells, and count lakes as water pieces that don't touch the frame edge.

## Export pipelines

All exports cover `frameRect()` at the print size. Progress is reported in the toast; sampling yields to the browser every ~40 ms.

| Export | Resolution | Pipeline |
|---|---|---|
| **PNG** | print mm × dpi, capped at 60 Mpx (dpi reduced if needed) | `renderPage()`. Colour styles: sample at most ~5 M points (`sampleSize()`), bilinearly interpolate to every output pixel and colour by band, 256 rows at a time. Lines and Engraved: draw paper, then sample a separate grid at up to 4 samples/mm (at most ~2.5 M samples), trace contours and/or engraving on it, and stroke with widths in mm × pixels per mm. |
| **Actual-size preview** | the same, at min(300, 192 × devicePixelRatio) dpi | `renderPage()` onto a canvas shown at `mm / 25.4 × 96` CSS px (×1 or ×2). |
| **Heightmap** | print mm × min(dpi, 300), same pixel cap | Sample at most ~5 M points, interpolate, and normalise by the **lowest and highest sampled heights inside the frame** to 0..65535. Written as 16-bit big-endian greyscale, one unfiltered scanline per row, compressed with the browser's `CompressionStream('deflate')`, and wrapped by a small in-page PNG writer (signature, IHDR, one IDAT, IEND, with CRC-32). No gamma or colour-space chunk is written. |
| **SVG lines** | geometry from a grid of up to 4 samples/mm (at most ~1.5 M samples) | Unpadded marching squares per level, RDP at 0.08 mm, coordinates in mm to 2 decimals. One Inkscape layer per level (coast 0.5 mm, every fifth level 0.35 mm as an index contour, others 0.18 mm, depth 0.15 mm), deepest first. In Engraved style it also traces the engraving on the same grid and adds a water-lines layer and an engraving layer, with strokes grouped into 10 paths by weight. |
| **SVG layers** | as SVG lines | Padded marching squares per level, giving closed rings of the whole region above each level as one even-odd filled path. Layers are stacked bottom to top over a sea-coloured background rectangle. Fill colours come from the current palette (or paper greys for paper styles). |

Each SVG begins with a comment holding the version, the seed and the settings query string (`location.search`, with `--` escaped as XML comments require). The page's address, which would include a local folder path when opened from disk, isn't written.

The heightmap is **relative to the exported crop**: two crops of the same landscape are on different scales. It also inherits the interpolation of a ≤5 M-sample grid, so it isn't a sample-per-pixel evaluation of the terrain on large sheets.

## Limits and performance

| Limit | Value | Where |
|---|---|---|
| Export raster | 60 Mpx; dpi lowered to fit | `PX_CAP`, `pagePixels()` |
| Colour-style and heightmap sampling | ~5 M samples, interpolated | `sampleSize()` |
| Line and engraving sampling (PNG/preview) | ≤ 4 samples/mm, ≤ ~2.5 M samples | `renderPage()` |
| SVG sampling | ≤ 4 samples/mm, ≤ ~1.5 M samples | `exportSVG()` |
| SVG simplification | 0.08 mm | `exportSVG()` |
| Sea-level reference | 96 × 96 samples of the unit square | `pageReference()` |
| Map facts | 96-wide grid of the frame | `stats()` |
| Screen frame budget | sampling 10 ms, engraving ~12 ms per frame | `s.draw()` |

- **Main-thread work.** On screen, the work is sliced to keep the page responsive. In exports and the preview, terrain sampling is chunked but the engraving is traced in one call (`buildHachures()` runs the generator to the end), so the page is unresponsive for that part. Development measurements in September 2026, on the developer's desktop with the Mountain range preset at A4 / 300 dpi, were about 6.2 s for hachures and 3.7 s for stipple. During on-screen zoom and pan, the worst frame was about 80 ms (the one-off raster). These numbers are dated and machine-specific, not benchmarks.
- **Memory.** Large exports allocate the full output canvas (up to 60 Mpx × 4 bytes ≈ 240 MB for RGBA), plus the sampled grids and, for engraving, the stroke lists. The heightmap also holds an uncompressed 16-bit buffer of the same pixel count. Peak memory hasn't been measured.
- **Browser features.** The heightmap needs `CompressionStream` (published support: Chrome 80+, Firefox 113+, Safari 16.4+); other exports use standard canvas, Blob and download APIs.

## Known limitations

- The ridges are global noise and don't follow the Spine, which is why the *Mountain range* preset reads as ridged hills around a spine rather than a single clear range.
- The ridge field shares a noise field with one warp axis (see [Ridges](#ridges)).
- The coastline can move slightly with the Elevation exponent when Land weight is above 0 (see [Sea level](#sea-level)).
- The actual-size preview assumes 96 CSS px per inch; it isn't calibrated to a particular monitor.
- The heightmap is normalised per crop and interpolated (see [Export pipelines](#export-pipelines)).
- Exports block the main thread while tracing engraving.
- Pinch-zoom isn't implemented; real-device testing on phones and high-DPI desktops is pending.
- Lists of added, moved or removed centres read from a link have no length limit.
- SVG output hasn't yet been tried in Inkscape, laser software or on a plotter.
- Some comments refer to a design document that isn't in this repository.

## Possible future work (not implemented)

Ideas recorded during development. None of these is a commitment:

- ridges that follow the Spine direction, and a separate noise field for the ridges;
- a hillshade style;
- engraving as an overlay on the colour styles; a hachure density control; sliders for the fixed smoothing, sunlit weight or rows per band;
- caching the preview render, or a paper-zoom view;
- pinch-zoom;
- moving export work to a Web Worker, after measuring.
