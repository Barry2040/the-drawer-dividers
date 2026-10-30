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
//  The Drawer Dividers – core library (V3)
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
    cap      = 0,    // closed cap; 0 = slots open on both ends
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

// ---- derived values (the designer uses the same formulas) -------------------
// centre distance two connectors on one wall need so their arms do not collide
function dd_min_conn_gap(p) = 2 * dd(p, "arm") + 1;
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

function dd_connector_types() = ["cross", "tee", "corner", "straight", "end",
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

// slip = true: part of a slip-on set. Every connector of the set gets the cap and
// is pushed on from above, also where the walls end instead of running through.
module dd_connector(type = "cross", p = dd_profile(), slip = false) {
    def = dd_connector_def(type);
    assert(!is_undef(def), str("dd_connector(): unknown type '", type, "'"));
    dd_connector_custom(arms = def[0], slots = def[1], through_y = def[2],
                        cap = dd_cap(p, def[3] || slip), p = p);
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
    // a fillet longer than the free arm would swallow the arm ends
    dd_round_concave(min(dd(p, "fillet"), dd(p, "arm") - aw / 2))
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

// A connector as it sits in the drawer (cap on top), for assembly previews.
// The slots stay open so the walls show inside them; through = "x"|"y"|"" for slip-on.
module dd_connector_installed(arms, through = "", cap = 0, p = dd_profile()) {
    h   = dd(p, "height");
    arm = dd(p, "arm");
    ps  = dd_pocket_start(p);
    sw  = dd_slot_w(p);
    linear_extrude(h - cap) difference() {
        dd_connector_outline(arms, p);
        for (i = [0:3]) if (arms[i])
            rotate(90 * i) translate([ps, -sw / 2]) square([arm + 1 - ps, sw]);
        if (through != "")
            rotate(through == "x" ? 0 : 90) square([2 * arm + 2, sw], center = true);
    }
    if (cap > 0) translate([0, 0, h - cap]) linear_extrude(cap) dd_connector_outline(arms, p);
}

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
            // nearest slot, kept on the rail when it is short
            k  = max(0, min(n - 2, round((length * s / (screws + 1) - x0 - tooth_t - sw / 2) / pitch)));
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

// =============================================================================
//  Drawer layout – used by drawer_designer.scad
// =============================================================================
// The drawer is cut into strips (u axis), each strip into compartments
// (v axis). Strip walls run through from edge to edge. Strips run front to
// back unless `swap` is set. dd_layout() works in u/v and returns world
// coordinates: x = width, y = depth, front edge at y = 0.
// Directions: 0 = +X, 1 = +Y, 2 = -X, 3 = -Y.

function dd_le() = 0.01;   // a function, so inlined single files can use it before this line

// ---- string parsing ("1,1,2" and "2,1:2") ----------------------------------
function dd_str_split(s, sep, i = 0, cur = "", acc = []) =
    i >= len(s) ? concat(acc, [cur])
  : s[i] == sep ? dd_str_split(s, sep, i + 1, "", concat(acc, [cur]))
  : dd_str_split(s, sep, i + 1, str(cur, s[i]), acc);

function dd_str_num(s) = dd__num([for (c = s) if (c != " ") c], 0, 0, 0, 1);
function dd__num(c, i, v, frac, sign) =
    i >= len(c) ? sign * v
  : c[i] == "-" ? dd__num(c, i + 1, v, frac, -1)
  : c[i] == "." ? dd__num(c, i + 1, v, max(frac, 0.1), sign)
  : let(d = ord(c[i]) - 48)
    d < 0 || d > 9 ? dd__num(c, i + 1, v, frac, sign)
  : frac > 0 ? dd__num(c, i + 1, v + d * frac, frac / 10, sign)
             : dd__num(c, i + 1, v * 10 + d, 0, sign);

// "1,1,2" -> [1,1,2]
function dd_parse_weights(s) =
    let(v = [for (p = dd_str_split(s, ",")) let(n = dd_str_num(p)) if (n > 0) n])
    len(v) ? v : [1];

// "2,1:2" -> one weight list per strip; a plain number n = n equal parts.
// Missing entries repeat the last one.
function dd_parse_splits(s, n) =
    let(per = [for (it = dd_str_split(s, ","))
                  let(p = [for (x = dd_str_split(it, ":")) let(v = dd_str_num(x)) if (v > 0) v])
                  len(p) == 0 ? [1]
                : len(p) == 1 ? [for (k = [1 : max(1, round(p[0]))]) 1] : p])
    [for (i = [0 : n - 1]) per[min(i, len(per) - 1)]];

// ---- small list helpers ----------------------------------------------------
function dd_has_num(l, x) = len([for (y = l) if (abs(y - x) < dd_le()) 1]) > 0;
function dd_sort(a) =
    len(a) <= 1 ? a :
    let(p = a[floor(len(a) / 2)])
    concat(dd_sort([for (x = a) if (x < p) x]), [for (x = a) if (x == p) x], dd_sort([for (x = a) if (x > p) x]));
function dd_uniq_sorted(l) = [for (k = [0 : 1 : len(l) - 1]) if (k == 0 || l[k] - l[k - 1] > dd_le()) l[k]];
function dd_unique(l, i = 0, acc = []) =
    i >= len(l) ? acc : dd_unique(l, i + 1, len([for (y = acc) if (y == l[i]) 1]) ? acc : concat(acc, [l[i]]));
function dd_count(l, x) = len([for (y = l) if (y == x) 1]);
function dd_nearest(l, v) = len(l) == 0 ? v : let(d = [for (x = l) abs(x - v)]) l[search(min(d), d)[0]];
function dd_fmt(v, d = 1) = str(round(v * pow(10, d)) / pow(10, d));

// ---- options ---------------------------------------------------------------
function dd_layout_opts(width = 400, depth = 300, height = 60, strips = "1,1,1",
                        splits = "2", swap = false, edge = "frame", slip = false,
                        max_len = 240, edge_gap = 0.5, clamp_gap = 1,
                        rail_plate = 2.5, tooth_t = 2, tooth_h = 6) = [
    ["width", width], ["depth", depth], ["height", height], ["strips", strips],
    ["splits", splits], ["swap", swap], ["edge", edge], ["slip", slip],
    ["max_len", max_len], ["edge_gap", edge_gap], ["clamp_gap", clamp_gap],
    ["rail_plate", rail_plate], ["tooth_t", tooth_t], ["tooth_h", tooth_h]
];

// Rail tooth pattern along one world axis. Rails on the left/right sides run
// the full depth; front/back rails sit between them.
function dd_lay_rail_span(axis, W, D, rt) =
    axis == "y" ? [0.5, D - 1] : [rt + 0.5, W - 2 * rt - 1];

function dd_lay_rail_slots(axis, W, D, rt, tt, p) =
    let(sp = dd_lay_rail_span(axis, W, D, rt), sw = dd_slot_w(p), pitch = tt + sw,
        n = max(1, floor((sp[1] + sw) / pitch)),
        first = sp[0] + dd_rail_center_offset(sp[1], p, tt))
    [for (k = [0 : 1 : n - 2]) first + tt + sw / 2 + k * pitch];

// interior wall centres between c0 and c1 so the *net* compartments follow the weights
function dd_lay_split(c0, c1, off, w, t) =
    let(n = len(w), net = (c1 - off) - (c0 + off) - (n - 1) * t, tot = dd_sum(w, n))
    [for (k = [1 : 1 : n - 1]) c0 + off + net * dd_sum(w, k) / tot + (k - 1) * t + t / 2];

// node: [u, v, dirs, kind ("conn"|"edge"), type, through ("u"|"v"|""), end offset, joint]
function dd_lay_node(u, v, d, edge, slip, end_off, joint = false) =
    let(n = d[0] + d[1] + d[2] + d[3])
    n == 1 && (edge == "rail" || edge == "none") ? [u, v, d, "edge", "", "", end_off, false] :
    let(t0 = n == 4 ? "cross" : n == 3 ? "tee" : n == 1 ? "end"
           : (d[0] == 1 && d[2] == 1) || (d[1] == 1 && d[3] == 1) ? "straight" : "corner",
        th = slip && n >= 3 ? (d[1] == 1 && d[3] == 1 ? "v" : "u") : "")
    [u, v, d, "conn", th == "" ? t0 : (n == 4 ? "slip_cross" : "slip_tee"), th, 0, joint];

// slip-on: positions along a through wall where it should end at a crossing instead of
// getting a joiner squeezed between two connectors (greedy, each piece <= maxlen)
function dd_lay_slip_cuts(stops, prev, last, ins, maxlen, acc = []) =
    last - prev - 2 * ins <= maxlen ? acc :
    let(ok = [for (u = stops) if (u > prev + dd_le() && u < last - dd_le() && u - prev - 2 * ins <= maxlen) u])
    len(ok) == 0 ? acc : dd_lay_slip_cuts(stops, max(ok), last, ins, maxlen, concat(acc, [max(ok)]));

function dd_lay_find(nodes, u, v) =
    let(m = [for (n = nodes) if (abs(n[0] - u) < dd_le() && abs(n[1] - v) < dd_le()) n]) m[0];

function dd_lay_align(v, m, i = 0, acc = []) =
    i >= len(v) ? acc :
    dd_lay_align(v, m, i + 1, concat(acc, [i == 0 ? v[0] :
        [for (y = v[i]) let(prev = acc[i - 1], d = [for (q = prev) abs(q - y)])
            len(prev) && min(d) < m ? prev[search(min(d), d)[0]] : y]]));

function dd_lay_off(n, ins) = n[3] == "edge" ? n[6] : ins;

// joints that split a too long wall, kept clear of other connectors on the line
function dd_lay_kpieces(total, ins, maxlen, k = 1) =
    (total - (k - 1) * 2 * ins) / k <= maxlen || k >= 50 ? k : dd_lay_kpieces(total, ins, maxlen, k + 1);

function dd_lay_joints(u0, u1, o0, o1, ins, maxlen, avoid, clear) =
    let(total = u1 - u0 - o0 - o1, k = dd_lay_kpieces(total, ins, maxlen),
        pl = (total - (k - 1) * 2 * ins) / k)
    k <= 1 ? [] : dd__joints(1, k, u0 + o0, pl, ins, maxlen, avoid, clear, []);

function dd__joints(j, k, start, pl, ins, maxlen, avoid, clear, acc) =
    j >= k ? acc :
    let(ideal = start + j * pl + (2 * j - 1) * ins,
        prev  = len(acc) ? acc[len(acc) - 1] + ins : start,
        cands = [for (d = [0 : 2.5 : 80], c = [ideal + d, ideal - d])
                    if (len([for (a = avoid) if (abs(a - c) < clear) 1]) == 0 && c - ins - prev <= maxlen) c])
    dd__joints(j + 1, k, start, pl, ins, maxlen, avoid, clear, concat(acc, [len(cands) ? cands[0] : ideal]));

// cuts: [[u, offset], ...] -> [pieces [[ori, c, s, e]], joints [[ori, c, u]]]
function dd_lay_line(ori, c, cuts, avoid, ins, maxlen, clear) =
    let(segs = [for (k = [0 : 1 : len(cuts) - 2])
        let(u0 = cuts[k][0], o0 = cuts[k][1], u1 = cuts[k + 1][0], o1 = cuts[k + 1][1],
            js = dd_lay_joints(u0, u1, o0, o1, ins, maxlen,
                               [for (a = avoid) if (a > u0 + dd_le() && a < u1 - dd_le()) a], clear),
            b  = concat([u0 + o0], [for (jc = js) each [jc - ins, jc + ins]], [u1 - o1]))
        [[for (m = [0 : 2 : len(b) - 2]) [ori, c, b[m], b[m + 1]]], js]])
    [[for (s = segs) each s[0]], [for (s = segs) for (jc = s[1]) [ori, c, jc]]];

// Returns a key/value list:
//   walls  [[axis "x"|"y", c, start, end, length], ...]   axis = direction the wall runs
//   conns  [[type, x, y, dirs, through "x"|"y"|"", joint], ...]
//   rails  [[side "L"|"R"|"F"|"B", start, end, length, teeth_offset, tongue, socket, screws], ...]
//   comps  [[x0, y0, x1, y1, net_w, net_d], ...]
//   wall_h, rail_w, rail_t, inset
function dd_layout(p, o) =
    let(
        W = dd(o, "width"), D = dd(o, "depth"), swap = dd(o, "swap"),
        U = swap ? D : W, V = swap ? W : D,
        edge = dd(o, "edge"), slip = dd(o, "slip"), frame = edge == "frame", rail = edge == "rail",
        maxlen = dd(o, "max_len"),
        t = dd(p, "wall_t"), aw = dd_arm_w(p), ins = dd_wall_inset(p),
        tt = dd(o, "tooth_t"), rt = dd(o, "rail_plate") + dd(o, "tooth_h"),
        B = (frame || edge == "endcap") ? aw / 2 + dd(o, "edge_gap") : 0,
        base = frame ? B : 0,
        eoff = frame ? t / 2 : rail ? rt : 0,
        end_off = rail ? dd(o, "rail_plate") + dd(p, "end_gap") : dd(o, "clamp_gap"),
        clear = 2 * dd(p, "arm") + 2,
        cols = dd_parse_weights(dd(o, "strips")), ncol = len(cols),
        rows = dd_parse_splits(dd(o, "splits"), ncol),
        su = rail ? dd_lay_rail_slots(swap ? "y" : "x", W, D, rt, tt, p) : [],
        sv = rail ? dd_lay_rail_slots(swap ? "x" : "y", W, D, rt, tt, p) : [],
        us = concat([base], [for (x = dd_lay_split(base, U - base, eoff, cols, t)) rail ? dd_nearest(su, x) : x], [U - base]),
        // compartment borders that almost line up with the neighbouring strip snap onto it,
        // otherwise the arms of the two connectors on the strip wall would collide
        vsi = dd_lay_align([for (i = [0 : ncol - 1])
                  [for (y = dd_lay_split(base, V - base, eoff, rows[i], t)) rail ? dd_nearest(sv, y) : y]],
                  dd_min_conn_gap(p)),

        // nodes on the through-running strip walls (and the frame sides)
        vjs = frame ? [for (j = [0 : ncol]) j] : [for (j = [1 : 1 : ncol - 1]) j],
        vstops = [for (j = [0 : ncol])
                     dd_uniq_sorted(dd_sort(concat([B, V - B], j >= 1 ? vsi[j - 1] : [], j < ncol ? vsi[j] : [])))],
        // slip-on: crossings where too long through walls end (they become normal connectors)
        vcut = [for (j = [0 : ncol]) slip ? dd_lay_slip_cuts(vstops[j], B, V - B, ins, maxlen) : []],
        fcut = slip && frame ? dd_lay_slip_cuts([for (k = [1 : 1 : ncol - 1]) us[k]], us[0], us[ncol], ins, maxlen) : [],
        vnodes = [for (j = vjs, v = vstops[j])
            let(isEnd = abs(v - B) < dd_le() || abs(v - (V - B)) < dd_le(),
                slipHere = slip && !(isEnd ? dd_has_num(fcut, us[j]) : dd_has_num(vcut[j], v)),
                d = [(j < ncol && dd_has_num(vsi[j], v)) || (frame && isEnd && j < ncol) ? 1 : 0,
                     v < V - B - dd_le() ? 1 : 0,
                     (j >= 1 && dd_has_num(vsi[j - 1], v)) || (frame && isEnd && j > 0) ? 1 : 0,
                     v > B + dd_le() ? 1 : 0])
            dd_lay_node(us[j], v, d, edge, slipHere, end_off)],
        // compartment walls that end at the drawer side
        hnodes = frame ? [] : concat(
            [for (v = vsi[0]) dd_lay_node(B, v, [1, 0, 0, 0], edge, slip, end_off)],
            [for (v = vsi[ncol - 1]) dd_lay_node(U - B, v, [0, 0, 1, 0], edge, slip, end_off)]),
        nodes = concat(vnodes, hnodes),

        vlines = [for (j = vjs)
            dd_lay_line("v", us[j],
                [for (v = vstops[j]) let(n = dd_lay_find(nodes, us[j], v))
                    if (abs(v - B) < dd_le() || abs(v - (V - B)) < dd_le() || n[5] != "v") [v, dd_lay_off(n, ins)]],
                vstops[j], ins, maxlen, clear)],
        hlines = [for (i = [0 : ncol - 1], v = vsi[i])
            let(ua = i == 0 ? B : us[i], ub = i == ncol - 1 ? U - B : us[i + 1])
            dd_lay_line("u", v, [[ua, dd_lay_off(dd_lay_find(nodes, ua, v), ins)],
                                 [ub, dd_lay_off(dd_lay_find(nodes, ub, v), ins)]],
                        [], ins, maxlen, clear)],
        flines = frame ? [for (v = [B, V - B])
            dd_lay_line("u", v, [for (k = [0 : ncol]) if (k == 0 || k == ncol || !slip || dd_has_num(fcut, us[k])) [us[k], ins]],
                        us, ins, maxlen, clear)] : [],
        lines = concat(vlines, hlines, flines),
        pieces = [for (l = lines) each l[0]],
        joints = [for (l = lines, jn = l[1])
            dd_lay_node(jn[0] == "u" ? jn[2] : jn[1], jn[0] == "u" ? jn[1] : jn[2],
                        jn[0] == "u" ? [1, 0, 1, 0] : [0, 1, 0, 1], edge, false, 0, true)],
        lconns = concat([for (n = nodes) if (n[3] == "conn") n], joints),

        // world coordinates
        walls = [for (pc = pieces)
            [(pc[0] == "u") != swap ? "x" : "y", pc[1], pc[2], pc[3], pc[3] - pc[2]]],
        conns = [for (n = lconns)
            [n[4], swap ? n[1] : n[0], swap ? n[0] : n[1],
             swap ? [n[2][1], n[2][0], n[2][3], n[2][2]] : n[2],
             n[5] == "" ? "" : ((n[5] == "u") != swap ? "x" : "y"), n[7]]],

        // rails: one or more pieces per drawer side that has wall ends
        wall_h = dd_wall_height(p, slip),
        rail_w = min(wall_h, dd(o, "height")),
        uEdges = rail ? [len(vsi[0]) > 0, len(vsi[ncol - 1]) > 0] : [false, false],
        vEdges = rail ? [ncol > 1, ncol > 1] : [false, false],
        sides = [for (s = [["L", swap ? vEdges[0] : uEdges[0]], ["R", swap ? vEdges[1] : uEdges[1]],
                           ["F", swap ? uEdges[0] : vEdges[0]], ["B", swap ? uEdges[1] : vEdges[1]]]) if (s[1]) s[0]],
        pitch = tt + dd_slot_w(p),
        rails = [for (side = sides)
            let(axis = side == "L" || side == "R" ? "y" : "x",
                sp = dd_lay_rail_span(axis, W, D, rt),
                first = sp[0] + dd_rail_center_offset(sp[1], p, tt),
                k = ceil(sp[1] / maxlen), pl = sp[1] / k)
            for (i = [0 : k - 1])
                let(ps = sp[0] + i * pl)
                [side, ps, ps + pl, pl, ((first - ps) % pitch + pitch) % pitch, i < k - 1, i > 0,
                 max(1, round(pl / 70))]],

        // compartments with their net (inside) size
        comps = [for (i = [0 : ncol - 1])
            let(vs = concat([base], vsi[i], [V - base]), u0 = us[i], u1 = us[i + 1])
            for (k = [0 : len(vs) - 2])
                let(v0 = vs[k], v1 = vs[k + 1],
                    so = [for (c = [[u0, U], [u1, U], [v0, V], [v1, V]])
                             abs(c[0]) < dd_le() || abs(c[0] - c[1]) < dd_le() ? (rail ? rt : 0) : t / 2],
                    nu = u1 - u0 - so[0] - so[1], nv = v1 - v0 - so[2] - so[3])
                swap ? [v0, u0, v1, u1, nv, nu] : [u0, v0, u1, v1, nu, nv]]
    ) [
        ["walls", walls], ["conns", conns], ["rails", rails], ["comps", comps],
        ["wall_h", wall_h], ["rail_w", rail_w], ["rail_t", rt], ["inset", B]
    ];

// ---- parts list ------------------------------------------------------------
function dd_wall_len_round(l) = floor(l * 10 + 0.05) / 10;

// Connectors whose bodies overlap: on one line each reaches an arm length towards
// its neighbour where it has an arm, half its width where it has none.
// Returns the indices into dd(L, "conns") that collide with another connector.
function dd_layout_clashes(L, p) =
    let(cs = dd(L, "conns"), n = len(cs), arm = dd(p, "arm"), aw = dd_arm_w(p),
        reach = function(d, i) d[i] ? arm : aw / 2,
        hit = function(a, b)
            let(sameY = abs(a[2] - b[2]) < dd_le(), sameX = abs(a[1] - b[1]) < dd_le(),
                lo = sameY ? (a[1] < b[1] ? a : b) : (a[2] < b[2] ? a : b),
                hi = lo == a ? b : a)
            sameY ? hi[1] - lo[1] < reach(lo[3], 0) + reach(hi[3], 2) + 1 - dd_le()
          : sameX ? hi[2] - lo[2] < reach(lo[3], 1) + reach(hi[3], 3) + 1 - dd_le()
          : false)
    [for (i = [0 : 1 : n - 1]) if (len([for (j = [0 : 1 : n - 1]) if (j != i && hit(cs[i], cs[j])) 1]) > 0) i];

// [[kind "c"|"w"|"r", spec, qty], ...] – connectors, then walls (longest first), then rails
function dd_layout_bom(L) =
    let(conns = dd(L, "conns"), walls = dd(L, "walls"), rails = dd(L, "rails"),
        ctypes = [for (c = conns) c[0]],
        lens   = [for (w = walls) if (w[4] > 0) dd_wall_len_round(w[4])],
        ulens  = dd_uniq_sorted(dd_sort(lens)),
        rspec  = [for (r = rails) [round(r[3] * 100) / 100, round(r[4] * 100) / 100, r[5], r[6], r[7]]])
    concat(
        [for (t = dd_connector_types()) if (dd_count(ctypes, t) > 0) ["c", t, dd_count(ctypes, t)]],
        [for (k = [len(ulens) - 1 : -1 : 0]) ["w", ulens[k], len([for (l = lens) if (abs(l - ulens[k]) < dd_le()) 1])]],
        [for (r = dd_unique(rspec)) ["r", r, dd_count(rspec, r)]]);
