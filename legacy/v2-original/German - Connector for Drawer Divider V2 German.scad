/* [Basis-Einstellungen] */

// Art des Verbinders
Verbinder_Typ = "Toleranz_Test"; // [Kreuz, T-Stueck, Ecke, Gerade, Endstueck, Aufsteck_Kreuz, Aufsteck_T_Stueck, Aufsteck_Ecke_Rechts, Aufsteck_Ecke_Links, Toleranz_Test]

// Gesamthöhe des Bauteils (in mm)
Hoehe = 40; // [10:1:150]

/* [Passform & Maße] */

// Exakte Dicke deiner gedruckten Trennwände (in mm)
Wand_Dicke = 2; // [0.8:0.1:10.0]

// Extra-Platz im Schlitz, damit die Wand nicht klemmt (0.2mm ist meist ideal)
Toleranz = 0.2; // [0.0:0.01:1.0]

// Wie tief soll die Wand in den normalen Verbinder rutschen? (in mm)
Einschub_Tiefe = 14.0; // [5:1:30]

// Dicke der Außenwände des Verbinders selbst (in mm)
Wandung_Aussen = 2.5; // [1.0:0.1:5.0]

// Gesamtlänge eines Arms, gemessen aus der absoluten Mitte (in mm)
Arm_Laenge = 20.0; // [10:1:100]

// Radius für die weiche, stabilisierende Innenkurve (in mm)
Innere_Rundung = 10.0; // [0:0.1:20]

/* [Extras] */

// Dicke des Bodens bei Aufsteck-Verbindern, damit sie nicht zerfallen (in mm)
Boden_Dicke = 2.0; // [0.5:0.1:5.0]

// Schräge an der Oberkante zum leichteren Einstecken (in mm)
Einfuehrhilfe = 1.0; // [0:0.1:5.0]


/* [Optimierung & Befestigung] */

// Gleicht den breiteren ersten Layer (Elefantenfuß) in den Schlitzen aus (in mm, 0 = aus)
Elefantenfuss_Kompensation = 0.4; // [0:0.1:2.0]

// Durchmesser für Magnete/Rutschpads an der Unterseite (nur bei T-Stück/Kreuz aktiv, in mm, 0 = aus)
Magnet_Durchmesser = 5.0; // [0:0.1:5.0]

// Tiefe für den Magneten an der Unterseite (in mm)
Magnet_Tiefe = 2.0; // [0.1:0.1:10]


/* [Hidden] */
/* --- Ab hier arbeitet das Skript im Hintergrund und bleibt unsichtbar --- */

$fn = 64; 

schlitz_breite = Wand_Dicke + Toleranz;
arm_breite = schlitz_breite + (2 * Wandung_Aussen);

// Boolean Logik zur Steuerung der Bauteile
is_kreuz = (Verbinder_Typ == "Kreuz");
is_tstueck = (Verbinder_Typ == "T-Stueck");
is_ecke = (Verbinder_Typ == "Ecke");
is_gerade = (Verbinder_Typ == "Gerade");
is_end = (Verbinder_Typ == "Endstueck");
is_auf_kreuz = (Verbinder_Typ == "Aufsteck_Kreuz");
is_auf_t = (Verbinder_Typ == "Aufsteck_T_Stueck");
is_auf_ecke_r = (Verbinder_Typ == "Aufsteck_Ecke_Rechts");
is_auf_ecke_l = (Verbinder_Typ == "Aufsteck_Ecke_Links");
is_test = (Verbinder_Typ == "Toleranz_Test");

is_aufsteck = is_auf_kreuz || is_auf_t || is_auf_ecke_r || is_auf_ecke_l;

// Erlaubnis-Prüfung für Magnete (nur bei T-Stücken und Kreuzungen)
is_magnet_erlaubt = is_kreuz || is_tstueck || is_auf_kreuz || is_auf_t;

// Spezielle Maße für den Toleranz-Test (überschreibt temporär die Standard-Werte für extrem kurze Druckzeit)
eff_Hoehe = is_test ? min(15, Hoehe) : Hoehe;
eff_Arm_Laenge = is_test ? max(Einschub_Tiefe + 2, 15) : Arm_Laenge;

// Welche physischen Arme existieren im Modell?
arm_0   = is_kreuz || is_tstueck || is_ecke || is_gerade || is_end || is_auf_kreuz || is_auf_t || is_auf_ecke_r || is_test; 
arm_90  = is_kreuz || is_tstueck || is_ecke || is_auf_kreuz || is_auf_t || is_auf_ecke_r || is_auf_ecke_l; 
arm_180 = is_kreuz || is_tstueck || is_gerade || is_auf_kreuz || is_auf_ecke_l; 
arm_270 = is_kreuz || is_auf_kreuz || is_auf_t; 

// Welche Schlitze muessen geschnitten werden?
schlitz_0   = arm_0;
schlitz_90  = arm_90;
schlitz_180 = arm_180;
schlitz_270 = arm_270 || is_auf_ecke_r || is_auf_ecke_l;

// Welche Schlitze gehen komplett von der Mitte durch?
durchgehend_0   = is_test; // Der Testdruck bekommt einen durchgehenden Schlitz zum einfachen Durchschieben
durchgehend_90  = is_aufsteck;
durchgehend_180 = false;
durchgehend_270 = is_aufsteck;

difference() {
    // 1. Die massive Grundform hochziehen
    linear_extrude(height = eff_Hoehe) {
        union() {
            square([arm_breite, arm_breite], center = true);
            
            if (arm_0) arm_solid();
            if (arm_90) rotate(90) arm_solid();
            if (arm_180) rotate(180) arm_solid();
            if (arm_270) rotate(270) arm_solid();
            
            if (Innere_Rundung > 0) {
                if (arm_0 && arm_90) innen_rundung_add(Innere_Rundung);
                if (arm_90 && arm_180) rotate(90) innen_rundung_add(Innere_Rundung);
                if (arm_180 && arm_270) rotate(180) innen_rundung_add(Innere_Rundung);
                if (arm_270 && arm_0) rotate(270) innen_rundung_add(Innere_Rundung);
            }
        }
    }
    
    // 2. Schlitze und Einführhilfe abziehen
    if (schlitz_0) schlitz_3d(durchgehend_0);
    if (schlitz_90) rotate([0,0,90]) schlitz_3d(durchgehend_90);
    if (schlitz_180) rotate([0,0,180]) schlitz_3d(durchgehend_180);
    if (schlitz_270) rotate([0,0,270]) schlitz_3d(durchgehend_270);
    
    // 3. Magnet/Rutschpad Loch an der Unterseite (nur wenn erlaubt)
    if (Magnet_Durchmesser > 0 && Magnet_Tiefe > 0 && is_magnet_erlaubt && !is_test) {
        translate([0, 0, -0.1])
            cylinder(d=Magnet_Durchmesser, h=Magnet_Tiefe + 0.1);
    }
}

// --- Hilfsmodule (2D) ---
module arm_solid() {
    translate([0, -arm_breite/2])
        square([eff_Arm_Laenge, arm_breite]);
}

module innen_rundung_add(r) {
    translate([arm_breite/2 - 0.01, arm_breite/2 - 0.01])
        difference() {
            square([r + 0.01, r + 0.01]);
            translate([r + 0.01, r + 0.01]) circle(r=r);
        }
}

// --- Hilfsmodule (3D) ---
module schlitz_3d(durchgehend = false) {
    start_x = durchgehend ? -0.1 : (eff_Arm_Laenge - Einschub_Tiefe);
    laenge = durchgehend ? (eff_Arm_Laenge + 1) : (Einschub_Tiefe + 1);
    
    z_start = is_aufsteck ? Boden_Dicke : -1;
    
    // Hauptschlitz
    translate([0, 0, z_start]) 
        linear_extrude(height = eff_Hoehe + 2) 
            translate([start_x, -schlitz_breite/2])
                square([laenge, schlitz_breite]);
                
    // Trichterförmige Einführhilfe
    if (Einfuehrhilfe > 0) {
        hull() {
            translate([start_x, -schlitz_breite/2, eff_Hoehe - Einfuehrhilfe])
                cube([laenge, schlitz_breite, 0.1]);
                
            translate([start_x, -(schlitz_breite + 2*Einfuehrhilfe)/2, eff_Hoehe + 0.1])
                cube([laenge, schlitz_breite + 2*Einfuehrhilfe, 0.1]);
        }
    }
    
    // Elefantenfuß-Kompensation am Boden (nur bei Verbindern, die direkt auf dem Druckbett aufliegen)
    if (!is_aufsteck && Elefantenfuss_Kompensation > 0) {
        hull() {
            // Etwas breiter direkt am Druckbett
            translate([start_x, -(schlitz_breite + 2*Elefantenfuss_Kompensation)/2, -0.1])
                cube([laenge, schlitz_breite + 2*Elefantenfuss_Kompensation, 0.1]);
            // Normalmaß erreicht auf Höhe der Kompensations-Einstellung
            translate([start_x, -schlitz_breite/2, Elefantenfuss_Kompensation])
                cube([laenge, schlitz_breite, 0.1]);
        }
    }
}