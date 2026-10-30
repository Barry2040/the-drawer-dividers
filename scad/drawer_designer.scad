// The Drawer Dividers V3 – Drawer Designer
// Enter your drawer, describe the compartments, and get the assembly preview,
// the parts list and every part ready to print.
use <lib/drawer_divider.scad>

/* [Drawer] */
// Inner width of the drawer, left to right (mm)
Drawer_Width = 400; // [50:1:1500]
// Inner depth of the drawer, front to back (mm)
Drawer_Depth = 300; // [50:1:1500]
// Inner height of the drawer (mm)
Drawer_Height = 60; // [10:1:300]

/* [Compartments] */
// Which walls run through from edge to edge
Direction = "front_back"; // [front_back:Strips run front to back, left_right:Strips run left to right]
// Relative size of each strip, e.g. "1,1,2" = the third strip is twice as wide
Strips = "1,1,1";
// Compartments per strip: a number = equal parts, "1:2" = relative sizes. One entry per strip, the last one repeats.
Splits = "2,2,1:1:2";

/* [Drawer Edge] */
// How the system ends at the drawer wall
Edge = "frame"; // [frame:Frame – stands on its own, endcap:End pieces against the drawer wall, rail:Toothed rails on the drawer sides, none:Walls clamp directly]
// Slip-on connectors: long walls run through, connectors are pushed on from above
Slip_On = false;
// Longer walls are split with straight joiners (mm)
Max_Wall_Length = 240; // [60:5:400]
// Gap between frame / end pieces and the drawer wall (mm)
Edge_Gap = 0.5; // [0:0.1:5]
// Gap between wall end and drawer wall when clamping directly (mm)
Clamp_Gap = 1; // [0:0.1:5]

/* [Output] */
// What to show
Show = "assembly"; // [assembly:Assembly with parts list, parts:All parts to print, connectors:Connectors only, walls:Walls only, rails:Rails only, single:One line of the parts list (Part_Number)]
// Line number from the parts list (only for "One line")
Part_Number = 1; // [1:1:60]
// Usable size of your print bed (mm)
Bed_Size = 256; // [150:1:400]
// How walls lie on the bed
Wall_Orientation = "standing"; // [standing:Standing, flat:Flat]
// Material-saving pattern in the walls
Wall_Pattern = "hex"; // [none:None, hex:Honeycomb, circle:Circles]
// Finger grip at the top of every wall (radius in mm, 0 = off)
Grip = 0; // [0:0.5:20]
// Language of the labels in the preview
Language = "en"; // [en:English, de:Deutsch]

/* [System] */
// Exact thickness of your printed walls (mm)
Wall_Thickness = 2.0; // [0.8:0.1:10]
// Extra slot width so the wall does not bind (mm, 0.2 fits most printers)
Tolerance = 0.2; // [0:0.01:1]
// Height of the connectors (mm)
Height = 40; // [10:1:150]

/* [Fit & Shape] */
// How deep the wall slides into an arm (mm)
Insert_Depth = 14; // [5:1:30]
// Material left and right of the slot (mm)
Shell_Thickness = 2.5; // [1:0.1:5]
// Arm length measured from the centre (mm)
Arm_Length = 20; // [10:1:100]
// Inner fillet between two arms (mm)
Inner_Fillet = 10; // [0:0.5:20]
// Rounding of the outer edges (mm)
Edge_Radius = 0.6; // [0:0.1:2]
// Closed cap on one end (mm, 0 = open on both ends)
Cap_Thickness = 0; // [0:0.5:10]
// Cap thickness of the slip-on connectors (mm)
Floor_Thickness = 2; // [0.5:0.1:5]
// Chamfer at the slot opening for easy insertion (mm)
Lead_In = 1; // [0:0.1:5]
// Gap between wall end and pocket bottom (mm)
End_Gap = 0.3; // [0:0.1:2]
// Gap between wall top and cap (mm)
Top_Gap = 0.2; // [0:0.05:1]

/* [Print Optimisation] */
// Widens the slots on the first layers against elephant foot (mm, 0 = off)
Elephant_Foot_Compensation = 0.4; // [0:0.1:2]
// Pocket for a magnet or rubber foot underneath (mm, 0 = off)
Magnet_Diameter = 5; // [0:0.1:10]
// Depth of that pocket (mm)
Magnet_Depth = 2; // [0.1:0.1:10]

/* [Rails] */
// Thickness of the rail base plate (mm)
Rail_Plate = 2.5; // [1:0.1:10]
// Thickness of one tooth (mm)
Tooth_Thickness = 2; // [0.5:0.1:10]
// How far the teeth stand out (mm)
Tooth_Height = 6; // [2:0.1:30]

/* [Hidden] */
$fn = 40;

P = dd_profile(
    wall_t = Wall_Thickness, tol = Tolerance, height = Height,
    insert = Insert_Depth, shell = Shell_Thickness, arm = Arm_Length,
    fillet = Inner_Fillet, edge_r = Edge_Radius, cap = Cap_Thickness,
    floor_t = Floor_Thickness, lead_in = Lead_In, efc = Elephant_Foot_Compensation,
    magnet_d = Magnet_Diameter, magnet_h = Magnet_Depth,
    end_gap = End_Gap, top_gap = Top_Gap);

O = dd_layout_opts(width = Drawer_Width, depth = Drawer_Depth, height = Drawer_Height,
                   strips = Strips, splits = Splits, swap = Direction == "left_right",
                   edge = Edge, slip = Slip_On, max_len = Max_Wall_Length,
                   edge_gap = Edge_Gap, clamp_gap = Clamp_Gap, rail_plate = Rail_Plate,
                   tooth_t = Tooth_Thickness, tooth_h = Tooth_Height);

L      = dd_layout(P, O);
BOM    = dd_layout_bom(L);
WALL_H = dd(L, "wall_h");
RAIL_W = dd(L, "rail_w");
RAIL_T = dd(L, "rail_t");
T      = dd(P, "wall_t");
H      = dd(P, "height");
MIN_LEN = max(8, dd_arm_w(P));
// a wall from the drawer side (rails / clamping) must keep the connector arm off the side
MIN_EDGE = max(MIN_LEN, dd(P, "arm") - dd_wall_inset(P) + 1);
function at_side(w) = let(Ls = w[0] == "x" ? Drawer_Width : Drawer_Depth, i = dd_wall_inset(P))
    (Edge == "rail" || Edge == "none") && (w[2] < i || w[3] > Ls - i);
function too_short(w) = w[4] < (at_side(w) ? MIN_EDGE : MIN_LEN);
SHORT  = [for (w = dd(L, "walls")) if (too_short(w)) w];
CLASH  = dd_layout_clashes(L, P);

// ---- labels ---------------------------------------------------------------
DE = Language == "de";
function name_of(type) =
    let(n = [["cross", "Cross", "Kreuz"], ["tee", "T-piece", "T-Stück"], ["corner", "Corner", "Ecke"],
             ["straight", "Straight joiner", "Gerade (Verlängerung)"], ["end", "End piece", "Endstück"],
             ["slip_cross", "Slip-on cross", "Aufsteck-Kreuz"], ["slip_tee", "Slip-on T", "Aufsteck-T"],
             ["slip_corner_r", "Slip-on corner R", "Aufsteck-Ecke R"], ["slip_corner_l", "Slip-on corner L", "Aufsteck-Ecke L"]],
        m = [for (x = n) if (x[0] == type) x][0])
    DE ? m[2] : m[1];

function line_label(b) =
    b[0] == "c" ? name_of(b[1])
  : b[0] == "w" ? str(DE ? "Wand " : "Wall ", dd_fmt(b[1]), " mm")
  : str(DE ? "Schiene " : "Rail ", dd_fmt(b[1][0]), " mm",
        b[1][3] ? (DE ? " +Buchse" : " +socket") : "", b[1][2] ? (DE ? " +Zapfen" : " +tongue") : "",
        DE ? ", Versatz " : ", offset ", dd_fmt(b[1][1], 2));

// ---- one printable part per parts-list line -------------------------------
module part(b) {
    if (b[0] == "c") dd_connector(b[1], P);
    else if (b[0] == "w") {
        if (Wall_Orientation == "flat")
            translate([0, WALL_H / 2, 0]) dd_lay_flat(T) wall_part(b[1]);
        else wall_part(b[1]);
    } else
        translate([-b[1][0] / 2, RAIL_T / 2, 0]) rotate([90, 0, 0])
            dd_rail(b[1][0], RAIL_W, P, plate = Rail_Plate, tooth_t = Tooth_Thickness,
                    tooth_h = Tooth_Height, teeth_offset = b[1][1], tongue = b[1][2],
                    socket = b[1][3], screws = b[1][4]);
}
module wall_part(len) dd_wall(len, P, height = WALL_H, pattern = Wall_Pattern, grip = Grip);

function pitch(b) =
    b[0] == "c" ? [dd_connector_size(P) + 4, dd_connector_size(P) + 4]
  : b[0] == "w" ? [b[1] + 5, (Wall_Orientation == "flat" ? WALL_H : T) + 5]
  : [b[1][0] + 5, RAIL_T + 5];
function block_h(b) = let(p = pitch(b), cols = max(1, min(b[2], floor(Bed_Size / p[0])))) ceil(b[2] / cols) * p[1];

module parts_of(kinds) {
    sel = [for (b = BOM) if (len([for (k = kinds) if (k == b[0]) 1])) b];
    hs  = [for (b = sel) block_h(b) + 10];
    for (i = [0 : 1 : len(sel) - 1])
        translate([0, dd_sum(hs, i) + hs[i] / 2, 0])
            dd_grid(sel[i][2], pitch(sel[i])[0], pitch(sel[i])[1], Bed_Size) part(sel[i]);
}

// ---- assembly preview -----------------------------------------------------
module assembly() {
    W = Drawer_Width; D = Drawer_Depth; wt = 6;
    // drawer
    color("#b9b2a6") translate([-wt, -wt, -wt]) cube([W + 2 * wt, D + 2 * wt, wt]);
    color("#d8d2c8", 0.35) for (s = [[-wt, -wt, wt, D + 2 * wt], [W, -wt, wt, D + 2 * wt], [0, D, W, wt]])
        translate([s[0], s[1], 0]) cube([s[2], s[3], Drawer_Height]);
    color("#d8d2c8", 0.35) translate([0, -wt, 0]) cube([W, wt, Drawer_Height * 0.6]);

    // compartment sizes on the floor
    for (c = dd(L, "comps")) {
        sz = max(2, min(9, (c[2] - c[0]) / 9, (c[3] - c[1]) / 3));
        color("#6b6358") translate([(c[0] + c[2]) / 2, (c[1] + c[3]) / 2, 0.01])
            linear_extrude(0.4) text(str(round(c[4]), " x ", round(c[5])), size = sz, halign = "center", valign = "center");
    }
    // walls, with their pattern and grip
    for (w = dd(L, "walls")) if (w[4] > 0)
        color(too_short(w) ? "#d03030" : "#5a6a80")
            translate(w[0] == "x" ? [(w[2] + w[3]) / 2, w[1], 0] : [w[1], (w[2] + w[3]) / 2, 0])
                rotate(w[0] == "x" ? 0 : 90) wall_part(w[4]);
    // connectors as they sit in the drawer, slots open so the walls show inside
    CS = dd(L, "conns");
    for (k = [0 : 1 : len(CS) - 1]) let(c = CS[k])
        color(len(search(k, CLASH)) ? "#d03030" : c[5] ? "#b07a3c" : c[4] != "" ? "#d4570f" : "#f07020")
            translate([c[1], c[2], 0])
                dd_connector_installed(c[3], c[4], dd_cap(P, c[4] != ""), P);
    // rails
    for (r = dd(L, "rails")) color("#7f93ad")
        if (r[0] == "L") translate([0, r[1], 0]) cube([RAIL_T, r[3], RAIL_W]);
        else if (r[0] == "R") translate([Drawer_Width - RAIL_T, r[1], 0]) cube([RAIL_T, r[3], RAIL_W]);
        else if (r[0] == "F") translate([r[1], 0, 0]) cube([r[3], RAIL_T, RAIL_W]);
        else translate([r[1], Drawer_Depth - RAIL_T, 0]) cube([r[3], RAIL_T, RAIL_W]);

    // parts list card
    lines = concat(
        [str(DE ? "Schublade " : "Drawer ", Drawer_Width, " x ", Drawer_Depth, " x ", Drawer_Height, " mm"),
         str(DE ? "Wände " : "Walls ", dd_fmt(T), " x ", dd_fmt(WALL_H), " mm, ", DE ? "Verbinder " : "connectors ", dd_fmt(H), " mm"),
         ""],
        [for (i = [0 : 1 : len(BOM) - 1]) str("#", i + 1, "   ", BOM[i][2], " x  ", line_label(BOM[i]))],
        ["", str(DE ? "Gesamt: " : "Total: ", dd_sum([for (b = BOM) b[2]], len(BOM)), DE ? " Teile" : " parts")],
        len(SHORT) ? [str("! ", len(SHORT), DE ? " Wand/Wände zu kurz (rot)" : " wall(s) too short (red)")] : [],
        len(CLASH) ? [str("! ", len(CLASH), DE ? " Verbinder überschneiden sich (rot)" : " connectors overlap (red)")] : [],
        H > Drawer_Height ? [DE ? "! Verbinder höher als die Schublade" : "! Connectors taller than the drawer"] : []);
    fs = 6; lh = 10; cw = 175; ch = len(lines) * lh + 16;
    translate([W + 30, D - ch, 0]) {
        color("white") cube([cw, ch, 1]);
        color("#222") for (i = [0 : len(lines) - 1])
            translate([8, ch - 12 - i * lh, 1]) linear_extrude(0.4)
                text(lines[i], size = i == 0 ? fs + 0.5 : fs, valign = "center");
    }
}

// ---- output ---------------------------------------------------------------
for (i = [0 : 1 : len(BOM) - 1]) echo(str("#", i + 1, "  ", BOM[i][2], " x ", line_label(BOM[i])));
if (len(SHORT)) echo(str("WARNING: ", len(SHORT), " wall(s) too short – connectors too close together"));
if (len(CLASH)) echo(str("WARNING: ", len(CLASH), " connectors overlap – compartments narrower than ", dd_min_conn_gap(P), " mm between connector centres"));

if (Show == "assembly") assembly();
else if (Show == "parts") parts_of(["c", "w", "r"]);
else if (Show == "connectors") parts_of(["c"]);
else if (Show == "walls") parts_of(["w"]);
else if (Show == "rails") parts_of(["r"]);
else if (Part_Number >= 1 && Part_Number <= len(BOM)) {
    b = BOM[Part_Number - 1];
    dd_grid(b[2], pitch(b)[0], pitch(b)[1], Bed_Size) part(b);
}
