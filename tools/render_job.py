#!/usr/bin/env python3
"""Render every plate of a designer print job to its own STL.

  python tools/render_job.py meine_schublade_druckjob.scad [--out stl] [--openscad PATH]

Reads the PART list from the job file and calls the OpenSCAD command line once per plate.
"""
import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

CANDIDATES = [
    r"C:\Program Files\OpenSCAD\openscad.com",
    r"C:\Program Files\OpenSCAD (Nightly)\openscad.com",
    "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD",
    "/usr/bin/openscad",
    "/usr/local/bin/openscad",
]


def find_openscad(explicit):
    if explicit:
        return explicit
    for name in ("openscad", "openscad-nightly"):
        p = shutil.which(name)
        if p:
            return p
    for c in CANDIDATES:
        if os.path.exists(c):
            return c
    sys.exit("OpenSCAD not found – install it or pass --openscad PATH")


def plates(job_text):
    m = re.search(r"^PART\s*=\s*0;\s*//\s*\[(.*)\]\s*$", job_text, re.M)
    if not m:
        sys.exit("No PART list found – is this a job file from the designer?")
    out = []
    for item in m.group(1).split(","):
        num, _, label = item.strip().partition(":")
        if num.strip() != "0":
            out.append((int(num), label.strip()))
    return out


def slug(text):
    text = text.replace("×", "x")
    text = re.sub(r"[^\w\-. ]+", "", text, flags=re.UNICODE)
    return re.sub(r"\s+", "_", text).strip("_")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("job", type=Path)
    ap.add_argument("--out", type=Path, default=None, help="output folder (default: <job>_stl)")
    ap.add_argument("--openscad", default=None)
    ap.add_argument("--skip-test", action="store_true", help="do not render the tolerance test")
    args = ap.parse_args()

    exe = find_openscad(args.openscad)
    out = args.out or args.job.with_name(args.job.stem + "_stl")
    out.mkdir(parents=True, exist_ok=True)

    todo = plates(args.job.read_text(encoding="utf-8"))
    if args.skip_test:
        todo = [t for t in todo if "Toleranz" not in t[1]]
    for i, (num, label) in enumerate(todo, 1):
        target = out / f"{num:02d}_{slug(label)}.stl"
        print(f"[{i}/{len(todo)}] {label} -> {target.name}", flush=True)
        r = subprocess.run([exe, "-o", str(target), "-D", f"PART={num}", str(args.job)],
                           capture_output=True, text=True)
        if r.returncode != 0:
            print(r.stderr, file=sys.stderr)
            sys.exit(f"OpenSCAD failed on plate {num}")
    print(f"Done: {len(todo)} STL files in {out}")


if __name__ == "__main__":
    main()
