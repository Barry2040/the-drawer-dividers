// The Drawer Dividers V3 – Label clip
// Slides onto the top edge of a wall: write on it, add a sticker or engrave a text.
use <lib/drawer_divider.scad>

/* [Part] */
// Text engraved into the face ("" = blank, write on it)
Clip_Text = "";
// Clip width along the wall (mm)
Clip_Width = 40; // [15:1:120]
// Height of the slanted face (mm)
Face_Height = 12; // [6:0.5:30]
// Angle of the face (degrees, 0 = upright)
Face_Angle = 45; // [0:5:80]
// How far the clip reaches down the wall (mm)
Grip_Depth = 8; // [3:0.5:20]
// Text size (mm)
Text_Size = 5; // [2:0.5:15]
// How many copies on the plate
Count = 6; // [1:1:40]
// Gap between copies (mm)
Spacing = 4; // [1:1:20]

/* [System] */
// Exact thickness of your printed walls (mm)
Wall_Thickness = 2.0; // [0.8:0.1:10]
// Material thickness of the clip (mm)
Clip_Wall = 1.2; // [0.6:0.1:3]
// Extra room for the wall – smaller = tighter (mm)
Clip_Fit = 0.15; // [0:0.05:0.6]

/* [Hidden] */
$fn = 32;

P = dd_profile(wall_t = Wall_Thickness);
sz = dd_label_clip_size(P, Face_Height, Face_Angle, Grip_Depth, Clip_Wall);
dd_grid(Count, sz[0] + Spacing, sz[1] + Spacing)
    translate([0, Grip_Depth - sz[1] / 2, 0])
        dd_label_clip(Clip_Width, P, face = Face_Height, angle = Face_Angle, grip = Grip_Depth,
                      wall = Clip_Wall, fit = Clip_Fit, label = Clip_Text, text_size = Text_Size);
