# The Drawer Dividers – V3

🇩🇪 [Deutsche Version](README.md)

A parametric system of 3D-printed drawer dividers: **walls**, **connectors** and optional **grid rails**. All geometry lives in **OpenSCAD**. On top of that there is a **designer in the browser**: measure your drawer, draw the compartments, and the designer makes every part as an STL ready to print.

**➜ Open the designer: [barry2040.github.io/the-drawer-dividers](https://barry2040.github.io/the-drawer-dividers/)** (switch to English with **EN** at the top right – it follows your browser language by default)

V3 follows the two MakerWorld projects [V1 – The Drawer Dividers](https://makerworld.com/en/models/496828-the-drawer-dividers) and [V2 – Parametric System](https://makerworld.com/en/models/3106623-the-drawer-dividers-v2-parametric-system). The defaults are those of V2: 2 mm walls, 0.2 mm tolerance, open connectors.

---

## Quick start

| You want to … | Then … |
|---|---|
| plan a drawer and get all the STLs | **HTML designer**: [open online](https://barry2040.github.io/the-drawer-dividers/) or download and open `Drawer-Divider-Designer.html` (see below) |
| work with numbers instead of drawing (e.g. on MakerWorld) | **SCAD designer**: `scad/drawer_designer.scad` in OpenSCAD |
| reprint single parts | `scad/connector.scad`, `wall.scad`, `rail.scad`, `label_clip.scad` in OpenSCAD |
| check first whether the walls fit the slots | print `scad/tolerance_test.scad` |

---

## The system in one minute

- **Walls** – flat plates at the height of your dividers, optionally with a honeycomb or circle pattern.
- **Connectors** – hold the walls together. Each wall sits 14 mm deep in a slot.
  - *Cross* (4 walls), *T piece* (3), *corner* (2 at a right angle), *straight* (joins a wall that is too long), *end cap* (wall end at the drawer wall)
- **At the drawer edge** there are four options:
  - **Frame** – outer walls with corners and T pieces; the whole thing stands on its own and can be lifted out
  - **End caps** – no outer wall, the walls end with an end cap at the drawer wall
  - **Grid rails** – toothed rails on the drawer sides, the walls snap in between the teeth
  - **Clamp directly** – the walls run up to the drawer wall, no part at the edge
- **Rounded drawer corners** – if your drawer has round inside corners, enter the *corner radius*; the frame corners are rounded on the outside to match.
- **Wall letters** – every wall length gets a letter (A = longest). Letter and length are engraved into the wall ends, which disappear inside the connectors, and are listed in the assembly plan.
- **Label clips** (optional) – one clip per compartment, pushed onto the top of a wall; write on it or stick a label on.
- **Slip-on connectors** (optional) – long walls run through the crossings and the connectors are pushed on from above. That means fewer, longer walls; the walls are 2 mm lower so the connector's cap sits flush. In this mode *all* connectors have the cap – also where a wall ends (corners, crossings where a wall that is too long is split); there the slot just doesn't run through.

---

## HTML designer

### Opening it

Easiest **online**: [barry2040.github.io/the-drawer-dividers](https://barry2040.github.io/the-drawer-dividers/). The page is republished automatically on every change to `designer/`.

Or **offline**: in the online designer use *Export → Download offline version* (or open [`Drawer-Divider-Designer.html`](Drawer-Divider-Designer.html) in the main folder here → *Download raw file*, about 200 KB). Only this file from the main folder works on its own, not the files in `designer/`. Double-click it to open it in your browser (Chrome, Edge or Firefox). Everything is inside, nothing to install. You only need internet for the 3D preview and *Make STLs*.

If the browser doesn't allow a background process (worker) for a local file, *Make STLs* automatically renders inside the page instead. It works the same, the page is just slower to respond meanwhile.

### Step by step

1. **Measure the drawer** – enter the inside width, depth and height. The divider height follows automatically (drawer height minus 5 mm clearance). To use your own height, just type it into *Height*.
2. **Choose the edge** – frame, end caps, grid rails or clamp directly; tick *Slip-on connectors* if you like.
3. **Lay out the compartments** – with the tools above the drawing:

   | Tool | Key | How |
   |---|---|---|
   | Template | – | a ready-made layout to start from: grid (N × M), cutlery, workshop, mixed, desk, small parts |
   | Split | `S` | pick a number (`2`–`6` or *free*) and a direction (`Shift` toggles), click into a compartment |
   | Draw | `W` | drag a wall with the mouse; end points snap to the edge, the grid and existing walls |
   | Select | `V` | click a wall and move it, `Del` deletes it |
   | Erase | `E` | removes the wall piece between two connectors |
   | Undo | `Ctrl+Z` / `Ctrl+Y` | |
   | 3D | – | preview of the assembly |

   The mouse wheel zooms, the right or middle button pans, `F` fits the view.

4. **Check the parts list** – on the right you see every part: connectors by type, walls by length (with their letter), rails, clips and the filament. *Notes* tell you when something doesn't fit.
5. **Make STLs** – the orange button at the top right. OpenSCAD runs in the browser and renders every print plate straight from the SCAD library, plate by plate with progress. Then download each STL on its own, everything as one **3MF** (each plate a separate object – for Bambu Studio, OrcaSlicer, PrusaSlicer), or a **ZIP** (STLs, parts list as CSV, print job `.scad`, project `.json`).
   - The first time, OpenSCAD is loaded (about 11 MB from jsDelivr, [openscad-wasm-prebuilt](https://www.npmjs.com/package/openscad-wasm-prebuilt), GPL-2.0), so you need internet.
   - The tolerance test is rendered from the print job `.scad` in OpenSCAD, because it needs fonts.
6. **Print** – drag the plates into your slicer. Each plate is sized to your print bed and named like `05_10x_Wall_A_118_mm.stl`.

### Sharing and assembly plan

- **Export → Share link** copies a link that contains the whole layout. Whoever opens it sees exactly your drawer (and can go back to their own layout with *Undo*).
- **Export → Print assembly plan / PDF** prints the drawing with the wall letters, the parts list and the assembly steps for your edge mode.

### What the designer checks for you

- **Sizes** – the numbers on the walls are the real printed length, i.e. into the slots of the connectors. The tick marks of the dimension line show where the wall ends.
- **Connectors must not overlap** – every connector arm is 20 mm long, so two connectors on the same wall need at least **41 mm** from centre to centre. The designer doesn't allow splits or walls that would be closer: the preview turns red and a note appears below. Walls just a few millimetres next to another one snap onto its line, so a cross sits there.
- **Walls that are too long** (longer than *Max. wall length*) are split – with a straight joiner, or at a crossing with slip-on connectors.
- **Changing the edge mode** – the compartments keep their size, the inner walls move proportionally. With grid rails the walls snap into the 4.2 mm tooth pitch; switching back without changing anything puts them back exactly where they were.

### Settings

- **Dividers** – wall thickness, tolerance, height, wall pattern and material. Usually that's all you need.
- **Advanced** (collapsed) – print bed, max. wall length, printing standing or lying flat, finger notch, snap grid, label clips, wall labels, all connector dimensions and the grid rail. *Reset everything to default* brings back the V2 values.
- **My profile** – saves your settings under a name, e.g. for your printer with its tolerance and bed size. For the next drawer just pick the profile again. A profile holds everything except drawer, edge and compartments and is stored in the browser.

The designer saves your project automatically in the browser. *Save* / *Open* keep it as a `.json` file.

---

## Printing tips

1. **Print the tolerance test first** (`scad/tolerance_test.scad`, or the last plate of the print job). It has five labelled slots and a test wall. Enter the tolerance at which the wall goes in snugly but without force, and save it in your profile.
2. **Wall thickness** in the designer is the thickness actually printed. If your printer prints 2 mm as 2.1 mm, enter 2.1.
3. **Connectors** are printed open side up, slip-on connectors cap down (flip them over and push them on afterwards). No supports.
4. **Walls** print faster standing, lying flat is stronger (*Advanced → Orientation*).

---

## SCAD designer (no drawing)

Open `scad/drawer_designer.scad` in OpenSCAD and fill in the Customizer on the right:

| Section | What |
|---|---|
| **Drawer** | inside width, depth, height, corner radius |
| **Compartments** | `Strips = "1,1,2"` splits the drawer into strips (here the third is twice as wide). `Splits = "2,3,1:2"` sets the compartments per strip: a number gives equal compartments, `1:2` relative sizes. `Direction` decides whether the strips run front to back or left to right. |
| **Drawer edge** | frame, end caps, grid rails or clamp directly, optionally slip-on connectors |
| **Output** | *assembly with parts list* → *all printed parts* → or *one line* of the parts list (`Part_Number`) per print plate, then F6 and F7 for the STL |
| **System** | wall thickness, tolerance, height, wall labels, label clips and the connector dimensions |

It applies the same rules as the HTML designer: the right connector at every node, exact wall lengths, splitting walls that are too long, merging compartment borders that almost line up, rails sized to the print bed. Compartments that are too narrow are marked red and reported in the console.

**In the browser without installing anything:** the single file `dist/makerworld/en/drawer_designer.scad` (German: `de/schubladen_designer.scad`) can be uploaded to **MakerWorld** as a parametric model or opened in the **OpenSCAD Playground** (`ochafik.com/openscad2`).

---

## Library for your own projects

All parts use the same **profile**, so wall, connector and rail always fit together:

```openscad
use <lib/drawer_divider.scad>

P = dd_profile(wall_t = 2, tol = 0.2, height = 40);   // everything else has defaults

dd_connector("tee", P);
translate([60, 0, 0]) dd_wall(118, P, pattern = "hex", label = "A", label2 = "118");
translate([0, 60, 0]) dd_rail(200, 40, P);
translate([0, -40, 0]) dd_label_clip(40, P);
```

| Module / function | What |
|---|---|
| `dd_connector(type, P, slip = false, corner_r = 0)` | `cross`, `tee`, `corner`, `corner_round` (rounded outside, `corner_r`), `straight`, `end`, `slip_cross`, `slip_tee`, `slip_corner_r`, `slip_corner_l` |
| `dd_connector_custom(arms, slots, through_y, cap, P)` | any combination of arms |
| `dd_wall(length, P, …, label, label2)` | wall with honeycomb/circle pattern, finger notch, end chamfers, engraving in the wall ends |
| `dd_rail(length, width, P, …)` | grid rail with tongue/socket, screw holes, `teeth_offset` |
| `dd_label_clip(width, P, …)` | label clip to push onto a wall |
| `dd_tolerance_test(P, tols)` | test block with several slot widths plus a test wall |
| `dd_layout(P, opts)` / `dd_layout_bom(L)` | compartment layout → walls, connectors, rails, parts list |
| `dd_layout_clashes(L, P)` | connectors that would overlap |

---

## Files

```
Drawer-Divider-Designer.html  the designer as one single file (generated) – to download
designer/                     HTML designer, source
  dev.html                    user interface (source, only works with the .js files next to it)
  i18n.js                     language: English texts, DE/EN switch
  app.js                      planning, parts list, checks, 3D preview, assembly plan, print job
  stl.js                      STL rendering with OpenSCAD in the browser, ZIP and 3MF download
  scad_lib.js                 embedded SCAD library (generated)
scad/
  drawer_designer.scad        SCAD designer
  connector.scad              single parts: connectors
  wall.scad                   single parts: walls
  rail.scad                   single parts: grid rail
  label_clip.scad             single parts: label clip
  tolerance_test.scad         tolerance test
  lib/drawer_divider.scad     library – all geometry and the layout logic
dist/makerworld/en/ de/       single files for MakerWorld (library inlined, generated)
legacy/v2-original/           original V2 SCADs
tools/
  build.py                    makes all generated files
  i18n_de.py                  German Customizer names for MakerWorld
  check.py                    checks (run by GitHub Actions)
  i18n_keys.py                finds designer texts without an English translation
.github/workflows/pages.yml   publishes Drawer-Divider-Designer.html on GitHub Pages
.github/workflows/check.yml   checks on every push
```

## Improvements over V2

- **One shared profile** for all parts instead of a wall thickness/tolerance in every file
- **Designer** in the browser and as a SCAD file, checking for overlapping connectors
- **Rail tooth chamfer fixed** – the old chamfer had no effect (hull over two bodies of the same width)
- **Fillet at the tooth root fixed** – now a real fillet across the full tooth width instead of small bumps
- **Rail joints** – `teeth_offset` keeps the tooth pitch continuous across several rails
- **Screw holes** sit in the middle of a slot so fewer teeth are damaged
- **Connector outline** via offset rounding – every combination of arms gets clean inner radii
- **Magnet pocket** in every connector with a solid centre
- **Wall pattern** – the border follows the insert depth, the honeycomb height is computed correctly
- **New**: end cap, slip-on connectors, finger notch, printing lying flat, optional cap (printed face down), tolerance test with 5 labelled slots, rounded frame corners, engraved wall letters, label clips, layout templates, share links, assembly plan, 3MF export

## For developers

After changes in `scad/` or `designer/`, rebuild the generated files (MakerWorld single files, embedded library, `Drawer-Divider-Designer.html`):

```bash
python tools/build.py
```

- `python tools/check.py` renders every SCAD file, compares the parts of the HTML and SCAD designers for several layouts and checks that every designer text has an English translation. It runs automatically on every push in GitHub Actions (*Prüfung*), together with a check that the generated files are up to date. Needs OpenSCAD and Playwright (`pip install playwright && playwright install chromium`).
- The designer is written in German. Write new texts as `T('…')` or ``T`… ${x} …` `` and add the English translation to `designer/i18n.js`.
- Tested with OpenSCAD 2021.01. Newer versions (Manifold) render much faster.
- The formulas for wall lengths and gaps exist twice: in `scad/lib/drawer_divider.scad` and in `designer/app.js` (`geom()`, `analyze()`). If you change one, change the other too.
