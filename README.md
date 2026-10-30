# The Drawer Dividers – V3

Ein parametrisches System aus 3D-gedruckten Schubladentrennern: Wände, Verbinder und Raster-Schienen, die immer zusammenpassen. Dazu gibt es einen **lokalen Designer**: Du gibst deine Schubladenmaße ein, zeichnest die Fächer, und er sagt dir genau, welche Teile du in welcher Länge wie oft drucken musst.

V3 führt die beiden MakerWorld-Projekte zusammen:

- [V1 – The Drawer Dividers](https://makerworld.com/de/models/496828-the-drawer-dividers) (feste STLs, 4,9-mm-Wände)
- [V2 – Parametric System](https://makerworld.com/de/models/3106623-the-drawer-dividers-v2-parametric-system) (OpenSCAD, 2-mm-Wände)

V1 ist geometrisch dasselbe System wie V2, nur mit anderen Werten (4,9 mm Wand, 0,1 mm Toleranz, 50 mm Höhe, 5 mm Deckel). Deshalb gibt es jetzt **eine** Bibliothek mit zwei Profilen statt zwei getrennter Projekte.

## Ordnerstruktur

```
designer/            Lokaler Designer (index.html öffnen, kein Server nötig)
scad/
  lib/drawer_divider.scad   Die Bibliothek – alle Geometrie steckt hier
  connector.scad            Customizer: Verbinder
  wall.scad                 Customizer: Wände
  rail.scad                 Customizer: Raster-Schiene
  tolerance_test.scad       Customizer: Toleranztest
dist/makerworld/
  en/  de/                  Einzeldateien für MakerWorld (Bibliothek eingebettet)
tools/
  build.py                  erzeugt dist/ und designer/scad_lib.js
  render_job.py             rendert alle STLs eines Druckjobs automatisch
  i18n_de.py                deutsche Customizer-Namen
legacy/
  v1-stl/                   Original-STLs von V1
  v2-original/              Original-SCADs von V2
```

## Designer

`designer/index.html` im Browser öffnen (Doppelklick reicht).

1. **Schublade** – Innenmaße eingeben.
2. **System** – Profil wählen: *V2* (2-mm-Wände) oder *V1 Classic* (4,9-mm-Wände mit Deckel). Jeder Wert ist anpassbar.
3. **Am Schubladenrand** – wie das System an der Schubladenwand endet:
   - *Rahmen*: Außenwände mit Ecken und T-Stücken, das Ganze steht für sich (V1-Stil)
   - *Endstücke*: Wände enden mit einem Endstück an der Schubladenwand
   - *Raster-Schienen*: Zahnschienen an den Seiten, Wände rasten im Zahnraster ein
   - *Direkt klemmen*: Wände laufen bis zur Schubladenwand
4. **Fächer anlegen**
   - `W` Zeichnen – Wand ziehen; Endpunkte rasten an Rand, Raster und bestehenden Wänden ein
   - `S` Teilen – in ein Fach klicken; `2`–`6` teilt in gleich große Fächer, Shift wechselt die Richtung
   - `V` Auswählen – Wand anklicken und verschieben, `Entf` löscht
   - `E` Radieren – entfernt nur das Wandstück zwischen zwei Verbindern
   - *Vorlage* – ganze Schublade in N × M gleiche Fächer teilen
5. **Stückliste** rechts – Verbinder nach Typ, Wände nach Länge, Schienen mit Zahnversatz, Filament-Schätzung.
6. **Export**
   - *OpenSCAD-Druckjob*: eine `.scad` mit allen Teilen, sortiert nach Druckplatten, die aufs Druckbett passen
   - *Stückliste (CSV)*
   - *Drucken / PDF*

Was der Designer automatisch erledigt:

- erkennt an jedem Knoten den richtigen Verbinder (Kreuz, T, Ecke, Endstück)
- rechnet die exakte Wandlänge aus (Einschubtiefe, Spiel, Schienenplatte)
- teilt zu lange Wände mit geraden Verbindern, ohne dass diese auf einer Kreuzung landen
- *Aufsteck-Modus*: lange Wände laufen durch, Aufsteck-Kreuze/-T kommen von oben drauf, das spart Teile
- Schienen werden passend gestückelt, das Zahnraster läuft über die Stöße weiter
- zeigt die Netto-Fachmaße an und warnt bei zu kurzen Wänden, zu hohen Verbindern usw.

Projekte werden automatisch im Browser gespeichert. Mit *Speichern* / *Öffnen* lassen sie sich als `.json` sichern. Die 3D-Vorschau lädt three.js aus dem Netz, alles andere läuft offline.

### Alle STLs auf einmal

```bash
python tools/render_job.py meine_schublade_druckjob.scad
```

Das ruft OpenSCAD für jede Druckplatte auf und legt die STLs in `meine_schublade_druckjob_stl/` ab.

## OpenSCAD-Bibliothek

Alle Teile nutzen dasselbe **Profil**, deshalb passen Wand, Verbinder und Schiene immer zusammen:

```openscad
use <lib/drawer_divider.scad>

P = dd_profile(wall_t = 2, tol = 0.2, height = 40);   // oder dd_preset("v1")

dd_connector("tee", P);
translate([60, 0, 0]) dd_wall(118, P, pattern = "hex");
translate([0, 60, 0]) dd_rail(200, 40, P);
```

| Modul | Was |
|---|---|
| `dd_connector(type, P)` | `cross`, `tee`, `corner`, `straight`, `end`, `slip_cross`, `slip_tee`, `slip_corner_r`, `slip_corner_l` |
| `dd_connector_custom(arms, slots, through_y, cap, P)` | beliebige Arm-Kombinationen |
| `dd_wall(length, P, …)` | Wand mit Waben-/Kreismuster, Griffmulde, Endfasen |
| `dd_rail(length, width, P, …)` | Raster-Schiene mit Zapfen/Buchse, Schrauben, `teeth_offset` |
| `dd_tolerance_test(P, tols)` | Testblock mit mehreren Schlitzbreiten + Testwand |
| `dd_wall_length(dist, P)` | Wandlänge aus dem Abstand zweier Verbindermitten |

### Was gegenüber V2 verbessert ist

- **Ein gemeinsames Profil** für alle Teile statt eigener Wanddicke/Toleranz pro Datei
- **V1 ist als Profil wieder da** – jetzt parametrisch und mit Deckel nach unten gedruckt (keine Brücken über die Schlitze)
- **Zahn-Fase der Schiene repariert**: Die alte Fase hatte keine Wirkung (hull über zwei gleich breite Körper)
- **Hohlkehle am Zahnfuß repariert**: Die alten Zylinder lagen quer und erzeugten nur kleine Noppen an einer Kante. Jetzt läuft eine echte Hohlkehle über die ganze Zahnbreite
- **Schienen-Stöße**: `teeth_offset` hält das Zahnraster über mehrere Schienen hinweg durchgehend, und es passen mehr Zähne auf dieselbe Länge
- **Schraubenlöcher** sitzen mittig in einem Schlitz, damit weniger Zähne beschädigt werden
- **Verbinder-Kontur** über Offset-Rundung: beliebige Arm-Kombinationen bekommen saubere Innenradien und leicht gerundete Außenkanten
- **Magnet-Tasche** für jeden Verbinder mit massiver Mitte, nicht nur für Kreuz und T
- **Wandmuster**: Der Rand richtet sich automatisch nach der Einschubtiefe (Waben enden nicht mehr in der Verbindertasche), die Wabenhöhe wird korrekt berechnet (mehr Ersparnis), und es gibt einen Fallback ohne Versatz für niedrige Wände
- **Neu**: Griffmulde, liegender Druck, Endstück, Toleranztest mit 5 beschrifteten Schlitzen + Testwand
- **Deutsche und englische MakerWorld-Dateien** werden aus einer Quelle erzeugt (`tools/build.py`)

## Entwicklung

Nach Änderungen an der Bibliothek oder den Customizer-Dateien:

```bash
python tools/build.py
```

Die Formeln für Wandlängen stehen zweimal, in `scad/lib/drawer_divider.scad` und in `designer/app.js` (`geom()`). Wer eine davon ändert, muss die andere mitziehen.

Getestet mit OpenSCAD 2021.01. Neuere Versionen (Manifold) rendern deutlich schneller.
