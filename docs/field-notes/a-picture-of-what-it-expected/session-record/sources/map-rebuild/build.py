#!/usr/bin/env python3
"""
build.py — assemble the celestial map from hand-placed layer fragments,
then render a PNG snapshot so every step can be inspected before the next.

Usage:
    python3 build.py            # build all layers, snapshot named after the top layer
    python3 build.py --crop X Y W H   # also write a zoomed crop of the latest render

Side effects (explicit):
    writes map.svg                      — the assembled, standalone SVG
    writes snapshots/step-NN-name.png   — full render of the current stack
    writes snapshots/crop.png           — only when --crop is given
"""
import sys
from pathlib import Path

import cairosvg

ROOT = Path(__file__).parent
LAYERS = ROOT / "layers"
SNAPS = ROOT / "snapshots"
SIZE = 1000

# ── Root wrapper ────────────────────────────────────────────────
HEAD = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}"
     width="{SIZE}" height="{SIZE}" role="img" aria-labelledby="map-title map-desc">
  <title id="map-title">Celestial survey map</title>
  <desc id="map-desc">An engraved-style chart: a winged, flame-like figure rising from
  layered ground inside concentric orbital rings, with ochre elevation contours,
  a compass rose and a distance scale.</desc>
'''
TAIL = "</svg>\n"


def layer_files():
    """Return layer fragments in build order (NN-name.svg)."""
    return sorted(LAYERS.glob("[0-9][0-9]-*.svg"))


def assemble(files):
    """Concatenate fragments inside the root element, each fenced by a comment."""
    body = []
    for f in files:
        body.append(f"  <!-- ═══ {f.stem} ═══ -->\n")
        body.append(f.read_text())
    return HEAD + "".join(body) + TAIL


def render(svg_text, out_png):
    """Rasterise the SVG to a PNG at native size."""
    cairosvg.svg2png(bytestring=svg_text.encode(), write_to=str(out_png),
                     output_width=SIZE, output_height=SIZE)


def crop(png_in, box, png_out, scale=3):
    """Write an enlarged crop (x, y, w, h in SVG units) for close inspection."""
    from PIL import Image
    x, y, w, h = box
    img = Image.open(png_in).crop((x, y, x + w, y + h))
    img.resize((w * scale, h * scale), Image.NEAREST).save(png_out)


def main(argv):
    files = layer_files()
    if not files:
        sys.exit("no layers yet")
    svg = assemble(files)
    (ROOT / "map.svg").write_text(svg)
    SNAPS.mkdir(exist_ok=True)
    snap = SNAPS / f"step-{files[-1].stem}.png"
    render(svg, snap)
    print(f"built {len(files)} layer(s) -> {snap.name}")
    if "--crop" in argv:
        i = argv.index("--crop")
        box = tuple(int(v) for v in argv[i + 1:i + 5])
        crop(snap, box, SNAPS / "crop.png")
        print(f"crop {box} -> crop.png")


if __name__ == "__main__":
    main(sys.argv[1:])
