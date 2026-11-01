#!/usr/bin/env python3
"""Lists the texts of the designer that have no English translation yet.

Collects every T('…') and T`…${x}…` in designer/*.js plus the visible texts of
designer/dev.html and compares them with the EN dictionary in designer/i18n.js.

Run from anywhere:  python tools/i18n_keys.py   (exit code 1 if something is missing)
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESIGNER = ROOT / "designer"
ESC = {"n": "\n", "t": "\t", "'": "'", '"': '"', "\\": "\\", "`": "`", "$": "$"}


def read_quoted(s, i, q):
    """s[i] is the opening quote; returns (text, index after the closing quote)."""
    out, i = [], i + 1
    while s[i] != q:
        if s[i] == "\\":
            out.append(ESC.get(s[i + 1], s[i + 1]))
            i += 2
        else:
            out.append(s[i])
            i += 1
    return "".join(out), i + 1


def read_template(s, i):
    """s[i] is a backtick; returns (text with ${…} as {}, index after the closing backtick)."""
    out, i = [], i + 1
    while s[i] != "`":
        if s[i] == "\\":
            out.append(ESC.get(s[i + 1], s[i + 1]))
            i += 2
        elif s.startswith("${", i):
            out.append("{}")
            i, depth = i + 2, 1
            while depth:
                c = s[i]
                if c in "'\"":
                    _, i = read_quoted(s, i, c)
                    continue
                if c == "`":
                    _, i = read_template(s, i)
                    continue
                depth += c == "{"
                depth -= c == "}"
                i += 1
        else:
            out.append(s[i])
            i += 1
    return "".join(out), i + 1


def js_keys(src):
    keys = []
    for m in re.finditer(r"\bT(\(\s*['\"]|`)", src):
        i = m.end() - 1
        if src[i] == "`":
            keys.append(read_template(src, i)[0])
        else:
            keys.append(read_quoted(src, i, src[i])[0])
    for m in re.finditer(r"\[([^\]]*)\]\.map\(T\)", src):   # ['a', 'b'].map(T)
        keys += [read_quoted(q.group(0), 0, "'")[0] for q in re.finditer(r"'(?:[^'\\]|\\.)*'", m.group(1))]
    return keys


class Texts(HTMLParser):
    SKIP = {"script", "style"}

    def __init__(self):
        super().__init__()
        self.stack, self.keys = [], []

    def handle_starttag(self, tag, attrs):
        if tag not in ("input", "br", "meta", "link", "img", "path", "rect", "circle", "line"):
            self.stack.append(tag)
        for k, v in attrs:
            if k in ("title", "placeholder") and v:
                self.keys.append(v.strip())

    def handle_endtag(self, tag):
        if tag in self.stack:
            while self.stack.pop() != tag:
                pass

    def handle_data(self, data):
        t = " ".join(data.split())
        if t and not (set(self.stack) & self.SKIP) and re.search(r"[A-Za-zÄÖÜäöü]{2}", t):
            self.keys.append(t)


def dictionary():
    src = (DESIGNER / "i18n.js").read_text(encoding="utf-8")
    body = src[src.index("const EN = {") + 12:]
    keys, i = set(), 0
    while True:
        while body[i] in " \t\r\n,":
            i += 1
        if body.startswith("//", i):
            i = body.index("\n", i)
            continue
        if body[i] == "}":
            return keys
        k, i = read_quoted(body, i, body[i])
        keys.add(k)
        i = body.index(":", i) + 1
        while body[i] in " \t":
            i += 1
        _, i = read_quoted(body, i, body[i])


# texts that stay the same in English
SAME = {"Drawer Divider", "Drawer Divider Designer", "EN", "Designer", "PLA", "PETG", "ABS", "ASA", "OK", "Position", "Export", "Zoom", "Material"}


def main():
    want = []
    for f in ("app.js", "stl.js", "laser.js", "guide.js"):
        want += js_keys((DESIGNER / f).read_text(encoding="utf-8"))
    p = Texts()
    p.feed((DESIGNER / "dev.html").read_text(encoding="utf-8"))
    want += p.keys
    have = dictionary()
    missing = sorted({k for k in want if k not in have and k not in SAME})
    unused = sorted(have - set(want))
    for k in missing:
        print("missing:", repr(k))
    for k in unused:
        print("unused: ", repr(k))
    print(f"{len(set(want))} texts, {len(missing)} missing, {len(unused)} unused")
    return not missing


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
