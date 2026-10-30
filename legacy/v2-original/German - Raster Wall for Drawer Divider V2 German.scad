/* [Basis-Einstellungen] */

// Gesamtlänge der Platte (in mm)
Platten_Laenge = 200.0; // [50:1:400]

// Gesamtbreite der Platte (in mm) - Das ist beim stehenden Druck die HÖHE!
Platten_Breite = 75.0; // [20:1:300]

// Dicke der flachen Grundplatte (in mm)
Platten_Dicke = 2.5; // [0.5:0.1:10.0]

/* [Anordnung auf dem Druckbett] */

// Wie viele Schienen sollen gleichzeitig generiert werden?
Anzahl_Schienen = 1; // [1:1:20]

// Abstand zwischen den einzelnen Schienen (in mm)
Abstand_Schienen = 5.0; // [1.0:1.0:50.0]

/* [Verbinder] */

// Sollen die Platten an den Enden verbunden werden?
End_Verbinder = "Ja"; // [Ja, Nein]

// Wie weit ragt der Stecker-Zapfen heraus? (in mm)
Zapfen_Laenge = 2.0; // [1.0:0.1:20.0]

// Breite des Steckers (in mm)
Zapfen_Breite = 63.0; // [10:1:200]

// Abschrägung (Fase) an den vorderen Ecken des Steckers (in mm)
Zapfen_Fase = 1.0; // [0.0:0.1:10.0]

// Spiel in der Breite (XY): Wie viel breiter ist das Loch? (in mm)
Toleranz_Breite = 1.0; // [0.0:0.1:5.0]

// Spiel in der Tiefe (XY): Wie viel tiefer ist das Loch? (in mm)
Toleranz_Tiefe = 0.5; // [0.0:0.1:5.0]

// Spiel in der Dicke (Z), damit die Platten plan aufliegen (in mm)
Toleranz_Z = 0.1; // [0.0:0.01:1.0]

/* [Raster & Zähne] */

// Sollen die Einsteck-Zähne für Trennwände generiert werden?
Zaehne_Generieren = "Ja"; // [Ja, Nein]

// Exakte Dicke deiner gedruckten Trennwände (in mm)
Wand_Dicke = 2; // [0.8:0.1:10.0]

// Extra-Platz im Schlitz, damit die Wand nicht klemmt
Schlitz_Toleranz = 0.2; // [0.0:0.01:1.0]

// Wie dick ist ein einzelner Plastik-Zahn? (in mm)
Zahn_Dicke = 2.0; // [0.5:0.1:10.0]

// Wie lang stehen die Zähne ab? (in mm)
Zahn_Hoehe = 6.0; // [2.0:0.1:30.0]

/* [Optimierungen: Fasen, Radien & Schrauben] */

// Fase (Trichter) an der Oberkante der Zähne zum leichten Einstecken (in mm, 0 = aus)
Zahn_Fase = 0.8; // [0.0:0.1:3.0]

// Radius am Übergang des Zahns zur Platte gegen Bruch (Fillet, in mm)
Zahn_Radius = 0.5; // [0.0:0.1:2.0]

// Sollen Montage-Bohrungen für Schrauben generiert werden?
Schrauben_Loecher = "Ja"; // [Ja, Nein]

// Anzahl der Schraubenlöcher verteilt über die Länge
Anzahl_Schrauben = 3; // [1:1:10]

// Durchmesser des Schraubenschafts (z.B. 3.0 für 3mm Schrauben)
Schrauben_Durchmesser = 3.2; // [1.0:0.1:6.0]

// Durchmesser des Senkkopfs an der Oberseite
Senkkopf_Durchmesser = 6.5; // [2.0:0.1:12.0]


/* [Druck-Ausrichtung] */

// Soll das Modell für den Slicer stehend rotiert werden?
Stehend_Drucken = "Ja"; // [Ja, Nein]


/* [Hidden] */
/* --- Ab hier arbeitet das Skript im Hintergrund --- */

$fn = 64;

// Mathematik für das Zahn-Raster
schlitz = Wand_Dicke + Schlitz_Toleranz;
raster = Zahn_Dicke + schlitz;

// Zentrierung der Zähne über die volle Länge
anzahl_zaehne = floor(Platten_Laenge / raster);
belegter_platz = (anzahl_zaehne * Zahn_Dicke) + ((anzahl_zaehne - 1) * schlitz);
start_offset = (Platten_Laenge - belegter_platz) / 2;

// Berechnung der exakten Stufen-Höhen
z_mitte = Platten_Dicke / 2;
zapfen_h = z_mitte - (Toleranz_Z / 2);
buchse_h = z_mitte + (Toleranz_Z / 2);

// Modul für den Stecker (Rechte Seite)
module zapfen() {
    y_start = (Platten_Breite - Zapfen_Breite) / 2;
    
    translate([Platten_Laenge, y_start, 0])
        linear_extrude(height = zapfen_h)
            polygon([
                [0, 0],
                [Zapfen_Laenge, Zapfen_Fase],
                [Zapfen_Laenge, Zapfen_Breite - Zapfen_Fase],
                [0, Zapfen_Breite]
            ]);
}

// Modul für den Ausschnitt (Linke Seite)
module buchse_cut() {
    b_breite = Zapfen_Breite + (2 * Toleranz_Breite);
    b_tiefe = Zapfen_Laenge + Toleranz_Tiefe;
    y_start = (Platten_Breite - b_breite) / 2;
    
    translate([-0.1, y_start, -0.1])
        cube([b_tiefe + 0.1, b_breite, buchse_h + 0.1]);
}

// Einzelner Zahn mit optionaler Oberkanten-Fase und Basis-Radius (Minkowski oder Hull-Kniff)
module einzelner_zahn() {
    effective_fase = min(Zahn_Fase, Zahn_Hoehe - 0.1);
    
    translate([0, 0, Platten_Dicke]) {
        // Haupt-Zahnkörper
        if (effective_fase > 0) {
            hull() {
                translate([0, 0, 0])
                    cube([Zahn_Dicke, Platten_Breite, Zahn_Hoehe - effective_fase]);
                translate([0, 0, Zahn_Hoehe])
                    cube([Zahn_Dicke, Platten_Breite, 0.01]);
            }
        } else {
            cube([Zahn_Dicke, Platten_Breite, Zahn_Hoehe]);
        }
        
        // Stabilitäts-Radius am Übergang (Zusatzvolumen als Hohlkehle)
        if (Zahn_Radius > 0) {
            translate([0, 0, Zahn_Radius])
                rotate([0, 90, 0])
                    cylinder(r=Zahn_Radius, h=Zahn_Dicke, $fn=16);
            translate([Zahn_Dicke, 0, Zahn_Radius])
                rotate([0, 90, 0])
                    cylinder(r=Zahn_Radius, h=Zahn_Dicke, $fn=16);
        }
    }
}

// Modul für Schraubenlöcher mit Senkkopf und Freischnitt durch die Zähne
module schrauben_loechers_cut() {
    if (Schrauben_Loecher == "Ja" && Anzahl_Schrauben > 0) {
        abstand_laenge = Platten_Laenge / (Anzahl_Schrauben + 1);
        y_mitte = Platten_Breite / 2;
        
        for (s = [1 : Anzahl_Schrauben]) {
            x_pos = s * abstand_laenge;
            
            // 1. Schaft-Loch durchgehend
            translate([x_pos, y_mitte, -1])
                cylinder(d=Schrauben_Durchmesser, h=Platten_Dicke + Zahn_Hoehe + 2);
                
            // 2. Senkkopf-Trichter an der Oberseite der Platte
            tiefe = min(1.5, Platten_Dicke - 0.4);
            translate([x_pos, y_mitte, Platten_Dicke - tiefe])
                cylinder(d1=Schrauben_Durchmesser, d2=Senkkopf_Durchmesser, h=tiefe + 0.1);
                
            // 3. Freischnitt durch die Zähne nach oben (etwas breiter für Schraubenkopf & Werkzeug)
            translate([x_pos, y_mitte, Platten_Dicke])
                cylinder(d=Senkkopf_Durchmesser + 0.5, h=Zahn_Hoehe + 2);
        }
    }
}

// Das komplette Bauteil als zusammenhängendes Modul
module fertige_schiene() {
    difference() {
        // Alles was "dazukommt" in eine Union
        union() {
            // 1. Hauptplatte
            cube([Platten_Laenge, Platten_Breite, Platten_Dicke]);
            
            // 2. Zapfen rechts ansetzen
            if (End_Verbinder == "Ja") {
                zapfen();
            }
            
            // 3. Zähne oben drauf setzen
            if (Zaehne_Generieren == "Ja") {
                for (i = [0 : anzahl_zaehne - 1]) {
                    translate([start_offset + i * raster, 0, 0])
                        einzelner_zahn();
                }
            }
        }
        
        // Alles was "weggeschnitten" wird, ab hier:
        
        // 4. Buchse links ausstanzen
        if (End_Verbinder == "Ja") {
            buchse_cut();
        }
        
        // 5. Schraubenlöcher durch ALLES abziehen
        schrauben_loechers_cut();
    }
}

// Hilfs-Modul: Eine einzelne Schiene auf [0,0,0] zentriert und korrekt rotiert
module schiene_zentriert() {
    if (Stehend_Drucken == "Ja") {
        translate([-Platten_Laenge/2, (Platten_Dicke + Zahn_Hoehe)/2, 0])
            rotate([90, 0, 0])
                fertige_schiene();
    } else {
        translate([-Platten_Laenge/2, -Platten_Breite/2, 0])
            fertige_schiene();
    }
}

// --- Ausrichtung & Vervielfältigung für MakerWorld ---

// Wie breit ist eine Schiene in der Y-Achse (je nach Druckausrichtung)?
breite_y = (Stehend_Drucken == "Ja") ? (Platten_Dicke + Zahn_Hoehe) : Platten_Breite;

// Wie viel Platz braucht die ganze Gruppe?
gesamt_y = (Anzahl_Schienen * breite_y) + ((Anzahl_Schienen - 1) * Abstand_Schienen);

// Wo muss die erste Schiene starten, damit die ganze Gruppe mittig auf [0,0,0] liegt?
start_y = -gesamt_y / 2 + breite_y / 2;

for (i = [0 : Anzahl_Schienen - 1]) {
    translate([0, start_y + i * (breite_y + Abstand_Schienen), 0])
        schiene_zentriert();
}