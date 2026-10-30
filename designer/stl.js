// Drawer Divider Designer – renders every print plate to STL in the browser.
// OpenSCAD runs as WebAssembly (openscad-wasm-prebuilt, GPL-2.0) inside a worker;
// the job file comes from buildJob() in app.js, so the parts are exactly the SCAD library's.
'use strict';

const OPENSCAD_URL = 'https://cdn.jsdelivr.net/npm/openscad-wasm-prebuilt@1.2.0/dist/openscad.js';

// Runs inside the worker (or on the main thread if workers are unavailable).
// Messages in:  {type:'run', scad, plates:[{num,label}]}
// Messages out: {type:'status'|'start'|'done'|'fail'|'finished', ...}
const ENGINE_SRC = `
let mod = null, job = '', flags = null, errs = [];
async function fresh() {
  const { createOpenSCAD } = await import('${OPENSCAD_URL}');
  const os = await createOpenSCAD({ print: () => {}, printErr: s => errs.push(s) });
  mod = os.getInstance();
  mod.FS.writeFile('/job.scad', job);
}
async function render(num) {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!mod || attempt > 0) await fresh();
    // manifold renders much faster and binary STL is ~5x smaller; drop what this build doesn't know
    for (const f of (flags ? [flags] : [['--enable=manifold', '--export-format=binstl'], ['--export-format=binstl'], []])) {
      errs = [];
      let rc, data = null;
      try { rc = mod.callMain(['/job.scad', ...f, '-D', 'PART=' + num, '-o', '/out.stl']); }
      catch (e) { rc = -1; errs.push(String(e && e.message || e)); }
      try { data = mod.FS.readFile('/out.stl'); mod.FS.unlink('/out.stl'); } catch (e) { /* no output */ }
      if (rc === 0 && data && data.length > 84) { flags = f; return new Uint8Array(data); }
    }
  }
  throw new Error(errs.filter(l => /error|warning/i.test(l)).slice(-2).join(' ') || 'OpenSCAD hat keine STL erzeugt');
}
self.onmessage = async (e) => {
  if (e.data.type !== 'run') return;
  job = e.data.scad; mod = null;
  try { self.postMessage({ type: 'status', text: 'OpenSCAD wird geladen …' }); await fresh(); }
  catch (err) { self.postMessage({ type: 'fatal', text: 'OpenSCAD konnte nicht geladen werden: ' + (err && err.message || err) }); return; }
  for (const pl of e.data.plates) {
    self.postMessage({ type: 'start', num: pl.num });
    const t0 = Date.now();
    try {
      const data = await render(pl.num);
      self.postMessage({ type: 'done', num: pl.num, data, ms: Date.now() - t0 }, [data.buffer]);
    } catch (err) { self.postMessage({ type: 'fail', num: pl.num, text: String(err && err.message || err) }); }
  }
  self.postMessage({ type: 'finished' });
};
`;

// main-thread engine: same code, the page pauses while a plate renders
function startInline(onMessage) {
  let stopped = false;
  const self = { postMessage: d => { if (!stopped) setTimeout(() => onMessage(d)); } };
  new Function('self', ENGINE_SRC)(self);
  return { post: d => self.onmessage({ data: d }), stop: () => { stopped = true; } };
}

// Prefers a worker; some browsers refuse workers for pages opened as a local file,
// so a worker that fails before its first plate hands over to the main thread.
function startEngine(onMessage) {
  let w, active, lastRun = null, started = false;
  const fallback = () => {
    if (active.inline) return;
    w.terminate();
    active = { inline: true, ...startInline(onMessage) };
    if (lastRun) active.post(lastRun);
  };
  try {
    const url = URL.createObjectURL(new Blob([ENGINE_SRC], { type: 'text/javascript' }));
    w = new Worker(url, { type: 'module' });
    active = { post: d => w.postMessage(d), stop: () => w.terminate() };
    w.onmessage = e => {
      if (e.data.type === 'start') started = true;
      if (e.data.type === 'fatal' && !started) fallback(); else onMessage(e.data);
    };
    w.onerror = e => { e.preventDefault(); if (!started) fallback(); else onMessage({ type: 'fatal', text: 'Worker-Fehler: ' + (e.message || 'unbekannt') }); };
  } catch (err) {
    active = { inline: true, ...startInline(onMessage) };
  }
  return { post: d => { if (d.type === 'run') lastRun = d; active.post(d); }, stop: () => active.stop() };
}

// ---- minimal ZIP writer (stored, no compression) ---------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

// files: [{name, data}] - data is a string or Uint8Array. Entries are deflated where the
// browser can (CompressionStream), otherwise stored.
async function makeZip(files) {
  const enc = new TextEncoder(), chunks = [], central = [];
  const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    let body = data, method = 0;
    if (typeof CompressionStream === 'function') {
      try {
        const z = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
        if (z.length < data.length) { body = z; method = 8; }
      } catch { /* keep it stored */ }
    }
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, method, true);
    h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true);
    h.setUint32(18, body.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    chunks.push(new Uint8Array(h.buffer), name, body);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint16(10, method, true); c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true);
    c.setUint32(20, body.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    central.push(new Uint8Array(c.buffer), name);
    offset += 30 + name.length + body.length;
  }
  const cdSize = central.reduce((s, a) => s + a.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
  return new Blob([...chunks, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
}

// ---- 3MF: every plate as its own object -------------------------------------
// Binary STL -> indexed mesh (shared vertices), as 3MF wants it.
function stlMesh(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength), n = dv.getUint32(80, true);
  const index = new Map(), verts = [], tris = [];
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50 + 12, t = [];
    for (let k = 0; k < 3; k++) {
      const x = dv.getFloat32(o + k * 12, true), y = dv.getFloat32(o + k * 12 + 4, true), z = dv.getFloat32(o + k * 12 + 8, true);
      const key = x + ',' + y + ',' + z;
      let id = index.get(key);
      if (id === undefined) { id = verts.length; index.set(key, id); verts.push(key); }
      t.push(id);
    }
    if (t[0] !== t[1] && t[1] !== t[2] && t[0] !== t[2]) tris.push(t);
  }
  return { verts, tris };
}
// Plates sit side by side; Bambu Studio / OrcaSlicer also get one plate per object.
function make3mf(plates, bed) {
  const model = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<model unit="millimeter" xml:lang="de-DE" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">',
    '<metadata name="Application">Drawer Divider Designer</metadata><resources>'];
  const items = [], cfg = ['<?xml version="1.0" encoding="UTF-8"?>', '<config>'];
  plates.forEach((pl, i) => {
    const id = i + 1, { verts, tris } = stlMesh(pl.data);
    model.push(`<object id="${id}" name="${esc(pl.name)}" type="model"><mesh><vertices>`);
    for (const v of verts) { const [x, y, z] = v.split(','); model.push(`<vertex x="${x}" y="${y}" z="${z}"/>`); }
    model.push('</vertices><triangles>');
    for (const t of tris) model.push(`<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`);
    model.push('</triangles></mesh></object>');
    items.push(`<item objectid="${id}" transform="1 0 0 0 1 0 0 0 1 ${bed / 2 + i * (bed + 30)} ${bed / 2} 0"/>`);
    cfg.push(`<object id="${id}"><metadata key="name" value="${esc(pl.name)}"/></object>`);
  });
  plates.forEach((pl, i) => cfg.push(`<plate><metadata key="plater_id" value="${i + 1}"/><metadata key="plater_name" value="${esc(pl.name)}"/>`
    + `<model_instance><metadata key="object_id" value="${i + 1}"/><metadata key="instance_id" value="0"/></model_instance></plate>`));
  cfg.push('</config>');
  model.push('</resources><build>', ...items, '</build></model>');
  return makeZip([
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="config" ContentType="text/xml"/></Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>' },
    { name: '3D/3dmodel.model', data: model.join('\n') },
    { name: 'Metadata/model_settings.config', data: cfg.join('\n') },
  ]);
}

// ---- dialog ----------------------------------------------------------------
const stl = { engine: null, results: new Map(), plates: [], job: null };
const slug = s => s.replace(/×/g, 'x').replace(/[^\w\-. äöüÄÖÜß]+/g, '').trim().replace(/\s+/g, '_');
const plateFile = pl => `${String(pl.num).padStart(2, '0')}_${slug(pl.label)}.stl`;
function saveBlob(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function openStlDialog() {
  if (!A.bom.parts) { flash('Noch keine Teile – zeichne zuerst Fächer in die Schublade.'); return; }
  stl.job = buildJob();
  stl.plates = stl.job.plates;
  stl.results = new Map();
  const list = $('#stlList');
  list.innerHTML = stl.plates.map(pl => `<div class="stl-row" data-num="${pl.num}">
      <span class="stl-state">○</span><span class="stl-name">${esc(pl.label)}</span>
      <span class="stl-info">wartet</span><button class="btn stl-dl" disabled>STL</button></div>`).join('');
  for (const b of list.querySelectorAll('.stl-dl')) b.addEventListener('click', () => {
    const num = +b.closest('.stl-row').dataset.num, pl = stl.plates.find(p => p.num === num);
    saveBlob(plateFile(pl), new Blob([stl.results.get(num)], { type: 'model/stl' }));
  });
  $('#stlZip').disabled = true; $('#stl3mf').disabled = true;
  $('#stlStatus').textContent = 'Startet …';
  $('#stlBar').style.width = '0%';
  $('#stlDlg').showModal();
  runStl();
}

function setRow(num, state, info) {
  const row = $(`#stlList .stl-row[data-num="${num}"]`);
  if (!row) return;
  row.className = 'stl-row ' + state;
  row.querySelector('.stl-state').textContent = { run: '◐', ok: '✓', err: '✕' }[state] || '○';
  row.querySelector('.stl-info').textContent = info;
  row.querySelector('.stl-dl').disabled = state !== 'ok';
  if (state === 'run') row.scrollIntoView({ block: 'nearest' });
}

function runStl() {
  if (stl.engine) stl.engine.stop();
  const total = stl.plates.length;
  let doneCount = 0;
  const progress = () => { $('#stlBar').style.width = Math.round(100 * doneCount / total) + '%'; };
  stl.engine = startEngine(m => {
    if (m.type === 'status') $('#stlStatus').textContent = m.text;
    else if (m.type === 'fatal') { $('#stlStatus').textContent = m.text; }
    else if (m.type === 'start') { setRow(m.num, 'run', 'wird gerechnet …'); $('#stlStatus').textContent = `Platte ${m.num} von ${total} …`; }
    else if (m.type === 'done') {
      stl.results.set(m.num, m.data); doneCount++; progress();
      setRow(m.num, 'ok', `${(m.data.length / 1048576).toFixed(1).replace('.', ',')} MB · ${(m.ms / 1000).toFixed(0)} s`);
      $('#stlZip').disabled = false; $('#stl3mf').disabled = false;
    } else if (m.type === 'fail') { doneCount++; progress(); setRow(m.num, 'err', m.text.slice(0, 120)); }
    else if (m.type === 'finished') {
      const ok = stl.results.size;
      $('#stlStatus').textContent = ok === total ? `Fertig – ${ok} STL-Dateien bereit.` : `Fertig – ${ok} von ${total} Platten erzeugt.`;
      stl.engine = null;
    }
  });
  stl.engine.post({ type: 'run', scad: stl.job.scad, plates: stl.plates });
}

$('#btnStl').addEventListener('click', openStlDialog);
$('#stlClose').addEventListener('click', () => $('#stlDlg').close());
// closing the dialog (button or Esc) stops the running render
$('#stlDlg').addEventListener('close', () => { if (stl.engine) { stl.engine.stop(); stl.engine = null; } });
$('#stlZip').addEventListener('click', async () => {
  const base = fileBase();
  const files = stl.plates.filter(pl => stl.results.has(pl.num)).map(pl => ({ name: `${base}/${plateFile(pl)}`, data: stl.results.get(pl.num) }));
  files.push({ name: `${base}/${base}_stueckliste.csv`, data: bomCsv() },
             { name: `${base}/${base}_druckjob.scad`, data: stl.job.scad },
             { name: `${base}/${base}_projekt.json`, data: JSON.stringify(S, null, 2) });
  saveBlob(base + '_teile.zip', await makeZip(files));
});
$('#stl3mf').addEventListener('click', async () => {
  const btn = $('#stl3mf'); btn.disabled = true; $('#stlStatus').textContent = '3MF wird gebaut …';
  try {
    const plates = stl.plates.filter(pl => stl.results.has(pl.num)).map(pl => ({ name: plateFile(pl).replace(/\.stl$/, ''), data: stl.results.get(pl.num) }));
    const blob = await make3mf(plates, S.settings.bed);
    saveBlob(fileBase() + '.3mf', new Blob([blob], { type: 'model/3mf' }));
    $('#stlStatus').textContent = `3MF mit ${plates.length} Platten gespeichert.`;
  } catch (err) { $('#stlStatus').textContent = '3MF fehlgeschlagen: ' + (err && err.message || err); }
  btn.disabled = false;
});
