// The Drawer Dividers V3 – Tolerance test
// Print this first: one bar with several slot widths plus a short test wall.
// The slot that fits best is your "Tolerance" value for all other parts.

/* [Test] */
// Exact thickness of your printed walls (mm)
Wall_Thickness = 2.0; // [0.8:0.1:10]
// Smallest tolerance to test (mm)
Tolerance_Start = 0.1; // [0:0.01:1]
// Step between two slots (mm)
Tolerance_Step = 0.05; // [0.01:0.01:0.5]
// Number of slots
Slots = 5; // [2:1:10]
// Height of the test bar (mm)
Test_Height = 12; // [6:1:40]
// Also print a short test wall
Test_Wall = true;

/* [Hidden] */
$fn = 32;

tols = [for (i = [0 : Slots - 1]) round((Tolerance_Start + i * Tolerance_Step) * 100) / 100];
dd_tolerance_test(dd_profile(wall_t = Wall_Thickness), tols,
                  height = Test_Height, coupon = Test_Wall);

// ============================================================================
//  Library (scad/lib/drawer_divider.scad, inlined by tools/build.py)
// ============================================================================
// =============================================================================
//  The Drawer Dividers – core library (V3, unifies V1 + V2)
//  Usage:  use <lib/drawer_divider.scad>
//  All dimensions in mm. This file creates no geometry on its own.
// =============================================================================

DD_VERSION = "3.0.0";
DD_EPS = 0.01;

// =============================================================================
//  System profile
// =============================================================================
// Every part of one drawer is built from the same profile, so walls,
// connectors and rails always fit each other. A profile is a key/value list;
// read single values with dd(p, "key").

function dd_profile(
    wall_t   = 2.0,  // thickness of the printed walls
    tol      = 0.2,  // extra slot width so the wall does not bind
    height   = 40,   // connector height
    insert   = 14,   // how deep a wall slides into a connector arm
    shell    = 2.5,  // connector material left and right of the slot
    arm      = 20,   // arm length, measured from the connector centre
    fillet   = 10,   // inner fillet radius between two arms
    edge_r   = 0.6,  // rounding of the outer vertical edges
    cap      = 0,    // closed cap (V1 style); 0 = slots open on both ends
    floor_t  = 2,    // cap thickness of slip-on connectors
    lead_in  = 1,    // chamfer at the open slot end
    efc      = 0.4,  // elephant foot compensation at the bed side
    magnet_d = 5,    // magnet / rubber foot pocket, 0 = off
    magnet_h = 2,
    end_gap  = 0.3,  // gap between wall end and pocket bottom
    top_gap  = 0.2   // gap between wall top and cap (capped connectors only)
) = [
    ["wall_t", wall_t], ["tol", tol], ["height", height], ["insert", insert],
    ["shell", shell], ["arm", arm], ["fillet", fillet], ["edge_r", edge_r],
    ["cap", cap], ["floor_t", floor_t], ["lead_in", lead_in], ["efc", efc],
    ["magnet_d", magnet_d], ["magnet_h", magnet_h], ["end_gap", end_gap],
    ["top_gap", top_gap]
];

function dd(p, key) =
    let(i = search([key], p)[0])
    assert(is_num(i), str("dd(): unknown profile key '", key, "'"))
    p[i][1];

// "v2": 2 mm walls, open connectors (V2 defaults)
// "v1": 4.9 mm walls, 50 mm high, 5 mm cap – matches the original V1 STLs
function dd_preset(name) =
    name == "v1" ? dd_profile(wall_t = 4.9, tol = 0.1, height = 50, cap = 5,
                              lead_in = 0.6, efc = 0, magnet_d = 0,
                              edge_r = 0.5, top_gap = 0.1)
                 : dd_profile();

// ---- derived values (the designer uses the same formulas) -------------------
function dd_slot_w(p)       = dd(p, "wall_t") + dd(p, "tol");
function dd_arm_w(p)        = dd_slot_w(p) + 2 * dd(p, "shell");
function dd_pocket_start(p) = dd(p, "arm") - dd(p, "insert");
// distance from a connector centre to the end of a fully inserted wall
function dd_wall_inset(p)   = dd_pocket_start(p) + dd(p, "end_gap");
function dd_cap(p, slip = false) =
    slip ? max(dd(p, "cap"), dd(p, "floor_t")) : dd(p, "cap");
function dd_wall_height(p, slip = false) =
    let(c = dd_cap(p, slip))
    dd(p, "height") - (c > 0 ? c + dd(p, "top_gap") : 0);
// wall length for two connector centres `center_dist` apart
function dd_wall_length(center_dist, p, ends = 2) =
    center_dist - ends * dd_wall_inset(p);

// =============================================================================
//  Connectors
// =============================================================================
// Directions: 0 = +X, 1 = +Y, 2 = -X, 3 = -Y.
// Definition: [arms, slots, through_y, slip_on]
//   through_y: one continuous slot along Y (the wall passes straight through)
//   slip_on:   printed cap-down, then flipped and pushed onto the walls

DD_CONNECTOR_TYPES = ["cross", "tee", "corner", "straight", "end",
                      "slip_cross", "slip_tee", "slip_corner_r", "slip_corner_l"];

function dd_connector_def(type) =
    type == "cross"         ? [[1,1,1,1], [1,1,1,1], false, false] :
    type == "tee"           ? [[1,1,1,0], [1,1,1,0], false, false] :
    type == "corner"        ? [[1,1,0,0], [1,1,0,0], false, false] :
    type == "straight"      ? [[1,0,1,0], [1,0,1,0], false, false] :
    type == "end"           ? [[1,0,0,0], [1,0,0,0], false, false] :
    type == "slip_cross"    ? [[1,1,1,1], [1,1,1,1], true,  true ] :
    type == "slip_tee"      ? [[1,1,0,1], [1,1,0,1], true,  true ] :
    type == "slip_corner_r" ? [[1,1,0,0], [1,1,0,1], true,  true ] :
    type == "slip_corner_l" ? [[0,1,1,0], [0,1,1,1], true,  true ] :
    undef;

module dd_connector(type = "cross", p = dd_profile()) {
    def = dd_connector_def(type);
    assert(!is_undef(def), str("dd_connector(): unknown type '", type, "'"));
    dd_connector_custom(arms = def[0], slots = def[1], through_y = def[2],
                        cap = dd_cap(p, def[3]), p = p);
}

// Build any connector from an arm/slot pattern.
module dd_connector_custom(arms = [1,1,1,1], slots = undef, through_y = false,
                           cap = 0, p = dd_profile()) {
    sl  = is_undef(slots) ? arms : slots;
    h   = dd(p, "height");
    aw  = dd_arm_w(p);
    arm = dd(p, "arm");
    ps  = dd_pocket_start(p);
    md  = dd(p, "magnet_d");
    z0  = cap > 0 ? cap : -1;   // slots start above the cap

    difference() {
        linear_extrude(h) dd_connector_outline(arms, p);

        for (i = [0:3]) if (sl[i] && !(through_y && i == 3))
            rotate(90 * i)
                dd_slot_cut(x0 = (through_y && i == 1) ? -(arm + 1) : ps,
                            x1 = arm + 1, z0 = z0, p = p);

        // magnet pocket on the side that faces the drawer floor in use
        if (!through_y && md > 0 && md <= min(aw, 2 * ps) - 1) {
            mh = dd(p, "magnet_h");
            if (cap > 0) translate([0, 0, h - mh]) cylinder(d = md, h = mh + 1, $fn = 48);
            else translate([0, 0, -DD_EPS]) cylinder(d = md, h = mh + DD_EPS, $fn = 48);
        }
    }
}

module dd_connector_outline(arms, p) {
    aw = dd_arm_w(p);
    dd_round_convex(dd(p, "edge_r"))
    dd_round_concave(dd(p, "fillet"))
    union() {
        square(aw, center = true);
        for (i = [0:3]) if (arms[i])
            rotate(90 * i) translate([0, -aw / 2]) square([dd(p, "arm"), aw]);
    }
}

// one slot along +X from x0 to x1, open at the top
module dd_slot_cut(x0, x1, z0, p) {
    h    = dd(p, "height");
    sw   = dd_slot_w(p);
    li   = dd(p, "lead_in");
    efc  = dd(p, "efc");
    len  = x1 - x0;

    translate([x0, -sw / 2, z0]) cube([len, sw, h - z0 + 1]);

    if (li > 0) hull() {
        translate([x0, -sw / 2, h - li]) cube([len, sw, DD_EPS]);
        translate([x0, -sw / 2 - li, h]) cube([len, sw + 2 * li, 1]);
    }
    // only where the slot touches the print bed
    if (z0 < 0 && efc > 0) hull() {
        translate([x0, -sw / 2 - efc, -1]) cube([len, sw + 2 * efc, 1]);
        translate([x0, -sw / 2, efc]) cube([len, sw, DD_EPS]);
    }
}

// footprint size, used to space copies on the plate
function dd_connector_size(p) = 2 * dd(p, "arm");

// =============================================================================
//  Walls
// =============================================================================
// Built standing: X = length, Y = thickness (centred), Z = height.

module dd_wall(length, p = dd_profile(), height = undef, pattern = "none",
               cell = 8, web = 2, margin_side = -1, margin_tb = 5,
               end_chamfer = 0.5, grip = 0) {
    h  = is_undef(height) ? dd_wall_height(p) : height;
    t  = dd(p, "wall_t");
    // keep the pattern out of the connector pockets
    ms = margin_side < 0 ? dd(p, "insert") + 2 : margin_side;

    difference() {
        linear_extrude(h) dd_wall_2d(length, t, end_chamfer);
        dd_wall_pattern(length, t, h, pattern, cell, web, ms,
                        margin_tb, margin_tb + grip);
        if (grip > 0)
            translate([0, 0, h]) rotate([90, 0, 0])
                cylinder(r = grip, h = t + 2, center = true, $fn = 48);
    }
}

module dd_wall_2d(l, t, c) {
    ce = min(c, t / 2 - 0.01);
    if (ce > 0)
        polygon([
            [-l/2 + ce, -t/2], [ l/2 - ce, -t/2], [ l/2, -t/2 + ce], [ l/2,  t/2 - ce],
            [ l/2 - ce,  t/2], [-l/2 + ce,  t/2], [-l/2,  t/2 - ce], [-l/2, -t/2 + ce]
        ]);
    else
        square([l, t], center = true);
}

// Hex or circle pattern with a constant web between the holes.
module dd_wall_pattern(l, t, h, pattern, cell, web, ms, mb, mt) {
    if (pattern == "hex" || pattern == "circle") {
        hex   = pattern == "hex";
        D     = hex ? cell * sqrt(3) + web : 2 * cell + web;  // vertical pitch
        ext_x = cell;
        ext_z = hex ? cell * sqrt(3) / 2 : cell;
        max_w = l - 2 * ms - 2 * ext_x;
        max_h = h - mb - mt - 2 * ext_z;
        stagger = max_h >= D / 2;
        sx    = stagger ? D * sqrt(3) / 2 : 2 * cell + web;
        cols  = max_w >= 0 ? floor(max_w / sx) + 1 : 0;
        st    = stagger && cols > 1;
        rows  = max_h >= 0 ? floor((max_h - (st ? D / 2 : 0)) / D) + 1 : 0;

        if (cols > 0 && rows > 0) {
            pw = (cols - 1) * sx;
            ph = (rows - 1) * D + (st ? D / 2 : 0);
            z0 = mb + ext_z + (max_h - ph) / 2;
            for (c = [0 : cols - 1], r = [0 : rows - 1])
                translate([-pw / 2 + c * sx, 0, z0 + r * D + (st && c % 2 == 1 ? D / 2 : 0)])
                    rotate([90, 0, 0])
                        cylinder(r = cell, h = t + 2, center = true, $fn = hex ? 6 : 32);
        }
    }
}

// =============================================================================
//  Rails ("Raster Wall") – glued or screwed to the drawer side
// =============================================================================
// Built flat: X = length, Y = width (= height in the drawer), Z = thickness.
// Teeth form slots of the system slot width. teeth_offset = position of the
// first tooth from x = 0; -1 centres the pattern. Joined rails use explicit
// offsets so the slot pitch continues across the joint.

function dd_rail_pitch(p, tooth_t = 2) = tooth_t + dd_slot_w(p);

function dd_rail_center_offset(length, p, tooth_t = 2) =
    let(sw = dd_slot_w(p), pitch = tooth_t + sw,
        n = max(1, floor((length + sw) / pitch)),
        used = n * tooth_t + (n - 1) * sw)
    (length - used) / 2;

module dd_rail(length, width, p = dd_profile(), plate = 2.5, tooth_t = 2,
               tooth_h = 6, tooth_chamfer = 0.6, tooth_fillet = 0.5,
               teeth_offset = -1, teeth = true, tongue = true, socket = true,
               tongue_len = 2, tongue_w = -1, tongue_chamfer = 1,
               tol_w = 1, tol_d = 0.5, tol_z = 0.1,
               screws = 3, screw_d = 3.2, head_d = 6.5) {
    sw    = dd_slot_w(p);
    pitch = tooth_t + sw;
    x0    = teeth_offset >= 0 ? teeth_offset : dd_rail_center_offset(length, p, tooth_t);
    n     = floor((length - x0 - tooth_t) / pitch) + 1;
    tw    = tongue_w < 0 ? max(width - 12, width * 0.6) : min(tongue_w, width - 4);
    zt    = plate / 2 - tol_z / 2;
    zs    = plate / 2 + tol_z / 2;

    difference() {
        union() {
            cube([length, width, plate]);
            if (tongue)
                translate([length, (width - tw) / 2, 0]) linear_extrude(zt)
                    polygon([[0, 0], [tongue_len, tongue_chamfer],
                             [tongue_len, tw - tongue_chamfer], [0, tw]]);
            if (teeth && n > 0)
                for (i = [0 : n - 1])
                    translate([x0 + i * pitch, 0, plate - DD_EPS])
                        dd_rail_tooth(width, tooth_t, tooth_h, tooth_chamfer, tooth_fillet);
        }
        if (socket) {
            bw = tw + 2 * tol_w;
            translate([-DD_EPS, (width - bw) / 2, -DD_EPS])
                cube([tongue_len + tol_d + DD_EPS, bw, zs + DD_EPS]);
        }
        // screws sit in the middle of a slot so they damage as few teeth as possible
        if (screws > 0) for (s = [1 : screws]) {
            k  = round((length * s / (screws + 1) - x0 - tooth_t - sw / 2) / pitch);
            xs = x0 + tooth_t + sw / 2 + k * pitch;
            cs = min(1.5, plate - 0.4);
            translate([xs, width / 2, 0]) {
                translate([0, 0, -1]) cylinder(d = screw_d, h = plate + 2, $fn = 32);
                translate([0, 0, plate - cs]) cylinder(d1 = screw_d, d2 = head_d, h = cs + DD_EPS, $fn = 32);
                translate([0, 0, plate]) cylinder(d = head_d + 0.5, h = tooth_h + 1, $fn = 32);
            }
        }
    }
}

// One tooth across the full rail width, with lead-in chamfer and base fillets.
// Keep tooth_fillet <= the wall end chamfer so walls still reach the plate.
module dd_rail_tooth(width, tt, th, ch, fr) {
    c = max(0, min(ch, tt / 2 - 0.2, th - 0.5));
    translate([0, width, 0]) rotate([90, 0, 0]) linear_extrude(width) {
        polygon([[0, 0], [tt, 0], [tt, th - c], [tt - c, th], [c, th], [0, th - c]]);
        if (fr > 0) {
            translate([tt, 0]) dd_fillet_2d(fr);
            mirror([1, 0]) dd_fillet_2d(fr);
        }
    }
}

// =============================================================================
//  Tolerance test
// =============================================================================
// A bar with one slot per tolerance (value engraved next to it) plus a short
// test wall. Print both, find the slot that fits best, use that tolerance.

module dd_tolerance_test(p = dd_profile(), tols = [0.1, 0.15, 0.2, 0.25, 0.3],
                         height = 12, depth = 20, land = 8, base = 1.2,
                         coupon = true) {
    t = dd(p, "wall_t");
    n = len(tols);
    function x_at(i) = land * (i + 1) + i * t + dd_sum(tols, i);
    L = x_at(n);

    difference() {
        cube([L, depth, height]);
        for (i = [0 : n - 1]) {
            translate([x_at(i), -1, base]) cube([t + tols[i], depth + 2, height]);
            translate([x_at(i) - land / 2, depth / 2, height - 0.6])
                linear_extrude(1) rotate(90)
                    text(str(tols[i]), size = min(3.2, land * 0.42),
                         halign = "center", valign = "center");
        }
    }
    if (coupon)
        translate([L / 2, depth + 8, 0])
            dd_wall(30, p, height = height + 4, end_chamfer = 0.3);
}

// =============================================================================
//  Helpers
// =============================================================================

function dd_sum(v, n) = n <= 0 ? 0 : v[n - 1] + dd_sum(v, n - 1);

module dd_round_concave(r) { if (r > 0) offset(r = -r) offset(r = r) children(); else children(); }
module dd_round_convex(r)  { if (r > 0) offset(r = r) offset(delta = -r) children(); else children(); }

module dd_fillet_2d(r) {
    difference() {
        square([r, r]);
        translate([r, r]) circle(r = r, $fn = 24);
    }
}

// Arrange `count` copies of the child in rows that fit max_w, centred on the origin.
module dd_grid(count, pitch_x, pitch_y, max_w = 240) {
    cols = max(1, min(count, floor((max_w + DD_EPS) / pitch_x)));
    rows = ceil(count / cols);
    for (i = [0 : count - 1])
        translate([((i % cols) - (cols - 1) / 2) * pitch_x,
                   (floor(i / cols) - (rows - 1) / 2) * pitch_y, 0])
            children();
}

// Lay a standing wall flat on the bed.
module dd_lay_flat(t) { translate([0, 0, t / 2]) rotate([90, 0, 0]) children(); }
