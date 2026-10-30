# The Drawer Dividers – V3

Ein parametrisches System aus 3D-gedruckten Schubladentrennern: **Wände**, **Verbinder** und optional **Raster-Schienen**. Die Geometrie steckt komplett in **OpenSCAD**. Dazu gibt es einen **Designer im Browser**: Du misst deine Schublade aus, zeichnest die Fächer, und der Designer erzeugt alle Teile als STL zum Drucken.

**➜ Designer online öffnen: [barry2040.github.io/the-drawer-dividers](https://barry2040.github.io/the-drawer-dividers/)**

V3 ist der Nachfolger der beiden MakerWorld-Projekte [V1 – The Drawer Dividers](https://makerworld.com/de/models/496828-the-drawer-dividers) und [V2 – Parametric System](https://makerworld.com/de/models/3106623-the-drawer-dividers-v2-parametric-system). Die Standardwerte sind die von V2: 2 mm Wände, 0,2 mm Toleranz, offene Verbinder.

---

## Schnellstart

| Du willst … | Dann … |
|---|---|
| eine Schublade planen und alle STLs bekommen | **HTML-Designer**: [online öffnen](https://barry2040.github.io/the-drawer-dividers/) oder `Drawer-Divider-Designer.html` herunterladen und öffnen (siehe unten) |
| ohne Zeichnen, nur mit Zahlen arbeiten (z.B. auf MakerWorld) | **SCAD-Designer**: `scad/drawer_designer.scad` in OpenSCAD |
| einzelne Teile nachdrucken | `scad/connector.scad`, `wall.scad`, `rail.scad` in OpenSCAD |
| erst mal prüfen, ob die Wände in die Schlitze passen | `scad/tolerance_test.scad` drucken |

---

## Das System in 1 Minute

- **Wände** – flache Platten in der Höhe deiner Trenner, optional mit Waben- oder Kreismuster.
- **Verbinder** – halten die Wände zusammen. Jede Wand steckt 14 mm tief in einem Schlitz.
  - *Kreuz* (4 Wände), *T-Stück* (3), *Ecke* (2 im Winkel), *Gerade* (verlängert eine zu lange Wand), *Endstück* (Wandende an der Schubladenwand)
- **Am Schubladenrand** gibt es vier Varianten:
  - **Rahmen** – Außenwände mit Ecken und T-Stücken, das Ganze steht für sich und lässt sich herausnehmen
  - **Endstücke** – keine Außenwand, die Wände enden mit einem Endstück an der Schubladenwand
  - **Raster-Schienen** – Zahnschienen an den Schubladenseiten, die Wände rasten zwischen den Zähnen ein
  - **Direkt klemmen** – die Wände laufen bis an die Schubladenwand, kein Teil am Rand
- **Aufsteck-Verbinder** (optional) – lange Wände laufen über die Kreuzungen durch, die Verbinder werden von oben aufgesteckt. Das ergibt weniger und längere Wände; die Wände sind dafür 2 mm niedriger, damit der Deckel des Verbinders bündig sitzt.

---

## HTML-Designer

### Öffnen

Am einfachsten **online**: [barry2040.github.io/the-drawer-dividers](https://barry2040.github.io/the-drawer-dividers/). Die Seite wird bei jeder Änderung an `designer/` automatisch neu veröffentlicht.

Oder **offline**: im Online-Designer *Export → Offline-Version herunterladen* (oder hier im Hauptordner [`Drawer-Divider-Designer.html`](Drawer-Divider-Designer.html) öffnen → *Download raw file*, ca. 150 KB). Wichtig: nur diese Datei aus dem Hauptordner läuft allein, nicht die Dateien aus `designer/`. Dann per Doppelklick im Browser öffnen (Chrome, Edge oder Firefox). Die Datei enthält alles, eine Installation ist nicht nötig. Internet brauchst du nur für die 3D-Vorschau und *STLs erzeugen*.

Erlaubt der Browser bei einer lokalen Datei keinen Hintergrund-Prozess (Worker), rechnet *STLs erzeugen* automatisch direkt in der Seite. Das funktioniert genauso, die Seite reagiert währenddessen nur langsamer.

### Schritt für Schritt

1. **Schublade ausmessen** – Innenbreite, -tiefe und -höhe eintragen. Die Höhe der Trenner stellt sich automatisch ein (Schubladenhöhe minus 5 mm Luft). Eine eigene Höhe tippst du einfach ins Feld *Höhe*.
2. **Rand wählen** – Rahmen, Endstücke, Raster-Schienen oder direkt klemmen; bei Bedarf *Aufsteck-Verbinder* anhaken.
3. **Fächer anlegen** – mit den Werkzeugen oben über der Zeichnung:

   | Werkzeug | Taste | So geht's |
   |---|---|---|
   | Vorlage | – | N × M gleich große Fächer als Start |
   | Teilen | `S` | Anzahl wählen (`2`–`6` oder *frei*), Richtung wählen (`Shift` wechselt), in ein Fach klicken |
   | Zeichnen | `W` | Wand mit der Maus ziehen; Endpunkte rasten am Rand, im Raster und an bestehenden Wänden ein |
   | Auswählen | `V` | Wand anklicken und verschieben, `Entf` löscht sie |
   | Radieren | `E` | entfernt das Wandstück zwischen zwei Verbindern |
   | Rückgängig | `Strg+Z` / `Strg+Y` | |
   | 3D | – | Vorschau des Zusammenbaus |

   Mausrad zoomt, rechte oder mittlere Maustaste verschiebt die Ansicht, `F` passt sie ein.

4. **Stückliste prüfen** – rechts stehen alle Teile: Verbinder nach Typ, Wände nach Länge, Schienen und das Filament. Unter *Hinweise* steht, wenn etwas nicht passt.
5. **STLs erzeugen** – der orange Button oben rechts. OpenSCAD läuft dabei im Browser und rechnet jede Druckplatte direkt aus der SCAD-Bibliothek, Platte für Platte mit Fortschritt. Danach lädst du jede STL einzeln herunter oder alles als **ZIP** (STLs, Stückliste als CSV, Druckjob-`.scad`, Projekt-`.json`).
   - Beim ersten Mal wird OpenSCAD geladen (ca. 11 MB von jsDelivr, [openscad-wasm-prebuilt](https://www.npmjs.com/package/openscad-wasm-prebuilt), GPL-2.0), dafür brauchst du Internet.
   - Den Toleranztest rechnest du aus der Druckjob-`.scad` in OpenSCAD, weil er Schrift braucht.
6. **Drucken** – die Platten in den Slicer ziehen. Jede Platte ist nach Druckbett-Größe aufgeteilt und heißt z.B. `05_10x_Wand_118_mm.stl`.

### Was der Designer für dich prüft

- **Maße** – die Zahlen an den Wänden sind die echte Drucklänge, also bis in den Schlitz der Verbinder. Die Maßlinie zeigt mit ihren Endstrichen, wo die Wand endet.
- **Verbinder dürfen sich nicht überschneiden** – jeder Verbinder-Arm ist 20 mm lang. Zwei Verbinder auf derselben Wand brauchen deshalb mindestens **41 mm** Abstand von Mitte zu Mitte. Teilungen und Wände, die enger wären, lässt der Designer gar nicht erst zu: Die Vorschau wird rot, und unten erscheint ein Hinweis. Wände, die nur wenige Millimeter neben einer anderen liegen, rasten auf deren Linie ein, dann sitzt dort ein Kreuz.
- **Zu lange Wände** (länger als *Max. Wandlänge*) werden geteilt – mit einer geraden Verlängerung, oder bei Aufsteck-Verbindern an einer Kreuzung.
- **Randart wechseln** – die Fächer bleiben gleich groß, die inneren Wände wandern anteilig mit. Bei Raster-Schienen rasten die Wände ins 4,2-mm-Zahnraster ein; wechselst du ohne Änderung zurück, liegen sie wieder genau wie vorher.

### Einstellungen

- **Trenner** – Wanddicke, Toleranz, Höhe, Wand-Muster und Material. Mehr brauchst du meistens nicht.
- **Erweitert** (eingeklappt) – Druckbett, max. Wandlänge, liegend oder stehend drucken, Griffmulde, Fangraster, alle Verbinder-Maße und die Raster-Schiene. *Alles auf Standard zurücksetzen* stellt die V2-Werte wieder her.
- **Mein Profil** – speichert deine Einstellungen unter einem Namen, z.B. für deinen Drucker mit seiner Toleranz und seinem Druckbett. Bei der nächsten Schublade wählst du das Profil einfach wieder aus. Ein Profil enthält alles außer Schublade, Rand und Fächern und liegt im Browser.

Dein Projekt speichert der Designer automatisch im Browser. Mit *Speichern* / *Öffnen* sicherst du es als `.json`-Datei.

---

## Druck-Tipps

1. **Zuerst den Toleranztest drucken** (`scad/tolerance_test.scad`, oder im Druckjob die letzte Platte). Er hat fünf beschriftete Schlitze und eine Testwand. Die Toleranz, bei der die Wand stramm, aber ohne Gewalt hineingeht, trägst du im Designer ein und speicherst sie im Profil.
2. **Wanddicke** im Designer ist die tatsächlich gedruckte Dicke. Wenn dein Drucker 2 mm als 2,1 mm druckt, trag 2,1 ein.
3. **Verbinder** werden mit der offenen Seite nach oben gedruckt, Aufsteck-Verbinder mit dem Deckel nach unten (danach umdrehen und aufstecken). Ohne Stützen.
4. **Wände** stehend drucken geht schneller, liegend ist stabiler (*Erweitert → Ausrichtung*).

---

## SCAD-Designer (ohne Zeichnen)

`scad/drawer_designer.scad` in OpenSCAD öffnen und rechts im Customizer ausfüllen:

| Abschnitt | Was |
|---|---|
| **Schublade** | Innenbreite, -tiefe, -höhe |
| **Fächer** | `Strips = "1,1,2"` teilt die Schublade in Streifen (hier ist der dritte doppelt so breit). `Splits = "2,3,1:2"` legt die Fächer pro Streifen fest: eine Zahl ergibt gleich große Fächer, `1:2` relative Größen. `Direction` bestimmt, ob die Streifen von vorne nach hinten oder von links nach rechts laufen. |
| **Am Schubladenrand** | Rahmen, Endstücke, Raster-Schienen oder direkt klemmen, optional Aufsteck-Verbinder |
| **Ausgabe** | *Zusammenbau mit Stückliste* → *Alle Druckteile* → oder *eine Zeile* der Stückliste (`Part_Number`) pro Druckplatte, dann F6 und F7 für die STL |
| **System** | Wanddicke, Toleranz, Höhe und die Verbinder-Maße |

Er wendet dieselben Regeln an wie der HTML-Designer: den passenden Verbinder an jedem Knoten, exakte Wandlängen, Teilung zu langer Wände, Zusammenrasten fast fluchtender Fachgrenzen, Schienen passend zum Druckbett. Zu enge Fächer werden rot markiert und in der Konsole gemeldet.

**Ohne Installation im Browser:** Die Einzeldatei `dist/makerworld/de/schubladen_designer.scad` (englisch: `en/drawer_designer.scad`) lässt sich auf **MakerWorld** als parametrisches Modell hochladen oder im **OpenSCAD Playground** (`ochafik.com/openscad2`) öffnen.

---

## Bibliothek für eigene Projekte

Alle Teile nutzen dasselbe **Profil**, deshalb passen Wand, Verbinder und Schiene immer zusammen:

```openscad
use <lib/drawer_divider.scad>

P = dd_profile(wall_t = 2, tol = 0.2, height = 40);   // alles Weitere hat Standardwerte

dd_connector("tee", P);
translate([60, 0, 0]) dd_wall(118, P, pattern = "hex");
translate([0, 60, 0]) dd_rail(200, 40, P);
```

| Modul / Funktion | Was |
|---|---|
| `dd_connector(type, P)` | `cross`, `tee`, `corner`, `straight`, `end`, `slip_cross`, `slip_tee`, `slip_corner_r`, `slip_corner_l` |
| `dd_connector_custom(arms, slots, through_y, cap, P)` | beliebige Arm-Kombinationen |
| `dd_wall(length, P, …)` | Wand mit Waben-/Kreismuster, Griffmulde, Endfasen |
| `dd_rail(length, width, P, …)` | Raster-Schiene mit Zapfen/Buchse, Schraubenlöchern, `teeth_offset` |
| `dd_tolerance_test(P, tols)` | Testblock mit mehreren Schlitzbreiten plus Testwand |
| `dd_layout(P, opts)` / `dd_layout_bom(L)` | Fachaufteilung → Wände, Verbinder, Schienen, Stückliste |
| `dd_layout_clashes(L, P)` | Verbinder, die sich überschneiden würden |

---

## Dateien

```
Drawer-Divider-Designer.html  der Designer als eine einzige Datei (wird erzeugt) – zum Herunterladen
designer/                   HTML-Designer, Quelle
  dev.html                  Oberfläche (Quelle, läuft nur mit den .js-Dateien daneben)
  app.js                      Planung, Stückliste, Prüfungen, 3D-Vorschau, Druckjob
  stl.js                      STL-Erzeugung mit OpenSCAD im Browser, ZIP-Download
  scad_lib.js                 eingebettete SCAD-Bibliothek (wird erzeugt)
scad/
  drawer_designer.scad      SCAD-Designer
  connector.scad            Einzelteile: Verbinder
  wall.scad                 Einzelteile: Wände
  rail.scad                 Einzelteile: Raster-Schiene
  tolerance_test.scad       Toleranztest
  lib/drawer_divider.scad   Bibliothek – alle Geometrie und die Layout-Logik
dist/makerworld/en/ de/     Einzeldateien für MakerWorld (Bibliothek eingebettet, werden erzeugt)
legacy/v2-original/         Original-SCADs von V2
tools/                      Build-Skript und deutsche Übersetzung
.github/workflows/pages.yml veröffentlicht Drawer-Divider-Designer.html auf GitHub Pages
```

## Was gegenüber V2 verbessert ist

- **Ein gemeinsames Profil** für alle Teile statt eigener Wanddicke/Toleranz in jeder Datei
- **Designer** im Browser und als SCAD-Datei, mit Prüfung auf Verbinder-Überschneidungen
- **Zahn-Fase der Schiene repariert** – die alte Fase hatte keine Wirkung (hull über zwei gleich breite Körper)
- **Hohlkehle am Zahnfuß repariert** – jetzt eine echte Hohlkehle über die ganze Zahnbreite statt kleiner Noppen
- **Schienen-Stöße** – `teeth_offset` hält das Zahnraster über mehrere Schienen hinweg durchgehend
- **Schraubenlöcher** sitzen mittig in einem Schlitz, damit weniger Zähne beschädigt werden
- **Verbinder-Kontur** über Offset-Rundung – jede Arm-Kombination bekommt saubere Innenradien
- **Magnet-Tasche** bei jedem Verbinder mit massiver Mitte
- **Wandmuster** – der Rand richtet sich nach der Einschubtiefe, die Wabenhöhe wird korrekt berechnet
- **Neu**: Endstück, Aufsteck-Verbinder, Griffmulde, liegender Druck, optionaler Deckel (nach unten gedruckt), Toleranztest mit 5 beschrifteten Schlitzen

## Für Entwickler

Nach Änderungen in `scad/` oder `designer/` die erzeugten Dateien neu bauen (MakerWorld-Einzeldateien, eingebettete Bibliothek, `Drawer-Divider-Designer.html`):

```bash
python tools/build.py
```

- Getestet mit OpenSCAD 2021.01. Neuere Versionen (Manifold) rendern deutlich schneller.
- Die Formeln für Wandlängen und Abstände stehen zweimal: in `scad/lib/drawer_divider.scad` und in `designer/app.js` (`geom()`, `analyze()`). Wer eine davon ändert, muss die andere mitziehen.
