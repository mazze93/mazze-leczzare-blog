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
]


def font_faces(font_bytes: dict[str, bytes]) -> str:
    rules = []
    for family, weight, style, path in FONT_FILES:
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


KINDS = {
    "cover": (k_cover, True), "statement": (k_statement, True), "close": (k_close, True),
    "definition": (k_definition, False), "senses": (k_senses, False),
    "manifest": (k_manifest, False), "evidence": (k_evidence, False),
}


# ── Assembly ─────────────────────────────────────────────────────────────
def slide_html(deck: dict, s: dict, idx: int, total: int) -> str:
    builder, on_ink = KINDS[s["kind"]]
    # URL as two lines — path, then the unbroken slug — never split mid-word or at a hyphen.
    path, _, slug = deck["url"].rpartition("/")
    inner = builder(s).replace("{url}", f'{e(path)}/<span class="slug">{e(slug)}</span>')
    guide = s.get("headword") or s.get("guide", "")
    return (
        f'<section class="slide{" ink cover" if s["kind"] == "cover" else (" ink" if on_ink else "")}" '
        f'id="s{idx:02d}" aria-label="Slide {idx} of {total}">'
        '<div class="grain" aria-hidden="true"></div>'
        f'<header class="head"><span>{e(deck["eyebrow"])}</span><span class="guide">{e(guide)}</span></header>'
        f'<div class="body">{inner}</div>'
        f'<footer class="foot"><span class="by"><b>{e(deck["byline"])}</b> · mazzeleczzare.com</span>'
        f'<span>{idx:02d} / {total:02d}</span></footer>'
        "</section>"
    )


def render(deck: dict, theme_css: str, font_bytes: dict[str, bytes]) -> str:
    total = len(deck["slides"])
    slides = "\n".join(slide_html(deck, s, i + 1, total) for i, s in enumerate(deck["slides"]))
    return (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        f'<title>{e(deck["title"])} — carousel</title>'
        f'<meta name="author" content="{e(deck["byline"])}">'
        f"<style>{font_faces(font_bytes)}\n{theme_css}\n.sr{{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}}</style>"
        f"</head><body>{slides}</body></html>"
    )
