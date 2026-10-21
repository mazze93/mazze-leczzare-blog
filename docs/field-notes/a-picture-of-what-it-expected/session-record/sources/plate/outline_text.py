#!/usr/bin/env python3
"""
outline_text.py — set a line of text in a real font and emit it as SVG paths.

Why: an SVG served as <img> cannot load web fonts, so live <text> falls back
to whatever serif the viewer has (the map rebuild rendered in DejaVu because
Georgia wasn't installed). Outlined glyphs render identically everywhere.
Shaping (kerning, ligatures) via HarfBuzz; outlines via fontTools.

    line_to_path(font_path, text, size, x, y, anchor="middle", tracking=0) -> (d, width)
"""
import io

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

_cache = {}


def _load(path):
    if path not in _cache:
        data = open(path, "rb").read()
        tt = TTFont(io.BytesIO(data))             # woff2 handled by fontTools (needs brotli)
        buf = io.BytesIO(); tt.flavor = None; tt.save(buf)
        raw = buf.getvalue()
        face = hb.Face(raw)
        _cache[path] = (tt, hb.Font(face), face.upem)
    return _cache[path]


def line_to_path(path, text, size, x, y, anchor="middle", tracking=0.0):
    tt, font, upem = _load(path)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    scale = size / upem
    glyph_order = tt.getGlyphOrder()
    gs = tt.getGlyphSet()
    track = tracking * size
    width = sum(p.x_advance for p in buf.glyph_positions) * scale + track * (len(buf.glyph_infos) - 1)
    x0 = {"start": x, "middle": x - width/2, "end": x - width}[anchor]
    pen_x, out = x0, []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = glyph_order[info.codepoint]
        sp = SVGPathPen(gs)
        # font units → px, y flipped, offset to the pen position
        tp = TransformPen(sp, (scale, 0, 0, -scale, pen_x + pos.x_offset*scale, y - pos.y_offset*scale))
        gs[name].draw(tp)
        d = sp.getCommands()
        if d:
            out.append(d)
        pen_x += pos.x_advance * scale + track
    return " ".join(out), width
