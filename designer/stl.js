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

function startEngine(onMessage) {
  try {
    const url = URL.createObjectURL(new Blob([ENGINE_SRC], { type: 'text/javascript' }));
    const w = new Worker(url, { type: 'module' });
    w.onmessage = e => onMessage(e.data);
    w.onerror = e => { e.preventDefault(); onMessage({ type: 'fatal', text: 'Worker-Fehler: ' + (e.message || 'unbekannt') }); };
    return { post: d => w.postMessage(d), stop: () => w.terminate() };
  } catch (err) {
    // main-thread fallback: same engine, the UI pauses while a plate renders
    let stopped = false;
    const self = { postMessage: d => { if (!stopped) setTimeout(() => onMessage(d)); } };
    new Function('self', ENGINE_SRC)(self);
    return { post: d => self.onmessage({ data: d }), stop: () => { stopped = true; } };
  }
}

// ---- minimal ZIP writer (stored, no compression) ---------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

function makeZip(files) {
  const enc = new TextEncoder(), chunks = [], central = [];
  const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true);
    h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    chunks.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true); c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true);
    c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    central.push(new Uint8Array(c.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((s, a) => s + a.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
  return new Blob([...chunks, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
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
  $('#stlZip').disabled = true;
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
      $('#stlZip').disabled = false;
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
$('#stlZip').addEventListener('click', () => {
  const base = fileBase();
  const files = stl.plates.filter(pl => stl.results.has(pl.num)).map(pl => ({ name: `${base}/${plateFile(pl)}`, data: stl.results.get(pl.num) }));
  files.push({ name: `${base}/${base}_stueckliste.csv`, data: bomCsv() },
             { name: `${base}/${base}_druckjob.scad`, data: stl.job.scad },
             { name: `${base}/${base}_projekt.json`, data: JSON.stringify(S, null, 2) });
  saveBlob(base + '_teile.zip', makeZip(files));
});
