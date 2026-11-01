// Drawer Divider Designer – plans a drawer layout and derives every part to print.
// Geometry formulas mirror scad/lib/drawer_divider.scad; keep both in sync.
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const EPS = 0.01;
const r2 = v => Math.round(v * 100) / 100;
const near = (a, b) => Math.abs(a - b) < EPS;
const fmt = (v, d = 1) => Number(v).toLocaleString(LANG === 'en' ? 'en-US' : 'de-DE', { maximumFractionDigits: d });
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STORE_KEY = 'dd-designer-v3';

// ---------------------------------------------------------------------------
// Defaults & saved profiles
// ---------------------------------------------------------------------------
const DEFAULT_PROFILE = { wall_t: 2, tol: 0.2, height: 40, insert: 14, shell: 2.5, arm: 20, fillet: 10, edge_r: 0.6, cap: 0,
                          floor_t: 2, lead_in: 1, efc: 0.4, magnet_d: 5, magnet_h: 2, end_gap: 0.3, top_gap: 0.2 };
const AUTO_AIR = 5;                        // headroom above the dividers when the height follows the drawer
const PROFILES_KEY = 'dd-designer-profiles';
const PER_DRAWER = ['border', 'slip'];     // settings that belong to the drawer design, not to a profile

const TYPES = {
  cross:      { name: T('Kreuz'), desc: T('4 Wände treffen sich') },
  tee:        { name: T('T-Stück'), desc: T('3 Wände') },
  corner:     { name: T('Ecke'), desc: T('2 Wände im 90°-Winkel') },
  corner_round: { name: T('Rahmenecke gerundet'), desc: T('Außen gerundet für die Schubladenecke') },
  straight:   { name: T('Gerade'), desc: T('Verlängert eine geteilte Wand') },
  end:        { name: T('Endstück'), desc: T('Freies Wandende / am Rand') },
  slip_cross: { name: T('Aufsteck-Kreuz durchgehend'), desc: T('Auf durchgehende Wand gesteckt') },
  slip_tee:   { name: T('Aufsteck-T durchgehend'), desc: T('Auf durchgehende Wand gesteckt') },
};
// With slip-on connectors every connector of the drawer carries the cap and is
// pushed on from above, also where the walls end instead of running through.
const cappedSet = t => S.settings.slip && !t.startsWith('slip');
const typeName = t => (cappedSet(t) ? T('Aufsteck-') : '') + TYPES[t].name;
const typeDesc = t => TYPES[t].desc + (cappedSet(t) ? T(', Wände enden darin') : '');
const TYPE_ORDER = Object.keys(TYPES);
const quote = t => LANG === 'en' ? `“${t}”` : `„${t}“`;
const clipName = x => T('Beschriftungsclip') + (x.label ? ' ' + quote(x.label) : '');

function defaultSettings() {
  return { border: 'frame', slip: false, autoH: true, maxLen: 240, grid: 5, bed: 256, borderGap: 0.5, noneGap: 1,
           pattern: 'hex', orient: 'standing', grip: 0, density: '1.24', labels: true, clips: false,
           railPlate: 2.5, toothT: 2, toothH: 6, pack: 'mixed', price: 25, currency: '€', rate: 20,
           laserW: 300, laserH: 300, laserKerf: 0.1, laserGap: 3, laserPattern: true, laserEngrave: true };
}
function defaultState() {
  return { version: 3, name: T('Meine Schublade'), drawer: { w: 400, d: 300, h: 60, r: 0 },
           preset: '', profile: { ...DEFAULT_PROFILE }, settings: defaultSettings(), walls: [], names: [], items: [], done: [] };
}

// ---------------------------------------------------------------------------
// Derived geometry
// ---------------------------------------------------------------------------
// centre distance two connectors on one wall need so their arms do not collide
const minConnGap = (g, p) => 2 * p.arm + 1;

function syncAuto(S) {
  if (S.settings.autoH) S.profile.height = Math.max(10, Math.floor(S.drawer.h - AUTO_AIR));
}

function geom(S) {
  const p = S.profile, s = S.settings;
  const slotW = p.wall_t + p.tol;
  const armW = slotW + 2 * p.shell;
  const pocket = p.arm - p.insert;
  const capS = Math.max(p.cap, p.floor_t);
  const cap = s.slip ? capS : p.cap;
  const wallH = p.height - (cap > 0 ? cap + p.top_gap : 0);
  const railT = s.railPlate + s.toothH;
  const B = (s.border === 'frame' || s.border === 'endcap') ? armW / 2 + s.borderGap : 0;
  // frame corners follow a rounded drawer corner, as far as the slots allow (dd_corner_r_max)
  const ca = armW / 2, dx = pocket + ca, dy = ca - slotW / 2 - 0.8;
  const cornerMax = dy <= 0 ? dx : dx + dy + Math.sqrt(2 * dx * dy);
  const cornerWant = s.border === 'frame' && S.drawer.r > 0 ? S.drawer.r - s.borderGap : 0;
  const cornerR = Math.max(0, Math.min(cornerWant, cornerMax));
  return { slotW, armW, pocket, inset: pocket + p.end_gap, wallH, railT, B, t: p.wall_t, cornerR, cornerMax, cornerWant,
           pitch: s.toothT + slotW, W: S.drawer.w, D: S.drawer.d };
}

// Rail tooth pattern along one drawer side. Left/right rails span the full
// depth; front/back rails sit between them.
function railSpan(axis, g) {
  return axis === 'y' ? { start: 0.5, len: g.D - 1 }
                      : { start: g.railT + 0.5, len: g.W - 2 * g.railT - 1 };
}
function railCenterOffset(len, tt, sw) {
  const pitch = tt + sw, n = Math.max(1, Math.floor((len + sw) / pitch));
  return (len - (n * tt + (n - 1) * sw)) / 2;
}
function railSlots(axis, S, g) {
  const { start, len } = railSpan(axis, g), tt = S.settings.toothT;
  const first = start + railCenterOffset(len, tt, g.slotW);
  const out = [];
  for (let c = first + tt + g.slotW / 2; c + g.slotW / 2 + tt <= start + len + EPS; c += g.pitch) out.push(r2(c));
  return { first, slots: out };
}

// ---------------------------------------------------------------------------
// Analysis: walls -> nodes, connectors, wall pieces, rails, compartments, BOM
// ---------------------------------------------------------------------------
// Walls are stored as centre lines {o:'h'|'v', c, a, b}: 'h' runs along x at y=c.
// Directions (SVG coordinates, y down): 0=E, 1=S, 2=W, 3=N.

function normWall(w, g) {
  const L = w.o === 'h' ? g.W : g.D, M = w.o === 'h' ? g.D : g.W;
  const a = clamp(Math.min(w.a, w.b), g.B, L - g.B), b = clamp(Math.max(w.a, w.b), g.B, L - g.B);
  if (b - a < 1 || w.c < g.B - EPS || w.c > M - g.B + EPS) return null;
  return { o: w.o, c: r2(w.c), a: r2(a), b: r2(b), h: w.h > 0 ? +w.h : 0 };
}

function mergeLines(list) {
  const by = new Map();
  for (const l of list) { const k = l.c.toFixed(2); if (!by.has(k)) by.set(k, []); by.get(k).push(l); }
  const out = [];
  for (const arr of by.values()) {
    arr.sort((p, q) => p.a - q.a);
    let cur = { ...arr[0] };
    for (const l of arr.slice(1)) {
      if (l.a <= cur.b + EPS) { cur.b = Math.max(cur.b, l.b); cur.frame = cur.frame && l.frame; }
      else { out.push(cur); cur = { ...l }; }
    }
    out.push(cur);
  }
  return out;
}

function analyze(S) {
  const g = geom(S), st = S.settings, p = S.profile, msgs = [];
  const { W, D, B } = g;

  const raw = S.walls.map(w => normWall(w, g)).filter(Boolean);
  if (st.border === 'frame')
    raw.push({ o: 'h', c: r2(B), a: r2(B), b: r2(W - B), frame: true }, { o: 'h', c: r2(D - B), a: r2(B), b: r2(W - B), frame: true },
             { o: 'v', c: r2(B), a: r2(B), b: r2(D - B), frame: true }, { o: 'v', c: r2(W - B), a: r2(B), b: r2(D - B), frame: true });
  const H = mergeLines(raw.filter(l => l.o === 'h'));
  const V = mergeLines(raw.filter(l => l.o === 'v'));
  const lines = [...H, ...V];

  // nodes at every end point and crossing
  const nodes = new Map();
  const addNode = (x, y) => { const k = x.toFixed(2) + ',' + y.toFixed(2); if (!nodes.has(k)) nodes.set(k, { x, y, dirs: [0, 0, 0, 0] }); };
  for (const l of H) { addNode(l.a, l.c); addNode(l.b, l.c); }
  for (const l of V) { addNode(l.c, l.a); addNode(l.c, l.b); }
  for (const h of H) for (const v of V)
    if (v.c >= h.a - EPS && v.c <= h.b + EPS && h.c >= v.a - EPS && h.c <= v.b + EPS) addNode(v.c, h.c);

  for (const n of nodes.values()) {
    for (const l of H) if (near(l.c, n.y)) {
      if (n.x >= l.a - EPS && n.x < l.b - EPS) n.dirs[0] = 1;
      if (n.x > l.a + EPS && n.x <= l.b + EPS) n.dirs[2] = 1;
    }
    for (const l of V) if (near(l.c, n.x)) {
      if (n.y >= l.a - EPS && n.y < l.b - EPS) n.dirs[1] = 1;
      if (n.y > l.a + EPS && n.y <= l.b + EPS) n.dirs[3] = 1;
    }
  }

  // classify
  // slip-on crossing: the first wall not forced to end runs through; none left = a normal cross / T
  function pickThrough(n) {
    n.through = n.cand.find(o => !n.blocked.has(o)) || null;
    const four = n.dirs[0] + n.dirs[1] + n.dirs[2] + n.dirs[3] === 4;
    n.type = n.through ? (four ? 'slip_cross' : 'slip_tee') : (four ? 'cross' : 'tee');
  }
  const lineLen =(o, x, y) => { const l = (o === 'h' ? H : V).find(l => near(l.c, o === 'h' ? y : x) && (o === 'h' ? x : y) >= l.a - EPS && (o === 'h' ? x : y) <= l.b + EPS); return l ? l.b - l.a : 0; };
  for (const n of nodes.values()) {
    const d = n.dirs, cnt = d[0] + d[1] + d[2] + d[3];
    const side = near(n.x, 0) ? 'L' : near(n.x, W) ? 'R' : near(n.y, 0) ? 'T' : near(n.y, D) ? 'B' : null;
    if (cnt === 1 && side && (st.border === 'rail' || st.border === 'none')) {
      n.kind = 'edge'; n.side = side;
      n.off = st.border === 'rail' ? st.railPlate + p.end_gap : st.noneGap;
      continue;
    }
    n.kind = 'conn';
    if (cnt === 4) n.type = 'cross';
    else if (cnt === 3) n.type = 'tee';
    else if (cnt === 2) n.type = (d[0] && d[2]) || (d[1] && d[3]) ? 'straight' : 'corner';
    else n.type = 'end';
    if (st.slip && (cnt === 4 || cnt === 3)) {
      // walls that could run through here, the longer one first; a wall that has to end
      // here (too long, see below) goes into n.blocked and the other one takes over
      n.cand = [d[0] && d[2] && 'h', d[1] && d[3] && 'v'].filter(Boolean)
        .sort((a, b) => lineLen(b, n.x, n.y) - lineLen(a, n.x, n.y));
      n.blocked = new Set();
      pickThrough(n);
    }
    if (n.type === 'straight') n.through = null;
    if (n.type === 'corner' && g.cornerR > 0 && (near(n.x, B) || near(n.x, W - B)) && (near(n.y, B) || near(n.y, D - B))) n.type = 'corner_round';
  }

  // wall pieces: cut each line at nodes that don't let it pass through
  const pieces = [], joints = [];
  const offOf = n => n.kind === 'edge' ? n.off : g.inset;
  for (const l of lines) {
    l.at = (u) => l.o === 'h' ? nodes.get(u.toFixed(2) + ',' + l.c.toFixed(2)) : nodes.get(l.c.toFixed(2) + ',' + u.toFixed(2));
    l.stops = [...nodes.values()].filter(n => l.o === 'h' ? near(n.y, l.c) && n.x >= l.a - EPS && n.x <= l.b + EPS
                                                          : near(n.x, l.c) && n.y >= l.a - EPS && n.y <= l.b + EPS)
                                   .map(n => l.o === 'h' ? n.x : n.y).sort((a, b) => a - b);
  }
  function lineCuts(l) { return l.stops.filter((u, i) => i === 0 || i === l.stops.length - 1 || l.at(u).through !== l.o); }
  // slip-on: a through wall that is too long ends at a crossing instead of getting a joiner
  // squeezed between connectors. The other wall may run through there instead, which can make
  // that one too long in turn – repeat until nothing changes (blocks only grow, so this ends).
  if (st.slip) for (let round = 0, changed = true; changed && round < 20; round++) {
    changed = false;
    for (const l of lines) {
      const cuts = lineCuts(l);
      for (let i = 0; i + 1 < cuts.length; i++) {
        const u1 = cuts[i + 1], o1 = offOf(l.at(u1));
        let prev = cuts[i], prevOff = offOf(l.at(prev));
        while (u1 - prev - prevOff - o1 > st.maxLen) {
          const ok = l.stops.filter(u => u > prev + EPS && u < u1 - EPS && u - prev - prevOff - g.inset <= st.maxLen);
          if (!ok.length) break;   // no crossing close enough: joiners take over below
          prev = ok[ok.length - 1]; prevOff = g.inset;
          const n = l.at(prev);
          if (n.blocked && !n.blocked.has(l.o)) { n.blocked.add(l.o); pickThrough(n); changed = true; }
        }
      }
    }
  }
  for (const l of lines) {
    const at = l.at, stops = l.stops, cuts = lineCuts(l);
    for (let i = 0; i + 1 < cuts.length; i++) {
      const u0 = cuts[i], u1 = cuts[i + 1], o0 = offOf(at(u0)), o1 = offOf(at(u1));
      const total = u1 - u0 - o0 - o1;
      // split into k equal walls joined by straight connectors when too long
      let k = 1;
      while ((total - (k - 1) * 2 * g.inset) / k > st.maxLen && k < 50) k++;
      const len = (total - (k - 1) * 2 * g.inset) / k;
      // joints start evenly spaced, then dodge connectors sitting on the same line
      const clear = 2 * p.arm + 2, jcs = [];
      for (let j = 1; j < k; j++) {
        const ideal = u0 + o0 + j * len + (2 * j - 1) * g.inset;
        let best = ideal;
        for (let d = 0; d <= 80; d += 2.5) {
          const cand = [ideal + d, ideal - d].find(c => !stops.some(u => u > u0 && u < u1 && Math.abs(u - c) < clear)
            && c - g.inset - (jcs.length ? jcs[jcs.length - 1] + g.inset : u0 + o0) <= st.maxLen);
          if (cand !== undefined) { best = cand; break; }
        }
        jcs.push(best);
      }
      let s = u0 + o0, edge0 = at(u0).kind === 'edge';
      for (const jc of [...jcs, null]) {
        const e = jc === null ? u1 - o1 : jc - g.inset;
        pieces.push({ o: l.o, c: l.c, s, e, len: e - s, frame: !!l.frame, edge: edge0 || (jc === null && at(u1).kind === 'edge') });
        edge0 = false;
        if (jc !== null) {
          joints.push(l.o === 'h' ? { x: jc, y: l.c, dirs: [1, 0, 1, 0] } : { x: l.c, y: jc, dirs: [0, 1, 0, 1] });
          s = jc + g.inset;
        }
      }
      if (k > 1) msgs.push({ lvl: 'info', text: T`Eine ${fmt(total, 0)} mm lange Wand ist länger als ${fmt(st.maxLen, 0)} mm – in ${k} Teile mit Verlängerung geteilt.` });
    }
  }
  for (const j of joints) { j.kind = 'conn'; j.type = 'straight'; j.joint = true; nodes.set('j' + j.x + ',' + j.y, j); }

  // own wall heights (e.g. lower walls at the front to reach in); connectors keep the full height.
  // Slip-on connectors sit on top of the walls, so there every wall keeps the full height.
  const ownH = st.slip ? [] : raw.filter(l => l.h);
  for (const pc of pieces) {
    const m = (pc.s + pc.e) / 2, own = ownH.filter(l => l.o === pc.o && near(l.c, pc.c) && m >= l.a - EPS && m <= l.b + EPS);
    pc.h = own.length ? r2(clamp(Math.max(...own.map(l => l.h)), 10, g.wallH)) : g.wallH;
  }
  const itemClash = new Set();
  (S.items || []).forEach((it, i) => {
    const t = g.t / 2;
    if (pieces.some(pc => pc.o === 'h' ? pc.c + t > it.y && pc.c - t < it.y + it.d && pc.e > it.x && pc.s < it.x + it.w
                                              : pc.c + t > it.x && pc.c - t < it.x + it.w && pc.e > it.y && pc.s < it.y + it.d)) {
      itemClash.add(i);
      msgs.push({ lvl: 'warn', text: T`${it.name || T('Ein Gegenstand')} liegt auf einer Wand.` });
    }
  });
  if (st.slip && raw.some(l => l.h)) msgs.push({ lvl: 'info', text: T('Eigene Wandhöhen gelten nicht mit Aufsteck-Verbindern – die sitzen oben auf den Wänden.') });

  // a wall from the drawer side must be long enough that the connector arm does not hit the side
  const minLen = Math.max(8, g.armW), minEdgeLen = Math.max(minLen, p.arm - g.inset + 1);
  let tooShort = 0, negative = 0;
  for (const pc of pieces) {
    if (pc.len <= 0) { pc.bad = true; negative++; }
    else if (pc.len < (pc.edge ? minEdgeLen : minLen)) { pc.bad = true; tooShort++; }
  }
  if (negative) msgs.push({ lvl: 'err', text: T`${negative} Wandstück(e) passen nicht – Verbinder liegen zu dicht beieinander (mind. ${fmt(minConnGap(g, p), 0)} mm Abstand).` });
  if (tooShort) msgs.push({ lvl: 'warn', text: T`${tooShort} zu kurze Wandstück(e) – rot markiert.` });

  // connector bodies on the same line must not overlap: each reaches one arm length
  // towards the neighbour where it has an arm, half its width where it has none
  const conns = [...nodes.values()].filter(n => n.kind === 'conn');
  let collisions = 0;
  for (const [ax, lo, hi] of [['y', 0, 2], ['x', 1, 3]]) {
    const groups = new Map();
    for (const n of conns) { const k = n[ax].toFixed(2); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(n); }
    const along = ax === 'y' ? 'x' : 'y';
    for (const grp of groups.values()) {
      grp.sort((a, b) => a[along] - b[along]);
      for (let i = 0; i + 1 < grp.length; i++) {
        const a = grp[i], b = grp[i + 1];
        const need = (a.dirs[lo] ? p.arm : g.armW / 2) + (b.dirs[hi] ? p.arm : g.armW / 2) + 1;
        if (b[along] - a[along] < need - EPS) { a.clash = b.clash = true; collisions++; }
      }
    }
  }
  if (collisions) msgs.push({ lvl: 'err', text: T`${collisions}× überschneiden sich Verbinder – Wände auf einer Linie brauchen mind. ${fmt(minConnGap(g, p), 0)} mm Abstand (rot markiert).` });

  // rails
  const rails = [];
  if (st.border === 'rail') {
    const used = new Set([...nodes.values()].filter(n => n.kind === 'edge').map(n => n.side));
    const sl = { x: railSlots('x', S, g), y: railSlots('y', S, g) };
    for (const n of nodes.values()) if (n.kind === 'edge') {
      const axis = n.side === 'L' || n.side === 'R' ? 'y' : 'x', v = axis === 'y' ? n.y : n.x;
      if (!sl[axis].slots.some(c => Math.abs(c - v) < 0.05)) { n.offGrid = true; }
    }
    const off = [...nodes.values()].filter(n => n.offGrid).length;
    if (off) msgs.push({ lvl: 'warn', text: T`${off} Wandende(n) treffen keinen Schlitz der Schiene – mit „Auswählen" leicht verschieben.` });
    const rw = Math.min(g.wallH, S.drawer.h);
    for (const side of ['L', 'R', 'T', 'B']) if (used.has(side)) {
      const axis = side === 'L' || side === 'R' ? 'y' : 'x';
      const { start, len } = railSpan(axis, g);
      const first = sl[axis].first;
      const k = Math.ceil(len / st.maxLen), pl = len / k;
      for (let i = 0; i < k; i++) {
        const ps = start + i * pl;
        const offT = ((first - ps) % g.pitch + g.pitch) % g.pitch;
        rails.push({ side, axis, s: ps, e: ps + pl, len: r2(pl), width: r2(rw), offset: r2(offT),
                     tongue: i < k - 1, socket: i > 0, screws: Math.max(1, Math.round(pl / 70)) });
      }
    }
  }

  // compartments via coordinate compression
  const comps = findCompartments(S, g, H, V);

  // checks
  if (p.height > S.drawer.h) msgs.push({ lvl: 'err', text: T`Verbinder sind ${fmt(p.height)} mm hoch, die Schublade nur ${fmt(S.drawer.h)} mm.` });
  else if (p.height > S.drawer.h - 3) msgs.push({ lvl: 'warn', text: T`Nur ${fmt(S.drawer.h - p.height)} mm Luft über den Trennern – die Schublade könnte hängen bleiben.` });
  const longest = Math.max(0, ...pieces.map(x => x.len), ...rails.map(r => r.len));
  if (S.settings.orient === 'flat' && longest > st.bed - 10) msgs.push({ lvl: 'warn', text: T`Längstes Teil (${fmt(longest, 0)} mm) passt kaum aufs ${fmt(st.bed, 0)}-mm-Druckbett.` });
  if (g.cornerWant > g.cornerMax + EPS) msgs.push({ lvl: 'warn', text: T`Eckradius zu groß: Die Rahmenecken lassen sich nur bis ${fmt(g.cornerMax)} mm runden, sonst würden die Schlitze angeschnitten. Mehr Abstand zum Rand oder Endstücke helfen.` });
  if (st.slip && p.cap === 0) msgs.push({ lvl: 'info', text: T`Aufsteck-Modus: Alle Wände sind ${fmt(p.floor_t)} mm niedriger, damit die Aufsteck-Verbinder bündig sitzen.` });

  // compartment names: each sits on a point, the compartment around that point carries it
  for (const nm of S.names || []) {
    const cell = comps.cellOf(nm.x, nm.y), R = cell && comps.list.find(R => R.id === cell.r);
    if (R && !R.name) R.name = nm.text;
  }
  const bom = buildBom(S, g, nodes, pieces, rails, comps.list.map(R => R.name || ''));
  const conflicts = pieces.filter(pc => pc.bad).length + collisions;
  return { g, H, V, lines, nodes: [...nodes.values()], pieces, rails, comps, bom, msgs, conflicts, itemClash };
}

function findCompartments(S, g, H0, V0) {
  const { W, D } = g;
  // end pieces close the small gap to the drawer wall, so extend those walls to the edge
  const toEdge = (ls, L) => S.settings.border !== 'endcap' ? ls
    : ls.map(l => ({ ...l, a: near(l.a, g.B) ? 0 : l.a, b: near(l.b, L - g.B) ? L : l.b }));
  const H = toEdge(H0, W), V = toEdge(V0, D);
  const uniq = arr => [...new Set(arr.map(v => r2(clamp(v, 0, arr === xsRaw ? W : D)).toFixed(2)))].map(Number).sort((a, b) => a - b);
  const xsRaw = [0, W, ...V.map(l => l.c), ...H.flatMap(l => [l.a, l.b])];
  const ysRaw = [0, D, ...H.map(l => l.c), ...V.flatMap(l => [l.a, l.b])];
  const xs = uniq(xsRaw), ys = uniq(ysRaw);
  const nx = xs.length - 1, ny = ys.length - 1;
  const parent = Array.from({ length: nx * ny }, (_, i) => i);
  const find = i => { while (parent[i] !== i) i = parent[i] = parent[parent[i]]; return i; };
  const join = (a, b) => { parent[find(a)] = find(b); };
  const vBlock = (x, y0, y1) => V.some(l => near(l.c, x) && l.a <= y0 + EPS && l.b >= y1 - EPS);
  const hBlock = (y, x0, x1) => H.some(l => near(l.c, y) && l.a <= x0 + EPS && l.b >= x1 - EPS);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (i < nx - 1 && !vBlock(xs[i + 1], ys[j], ys[j + 1])) join(j * nx + i, j * nx + i + 1);
    if (j < ny - 1 && !hBlock(ys[j + 1], xs[i], xs[i + 1])) join(j * nx + i, (j + 1) * nx + i);
  }
  const regions = new Map();
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const r = find(j * nx + i);
    if (!regions.has(r)) regions.set(r, { id: r, cells: [], x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity, area: 0 });
    const R = regions.get(r);
    R.cells.push([i, j]);
    R.x0 = Math.min(R.x0, xs[i]); R.x1 = Math.max(R.x1, xs[i + 1]);
    R.y0 = Math.min(R.y0, ys[j]); R.y1 = Math.max(R.y1, ys[j + 1]);
    R.area += (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j]);
  }
  const st = S.settings;
  const sideOff = (c, L) => (near(c, 0) || near(c, L)) ? (st.border === 'rail' ? g.railT : 0) : g.t / 2;
  const list = [];
  for (const R of regions.values()) {
    const touchesEdge = near(R.x0, 0) || near(R.y0, 0) || near(R.x1, W) || near(R.y1, D);
    if (st.border === 'frame' && touchesEdge) continue;
    R.rect = Math.abs(R.area - (R.x1 - R.x0) * (R.y1 - R.y0)) < 1;
    R.netW = R.x1 - R.x0 - sideOff(R.x0, W) - sideOff(R.x1, W);
    R.netD = R.y1 - R.y0 - sideOff(R.y0, D) - sideOff(R.y1, D);
    if (R.netW < 3 || R.netD < 3) continue;
    list.push(R);
  }
  const cellOf = (x, y) => {
    const i = xs.findIndex((v, k) => k < nx && x >= v && x <= xs[k + 1]);
    const j = ys.findIndex((v, k) => k < ny && y >= v && y <= ys[k + 1]);
    return i < 0 || j < 0 ? null : { i, j, r: find(j * nx + i) };
  };
  return { list, xs, ys, nx, ny, find, cellOf, sideOff };
}

// ---------------------------------------------------------------------------
// Connector outline (used for SVG, 3D and volume)
// ---------------------------------------------------------------------------
// slotted = true cuts the open wall slots into the arm ends (3D view of normal connectors)
// cornerR rounds the outer corners between two missing arms (frame corners in rounded drawers)
function connOutline(arms, g, p, segs = 8, slotted = false, cornerR = 0) {
  const a = g.armW / 2, L = p.arm, r = Math.max(0, Math.min(p.fillet, L - a));
  const rot = (i, x, y) => [[x, y], [-y, x], [-x, -y], [y, -x]][i];
  const ps = L - p.insert, h = g.slotW / 2;
  const pts = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    if (arms[i] && slotted) pts.push(rot(i, L, -a), rot(i, L, -h), rot(i, ps, -h), rot(i, ps, h), rot(i, L, h), rot(i, L, a));
    else if (arms[i]) pts.push(rot(i, L, -a), rot(i, L, a));
    if (arms[i] && arms[j] && r > 0) {
      for (let k = 0; k <= segs; k++) {
        const t = -Math.PI / 2 - (Math.PI / 2) * k / segs;
        pts.push(rot(i, a + r + r * Math.cos(t), a + r + r * Math.sin(t)));
      }
    } else if (!arms[i] && !arms[j] && cornerR > 0) {
      for (let k = 0; k <= segs; k++) {
        const t = (Math.PI / 2) * k / segs;
        pts.push(rot(i, a - cornerR + cornerR * Math.cos(t), a - cornerR + cornerR * Math.sin(t)));
      }
    } else if (arms[i] && arms[j] || !arms[i] && !arms[j]) pts.push(rot(i, a, a));   // others lie on a straight side
  }
  return pts;
}
const polyArea = pts => Math.abs(pts.reduce((s, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x * y2 - x2 * y; }, 0)) / 2;

function connArms(type, n) {
  if (n && n.dirs) return n.dirs;
  return { cross: [1, 1, 1, 1], tee: [1, 1, 1, 0], corner: [1, 1, 0, 0], corner_round: [1, 1, 0, 0], straight: [1, 0, 1, 0], end: [1, 0, 0, 0],
           slip_cross: [1, 1, 1, 1], slip_tee: [1, 1, 1, 0] }[type];
}

// ---------------------------------------------------------------------------
// Bill of materials
// ---------------------------------------------------------------------------
function connVolume(type, g, p, slipSet) {
  const arms = connArms(type), slip = type.startsWith('slip');
  const cap = slip || slipSet ? Math.max(p.cap, p.floor_t) : p.cap;
  const n = arms.reduce((s, v) => s + v, 0);
  const slotA = slip ? g.slotW * (2 * p.arm + (n - 2) * p.insert) : g.slotW * p.insert * n;
  return polyArea(connOutline(arms, g, p)) * p.height - slotA * (p.height - cap);
}
// Hole centres of the wall pattern, same layout as dd_wall_pattern():
// x from the wall centre, z from the bottom.
function wallHoles(len, h, S) {
  const st = S.settings, p = S.profile, cell = 8, web = 2, hex = st.pattern === 'hex';
  const out = { hex, cell, pts: [] };
  if (st.pattern !== 'hex' && st.pattern !== 'circle') return out;
  const ms = p.insert + 2, mb = 5, mt = 5 + st.grip;
  const Dz = hex ? cell * Math.sqrt(3) + web : 2 * cell + web, ez = hex ? cell * Math.sqrt(3) / 2 : cell;
  const maxW = len - 2 * ms - 2 * cell, maxH = h - mb - mt - 2 * ez;
  if (maxW < 0 || maxH < 0) return out;
  const stagger = maxH >= Dz / 2, sx = stagger ? Dz * Math.sqrt(3) / 2 : 2 * cell + web;
  const cols = Math.floor(maxW / sx) + 1, st2 = stagger && cols > 1;
  const rows = Math.floor((maxH - (st2 ? Dz / 2 : 0)) / Dz) + 1;
  const pw = (cols - 1) * sx, ph = (rows - 1) * Dz + (st2 ? Dz / 2 : 0), z0 = mb + ez + (maxH - ph) / 2;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++)
    out.pts.push([-pw / 2 + c * sx, z0 + r * Dz + (st2 && c % 2 ? Dz / 2 : 0)]);
  return out;
}
function wallHoleFraction(len, h, S) {
  const { hex, cell, pts } = wallHoles(len, h, S);
  const holeA = hex ? 1.5 * Math.sqrt(3) * cell * cell : Math.PI * cell * cell;
  return Math.min(0.6, pts.length * holeA / (len * h));
}

const wallLetter = i => i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + i % 26);
function buildBom(S, g, nodes, pieces, rails, clipNames = []) {
  const p = S.profile, dens = parseFloat(S.settings.density) / 1000;
  const conns = new Map(), walls = new Map(), railMap = new Map();
  for (const n of nodes.values()) if (n.kind === 'conn') conns.set(n.type, (conns.get(n.type) || 0) + 1);
  const wallKey = pc => (Math.floor(pc.len * 10 + 0.05) / 10).toFixed(1) + '|' + r2(pc.h ?? g.wallH);
  for (const pc of pieces) if (pc.len > 0) {
    const len = Math.floor(pc.len * 10 + 0.05) / 10, k = wallKey(pc);
    if (!walls.has(k)) walls.set(k, { len, h: r2(pc.h ?? g.wallH), qty: 0 });
    walls.get(k).qty++;
  }
  for (const r of rails) {
    const k = [r.len, r.offset, r.tongue, r.socket].join('|');
    if (!railMap.has(k)) railMap.set(k, { ...r, qty: 0 });
    railMap.get(k).qty++;
  }
  // walls are lettered A, B, C … longest first; the same letter is engraved and shown in the plan
  const wallList = [...walls.values()].sort((a, b) => b.len - a.len || b.h - a.h);
  wallList.forEach((w, i) => { w.id = wallLetter(i); });
  for (const pc of pieces) if (pc.len > 0) pc.id = walls.get(wallKey(pc)).id;
  const out = {
    connectors: TYPE_ORDER.filter(t => conns.has(t)).map(t => ({ type: t, qty: conns.get(t), g: connVolume(t, g, p, S.settings.slip) * dens })),
    walls: wallList.map(w => ({ ...w, g: w.len * w.h * g.t * (1 - wallHoleFraction(w.len, w.h, S)) * dens })),
    rails: [...railMap.values()].map(r => {
      const teeth = Math.floor(r.len / g.pitch);
      return { ...r, g: (r.len * r.width * S.settings.railPlate + teeth * S.settings.toothT * S.settings.toothH * r.width) * dens };
    }),
  };
  out.extras = [];
  if (S.settings.clips && clipNames.length) {
    // label clip, see dd_label_clip(): U around the wall plus the slanted face, 40 mm wide;
    // one per compartment, named compartments get their name engraved
    const w = 1.2, gap = g.t + 0.15, area = (gap + 2 * w) * (8 + w) - gap * 8 + 12 * w;
    const byName = new Map();
    for (const n of clipNames) byName.set(n, (byName.get(n) || 0) + 1);
    for (const [label, qty] of [...byName].sort((a, b) => !a[0] - !b[0] || a[0].localeCompare(b[0])))
      out.extras.push({ kind: 'clip', label, qty, g: area * 40 * dens });
  }
  const all = [...out.connectors, ...out.walls, ...out.rails, ...out.extras];
  out.parts = all.reduce((s, x) => s + x.qty, 0);
  out.grams = all.reduce((s, x) => s + x.qty * x.g, 0);
  return out;
}

// ---------------------------------------------------------------------------
// State, history, persistence
// ---------------------------------------------------------------------------
let S = loadStored() || withSample(defaultState());
syncAuto(S);
// All drawers of this browser; S is the open one and always shelf.list[shelf.cur].
const SHELF_KEY = 'dd-designer-drawers';
const shelf = (() => {
  try {
    const o = JSON.parse(localStorage.getItem(SHELF_KEY));
    if (o && Array.isArray(o.list) && o.list.length) {
      const list = o.list.map(migrate), cur = clamp(o.cur | 0, 0, list.length - 1);
      list[cur] = S;   // the single-drawer key is written last, it wins
      return { list, cur };
    }
  } catch { /* storage unavailable: just this drawer */ }
  return { list: [S], cur: 0 };
})();
let A = null;
const hist = { past: [], future: [] };
const ui = { tool: 'draw', view: { s: 1, tx: 0, ty: 0 }, drag: null, hover: null, sel: null, mouse: null,
             splitN: 1, splitDir: 'v', shift: false, is3d: false, multi: new Set() };
// the selected walls: the clicked one plus those added with Shift+click
const selWalls = () => ui.sel === null || !S.walls[ui.sel] ? [] : [ui.sel, ...[...ui.multi].filter(i => i !== ui.sel && S.walls[i])];

function loadStored() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch { return null; }
}
function migrate(o) {
  const d = defaultState();
  if (!o || typeof o !== 'object') return d;
  const r = { ...d, ...o, drawer: { ...d.drawer, ...o.drawer }, profile: { ...d.profile, ...o.profile },
              settings: { ...d.settings, ...o.settings }, walls: Array.isArray(o.walls) ? o.walls.filter(w => w && (w.o === 'h' || w.o === 'v')) : [],
              names: Array.isArray(o.names) ? o.names.filter(n => n && isFinite(n.x) && isFinite(n.y) && typeof n.text === 'string').map(n => ({ x: +n.x, y: +n.y, text: cleanName(n.text) })).filter(n => n.text) : [],
              items: Array.isArray(o.items) ? o.items.filter(t => t && [t.x, t.y, t.w, t.d].every(v => isFinite(v)) && t.w > 0 && t.d > 0).map(t => ({ x: +t.x, y: +t.y, w: +t.w, d: +t.d, name: cleanName(t.name || '') })) : [],
              done: Array.isArray(o.done) ? o.done.filter(x => typeof x === 'string') : [] };
  if (['v1', 'v2', 'custom'].includes(r.preset)) r.preset = '';   // old built-in presets
  if (o.settings && !('autoH' in o.settings)) r.settings.autoH = false;   // older saves: keep their own height
  syncAuto(r);
  return r;
}
// a compartment name, also engraved on its clip: one line, no control characters
function cleanName(t) { return String(t).replace(/[\u0000-\u001f\u007f"\\]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 30); }
function persist() {
  shelf.list[shelf.cur] = S;
  try {
    localStorage.setItem(SHELF_KEY, JSON.stringify({ list: shelf.list, cur: shelf.cur }));
    localStorage.setItem(STORE_KEY, JSON.stringify(S));
  } catch { /* storage unavailable */ }
}

function snapshot() { return JSON.stringify(S); }
function commit(before) {
  if (before === snapshot()) return;
  hist.past.push(before); if (hist.past.length > 200) hist.past.shift();
  hist.future = [];
  persist(); render();
}
function mutate(fn) { const before = snapshot(); fn(); commit(before); }
function undo() { if (!hist.past.length) return; hist.future.push(snapshot()); S = { ...JSON.parse(hist.past.pop()), done: S.done }; ui.sel = null; ui.multi.clear(); ui.selComp = null; ui.selItem = null; syncInputs(); persist(); render(); }
function redo() { if (!hist.future.length) return; hist.past.push(snapshot()); S = { ...JSON.parse(hist.future.pop()), done: S.done }; ui.sel = null; ui.multi.clear(); ui.selComp = null; ui.selItem = null; syncInputs(); persist(); render(); }

// equal-split positions so the *net* compartments come out equal
function equalSplit(c0, c1, n, off0, off1, t) {
  const net = (c1 - off1) - (c0 + off0) - (n - 1) * t, each = net / n, out = [];
  for (let k = 1; k < n; k++) out.push(r2(c0 + off0 + k * each + (k - 1) * t + t / 2));
  return out;
}
function gridWalls(St, cols, rows) {
  const g = geom(St), st = St.settings, t = g.t;
  const edgeOff = st.border === 'rail' ? g.railT : st.border === 'frame' ? null : 0;
  const span = (L) => edgeOff === null ? [g.B, L - g.B, t / 2, t / 2] : [0, L, edgeOff, edgeOff];
  const [x0, x1, ox0, ox1] = span(g.W), [y0, y1, oy0, oy1] = span(g.D);
  const xs = equalSplit(x0, x1, cols, ox0, ox1, t), ys = equalSplit(y0, y1, rows, oy0, oy1, t);
  const snapR = (v, axis) => st.border === 'rail' ? nearestOf(railSlots(axis, St, g).slots, v) : v;
  return [...xs.map(x => ({ o: 'v', c: snapR(x, 'x'), a: g.B, b: g.D - g.B })),
          ...ys.map(y => ({ o: 'h', c: snapR(y, 'y'), a: g.B, b: g.W - g.B }))];
}
// positions of the walls between c0 and c1 so the *net* compartments follow the weights
function weightedSplit(c0, c1, w, off0, off1, t) {
  const tot = w.reduce((a, b) => a + b, 0), net = (c1 - off1) - (c0 + off0) - (w.length - 1) * t, out = [];
  let cum = 0;
  for (let k = 1; k < w.length; k++) { cum += w[k - 1]; out.push(r2(c0 + off0 + net * cum / tot + (k - 1) * t + t / 2)); }
  return out;
}
function stripWalls(St, cols, rows) {
  const g = geom(St), st = St.settings, t = g.t;
  const edgeOff = st.border === 'rail' ? g.railT : st.border === 'frame' ? null : 0;
  const span = (L) => edgeOff === null ? [g.B, L - g.B, t / 2, t / 2] : [0, L, edgeOff, edgeOff];
  const [x0, x1, ox0, ox1] = span(g.W), [y0, y1, oy0, oy1] = span(g.D);
  const snapR = (v, axis) => st.border === 'rail' ? nearestOf(railSlots(axis, St, g).slots, v) : v;
  const xs = weightedSplit(x0, x1, cols, ox0, ox1, t).map(x => snapR(x, 'x'));
  const walls = xs.map(x => ({ o: 'v', c: x, a: g.B, b: g.D - g.B }));
  // borders that almost line up with the neighbouring strip snap onto it (dd_lay_align),
  // otherwise the two connectors on the strip wall between them would collide
  let prev = [];
  cols.forEach((_, i) => {
    const a = i === 0 ? g.B : xs[i - 1], b = i === cols.length - 1 ? g.W - g.B : xs[i];
    const ys = weightedSplit(y0, y1, rows[i], oy0, oy1, t).map(y => snapR(y, 'y'))
      .map(y => { const q = nearestOf(prev, y); return prev.length && Math.abs(q - y) < minConnGap(g, St.profile) ? q : y; });
    for (const y of ys) walls.push({ o: 'h', c: y, a, b });
    prev = ys;
  });
  return walls;
}
// a tie (value exactly between two, up to rounding noise) goes to the lower one, like dd_nearest()
const nearestOf = (arr, v) => arr.length ? arr.reduce((b, c) => { const dc = Math.abs(c - v), db = Math.abs(b - v); return dc < db - 1e-6 || (Math.abs(dc - db) <= 1e-6 && c < b) ? c : b; }) : v;
function withSample(St) {
  St.walls = gridWalls(St, 3, 2);
  // one extra split to show a T-junction
  const g = geom(St), xs = St.walls.filter(w => w.o === 'v').map(w => w.c);
  St.walls.push({ o: 'h', c: Math.round(g.D / 4 / 5) * 5, a: xs[1], b: g.W - g.B });
  return St;
}

// ---------------------------------------------------------------------------
// Snapping
// ---------------------------------------------------------------------------
function snapAxis(v, axis, opts = {}) {
  const g = A.g, st = S.settings, L = axis === 'x' ? g.W : g.D;
  const px = 7 / ui.view.s;
  if (v <= g.B + Math.max(px, st.grid / 2)) return r2(g.B);
  if (v >= L - g.B - Math.max(px, st.grid / 2)) return r2(L - g.B);
  // magnet to existing wall coordinates
  const cands = [];
  for (const l of A.lines) {
    if ((axis === 'x') === (l.o === 'v')) cands.push(l.c); else cands.push(l.a, l.b);
  }
  if (!opts.noMagnet) {
    const m = cands.filter(c => Math.abs(c - v) < px).sort((a, b) => Math.abs(a - v) - Math.abs(b - v))[0];
    if (m !== undefined) return m;
  }
  if (st.border === 'rail') return nearestOf(railSlots(axis, S, g).slots, v);
  return r2(clamp(Math.round(v / st.grid) * st.grid, g.B, L - g.B));
}
const snapPt = (x, y) => ({ x: snapAxis(x, 'x'), y: snapAxis(y, 'y') });

// A wall right next to a parallel wall or the drawer edge leaves no room for the
// connectors (they would stick out or overlap). Returns the position to use:
// merged onto the neighbour when it is within one connector width, null when it
// is closer than the minimum gap, otherwise unchanged.
function wallGapCheck(w, skipC = null) {
  const g = A.g, st = S.settings, L = w.o === 'h' ? g.D : g.W;
  const minGap = minConnGap(g, S.profile);
  // drawer sides without frame/end pieces: only the arm has to clear the side (or the rail)
  const sideGap = g.B > 0 ? minGap : S.profile.arm + (st.border === 'rail' ? g.railT : st.noneGap) + 1;
  const cands = [[g.B, sideGap], [L - g.B, sideGap]];
  for (const l of A.lines)
    if (l.o === w.o && l.a < w.b + EPS && l.b > w.a - EPS && !(skipC !== null && near(l.c, skipC))) cands.push([l.c, minGap]);
  let res = { c: w.c, minGap };
  for (const [c, need] of cands.sort((a, b) => Math.abs(a[0] - w.c) - Math.abs(b[0] - w.c))) {
    const dist = Math.abs(c - w.c);
    if (dist < EPS || dist >= need) continue;
    if (dist <= g.armW) return { c: r2(c), minGap };
    res = { c: null, minGap: need };
  }
  return res;
}

// Would these walls leave a wall piece that cannot be printed or connected?
// Runs the full analysis on the changed layout, so every rule of the system applies.
const badPieces = St => analyze(St).conflicts;
const breaksLayout = walls => badPieces({ ...S, walls }) > A.conflicts;
const TOO_CLOSE = () => T`Geht nicht – Verbinder würden sich überschneiden (mind. ${fmt(minConnGap(A.g, S.profile), 0)} mm Wandabstand).`;

// ---------------------------------------------------------------------------
// Rendering: SVG
// ---------------------------------------------------------------------------
const svg = $('#svg'), root = $('#root');

function fit() {
  const wrap = $('#canvasWrap'), cw = wrap.clientWidth, ch = wrap.clientHeight;
  const W = S.drawer.w + 24, D = S.drawer.d + 40;
  const s = Math.max(0.05, Math.min((cw - 60) / W, (ch - 130) / D));
  ui.view = { s, tx: (cw - S.drawer.w * s) / 2, ty: (ch - S.drawer.d * s) / 2 + 30 };
  applyView();
}
function applyView() {
  const v = ui.view;
  root.setAttribute('transform', `translate(${v.tx},${v.ty}) scale(${v.s})`);
  $('#szoom').textContent = Math.round(v.s * 100 / 2) + ' %';
}
function toMM(e) {
  const r = svg.getBoundingClientRect();
  return { x: (e.clientX - r.left - ui.view.tx) / ui.view.s, y: (e.clientY - r.top - ui.view.ty) / ui.view.s };
}

function connSvg(n, g, p, cls) {
  const arms = n.dirs, pts = connOutline(arms, g, p, 8, false, n.type === 'corner_round' ? g.cornerR : 0);
  const d = 'M' + pts.map(([x, y]) => `${r2(x + n.x)},${r2(y + n.y)}`).join('L') + 'Z';
  let slots = '';
  const sw = g.slotW, L = p.arm;
  for (let i = 0; i < 4; i++) {
    if (!arms[i]) continue;
    const thru = n.through && ((n.through === 'h' && (i === 0 || i === 2)) || (n.through === 'v' && (i === 1 || i === 3)));
    const from = thru ? 0 : g.pocket, len = L - from;
    const [x, y, w, h] = [[n.x + from, n.y - sw / 2, len, sw], [n.x - sw / 2, n.y + from, sw, len],
                          [n.x - L, n.y - sw / 2, len, sw], [n.x - sw / 2, n.y - L, sw, len]][i];
    slots += `<rect class="slot" x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}"/>`;
  }
  return `<path class="${cls}" d="${d}"/>${slots}`;
}

const COMP_COLORS = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'];

function drawSVG() {
  const g = A.g, p = S.profile, st = S.settings, { W, D } = g, s = ui.view.s;
  const out = [];
  const dw = 6 / s * 2.2;
  out.push(`<rect class="drawer-wall" x="${-dw}" y="${-dw}" width="${W + 2 * dw}" height="${D + 2 * dw}" rx="${dw}"/>`);
  out.push(`<rect class="drawer-in" x="0" y="0" width="${W}" height="${D}" rx="${S.drawer.r || 0}"/>`);

  // grid
  const step = st.border === 'rail' ? null : st.grid;
  const minor = step && step * s >= 6 ? step : null;
  let gp = '';
  if (minor) {
    for (let x = minor; x < W; x += minor) gp += `<line class="${Math.abs(x % 50) < 1e-6 ? 'g-major' : 'g-minor'}" x1="${x}" y1="0" x2="${x}" y2="${D}"/>`;
    for (let y = minor; y < D; y += minor) gp += `<line class="${Math.abs(y % 50) < 1e-6 ? 'g-major' : 'g-minor'}" x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  } else {
    for (let x = 50; x < W; x += 50) gp += `<line class="g-major" x1="${x}" y1="0" x2="${x}" y2="${D}"/>`;
    for (let y = 50; y < D; y += 50) gp += `<line class="g-major" x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  }
  out.push(gp);
  out.push(`<text class="edge-label" x="${W / 2}" y="${D + dw + 16 / s}" style="font-size:${11 / s}px">${T('Vorne')}</text>`);

  // compartments
  A.comps.list.forEach((R, i) => {
    const col = `var(${COMP_COLORS[i % COMP_COLORS.length]})`;
    for (const [ci, cj] of R.cells) {
      const x0 = A.comps.xs[ci], x1 = A.comps.xs[ci + 1], y0 = A.comps.ys[cj], y1 = A.comps.ys[cj + 1];
      out.push(`<rect class="comp" fill="${col}" x="${x0}" y="${y0}" width="${r2(x1 - x0)}" height="${r2(y1 - y0)}"/>`);
    }
  });
  if (ui.tool === 'split' && ui.splitRegion) {
    const R = ui.splitRegion;
    for (const [ci, cj] of R.cells) {
      const x0 = A.comps.xs[ci], x1 = A.comps.xs[ci + 1], y0 = A.comps.ys[cj], y1 = A.comps.ys[cj + 1];
      out.push(`<rect class="region-hl" x="${x0}" y="${y0}" width="${r2(x1 - x0)}" height="${r2(y1 - y0)}"/>`);
    }
  }
  // the photo lies over the compartment colours, walls and outlines stay on top
  if (bg.url && bg.id === S.bgId) out.push(`<image class="bg-photo" href="${bg.url}" x="0" y="0" width="${W}" height="${D}" preserveAspectRatio="none" opacity="${S.bgOpacity ?? 0.6}"/>`);
  const selR = ui.tool === 'select' && ui.selComp ? compAt(ui.selComp) : null;
  if (selR) for (const [ci, cj] of selR.cells) {
    const x0 = A.comps.xs[ci], x1 = A.comps.xs[ci + 1], y0 = A.comps.ys[cj], y1 = A.comps.ys[cj + 1];
    out.push(`<rect class="region-hl sel" x="${x0}" y="${y0}" width="${r2(x1 - x0)}" height="${r2(y1 - y0)}"/>`);
  }
  if (g.B > 0) out.push(`<rect class="inset" x="${g.B}" y="${g.B}" width="${r2(W - 2 * g.B)}" height="${r2(D - 2 * g.B)}"/>`);
  (S.items || []).forEach((it, i) => {
    const fz = Math.min(11 / s, it.w / Math.max(4, (it.name || '').length * 0.62), it.d / 3);
    const vert = it.d > it.w * 1.6 && it.name;   // long thin things: the name runs along them
    const cx = it.x + it.w / 2, cy = it.y + it.d / 2, fv = Math.min(11 / s, it.d / Math.max(4, (it.name || '').length * 0.62), it.w * 0.7);
    out.push(`<g class="item${ui.selItem === i ? ' sel' : ''}${A.itemClash.has(i) ? ' clash' : ''}"><rect class="item-box" x="${r2(it.x)}" y="${r2(it.y)}" width="${r2(it.w)}" height="${r2(it.d)}" rx="${r2(Math.min(3, it.w / 4, it.d / 4))}"/>`
      + (vert ? (fv * s >= 6 ? `<text class="item-txt" x="${r2(cx)}" y="${r2(cy)}" transform="rotate(-90 ${r2(cx)} ${r2(cy)})" style="font-size:${r2(fv)}px">${esc(it.name)}</text>` : '')
              : (it.name && fz * s >= 6 ? `<text class="item-txt" x="${r2(cx)}" y="${r2(cy)}" style="font-size:${r2(fz)}px">${esc(it.name)}</text>` : ''))
      + '</g>');
  });

  // rails
  for (const r of A.rails) {
    const th = g.railT, plate = st.railPlate;
    let x, y, w, h, teeth = '';
    if (r.axis === 'y') { y = r.s; h = r.e - r.s; w = plate; x = r.side === 'L' ? 0 : W - plate; }
    else { x = r.s; w = r.e - r.s; h = plate; y = r.side === 'T' ? 0 : D - plate; }
    for (let c = r.s + r.offset; c + st.toothT <= r.e + EPS; c += g.pitch) {
      teeth += r.axis === 'y'
        ? `<rect class="tooth" x="${r.side === 'L' ? plate : W - th}" y="${r2(c)}" width="${st.toothH}" height="${st.toothT}"/>`
        : `<rect class="tooth" x="${r2(c)}" y="${r.side === 'T' ? plate : D - th}" width="${st.toothT}" height="${st.toothH}"/>`;
    }
    out.push(`<rect class="rail" x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}"/>${teeth}`);
  }

  // connectors
  for (const n of A.nodes) if (n.kind === 'conn')
    out.push(connSvg(n, g, p, 'conn' + (S.settings.slip ? ' slip' : '') + (n.joint ? ' joint' : '') + (n.clash ? ' clash' : '')));

  // walls – drawn over the connectors so the part that sits in the slot stays visible
  const hlLines = ui.tool === 'select' ? selWalls().map(i => S.walls[i]) : [];
  for (const pc of A.pieces) {
    const t = g.t;
    const [x, y, w, h] = pc.o === 'h' ? [pc.s, pc.c - t / 2, pc.e - pc.s, t] : [pc.c - t / 2, pc.s, t, pc.e - pc.s];
    let cls = 'wall' + (pc.bad ? ' bad' : '');
    if (hlLines.some(hl => hl.o === pc.o && near(hl.c, pc.c) && pc.s < Math.max(hl.a, hl.b) && pc.e > Math.min(hl.a, hl.b))) cls += ' hl';
    if (pc.h < g.wallH - EPS) cls += ' low';
    if (ui.eraseHL && ui.eraseHL.o === pc.o && near(ui.eraseHL.c, pc.c) && pc.s < ui.eraseHL.b && pc.e > ui.eraseHL.a) cls += ' erase';
    out.push(`<rect class="${cls}" x="${r2(x)}" y="${r2(y)}" width="${r2(Math.max(0.3, w))}" height="${r2(Math.max(0.3, h))}"/>`);
  }

  // wall letters from the parts list – the assembly plan
  const bs = 7 / s;
  if (st.labels || ui.printing) for (const pc of A.pieces) if (pc.id && pc.len > 3 * bs) {
    // a quarter along the wall, clear of the compartment sizes in the middle
    const q = pc.s + (pc.e - pc.s) * (pc.len > 4 * bs ? 0.25 : 0.5);
    const [x, y] = pc.o === 'h' ? [q, pc.c] : [pc.c, q];
    out.push(`<g class="wall-tag"><circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(bs * 1.15)}"/><text x="${r2(x)}" y="${r2(y)}" style="font-size:${r2(bs * (pc.id.length > 1 ? 1.1 : 1.45))}px">${pc.id}</text></g>`);
  }

  // labels
  const fs = 11 / s;
  if (fs < 40) for (const R of A.comps.list) {
    const w = R.x1 - R.x0, h = R.y1 - R.y0;
    const label = R.rect ? `${fmt(R.netW, 0)} × ${fmt(R.netD, 0)}` : `${fmt(R.area / 100, 0)} cm²`;
    const cw = R.rect ? w : A.comps.xs[R.cells[0][0] + 1] - A.comps.xs[R.cells[0][0]];
    const fsz = Math.min(fs * 1.15, cw / (label.length * 0.62), h / 2.2);
    const cx = R.rect ? (R.x0 + R.x1) / 2 : (A.comps.xs[R.cells[0][0]] + A.comps.xs[R.cells[0][0] + 1]) / 2;
    const cy = R.rect ? (R.y0 + R.y1) / 2 : (A.comps.ys[R.cells[0][1]] + A.comps.ys[R.cells[0][1] + 1]) / 2;
    if (R.name) {
      // the name above, the size small below it
      const nsz = Math.min(fs * 1.3, cw / ([...R.name].length * 0.62), h / 3.2);
      if (nsz * s >= 6) out.push(`<text class="comp-label comp-name" x="${r2(cx)}" y="${r2(cy - nsz * 0.55)}" style="font-size:${r2(nsz)}px">${esc(R.name)}</text>`);
      if (fsz * 0.8 * s >= 6) out.push(`<text class="comp-label" x="${r2(cx)}" y="${r2(cy + fsz * 0.75)}" style="font-size:${r2(fsz * 0.8)}px">${label}</text>`);
    } else if (fsz * s >= 7) out.push(`<text class="comp-label" x="${r2(cx)}" y="${r2(cy)}" style="font-size:${r2(fsz)}px">${label}</text>`);
  }
  if (s > 1.4) for (const pc of A.pieces) {
    if (pc.len < 25) continue;
    // dimension line over the full printed length, ticks at the wall ends inside the connectors
    const m = (pc.s + pc.e) / 2, tk = 4 / s, side = pc.c < (pc.o === 'h' ? D : W) / 2 ? 1 : -1, dc = pc.c + side * (g.t / 2 + 9 / s);
    out.push(pc.o === 'h'
      ? `<path class="dimline" d="M${r2(pc.s)},${r2(dc)}H${r2(pc.e)}M${r2(pc.s)},${r2(dc - tk)}V${r2(dc + tk)}M${r2(pc.e)},${r2(dc - tk)}V${r2(dc + tk)}"/>`
      : `<path class="dimline" d="M${r2(dc)},${r2(pc.s)}V${r2(pc.e)}M${r2(dc - tk)},${r2(pc.s)}H${r2(dc + tk)}M${r2(dc - tk)},${r2(pc.e)}H${r2(dc + tk)}"/>`);
    const [x, y] = pc.o === 'h' ? [m, dc] : [dc, m];
    out.push(`<text class="dim" x="${r2(x)}" y="${r2(y)}" ${pc.o === 'v' ? `transform="rotate(-90 ${r2(x)} ${r2(y)})"` : ''} style="font-size:${r2(10 / s)}px">${fmt(pc.len)}</text>`);
  }

  // previews
  const d = ui.drag;
  if (d && d.type === 'draw' && d.p1) {
    out.push(`<line class="preview" x1="${d.p0.x}" y1="${d.p0.y}" x2="${d.p1.x}" y2="${d.p1.y}"/>`);
    const L = Math.abs(d.p1.x - d.p0.x) + Math.abs(d.p1.y - d.p0.y);
    out.push(`<text class="dim" x="${(d.p0.x + d.p1.x) / 2}" y="${(d.p0.y + d.p1.y) / 2 - 10 / s}" style="font-size:${12 / s}px;fill:var(--sel)">${fmt(L)} mm</text>`);
  }
  if (ui.tool === 'draw' && ui.mouse && !d) {
    const q = snapPt(ui.mouse.x, ui.mouse.y);
    out.push(`<circle class="cursor-dot" cx="${q.x}" cy="${q.y}" r="${3 / s}"/>`);
  }
  const ms = ui.measure;
  if (ms && (ms.p0.x !== ms.p1.x || ms.p0.y !== ms.p1.y)) {
    const { p0, p1 } = ms, dx = Math.abs(p1.x - p0.x), dy = Math.abs(p1.y - p0.y), L = Math.hypot(dx, dy);
    const txt = fmt(L) + ' mm' + (dx > EPS && dy > EPS ? `  (${fmt(dx)} × ${fmt(dy)})` : '');
    const fz = 12 / s, bw = txt.length * fz * 0.58 + 10 / s, bh = fz * 1.7, mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2 - bh;
    out.push(`<line class="measure" x1="${p0.x}" y1="${p0.y}" x2="${p1.x}" y2="${p1.y}"/>`,
             `<circle class="measure-end" cx="${p0.x}" cy="${p0.y}" r="${3 / s}"/><circle class="measure-end" cx="${p1.x}" cy="${p1.y}" r="${3 / s}"/>`,
             `<rect class="measure-box" x="${r2(mx - bw / 2)}" y="${r2(my - bh / 2)}" width="${r2(bw)}" height="${r2(bh)}" rx="${r2(4 / s)}"/>`,
             `<text class="measure-txt" x="${r2(mx)}" y="${r2(my)}" style="font-size:${r2(fz)}px">${txt}</text>`);
  }
  if (ui.tool === 'measure' && ui.mouse && !d) {
    const q = measurePt(ui.mouse);
    out.push(`<circle class="cursor-dot" cx="${q.x}" cy="${q.y}" r="${3 / s}"/>`);
  }
  if (ui.tool === 'split' && ui.splitPreview)
    for (const w of ui.splitPreview)
      out.push(w.o === 'v' ? `<line class="preview-split${ui.splitBad ? ' bad' : ''}" x1="${w.c}" y1="${w.a}" x2="${w.c}" y2="${w.b}"/>`
                           : `<line class="preview-split${ui.splitBad ? ' bad' : ''}" x1="${w.a}" y1="${w.c}" x2="${w.b}" y2="${w.c}"/>`);
  root.innerHTML = out.join('');
}

// ---------------------------------------------------------------------------
// Rendering: side panels
// ---------------------------------------------------------------------------
function iconSvg(kind, type) {
  if (kind === 'clip') return `<svg viewBox="0 0 28 28"><path d="M12 24V8h4v16M12 8L5 15" fill="none" stroke="var(--wall)" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
  if (kind === 'wall') return `<svg viewBox="0 0 28 28"><rect x="2" y="11" width="24" height="6" rx="1" fill="var(--wall)"/></svg>`;
  if (kind === 'rail') return `<svg viewBox="0 0 28 28"><rect x="2" y="17" width="24" height="3" fill="var(--rail)"/>${[4, 9, 14, 19, 24].map(x => `<rect x="${x - 1}" y="11" width="2" height="6" fill="var(--rail)"/>`).join('')}</svg>`;
  const g = { armW: 7.2, slotW: 2.2, pocket: 6 }, p = { arm: 12, fillet: 5 };
  const n = { x: 14, y: 14, dirs: connArms(type), through: type.startsWith('slip') ? 'v' : null };
  if (type === 'slip_tee') n.dirs = [1, 1, 0, 1];
  return `<svg viewBox="0 0 28 28">${connSvg(n, g, p, 'conn' + (S.settings.slip ? ' slip' : '') + (type === 'straight' ? ' joint' : ''))}</svg>`;
}

// filament length (1.75 mm), material cost and a rough print time from the weight
function usage(grams) {
  const st = S.settings, dens = parseFloat(st.density) || 1.24;
  const meters = grams / dens * 1000 / (Math.PI * 0.875 * 0.875) / 1000;
  const hours = grams / Math.max(1, +st.rate || 20);
  const mins = Math.round(hours * 60 / 5) * 5;
  const time = !grams ? '0' : mins < 60 ? `${Math.max(5, mins)} min` : `${Math.floor(mins / 60)} h${mins % 60 ? ' ' + (mins % 60) + ' min' : ''}`;
  return { meters, cost: grams / 1000 * (+st.price || 0), hours, time };
}
const wallBadge = id => `<span class="wall-badge">${id}</span>`;
// Print checklist: one line per plate, ticked plates are remembered by their contents
function drawChecklist(plates) {
  $('#printSec').hidden = !plates.length;
  const done = new Set(S.done || []), n = plates.filter(pl => done.has(pl.label)).length;
  $('#printCount').textContent = plates.length ? `${n}/${plates.length}` : '';
  $('#printList').innerHTML = plates.map((pl, i) => `<label class="check"><input type="checkbox" data-plate="${esc(pl.label)}"${done.has(pl.label) ? ' checked' : ''}><span>${T`Platte ${i + 1}`}<small title="${esc(pl.label)}">${esc(pl.label)}</small></span></label>`).join('');
}
$('#printList').addEventListener('change', e => {
  const l = e.target.dataset.plate;
  if (l === undefined) return;
  const done = new Set(S.done || []);
  if (e.target.checked) done.add(l); else done.delete(l);
  // only plates that still exist
  const now = new Set(platesFor().map(pl => pl.label));
  S.done = [...done].filter(x => now.has(x));
  persist(); drawPanels();
});
$('#printReset').addEventListener('click', () => { S.done = []; persist(); drawPanels(); });

function drawPanels() {
  const b = A.bom, g = A.g;
  drawMenu();
  $('#tParts').textContent = b.parts;
  $('#tComp').textContent = A.comps.list.length;
  $('#tGrams').textContent = fmt(b.grams, 0);
  const use = usage(b.grams);
  $('#tGramsU').textContent = T`g Filament · ${fmt(use.meters, use.meters < 10 ? 1 : 0)} m`;
  $('#tCost').textContent = fmt(use.cost, 2);
  $('#tCostU').textContent = T`${S.settings.currency || ''} Material ca.`;
  $('#tTime').textContent = use.time;
  const plates = b.parts ? platesFor() : [];
  $('#tPlates').textContent = plates.length;
  drawChecklist(plates);
  $('#bomCount').textContent = b.parts ? T`${b.parts} Teile` : '';

  let h = '';
  const item = (ico, name, sub, qty, grams) =>
    `<div class="bom-item"><div class="bom-ico">${ico}</div><div><div class="bom-name">${name}</div><div class="bom-sub">${sub}</div></div><div class="bom-qty">${qty}<small>×</small></div></div>`;
  if (b.connectors.length) {
    h += `<div class="bom-group"><h4><span>${T`Verbinder · ${fmt(S.profile.height)} mm hoch`}</span><span>${b.connectors.reduce((s, c) => s + c.qty, 0)}</span></h4>`;
    for (const c of b.connectors) h += item(iconSvg('conn', c.type), typeName(c.type), T`${typeDesc(c.type)} · ca. ${fmt(c.g)} g`, c.qty);
    h += '</div>';
  }
  if (b.walls.length) {
    h += `<div class="bom-group"><h4><span>${T`Wände · ${fmt(g.t)} × ${fmt(g.wallH)} mm`}</span><span>${b.walls.reduce((s, c) => s + c.qty, 0)}</span></h4>`;
    for (const w of b.walls) h += item(wallBadge(w.id), `${fmt(w.len)} mm`, T`Höhe ${fmt(w.h)} mm · ca. ${fmt(w.g)} g`, w.qty);
    h += '</div>';
  }
  if (b.extras.length) {
    h += `<div class="bom-group"><h4><span>${T('Zubehör')}</span><span>${b.extras.reduce((s, c) => s + c.qty, 0)}</span></h4>`;
    for (const x of b.extras) h += item(iconSvg('clip'), esc(clipName(x)), (x.label ? T('Name eingraviert') : T('Wird oben auf eine Wand gesteckt')) + T` · ca. ${fmt(x.g)} g`, x.qty);
    h += '</div>';
  }
  if (b.rails.length) {
    h += `<div class="bom-group"><h4><span>${T('Raster-Schienen')}</span><span>${b.rails.reduce((s, c) => s + c.qty, 0)}</span></h4>`;
    for (const r of b.rails) h += item(iconSvg('rail'), `${fmt(r.len)} mm`, T`Breite ${fmt(r.width)} · Versatz ${fmt(r.offset, 2)}` + (r.tongue ? T(' · Zapfen') : '') + (r.socket ? T(' · Buchse') : ''), r.qty);
    h += '</div>';
  }
  $('#bom').innerHTML = h || `<div class="empty">${T('Noch keine Teile – zeichne Wände in die Schublade.')}</div>`;

  const icon = { err: '⛔', warn: '⚠️', info: 'ℹ️' };
  const seen = new Set();
  const msgs = A.msgs.filter(m => !seen.has(m.text) && seen.add(m.text));
  $('#msgs').innerHTML = msgs.length ? msgs.map(m => `<div class="msg ${m.lvl}"><span>${icon[m.lvl]}</span><span>${esc(m.text)}</span></div>`).join('')
                                     : '<div class="msg info"><span>✓</span><span>' + T('Alles passt.') + '</span></div>';

  const sec = $('#selSec');
  const sel = selWalls(), full = r2(A.g.wallH);
  const hField = (h) => `<label class="field" title="${T('Niedrigere Wände, z.B. vorne zum besseren Hineingreifen. Leer = volle Höhe.')}"><span>${T('Wandhöhe')}</span><div class="unit" data-u="mm"><input type="number" id="wallH" min="10" max="${full}" step="1" placeholder="${fmt(full)}" value="${h || ''}"></div></label>`;
  const num = (id, v) => { const el = $(id); return el ? parseFloat(el.value) : v; };
  if (ui.selItem != null && S.items[ui.selItem]) {
    const i = ui.selItem, t = S.items[i];
    sec.hidden = false;
    $('#selInfo').innerHTML = `<label class="field"><span>${T('Gegenstand')}</span><input type="text" id="itemName" maxlength="30" value="${esc(t.name)}"></label>
      <div class="row2">
        <label class="field"><span>${T('Breite')}</span><div class="unit" data-u="mm"><input type="number" id="itemW" min="5" step="1" value="${r2(t.w)}"></div></label>
        <label class="field"><span>${T('Länge')}</span><div class="unit" data-u="mm"><input type="number" id="itemD" min="5" step="1" value="${r2(t.d)}"></div></label>
      </div>
      <div class="row2"><button class="btn" id="itemRot">${T('Drehen')}</button><button class="btn" id="itemDel">${T('Entfernen')}</button></div>
      <p class="hint">${T('Nur zum Planen – wird nicht gedruckt. Ziehen zum Verschieben.')}</p>`;
    $('#itemName').addEventListener('change', e => editItem(i, t => { t.name = cleanName(e.target.value) || T('Gegenstand'); }));
    $('#itemW').addEventListener('change', e => editItem(i, t => { t.w = parseFloat(e.target.value) || t.w; }));
    $('#itemD').addEventListener('change', e => editItem(i, t => { t.d = parseFloat(e.target.value) || t.d; }));
    $('#itemRot').addEventListener('click', () => editItem(i, t => { const cx = t.x + t.w / 2, cy = t.y + t.d / 2; [t.w, t.d] = [t.d, t.w]; t.x = r2(cx - t.w / 2); t.y = r2(cy - t.d / 2); }));
    $('#itemDel').addEventListener('click', () => { ui.selItem = null; mutate(() => S.items.splice(i, 1)); });
  } else if (sel.length > 1) {
    const ws = sel.map(i => S.walls[i]), same = ws.every(w => w.o === ws[0].o);
    const hs = new Set(ws.map(w => w.h || 0));
    sec.hidden = false;
    $('#selInfo').innerHTML = `<p style="margin:0 0 8px"><b>${T`${sel.length} Wände ausgewählt`}</b></p>
      ${hField(hs.size === 1 ? [...hs][0] : '')}
      ${same ? `<button class="btn" id="btnDist" style="width:100%">${T('Gleich verteilen')}</button>` : ''}
      <p class="hint">${same ? T('Verteilt die Wände so, dass die Fächer zwischen den Nachbarwänden gleich groß werden.') : T('Zum Verteilen nur parallele Wände auswählen.')} ${T('Shift+Klick wählt Wände ab.')}</p>`;
    $('#wallH').addEventListener('change', () => setWallsH(sel, num('#wallH')));
    if (same) $('#btnDist').addEventListener('click', () => distribute(sel));
  } else if (sel.length) {
    const i = sel[0], w = S.walls[i];
    const parts = A.pieces.filter(pc => pc.o === w.o && near(pc.c, w.c) && pc.s < Math.max(w.a, w.b) && pc.e > Math.min(w.a, w.b));
    sec.hidden = false;
    $('#selInfo').innerHTML = `<div class="row2">
        <label class="field"><span>${T('Position')} ${w.o === 'h' ? 'Y' : 'X'}</span><div class="unit" data-u="mm"><input type="number" id="wallPos" step="0.5" value="${r2(w.c)}"></div></label>
        ${hField(w.h)}</div>
      <dl><dt>${T('Richtung')}</dt><dd>${w.o === 'h' ? T('waagerecht') : T('senkrecht')}</dd>
      <dt>${T('Mittellinie')}</dt><dd>${fmt(Math.abs(w.b - w.a))} mm</dd>
      <dt>${T('Druckteile')}</dt><dd>${parts.map(pc => fmt(pc.len) + ' mm').join(', ') || '–'}</dd></dl>
      <p class="hint">${T('Ziehen zum Verschieben · Entf zum Löschen · Shift+Klick wählt weitere Wände')}</p>`;
    $('#wallPos').addEventListener('change', () => setWallPos(i, num('#wallPos')));
    $('#wallH').addEventListener('change', () => setWallsH([i], num('#wallH')));
  } else if (ui.selComp && compAt(ui.selComp)) {
    const R = compAt(ui.selComp), pt = ui.selComp;
    sec.hidden = false;
    $('#selInfo').innerHTML = `<label class="field"><span>${T('Name des Fachs')}</span><input type="text" id="compName" maxlength="30" placeholder="${T('z.B. Schrauben')}" value="${esc(R.name || '')}"></label>
      ${R.rect ? `<div class="row2">
        <label class="field"><span>${T('Breite innen')}</span><div class="unit" data-u="mm"><input type="number" id="compW" step="0.5" min="1" value="${r2(R.netW)}"></div></label>
        <label class="field"><span>${T('Tiefe innen')}</span><div class="unit" data-u="mm"><input type="number" id="compD" step="0.5" min="1" value="${r2(R.netD)}"></div></label></div>`
        : `<dl><dt>${T('Fläche')}</dt><dd>${fmt(R.area / 100, 0)} cm²</dd></dl>`}
      <p class="hint">${S.settings.clips ? T('Der Name wird in den Beschriftungsclip des Fachs graviert.') : T('Mit „Beschriftungsclips“ (Trenner) wird der Name in einen Clip graviert.')}${R.rect ? ' ' + T('Ein neues Maß verschiebt die Nachbarwand.') : ''}</p>`;
    $('#compName').addEventListener('change', e => setCompName(pt, e.target.value));
    if (R.rect) {
      $('#compW').addEventListener('change', () => setCompSize(pt, 'x', num('#compW')));
      $('#compD').addEventListener('change', () => setCompSize(pt, 'y', num('#compD')));
    }
  } else {
    // nothing selected: tell people what a click on a wall or a compartment offers
    sec.hidden = false;
    $('#selInfo').innerHTML = `<p class="hint" style="margin:0 0 8px">${T('Wand anklicken: Position und Wandhöhe – z.B. vorne niedriger zum Hineingreifen.')}<br>${T('Fach anklicken: Name für den Beschriftungsclip und Innenmaße.')}</p>
      ${ui.tool !== 'select' ? `<button class="btn" id="selTool" style="width:100%">${T('Auswählen-Werkzeug (V)')}</button>` : ''}`;
    if (ui.tool !== 'select') $('#selTool').addEventListener('click', () => setTool('select'));
  }
}

// Printed assembly plan: parts by letter and the steps for this edge mode.
function drawPlan() {
  const b = A.bom, st = S.settings;
  const edge = { frame: T('Rahmen'), endcap: T('Endstücke'), rail: T('Raster-Schienen'), none: T('direkt geklemmt') }[st.border];
  const steps = [];
  const use = usage(b.grams);
  steps.push(T`Alle Teile drucken (${b.parts} Teile auf ${b.parts ? platesFor().length : 0} Druckplatten, ca. ${fmt(b.grams, 0)} g, ca. ${use.time}).` + (st.labels ? T(' In jedes Wandende ist sein Buchstabe und seine Länge graviert.') : ''));
  if (st.border === 'rail') steps.push(T('Raster-Schienen an die Schubladenseiten kleben oder schrauben – zusammengesetzte Schienen mit Zapfen in die Buchse stecken.'));
  if (st.border === 'frame') steps.push(T('Mit dem Rahmen beginnen: Ecken, T-Stücke und die Außenwände zu einem Rechteck zusammenstecken.'));
  if (b.connectors.some(c => c.type === 'straight')) steps.push(T('Geteilte lange Wände mit den geraden Verlängerungen verbinden.'));
  steps.push(st.slip
    ? T('Die durchgehenden Wände aufstellen, die kurzen Wände dazwischen stellen und dann die Verbinder von oben aufstecken.')
    : T('Innenwände nach dem Plan einsetzen – die Buchstaben im Plan zeigen, welche Wand wohin gehört. Von einer Seite zur anderen arbeiten, jeweils Wand in den Verbinder schieben.'));
  if (st.border === 'endcap') steps.push(T('Die Endstücke sitzen an der Schubladenwand – das Ganze am Stück in die Schublade setzen.'));
  else if (st.border !== 'rail') steps.push(T('Das fertige Gitter in die Schublade setzen.'));
  if (b.extras.length) steps.push(b.extras.some(x => x.label) ? T('Die Beschriftungsclips oben auf die Wände ihrer Fächer stecken – unbenannte mit Stift beschriften.')
                                                               : T('Beschriftungsclips beschriften und oben auf die Wände der Fächer stecken.'));
  $('#plan').innerHTML = `<h4>${esc(S.name)}</h4>
    <div class="hint">${T`Schublade ${S.drawer.w} × ${S.drawer.d} × ${S.drawer.h} mm · Rand: ${edge}`}${st.slip ? T(' · Aufsteck-Verbinder') : ''} · ${T`Wände ${fmt(A.g.t)} × ${fmt(A.g.wallH)} mm`}</div>
    <table><tr><th>${T('Teil')}</th><th>${T('Maß')}</th><th>${T('Anzahl')}</th></tr>
      ${b.walls.map(w => `<tr><td><b>${T`Wand ${w.id}`}</b></td><td>${fmt(w.len)} mm</td><td>${w.qty}×</td></tr>`).join('')}
      ${b.connectors.map(c => `<tr><td>${typeName(c.type)}</td><td>${T`${fmt(S.profile.height)} mm hoch`}</td><td>${c.qty}×</td></tr>`).join('')}
      ${b.rails.map(r => `<tr><td>${T('Schiene')}</td><td>${fmt(r.len)} mm</td><td>${r.qty}×</td></tr>`).join('')}
      ${b.extras.map(x => `<tr><td>${esc(clipName(x))}</td><td>${T('40 mm breit')}</td><td>${x.qty}×</td></tr>`).join('')}
    </table>
    <ol>${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`;
}
addEventListener('beforeprint', () => { ui.printing = true; drawSVG(); });
addEventListener('afterprint', () => { ui.printing = false; drawSVG(); });

function render() {
  if (S.bgId !== bg.id) loadPhoto();
  A = analyze(S);
  drawSVG();
  drawPanels();
  drawPlan();
  if (ui.is3d) build3D();
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------
const getPath = (o, path) => path.split('.').reduce((x, k) => x[k], o);
const setPath = (o, path, v) => { const ks = path.split('.'), last = ks.pop(); ks.reduce((x, k) => x[k], o)[last] = v; };

function syncInputs() {
  $('#projName').value = S.name;
  for (const el of $$('[data-k]')) {
    const v = getPath(S, el.dataset.k);
    if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
  }
  for (const r of $$('input[name=border]')) r.checked = r.value === S.settings.border;
  fillProfiles();
}

// Wall ends that sit on the drawer edge follow it when the edge moves
// (drawer size, border mode or connector size changed); ends that butt
// against a moved wall follow that wall.
function remapEdges(g0) {
  const g1 = geom(S), rail = S.settings.border === 'rail';
  const slots = rail ? { x: railSlots('x', S, g1).slots, y: railSlots('y', S, g1).slots } : null;
  const moved = { h: new Map(), v: new Map() };
  const mapC = w => {
    const M0 = w.o === 'h' ? g0.D : g0.W, M1 = w.o === 'h' ? g1.D : g1.W;
    let c = w.c;
    if (Math.abs(c - g0.B) < 0.05) c = g1.B; else if (Math.abs(c - (M0 - g0.B)) < 0.05) c = M1 - g1.B;
    if (rail) c = nearestOf(slots[w.o === 'h' ? 'y' : 'x'], c);
    moved[w.o].set(w.c.toFixed(2), r2(c));
    return r2(c);
  };
  const cs = S.walls.map(mapC);
  S.walls = S.walls.map((w, i) => {
    const L0 = w.o === 'h' ? g0.W : g0.D, L1 = w.o === 'h' ? g1.W : g1.D;
    const cross = moved[w.o === 'h' ? 'v' : 'h'];
    const end = (u, edge0, edge1) => Math.abs(u - edge0) < 0.05 ? edge1 : cross.get(u.toFixed(2)) ?? u;
    return { o: w.o, c: cs[i], a: r2(end(w.a, g0.B, g1.B)), b: r2(end(w.b, L0 - g0.B, L1 - g1.B)) };
  });
}
// Changing the edge mode scales the inner walls with the usable width, so equal
// compartments stay equal. Rail mode snaps walls into the tooth pitch; leaving it
// without having edited anything restores the walls from before.
const innerStart = (g, border) => border === 'frame' ? g.B + g.t / 2 : border === 'rail' ? g.railT : 0;
function switchBorder(to) {
  const from = S.settings.border;
  let walls = S.walls, fromB = from;
  if (from === 'rail' && S.railMemo && JSON.stringify(S.walls) === S.railMemo.snapped) { walls = JSON.parse(S.railMemo.walls); fromB = S.railMemo.border; }
  delete S.railMemo;
  const g0 = geom({ ...S, settings: { ...S.settings, border: fromB } });
  S.settings.border = to;
  const g1 = geom(S), s0 = innerStart(g0, fromB), s1 = innerStart(g1, to);
  const map = (u, L) => Math.abs(u - g0.B) < 0.05 ? r2(g1.B) : Math.abs(u - (L - g0.B)) < 0.05 ? r2(L - g1.B)
                      : r2(s1 + (u - s0) * (L - 2 * s1) / (L - 2 * s0));
  const slots = to === 'rail' ? { x: railSlots('x', S, g1).slots, y: railSlots('y', S, g1).slots } : null;
  const snap = (u, L, axis) => !slots || u <= g1.B + 0.05 || u >= L - g1.B - 0.05 ? u : nearestOf(slots[axis], u);
  S.walls = walls.map(w => {
    const Lc = w.o === 'h' ? g1.D : g1.W, La = w.o === 'h' ? g1.W : g1.D, axc = w.o === 'h' ? 'y' : 'x', axa = w.o === 'h' ? 'x' : 'y';
    return { o: w.o, c: snap(map(w.c, Lc), Lc, axc), a: snap(map(w.a, La), La, axa), b: snap(map(w.b, La), La, axa) };
  });
  if (to === 'rail') S.railMemo = { border: fromB, walls: JSON.stringify(walls), snapped: JSON.stringify(S.walls) };
}

function setWithRemap(path, v) {
  if (path === 'settings.border') { if (v !== S.settings.border) switchBorder(v); return; }
  const g0 = geom(S), wasRail = S.settings.border === 'rail';
  setPath(S, path, v);
  if (path === 'profile.height') S.settings.autoH = false;   // typing a height means "manual"
  syncAuto(S);
  const g1 = geom(S);
  if (g0.B !== g1.B || g0.W !== g1.W || g0.D !== g1.D || (!wasRail && S.settings.border === 'rail') || (S.settings.border === 'rail' && (g0.pitch !== g1.pitch || g0.railT !== g1.railT))) remapEdges(g0);
}

let inputBefore = null;
for (const el of $$('[data-k]')) {
  el.addEventListener('focus', () => { inputBefore = snapshot(); });
  const apply = () => {
    const before = inputBefore || snapshot();
    let v = el.type === 'checkbox' ? el.checked : el.type === 'number' ? parseFloat(el.value) : el.value;
    if (el.type === 'number') { if (!isFinite(v)) return; if (el.min !== '' && v < +el.min) v = +el.min; }
    setWithRemap(el.dataset.k, v);
    if (el.dataset.k.startsWith('drawer.')) fit();
    commit(before); inputBefore = snapshot();
    syncInputs();
  };
  el.addEventListener('change', apply);
  if (el.type === 'number') el.addEventListener('input', () => {
    const v = parseFloat(el.value);
    if (!isFinite(v)) return;
    setWithRemap(el.dataset.k, v);
    $('[data-k="settings.autoH"]').checked = !!S.settings.autoH;
    render();
  });
}
// Profiles: everything except drawer, edge mode and walls, kept in this browser
function loadProfiles() { try { return JSON.parse(localStorage.getItem(PROFILES_KEY)) || {}; } catch { return {}; } }
function storeProfiles(all) { try { localStorage.setItem(PROFILES_KEY, JSON.stringify(all)); } catch { flash(T('Profile können in diesem Browser nicht gespeichert werden.')); } }
function fillProfiles() {
  const all = loadProfiles(), names = Object.keys(all).sort((a, b) => a.localeCompare(b, 'de'));
  $('#profSel').innerHTML = `<option value="">${T('Standard')}</option>` + names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
  $('#profSel').value = all[S.preset] ? S.preset : '';
  $('#profDel').disabled = !all[S.preset];
}
function applyProfile(name, src) {
  if (!src) { flash(T('Profil nicht gefunden.')); fillProfiles(); return; }
  mutate(() => {
    const g0 = geom(S), keep = Object.fromEntries(PER_DRAWER.map(k => [k, S.settings[k]]));
    S.profile = { ...DEFAULT_PROFILE, ...src.profile };
    S.settings = { ...defaultSettings(), ...src.settings, ...keep };
    S.preset = name;
    syncAuto(S);
    remapEdges(g0);
  });
  syncInputs();
}
$('#profSel').addEventListener('change', e => {
  const name = e.target.value;
  applyProfile(name, name ? loadProfiles()[name] : { profile: DEFAULT_PROFILE, settings: defaultSettings() });
});
$('#profReset').addEventListener('click', () => applyProfile('', { profile: DEFAULT_PROFILE, settings: defaultSettings() }));
$('#profSave').addEventListener('click', async () => {
  const name = await ask(T('Profil speichern'), { text: T('Name für das Profil, z.B. dein Drucker:'), input: S.preset || T('Mein Drucker'), ok: T('Speichern') });
  if (!name) return;
  const all = loadProfiles(), settings = { ...S.settings };
  for (const k of PER_DRAWER) delete settings[k];
  all[name] = { profile: { ...S.profile }, settings };
  storeProfiles(all);
  S.preset = name; persist(); fillProfiles();
  flash(T`Profil „${name}“ gespeichert.`);
});
$('#profDel').addEventListener('click', async () => {
  const all = loadProfiles();
  if (!all[S.preset] || !await ask(T`Profil „${S.preset}“ löschen?`, { ok: T('Löschen') })) return;
  delete all[S.preset]; storeProfiles(all);
  S.preset = ''; persist(); fillProfiles();
});
for (const r of $$('input[name=border]')) r.addEventListener('change', () => mutate(() => setWithRemap('settings.border', r.value)));
$('#projName').addEventListener('change', e => mutate(() => { S.name = e.target.value.trim() || T('Schublade'); }));

// ---------------------------------------------------------------------------
// Tools & pointer interaction
// ---------------------------------------------------------------------------
function setTool(t) {
  ui.tool = t; ui.drag = null; ui.eraseHL = null; ui.measure = null; ui.splitPreview = null; ui.splitRegion = null;
  if (t !== 'select') { ui.sel = null; ui.multi.clear(); ui.selComp = null; ui.selItem = null; }
  for (const b of $$('.tool[data-tool]')) b.classList.toggle('on', b.dataset.tool === t);
  svg.setAttribute('class', 't-' + t);
  $('#splitBar').classList.toggle('show', t === 'split');
  const hints = { draw: T('Klicken & ziehen, um eine Wand zu zeichnen. Endpunkte rasten an Rand, Raster und bestehenden Wänden ein.'),
                  split: T('In ein Fach klicken, um es zu teilen. Zahl 1–6 = Anzahl Fächer, Shift = Richtung.'),
                  select: T('Wand anklicken zum Auswählen, ziehen zum Verschieben. Fach anklicken (oder doppelklicken), um es zu benennen.'),
                  erase: T('Wandstück zwischen zwei Verbindern anklicken, um es zu entfernen.'),
                  measure: T('Ziehen, um einen Abstand zu messen. Rastet an Wänden und Raster ein, Shift = frei.') };
  $('#shint').textContent = hints[t];
  render();
}
for (const b of $$('.tool[data-tool]')) b.addEventListener('click', () => setTool(b.dataset.tool));
for (const c of $$('#splitBar [data-n]')) c.addEventListener('click', () => { ui.splitN = +c.dataset.n; syncSplitBar(); });
for (const c of $$('#splitBar [data-dir]')) c.addEventListener('click', () => { ui.splitDir = c.dataset.dir; syncSplitBar(); });
function syncSplitBar() {
  for (const c of $$('#splitBar [data-n]')) c.classList.toggle('on', +c.dataset.n === ui.splitN);
  for (const c of $$('#splitBar [data-dir]')) c.classList.toggle('on', c.dataset.dir === ui.splitDir);
}

function hitUserWall(m) {
  const tol = 7 / ui.view.s + A.g.t / 2;
  let best = null, bd = Infinity;
  S.walls.forEach((w, i) => {
    const a = Math.min(w.a, w.b), b = Math.max(w.a, w.b);
    const [u, v] = w.o === 'h' ? [m.x, m.y] : [m.y, m.x];
    const du = u < a ? a - u : u > b ? u - b : 0, dv = Math.abs(v - w.c), d = Math.hypot(du, dv);
    if (d < tol && d < bd) { bd = d; best = i; }
  });
  return best;
}
function hitLineInterval(m) {
  const tol = 7 / ui.view.s + A.g.t / 2;
  let best = null, bd = Infinity;
  for (const l of A.lines) {
    const [u, v] = l.o === 'h' ? [m.x, m.y] : [m.y, m.x];
    if (u < l.a - tol || u > l.b + tol) continue;
    const d = Math.abs(v - l.c);
    if (d < tol && d < bd) {
      bd = d;
      const st = l.stops; let i = st.findIndex((s, k) => k < st.length - 1 && u >= s && u <= st[k + 1]);
      if (i < 0) i = u < st[0] ? 0 : st.length - 2;
      best = { o: l.o, c: l.c, a: st[i], b: st[i + 1], frame: l.frame };
    }
  }
  return best;
}
function hitNode(m) {
  const tol = Math.max(A.g.armW / 2, 6 / ui.view.s);
  return A.nodes.find(n => n.kind === 'conn' && Math.abs(n.x - m.x) < tol && Math.abs(n.y - m.y) < tol);
}

// the compartment under a point (null on a wall or outside)
// Moves walls to new positions ([[index, c], …]). Walls ending on a moved wall go along:
// their end point follows, so the compartments stay closed. Ends are matched against the
// old positions, so moving several walls at once cannot drag an end twice.
function moveWalls(moves) {
  const orig = S.walls.map(w => ({ ...w })), moved = new Set(moves.map(m => m[0]));
  for (const [i, c] of moves) {
    const w = orig[i], lo = Math.min(w.a, w.b) - EPS, hi = Math.max(w.a, w.b) + EPS;
    orig.forEach((q, j) => {
      if (moved.has(j) || q.o === w.o || q.c < lo || q.c > hi) return;
      if (near(q.a, w.c)) S.walls[j].a = c;
      if (near(q.b, w.c)) S.walls[j].b = c;
    });
    S.walls[i].c = c;
  }
}
// rail mode: walls sit in the rail slots
const onSlot = (c, o) => S.settings.border === 'rail' ? nearestOf(railSlots(o === 'v' ? 'x' : 'y', S, A.g).slots, c) : r2(c);
// applies a wall change; takes it back when it would leave parts that do not fit
function tryWalls(fn) {
  const before = snapshot(), was = A.conflicts;
  fn();
  if (badPieces(S) > was) { S = JSON.parse(before); flash(TOO_CLOSE()); render(); return false; }
  commit(before);
  return true;
}
function setWallPos(i, v) {
  const w = S.walls[i], g = A.g, L = w.o === 'h' ? g.D : g.W;
  if (!w || !isFinite(v)) return;
  const c = onSlot(clamp(v, g.B, L - g.B), w.o);
  const chk = wallGapCheck({ o: w.o, c, a: Math.min(w.a, w.b), b: Math.max(w.a, w.b) }, w.c);
  if (chk.c === null) { flash(T`Zu nah an der Nachbarwand oder am Rand – mindestens ${fmt(chk.minGap, 0)} mm Abstand.`); render(); return; }
  tryWalls(() => moveWalls([[i, chk.c]]));
}
// own height for the selected walls; empty or the full height = normal
function setWallsH(list, v) {
  const full = A.g.wallH;
  mutate(() => {
    for (const i of list) {
      if (!isFinite(v) || v >= full - EPS) delete S.walls[i].h;
      else S.walls[i].h = r2(clamp(v, 10, full));
    }
  });
}
// net width (axis 'x') or depth ('y') of a rectangular compartment: the wall on the far
// side moves (or the near one, when the far side is the drawer edge or the frame)
function setCompSize(pt, axis, net) {
  const R = compAt(pt), C = A.comps, g = A.g;
  if (!R || !R.rect || !isFinite(net) || net <= 0) return;
  const [lo, hi, L, o, plo, phi] = axis === 'x' ? [R.x0, R.x1, g.W, 'v', R.y0, R.y1] : [R.y0, R.y1, g.D, 'h', R.x0, R.x1];
  const at = c => S.walls.map((w, i) => i).filter(i => {
    const w = S.walls[i];
    return w.o === o && near(w.c, c) && Math.min(w.a, w.b) < phi - EPS && Math.max(w.a, w.b) > plo + EPS;
  });
  let idx = at(hi), c;
  if (idx.length) c = lo + C.sideOff(lo, L) + net + g.t / 2;
  else if ((idx = at(lo)).length) c = hi - C.sideOff(hi, L) - net - g.t / 2;
  else { flash(T('Dieses Fach wird nur vom Rand begrenzt – seine Größe ergibt sich aus der Schublade.')); render(); return; }
  c = onSlot(clamp(c, g.B, L - g.B), o);
  tryWalls(() => moveWalls(idx.map(i => [i, c])));
}
// spaces the selected parallel walls so the compartments between their neighbours come out equal
function distribute(list) {
  const ws = list.map(i => S.walls[i]), o = ws[0].o, g = A.g, L = o === 'v' ? g.W : g.D;
  if (ws.some(w => w.o !== o)) { flash(T('Zum Verteilen nur parallele Wände auswählen.')); return; }
  const a = Math.max(...ws.map(w => Math.min(w.a, w.b))), b = Math.min(...ws.map(w => Math.max(w.a, w.b)));
  const cs = ws.map(w => w.c), minC = Math.min(...cs), maxC = Math.max(...cs);
  const par = A.lines.filter(l => l.o === o && l.a < b - EPS && l.b > a + EPS && !cs.some(c => near(c, l.c))).map(l => l.c);
  const lo = Math.max(0, ...par.filter(c => c < minC - EPS)), hi = Math.min(L, ...par.filter(c => c > maxC + EPS));
  const pos = equalSplit(lo, hi, ws.length + 1, A.comps.sideOff(lo, L), A.comps.sideOff(hi, L), g.t).map(c => onSlot(c, o));
  const order = [...list].sort((i, j) => S.walls[i].c - S.walls[j].c);
  tryWalls(() => moveWalls(order.map((i, k) => [i, pos[k]])));
}

// ---- touch: two fingers zoom and pan, whatever tool is active ----------------------
const touches = new Map();
function cancelDrag() {
  const d = ui.drag;
  if (d && d.before && (d.type === 'move' || d.type === 'item')) S = JSON.parse(d.before);
  if (d && d.type === 'measure') ui.measure = null;
  ui.drag = null; svg.classList.remove('panning');
  render();
}
function startPinch() {
  const [a, b] = [...touches.values()], r = svg.getBoundingClientRect();
  const mid = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
  ui.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: ui.view.s, cx: (mid.x - ui.view.tx) / ui.view.s, cy: (mid.y - ui.view.ty) / ui.view.s };
}
function movePinch() {
  const [a, b] = [...touches.values()], r = svg.getBoundingClientRect(), P = ui.pinch;
  const mid = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
  const ns = clamp(P.s0 * Math.hypot(a.x - b.x, a.y - b.y) / P.d0, 0.05, 40);
  ui.view = { s: ns, tx: mid.x - P.cx * ns, ty: mid.y - P.cy * ns };
  applyView(); drawSVG();
}

// ---- things to plan around (outlines, not printed) ----------------------------------
function hitItem(m) {
  const its = S.items || [];
  for (let i = its.length - 1; i >= 0; i--) { const t = its[i]; if (m.x >= t.x && m.x <= t.x + t.w && m.y >= t.y && m.y <= t.y + t.d) return i; }
  return null;
}
// rough sizes (width × length in mm); the dialog lets you correct them
const ITEM_PRESETS = [
  [T('Werkstatt'), [[T('Schraubendreher'), 30, 200], [T('Bit-Box'), 75, 115], [T('Zollstock'), 17, 235], [T('Maßband'), 70, 70], [T('Cuttermesser'), 25, 160],
                    [T('Kombizange'), 55, 180], [T('Inbus-Set'), 40, 120], [T('Schere'), 75, 200], [T('Taschenlampe'), 30, 150], [T('Batterien AA (4er)'), 30, 55]]],
  [T('Küche'), [[T('Messer'), 20, 220], [T('Gabel'), 25, 200], [T('Esslöffel'), 45, 200], [T('Teelöffel'), 30, 140], [T('Schneebesen'), 60, 270],
                [T('Pfannenwender'), 80, 300], [T('Dosenöffner'), 50, 180], [T('Sparschäler'), 30, 160]]],
  [T('Büro'), [[T('Kugelschreiber'), 12, 145], [T('Bleistift'), 8, 175], [T('Lineal 30 cm'), 30, 310], [T('Notizblock A6'), 105, 148], [T('Klebeband-Abroller'), 60, 130],
               [T('Tacker'), 40, 150], [T('Haftnotizen'), 76, 76], [T('USB-Stick'), 20, 60]]],
];
function openItemDialog() {
  const sel = $('#itPreset');
  if (!sel.options.length) {
    sel.innerHTML = `<option value="">${T('Eigene Maße')}</option>` + ITEM_PRESETS.map(([grp, list], gi) =>
      `<optgroup label="${esc(grp)}">${list.map(([n, w, d], k) => `<option value="${gi}:${k}">${esc(n)} – ${w} × ${d} mm</option>`).join('')}</optgroup>`).join('');
    sel.addEventListener('change', () => {
      if (!sel.value) return;
      const [gi, k] = sel.value.split(':').map(Number), [n, w, d] = ITEM_PRESETS[gi][1][k];
      $('#itName').value = n; $('#itW').value = w; $('#itD').value = d;
    });
  }
  sel.value = ''; $('#itName').value = ''; $('#itW').value = 30; $('#itD').value = 150;
  $('#itemDlg').showModal(); $('#itName').focus();
}
$('#btnItem').addEventListener('click', openItemDialog);
$('#itCancel').addEventListener('click', e => { e.preventDefault(); $('#itemDlg').close(); });
$('#itOk').addEventListener('click', e => {
  e.preventDefault();
  const g = A.g, w = clamp(parseFloat($('#itW').value) || 30, 5, g.W), d = clamp(parseFloat($('#itD').value) || 150, 5, g.D);
  const name = cleanName($('#itName').value) || T('Gegenstand');
  $('#itemDlg').close();
  setTool('select');
  mutate(() => { S.items = S.items || []; S.items.push({ x: r2((g.W - w) / 2), y: r2((g.D - d) / 2), w, d, name }); });
  ui.selItem = S.items.length - 1; render();
  flash(T('Gegenstand eingefügt – mit „Auswählen“ verschieben, Fächer drumherum zeichnen.'));
});
function editItem(i, fn) { mutate(() => { const t = S.items[i]; fn(t); t.w = clamp(t.w, 5, A.g.W); t.d = clamp(t.d, 5, A.g.D); t.x = clamp(t.x, 0, A.g.W - t.w); t.y = clamp(t.y, 0, A.g.D - t.d); }); }

// ---- mirror and rotate the whole layout ----------------------------------------------
function transformLayout(kind) {
  const W = S.drawer.w, D = S.drawer.d, lo = w => Math.min(w.a, w.b), hi = w => Math.max(w.a, w.b);
  mutate(() => {
    if (kind === 'mx') {
      for (const w of S.walls) if (w.o === 'v') w.c = r2(W - w.c); else [w.a, w.b] = [r2(W - hi(w)), r2(W - lo(w))];
      for (const n of S.names) n.x = r2(W - n.x);
      for (const t of S.items) t.x = r2(W - t.x - t.w);
    } else if (kind === 'my') {
      for (const w of S.walls) if (w.o === 'h') w.c = r2(D - w.c); else [w.a, w.b] = [r2(D - hi(w)), r2(D - lo(w))];
      for (const n of S.names) n.y = r2(D - n.y);
      for (const t of S.items) t.y = r2(D - t.y - t.d);
    } else {
      // a quarter turn clockwise: (x, y) -> (D - y, x)
      S.walls = S.walls.map(w => w.o === 'v' ? { ...w, o: 'h', c: w.c, a: r2(D - hi(w)), b: r2(D - lo(w)) }
                                             : { ...w, o: 'v', c: r2(D - w.c), a: lo(w), b: hi(w) });
      S.names = S.names.map(n => ({ ...n, x: r2(D - n.y), y: n.x }));
      S.items = S.items.map(t => ({ ...t, x: r2(D - t.y - t.d), y: t.x, w: t.d, d: t.w }));
      S.drawer.w = D; S.drawer.d = W;
    }
    if (S.settings.border === 'rail') {
      const g = geom(S);
      for (const w of S.walls) w.c = nearestOf(railSlots(w.o === 'v' ? 'x' : 'y', S, g).slots, w.c);
    }
    ui.sel = null; ui.multi.clear(); ui.selComp = null; ui.selItem = null;
  });
  if (bg.url && S.bgId) transformPhoto(kind);
  syncInputs(); fit(); render();
}
const xfMenu = $('#xfMenu');
$('#btnXf').addEventListener('click', e => { e.stopPropagation(); xfMenu.classList.toggle('open'); });
document.addEventListener('click', () => xfMenu.classList.remove('open'));
for (const b of $$('[data-xf]')) b.addEventListener('click', () => { xfMenu.classList.remove('open'); transformLayout(b.dataset.xf); });

// measuring snaps like drawing (walls, grid, edges); Shift measures freely
const measurePt = m => ui.shift ? { x: r2(m.x), y: r2(m.y) } : snapPt(m.x, m.y);
function compAt(m) {
  const cell = A.comps.cellOf(m.x, m.y);
  return cell ? A.comps.list.find(R => R.id === cell.r) || null : null;
}
function setCompName(pt, text) {
  const R = compAt(pt);
  if (!R) return;
  text = cleanName(text);
  mutate(() => {
    S.names = (S.names || []).filter(n => compAt(n) !== R);
    if (text) S.names.push({ x: r2(pt.x), y: r2(pt.y), text });
  });
}
async function nameDialog(m) {
  const R = compAt(m);
  if (!R) return;
  const t = await ask(T('Fach benennen'), { text: T('Erscheint im Plan und auf dem Beschriftungsclip. Leer lassen entfernt den Namen.'), input: R.name || '', allowEmpty: true });
  if (t !== null) setCompName(m, t);
}

function computeSplit(m) {
  ui.splitPreview = null; ui.splitRegion = null;
  const C = A.comps, cell = C.cellOf(m.x, m.y);
  if (!cell) return;
  const R = C.list.find(R => R.id === cell.r);
  if (!R) return;
  ui.splitRegion = R;
  const g = A.g, dir = ui.shift ? (ui.splitDir === 'v' ? 'h' : 'v') : ui.splitDir;
  const inR = (i, j) => C.find(j * C.nx + i) === R.id;
  // extent of the region along the new wall, through the cell under the cursor
  const runAt = (fixedIdx) => {
    let lo, hi;
    if (dir === 'v') { lo = cell.j; hi = cell.j; while (lo > 0 && inR(fixedIdx, lo - 1)) lo--; while (hi < C.ny - 1 && inR(fixedIdx, hi + 1)) hi++; return [C.ys[lo], C.ys[hi + 1]]; }
    lo = cell.i; hi = cell.i; while (lo > 0 && inR(lo - 1, fixedIdx)) lo--; while (hi < C.nx - 1 && inR(hi + 1, fixedIdx)) hi++; return [C.xs[lo], C.xs[hi + 1]];
  };
  const clampEdge = (v, L) => near(v, 0) ? g.B : near(v, L) ? L - g.B : v;
  let coords;
  if (ui.splitN > 1 && R.rect) {
    const [c0, c1, L] = dir === 'v' ? [R.x0, R.x1, g.W] : [R.y0, R.y1, g.D];
    coords = equalSplit(c0, c1, ui.splitN, C.sideOff(c0, L), C.sideOff(c1, L), g.t);
    if (S.settings.border === 'rail') coords = coords.map(c => nearestOf(railSlots(dir === 'v' ? 'x' : 'y', S, g).slots, c));
  } else coords = [dir === 'v' ? snapAxis(m.x, 'x', { noMagnet: true }) : snapAxis(m.y, 'y', { noMagnet: true })];
  ui.splitPreview = coords.map(c => {
    const fixed = dir === 'v' ? C.xs.findIndex((v, k) => k < C.nx && c >= v && c <= C.xs[k + 1]) : C.ys.findIndex((v, k) => k < C.ny && c >= v && c <= C.ys[k + 1]);
    const [a, b] = runAt(fixed < 0 ? (dir === 'v' ? cell.i : cell.j) : fixed);
    const L = dir === 'v' ? g.D : g.W;
    return { o: dir, c, a: r2(clampEdge(a, L)), b: r2(clampEdge(b, L)) };
  }).filter(w => w.b - w.a > 1);
  // line up with walls that end on the same wall from the other side, refuse what does not fit
  let bad = false;
  for (const w of ui.splitPreview) { const chk = wallGapCheck(w); if (chk.c === null) bad = true; else w.c = chk.c; }
  const key = JSON.stringify(ui.splitPreview) + JSON.stringify(S.walls) + geom(S).inset;
  if (ui.splitKey !== key) { ui.splitKey = key; ui.splitBadSim = ui.splitPreview.length > 0 && breaksLayout(S.walls.concat(ui.splitPreview)); }
  ui.splitBad = bad || ui.splitBadSim;
}

svg.addEventListener('contextmenu', e => e.preventDefault());
svg.addEventListener('pointerdown', e => {
  const m = toMM(e);
  svg.setPointerCapture(e.pointerId);
  if (e.pointerType === 'touch') {
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) { cancelDrag(); startPinch(); return; }
    if (touches.size > 2) return;
  }
  if (e.button === 1 || e.button === 2 || (e.button === 0 && ui.space)) {
    ui.drag = { type: 'pan', x: e.clientX, y: e.clientY, tx: ui.view.tx, ty: ui.view.ty };
    svg.classList.add('panning'); return;
  }
  if (e.button !== 0 || ui.is3d) return;
  if (ui.tool === 'draw') ui.drag = { type: 'draw', p0: snapPt(m.x, m.y), p1: null };
  else if (ui.tool === 'select') {
    const i = hitUserWall(m);
    if (e.shiftKey && i !== null && ui.sel !== null) {
      // Shift+click adds or removes a wall, for heights and even spacing
      if (i === ui.sel) { const rest = selWalls().slice(1); ui.sel = rest.length ? rest[0] : null; ui.multi = new Set(rest.slice(1)); }
      else if (ui.multi.has(i)) ui.multi.delete(i); else ui.multi.add(i);
      render(); return;
    }
    const it = i === null ? hitItem(m) : null;
    ui.selItem = it;
    if (it !== null) {
      const t = S.items[it];
      ui.sel = null; ui.multi.clear(); ui.selComp = null; ui.selItem = null;
      ui.drag = { type: 'item', idx: it, start: m, x0: t.x, y0: t.y, before: snapshot() };
      render(); return;
    }
    ui.sel = i; ui.multi.clear(); ui.selComp = i === null && compAt(m) ? { x: r2(m.x), y: r2(m.y) } : null;
    if (i !== null) ui.drag = { type: 'move', idx: i, start: m, c0: S.walls[i].c, before: snapshot() };
    render();
  } else if (ui.tool === 'erase') {
    const iv = hitLineInterval(m);
    if (!iv) return;
    if (iv.frame) { flash(T('Der Rahmen gehört zum Randmodus „Rahmen" – ändere links den Rand, um ihn zu entfernen.')); return; }
    mutate(() => eraseInterval(iv));
  } else if (ui.tool === 'measure') {
    const q = measurePt(m);
    ui.measure = { p0: q, p1: q }; ui.drag = { type: 'measure' }; drawSVG();
  } else if (ui.tool === 'split') {
    computeSplit(m);
    if (ui.splitPreview && ui.splitPreview.length) {
      if (ui.splitBad) { flash(TOO_CLOSE() + T(' Weniger Fächer wählen.')); return; }
      const add = ui.splitPreview; mutate(() => S.walls.push(...add)); computeSplit(m); drawSVG();
    }
  }
});
svg.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' && touches.has(e.pointerId)) {
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ui.pinch) { movePinch(); return; }
  }
  const m = toMM(e);
  ui.mouse = m;
  $('#sx').textContent = fmt(m.x) + ' mm'; $('#sy').textContent = fmt(m.y) + ' mm';
  const d = ui.drag;
  if (d && d.type === 'pan') { ui.view.tx = d.tx + e.clientX - d.x; ui.view.ty = d.ty + e.clientY - d.y; applyView(); return; }
  if (d && d.type === 'draw') {
    const q = snapPt(m.x, m.y);
    d.p1 = Math.abs(q.x - d.p0.x) >= Math.abs(q.y - d.p0.y) ? { x: q.x, y: d.p0.y } : { x: d.p0.x, y: q.y };
  } else if (d && d.type === 'item') {
    const t = S.items[d.idx];
    t.x = r2(clamp(Math.round(d.x0 + m.x - d.start.x), 0, Math.max(0, A.g.W - t.w)));
    t.y = r2(clamp(Math.round(d.y0 + m.y - d.start.y), 0, Math.max(0, A.g.D - t.d)));
    render(); return;
  } else if (d && d.type === 'measure') {
    ui.measure.p1 = measurePt(m);
  } else if (d && d.type === 'move') {
    const w = S.walls[d.idx], delta = w.o === 'h' ? m.y - d.start.y : m.x - d.start.x;
    const nc = snapAxis(d.c0 + delta, w.o === 'h' ? 'y' : 'x', { noMagnet: true });
    if (nc !== w.c) { S.walls = JSON.parse(d.before).walls; moveWalls([[d.idx, nc]]); render(); return; }
  } else if (ui.tool === 'erase') ui.eraseHL = hitLineInterval(m);
  else if (ui.tool === 'split') computeSplit(m);
  const n = !d && hitNode(m);
  showTip(e, n ? `${typeName(n.type)}${n.joint ? T(' (Verlängerung)') : ''}` : null);
  drawSVG();
});
svg.addEventListener('pointercancel', e => { touches.delete(e.pointerId); if (touches.size < 2) ui.pinch = null; cancelDrag(); });
svg.addEventListener('pointerup', e => {
  if (e.pointerType === 'touch') {
    touches.delete(e.pointerId);
    if (ui.pinch) { if (touches.size < 2) { ui.pinch = null; ui.drag = null; } return; }
  }
  const d = ui.drag; ui.drag = null; svg.classList.remove('panning');
  if (!d) return;
  if (d.type === 'item') { commit(d.before); return; }
  if (d.type === 'draw' && d.p1) {
    const w = d.p0.y === d.p1.y ? { o: 'h', c: d.p0.y, a: Math.min(d.p0.x, d.p1.x), b: Math.max(d.p0.x, d.p1.x) }
                                : { o: 'v', c: d.p0.x, a: Math.min(d.p0.y, d.p1.y), b: Math.max(d.p0.y, d.p1.y) };
    const chk = w.b - w.a >= 2 ? wallGapCheck(w) : null;
    if (chk && chk.c !== null && breaksLayout(S.walls.concat({ ...w, c: chk.c }))) { flash(TOO_CLOSE()); drawSVG(); }
    else if (chk && chk.c !== null) mutate(() => S.walls.push({ ...w, c: chk.c }));
    else { if (chk) flash(T`Zu nah an der Nachbarwand oder am Rand – mindestens ${fmt(chk.minGap, 0)} mm Abstand, sonst passen die Verbinder nicht.`); drawSVG(); }
  } else if (d.type === 'move') {
    const w = S.walls[d.idx], restore = () => { S.walls = JSON.parse(d.before).walls; };
    const chk = wallGapCheck({ o: w.o, c: w.c, a: Math.min(w.a, w.b), b: Math.max(w.a, w.b) }, w.c);
    if (chk.c === null) { restore(); flash(T`Zu nah an der Nachbarwand oder am Rand – mindestens ${fmt(chk.minGap, 0)} mm Abstand.`); }
    else if (chk.c !== w.c) { restore(); moveWalls([[d.idx, chk.c]]); }
    if (S.walls[d.idx].c !== d.c0 && badPieces(S) > badPieces(JSON.parse(d.before))) { restore(); flash(TOO_CLOSE()); }
    render();
    commit(d.before);
  } else drawSVG();
});
svg.addEventListener('dblclick', e => {
  if (ui.is3d || !['select', 'draw'].includes(ui.tool)) return;
  const m = toMM(e);
  if (hitUserWall(m) === null) nameDialog(m);
});
svg.addEventListener('pointerleave', () => { ui.mouse = null; ui.eraseHL = null; ui.splitPreview = null; ui.splitRegion = null; showTip(null); if (!ui.drag) drawSVG(); });
svg.addEventListener('wheel', e => {
  e.preventDefault();
  const r = svg.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
  const f = Math.exp(-e.deltaY * 0.0015), v = ui.view, ns = clamp(v.s * f, 0.05, 40);
  v.tx = mx - (mx - v.tx) * ns / v.s; v.ty = my - (my - v.ty) * ns / v.s; v.s = ns;
  applyView(); drawSVG();
}, { passive: false });

function eraseInterval(iv) {
  const next = [];
  for (const w of S.walls) {
    const a = Math.min(w.a, w.b), b = Math.max(w.a, w.b);
    if (w.o !== iv.o || !near(w.c, iv.c) || b <= iv.a + EPS || a >= iv.b - EPS) { next.push(w); continue; }
    if (iv.a - a > 1) next.push({ o: w.o, c: w.c, a, b: iv.a });
    if (b - iv.b > 1) next.push({ o: w.o, c: w.c, a: iv.b, b });
  }
  S.walls = next;
}

function showTip(e, text) {
  const tip = $('#tip');
  if (!text) { tip.style.display = 'none'; return; }
  tip.textContent = text; tip.style.display = 'block';
  tip.style.left = (e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 14) + 'px';
}
let flashTimer;
function flash(text) { $('#shint').textContent = text; clearTimeout(flashTimer); flashTimer = setTimeout(() => setTool(ui.tool), 4000); }

// keyboard
window.addEventListener('keydown', e => {
  if (e.target.matches('input, select, textarea') || document.querySelector('dialog[open]')) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === 'w') setTool('draw'); else if (k === 's') setTool('split'); else if (k === 'v') setTool('select'); else if (k === 'e') setTool('erase');
  else if (k === 'm') setTool('measure');
  else if (k === 'g') openItemDialog();
  else if (k === 'f') fit();
  else if (k === ' ') { ui.space = true; e.preventDefault(); }
  else if (k === 'escape') { ui.drag = null; ui.sel = null; ui.multi.clear(); ui.selComp = null; ui.selItem = null; ui.measure = null; render(); }
  else if ((k === 'delete' || k === 'backspace') && ui.selItem != null && S.items[ui.selItem]) { const i = ui.selItem; ui.selItem = null; mutate(() => S.items.splice(i, 1)); }
  else if ((k === 'delete' || k === 'backspace') && ui.sel !== null) {
    const del = selWalls().sort((a, b) => b - a); ui.sel = null; ui.multi.clear();
    mutate(() => { for (const i of del) S.walls.splice(i, 1); });
  }
  else if (ui.tool === 'split' && /^[1-6]$/.test(k)) { ui.splitN = +k; syncSplitBar(); }
  if (e.key === 'Shift' && !ui.shift) { ui.shift = true; if (ui.mouse && ui.tool === 'split') { computeSplit(ui.mouse); drawSVG(); } }
});
window.addEventListener('keyup', e => {
  if (e.key === ' ') ui.space = false;
  if (e.key === 'Shift') { ui.shift = false; if (ui.mouse && ui.tool === 'split') { computeSplit(ui.mouse); drawSVG(); } }
});

// In-page replacement for confirm()/prompt(), which some browsers and embedded views block.
// Resolves to true / the entered text, or null when cancelled.
function ask(title, { text = '', input = null, ok = 'OK', allowEmpty = false } = {}) {
  const dlg = $('#askDlg');
  $('#askTitle').textContent = title;
  $('#askText').textContent = text; $('#askText').hidden = !text;
  $('#askField').hidden = input === null;
  $('#askInput').maxLength = input && input.length > 60 ? 100000 : 60;   // long values: share links
  $('#askInput').value = input ?? '';
  $('#askOk').textContent = ok;
  dlg.returnValue = '';
  dlg.showModal();
  if (input !== null) { $('#askInput').focus(); $('#askInput').select(); }
  return new Promise(resolve => dlg.addEventListener('close', () => {
    resolve(dlg.returnValue !== 'ok' ? null : input === null ? true : $('#askInput').value.trim() || (allowEmpty ? '' : null));
  }, { once: true }));
}
$('#askOk').addEventListener('click', e => { e.preventDefault(); $('#askDlg').close('ok'); });
$('#askNo').addEventListener('click', e => { e.preventDefault(); $('#askDlg').close(''); });
$('#askInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#askDlg').close('ok'); } });

// toolbar buttons
$('#btnUndo').addEventListener('click', undo);
$('#btnRedo').addEventListener('click', redo);
$('#btnFit').addEventListener('click', fit);
$('#btnClear').addEventListener('click', async () => {
  if (S.walls.length && await ask(T('Alle Wände löschen?'), { text: T('Mit Strg+Z kannst du das rückgängig machen.'), ok: T('Löschen') }))
    mutate(() => { S.walls = []; ui.sel = null; ui.multi.clear(); });
});
const gridDlg = $('#gridDlg');
// strips from left to right (relative widths), each split front to back (relative depths)
const TEMPLATES = {
  cutlery:  { cols: [1, 1, 1, 1, 2], rows: [[1], [1], [1], [1], [1, 1]] },
  workshop: { cols: [2, 1], rows: [[1], [1, 1, 1]] },
  mixed:    { cols: [1, 1], rows: [[1, 1], [1, 1, 1, 1]] },
  desk:     { cols: [1, 2, 1], rows: [[1, 1], [1], [1, 1, 1]] },
  small:    { cols: [1, 1, 1, 1], rows: [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]] },
  tools:    { cols: [3, 1], rows: [[1, 1, 1], [1, 1, 1, 1, 1]] },
  bits:     { cols: [1, 1, 1, 1, 1, 1], rows: [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]] },
  kitchen:  { cols: [1, 3, 1], rows: [[1, 1, 1], [1], [1, 1]] },
};
$('#btnGrid').addEventListener('click', () => gridDlg.showModal());
$('#gTpl').addEventListener('change', () => { $('#gGridRow').hidden = $('#gTpl').value !== 'grid'; });
$('#gCancel').addEventListener('click', e => { e.preventDefault(); gridDlg.close(); });
$('#gOk').addEventListener('click', e => {
  e.preventDefault();
  const tpl = TEMPLATES[$('#gTpl').value];
  const c = clamp(parseInt($('#gCols').value) || 1, 1, 30), r = clamp(parseInt($('#gRows').value) || 1, 1, 30);
  gridDlg.close();
  mutate(() => { S.walls = tpl ? stripWalls(S, tpl.cols, tpl.rows) : gridWalls(S, c, r); ui.sel = null; ui.multi.clear(); });
  if (A.conflicts) flash(T('Die Schublade ist für diese Vorlage zu klein – rot markierte Stellen anpassen.'));
});

// header buttons
$('#btnNew').addEventListener('click', async () => {
  if (!await ask(T('Neues Projekt beginnen?'), { text: T('Alle Wände werden entfernt. Schublade und Einstellungen bleiben.'), ok: T('Neu beginnen') })) return;
  mutate(() => { const keep = { drawer: S.drawer, profile: S.profile, preset: S.preset, settings: S.settings }; S = { ...defaultState(), ...JSON.parse(JSON.stringify(keep)) }; });
  syncInputs(); fit();
});
// everything back to how the page looks on its first visit; only the language stays
$('#btnReset').addEventListener('click', async () => {
  if (!await ask(T('Alles auf Standard zurücksetzen?'), { text: T('Alle Schubladen, Profile und Fotos in diesem Browser werden gelöscht und alle Einstellungen auf Standard gesetzt. Wenn du etwas behalten willst, vorher unter „Schubladen“ alle speichern.'), ok: T('Alles zurücksetzen') })) return;
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('dd-') && k !== 'dd-lang') localStorage.removeItem(k);
  } catch { /* no storage: nothing kept anyway */ }
  location.replace(location.pathname + location.search);   // without #p=…, which would add the shared layout again
});
$('#btnSave').addEventListener('click', () => download(fileBase() + '.json', JSON.stringify(S, null, 2), 'application/json'));
$('#btnOpen').addEventListener('click', () => $('#fileIn').click());
$('#fileIn').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const o = JSON.parse(await f.text());
    const list = Array.isArray(o && o.drawers) ? o.drawers.map(migrate) : [migrate(o)];
    if (!list.length) throw new Error(T('Keine Schublade in der Datei.'));
    addDrawers(list);
    if (list.length > 1) flash(T`${list.length} Schubladen geöffnet – umschalten unter „Schubladen“.`);
  } catch (err) { ask(T('Datei konnte nicht gelesen werden'), { text: err.message }); }
  e.target.value = '';
});
const exportMenu = $('#exportMenu');
$('#btnExport').addEventListener('click', e => { e.stopPropagation(); $('#drawerMenu').classList.remove('open'); exportMenu.classList.toggle('open'); });
document.addEventListener('click', () => exportMenu.classList.remove('open'));
for (const b of $$('[data-export]')) b.addEventListener('click', () => {
  exportMenu.classList.remove('open');
  const k = b.dataset.export;
  if (k === 'csv') download(fileBase() + '_stueckliste.csv', bomCsv(), 'text/csv');
  if (k === 'labels') {
    const csv = labelsCsv();
    if (csv) download(fileBase() + T('_etiketten') + '.csv', csv, 'text/csv');
    else flash(T('Noch keine Fächer – zeichne zuerst Wände in die Schublade.'));
  }
  if (k === 'scad') download(fileBase() + '_druckjob.scad', jobScad(), 'text/plain');
  if (k === 'laser') openLaser();
  if (k === 'print') window.print();
  if (k === 'offline') saveOffline();
  if (k === 'link') shareLink();
  if (k === 'install' && installPrompt) installPrompt.prompt();
});

// ---- photo of the drawer as a tracing background ----------------------------------
// The straightened photo is kept per drawer in localStorage ('dd-bg-<id>'), outside the
// undo history; S.bgId points to it.
const bg = { id: undefined, url: null };
const BG_KEY = id => 'dd-bg-' + id;
function loadPhoto() {
  if (bg.url) URL.revokeObjectURL(bg.url);
  bg.id = S.bgId; bg.url = null;
  if (!S.bgId) return;
  try {
    const data = localStorage.getItem(BG_KEY(S.bgId));
    if (data) bg.url = URL.createObjectURL(dataUrlBlob(data));
  } catch { /* no storage */ }
  if (!bg.url && bgMem.has(S.bgId)) bg.url = URL.createObjectURL(dataUrlBlob(bgMem.get(S.bgId)));
}
const bgMem = new Map();   // photos too big for the storage live until the page closes
function dataUrlBlob(u) {
  const [head, b64] = u.split(','), bin = atob(b64), arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: head.slice(5).split(';')[0] });
}
function storePhoto(dataUrl) {
  const id = Math.random().toString(36).slice(2, 10);
  try { localStorage.setItem(BG_KEY(id), dataUrl); }
  catch { bgMem.set(id, dataUrl); flash(T('Das Foto ist zu groß zum Speichern – es bleibt bis zum Neuladen der Seite.')); }
  const old = S.bgId;
  S.bgId = id; persist(); dropPhoto(old);
  render();
}
// removes a stored photo unless another drawer still uses it
function dropPhoto(id) {
  if (!id || shelf.list.some(d => d.bgId === id)) return;
  try { localStorage.removeItem(BG_KEY(id)); } catch { /* no storage */ }
  bgMem.delete(id);
}
// Solves the perspective transform that maps the four points src onto dst.
function homography(src, dst) {
  const A8 = [], b8 = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A8.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b8.push(u);
    A8.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b8.push(v);
  }
  for (let c = 0; c < 8; c++) {   // Gauss with pivoting
    let pr = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A8[r][c]) > Math.abs(A8[pr][c])) pr = r;
    [A8[c], A8[pr]] = [A8[pr], A8[c]]; [b8[c], b8[pr]] = [b8[pr], b8[c]];
    for (let r = 0; r < 8; r++) if (r !== c) {
      const f = A8[r][c] / A8[c][c];
      for (let k = c; k < 8; k++) A8[r][k] -= f * A8[c][k];
      b8[r] -= f * b8[c];
    }
  }
  return [...b8.map((v, i) => v / A8[i][i]), 1];
}
// straightens the marked drawer (corners: back left, back right, front right, front left)
function warpPhoto(img, corners) {
  const W = S.drawer.w, D = S.drawer.d, k = Math.min(1600 / Math.max(W, D), 4);
  const ow = Math.round(W * k), oh = Math.round(D * k);
  const src = document.createElement('canvas'); src.width = img.width; src.height = img.height;
  const sc = src.getContext('2d'); sc.drawImage(img, 0, 0);
  const sd = sc.getImageData(0, 0, img.width, img.height).data;
  const H = homography([[0, 0], [ow, 0], [ow, oh], [0, oh]], corners);
  const out = document.createElement('canvas'); out.width = ow; out.height = oh;
  const oc = out.getContext('2d'), od = oc.createImageData(ow, oh);
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    const z = H[6] * x + H[7] * y + H[8];
    const sx = Math.round((H[0] * x + H[1] * y + H[2]) / z), sy = Math.round((H[3] * x + H[4] * y + H[5]) / z);
    const o = (y * ow + x) * 4;
    if (sx < 0 || sy < 0 || sx >= img.width || sy >= img.height) { od.data[o + 3] = 0; continue; }
    const q = (sy * img.width + sx) * 4;
    od.data[o] = sd[q]; od.data[o + 1] = sd[q + 1]; od.data[o + 2] = sd[q + 2]; od.data[o + 3] = 255;
  }
  oc.putImageData(od, 0, 0);
  return out.toDataURL('image/jpeg', 0.82);
}
// mirror / rotate the stored photo along with the layout
function transformPhoto(kind) {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'), x = c.getContext('2d');
    if (kind === 'rot') { c.width = img.height; c.height = img.width; x.translate(c.width, 0); x.rotate(Math.PI / 2); }
    else { c.width = img.width; c.height = img.height; if (kind === 'mx') { x.translate(c.width, 0); x.scale(-1, 1); } else { x.translate(0, c.height); x.scale(1, -1); } }
    x.drawImage(img, 0, 0);
    storePhoto(c.toDataURL('image/jpeg', 0.82));
  };
  img.src = bg.url;
}
const bgUi = { img: null, pts: [] };
const CORNER_NAMES = () => [T('hinten links'), T('hinten rechts'), T('vorne rechts'), T('vorne links')];
function drawBgCanvas() {
  const cv = $('#bgCanvas'), img = bgUi.img;
  if (!img) return;
  const c = cv.getContext('2d');
  c.drawImage(img, 0, 0, cv.width, cv.height);
  const f = cv.width / img.width, pts = bgUi.pts.map(([x, y]) => [x * f, y * f]), r = Math.max(4, cv.width / 120);
  c.lineWidth = r / 2; c.strokeStyle = '#2563eb'; c.fillStyle = 'rgba(37,99,235,.18)';
  if (pts.length > 1) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); if (pts.length === 4) { c.closePath(); c.fill(); } c.stroke(); }
  c.font = `bold ${r * 3}px system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle';
  pts.forEach(([x, y], i) => { c.fillStyle = '#2563eb'; c.beginPath(); c.arc(x, y, r * 1.8, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillText(i + 1, x, y); });
  const n = bgUi.pts.length;
  $('#bgStep').textContent = n < 4 ? T`Klicke Ecke ${n + 1} von 4: ${CORNER_NAMES()[n]} (innen, wo Boden und Wand sich treffen).` : T('Alle Ecken gesetzt – „Übernehmen“ legt das Foto auf die Schublade.');
  $('#bgApply').disabled = n < 4;
}
$('#btnPhoto').addEventListener('click', () => {
  bgUi.img = null; bgUi.pts = [];
  $('#bgStage').hidden = true; $('#bgStep').textContent = ''; $('#bgApply').disabled = true;
  $('#bgOpacity').value = S.bgOpacity ?? 0.6;
  $('#bgRemove').hidden = !S.bgId;
  $('#bgDlg').showModal();
});
$('#bgPick').addEventListener('click', () => $('#bgFile').click());
$('#bgFile').addEventListener('change', e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  const img = new Image();
  img.onload = () => {
    // big camera photos are scaled down first, plenty for tracing
    const k = Math.min(1, 2000 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(img.src);
    bgUi.img = c; bgUi.pts = [];
    const cv = $('#bgCanvas'); cv.width = Math.min(1100, c.width); cv.height = Math.round(cv.width * c.height / c.width);
    $('#bgStage').hidden = false; drawBgCanvas();
  };
  img.onerror = () => flash(T('Das Bild konnte nicht geladen werden.'));
  img.src = URL.createObjectURL(f);
});
$('#bgCanvas').addEventListener('pointerdown', e => {
  if (!bgUi.img || bgUi.pts.length >= 4) return;
  const cv = $('#bgCanvas'), r = cv.getBoundingClientRect(), f = bgUi.img.width / r.width;
  bgUi.pts.push([(e.clientX - r.left) * f, (e.clientY - r.top) * f]);
  drawBgCanvas();
});
$('#bgRedo').addEventListener('click', () => { bgUi.pts = []; drawBgCanvas(); });
$('#bgClose').addEventListener('click', e => { e.preventDefault(); $('#bgDlg').close(); });
$('#bgApply').addEventListener('click', e => {
  e.preventDefault();
  if (bgUi.pts.length < 4) return;
  storePhoto(warpPhoto(bgUi.img, bgUi.pts));
  $('#bgDlg').close();
});
$('#bgRemove').addEventListener('click', e => {
  e.preventDefault();
  const old = S.bgId; delete S.bgId; persist(); dropPhoto(old); render();
  $('#bgDlg').close();
});
$('#bgOpacity').addEventListener('input', e => { S.bgOpacity = +e.target.value; persist(); drawSVG(); });

// ---- several drawers -----------------------------------------------------------
function openDrawer(i) {
  persist();
  shelf.cur = clamp(i, 0, shelf.list.length - 1);
  S = shelf.list[shelf.cur];
  hist.past = []; hist.future = [];
  ui.sel = null; ui.multi.clear(); ui.selComp = null; ui.selItem = null; ui.measure = null;
  syncInputs(); persist(); fit(); render();
}
// opened files and links come in as new drawers, so nothing gets overwritten;
// a single empty drawer nobody worked on yet is replaced instead
function addDrawers(list) {
  const blank = shelf.list.length === 1 && !S.walls.length && !hist.past.length;
  const at = blank ? 0 : shelf.list.length;
  shelf.list.splice(at, blank ? 1 : 0, ...list);
  shelf.cur = at; S = shelf.list[at];
  openDrawer(at);
}
function drawerName(base) {
  const names = new Set(shelf.list.map(d => d.name));
  let k = 2, n = base;
  while (names.has(n)) n = `${base} ${k++}`;
  return n;
}
function drawMenu() {
  const n = shelf.list.length;
  $('#drawerCount').textContent = n > 1 ? `${shelf.cur + 1}/${n}` : '';
  $('#drawerList').innerHTML = shelf.list.map((d, i) => `<button data-open="${i}" class="${i === shelf.cur ? 'on' : ''}"><span>${esc(d.name)}</span><small>${d.drawer.w} × ${d.drawer.d}</small></button>`).join('');
  $('[data-drawer="del"]').disabled = n < 2;
}
const drawerMenu = $('#drawerMenu');
$('#btnDrawers').addEventListener('click', e => { e.stopPropagation(); exportMenu.classList.remove('open'); drawerMenu.classList.toggle('open'); });
document.addEventListener('click', () => drawerMenu.classList.remove('open'));
$('#drawerList').addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openDrawer(+b.dataset.open); });
for (const b of $$('[data-drawer]')) b.addEventListener('click', async () => {
  drawerMenu.classList.remove('open');
  const k = b.dataset.drawer;
  if (k === 'add' || k === 'dup') {
    const d = k === 'dup' ? { ...JSON.parse(snapshot()), name: drawerName(S.name + T(' (Kopie)')) }
      : { ...defaultState(), ...JSON.parse(JSON.stringify({ drawer: S.drawer, profile: S.profile, preset: S.preset, settings: S.settings })), name: drawerName(T('Schublade')) };
    shelf.list.splice(shelf.cur + 1, 0, d);
    openDrawer(shelf.cur + 1);
  }
  if (k === 'del' && shelf.list.length > 1 && await ask(T`„${S.name}“ löschen?`, { text: T('Die Schublade wird aus der Liste entfernt. Das lässt sich nicht rückgängig machen.'), ok: T('Löschen') })) {
    const [gone] = shelf.list.splice(shelf.cur, 1);
    dropPhoto(gone.bgId);
    shelf.cur = Math.min(shelf.cur, shelf.list.length - 1); S = shelf.list[shelf.cur];
    openDrawer(shelf.cur);
  }
  if (k === 'csv') download(T('alle_schubladen') + T('_stueckliste') + '.csv', allDrawersCsv(), 'text/csv');
  if (k === 'save') download(T('alle_schubladen') + '.json', JSON.stringify({ version: 3, drawers: shelf.list }, null, 2), 'application/json');
});

// all parts of all drawers added up: same part in the same size is one row
function allDrawersCsv() {
  const keepS = S, keepA = A, rowsBy = new Map();
  let parts = 0, grams = 0;
  const add = (cat, name, len, h, note, qty, g, drawer) => {
    const k = [cat, name, len, h, note].join('|');
    if (!rowsBy.has(k)) rowsBy.set(k, { cat, name, len, h, note, qty: 0, g, drawers: new Set() });
    const r = rowsBy.get(k); r.qty += qty; r.drawers.add(drawer);
  };
  try {
    for (const d of shelf.list) {
      S = d;   // part names depend on the drawer's own settings
      const a = analyze(d), b = a.bom;
      for (const c of b.connectors) add(T('Verbinder'), typeName(c.type), '', fmt(d.profile.height), c.type, c.qty, c.g, d.name);
      for (const w of b.walls) add(T('Wand'), `${fmt(w.len)} mm`, fmt(w.len), fmt(w.h), T`Dicke ${fmt(a.g.t)}`, w.qty, w.g, d.name);
      for (const r of b.rails) add(T('Schiene'), T('Schiene') + ' ' + fmt(r.len), fmt(r.len), fmt(r.width), T`Zahnversatz ${fmt(r.offset, 2)}` + (r.tongue ? ', ' + T('Zapfen') : '') + (r.socket ? ', ' + T('Buchse') : ''), r.qty, r.g, d.name);
      for (const x of b.extras) add(T('Zubehör'), clipName(x), '40', '', '', x.qty, x.g, d.name);
      parts += b.parts; grams += b.grams;
    }
  } finally { S = keepS; A = keepA; }
  const rows = [['Kategorie', 'Teil', 'Länge (mm)', 'Höhe/Breite (mm)', 'Anzahl', 'ca. Gramm je Stück', 'Hinweis', 'Schubladen'].map(T)];
  for (const r of rowsBy.values()) rows.push([r.cat, r.name, r.len, r.h, r.qty, fmt(r.g), r.note, [...r.drawers].join(', ')]);
  rows.push([], [T('Summe'), '', '', '', parts, fmt(grams, 0), T`${shelf.list.length} Schubladen`, '']);
  return csvText(rows);
}

// ---- share link: the project, deflated into the URL hash -------------------
const PAGES_URL = 'https://barry2040.github.io/the-drawer-dividers/';
const b64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function pipe(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }
async function shareLink() {
  const { name, drawer, profile, settings, walls, names, items } = S;
  const data = await pipe(new TextEncoder().encode(JSON.stringify({ name, drawer, profile, settings, walls, names, items })), new CompressionStream('deflate-raw'));
  const base = location.protocol.startsWith('http') ? location.origin + location.pathname : PAGES_URL;
  const url = base + '#p=' + b64url(data);
  try { await navigator.clipboard.writeText(url); flash(T('Link kopiert – er enthält das ganze Layout.')); }
  catch { await ask(T('Link zum Teilen'), { text: T('Kopiere diesen Link:'), input: url }); }
}
async function loadFromHash() {
  const m = location.hash.match(/^#p=([\w-]+)$/);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  try {
    const o = migrate(JSON.parse(new TextDecoder().decode(await pipe(unb64url(m[1]), new DecompressionStream('deflate-raw')))));
    addDrawers([o]);
    flash(shelf.list.length > 1 ? T('Geteiltes Layout als neue Schublade geöffnet – deine anderen findest du unter „Schubladen“.') : T('Geteiltes Layout geladen.'));
  } catch { ask(T('Link konnte nicht gelesen werden'), { text: T('Der Link ist unvollständig oder beschädigt.') }); }
}

// The published page is the self-contained build; offer it as a file to keep.
const offlineBtn = $('[data-export="offline"]');
// (not in the Docker image: its page loads three.js and OpenSCAD from the server, a saved copy would not)
offlineBtn.hidden = !(document.querySelector('meta[name="dd-standalone"]') && location.protocol.startsWith('http')) || !!document.querySelector('meta[name="dd-local-libs"]');
async function saveOffline() {
  try {
    const html = await fetch(location.href, { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); });
    download('Drawer-Divider-Designer.html', html, 'text/html');
  } catch (err) { ask(T('Download nicht möglich'), { text: T('Speichere die Seite stattdessen mit Strg+S.') }); }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
const fileBase = () => (S.name || T('schublade')).replace(/[^\w\-äöüÄÖÜß ]+/g, '').trim().replace(/\s+/g, '_') || T('schublade');
function download(name, text, type) {
  const blob = new Blob([text], { type: type + ';charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function bomCsv() {
  const b = A.bom, rows = [['Kategorie', 'Teil', 'Länge (mm)', 'Höhe/Breite (mm)', 'Anzahl', 'ca. Gramm je Stück', 'Hinweis'].map(T)];
  for (const c of b.connectors) rows.push([T('Verbinder'), typeName(c.type), '', fmt(S.profile.height), c.qty, fmt(c.g), c.type]);
  for (const w of b.walls) rows.push([T('Wand'), T`Wand ${w.id}` + ' ' + fmt(w.len), fmt(w.len), fmt(w.h), w.qty, fmt(w.g), T`Dicke ${fmt(A.g.t)}`]);
  for (const r of b.rails) rows.push([T('Schiene'), T('Schiene') + ' ' + fmt(r.len), fmt(r.len), fmt(r.width), r.qty, fmt(r.g), T`Zahnversatz ${fmt(r.offset, 2)}` + (r.tongue ? ', ' + T('Zapfen') : '') + (r.socket ? ', ' + T('Buchse') : '')]);
  for (const x of b.extras) rows.push([T('Zubehör'), clipName(x), '40', '', x.qty, fmt(x.g), T('oben auf eine Wand stecken')]);
  rows.push([], [T('Summe'), '', '', '', b.parts, fmt(b.grams, 0), T`Schublade ${S.drawer.w}×${S.drawer.d}×${S.drawer.h} mm`]);
  return csvText(rows);
}
const csvText = rows => '﻿' + rows.map(r => r.map(v => /[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(';')).join('\r\n');

// Compartment labels for Open Label Studio's batch print: "name;size" per line, no header.
// Only the named compartments once some have a name, otherwise all, numbered.
function labelsCsv() {
  const list = A.comps.list, named = list.filter(R => R.name);
  const size = R => R.rect ? `${fmt(R.netW, 0)} × ${fmt(R.netD, 0)} mm` : `${fmt(R.area / 100, 0)} cm²`;
  const rows = (named.length ? named.map(R => [R.name, size(R)]) : list.map((R, i) => [T`Fach ${i + 1}`, size(R)]));
  return rows.map(r => r.map(v => String(v).replace(/;/g, ',')).join(';')).join('\r\n');
}

function jobScad() { return buildJob().scad; }

const num = v => r2(v).toString();
// Every printable part: its SCAD call and its footprint on the bed (px, py incl. the gap), centred on the origin.
function jobParts() {
  const b = A.bom, g = A.g, p = S.profile, st = S.settings, gap = 5;
  const parts = [];   // {label, body, px, py, qty, w}
  for (const c of b.connectors)
    parts.push({ label: typeName(c.type), body: `dd_connector("${c.type}", P${st.slip ? ', slip = true' : ''}${c.type === 'corner_round' ? `, corner_r = ${num(g.cornerR)}` : ''});`, px: 2 * p.arm + 4, py: 2 * p.arm + 4, qty: c.qty, w: 2 * p.arm });
  const flat = st.orient === 'flat';
  for (const w of b.walls) {
    const lab = st.labels ? `, label = "${w.id}", label2 = "${num(w.len)}"` : '';
    const call = `dd_wall(${num(w.len)}, P, height = ${num(w.h)}, pattern = "${st.pattern}", grip = ${num(st.grip)}${lab})`;
    parts.push({ label: T`Wand ${w.id}` + ` ${num(w.len)} mm`, body: flat ? `translate([0, ${num(w.h / 2)}, 0]) dd_lay_flat(${num(g.t)}) ${call};` : call + ';',
                 px: w.len + gap, py: (flat ? w.h : g.t) + gap, qty: w.qty, w: w.len });
  }
  for (const r of b.rails) {
    const call = `dd_rail(${num(r.len)}, ${num(r.width)}, P, plate = ${num(st.railPlate)}, tooth_t = ${num(st.toothT)}, tooth_h = ${num(st.toothH)}, teeth_offset = ${num(r.offset)}, tongue = ${r.tongue}, socket = ${r.socket}, screws = ${r.screws})`;
    parts.push({ label: T('Schiene') + ` ${num(r.len)} mm` + (r.tongue || r.socket ? ' (' + [r.socket && T('Buchse'), r.tongue && T('Zapfen')].filter(Boolean).join('+') + ')' : ''),
                 body: `translate([${num(-r.len / 2)}, ${num(g.railT / 2)}, 0]) rotate([90, 0, 0]) ${call};`, px: r.len + gap, py: g.railT + gap, qty: r.qty, w: r.len });
  }

  for (const x of b.extras) {
    const sx = g.t + 0.15 + 2.4 + 12 * Math.cos(Math.PI / 4) + 1.2, sy = 8 + 2.4 + 12 * Math.sin(Math.PI / 4);
    const lab = x.label ? `, label = ${JSON.stringify(x.label)}, text_size = ${num(clipTextSize(x.label))}` : '';
    parts.push({ label: clipName(x), body: `translate([0, ${num(8 - sy / 2)}, 0]) dd_label_clip(40, P${lab});`,
                 px: sx + 4, py: sy + 4, qty: x.qty, w: sx });
  }
  return parts;
}
// clip text: 5 mm high, smaller so a long name still fits the 40 mm wide face
const clipTextSize = s => r2(clamp(34 / (0.62 * Math.max(1, [...s].length)), 2, 5));

// Packs the parts onto bed-sized plates in rows (shelves) of the tallest parts first.
// mixed = false keeps one kind of part per plate, which saves sorting after printing.
function packPlates(parts, bed, mixed) {
  const items = parts.flatMap((pt, i) => Array(pt.qty).fill(i));
  if (mixed) items.sort((a, b) => parts[b].py - parts[a].py || parts[b].px - parts[a].px || a - b);
  const plates = [];
  let open = [];
  for (const i of items) {
    const pt = parts[i], w = Math.min(pt.px, bed), h = Math.min(pt.py, bed);
    if (!mixed && open.length && open[0].part !== i) open = [];
    let done = false;
    for (const pl of open) {
      const sh = pl.shelves.find(s => h <= s.h + EPS && s.x + w <= bed + EPS);
      if (sh) { pl.items.push({ i, x: sh.x + w / 2, y: sh.y + sh.h / 2 }); sh.x += w; done = true; break; }
      if (pl.h + h <= bed + EPS) { pl.shelves.push({ y: pl.h, h, x: w }); pl.items.push({ i, x: w / 2, y: pl.h + h / 2 }); pl.h += h; done = true; break; }
    }
    if (done) continue;
    const pl = { part: i, shelves: [{ y: 0, h, x: w }], h, items: [{ i, x: w / 2, y: h / 2 }] };
    plates.push(pl); open.push(pl);
  }
  for (const pl of plates) {
    // centre the plate's contents on the bed
    const W = Math.max(...pl.shelves.map(s => s.x));
    for (const it of pl.items) { it.x -= W / 2; it.y -= pl.h / 2; }
    const count = new Map();
    for (const it of pl.items) count.set(it.i, (count.get(it.i) || 0) + 1);
    pl.label = [...count].map(([i, q]) => `${q}x ${parts[i].label}`).join(', ');
  }
  if (!mixed) parts.forEach((pt, i) => {
    const own = plates.filter(pl => pl.part === i);
    if (own.length > 1) own.forEach((pl, k) => { pl.label += T` (Platte ${k + 1} von ${own.length})`; });
  });
  return plates;
}
const bedSize = () => S.settings.bed - 10;
const platesFor = () => packPlates(jobParts(), bedSize(), S.settings.pack !== 'single');

// The print job: one .scad with the library embedded and one PART per bed-sized plate.
function buildJob() {
  const b = A.bom, p = S.profile;
  const bed = bedSize();
  const prof = `dd_profile(${Object.entries(p).map(([k, v]) => `${k} = ${num(v)}`).join(', ')})`;
  const parts = jobParts(), plates = packPlates(parts, bed, S.settings.pack !== 'single');
  const tolIdx = plates.length + 1;

  // overview: one of each part, in rows
  let ox = 0, oy = 0, rowH = 0;
  const overview = parts.map((pt, i) => {
    if (ox > 0 && ox + pt.w > 500) { ox = 0; oy += rowH + 15; rowH = 0; }
    const s = `  translate([${num(ox + pt.w / 2)}, ${num(oy)}, 0]) part_${i + 1}();`;
    ox += pt.w + 15; rowH = Math.max(rowH, pt.py + 20);
    return s;
  });

  const lib = (window.DD_SCAD_LIB || '').trim();
  const L = [];
  L.push(T`// The Drawer Dividers – Druckjob "${S.name}"`);
  L.push(T`// Erstellt mit dem Drawer Divider Designer am ${new Date().toLocaleString(LANG === 'en' ? 'en-US' : 'de-DE')}`);
  L.push(T`// Schublade ${S.drawer.w} × ${S.drawer.d} × ${S.drawer.h} mm · ${b.parts} Teile · ca. ${fmt(b.grams, 0)} g`);
  L.push('//');
  L.push(T('// So exportierst du die STLs:'));
  L.push(T('//   In OpenSCAD: rechts im Customizer "Teil" wählen, F6 (Rendern), F7 (STL exportieren).'));
  L.push(T('//   Oder direkt im Designer: "STLs erzeugen" rechnet alle Platten im Browser.'));
  L.push('');
  L.push('/* [Export] */');
  L.push(T('// Welche Druckplatte? (0 = Übersicht aller Teile)'));
  L.push(`PART = 0; // [0:${T('Übersicht')}, ${plates.map((pl, i) => `${i + 1}:${pl.label.replace(/[,:\]\["“”„]/g, ' ')}`).join(', ')}, ${tolIdx}:${T('Toleranztest')}]`);
  L.push('');
  L.push('/* [Hidden] */');
  L.push('$fn = 48;');
  L.push(`P = ${prof};`);
  L.push(`BED = ${bed};`);
  L.push('');
  parts.forEach((pt, i) => L.push(`module part_${i + 1}() ${pt.body}`));
  L.push('');
  L.push('if (PART == 0) {');
  L.push(...overview);
  L.push('}');
  plates.forEach((pl, i) => {
    L.push(`if (PART == ${i + 1}) {`);
    for (const it of pl.items) L.push(`  translate([${num(it.x)}, ${num(it.y)}, 0]) part_${it.i + 1}();`);
    L.push('}');
  });
  L.push(`if (PART == ${tolIdx}) dd_tolerance_test(P, [${[-0.1, -0.05, 0, 0.05, 0.1].map(d => num(Math.max(0, p.tol + d))).join(', ')}]);`);
  L.push('');
  if (lib) {
    L.push('// ============================================================================');
    L.push(T('//  Bibliothek (scad/lib/drawer_divider.scad, eingebettet)'));
    L.push('// ============================================================================');
    L.push(lib);
  } else {
    L.push(T('// Bibliothek nicht eingebettet – lege diese Datei neben drawer_divider.scad:'));
    L.push('use <drawer_divider.scad>');
  }
  return { scad: L.join('\n') + '\n', plates: plates.map((pl, i) => ({ num: i + 1, label: pl.label })) };
}

// ---------------------------------------------------------------------------
// 3D preview (three.js, loaded on demand)
// ---------------------------------------------------------------------------
const T3 = { ready: false };
async function init3D() {
  if (T3.ready || T3.loading) return T3.loading;
  T3.loading = (async () => {
    const THREE = await import('three');
    const { OrbitControls } = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js');
    const el = $('#three');
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 1, 10000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8170, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-300, 700, 400); scene.add(sun);
    const group = new THREE.Group(); scene.add(group);
    Object.assign(T3, { THREE, renderer, scene, camera, controls, group, el, ready: true });
    const resize = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    new ResizeObserver(resize).observe(el); resize();
    const loop = () => { if (ui.is3d) { controls.update(); renderer.render(scene, camera); } requestAnimationFrame(loop); };
    loop();
  })();
  return T3.loading;
}
function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888'; }
function build3D(resetCam) {
  if (!T3.ready) return;
  const { THREE, group } = T3, g = A.g, p = S.profile, st = S.settings, { W, D } = g;
  group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  group.clear();
  const mat = c => new THREE.MeshStandardMaterial({ color: new THREE.Color(css(c)), roughness: 0.7 });
  const mWall = mat('--wall'), mConn = mat('--conn'), mSlip = mat('--conn-slip'), mJoint = mat('--joint'), mRail = mat('--rail'), mBad = mat('--err');
  const box = (w, h, d, x, y, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); group.add(o); };
  // drawer
  const dh = S.drawer.h, wt = 8;
  const mDrawer = new THREE.MeshStandardMaterial({ color: new THREE.Color(css('--line-2')), roughness: 0.9 });
  const mGlass = new THREE.MeshStandardMaterial({ color: new THREE.Color(css('--line-2')), transparent: true, opacity: 0.35, roughness: 0.9 });
  box(W + 2 * wt, wt, D + 2 * wt, W / 2, -wt / 2, D / 2, mDrawer);
  box(wt, dh, D + 2 * wt, -wt / 2, dh / 2, D / 2, mGlass); box(wt, dh, D + 2 * wt, W + wt / 2, dh / 2, D / 2, mGlass);
  box(W, dh, wt, W / 2, dh / 2, -wt / 2, mGlass); box(W, dh * 0.6, wt, W / 2, dh * 0.3, D + wt / 2, mGlass);
  // walls, with the hole pattern and grip they are printed with
  const V2 = (x, y) => new THREE.Vector2(x, y);
  for (const pc of A.pieces) if (pc.len > 0) {
    const L = pc.len, h = pc.h, gr = Math.min(st.grip, L / 2 - 1, h - 1);
    const outline = [V2(-L / 2, 0), V2(L / 2, 0), V2(L / 2, h)];
    if (gr > 0) for (let k = 0; k <= 16; k++) { const t = -Math.PI * k / 16; outline.push(V2(gr * Math.cos(t), h + gr * Math.sin(t))); }
    outline.push(V2(-L / 2, h));
    const shape = new THREE.Shape(outline), holes = wallHoles(L, h, S);
    for (const [hx, hz] of holes.pts) {
      const n = holes.hex ? 6 : 24;
      shape.holes.push(new THREE.Path([...Array(n)].map((_, k) => V2(hx + holes.cell * Math.cos(2 * Math.PI * k / n), hz + holes.cell * Math.sin(2 * Math.PI * k / n)))));
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: g.t, bevelEnabled: false, curveSegments: 1 });
    geo.translate(0, 0, -g.t / 2);
    if (pc.o === 'v') geo.rotateY(-Math.PI / 2);
    const o = new THREE.Mesh(geo, pc.bad ? mBad : mWall);
    const m = (pc.s + pc.e) / 2;
    if (pc.o === 'h') o.position.set(m, 0, pc.c); else o.position.set(pc.c, 0, m);
    group.add(o);
  }
  // connectors: normal ones with their open slots, so the walls sit visibly inside them
  // (a solid body would share its top face with the walls and flicker)
  const extrude = (pts, depth, y0, m, n) => {
    const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => V2(x, -y))), { depth, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    const o = new THREE.Mesh(geo, m); o.position.set(n.x, y0, n.y); group.add(o);
  };
  for (const n of A.nodes) if (n.kind === 'conn') {
    const m = n.clash ? mBad : n.joint ? mJoint : st.slip ? mSlip : mConn;
    if (n.type.startsWith('slip')) { extrude(connOutline(n.dirs, g, p), p.height, 0, m, n); continue; }
    const cap = Math.min(st.slip ? Math.max(p.cap, p.floor_t) : p.cap, p.height - 1);
    const cr = n.type === 'corner_round' ? g.cornerR : 0;
    extrude(connOutline(n.dirs, g, p, 8, true, cr), p.height - cap, 0, m, n);
    if (cap > 0) extrude(connOutline(n.dirs, g, p, 8, false, cr), cap, p.height - cap, m, n);
  }
  // rails
  for (const r of A.rails) {
    const len = r.e - r.s, mid = (r.s + r.e) / 2, th = g.railT;
    if (r.axis === 'y') box(th, r.width, len, r.side === 'L' ? th / 2 : W - th / 2, r.width / 2, mid, mRail);
    else box(len, r.width, th, mid, r.width / 2, r.side === 'T' ? th / 2 : D - th / 2, mRail);
  }
  if (resetCam || !T3.placed) {
    const R = Math.max(W, D), asp = Math.min(1.4, T3.camera.aspect || 1);
    const dist = R / (2 * Math.tan(T3.camera.fov * Math.PI / 360)) / asp * 1.15;
    T3.camera.position.set(W / 2 - dist * 0.12, dist * 0.78, D / 2 + dist * 0.62);
    T3.controls.target.set(W / 2, 0, D / 2);
    T3.placed = true;
  }
}
$('#btn3d').addEventListener('click', async () => {
  ui.is3d = !ui.is3d;
  $('#btn3d').classList.toggle('on', ui.is3d);
  $('#three').classList.toggle('show', ui.is3d);
  if (ui.is3d) {
    try { await init3D(); build3D(true); }
    catch (err) { ui.is3d = false; $('#three').classList.remove('show'); $('#btn3d').classList.remove('on'); flash(T('3D-Vorschau braucht eine Internetverbindung (three.js).')); }
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
translateDom();
$('#btnLang').textContent = LANG === 'en' ? 'DE' : 'EN';
$('#btnLang').addEventListener('click', () => {
  try { localStorage.setItem('dd-lang', LANG === 'en' ? 'de' : 'en'); } catch { /* no storage: stays as it is */ }
  location.reload();
});
if (S.name === 'Meine Schublade' || S.name === 'My drawer') S.name = T('Meine Schublade');
syncInputs(); syncSplitBar();
A = analyze(S);
fit();
setTool('draw');
new ResizeObserver(() => { fit(); drawSVG(); }).observe($('#canvasWrap'));
loadFromHash();
addEventListener('hashchange', loadFromHash);

// Installable app: only the published page (next to it: manifest, sw.js, icons) over https or localhost
if ('serviceWorker' in navigator && document.querySelector('meta[name="dd-standalone"]') && window.isSecureContext && location.protocol.startsWith('http')) {
  const link = document.createElement('link'); link.rel = 'manifest'; link.href = 'manifest.webmanifest'; document.head.appendChild(link);
  const icon = document.createElement('link'); icon.rel = 'apple-touch-icon'; icon.href = 'icon-192.png'; document.head.appendChild(icon);
  navigator.serviceWorker.register('sw.js').catch(() => { /* no offline cache, the page works anyway */ });
}
let installPrompt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; $('[data-export="install"]').hidden = false; });
addEventListener('appinstalled', () => { installPrompt = null; $('[data-export="install"]').hidden = true; });
