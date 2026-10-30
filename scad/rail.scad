// The Drawer Dividers V3 – Rail ("Raster Wall")
// Toothed rail for the drawer sides: walls slide in anywhere along the rail.
use <lib/drawer_divider.scad>

/* [Part] */
// Rail length (mm)
Length = 200; // [30:0.1:400]
// Rail width = height in the drawer (mm)
Width = 40; // [15:0.5:150]
// Thickness of the base plate (mm)
Plate = 2.5; // [1:0.1:10]
// How many rails on the plate
Count = 1; // [1:1:20]
// Gap between rails (mm)
Spacing = 5; // [1:1:50]
// Print orientation
Orientation = "standing"; // [standing:Standing (teeth print as clean edges), flat:Flat]

/* [Teeth] */
// Generate teeth?
Teeth = true;
// Thickness of one tooth (mm)
Tooth_Thickness = 2; // [0.5:0.1:10]
// How far the teeth stand out (mm)
Tooth_Height = 6; // [2:0.1:30]
// Lead-in chamfer at the tooth tip (mm)
Tooth_Chamfer = 0.6; // [0:0.1:3]
// Fillet at the tooth base (mm, keep <= wall end chamfer)
Tooth_Fillet = 0.5; // [0:0.1:2]
// Position of the first tooth (mm, -1 = centred). The designer sets this for joined rails.
Teeth_Offset = -1; // [-1:0.01:50]

/* [Joints] */
// Tongue on the right end
Tongue = true;
// Socket on the left end
Socket = true;
// How far the tongue sticks out (mm)
Tongue_Length = 2; // [1:0.1:20]
// Tongue width (mm, -1 = automatic)
Tongue_Width = -1; // [-1:1:200]
// Chamfer on the tongue corners (mm)
Tongue_Chamfer = 1; // [0:0.1:10]
// Play in width (mm)
Tolerance_Width = 1; // [0:0.1:5]
// Play in depth (mm)
Tolerance_Depth = 0.5; // [0:0.1:5]
// Play in thickness (mm)
Tolerance_Z = 0.1; // [0:0.01:1]

/* [Screws] */
// Number of screw holes (0 = glue only)
Screws = 3; // [0:1:10]
// Screw shaft diameter (mm)
Screw_Diameter = 3.2; // [1:0.1:6]
// Countersink diameter (mm)
Head_Diameter = 6.5; // [2:0.1:12]

/* [System] */
// Start from a preset or use the values below
Preset = "custom"; // [custom:Custom (values below), v2:V2 defaults, v1:V1 Classic (4.9 mm walls with cap)]
// Exact thickness of your printed walls (mm)
Wall_Thickness = 2.0; // [0.8:0.1:10]
// Extra slot width so the wall does not bind (mm, 0.2 fits most printers)
Tolerance = 0.2; // [0:0.01:1]

/* [Hidden] */
$fn = 32;

P = Preset != "custom" ? dd_preset(Preset)
                       : dd_profile(wall_t = Wall_Thickness, tol = Tolerance);

module one_rail()
    dd_rail(Length, Width, P, plate = Plate, tooth_t = Tooth_Thickness,
            tooth_h = Tooth_Height, tooth_chamfer = Tooth_Chamfer,
            tooth_fillet = Tooth_Fillet, teeth_offset = Teeth_Offset, teeth = Teeth,
            tongue = Tongue, socket = Socket, tongue_len = Tongue_Length,
            tongue_w = Tongue_Width, tongue_chamfer = Tongue_Chamfer,
            tol_w = Tolerance_Width, tol_d = Tolerance_Depth, tol_z = Tolerance_Z,
            screws = Screws, screw_d = Screw_Diameter, head_d = Head_Diameter);

depth = Plate + (Teeth ? Tooth_Height : 0);
if (Orientation == "standing")
    dd_grid(Count, Length + Spacing, depth + Spacing, max_w = 1000)
        translate([-Length / 2, depth / 2, 0]) rotate([90, 0, 0]) one_rail();
else
    dd_grid(Count, Length + Spacing, Width + Spacing, max_w = 1000)
        translate([-Length / 2, -Width / 2, 0]) one_rail();
