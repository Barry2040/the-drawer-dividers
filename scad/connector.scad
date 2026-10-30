// The Drawer Dividers V3 – Connector
// Cross, T, corner, straight joiner, end piece and slip-on variants.
use <lib/drawer_divider.scad>

/* [Part] */
// Connector type
Type = "cross"; // [cross:Cross (+), tee:T-piece, corner:Corner (L), straight:Straight joiner, end:End piece, slip_cross:Slip-on cross, slip_tee:Slip-on T, slip_corner_r:Slip-on corner right, slip_corner_l:Slip-on corner left]
// For a slip-on layout: closed cap like the slip-on connectors, pushed on from above
Slip_On_Set = false;
// How many copies on the plate
Count = 1; // [1:1:40]
// Gap between copies (mm)
Spacing = 4; // [1:1:20]

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

/* [Hidden] */
$fn = 64;

P = dd_profile(
    wall_t = Wall_Thickness, tol = Tolerance, height = Height,
    insert = Insert_Depth, shell = Shell_Thickness, arm = Arm_Length,
    fillet = Inner_Fillet, edge_r = Edge_Radius, cap = Cap_Thickness,
    floor_t = Floor_Thickness, lead_in = Lead_In, efc = Elephant_Foot_Compensation,
    magnet_d = Magnet_Diameter, magnet_h = Magnet_Depth,
    end_gap = End_Gap, top_gap = Top_Gap);

pitch = dd_connector_size(P) + Spacing;
dd_grid(Count, pitch, pitch) dd_connector(Type, P, Slip_On_Set);
