# AMCE · Solar Charging Chair · Concept Showcase

A scroll-driven 3D showcase built with **Vite, React, Three.js and GSAP ScrollTrigger**, with Lenis for smooth scrolling.

> The chair on screen is a **stand in and not the final design**. It is built in code from a temporary reference photo, used only for testing.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal (usually http://localhost:5173).

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server |
| `npm run build` | Builds the production site into `dist/` |
| `npm run preview` | Serves the production build locally |

No external 3D files are needed. Every texture is generated in code, lighting comes from the built-in RoomEnvironment, and the fonts ship with npm.

## Project map

| File | Purpose |
| --- | --- |
| `src/chair.js` | The chair. Holds `CHAIR_CONFIG` (dimensions, hotspot anchors, explode offsets, finishes), the procedural model and the GLB loader |
| `src/showcase.js` | Renderer, lighting, sun path, camera views and moves, environment crossfade, cleanup |
| `src/environments.js` | Studio Plain (cyclorama) and Hotel Terrace (travertine floor, stone parapet, sky) |
| `src/textures.js` | Canvas textures: bouclé weave, timber, stone, brushed metal, solar cells, travertine |
| `src/story.js` | Scroll story: Lenis, ScrollTrigger sections, text reveals |
| `src/copy.js` | **All placeholder copy** |
| `src/components/` | React UI: sections, HUD, specifications drawer, hotspot lines |
| `src/styles.css` | Layout, palette, responsive rules |
| `vite.config.js` | Includes a small plugin that detects optional GLB and HDR files |

## Swap in the real GLB

1. Export the final chair as `amce-chair.glb`. Draco or meshopt compression both work.
2. Put it at `public/models/amce-chair.glb`.
3. **Restart** `npm run dev`. The site checks for the file at startup.

The model is fitted and centred automatically. Its height is scaled to `CHAIR_CONFIG.fitHeight` (metres), it is centred on its bounding box, and it rests on the floor. Every mesh casts and receives shadows.

Optional GLB conventions:

- Name materials `frame` and `cushion` and the finish swatches will recolour them.
- Name a material `indicator` (with an emissive colour) and it will glow softly at dusk.
- The anatomy explode animation only applies to the procedural model. A GLB stays assembled.

The Draco decoder is served locally from `public/draco/`.

### Optional HDR lighting

Put an equirectangular HDR at `public/hdr/studio.hdr` and restart. It replaces the built-in RoomEnvironment.

## Set hotspot anchors

Open `src/chair.js` and edit `CHAIR_CONFIG.anchors`:

```js
anchors: {
  solar:    { position: [0.0, 2.075, 0.0],    part: 'canopy', dir: [-0.7, -1] },
  wireless: { position: [0.44, 0.685, -0.04], part: 'pillar', dir: [-1, -0.7] },
  usb:      { position: [0.78, 0.6, 0.214],   part: 'pillar', dir: [1, -0.35] },
  battery:  { position: [0.78, 0.27, 0.214],  part: 'pillar', dir: [1, 0.45] },
},
```

- `position` is in metres in centred chair space. The origin is on the floor, under the centre of the chair's bounding box. +x runs along the seat towards the pillar, +y is up, +z faces the front.
- `part` is used only by the procedural model, so the anchor follows that part when it explodes.
- `dir` is the screen direction of the leader line (x right, y down). Labels flip side automatically near the edge of the screen.

To find a position on a real GLB, open it in any 3D tool, centre it the same way, and read off the point in metres.

## Placeholder notice

The on screen placeholder tag has been removed at the client's request. The procedural chair is still a stand in built from a temporary reference photo, and `src/chair.js` keeps a `PLACEHOLDER - NOT FINAL DESIGN` header comment until the real GLB replaces it.

## Placeholder copy

Every visible string lives in **`src/copy.js`**: headlines, captions, hotspot labels, HUD labels, specification rows, form text and footer. That includes the placeholder email address `hello@amce.example` used by the request form's mailto fallback.

Specifications are deliberately shown as `[to be confirmed]`. Do not add wattage, battery capacity, autonomy, certifications or prices until they are confirmed. The **Solar exposure** meter in the specifications drawer is a relative value derived from the sun angle. It is labelled *Illustrative* and is not a measurement.

## Reference photo

The temporary reference photo lives in `images/` on the development machine only. That folder is listed in `.gitignore`, so it is never committed, never copied to `public/` and never shown on the site.

## Accessibility and devices

- **Reduced motion.** With `prefers-reduced-motion` turned on, smooth scrolling and camera glides are switched off, and each section shows a static view.
- **Keyboard.** Every control is a labelled button or input. The specifications drawer traps focus, closes with Escape and returns focus when it closes.
- **Mobile.** The HUD becomes a bottom sheet. On touch screens, tap **Rotate view** to orbit, then tap again to get page scrolling back.
- **No WebGL.** If WebGL is unavailable, a static message and line drawing replace the 3D view, and the rest of the page still works.
- **Cleanup.** Geometries, materials and textures are all disposed of when the view unmounts.
