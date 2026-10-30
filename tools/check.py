#!/usr/bin/env python3
"""Checks run by CI (and by hand before a release).

  1. every .scad file (sources and MakerWorld builds) renders without warnings
  2. the HTML designer and the SCAD library compute the same parts for the same
     layout (wall lengths and connector types) – the formulas exist twice
  3. every text of the designer has an English translation (tools/i18n_keys.py)

Needs OpenSCAD (set OPENSCAD=path if it is not on PATH) and, for step 2,
Playwright with Chromium:  pip install playwright && playwright install chromium

Run from anywhere:  python tools/check.py
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPENSCAD = os.environ.get("OPENSCAD", "openscad")
TMP = Path(tempfile.mkdtemp())

# (edge, slip, strip widths, compartments per strip, width, depth)
CASES = [
    ("frame", False, [1, 1, 1], [[1, 1], [1, 1], [1, 1, 2]], 400, 300),
    ("frame", True, [1, 1, 1], [[1, 1], [1, 1], [1, 1, 2]], 400, 300),
    ("endcap", False, [1, 2], [[1, 1, 1], [1, 1]], 350, 250),
    ("none", False, [1, 1], [[1, 1], [1, 2]], 300, 280),
    ("none", True, [1, 1, 1, 1], [[1], [1, 1], [1], [1, 1]], 520, 300),
    ("rail", False, [1, 1, 1], [[1, 1], [1], [1, 1, 1]], 400, 300),
    ("frame", False, [1, 1], [[1], [1]], 600, 200),   # long walls: joiners
]


def openscad(src, out, defines=()):
    args = [OPENSCAD, "-o", str(out)]
    for k, v in defines:
        args += ["-D", f"{k}={v}"]
    r = subprocess.run(args + [str(src)], capture_output=True, text=True)
    echo = out.read_text(encoding="utf-8", errors="replace") if out.exists() else ""
    return r.stdout + r.stderr, echo


def check_files():
    bad = 0
    files = sorted((ROOT / "scad").glob("*.scad")) + sorted((ROOT / "dist" / "makerworld").glob("*/*.scad"))
    for f in files:
        log, echo = openscad(f, TMP / "x.echo")
        hits = [l for l in (log + "\n" + echo).splitlines() if re.search(r"WARNING|ERROR", l)]
        if hits:
            bad += 1
            print(f"FAIL {f.relative_to(ROOT)}\n  " + "\n  ".join(hits[:5]))
    print(f"scad files: {len(files) - bad} of {len(files)} clean")
    return bad == 0


def scad_parts(case):
    edge, slip, cols, rows, W, D = case
    defs = [("Edge", f'"{edge}"'), ("Slip_On", str(slip).lower()), ("Drawer_Width", W), ("Drawer_Depth", D),
            ("Drawer_Height", 60), ("Height", 40), ("Language", '"en"'), ("Show", '"assembly"'),
            ("Strips", '"' + ",".join(map(str, cols)) + '"'),
            ("Splits", '"' + ",".join(":".join(map(str, r)) for r in rows) + '"')]
    _, echo = openscad(ROOT / "scad" / "drawer_designer.scad", TMP / "case.echo", defs)
    walls = {}
    for line in echo.splitlines():
        m = re.search(r'#\d+\s+(\d+) x Wall \S+\s+([\d.]+) mm', line)
        if m:
            walls[float(m.group(2))] = int(m.group(1))
    return walls


def scad_conns(case):
    edge, slip, cols, rows, W, D = case
    src = TMP / "conns.scad"
    lib = (ROOT / "scad" / "lib" / "drawer_divider.scad").as_posix()
    src.write_text(f'''use <{lib}>
P = dd_profile(height = 40);
O = dd_layout_opts(width = {W}, depth = {D}, height = 60, strips = "{",".join(map(str, cols))}",
                   splits = "{",".join(":".join(map(str, r)) for r in rows)}", edge = "{edge}", slip = {str(slip).lower()});
L = dd_layout(P, O);
echo(CONNS = [for (c = dd(L, "conns")) c[0]]);
''', encoding="utf-8")
    _, echo = openscad(src, TMP / "conns.echo")
    m = re.search(r"CONNS = \[(.*)\]", echo)
    out = {}
    for t in re.findall(r'"(\w+)"', m.group(1) if m else ""):
        out[t] = out.get(t, 0) + 1
    return out


def designer_parts(page, case):
    edge, slip, cols, rows, W, D = case
    return page.evaluate("""([edge, slip, cols, rows, W, D]) => {
        const St = JSON.parse(JSON.stringify(S));
        St.drawer = { w: W, d: D, h: 60, r: 0 };
        Object.assign(St.settings, { border: edge, slip, autoH: false, maxLen: 240, borderGap: 0.5, noneGap: 1, clips: false });
        St.profile = { ...DEFAULT_PROFILE, height: 40 };
        St.walls = stripWalls(St, cols, rows);
        const a = analyze(St), walls = {}, conns = {};
        for (const w of a.bom.walls) walls[w.len] = w.qty;
        for (const c of a.bom.connectors) conns[c.type] = c.qty;
        return { walls, conns, conflicts: a.conflicts };
    }""", list(case))


def check_designer():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("SKIP designer check – playwright is not installed")
        return True
    ok = True
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto((ROOT / "Drawer-Divider-Designer.html").as_uri())
        page.wait_for_function("typeof analyze === 'function'")
        if errors:
            print("FAIL designer page errors:", errors)
            ok = False
        for case in CASES:
            js = designer_parts(page, case)
            sw, sc = scad_parts(case), scad_conns(case)
            jw = {float(k): v for k, v in js["walls"].items()}
            same = jw == sw and js["conns"] == sc and js["conflicts"] == 0
            print(("ok  " if same else "FAIL") + f" {case[0]:6} slip={case[1]!s:5} {case[4]}x{case[5]}")
            if not same:
                ok = False
                print("     designer walls", json.dumps(jw), "conns", json.dumps(js["conns"]), "conflicts", js["conflicts"])
                print("     scad     walls", json.dumps(sw), "conns", json.dumps(sc))
        browser.close()
    return ok


if __name__ == "__main__":
    sys.path.insert(0, str(ROOT / "tools"))
    import i18n_keys
    a = check_files()
    b = check_designer()
    c = i18n_keys.main()
    sys.exit(0 if a and b and c else 1)
