// The Drawer Dividers V3 – Tolerance test
// Print this first: one bar with several slot widths plus a short test wall.
// The slot that fits best is your "Tolerance" value for all other parts.
use <lib/drawer_divider.scad>

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
