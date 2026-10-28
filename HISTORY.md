# Geo-Graphic: development history

Geo-Graphic, formerly *Island Generator*, has two phases. The first is Jesal Mehta's hand-coded p5.js noise sketches of 2020 and 2021, which already had the core of the tool: noise turned into terrain, banded into contours, shaped into islands, with working sliders. The second is a 2026 redevelopment, built with an AI coding assistant writing the code under the author's direction and through repeated reviews. This document follows the work in order. It keeps three things distinct: what the original sketches actually did, what they only planned, and what was added later.

Selected original sketches are in [`archive/`](archive/README.md) and can be run.

## A note on dates and history

- The 2020–2021 sketches were made **outside Git**. Their dates below come from the sketch files' last-modified times, which are evidence but not proof of when they were written.
- The Git history of this repository **starts at v5.0** (29 September 2026). The original sketches were added later as ordinary files in [`archive/`](archive/README.md), without backdated commits.
- Version numbers within a sketch family give a likely order. They don't establish an exact calendar order across families, and missing numbers (there is no v2.1 or v4.1) don't mean such versions existed.

## 1. Perlin Contour (February–March 2020)

In the author's words, "a series of sketches that uses Perlin Noise to create a countour map, initially with a mouse variable, but later with sliders and inputs." Seven versions survive:

| Version | Sketch dated | What it does |
|---|---|---|
| v1.0 | 12 Feb 2020 | p5's `noise()` per pixel as grey values, on a 400 × 400 canvas; the field drifts frame to frame. |
| v2.0 banding | 21 Feb 2020 | Heights rounded down into `b` bands: the contour-map look, as raster bands rather than vector lines. |
| v2.2 banding mouseX | 22 Feb 2020 | Mouse X sets the band count; the map holds still; a click saves a JPG. |
| v3 sealevel | 22 Feb 2020 | Mouse Y sets an **elevation exponent** (`pow(n, elev)`); mapping from `b/3` turns the lowest third of the bands black, giving oceans. |
| v4.0 islands | 22 Feb 2020 | A radial **island mask**, `(1 + e − d) / 2`, the formula from Red Blob Games' *Making maps with noise*. |
| v4.2 islands cleaned | 22 Feb 2020 | **Sliders** for Bands, Elevation exponent and Island factor, with live readouts. |
| v4.3 nonIsland cleaned | 7 Mar 2020 | The island focus moved off-centre (to a third of the width and height), an A-series 420 × 594 canvas, **Save Image** and **New Scape** buttons, and a header of notes and to-dos. |

So the pipeline noise → exponent → island blend → bands, its main controls and image saving were all implemented by hand in 2020.

### What the 2020 notes planned

The v4.3 header records observations and a to-do list (original spelling):

> - value of t, the Perlin increment, gives interesting variations ranging from very smooth to chaotic
> - colour version was attempted, and works, switching between colour and BW did not work. Col version looks like thermal imaging.
> - To Do - Update the draw loop to
>   a. Make as many functions as possible
>   b. Only re-Draw canvas when updates are needed else it's wasteful on processing power
>   b2. Some things can be computed in setup and maintained (all things can be, but then no live updates)
>   c. Mouse-click to Island focus ?
>   d. Islanding was interesting when using distance from an edge as well, instead of points
>   e. Multiple islands when clicked, and distance from the nearest is used in IsleElev

These items, along with a thermal colour treatment (present only as commented-out code in v4.3), are the author's ideas from 2020. The 2026 version implements them: modular functions, redraw-on-change and cached fields, click-to-place and multiple centres measured to the nearest, and a Coast shape based on distance from an edge. The ideas came first and the implementation came later; neither phase should be credited with the other's part.

### Known problems in the 2020 code

These were found when the sketches were read again in 2026. They are left unfixed in the archive.

- The sketches use `colorMode(HSB)`, where a single-argument `color(f)` is brightness out of 100, not 255. v4.3's hard-coded maximum of 150 ("usually 150 was good") therefore turns the top third of the heights flat white.
- The colour/BW toggle (commented out in v4.3) set `fillFlag = TRUE`. `TRUE` isn't defined in JavaScript, which would explain why "switching between colour and BW did not work".
- In v4.2 and v4.3, the key handler compares `key == s` with an undefined `s`, so any key press throws an error. (Reproduced in a 2026 test run.)
- v4.3's third slider is labelled "Max Elevation (255)" at first, but it is the island factor, and the first frame relabels it.
- v1.0 writes its image buffer with alpha 1 out of 255, so what shows is mainly the ~160,000 ellipses drawn per frame. That makes it slow: about 4 frames per second in a 2026 test run.

## 2. Related experiments (2020–2021)

The seven contour sketches aren't the author's only work on noise terrain. Related folders from the same archive explore ideas that the 2026 version also uses. They were not imported into the 2026 code, and no line-by-line derivation is claimed. They show that these techniques were already part of the author's exploration:

- **Contour heightmap** (February–March 2020): noise-to-height experiments in 3D (WEBGL triangle strips, height-sized ellipses). One of these is explicitly an adapted third-party example: it credits Daniel Shiffman / The Coding Train, edited by SacrificeProductions. These aren't included in the archive.
- **Perlin Circle** (June 2021): circle vertices displaced by noise.
- **Domain Warping: Perlin fractional** (June 2021): noise sampled at coordinates that are themselves produced by noise, which is **domain warping**. (The *Perlin modulus* variants in the same folder remap noise values modulo 1 into colour bands; that is value remapping, not coordinate warping.)
- **Perlin Topography** v1.0–v2.2 (July 2021): 3D-coordinate noise with sliders for bands, elevation exponent and island factor. There is an explicit **no-banding (smooth) option**, normalisation by the previous pass's maximum, a **ridge threshold** that folds heights above it (v2.1, v2.2), and in v2.2 an exponent that itself varies with a second noise field. v2.2 is in the archive.

When the assistant compared the 2026 terrain with the seven imported 2020 sketches, it reported ridges and warping as "new". The author challenged this, remembering that ridges existed elsewhere in their work. The 2021 sketches confirm it. The accurate statement is narrower: the current *ridged multifractal* and *warped mask* are new implementations in this tool, while ridging and domain warping were ideas the author had already explored.

## 3. The 2026 redevelopment

In September 2026 the author asked for a new page built from the 2020 sketches:

> a page that provides the controls to manipulate noise based islands
>
> - exports the islands as vectors or images
> - controls allow to go from island to mainland landscape, variable sealevel, central large island to archipelagos, mountain ranges etc, using just the same set of parameters and slider inputs

The phrase *"using just the same set of parameters"* shaped the design: presets are named settings within one shared set of controls, not separate modes. The code was written by an AI coding assistant. The author set the brief, chose between the options put to them, reviewed each round and asked for corrections. The record below distinguishes the author's choices from the assistant's proposals and build decisions.

### v5.0: the first build (29 September 2026)

Choices put to the author and the answers given:

- **Centres:** generated from the seed *and* editable by clicking ("Both").
- **Outputs:** SVG contour lines and SVG filled band layers; PNG at print resolution and a heightmap PNG. DXF was offered and not chosen.
- **Styles:** grey bands (the original look), thermal, and contour lines only. Hypsometric (atlas) colour was offered and not chosen at this stage.
- **Layout:** the author described it: "full bleed canvas, controls float above, like DoP, but controls for export for page dimensions and zoom". That is the *Dance of Planets* shell, with the right panel used for the page.

Decisions made while building, listed for later review:

- **Its own seeded Perlin noise** instead of p5's `noise()`, so seeds reproduce exactly at any export size.
- **fBm normalised by spread, not by peak.** The first build's heights were bunched so tightly that the island mask overwhelmed them and every island came out as a circle. Changing the normalisation fixed this.
- **Coast warp moves the coordinates of both the noise and the mask.** Warping the noise alone left the mask's circles intact.
- **Sea level as the share of the landscape under water**, a quantile, so it means the same thing whatever the other sliders do.
- **Redraw only on change, in tiers, with progressive sampling.** This is the 2020 to-do (b).
- **Exports sample at most ~5 M points and interpolate**, because the finest noise detail is far coarser than a print pixel.

### v5.1–v5.2: making the controls the author's own (29–30 September)

The author's first review removed things that looked backwards ("presets - dont need the 2020 version", "Dont need 2020 colours"), asked why the shape buttons sometimes disappeared (hiding them at Land weight 0 read as a glitch), asked for a *None* sheet "if I want to admire the whole thing without the boundary", asked for full-height panels with a scroll hint, and reported that depth contours under the sea didn't work. They were being drawn, but invisibly: the sea shades were all within a few levels of black, and the depth lines used the land's step.

The author's biggest concern was different:

> The biggest issues is that I dont relate my work with these controls, and I have tragically forgotten a lot of my work since it was from many years ago

The assistant laid out a comparison of 2020 sketch terms against the new controls, with four options, including a teaching-style step-by-step stepper. The author chose instead to **rename the controls using their own vocabulary**: "I'd go with 3 - use my names, then I'll update from there", with refinements: "feature scale = feature smoothness, roughness = surface roughness, contour bands is ok". *Elevation exponent* and *Island factor* come straight from the 2020 sliders.

The author also set the **order of the panel**, "Presets / Land and Sea / Terrain details / Visual controls … I think this is a more logical flow. Make each section collapsible", and asked for the page to speak to strangers: "Move large helper text to tooltips/hover etc. As a possibly public page going forward, I dont need references to "your 2020 tool" "your xyz" etc." Help text moved behind ⓘ icons (hover or tap). *Feature smoothness* was reversed so that moving right is smoother, with the stored value unchanged.

The author also asked how the shape buttons and ridges work mathematically. The answer became the basis of [docs/TECHNICAL.md](docs/TECHNICAL.md).

### v5.3–v5.4: colours and names

Hypsometric colour, declined in v5.0, was added in v5.3 at the author's request as *Topology*, together with a contour-line overlay; *Land focus* became *Land weight*. In v5.4 the author renamed *Topology* to the established cartographic term **Topographic**, and asked that the Contour lines toggle stay visible (shown on and greyed out) in Lines style, where it can't be turned off.

### v5.5: separating landscape, frame and print (30 September)

The first version tied the landscape to the sheet: one sheet width was one unit, and zoom only moved the screen view. The author corrected this:

> Sheet should not be locked in to a pixel:mm ratio, this makes all the A4, A3, square a fixed size, no way to zoom in or out to the viewers choice proportional to the page - instead have - A-series, square, 4:3, 16:9, custom aspect ratio, and zoom+pan controls what sits in that boundary

The result is the current model:

- the landscape has its own coordinates;
- the sheet is a frame of a chosen ratio, fixed on screen, with zoom and pan choosing its contents;
- those contents are what exports and what links store;
- resolution is print size × dpi. The author had queried what dpi was adding ("likely just the export resolution literally"), and it was kept as exactly that.

The author also asked for lighter text in the facts panels and for *Under the hood* to use the 2020 sketches' own notation (`t`, `noiseDetail`, `elev`, `isleFac`, `isl`, `b`). They asked whether a smooth, unbanded option would cost too much processing. It doesn't (it is marginally cheaper), so Contour bands now runs from 0 (smooth).

Two follow-ups came from the author's checks of that rule:

- **v5.5.1:** no depth lines when bands is 0.
- **v5.5.2:** the sea gets the same number of bands as the land, each side with its own step.

### v5.6: hachures (30 September)

The author asked:

> Colours - How difficult would it be to render each contour band as old school hatching - radially outward from higher contour to lower contour, density of hatch maps to height, etc ?

The assistant identified this as *hachures*, in the tradition of Lehmann (1799) and the Swiss Dufour map. It judged a basic version moderate work, said the hard part was keeping the spacing even, and offered a cheap pattern-hatching fallback. The author's decisions: switch between slope- and height-weighting "until I lock one", add water-lining for the sea, treat hachures as a colour theme for now, and "pattern fallback is too basic - basic version yes."

Two corrections followed, both from what the author saw:

- **v5.6.1: terraces.** Strokes were seeded on each band's lower contour and traced uphill. On a hill they converge, and counting where they ended showed that 62 % stopped on a neighbour before reaching the next contour; only 27 % reached it. That produced visible terraces. The fix traces downhill from the upper contour first (strokes fan out and nearly all arrive), then uphill into the remaining gaps.
- **v5.6.2: creases.** The author noticed a crease running parallel to a spine. Its cause was the mask's hard distance clamp, `min(d, 1.8)`, plus the hard minimum between centres and segments. Both were replaced with smooth versions (`tanh` and a log-sum-exp smooth minimum).

### v5.7: Engraved, with hachures and stipple (30 September)

> hachures still dont look very good.

Four likely causes went back to the author: the terrain was too busy, strokes curled like hair, contrast was weak, and rows still showed. The author agreed it was all four. They brought in Warren Davison's article on dynamic hachure contours, and proposed a different rule: low slope means short lines, high slope means long lines, with heavier lines on the side away from the sun.

The assistant pointed out a conflict. When strokes run from contour to contour, steep ground (where contours crowd together) naturally gives short strokes, so "steep = long" means strokes no longer tied to contours. Instead of arguing it out, both were drawn: a comparison sheet with four panels on the same map (the then-current method; finer rows on smoothed terrain; that plus sun weighting; and free strokes growing with slope, plus sun), later with sliders.

The author judged the results and chose the settings:

> 3 : looks like hachures classical … length cap = 1 is cool, with some whitespace … below 1 it becomes mini hatches following the contour, which is a distinct look, but i dont think i want it
> 4 : looks more like stippling under certain settings … 0.2 is a good dense stipple, upper limit 0.5 … keep 1-5 mm range, longer strokes with closer spacing give density even though longer strokes with fartehr spacing look like fur or stubble

From this came one **Engraved** theme with a **Hachures | Stipple** switch (chosen over two separate buttons because the modes share nearly everything), the stroke-length and spacing ranges the author picked, sun weighting with a *Light from* control, and removal of the height-weighting switch, settled in favour of slope.

### v5.8: actual-size preview (30 September)

> Stipple at 0.2 vs 0.5 - no particular difference … the density and the overall look is not a nice as the test page ones.

The cause turned out to be the scale of the screen, not the drawing. The fitted view shows an A4 sheet at about 2.5 px per mm, so 0.2 mm spacing is half a pixel. The exports differed as they should: crops of real A4 exports showed 0.2 clearly denser than 0.5 (the third image in the [README](README.md#export)). Three options went to the author:

- (A) an actual-size preview that reuses the export renderer;
- (B) a second, paper-zoom view;
- (C) a coarser engraving on screen only, which would make the screen no longer match the export.

The author chose to try A.

### v5.8.1: keeping Engraved responsive (30 September)

The author reported that zooming, and then panning, were slow in Engraved. Measurements showed that the whole screen's engraving was traced in one blocking call (1.3 s for hachures, 2.8 s for stipple) and that ~40,000 strokes were re-stroked every frame. The fix:

- tracing a slice per frame, as a generator;
- keeping the previous engraving visible until the new one is ready;
- drawing a finished engraving once into its own canvas;
- limiting stipple seeding, which had reached about 11 million seeds on screen.

The worst frame during zoom and pan dropped to about 80 ms.

### Renaming to Geo-Graphic (October 2026)

While the tool was being prepared for public release as its own repository, it was renamed **Geo-Graphic**. The page title and heading, the source file names (`geo_graphic.js`, `geo_graphic.css`) and the export file names (`geo-graphic-…`) were renamed to match; the historical record keeps the original version names.

## 4. What came from where

| | In the original sketches (2020–2021) | Planned in the 2020 notes | Added in 2026 |
|---|---|---|---|
| Noise terrain, banding, elevation exponent | Implemented (Contour v1.0–v3) | | Own seeded noise; fBm with a roughness control; quantile sea level |
| Island mask `(1 + e − d) / 2` (after Red Blob Games) | Implemented (v4.0–v4.3), from one fixed point | | Blend weight, smooth tanh falloff, smooth minimum across centres |
| Sliders for bands, exponent, island factor; save and new-scape buttons | Implemented (v4.2–v4.3) | | Renamed and regrouped by the author; seeds, presets, links |
| Thermal colour | Tried (commented out in v4.3) | Colour/BW switch | Working Thermal style; Topographic; Lines; Engraved |
| Redraw only when needed; modular code; cached computation | | To-do (a), (b), (b2) | Change tiers, cached fields, progressive sampling, `model.js` |
| Clickable and multiple centres, nearest-distance | | To-do (c), (e) | Generated plus editable centres |
| Land from an edge | Reported as tried, not in the surviving code | To-do (d) | Coast shape |
| Smooth versus banded | Implemented (Topography 2021) | | Bands 0 across all styles, depth and export |
| Ridges, domain warping | Explored (Topography v2.1–v2.2, Domain Warping, 2021) | | Ridged multifractal; warp of noise and mask; Spine shape |
| Raster image saving; A-format canvas | Implemented (JPG; 420 × 594) | | Ratio frame, pan and zoom, print size and dpi, actual-size preview |
| Vector contours, filled layers, 16-bit heightmap | | | New: marching squares, RDP, SVG layers, in-page PNG encoder |
| Hachures, stipple, sun weighting, water-lining | | | New in the available record, at the author's initiative, informed by Lehmann, Dufour and Davison |
