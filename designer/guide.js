// =============================================================================
//  Built-in guide: every feature, where to find it and how to use it.
//  Each entry: [icon, DE title, DE where, DE text, EN title, EN where, EN text].
//  Bilingual here instead of i18n.js, because the texts are long and only
//  shown in this dialog.
// =============================================================================

const GUIDE = [
  { de: 'Los geht\'s', en: 'Getting started', items: [
    ['📐', 'Schublade ausmessen', 'Links → Schublade (Innenmaß)',
      'Innenbreite, -tiefe und -höhe der Schublade eintragen. Hat die Schublade innen runde Ecken, den <b>Eckradius</b> eintragen – die Rahmenecken werden dann passend abgerundet.',
      'Measure the drawer', 'Left → Drawer (inside)',
      'Enter the inside width, depth and height. If the drawer has rounded inside corners, enter the <b>corner radius</b> – the frame corners are rounded to match.'],
    ['🗂️', 'Mit einer Vorlage starten', 'Werkzeugleiste → Vorlage',
      'Fertige Aufteilungen: Raster (N × M), Besteck, Werkstatt, Gemischt, Schreibtisch, Kleinteile, Werkzeug, Bits & Schrauben, Küche. Danach kannst du alles weiter anpassen.',
      'Start from a template', 'Toolbar → Template',
      'Ready layouts: grid (N × M), cutlery, workshop, mixed, desk, small parts, tools, bits & screws, kitchen. You can change everything afterwards.'],
    ['🧱', 'Randart wählen', 'Links → Am Schubladenrand',
      '<b>Rahmen</b>: Außenwände mit Ecken, steht für sich und lässt sich herausnehmen. <b>Endstücke</b>: Wände enden mit einem Endstück an der Schubladenwand. <b>Raster-Schienen</b>: Zahnschienen an den Seiten, die Wände rasten ein. <b>Direkt klemmen</b>: Wände laufen bis zur Schubladenwand.',
      'Choose the edge type', 'Left → At the drawer edge',
      '<b>Frame</b>: outer walls with corners, stands on its own and lifts out. <b>End caps</b>: walls end with an end piece at the drawer wall. <b>Grid rails</b>: toothed rails on the sides, walls snap in. <b>Clamp directly</b>: walls run right up to the drawer wall.'],
    ['📌', 'Aufsteck-Verbinder', 'Links → Am Schubladenrand → Aufsteck-Verbinder',
      'Lange Wände laufen über die Kreuzungen durch, die Verbinder werden von oben aufgesteckt. Weniger, längere Wände – die Wände sind dafür 2 mm niedriger.',
      'Slip-on connectors', 'Left → At the drawer edge → Slip-on connectors',
      'Long walls run straight through the crossings, the connectors are pushed on from above. Fewer, longer walls – the walls are 2 mm lower for it.'],
  ]},
  { de: 'Zeichnen', en: 'Drawing', items: [
    ['✏️', 'Wände zeichnen', 'Werkzeugleiste → Zeichnen (W)',
      'Mit gedrückter Maustaste eine Wand ziehen. Sie rastet an Rand, Raster und anderen Wänden ein. Wände, die fast auf einer Linie liegen, werden zusammengezogen.',
      'Draw walls', 'Toolbar → Draw (W)',
      'Hold the mouse button and drag a wall. It snaps to the edge, the grid and other walls. Walls that are almost in line are pulled onto one line.'],
    ['➗', 'Fach teilen', 'Werkzeugleiste → Teilen (S)',
      'Oben in der Leiste <b>2–6</b> wählen und in ein Fach klicken – es wird in gleich große Teile geteilt. <b>frei</b> setzt eine Wand dort, wo du klickst. Richtung mit │ / ─ oder <kbd>Shift</kbd> wechseln.',
      'Split a compartment', 'Toolbar → Split (S)',
      'Pick <b>2–6</b> in the bar above and click into a compartment – it is split into equal parts. <b>free</b> puts a wall where you click. Change direction with │ / ─ or <kbd>Shift</kbd>.'],
    ['👆', 'Auswählen & verschieben', 'Werkzeugleiste → Auswählen (V)',
      'Wand anklicken und ziehen zum Verschieben. Mit <kbd>Shift</kbd>+Klick mehrere Wände wählen. <kbd>Entf</kbd> löscht die Auswahl.',
      'Select & move', 'Toolbar → Select (V)',
      'Click a wall and drag to move it. <kbd>Shift</kbd>+click selects several walls. <kbd>Del</kbd> deletes the selection.'],
    ['🧽', 'Radieren', 'Werkzeugleiste → Radieren (E)',
      'Klick auf ein Wandstück entfernt genau dieses Stück zwischen zwei Kreuzungen.',
      'Erase', 'Toolbar → Erase (E)',
      'Clicking a wall piece removes exactly that piece between two crossings.'],
    ['📏', 'Messen', 'Werkzeugleiste → Messen (M)',
      'Von einem Punkt zum anderen ziehen – der Abstand wird angezeigt. Rastet an Wänden und Raster ein.',
      'Measure', 'Toolbar → Measure (M)',
      'Drag from one point to another – the distance is shown. Snaps to walls and the grid.'],
    ['↩️', 'Rückgängig / Wiederholen', 'Werkzeugleiste → Pfeile',
      '<kbd>Strg</kbd>+<kbd>Z</kbd> macht den letzten Schritt rückgängig, <kbd>Strg</kbd>+<kbd>Y</kbd> stellt ihn wieder her.',
      'Undo / redo', 'Toolbar → arrows',
      '<kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes the last step, <kbd>Ctrl</kbd>+<kbd>Y</kbd> redoes it.'],
    ['🔄', 'Spiegeln & drehen', 'Werkzeugleiste → Spiegeln-Symbol',
      'Links ↔ rechts oder vorne ↔ hinten spiegeln – z. B. für die Schublade auf der anderen Seite. <b>Um 90° drehen</b> tauscht Breite und Tiefe.',
      'Mirror & rotate', 'Toolbar → mirror icon',
      'Mirror left ↔ right or front ↔ back – e.g. for the drawer on the other side. <b>Rotate 90°</b> swaps width and depth.'],
    ['🗑️', 'Alle Wände löschen', 'Werkzeugleiste → Mülleimer',
      'Entfernt alle Wände, die Einstellungen bleiben.',
      'Delete all walls', 'Toolbar → bin',
      'Removes all walls, the settings stay.'],
    ['🔍', 'Ansicht', 'Zeichenfläche',
      'Mausrad = Zoom. Rechte oder mittlere Maustaste (oder <kbd>Leertaste</kbd> + ziehen) = verschieben. <b>Einpassen</b> (<kbd>F</kbd>) zeigt die ganze Schublade. Am Handy mit zwei Fingern zoomen und verschieben.',
      'View', 'Drawing area',
      'Mouse wheel = zoom. Right or middle mouse button (or <kbd>Space</kbd> + drag) = pan. <b>Fit</b> (<kbd>F</kbd>) shows the whole drawer. On a phone, zoom and pan with two fingers.'],
  ]},
  { de: 'Genau planen', en: 'Planning precisely', items: [
    ['🔢', 'Maße eintippen', 'Auswählen (V) → Wand oder Fach anklicken → rechts „Auswahl“',
      'Bei einer Wand die <b>Position</b> eintippen, bei einem Fach <b>Breite innen</b> und <b>Tiefe innen</b> – die Nachbarwand rückt nach.',
      'Type exact sizes', 'Select (V) → click a wall or compartment → right “Selection”',
      'For a wall type its <b>position</b>, for a compartment its <b>inner width</b> and <b>inner depth</b> – the neighbouring wall moves along.'],
    ['↔️', 'Gleich verteilen', 'Auswählen (V) → mehrere parallele Wände mit Shift+Klick → „Gleich verteilen“',
      'Verteilt die gewählten Wände so, dass alle Fächer dazwischen gleich groß werden.',
      'Space evenly', 'Select (V) → several parallel walls with Shift+click → “Space evenly”',
      'Spaces the selected walls so all compartments between them get the same size.'],
    ['🪜', 'Niedrigere Wände', 'Auswählen (V) → Wand anklicken → rechts „Auswahl“ → Wandhöhe',
      'Einzelne Wände niedriger machen, z. B. vorne zum besseren Hineingreifen. Leer = volle Höhe. Geht auch für mehrere Wände auf einmal. Niedrige Wände sind in der Zeichnung heller. Nicht mit Aufsteck-Verbindern.',
      'Lower walls', 'Select (V) → click a wall → right “Selection” → Wall height',
      'Make single walls lower, e.g. at the front to reach in more easily. Empty = full height. Works for several walls at once. Low walls are lighter in the drawing. Not with slip-on connectors.'],
    ['✂️', 'Gegenstände einplanen', 'Werkzeugleiste → Gegenstand (G)',
      'Schere, Zollstock, Besteck … als Umriss in die Schublade legen und die Fächer drumherum zeichnen. Ziehen zum Verschieben, anklicken für Maße und Drehen. Wird nicht gedruckt.',
      'Plan around items', 'Toolbar → Item (G)',
      'Put scissors, a folding rule, cutlery … in as an outline and draw the compartments around them. Drag to move, click for size and rotate. Not printed.'],
    ['📷', 'Foto als Vorlage', 'Werkzeugleiste → Kamera-Symbol',
      'Foto der Schublade von oben laden und die vier Innenecken anklicken. Das Bild wird gerade gerückt und zum Nachzeichnen hinterlegt.',
      'Photo as template', 'Toolbar → camera icon',
      'Load a photo of the drawer taken from above and click the four inner corners. The photo is straightened and placed underneath for tracing.'],
    ['🛡️', 'Prüfungen', 'Rechts → Hinweise',
      'Zu enge Fächer, sich überschneidende Verbinder, zu hohe Trenner, zu lange Teile fürs Druckbett: alles wird rot markiert und hier erklärt. „Alles passt.“ heißt: fertig zum Drucken.',
      'Checks', 'Right → Notes',
      'Too tight compartments, overlapping connectors, dividers too high, parts too long for the bed: everything is marked red and explained here. “All good.” means ready to print.'],
  ]},
  { de: 'Wände & Beschriftung', en: 'Walls & labels', items: [
    ['📏', 'Wanddicke, Toleranz, Höhe', 'Links → Trenner',
      '<b>Wanddicke</b> = tatsächlich gedruckte Dicke. <b>Toleranz</b> = Spiel im Schlitz (vorher den Toleranztest drucken). <b>Höhe automatisch</b> nimmt die Schubladenhöhe minus 5 mm.',
      'Wall thickness, tolerance, height', 'Left → Dividers',
      '<b>Wall thickness</b> = the thickness actually printed. <b>Tolerance</b> = play in the slot (print the tolerance test first). <b>Automatic height</b> takes the drawer height minus 5 mm.'],
    ['🐝', 'Wandmuster', 'Links → Trenner → Wand-Muster',
      'Waben, Kreise oder keins. Spart Filament und ist in der 3D-Vorschau zu sehen.',
      'Wall patterns', 'Left → Dividers → Wall pattern',
      'Honeycomb, circles or none. Saves filament and shows in the 3D preview.'],
    ['🏷️', 'Fachnamen', 'Auswählen (V) → Fach anklicken → rechts „Auswahl“ → Name des Fachs',
      'Oder einfach doppelt in ein Fach klicken. Der Name steht im Plan, im Aufbauplan und auf dem Beschriftungsclip.',
      'Compartment names', 'Select (V) → click a compartment → right “Selection” → Compartment name',
      'Or simply double-click a compartment. The name shows in the drawing, the assembly plan and on the label clip.'],
    ['🔖', 'Beschriftungsclips', 'Links → Trenner → Beschriftungsclips',
      'Ein Clip pro Fach zum Aufstecken auf die Wand. Hat das Fach einen Namen, wird er in die schräge Fläche graviert – sonst mit Stift beschriften oder ein Etikett aufkleben.',
      'Label clips', 'Left → Dividers → Label clips',
      'One clip per compartment to push onto the wall. If the compartment has a name, it is engraved into the slanted face – otherwise write on it or stick on a label.'],
    ['🖨️', 'Etiketten drucken', 'Export → Etiketten-Liste (CSV)',
      'Fachnamen und Maße als Liste – in <a href="https://github.com/Barry2040/open-label-studio" target="_blank" rel="noopener">Open Label Studio</a> unter Seriendruck laden und mit dem Labeldrucker drucken.',
      'Print labels', 'Export → Label list (CSV)',
      'Compartment names and sizes as a list – load it in <a href="https://github.com/Barry2040/open-label-studio" target="_blank" rel="noopener">Open Label Studio</a> under mail merge and print with a label printer.'],
    ['🔤', 'Wandbuchstaben', 'Links → Trenner → Wände beschriften',
      'Jede Wandlänge bekommt einen Buchstaben (A = längste). Buchstabe und Länge werden ins Wandende graviert, das im Verbinder verschwindet – so weißt du beim Aufbau, welche Wand wohin gehört.',
      'Wall letters', 'Left → Dividers → Label walls',
      'Every wall length gets a letter (A = longest). Letter and length are engraved into the wall end that disappears in the connector – so you know where each wall goes.'],
  ]},
  { de: 'Prüfen & drucken', en: 'Check & print', items: [
    ['🧊', '3D-Vorschau', 'Werkzeugleiste rechts → 3D',
      'Der ganze Zusammenbau in 3D mit Mustern. Mit der Maus drehen und zoomen. Nochmal klicken für zurück zur Zeichnung.',
      '3D preview', 'Toolbar right → 3D',
      'The whole assembly in 3D with patterns. Rotate and zoom with the mouse. Click again to go back to the drawing.'],
    ['🧮', 'Übersicht & Stückliste', 'Rechts → Übersicht / Stückliste',
      'Teile, Fächer, Druckplatten, Filament, Kosten und Druckzeit auf einen Blick. Darunter jedes Teil mit Maß und Anzahl.',
      'Overview & parts list', 'Right → Overview / Parts list',
      'Parts, compartments, print plates, filament, cost and print time at a glance. Below: every part with size and count.'],
    ['💶', 'Kosten & Druckzeit einstellen', 'Links → Erweitert → Filamentpreis, Währung, Druckleistung',
      'Preis pro kg und die grobe Druckleistung deines Druckers (g/h) eintragen, dann stimmen Kosten und Zeit besser.',
      'Set cost & print time', 'Left → Advanced → Filament price, Currency, Print rate',
      'Enter the price per kg and your printer\'s rough print rate (g/h) for better cost and time estimates.'],
    ['🖨️', 'STLs erzeugen', 'Oben → STLs erzeugen',
      'OpenSCAD rechnet jede Druckplatte direkt im Browser. Danach als <b>3MF</b> (Bambu Studio, OrcaSlicer, PrusaSlicer) oder <b>ZIP</b> mit STLs herunterladen. Beim ersten Mal wird OpenSCAD geladen (Internet nötig).',
      'Make STLs', 'Top → Make STLs',
      'OpenSCAD renders every print plate right in the browser. Then download as <b>3MF</b> (Bambu Studio, OrcaSlicer, PrusaSlicer) or <b>ZIP</b> with STLs. The first time OpenSCAD is loaded (internet needed).'],
    ['📦', 'Druckbett & Platten', 'Links → Erweitert → Druckbett, Druckplatten, Ausrichtung',
      '<b>Druckbett</b>: Größe deiner Platte. <b>Gemischt</b> packt alle Teile dicht (weniger Platten), <b>Sortenrein</b> eine Teilesorte pro Platte. <b>Ausrichtung</b>: Wände stehend (schneller) oder liegend (stabiler).',
      'Print bed & plates', 'Left → Advanced → Print bed, Print plates, Orientation',
      '<b>Print bed</b>: size of your plate. <b>Mixed</b> packs all parts tightly (fewer plates), <b>Sorted</b> one part type per plate. <b>Orientation</b>: walls standing (faster) or lying flat (stronger).'],
    ['✅', 'Druck-Checkliste', 'Rechts → Druck-Checkliste',
      'Erscheint, sobald es Druckplatten gibt. Platten abhaken – praktisch, wenn der Druck über mehrere Tage geht.',
      'Print checklist', 'Right → Print checklist',
      'Shows up as soon as there are print plates. Tick off the plates – handy when printing over several days.'],
    ['📋', 'Aufbauplan', 'Rechts → Aufbauplan · Export → Aufbauplan drucken / PDF',
      'Zeichnung mit Wandbuchstaben, Teileliste und Aufbauschritten – zum Ausdrucken oder als PDF.',
      'Assembly plan', 'Right → Assembly plan · Export → Print assembly plan / PDF',
      'Drawing with wall letters, parts list and assembly steps – to print or save as PDF.'],
    ['🔥', 'Laserdateien', 'Export → Laserdateien (SVG)',
      'Wände aus Holz oder Acryl lasern: alle Wände mit Muster und Griffmulde auf Platten deiner Größe. Rot = schneiden, blau = gravieren. Für Bambu Studio (Laser), LightBurn, xTool. Wandstärke = Plattenstärke, die Verbinder werden gedruckt.',
      'Laser files', 'Export → Laser files (SVG)',
      'Laser walls from wood or acrylic: every wall with pattern and finger notch on sheets of your size. Red = cut, blue = engrave. For Bambu Studio (laser), LightBurn, xTool. Wall thickness = sheet thickness, the connectors get printed.'],
    ['🧩', 'OpenSCAD-Druckjob', 'Export → OpenSCAD-Druckjob',
      'Alle Teile in einer .scad-Datei – in OpenSCAD ein Teil wählen und als STL exportieren.',
      'OpenSCAD print job', 'Export → OpenSCAD print job',
      'All parts in one .scad file – pick a part in OpenSCAD and export it as STL.'],
    ['📊', 'Stückliste als Tabelle', 'Export → Stückliste (CSV)',
      'Für Excel oder andere Tabellen.',
      'Parts list as table', 'Export → Parts list (CSV)',
      'For Excel or other spreadsheets.'],
  ]},
  { de: 'Speichern & teilen', en: 'Save & share', items: [
    ['💾', 'Speichern & öffnen', 'Oben → Speichern / Öffnen / Neu',
      'Der Designer speichert automatisch im Browser. <b>Speichern</b> sichert das Projekt als .json-Datei, <b>Öffnen</b> lädt sie wieder, <b>Neu</b> beginnt eine leere Schublade.',
      'Save & open', 'Top → Save / Open / New',
      'The designer saves automatically in the browser. <b>Save</b> keeps the project as a .json file, <b>Open</b> loads it again, <b>New</b> starts an empty drawer.'],
    ['🗄️', 'Mehrere Schubladen', 'Oben → Schubladen',
      'Neue Schublade anlegen, duplizieren, löschen und umschalten. Mit <b>Gesamt-Stückliste</b> alle Teile aller Schubladen zusammengezählt.',
      'Many drawers', 'Top → Drawers',
      'Add, duplicate, delete and switch drawers. <b>Total parts list</b> adds up all parts of all drawers.'],
    ['⚙️', 'Profile', 'Links → Mein Profil',
      'Toleranz, Druckbett und Co. unter einem Namen speichern, z. B. für deinen Drucker, und bei der nächsten Schublade wieder laden.',
      'Profiles', 'Left → My profile',
      'Save tolerance, print bed & co. under a name, e.g. for your printer, and load them for the next drawer.'],
    ['🔗', 'Link teilen', 'Export → Link teilen',
      'Das ganze Layout steckt im Link – zum Verschicken oder für einen Kommentar auf MakerWorld.',
      'Share link', 'Export → Share link',
      'The whole layout lives in the link – to send it or for a comment on MakerWorld.'],
    ['📴', 'Offline & App', 'Export → Als App installieren / Offline-Version herunterladen',
      'Als App installieren (startet auch ohne Internet) oder den ganzen Designer als eine HTML-Datei herunterladen.',
      'Offline & app', 'Export → Install as app / Download offline version',
      'Install as an app (starts without internet too) or download the whole designer as one HTML file.'],
    ['🌐', 'Sprache', 'Oben → EN / DE',
      'Zwischen Deutsch und Englisch umschalten.',
      'Language', 'Top → EN / DE',
      'Switch between German and English.'],
    ['♻️', 'Zurücksetzen', 'Oben → Zurücksetzen · Links → Erweitert → Alles auf Standard zurücksetzen',
      '<b>Zurücksetzen</b> oben löscht alle Schubladen, Profile und Fotos im Browser – nur die Sprache bleibt. Unter <b>Erweitert</b> werden nur die Einstellungen auf Standard gesetzt.',
      'Reset', 'Top → Reset · Left → Advanced → Reset everything to default',
      '<b>Reset</b> at the top deletes all drawers, profiles and photos in the browser – only the language stays. Under <b>Advanced</b> only the settings go back to default.'],
  ]},
  { de: 'Tastenkürzel', en: 'Shortcuts', keys: [
    ['W', 'Zeichnen', 'Draw'], ['S', 'Teilen', 'Split'], ['V', 'Auswählen', 'Select'], ['E', 'Radieren', 'Erase'],
    ['M', 'Messen', 'Measure'], ['G', 'Gegenstand', 'Item'], ['F', 'Einpassen', 'Fit'],
    ['Strg+Z / Strg+Y', 'Rückgängig / Wiederholen', 'Undo / redo'], ['Shift', 'Richtung wechseln · mehrere wählen', 'Change direction · select several'],
    ['Entf', 'Auswahl löschen', 'Delete selection'], ['Esc', 'Abbrechen', 'Cancel'], ['Leertaste + ziehen', 'Verschieben', 'Pan'],
  ]},
];

function drawGuide(q = '') {
  const en = LANG === 'en', words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const strip = s => s.replace(/<[^>]+>/g, '');
  const hit = (...t) => { const s = strip(t.join(' ')).toLowerCase(); return words.every(w => s.includes(w)); };
  let toc = '', body = '';
  GUIDE.forEach((sec, si) => {
    const title = en ? sec.en : sec.de;
    let h = '';
    if (sec.keys) {
      const rows = sec.keys.filter(k => hit(k[0], en ? k[2] : k[1]));
      if (rows.length) h = '<table class="gd-keys">' + rows.map(k => `<tr><td><kbd>${en ? k[0].replace('Strg', 'Ctrl').replace('Entf', 'Del').replace('Leertaste + ziehen', 'Space + drag') : k[0]}</kbd></td><td>${en ? k[2] : k[1]}</td></tr>`).join('') + '</table>';
    } else {
      for (const [ic, dt, dw, dx, et, ew, ex] of sec.items) {
        const [t, w, x] = en ? [et, ew, ex] : [dt, dw, dx];
        if (hit(t, w, x)) h += `<div class="gd-item"><div class="gd-ic">${ic}</div><div><b>${t}</b><div class="gd-where">${w}</div><p>${x}</p></div></div>`;
      }
    }
    if (!h) return;
    toc += `<button data-gd="${si}">${title}</button>`;
    body += `<h4 id="gd${si}">${title}</h4>${h}`;
  });
  $('#gdToc').innerHTML = toc;
  $('#gdBody').innerHTML = body || `<p class="hint">${T('Nichts gefunden.')}</p>`;
}

function openGuide() {
  $('#gdSearch').value = '';
  drawGuide();
  $('#helpDlg').showModal();
  $('#gdBody').scrollTop = 0;
}

$('#btnHelp').addEventListener('click', openGuide);
$('#gdSearch').addEventListener('input', e => drawGuide(e.target.value));
$('#gdToc').addEventListener('click', e => {
  const b = e.target.closest('[data-gd]');
  if (b) $('#gd' + b.dataset.gd).scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#gdClose').addEventListener('click', () => $('#helpDlg').close());
