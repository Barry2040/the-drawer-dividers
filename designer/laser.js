// Drawer Divider Designer – laser files for walls cut from wood or acrylic.
// Every wall of the parts list becomes an outline (cut, red) with the same pattern and
// finger grip as the printed wall; letter and length are scored (blue) as single-stroke
// lines, so any laser software reads them without fonts. The connectors stay printed.
'use strict';

// single-stroke font on a 4 × 6 grid (baseline 0, cap height 6); "|" separates strokes
const STROKE_FONT = {
  A: '0,0 2,6 4,0|0.7,2 3.3,2', B: '0,0 0,6 3,6 4,5 4,4 3,3 0,3|3,3 4,2 4,1 3,0 0,0', C: '4,5 3,6 1,6 0,5 0,1 1,0 3,0 4,1',
  D: '0,0 0,6 2.5,6 4,4.5 4,1.5 2.5,0 0,0', E: '4,6 0,6 0,0 4,0|0,3 3,3', F: '4,6 0,6 0,0|0,3 3,3',
  G: '4,5 3,6 1,6 0,5 0,1 1,0 3,0 4,1 4,3 2,3', H: '0,0 0,6|4,0 4,6|0,3 4,3', I: '1,6 3,6|2,6 2,0|1,0 3,0',
  J: '4,6 4,1 3,0 1,0 0,1', K: '0,0 0,6|4,6 0,2|1.3,3.3 4,0', L: '0,6 0,0 4,0', M: '0,0 0,6 2,3 4,6 4,0',
  N: '0,0 0,6 4,0 4,6', O: '1,0 0,1 0,5 1,6 3,6 4,5 4,1 3,0 1,0', P: '0,0 0,6 3,6 4,5 4,4 3,3 0,3',
  Q: '1,0 0,1 0,5 1,6 3,6 4,5 4,1 3,0 1,0|2.5,1.5 4,0', R: '0,0 0,6 3,6 4,5 4,4 3,3 0,3|2,3 4,0',
  S: '4,5 3,6 1,6 0,5 0,4 1,3 3,3 4,2 4,1 3,0 1,0 0,1', T: '0,6 4,6|2,6 2,0', U: '0,6 0,1 1,0 3,0 4,1 4,6',
  V: '0,6 2,0 4,6', W: '0,6 1,0 2,3 3,0 4,6', X: '0,0 4,6|0,6 4,0', Y: '0,6 2,3 4,6|2,3 2,0', Z: '0,6 4,6 0,0 4,0',
  0: '1,0 0,1 0,5 1,6 3,6 4,5 4,1 3,0 1,0', 1: '1,5 2,6 2,0|1,0 3,0', 2: '0,5 1,6 3,6 4,5 4,4 0,0 4,0',
  3: '0,5 1,6 3,6 4,5 4,4 3,3 1.5,3|3,3 4,2 4,1 3,0 1,0 0,1', 4: '3,0 3,6 0,2 4,2',
  5: '4,6 0,6 0,3.5 3,3.5 4,2.5 4,1 3,0 1,0 0,1', 6: '4,5 3,6 1,6 0,5 0,1 1,0 3,0 4,1 4,2 3,3 0,3',
  7: '0,6 4,6 1.5,0', 8: '1,3 0,4 0,5 1,6 3,6 4,5 4,4 3,3 1,3 0,2 0,1 1,0 3,0 4,1 4,2 3,3',
  9: '0,1 1,0 3,0 4,1 4,5 3,6 1,6 0,5 0,4 1,3 4,3', '.': '1.6,0 2.4,0 2.4,0.8 1.6,0.8 1.6,0',
};
const STROKE_ADV = 4.5;   // advance per character, as wide as OpenSCAD's text() in dd_wall_labels

// text centred on (cx, cy), cap height s; up = running upwards (rotated 90°). SVG y points down.
function strokeText(txt, cx, cy, s, up) {
  const k = s / 6, chars = [...String(txt).toUpperCase()].filter(c => STROKE_FONT[c]);
  const w = (chars.length * STROKE_ADV - 0.5) * k, out = [];
  chars.forEach((c, i) => {
    for (const stroke of STROKE_FONT[c].split('|')) {
      const pts = stroke.trim().split(/\s+/).map(p => {
        const [x, y] = p.split(',').map(Number);
        const u = -w / 2 + (i * STROKE_ADV + x) * k, v = (y - 3) * k;   // along the text, up from its middle
        return up ? [cx - v, cy - u] : [cx + u, cy - v];
      });
      out.push('M' + pts.map(([x, y]) => `${r3(x)} ${r3(y)}`).join(' L'));
    }
  });
  return out.join(' ');
}
const r3 = v => Math.round(v * 1000) / 1000;

// One wall as SVG path data, its top left corner at (x, y): {cut, score}. kerf grows the
// outline and shrinks the holes by half the beam width, so the parts come out at size.
function laserWall(w, x, y, o) {
  const p = S.profile, st = S.settings, L = w.len, H = w.h, k = o.kerf / 2;
  const cut = [], grip = st.grip > 0 ? Math.min(st.grip, H / 2, L / 2) - k : 0;
  const x0 = x - k, x1 = x + L + k, y0 = y - k, y1 = y + H + k, cx = x + L / 2;
  // outline clockwise, the finger grip as a half circle cut into the top edge
  cut.push(grip > 0
    ? `M${r3(x0)} ${r3(y0)} L${r3(cx - grip)} ${r3(y0)} A${r3(grip)} ${r3(grip)} 0 0 0 ${r3(cx + grip)} ${r3(y0)} L${r3(x1)} ${r3(y0)} L${r3(x1)} ${r3(y1)} L${r3(x0)} ${r3(y1)} Z`
    : `M${r3(x0)} ${r3(y0)} L${r3(x1)} ${r3(y0)} L${r3(x1)} ${r3(y1)} L${r3(x0)} ${r3(y1)} Z`);
  if (o.pattern) {
    const { hex, cell, pts } = wallHoles(L, H, S), r = cell - k;
    for (const [u, z] of pts) {
      const hx = cx + u, hy = y + H - z;
      if (hex) cut.push('M' + [0, 1, 2, 3, 4, 5].map(i => `${r3(hx + r * Math.cos(i * Math.PI / 3))} ${r3(hy + r * Math.sin(i * Math.PI / 3))}`).join(' L') + ' Z');
      else cut.push(`M${r3(hx - r)} ${r3(hy)} A${r3(r)} ${r3(r)} 0 1 0 ${r3(hx + r)} ${r3(hy)} A${r3(r)} ${r3(r)} 0 1 0 ${r3(hx - r)} ${r3(hy)} Z`);
    }
  }
  // letter and length on the ends that disappear in the connectors, sized like dd_wall_labels
  const score = [];
  if (o.engrave) {
    const lw = p.insert - p.end_gap, both = L >= 2 * lw + 2, len = num(w.len);
    const s1 = Math.min(7, (both ? lw : L) - 4, H / 3);
    if (s1 >= 2) score.push(strokeText(w.id, both ? x + L - lw / 2 : cx, y + H / 2, s1, false));
    const s2 = Math.min(4, lw - 4, (H - 8) / (0.75 * len.length + 1));
    if (both && s2 >= 2) score.push(strokeText(len, x + lw / 2, y + H / 2, s2, true));
  }
  return { cut: cut.join(' '), score: score.join(' ') };
}

// Shelf packing onto sheets of W × H with a margin at the edge; parts too large for the sheet are reported.
function laserSheets(o) {
  const m = o.margin, gap = o.gap, items = [], tooBig = [];
  for (const w of A.bom.walls) for (let i = 0; i < w.qty; i++) {
    if (w.len <= o.w - 2 * m && w.h <= o.h - 2 * m) items.push(w); else if (i === 0) tooBig.push(w);
  }
  items.sort((a, b) => b.h - a.h || b.len - a.len);
  const sheets = [];
  for (const w of items) {
    let placed = false;
    for (const sh of sheets) {
      const row = sh.rows.find(r => w.h <= r.h + EPS && r.x + w.len <= o.w - m + EPS);
      if (row) { sh.parts.push({ w, x: row.x, y: row.y }); row.x += w.len + gap; placed = true; break; }
      if (sh.y + w.h <= o.h - m + EPS && m + w.len <= o.w - m + EPS) {
        sh.rows.push({ y: sh.y, h: w.h, x: m + w.len + gap }); sh.parts.push({ w, x: m, y: sh.y }); sh.y += w.h + gap; placed = true; break;
      }
    }
    if (!placed) sheets.push({ rows: [{ y: m, h: w.h, x: m + w.len + gap }], parts: [{ w, x: m, y: m }], y: m + w.h + gap });
  }
  return { sheets, tooBig };
}

function laserSvg(sheet, o, n, total) {
  const cut = [], score = [];
  for (const pt of sheet.parts) { const r = laserWall(pt.w, pt.x, pt.y, o); cut.push(r.cut); if (r.score) score.push(r.score); }
  const count = new Map();
  for (const pt of sheet.parts) count.set(pt.w.id, (count.get(pt.w.id) || 0) + 1);
  const what = [...count].map(([id, q]) => `${q}x ${T('Wand')} ${id}`).join(', ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${esc(S.name)} – ${T('Laserplatte')} ${n}/${total}: ${esc(what)}. ${T('Rot = schneiden, blau = gravieren/ritzen. Plattenstärke')} ${num(S.profile.wall_t)} mm. -->
<svg xmlns="http://www.w3.org/2000/svg" width="${num(o.w)}mm" height="${num(o.h)}mm" viewBox="0 0 ${num(o.w)} ${num(o.h)}">
  <g id="score" fill="none" stroke="#0000ff" stroke-width="0.1" stroke-linecap="round" stroke-linejoin="round">${score.length ? `\n    <path d="${score.join(' ')}"/>` : ''}
  </g>
  <g id="cut" fill="none" stroke="#ff0000" stroke-width="0.1">
    <path d="${cut.join(' ')}"/>
  </g>
</svg>
`;
}

// ---- dialog ------------------------------------------------------------------------
const laser = { sheets: [], opts: null };
function laserOpts() {
  const st = S.settings;
  return { w: st.laserW, h: st.laserH, kerf: st.laserKerf, gap: st.laserGap, margin: 5,
           pattern: st.laserPattern && st.pattern !== 'none', engrave: st.laserEngrave };
}
function drawLaser() {
  const o = laser.opts = laserOpts(), { sheets, tooBig } = laserSheets(o);
  laser.sheets = sheets;
  const t = S.profile.wall_t;
  $('#lzThick').innerHTML = T`Plattenstärke = Wandstärke: <b>${fmt(t)} mm</b>.` + ' ' +
    (t < 2.5 ? T('Holz gibt es meist ab 3 mm – stell unter „Trenner“ die Wandstärke auf deine Plattenstärke, dann passen auch die gedruckten Verbinder.')
             : T('Die Verbinder druckst du wie gewohnt – sie passen zu dieser Wandstärke.'));
  const warn = [];
  if (!A.bom.walls.length) warn.push(T('Noch keine Wände – zeichne zuerst Fächer in die Schublade.'));
  if (tooBig.length) warn.push(T`Zu groß für die Platte: ${tooBig.map(w => T('Wand') + ' ' + w.id + ' (' + num(w.len) + ' mm)').join(', ')}. Größere Platte eintragen oder unter „Erweitert“ die maximale Wandlänge verkleinern.`);
  $('#lzWarn').innerHTML = warn.map(esc).join('<br>'); $('#lzWarn').hidden = !warn.length;
  const total = sheets.length;
  $('#lzList').innerHTML = sheets.map((sh, i) => {
    // hairlines vanish in the small preview, so it gets thicker lines than the file
    const svg = laserSvg(sh, o, i + 1, total).replace(/stroke-width="0\.1"/g, 'stroke-width="1.2"'), n = sh.parts.length;
    return `<div class="lz-sheet"><img alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}">
      <div><b>${T('Platte')} ${i + 1}</b><small>${n === 1 ? T('1 Wand') : T`${n} Wände`}</small></div>
      <button class="btn" data-lz="${i}">SVG</button></div>`;
  }).join('');
  $('#lzCount').textContent = total ? (total === 1 ? T('1 Platte') : T`${total} Platten`) : '';
  $('#lzZip').disabled = !total;
}
const laserFile = i => `${fileBase()}${T('_laser_platte')}${i + 1}.svg`;
$('#lzList').addEventListener('click', e => {
  const b = e.target.closest('[data-lz]'); if (!b) return;
  const i = +b.dataset.lz;
  download(laserFile(i), laserSvg(laser.sheets[i], laser.opts, i + 1, laser.sheets.length), 'image/svg+xml');
});
$('#lzZip').addEventListener('click', async () => {
  const n = laser.sheets.length;
  if (n === 1) { download(laserFile(0), laserSvg(laser.sheets[0], laser.opts, 1, 1), 'image/svg+xml'); return; }
  const base = fileBase();
  const files = laser.sheets.map((sh, i) => ({ name: `${base}/${laserFile(i)}`, data: laserSvg(sh, laser.opts, i + 1, n) }));
  files.push({ name: `${base}/${base}${T('_stueckliste')}.csv`, data: bomCsv() });
  saveBlob(base + T('_laser') + '.zip', await makeZip(files));
});
const LZ_FIELDS = { lzW: 'laserW', lzH: 'laserH', lzKerf: 'laserKerf', lzGap: 'laserGap' };
for (const [id, key] of Object.entries(LZ_FIELDS)) $('#' + id).addEventListener('change', e => {
  const v = parseFloat(String(e.target.value).replace(',', '.'));
  if (!(v >= 0)) { e.target.value = S.settings[key]; return; }
  S.settings[key] = key === 'laserW' || key === 'laserH' ? clamp(v, 50, 2000) : clamp(v, 0, key === 'laserKerf' ? 1 : 50);
  e.target.value = S.settings[key]; persist(); drawLaser();
});
for (const [id, key] of [['lzPattern', 'laserPattern'], ['lzEngrave', 'laserEngrave']])
  $('#' + id).addEventListener('change', e => { S.settings[key] = e.target.checked; persist(); drawLaser(); });
$('#lzClose').addEventListener('click', () => $('#laserDlg').close());
function openLaser() {
  const st = S.settings;
  for (const [id, key] of Object.entries(LZ_FIELDS)) $('#' + id).value = st[key];
  $('#lzPattern').checked = st.laserPattern; $('#lzPattern').disabled = st.pattern === 'none';
  $('#lzEngrave').checked = st.laserEngrave;
  drawLaser();
  $('#laserDlg').showModal();
}
