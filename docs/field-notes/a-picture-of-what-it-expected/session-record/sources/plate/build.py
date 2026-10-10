#!/usr/bin/env python3
"""
build.py — assemble the plate from layer fragments and render it.

Every run is kept: iterations/iter-NNN-<toplayer>.{svg,png}. Nothing is
overwritten, so the record shows the failed states too, not just the
fixed ones. (The map rebuild overwrote its snapshots; that lost the
"before" images. This fixes that.)

Usage:
    python3 build.py                 # build + render with resvg (filters supported)
    python3 build.py --crop X Y W H  # also write iterations/crop.png (3x)
    python3 build.py --cairo         # also render with cairosvg for comparison
"""
import io
import sys
from pathlib import Path

import resvg_py
from PIL import Image

ROOT = Path(__file__).parent
LAYERS, ITERS = ROOT / "layers", ROOT / "iterations"
W, H = 900, 1200

HEAD = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"
     role="img" aria-labelledby="plate-title plate-desc">
  <title id="plate-title">The Measure Taken</title>
  <desc id="plate-desc">An illuminated plate after William Blake. A blazing sun
  disc among dark, smoky clouds lowers a pair of brass dividers on a beam of
  light. Their points rest on the two ends of a break in a pale ring scored into
  the earth; the break is mended with a seam of gold. A small figure kneels on
  hands and knees beside it, reaching toward the seam. Beneath, a couplet:
  "The hand that swears it drew the ring / Must stoop to see the broken thing."</desc>
'''
TAIL = "</svg>\n"


def layer_files():
    """Layer fragments in build order (NN-name.svg)."""
    return sorted(LAYERS.glob("[0-9][0-9]-*.svg"))


def next_iter():
    """Next free iteration number; iterations are never overwritten."""
    nums = [int(p.name[5:8]) for p in ITERS.glob("iter-*.svg")]
    return max(nums, default=0) + 1


def assemble(files):
    return HEAD + "".join(f"  <!-- ═══ {f.stem} ═══ -->\n{f.read_text()}" for f in files) + TAIL


def render_resvg(svg):
    data = resvg_py.svg_to_bytes(svg_string=svg, width=W, height=H)
    return Image.open(io.BytesIO(bytes(data))).convert("RGB")


def main(argv):
    files = layer_files()
    svg = assemble(files)
    (ROOT / "plate.svg").write_text(svg)
    n = next_iter()
    stem = ITERS / f"iter-{n:03d}-{files[-1].stem}"
    stem.with_suffix(".svg").write_text(svg)
    img = render_resvg(svg)
    img.save(stem.with_suffix(".png"))
    print(f"iter {n:03d}: {len(files)} layer(s) -> {stem.name}.png")
    if "--crop" in argv:
        i = argv.index("--crop")
        x, y, w, h = (int(v) for v in argv[i + 1:i + 5])
        img.crop((x, y, x + w, y + h)).resize((w * 3, h * 3), Image.NEAREST).save(ITERS / "crop.png")
    if "--cairo" in argv:
        import cairosvg
        cairosvg.svg2png(bytestring=svg.encode(), write_to=str(ITERS / "cairo.png"), output_width=W, output_height=H)
        print("cairo render -> cairo.png")


if __name__ == "__main__":
    main(sys.argv[1:])
