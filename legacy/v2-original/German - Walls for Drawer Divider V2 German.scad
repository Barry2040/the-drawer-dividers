/* [Wand Dimensionen] */

// Länge der Trennwand (in mm)
wand_laenge = 100; // [20:1:400]

// Höhe der Trennwand (in mm)
wand_hoehe = 40; // [10:1:150]

// Dicke der Trennwand (in mm)
wand_dicke = 2.0; // [0.8:0.1:5.0]

/* [Optimierungen: Fasen & Material] */

// Fase an den kurzen Enden zum leichteren Einstecken (in mm, 0 = aus)
fase_enden = 0.5; // [0:0.1:2.0]

// Materialersparnis in der Mitte
ausschnitt_typ = "Waben"; // [Keine, Waben, Kreise]

// Größe der Waben/Kreise (Radius in mm)
ausschnitt_groesse = 8.0; // [2:1:30]

// NEU: Exakte Dicke der Stege zwischen den Ausschnitten (in mm)
steg_dicke = 2.0; // [0.5:0.1:10.0]

// Massiver Rand links und rechts für die Verbinder (in mm)
rand_seite = 20.0; // [5:1:50]

// Massiver Rand oben und unten für Stabilität (in mm)
rand_oben_unten = 5.0; // [2:1:20]

/* [Anordnung & Menge] */

// Anzahl der Wände auf dem Druckbett
anzahl_waende = 1; // [1:1:20]

// Abstand zwischen den einzelnen Wänden (in mm)
wand_abstand = 5; // [2:1:20]

/* [Hidden] */
$fn = 32;

// Erzeugt die 2D-Grundform der Wand mit optionalen Fasen
module wand_2d(l, d, c) {
    c_eff = min(c, d/2 - 0.01);
    if (c_eff > 0) {
        polygon([
            [-l/2 + c_eff, -d/2],
            [ l/2 - c_eff, -d/2],
            [ l/2,         -d/2 + c_eff],
            [ l/2,          d/2 - c_eff],
            [ l/2 - c_eff,  d/2],
            [-l/2 + c_eff,  d/2],
            [-l/2,          d/2 - c_eff],
            [-l/2,         -d/2 + c_eff]
        ]);
    } else {
        square([l, d], center=true);
    }
}

// Erzeugt das mathematisch exakte Gitter-Muster zum Abziehen
module cutouts(l, d, h) {
    if (ausschnitt_typ != "Keine") {
        
        // Exakte Berechnung des Abstands für konstante Stegdicke
        D = (ausschnitt_typ == "Waben") ? 
            (ausschnitt_groesse * sqrt(3) + steg_dicke) : 
            (ausschnitt_groesse * 2 + steg_dicke);
            
        spacing_x = D * sqrt(3)/2;
        spacing_z = D;
        
        // Berechne, wie viel Platz für das Muster real zur Verfügung steht
        max_w = l - 2*rand_seite - 2*ausschnitt_groesse;
        max_h = h - 2*rand_oben_unten - 2*ausschnitt_groesse;
        
        // Nur ausführen, wenn mindestens ein Ausschnitt passt
        if (max_w >= 0 && max_h >= 0) {
            cols = floor(max_w / spacing_x) + 1;
            rows = floor((max_h - (cols > 1 ? spacing_z/2 : 0)) / spacing_z) + 1;
            
            if (cols > 0 && rows > 0) {
                // Ermittelt die Gesamtgröße des Musters zur perfekten Zentrierung
                muster_breite = (cols - 1) * spacing_x;
                muster_hoehe = (rows - 1) * spacing_z + (cols > 1 ? spacing_z/2 : 0);
                
                start_x = -muster_breite / 2;
                start_z = (h - muster_hoehe) / 2;
                
                for (c = [0 : cols - 1]) {
                    for (r = [0 : rows - 1]) {
                        offset_z = (c % 2 == 0) ? 0 : spacing_z/2;
                        x_pos = start_x + c * spacing_x;
                        z_pos = start_z + r * spacing_z + offset_z;
                        
                        translate([x_pos, 0, z_pos])
                            rotate([90, 0, 0])
                                cylinder(r=ausschnitt_groesse, h=d+2, center=true, $fn=(ausschnitt_typ == "Waben" ? 6 : 32));
                    }
                }
            }
        }
    }
}

// Setzt die komplette Wand zusammen
module trennwand(l, d, h) {
    difference() {
        // 1. Grundkörper
        linear_extrude(height = h) {
            wand_2d(l, d, fase_enden);
        }
        
        // 2. Cutouts abziehen
        cutouts(l, d, h);
    }
}

// Schleife zur Vervielfältigung entlang der Y-Achse
for (i = [0 : anzahl_waende - 1]) {
    translate([0, i * (wand_dicke + wand_abstand), 0])
        trennwand(wand_laenge, wand_dicke, wand_hoehe);
}