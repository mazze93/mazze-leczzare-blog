#!/usr/bin/env python3
"""
near_touch.py — find pairs of stroked shapes that come within a few pixels of
each other without crossing: the "near-tangent" defect class that the map
rebuild found by eye twice, and that vision models are documented to misjudge.

Usage: python3 near_touch.py file.svg [lo_px] [hi_px]
Pure geometry: transforms applied, shapes sampled every ~1px, stroke widths
subtracted (gap = centre distance − half-widths). Reports pairs whose closest
approach is a visible gap of lo..hi px AND that never touch anywhere.
"""
import sys
import numpy as np
from scipy.spatial import cKDTree
from svgelements import SVG, Shape, Path

def sample(shape, step=1.0):
    path = Path(shape) if not isinstance(shape, Path) else shape
    path = path * shape.transform if False else path
    pts = []
    for seg in path.segments():
        try:
            L = seg.length(error=1e-2)
        except Exception:
            continue
        n = max(2, int(L / step))
        for t in np.linspace(0, 1, n):
            p = seg.point(t)
            if p is not None:
                pts.append((p.x, p.y))
    return np.array(pts)

def main(fn, lo=0.5, hi=4.0):
    svg = SVG.parse(fn, reify=True)
    items = []
    for el in svg.elements():
        if not isinstance(el, Shape) or el.stroke is None or el.stroke.value is None:
            continue
        sw = float(el.stroke_width or 0) * (el.transform.value_scale_x() if el.transform else 1)
        if sw <= 0:
            continue
        pts = sample(el)
        if len(pts) < 2:
            continue
        items.append((el.id or el.__class__.__name__, sw, pts, str(el.stroke)))
    trees = [cKDTree(p) for _, _, p, _ in items]
    hits = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            d, _ = trees[j].query(items[i][2], k=1)
            k = int(np.argmin(d))
            gap = d[k] - (items[i][1] + items[j][1]) / 2
            if lo <= gap <= hi:
                hits.append((round(gap, 2), i, j, tuple(np.round(items[i][2][k], 1))))
    hits.sort()
    print(f"{len(items)} stroked shapes, {len(hits)} near-touch pairs with a visible gap of {lo}–{hi}px")
    for gap, i, j, at in hits[:40]:
        print(f"  gap {gap:>5}px at {at}: [{i}] {items[i][3]} w{items[i][1]:.1f}  ↔  [{j}] {items[j][3]} w{items[j][1]:.1f}")

if __name__ == "__main__":
    a = sys.argv
    main(a[1], float(a[2]) if len(a) > 2 else 0.5, float(a[3]) if len(a) > 3 else 4.0)
