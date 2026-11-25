"""
render.py — slides.json → one self-contained HTML document, one slide per page.

Pure: takes parsed data + theme CSS + font bytes, returns an HTML string.
No file or network I/O here (build.py owns that), so templates are testable.

Every slide carries the same chrome — running head (eyebrow + guide word) and
footer (byline, URL, page count) — so a slide screenshotted and reshared
alone still points back to the post.
"""
from __future__ import annotations

import base64
from html import escape

# ── Fonts ────────────────────────────────────────────────────────────────
# (family, weight, style, fontsource file) — resolved by build.py.
FONT_FILES = [
    ("Playfair Display", 400, "normal", "playfair-display/files/playfair-display-latin-400-normal.woff2"),
    ("Playfair Display", 700, "normal", "playfair-display/files/playfair-display-latin-700-normal.woff2"),
    ("Playfair Display", 700, "italic", "playfair-display/files/playfair-display-latin-700-italic.woff2"),
    ("Playfair Display", 900, "normal", "playfair-display/files/playfair-display-latin-900-normal.woff2"),
    ("Playfair Display", 400, "italic", "playfair-display/files/playfair-display-latin-400-italic.woff2"),
    ("Literata", 400, "normal", "literata/files/literata-latin-400-normal.woff2"),
    ("Literata", 400, "italic", "literata/files/literata-latin-400-italic.woff2"),
    ("Literata", 600, "normal", "literata/files/literata-latin-600-normal.woff2"),
    ("DM Mono", 400, "normal", "dm-mono/files/dm-mono-latin-400-normal.woff2"),
    ("DM Mono", 500, "normal", "dm-mono/files/dm-mono-latin-500-normal.woff2"),
    ("Cormorant Garamond", 500, "normal", "cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2"),
    ("Cormorant Garamond", 600, "normal", "cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2"),
    ("Cormorant Garamond", 600, "italic", "cormorant-garamond/files/cormorant-garamond-latin-600-italic.woff2"),
    ("Cormorant Garamond", 700, "normal", "cormorant-garamond/files/cormorant-garamond-latin-700-normal.woff2"),
    ("Crimson Pro", 400, "normal", "crimson-pro/files/crimson-pro-latin-400-normal.woff2"),
    ("Crimson Pro", 400, "italic", "crimson-pro/files/crimson-pro-latin-400-italic.woff2"),
    ("Crimson Pro", 600, "normal", "crimson-pro/files/crimson-pro-latin-600-normal.woff2"),
]


def font_faces(font_bytes: dict[str, bytes], theme_css: str = "") -> str:
    """Inline only the families the theme names, so each deck carries its
    own type and an older deck's HTML (and so its PDF) stays byte-identical
    when a family is added here for a newer theme."""
    rules = []
    for family, weight, style, path in FONT_FILES:
        if theme_css and f'"{family}"' not in theme_css:
            continue
        b64 = base64.b64encode(font_bytes[path]).decode()
        rules.append(
            f'@font-face{{font-family:"{family}";font-weight:{weight};font-style:{style};'
            f'font-display:block;src:url(data:font/woff2;base64,{b64}) format("woff2");}}'
        )
    return "\n".join(rules)


# ── Small builders ───────────────────────────────────────────────────────
def e(text: str) -> str:
    return escape(text, quote=True)


def ul(items: list[str], numbered: bool = False) -> str:
    cls = "list numbered" if numbered else "list"
    return f'<ul class="{cls}">' + "".join(f"<li>{e(i)}</li>" for i in items) + "</ul>"


def entry(word: str, pos: str) -> str:
    return f'<div class="entry"><span class="headword" lang="en">{e(word)}</span><span class="pos">{e(pos)}</span></div>'


def para(cls: str, text: str | None) -> str:
    return f'<p class="{cls}">{e(text)}</p>' if text else ""


# ── Slide kinds: each returns the inner .body HTML ──────────────────────
def k_cover(s: dict) -> str:
    return (
        entry(s["headword"], s["pos"])
        + f'<p class="exec" aria-label="{e(s["exec_caption"])}"><span class="k">if</span> {e(s["exec"])}</p>'
        + f'<h1 class="title">{e(s["title"])}</h1>'
        + para("lede", s["body"])
    )


def k_statement(s: dict) -> str:
    return (
        para("label", s["label"])
        + f'<h2 class="headline">{e(s["headline"])}</h2>'
        + para("lede", s.get("body"))
        + (ul(s["list"]) if s.get("list") else "")
        + para("coda", s.get("coda"))
    )


def k_definition(s: dict) -> str:
    return (
        para("label", s["label"])
        + entry(s["headword"], s["pos"])
        + '<div class="sense"><span class="n">1.</span>'
        + '<span class="mk" aria-hidden="true">−</span>'
        + f'<del class="del"><span class="sr">Struck: </span>{e(s["struck"])}</del>'
        + '<span class="mk add" aria-hidden="true">+</span>'
        + f'<span class="def">{e(s["definition"])}</span></div>'
        + para("text", s["body"])
    )


def k_senses(s: dict) -> str:
    return para("label", s["label"]) + entry(s["headword"], s["pos"]) + ul(s["list"], numbered=True) + para("text", s["body"])


def k_manifest(s: dict) -> str:
    rows = "".join(
        f'<span class="k">{e(k)}</span>: {e(v)}\n' for k, v in s["manifest"]
    )
    return (
        para("label", s["label"])
        + f'<h2 class="headline" style="font-size:58px">{e(s["headline"])}</h2>'
        + f'<pre class="manifest"><span class="file">{e(s["manifest_file"])}</span>{rows}</pre>'
    )


def k_evidence(s: dict) -> str:
    cards = "".join(
        f'<div class="cite"><p class="src">{e(src)}</p><p>{e(claim)}</p></div>' for src, claim in s["items"]
    )
    return para("label", s["label"]) + cards + para("coda", s["body"])


def k_close(s: dict) -> str:
    return (
        para("label", s["label"])
        + f'<div class="callout"><p>{e(s["callout"])}</p></div>'
        + f'<p class="cta">{e(s["cta"])}<b>{{url}}</b></p>'
    )


LEDGER_SR = {"struck": "Struck through, left visible: ", "fix": "Correction: ", "note": ""}


def k_ledger(s: dict) -> str:
    """A ledger excerpt: numbered rows, one of which is struck but kept.
    The struck row stays legible on purpose; the record is the point."""
    rows = "".join(
        f'<div class="row {e(r["state"])}"><span class="ln">{e(r["n"])}</span>'
        + (f'<del><span class="sr">{LEDGER_SR["struck"]}</span>{e(r["text"])}</del>'
           if r["state"] == "struck" else
           f'<span class="tx"><span class="sr">{LEDGER_SR.get(r["state"], "")}</span>{e(r["text"])}</span>')
        + (f'<span class="tag">{e(r["tag"])}</span>' if r.get("tag") else "")
        + "</div>"
        for r in s["rows"]
    )
    return (
        para("label", s["label"])
        + (f'<h2 class="headline">{e(s["headline"])}</h2>' if s.get("headline") else "")
        + f'<div class="ledger">{rows}</div>'
        + para("coda", s.get("coda"))
    )


KINDS = {
    "cover": (k_cover, True), "statement": (k_statement, True), "close": (k_close, True),
    "definition": (k_definition, False), "senses": (k_senses, False),
    "manifest": (k_manifest, False), "evidence": (k_evidence, False),
    "ledger": (k_ledger, False),
}


# ── Motif: one mended crack through the whole deck ──────────────────────
def _seeded(slug: str):
    """Deterministic 0–1 stream from the slug (FNV-1a seed, LCG step), so a
    rebuild draws the same crack and the PDF stays byte-reproducible."""
    h = 0x811C9DC5
    for ch in slug.encode():
        h = ((h ^ ch) * 0x01000193) & 0xFFFFFFFF
    def nxt() -> float:
        nonlocal h
        h = (h * 1664525 + 1013904223) & 0xFFFFFFFF
        return h / 0xFFFFFFFF
    return nxt


def seam_paths(slug: str, total: int, width: int = 1080, amp: float = 14.0) -> list[str]:
    """One SVG path per slide: a crack, then 1–2 short branching spurs.
    Slide i's right-edge height equals slide i+1's left-edge height, so
    swiping the deck reads as a single break, mended.

    A crack is short irregular runs: the line random-walks (it doesn't
    snap back to centre each step), with an occasional sharp kink, and is
    pulled gently toward centre so it never leaves the head's band."""
    rnd = _seeded(slug)
    edges = [round((rnd() - 0.5) * 2 * amp, 1) for _ in range(total + 1)]
    f = lambda v: f"{v:.1f}".rstrip("0").rstrip(".")
    paths = []
    for i in range(total):
        pts = [(0.0, edges[i])]
        x, y = 0.0, edges[i]
        while True:
            x += 14 + rnd() * 42
            if x >= width - 24:
                break
            kink = (rnd() - 0.5) * 2 * (26 if rnd() < 0.14 else 9)
            y = max(-amp * 1.6, min(amp * 1.6, y * 0.82 + kink))
            pts.append((x, y))
        # ease into the next slide's entry height over the last stretch
        pts.append((float(width), edges[i + 1]))
        d = "M" + " L".join(f"{f(px)},{f(py)}" for px, py in pts)
        # spurs: a short hairline crack splitting off the main line
        for _ in range(1 + (rnd() < 0.5)):
            sx, sy = pts[2 + int(rnd() * (len(pts) - 5))]
            dirn = 1  # downward only: upward spurs would cut into the running head's type
            rnd()     # keep the stream position, so the main line is unchanged
            spur = [(sx, sy)]
            for _ in range(2 + int(rnd() * 2)):
                sx += 10 + rnd() * 22
                sy += dirn * (5 + rnd() * 12)
                spur.append((sx, sy))
            d += " M" + " L".join(f"{f(px)},{f(py)}" for px, py in spur)
        paths.append(d)
    return paths


def seam_svg(d: str) -> str:
    return (
        '<svg class="seam" viewBox="0 -40 1080 80" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
        f'<path class="seam-glow" d="{d}"/><path class="seam-line" d="{d}"/></svg>'
    )


# ── Assembly ─────────────────────────────────────────────────────────────
def slide_html(deck: dict, s: dict, idx: int, total: int, seam: str = "") -> str:
    builder, on_ink = KINDS[s["kind"]]
    # URL as two lines — path, then the unbroken slug — never split mid-word or at a hyphen.
    path, _, slug = deck["url"].rpartition("/")
    inner = builder(s).replace("{url}", f'{e(path)}/<span class="slug">{e(slug)}</span>')
    guide = s.get("headword") or s.get("guide", "")
    return (
        f'<section class="slide{" ink cover" if s["kind"] == "cover" else (" ink" if on_ink else "")}" '
        f'id="s{idx:02d}" aria-label="Slide {idx} of {total}">'
        '<div class="grain" aria-hidden="true"></div>'
        f'<header class="head"><span>{e(deck["eyebrow"])}</span><span class="guide">{e(guide)}</span>{seam}</header>'
        f'<div class="body">{inner}</div>'
        f'<footer class="foot"><span class="by"><b>{e(deck["byline"])}</b> · mazzeleczzare.com</span>'
        f'<span>{idx:02d} / {total:02d}</span></footer>'
        "</section>"
    )


def render(deck: dict, theme_css: str, font_bytes: dict[str, bytes]) -> str:
    total = len(deck["slides"])
    seams = seam_paths(deck["slug"], total) if deck.get("motif") == "seam" else []
    slides = "\n".join(
        slide_html(deck, s, i + 1, total, seam_svg(seams[i]) if seams else "")
        for i, s in enumerate(deck["slides"])
    )
    return (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        f'<title>{e(deck["title"])} — carousel</title>'
        f'<meta name="author" content="{e(deck["byline"])}">'
        f"<style>{font_faces(font_bytes, theme_css)}\n{theme_css}\n.sr{{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}}</style>"
        f"</head><body>{slides}</body></html>"
    )
