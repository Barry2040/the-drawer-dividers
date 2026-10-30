// Drawer Divider Designer – language. The page is written in German; EN maps the German
// text to English. T('text') or T`text ${x}` translates (placeholders are {} in the keys),
// translateDom() does the static texts and tooltips of the page.
// tools/i18n_keys.py lists texts without a translation.
'use strict';

const LANG = (() => {
  try { const l = localStorage.getItem('dd-lang'); if (l === 'de' || l === 'en') return l; } catch { /* no storage */ }
  return /^de\b/i.test(navigator.language || '') ? 'de' : 'en';
})();

const EN = {
  // header and export menu
  'Neu': 'New', 'Öffnen': 'Open', 'Speichern': 'Save', 'STLs erzeugen': 'Make STLs',
  'Neues Projekt': 'New project', 'Projekt öffnen (.json)': 'Open project (.json)', 'Projekt speichern (.json)': 'Save project (.json)',
  'Projektname': 'Project name', 'Sprache / Language': 'Sprache / Language',
  'Alle Druckplatten mit OpenSCAD im Browser rechnen': 'Render every print plate with OpenSCAD in the browser',
  'OpenSCAD-Druckjob': 'OpenSCAD print job', 'Alle Teile in einer .scad – Teil wählen, STL exportieren': 'All parts in one .scad – pick a part, export the STL',
  'Link teilen': 'Share link', 'Das ganze Layout steckt im Link – zum Verschicken oder für MakerWorld': 'The whole layout is in the link – to send around or for MakerWorld',
  'Stückliste (CSV)': 'Parts list (CSV)', 'Für Excel / Tabellen': 'For Excel / spreadsheets',
  'Aufbauplan drucken / PDF': 'Print assembly plan / PDF', 'Plan mit Wandbuchstaben, Teileliste und Aufbauschritte': 'Plan with wall letters, parts list and assembly steps',
  'Offline-Version herunterladen': 'Download offline version', 'Der ganze Designer als eine Datei, läuft ohne Internet': 'The whole designer as one file, works without internet',

  // left panel
  'Schublade (Innenmaß)': 'Drawer (inside)', 'Breite': 'Width', 'Tiefe': 'Depth', 'Höhe': 'Height', 'Eckradius': 'Corner radius',
  'Radius der Innenecken der Schublade – die Rahmenecken werden passend abgerundet': 'Radius of the inside corners of the drawer – the frame corners are rounded to match',
  'Am Schubladenrand': 'At the drawer edge', 'Rahmen': 'Frame', 'Außenwände mit Ecken und T-Stücken – steht stabil für sich': 'Outer walls with corners and T pieces – stands on its own',
  'Endstücke': 'End caps', 'Wände enden mit einem Endstück an der Schubladenwand': 'Walls end with an end cap at the drawer wall',
  'Raster-Schienen': 'Grid rails', 'Zahnschienen an den Seiten, Wände rasten im Raster ein': 'Toothed rails on the sides, walls snap into the grid',
  'Direkt klemmen': 'Clamp directly', 'Wände laufen bis zur Schubladenwand, kein Teil am Rand': 'Walls run up to the drawer wall, no part at the edge',
  'Aufsteck-Verbinder': 'Slip-on connectors', 'Lange Wände laufen durch, Verbinder werden von oben aufgesteckt': 'Long walls run through, connectors are pushed on from above',
  'Trenner': 'Dividers', 'Wanddicke': 'Wall thickness', 'Toleranz': 'Tolerance', 'Höhe automatisch': 'Automatic height',
  'Schubladenhöhe minus 5 mm Luft – eine eigene Höhe eintippen schaltet das ab': 'Drawer height minus 5 mm clearance – typing your own height turns this off',
  'Wand-Muster': 'Wall pattern', 'Keins': 'None', 'Waben': 'Honeycomb', 'Kreise': 'Circles',
  'Mein Profil': 'My profile', 'Standard': 'Default', 'Löschen': 'Delete',
  'Gespeicherte Einstellungen laden': 'Load saved settings', 'Aktuelle Einstellungen als Profil speichern': 'Save current settings as a profile', 'Profil löschen': 'Delete profile',
  'Speichert alle Einstellungen außer Schublade, Rand und Fächern – z.B. Toleranz und Druckbett deines Druckers.': 'Saves all settings except drawer, edge and compartments – e.g. the tolerance and bed size of your printer.',
  'Erweitert': 'Advanced', 'Druckbett': 'Print bed', 'Max. Wandlänge': 'Max. wall length', 'Ausrichtung': 'Orientation', 'Stehend': 'Standing', 'Liegend': 'Lying flat',
  'Griffmulde': 'Finger notch', 'Raster (Fang)': 'Snap grid', 'Abstand Rand': 'Edge gap',
  'Beschriftungsclips': 'Label clips', 'Ein Clip pro Fach zum Aufstecken auf die Wand – mit Stift beschriften oder Etikett aufkleben': 'One clip per compartment to push onto the wall – write on it or stick a label on',
  'Wände beschriften': 'Label walls', 'Buchstabe und Länge werden in die Wandenden graviert (verschwinden im Verbinder) und stehen im Plan': 'Letter and length are engraved into the wall ends (hidden in the connector) and listed in the plan',
  'Längere Wände werden automatisch mit geraden Verbindern geteilt.': 'Longer walls are split automatically with straight connectors.',
  'Verbinder': 'Connectors', 'Einschubtiefe': 'Insert depth', 'Armlänge': 'Arm length', 'Wandung': 'Shell', 'Innenradius': 'Inner radius', 'Deckel': 'Cap',
  'Boden (Aufsteck)': 'Floor (slip-on)', 'Einführfase': 'Lead-in chamfer', 'Elefantenfuß': 'Elephant foot', 'Magnet Ø': 'Magnet Ø', 'Magnet Tiefe': 'Magnet depth',
  'Spiel Wandende': 'Wall end gap', 'Spiel oben': 'Top gap', 'Raster-Schiene': 'Grid rail', 'Platte': 'Plate', 'Zahn': 'Tooth', 'Zahnhöhe': 'Tooth height',
  'Alles auf Standard zurücksetzen': 'Reset everything to default',

  // toolbar and canvas
  'Zeichnen': 'Draw', 'Teilen': 'Split', 'Auswählen': 'Select', 'Radieren': 'Erase', 'Vorlage': 'Template',
  'Wand zeichnen (W)': 'Draw wall (W)', 'Fach teilen (S)': 'Split compartment (S)', 'Auswählen & verschieben (V)': 'Select & move (V)', 'Wandstück entfernen (E)': 'Remove wall piece (E)',
  'Rückgängig (Strg+Z)': 'Undo (Ctrl+Z)', 'Wiederholen (Strg+Y)': 'Redo (Ctrl+Y)', 'Raster-Vorlage': 'Layout template', 'Alle Wände löschen': 'Delete all walls',
  'Einpassen (F)': 'Fit (F)', '3D-Vorschau': '3D preview', 'Senkrechte Wand': 'Vertical wall', 'Waagerechte Wand': 'Horizontal wall',
  'Teilung': 'Split into', 'frei': 'free', 'Richtung': 'Direction', 'Shift = Richtung wechseln': 'Shift = change direction', 'Vorne': 'Front',
  'Mausrad = Zoom · Rechte/mittlere Maustaste = Verschieben · Entf = Auswahl löschen · Esc = Abbrechen': 'Mouse wheel = zoom · right/middle button = pan · Del = delete selection · Esc = cancel',
  'Klicken & ziehen, um eine Wand zu zeichnen. Endpunkte rasten an Rand, Raster und bestehenden Wänden ein.': 'Click & drag to draw a wall. End points snap to the edge, the grid and existing walls.',
  'In ein Fach klicken, um es zu teilen. Zahl 1–6 = Anzahl Fächer, Shift = Richtung.': 'Click into a compartment to split it. Keys 1–6 = number of compartments, Shift = direction.',
  'Wandstück zwischen zwei Verbindern anklicken, um es zu entfernen.': 'Click a wall piece between two connectors to remove it.',

  // right panel
  'Übersicht': 'Overview', 'Teile': 'Parts', 'Fächer': 'Compartments', 'g Filament ca.': 'g filament approx.', 'Hinweise': 'Notes', 'Auswahl': 'Selection',
  'Stückliste': 'Parts list', 'Aufbauplan': 'Assembly plan', 'Legende': 'Legend', 'Wand': 'Wall', 'Aufsteck': 'Slip-on', 'Verlängerung': 'Joiner', 'Schiene': 'Rail',
  '{} Teile': '{} parts', 'Verbinder · {} mm hoch': 'Connectors · {} mm high', 'Wände · {} × {} mm': 'Walls · {} × {} mm', 'Zubehör': 'Accessories',
  'Höhe {} mm · ca. {} g': 'Height {} mm · approx. {} g', '{} · ca. {} g': '{} · approx. {} g',
  'Beschriftungsclip': 'Label clip', 'Wird oben auf eine Wand gesteckt': 'Pushed onto the top of a wall',
  'Breite {} · Versatz {}': 'Width {} · offset {}', ' · Zapfen': ' · tongue', ' · Buchse': ' · socket', 'Zapfen': 'tongue', 'Buchse': 'socket',
  'Noch keine Teile – zeichne Wände in die Schublade.': 'No parts yet – draw walls into the drawer.', 'Alles passt.': 'Everything fits.',
  'Mittellinie': 'Centre line', 'Druckteile': 'Printed parts', 'waagerecht': 'horizontal', 'senkrecht': 'vertical',
  'Ziehen zum Verschieben · Entf zum Löschen': 'Drag to move · Del to delete',

  // connector types
  'Kreuz': 'Cross', '4 Wände treffen sich': '4 walls meet', 'T-Stück': 'T piece', '3 Wände': '3 walls', 'Ecke': 'Corner', '2 Wände im 90°-Winkel': '2 walls at 90°',
  'Rahmenecke gerundet': 'Rounded frame corner', 'Außen gerundet für die Schubladenecke': 'Rounded outside for the drawer corner',
  'Gerade': 'Straight', 'Verlängert eine geteilte Wand': 'Joins a split wall', 'Endstück': 'End cap', 'Freies Wandende / am Rand': 'Free wall end / at the edge',
  'Aufsteck-Kreuz durchgehend': 'Slip-on cross, through', 'Aufsteck-T durchgehend': 'Slip-on T, through', 'Auf durchgehende Wand gesteckt': 'Pushed onto a through wall',
  'Aufsteck-': 'Slip-on ', ', Wände enden darin': ', walls end inside', ' (Verlängerung)': ' (joiner)',

  // notes
  'Eine {} mm lange Wand ist länger als {} mm – in {} Teile mit Verlängerung geteilt.': 'A {} mm wall is longer than {} mm – split into {} parts with joiners.',
  '{} Wandstück(e) passen nicht – Verbinder liegen zu dicht beieinander (mind. {} mm Abstand).': '{} wall piece(s) do not fit – connectors are too close together (at least {} mm apart).',
  '{} zu kurze Wandstück(e) – rot markiert.': '{} wall piece(s) too short – marked red.',
  '{}× überschneiden sich Verbinder – Wände auf einer Linie brauchen mind. {} mm Abstand (rot markiert).': '{}× connectors overlap – walls on one line need at least {} mm between them (marked red).',
  '{} Wandende(n) treffen keinen Schlitz der Schiene – mit „Auswählen" leicht verschieben.': '{} wall end(s) miss a slot of the rail – nudge them with "Select".',
  'Verbinder sind {} mm hoch, die Schublade nur {} mm.': 'Connectors are {} mm high, the drawer only {} mm.',
  'Nur {} mm Luft über den Trennern – die Schublade könnte hängen bleiben.': 'Only {} mm clearance above the dividers – the drawer could get stuck.',
  'Längstes Teil ({} mm) passt kaum aufs {}-mm-Druckbett.': 'Longest part ({} mm) barely fits the {} mm print bed.',
  'Eckradius zu groß: Die Rahmenecken lassen sich nur bis {} mm runden, sonst würden die Schlitze angeschnitten. Mehr Abstand zum Rand oder Endstücke helfen.': 'Corner radius too big: the frame corners can only be rounded up to {} mm, otherwise the slots would be cut. A larger edge gap or end caps help.',
  'Aufsteck-Modus: Alle Wände sind {} mm niedriger, damit die Aufsteck-Verbinder bündig sitzen.': 'Slip-on mode: all walls are {} mm lower so the slip-on connectors sit flush.',
  'Geht nicht – Verbinder würden sich überschneiden (mind. {} mm Wandabstand).': 'Not possible – connectors would overlap (at least {} mm between walls).',
  ' Weniger Fächer wählen.': ' Choose fewer compartments.',
  'Zu nah an der Nachbarwand oder am Rand – mindestens {} mm Abstand, sonst passen die Verbinder nicht.': 'Too close to the next wall or the edge – at least {} mm, otherwise the connectors do not fit.',
  'Zu nah an der Nachbarwand oder am Rand – mindestens {} mm Abstand.': 'Too close to the next wall or the edge – at least {} mm.',
  'Der Rahmen gehört zum Randmodus „Rahmen" – ändere links den Rand, um ihn zu entfernen.': 'The frame belongs to the "Frame" edge mode – change the edge on the left to remove it.',
  '3D-Vorschau braucht eine Internetverbindung (three.js).': 'The 3D preview needs an internet connection (three.js).',

  // assembly plan
  'direkt geklemmt': 'clamped directly', 'Schublade {} × {} × {} mm · Rand: {}': 'Drawer {} × {} × {} mm · edge: {}', ' · Aufsteck-Verbinder': ' · slip-on connectors',
  'Wände {} × {} mm': 'walls {} × {} mm', 'Teil': 'Part', 'Maß': 'Size', 'Anzahl': 'Qty', 'Wand {}': 'Wall {}', '{} mm hoch': '{} mm high', '40 mm breit': '40 mm wide',
  ' In jedes Wandende ist sein Buchstabe und seine Länge graviert.': ' Every wall end has its letter and length engraved.',
  'Raster-Schienen an die Schubladenseiten kleben oder schrauben – zusammengesetzte Schienen mit Zapfen in die Buchse stecken.': 'Glue or screw the grid rails to the drawer sides – for joined rails push the tongue into the socket.',
  'Mit dem Rahmen beginnen: Ecken, T-Stücke und die Außenwände zu einem Rechteck zusammenstecken.': 'Start with the frame: push corners, T pieces and the outer walls together into a rectangle.',
  'Geteilte lange Wände mit den geraden Verlängerungen verbinden.': 'Join split long walls with the straight joiners.',
  'Die durchgehenden Wände aufstellen, die kurzen Wände dazwischen stellen und dann die Verbinder von oben aufstecken.': 'Stand up the through walls, put the short walls in between and then push the connectors on from above.',
  'Innenwände nach dem Plan einsetzen – die Buchstaben im Plan zeigen, welche Wand wohin gehört. Von einer Seite zur anderen arbeiten, jeweils Wand in den Verbinder schieben.': 'Fit the inner walls following the plan – the letters show which wall goes where. Work from one side to the other, sliding each wall into its connector.',
  'Die Endstücke sitzen an der Schubladenwand – das Ganze am Stück in die Schublade setzen.': 'The end caps sit against the drawer wall – put the whole thing into the drawer in one piece.',
  'Das fertige Gitter in die Schublade setzen.': 'Put the finished grid into the drawer.',
  'Beschriftungsclips beschriften und oben auf die Wände der Fächer stecken.': 'Write on the label clips and push them onto the walls of the compartments.',

  // dialogs and messages
  'Abbrechen': 'Cancel', 'Anwenden': 'Apply', 'Schließen': 'Close', 'Spalten': 'Columns', 'Reihen': 'Rows',
  'Teilt die ganze Schublade nach einer Vorlage auf. Vorhandene Wände werden ersetzt – danach kannst du alles frei anpassen.': 'Splits the whole drawer from a template. Existing walls are replaced – afterwards you can change everything freely.',
  'Raster – gleich große Fächer': 'Grid – equal compartments', 'Besteck – 4 lange Fächer + 1 breites, geteilt': 'Cutlery – 4 long compartments + 1 wide, split',
  'Werkstatt – 1 großes Fach + 3 kleine': 'Workshop – 1 large compartment + 3 small', 'Gemischt – 2 große + 4 kleine Fächer': 'Mixed – 2 large + 4 small compartments',
  'Schreibtisch – schmal, breit, schmal': 'Desk – narrow, wide, narrow', 'Kleinteile – 4 × 4 kleine Fächer': 'Small parts – 4 × 4 small compartments',
  'Profile können in diesem Browser nicht gespeichert werden.': 'Profiles cannot be saved in this browser.', 'Profil nicht gefunden.': 'Profile not found.',
  'Profil speichern': 'Save profile', 'Name für das Profil, z.B. dein Drucker:': 'Name of the profile, e.g. your printer:', 'Mein Drucker': 'My printer',
  'Profil „{}“ gespeichert.': 'Profile "{}" saved.', 'Profil „{}“ löschen?': 'Delete profile "{}"?',
  'Alle Wände löschen?': 'Delete all walls?', 'Mit Strg+Z kannst du das rückgängig machen.': 'You can undo this with Ctrl+Z.',
  'Die Schublade ist für diese Vorlage zu klein – rot markierte Stellen anpassen.': 'The drawer is too small for this template – adjust the places marked red.',
  'Neues Projekt beginnen?': 'Start a new project?', 'Alle Wände werden entfernt. Schublade und Einstellungen bleiben.': 'All walls are removed. Drawer and settings stay.', 'Neu beginnen': 'Start over',
  'Datei konnte nicht gelesen werden': 'Could not read the file',
  'Link kopiert – er enthält das ganze Layout.': 'Link copied – it contains the whole layout.', 'Link zum Teilen': 'Link to share', 'Kopiere diesen Link:': 'Copy this link:',
  'Link konnte nicht gelesen werden': 'Could not read the link', 'Der Link ist unvollständig oder beschädigt.': 'The link is incomplete or damaged.',
  'Download nicht möglich': 'Download not possible', 'Speichere die Seite stattdessen mit Strg+S.': 'Save the page with Ctrl+S instead.',
  'Meine Schublade': 'My drawer', 'Schublade': 'Drawer', 'schublade': 'drawer',

  // STL dialog
  'STL-Dateien erzeugen': 'Make STL files',
  'OpenSCAD rechnet jede Druckplatte direkt im Browser aus der SCAD-Bibliothek. Beim ersten Mal wird OpenSCAD geladen (ca. 11 MB, Internet nötig).': 'OpenSCAD renders every print plate right in the browser from the SCAD library. The first time OpenSCAD is loaded (about 11 MB, internet needed).',
  '3MF herunterladen': 'Download 3MF', 'ZIP herunterladen': 'Download ZIP', 'Alle Platten in einer Datei für Bambu Studio, OrcaSlicer, PrusaSlicer': 'All plates in one file for Bambu Studio, OrcaSlicer, PrusaSlicer',
  'Noch keine Teile – zeichne zuerst Fächer in die Schublade.': 'No parts yet – draw compartments into the drawer first.',
  'wartet': 'waiting', 'Startet …': 'Starting …', 'wird gerechnet …': 'rendering …', 'Platte {} von {} …': 'Plate {} of {} …',
  'Fertig – {} STL-Dateien bereit.': 'Done – {} STL files ready.', 'Fertig – {} von {} Platten erzeugt.': 'Done – {} of {} plates made.',
  'OpenSCAD wird geladen …': 'Loading OpenSCAD …', 'OpenSCAD konnte nicht geladen werden: ': 'Could not load OpenSCAD: ', 'OpenSCAD hat keine STL erzeugt': 'OpenSCAD made no STL',
  'Worker-Fehler: ': 'Worker error: ', '3MF wird gebaut …': 'Building 3MF …', '3MF mit {} Platten gespeichert.': '3MF with {} plates saved.', '3MF fehlgeschlagen: ': '3MF failed: ',
  '_stueckliste': '_parts', '_druckjob': '_printjob', '_projekt': '_project', '_teile': '_parts',

  // CSV and print job
  'Kategorie': 'Category', 'Länge (mm)': 'Length (mm)', 'Höhe/Breite (mm)': 'Height/width (mm)', 'ca. Gramm je Stück': 'approx. grams each', 'Hinweis': 'Note',
  'Dicke {}': 'Thickness {}', 'Zahnversatz {}': 'Tooth offset {}', 'oben auf eine Wand stecken': 'push onto the top of a wall', 'Summe': 'Total',
  'Schublade {}×{}×{} mm': 'Drawer {}×{}×{} mm', ' (Platte {} von {})': ' (plate {} of {})', 'Toleranztest': 'Tolerance test',
  '// The Drawer Dividers – Druckjob "{}"': '// The Drawer Dividers – print job "{}"',
  '// Erstellt mit dem Drawer Divider Designer am {}': '// Made with the Drawer Divider Designer on {}',
  '// Schublade {} × {} × {} mm · {} Teile · ca. {} g': '// Drawer {} × {} × {} mm · {} parts · approx. {} g',
  '// So exportierst du die STLs:': '// How to export the STLs:',
  '//   In OpenSCAD: rechts im Customizer "Teil" wählen, F6 (Rendern), F7 (STL exportieren).': '//   In OpenSCAD: pick "PART" in the Customizer on the right, F6 (render), F7 (export STL).',
  '//   Oder direkt im Designer: "STLs erzeugen" rechnet alle Platten im Browser.': '//   Or right in the designer: "Make STLs" renders all plates in the browser.',
  '// Welche Druckplatte? (0 = Übersicht aller Teile)': '// Which print plate? (0 = overview of all parts)',
  '//  Bibliothek (scad/lib/drawer_divider.scad, eingebettet)': '//  Library (scad/lib/drawer_divider.scad, embedded)',
  '// Bibliothek nicht eingebettet – lege diese Datei neben drawer_divider.scad:': '// Library not embedded – put this file next to drawer_divider.scad:',
  // drawers, compartment names, plates, measuring
  ' (Kopie)': ' (copy)',
  ' · ca. {} g': ' · approx. {} g',
  'Alle Schubladen speichern': 'Save all drawers',
  'Alle Teile aller Schubladen zusammengezählt': 'All parts of all drawers added up',
  'Alle Teile drucken ({} Teile auf {} Druckplatten, ca. {} g, ca. {}).': 'Print all parts ({} parts on {} print plates, approx. {} g, approx. {}).',
  'Bits & Schrauben – 6 × 3 schmale Fächer': 'Bits & screws – 6 × 3 narrow compartments',
  'Der Name wird in den Beschriftungsclip des Fachs graviert.': 'The name is engraved into the label clip of this compartment.',
  'Die Beschriftungsclips oben auf die Wände ihrer Fächer stecken – unbenannte mit Stift beschriften.': 'Push the label clips onto the walls of their compartments – write on the unnamed ones with a pen.',
  'Die Schublade wird aus der Liste entfernt. Das lässt sich nicht rückgängig machen.': 'The drawer is removed from the list. This cannot be undone.',
  'Diese Schublade löschen': 'Delete this drawer',
  'Druckleistung': 'Print rate',
  'Druckplatten': 'Print plates',
  'Druckzeit ca.': 'Print time approx.',
  'Eine .json mit allen – „Öffnen“ lädt sie wieder': 'One .json with all of them – “Open” loads them again',
  'Entfernt sie aus der Liste': 'Removes it from the list',
  'Erscheint im Plan und auf dem Beschriftungsclip. Leer lassen entfernt den Namen.': 'Shows in the plan and on the label clip. Leave empty to remove the name.',
  'Etiketten-Liste (CSV)': 'Label list (CSV)',
  'Fach benennen': 'Name the compartment',
  'Fach {}': 'Compartment {}',
  'Fachnamen und Maße – in Open Label Studio unter Seriendruck laden': 'Compartment names and sizes – load in Open Label Studio under batch print',
  'Filamentpreis': 'Filament price',
  'Filamentpreis unter Erweitert': 'Filament price under Advanced',
  'Gemischt': 'Mixed',
  'Gemischt: alle Teile so dicht wie möglich, weniger Platten. Sortenrein: jede Platte nur eine Teilesorte.': 'Mixed: all parts as close as possible, fewer plates. One kind: each plate holds only one kind of part.',
  'Gesamt-Stückliste (CSV)': 'Combined parts list (CSV)',
  'Geteiltes Layout als neue Schublade geöffnet – deine anderen findest du unter „Schubladen“.': 'Shared layout opened as a new drawer – your others are under “Drawers”.',
  'Geteiltes Layout geladen.': 'Shared layout loaded.',
  'Grobe Druckleistung deines Druckers – ca. 10–15 g/h bei älteren, 25–40 g/h bei schnellen Druckern': 'Rough print rate of your printer – about 10–15 g/h for older, 25–40 g/h for fast printers',
  'Grobe Schätzung aus dem Gewicht – Druckleistung unter Erweitert': 'Rough estimate from the weight – print rate under Advanced',
  'Innenmaß': 'Inside size',
  'Keine Schublade in der Datei.': 'No drawer in the file.',
  'Kopie dieser Schublade zum Abwandeln': 'A copy of this drawer to change',
  'Küche – großes Mittelfach, kleine Fächer links und rechts': 'Kitchen – big middle compartment, small ones left and right',
  'Leer, mit den Einstellungen dieser Schublade': 'Empty, with the settings of this drawer',
  'Mehrere Schubladen in diesem Browser': 'Several drawers in this browser',
  'Messen': 'Measure',
  'Messen (M)': 'Measure (M)',
  'Mit „Beschriftungsclips“ (Erweitert) wird der Name in einen Clip graviert.': 'With “Label clips” (Advanced) the name is engraved into a clip.',
  'Name des Fachs': 'Compartment name',
  'Name eingraviert': 'Name engraved',
  'Neue Schublade': 'New drawer',
  'Noch keine Fächer – zeichne zuerst Wände in die Schublade.': 'No compartments yet – draw walls into the drawer first.',
  'Schublade duplizieren': 'Duplicate drawer',
  'Schubladen': 'Drawers',
  'So viele Druckplatten rechnet „STLs erzeugen“': 'This many print plates are rendered by “Make STLs”',
  'Sortenrein': 'One kind each',
  'Wand anklicken zum Auswählen, ziehen zum Verschieben. Fach anklicken (oder doppelklicken), um es zu benennen.': 'Click a wall to select it, drag to move it. Click (or double-click) a compartment to name it.',
  'Werkzeug – 3 lange Fächer + 5 kleine an der Seite': 'Tools – 3 long compartments + 5 small ones at the side',
  'Währung': 'Currency',
  'Ziehen, um einen Abstand zu messen. Rastet an Wänden und Raster ein, Shift = frei.': 'Drag to measure a distance. Snaps to walls and the grid, Shift = free.',
  '_etiketten': '_labels',
  'alle_schubladen': 'all_drawers',
  'g Filament · {} m': 'g filament · {} m',
  'z.B. Schrauben': 'e.g. screws',
  '{} Material ca.': '{} material approx.',
  '{} Schubladen': '{} drawers',
  '{} Schubladen geöffnet – umschalten unter „Schubladen“.': '{} drawers opened – switch under “Drawers”.',
  '„{}“ löschen?': 'Delete “{}”?',
  '€ Material ca.': '€ material approx.',
};

function T(strs, ...vals) {
  if (typeof strs === 'string') return LANG === 'en' && EN[strs] !== undefined ? EN[strs] : strs;
  const key = strs.join('{}'), tpl = LANG === 'en' && EN[key] !== undefined ? EN[key] : key;
  let i = 0;
  return tpl.replace(/\{\}/g, () => vals[i++]);
}

function translateDom(root = document.body) {
  document.documentElement.lang = LANG;
  if (LANG === 'de') return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    if (n.parentElement.closest('script, style')) continue;
    const key = n.textContent.replace(/\s+/g, ' ').trim();
    if (key && EN[key] !== undefined) n.textContent = n.textContent.replace(/\S[\s\S]*\S|\S/, EN[key]);
  }
  for (const el of root.querySelectorAll('[title], [placeholder]'))
    for (const a of ['title', 'placeholder']) { const v = el.getAttribute(a); if (v && EN[v.trim()] !== undefined) el.setAttribute(a, EN[v.trim()]); }
}
