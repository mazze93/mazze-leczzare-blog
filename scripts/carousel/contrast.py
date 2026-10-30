#!/usr/bin/env python3
"""
contrast.py — verify WCAG contrast for a carousel theme's token pairs.

Usage:
    python3 scripts/carousel/contrast.py scripts/carousel/themes/<theme>.css

Parses `--name: #RRGGBB;` tokens from the theme's :root, then checks every
text-on-ground pair in PAIRS against WCAG 2.x AA. Carousel type is large
(>= 22px mono labels are the smallest), but the stricter 4.5:1 normal-text
bar is applied to every pair anyway — a slide is read on a phone at roughly
a third of its frame size. Exit code 1 on any failure.

Pure functions; I/O only in main().
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# (foreground token, background token) — every pair the theme actually uses.
PAIRS = [
    ("ink", "paper"), ("ink-2", "paper"), ("red", "paper"),
    ("ink", "paper-deep"), ("red", "paper-deep"),
    ("on-ink", "ink"), ("on-ink-2", "ink"), ("red-ink", "ink"),
]
AA_NORMAL = 4.5

TOKEN = re.compile(r"--([\w-]+):\s*(#[0-9A-Fa-f]{6})\s*;")


def parse_tokens(css: str) -> dict[str, str]:
    return {name: hexv for name, hexv in TOKEN.findall(css)}


def luminance(hexv: str) -> float:
    def chan(c: int) -> float:
        s = c / 255
        return s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4
    r, g, b = (int(hexv[i:i + 2], 16) for i in (1, 3, 5))
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)


def ratio(fg: str, bg: str) -> float:
    a, b = sorted((luminance(fg), luminance(bg)), reverse=True)
    return (a + 0.05) / (b + 0.05)


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__)
        return 2
    tokens = parse_tokens(Path(argv[1]).read_text())
    failures = 0
    for fg, bg in PAIRS:
        if fg not in tokens or bg not in tokens:
            print(f"  ? {fg} on {bg}: token missing — UNVERIFIED")
            failures += 1
            continue
        r = ratio(tokens[fg], tokens[bg])
        ok = r >= AA_NORMAL
        failures += 0 if ok else 1
        print(f"  {'✓' if ok else '✗'} {fg:9} on {bg:10} {r:5.1f}:1")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
