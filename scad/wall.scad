// The Drawer Dividers V3 – Wall
// Divider walls with optional hex/circle pattern and finger grip.
use <lib/drawer_divider.scad>

/* [Part] */
// Wall length (mm) – the designer tells you which lengths you need
Length = 100; // [20:0.1:400]
// Wall height (mm, 0 = automatic from the connector height)
Wall_Height = 0; // [0:0.1:150]
// Is this wall used with slip-on connectors? (lowers it by the floor thickness)
For_Slip_On = false;
// How many copies on the plate
Count = 1; // [1:1:40]
// Gap between copies (mm)
Spacing = 5; // [2:1:20]
// Print orientation
Orientation = "standing"; // [standing:Standing (strong, fast), flat:Flat (best with patterns)]

/* [Style] */
// Material-saving pattern
Pattern = "hex"; // [none:None, hex:Honeycomb, circle:Circles]
// Size of one cell (radius, mm)
Cell_Size = 8; // [2:0.5:30]
// Web between two cells (mm)
Web = 2; // [0.5:0.1:10]
// Solid border at both ends (mm, -1 = automatic: insert depth + 2)
Margin_Side = -1; // [-1:1:60]
// Solid border at top and bottom (mm)
Margin_Top_Bottom = 5; // [2:0.5:20]
// Chamfer on the short ends for easy insertion (mm)
End_Chamfer = 0.5; // [0:0.1:2]
// Finger grip at the top centre (radius in mm, 0 = off)
Grip = 0; // [0:0.5:20]

/* [System] */
// Start from a preset or use the values below
Preset = "custom"; // [custom:Custom (values below), v2:V2 defaults, v1:V1 Classic (4.9 mm walls with cap)]
// Exact thickness of your printed walls (mm)
Wall_Thickness = 2.0; // [0.8:0.1:10]
// Extra slot width so the wall does not bind (mm, 0.2 fits most printers)
Tolerance = 0.2; // [0:0.01:1]
// Height of the connectors (mm)
Height = 40; // [10:1:150]
// How deep the wall slides into an arm (mm)
Insert_Depth = 14; // [5:1:30]
// Closed cap on one end like V1 (mm, 0 = open on both ends)
Cap_Thickness = 0; // [0:0.5:10]
// Cap thickness of the slip-on connectors (mm)
Floor_Thickness = 2; // [0.5:0.1:5]
// Gap between wall top and cap (mm)
Top_Gap = 0.2; // [0:0.05:1]

/* [Hidden] */
$fn = 32;

P = Preset != "custom" ? dd_preset(Preset) : dd_profile(
    wall_t = Wall_Thickness, tol = Tolerance, height = Height,
    insert = Insert_Depth, cap = Cap_Thickness, floor_t = Floor_Thickness,
    top_gap = Top_Gap);

h = Wall_Height > 0 ? Wall_Height : dd_wall_height(P, For_Slip_On);
t = dd(P, "wall_t");

module one_wall()
    dd_wall(Length, P, height = h, pattern = Pattern, cell = Cell_Size,
            web = Web, margin_side = Margin_Side, margin_tb = Margin_Top_Bottom,
            end_chamfer = End_Chamfer, grip = Grip);

if (Orientation == "flat")
    dd_grid(Count, Length + Spacing, h + Spacing) translate([0, h / 2, 0]) dd_lay_flat(t) one_wall();
else
    dd_grid(Count, Length + Spacing, t + Spacing) one_wall();
