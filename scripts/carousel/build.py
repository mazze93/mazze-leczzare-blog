#!/usr/bin/env python3
"""
build.py — build a carousel from docs/social/<slug>/slides.json.

Usage (from the repo root):
    python3 scripts/carousel/build.py <slug>            # build + checks
    python3 scripts/carousel/build.py <slug> --ship     # also copy PDF to public/social/

Steps, each failing loudly:
  1. copy gate  — copy_probe.py must pass (no introduced negation pivots/filler)
  2. contrast   — contrast.py must pass for the deck's theme
  3. render     — one self-contained HTML (fonts inlined from node_modules)
  4. inspect    — per-slide PNG at frame size + an overflow check in the DOM
  5. print      — ONE tagged page.pdf() call: real text layer, structure tree,
                  one page per slide. No PNG→PDF assembly, no merge step.
  6. ship       — (--ship) copy PDF to public/social/<slug>.pdf

Outputs land in docs/social/<slug>/build/ (gitignored; reproducible from
slides.json). The shipped PDF in public/social/ is the committed artifact.

Requires: `npm ci` (for @fontsource), Python `playwright` with Chromium
(`python3 -m playwright install chromium`), and `pypdf` for the PDF check.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from render import FONT_FILES, render  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
FONTSOURCE = ROOT / "node_modules" / "@fontsource"


# ── Gates ────────────────────────────────────────────────────────────────
def run_gate(name: str, cmd: list[str]) -> None:
    result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    print(f"── {name} ──\n{result.stdout.rstrip()}")
    if result.returncode != 0:
        sys.exit(f"✗ {name} gate failed — fix before building.\n{result.stderr}")


def load_fonts() -> dict[str, bytes]:
    missing = [p for *_, p in FONT_FILES if not (FONTSOURCE / p).is_file()]
    if missing:
        sys.exit(f"✗ fonts missing from node_modules/@fontsource — run `npm ci` first: {missing[0]}")
    return {p: (FONTSOURCE / p).read_bytes() for *_, p in FONT_FILES}


# Three spaced single glyphs then a fourth: catches "N I S T  A I" (which an
# earlier {4,}-run version missed — word gaps reset the run) and "D I S P A T C H".
SPACED_CAPS = re.compile(r"(?:\b[A-Z0-9] ){3}[A-Z0-9]\b")
assert SPACED_CAPS.search("N I S T  A I  R M F  1 . 0") and SPACED_CAPS.search("D I S P A T C H")
assert not SPACED_CAPS.search("NIST AI RMF 1.0 · DISPATCH · SECURITY ENGINEERING · I am")


# ── Render + inspect + print ─────────────────────────────────────────────
OVERFLOW_JS = """
() => [...document.querySelectorAll('.slide')].flatMap(s => {
  const sb = s.getBoundingClientRect();
  const body = s.querySelector('.body');
  const issues = [];
  if (body.scrollHeight > body.clientHeight + 1) issues.push(`${s.id}: content overflows body by ${body.scrollHeight - body.clientHeight}px`);
  s.querySelectorAll('.body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.right > sb.right - 60 + 1) issues.push(`${s.id}: <${el.tagName.toLowerCase()} class="${el.className}"> crosses the right gutter`);
  });
  return issues;
})
"""


def build(slug: str, ship: bool) -> Path:
    deck_dir = ROOT / "docs" / "social" / slug
    deck = json.loads((deck_dir / "slides.json").read_text())
    theme = HERE / "themes" / f"{deck['theme']}.css"
    post = next((ROOT / "src/content/blog").glob(f"{slug}.md*"), None)
    if post is None:
        sys.exit(f"✗ no source post at src/content/blog/{slug}.md(x)")

    run_gate("copy gate", [sys.executable, str(HERE / "copy_probe.py"), str(deck_dir / "slides.json"), str(post)])
    run_gate("contrast", [sys.executable, str(HERE / "contrast.py"), str(theme)])

    out = deck_dir / "build"
    out.mkdir(exist_ok=True)
    html_path = out / "carousel.html"
    html_path.write_text(render(deck, theme.read_text(), load_fonts()))

    w, h = deck["frame"]["width"], deck["frame"]["height"]
    pdf_path = out / f"{slug}.pdf"
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
        page.goto(html_path.as_uri())
        page.evaluate("document.fonts.ready")
        issues = page.evaluate(OVERFLOW_JS)
        for i, el in enumerate(page.query_selector_all(".slide"), start=1):
            el.screenshot(path=str(out / f"slide-{i:02d}.png"))
        page.pdf(path=str(pdf_path), width=f"{w}px", height=f"{h}px", print_background=True,
                 prefer_css_page_size=True, tagged=True, outline=False)
        browser.close()

    print("── layout ──")
    if issues:
        print("\n".join(f"  ✗ {i}" for i in issues))
        sys.exit("✗ layout check failed — see PNGs in " + str(out))
    print(f"  ✓ {len(deck['slides'])} slides, no overflow")
    verify_pdf(pdf_path, deck)

    if ship:
        dest = ROOT / "public" / "social" / f"{slug}.pdf"
        shutil.copyfile(pdf_path, dest)
        print(f"── shipped → {dest.relative_to(ROOT)}")
        ship_images(out, slug, len(deck["slides"]))
    return pdf_path


# Web previews for the on-site CarouselStrip. 864px wide covers the strip's
# largest rendered slide (~430 CSS px) at 2x density; WebP keeps a 9-slide
# deck well under 1 MB. Alt text is NOT baked in here — the component derives
# it from slides.json, the same source the PDF was built from.
WEB_WIDTH = 864
WEB_QUALITY = 82


def ship_images(build_dir: Path, slug: str, count: int) -> None:
    from PIL import Image

    dest = ROOT / "public" / "social" / slug
    dest.mkdir(exist_ok=True)
    for stale in dest.glob("*.webp"):  # a shorter deck must not leave orphans behind
        stale.unlink()
    total = 0
    for i in range(1, count + 1):
        img = Image.open(build_dir / f"slide-{i:02d}.png").convert("RGB")
        h = round(img.height * WEB_WIDTH / img.width)
        path = dest / f"{i:02d}.webp"
        img.resize((WEB_WIDTH, h), Image.LANCZOS).save(path, "WEBP", quality=WEB_QUALITY, method=6)
        total += path.stat().st_size
    print(f"── shipped {count} web previews → {dest.relative_to(ROOT)}/ ({total // 1024} KB total)")


def verify_pdf(pdf_path: Path, deck: dict) -> None:
    """Page count matches slides; every page has extractable text; set metadata."""
    from pypdf import PdfReader, PdfWriter

    reader = PdfReader(str(pdf_path))
    n = len(reader.pages)
    if n != len(deck["slides"]):
        sys.exit(f"✗ PDF has {n} pages for {len(deck['slides'])} slides — a slide spilled onto two pages")
    empty = [i + 1 for i, p in enumerate(reader.pages) if len((p.extract_text() or "").strip()) < 20]
    if empty:
        sys.exit(f"✗ pages with no text layer: {empty}")
    # Over-tracked type extracts as "D I S P A T C H" — searchable/readable text
    # is the reason this PDF is printed rather than assembled from PNGs.
    spaced = [i + 1 for i, p in enumerate(reader.pages) if SPACED_CAPS.search(p.extract_text() or "")]
    if spaced:
        sys.exit(f"✗ letter-spaced text breaks the text layer on pages {spaced} — reduce letter-spacing")
    writer = PdfWriter(clone_from=reader)  # clone keeps the structure tree
    # Pin dates to the deck's `issued` field so a rebuild of unchanged content is
    # byte-identical — otherwise every build rewrites the shipped PDF's timestamps.
    stamp = "D:" + deck["issued"].replace("-", "") + "000000+00'00'"
    writer.add_metadata({"/Title": deck["title"], "/Author": deck["byline"],
                         "/Subject": f"Carousel distilling https://{deck['url']}",
                         "/CreationDate": stamp, "/ModDate": stamp})
    with open(pdf_path, "wb") as fh:
        writer.write(fh)
    tagged = "/StructTreeRoot" in PdfReader(str(pdf_path)).trailer["/Root"]
    print(f"── pdf ──\n  ✓ {n} pages, text layer on every page, tagged={tagged}, "
          f"{pdf_path.stat().st_size // 1024} KB")
    if not tagged:
        sys.exit("✗ PDF lost its structure tree")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 1:
        print(__doc__)
        sys.exit(2)
    build(args[0], ship="--ship" in sys.argv)
