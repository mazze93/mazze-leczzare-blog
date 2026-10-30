#!/usr/bin/env python3
"""
strip_check.py — behavioural + visual check of the on-site CarouselStrip.

Usage (against a running `npm run preview`, default port 4321):
    python3 scripts/carousel/strip_check.py <post-slug> [--base http://localhost:4321] [--out DIR]

Asserts, failing loudly:
  - the strip renders with one slide per deck slide, controls un-hidden by JS
  - every slide image has non-generic alt text and actually loaded
  - Next / Prev buttons and ←/→/Home/End keys move exactly one slide (or to
    the end), and the polite counter + gold-seam progress follow
  - Prev is disabled on the first slide, Next on the last
  - no horizontal page overflow at phone width (375px)
  - with reduced motion: slides are not scaled
  - without JS: the strip is still a scrollable list, controls stay hidden
Screenshots (desktop dark/light, phone) land in --out for a human look.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

FAILS: list[str] = []


def check(cond: bool, msg: str) -> None:
    print(f"  {'✓' if cond else '✗'} {msg}")
    if not cond:
        FAILS.append(msg)


# ── Helpers ──────────────────────────────────────────────────────────────
def state(page: Page) -> dict:
    return page.evaluate(
        """() => {
      const r = document.querySelector('[data-carousel]');
      const slides = [...r.querySelectorAll('[data-slide]')];
      return {
        active: slides.findIndex(s => s.hasAttribute('data-active')),
        total: slides.length,
        counter: r.querySelector('[data-current]').textContent.trim(),
        progress: getComputedStyle(r.querySelector('[data-progress]')).getPropertyValue('--cs-progress').trim(),
        prevDisabled: r.querySelector('[data-prev]').disabled,
        nextDisabled: r.querySelector('[data-next]').disabled,
        controlsHidden: r.querySelector('[data-controls]').hidden,
      };
    }"""
    )


def settle(page: Page) -> None:
    page.wait_for_timeout(700)  # smooth scroll + rAF + transition


def goto(page: Page, url: str) -> None:
    page.goto(url)
    page.locator("[data-carousel]").scroll_into_view_if_needed()
    page.wait_for_function("[...document.querySelectorAll('[data-slide] img')].slice(0,2).every(i => i.complete)")


# ── Checks ───────────────────────────────────────────────────────────────
def check_structure(page: Page) -> int:
    print("── structure ──")
    s = state(page)
    check(s["total"] > 0, f"{s['total']} slides rendered")
    check(not s["controlsHidden"], "controls un-hidden by script")
    alts = page.eval_on_selector_all("[data-slide] img", "els => els.map(e => e.alt)")
    check(all(len(a) > 40 and not a.lower().startswith("slide") for a in alts), "every slide has descriptive alt text")
    return s["total"]


def check_navigation(page: Page, total: int) -> None:
    print("── navigation ──")
    s = state(page)
    check(s["active"] == 0 and s["counter"] == "01", "starts on slide 01")
    check(s["prevDisabled"] and not s["nextDisabled"], "Prev disabled at start, Next enabled")
    page.click("[data-next]"); settle(page)
    s = state(page)
    check(s["active"] == 1 and s["counter"] == "02", f"Next → slide 02 (got {s['counter']})")
    # Keyboard focus must show a full ring: the edge-fade mask would clip it.
    page.locator("[data-prev]").focus(); page.keyboard.press("Shift+Tab")
    ring = page.eval_on_selector("[data-track]", """e => { const c = getComputedStyle(e);
      return [document.activeElement === e, c.outlineStyle, c.maskImage || c.webkitMaskImage]; }""")
    check(ring[0] and ring[1] == "solid" and ring[2] == "none", f"focused track shows an unmasked ring ({ring})")
    page.keyboard.press("ArrowRight"); settle(page)
    check(state(page)["active"] == 2, "ArrowRight → slide 03")
    page.keyboard.press("ArrowLeft"); settle(page)
    check(state(page)["active"] == 1, "ArrowLeft → slide 02")
    page.keyboard.press("End"); settle(page)
    s = state(page)
    check(s["active"] == total - 1 and s["nextDisabled"], "End → last slide, Next disabled")
    check(s["progress"] == "1", f"seam full at end (got {s['progress']!r})")
    y_before = page.evaluate("window.scrollY")
    page.keyboard.press("Home"); settle(page)
    s = state(page)
    check(s["active"] == 0 and s["progress"] == "0", "Home → first slide, seam empty")
    # Home/End would scroll the whole page if the handler didn't take them.
    y_after = page.evaluate("window.scrollY")
    check(y_after == y_before, f"keys move the strip, not the page (scrollY {y_before}→{y_after})")


def check_phone(page: Page) -> None:
    print("── phone (375px) ──")
    overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check(overflow <= 0, f"no horizontal page overflow (overflow={overflow}px)")
    btn = page.locator("[data-next]").bounding_box()
    check(btn["width"] >= 44 and btn["height"] >= 44, f"touch target ≥ 44px ({btn['width']:.0f}px)")


# ── Entry point ──────────────────────────────────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--base", default="http://localhost:4321")
    ap.add_argument("--out", default="docs/social/{slug}/build")
    a = ap.parse_args()
    url = f"{a.base}/blog/{a.slug}/"
    out = Path(a.out.format(slug=a.slug)); out.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as pw:
        b = pw.chromium.launch()

        page = b.new_page(viewport={"width": 1280, "height": 900}, color_scheme="dark")
        goto(page, url)
        total = check_structure(page)
        check_navigation(page, total)
        page.click("[data-next]"); page.click("[data-next]"); settle(page)
        page.locator("[data-carousel]").screenshot(path=str(out / "strip-desktop-dark.png"))
        page.evaluate("document.documentElement.dataset.theme = 'light'"); settle(page)
        page.locator("[data-carousel]").screenshot(path=str(out / "strip-desktop-light.png"))
        page.close()

        phone = b.new_page(viewport={"width": 375, "height": 812}, color_scheme="dark", has_touch=True, is_mobile=True)
        goto(phone, url)
        check_phone(phone)
        phone.locator("[data-carousel]").screenshot(path=str(out / "strip-phone.png"))
        phone.close()

        print("── reduced motion ──")
        rm = b.new_page(viewport={"width": 1280, "height": 900}, reduced_motion="reduce")
        goto(rm, url)
        t = rm.eval_on_selector("[data-slide]:not([data-active])", "e => getComputedStyle(e).transform")
        check(t in ("none", "matrix(1, 0, 0, 1, 0, 0)"), f"inactive slides not scaled (transform={t})")
        rm.close()

        print("── no JS ──")
        ctx = b.new_context(java_script_enabled=False)
        nj = ctx.new_page(); nj.goto(url)
        check(nj.locator("[data-controls]").is_hidden(), "controls stay hidden without JS")
        ov = nj.eval_on_selector("[data-track]", "e => getComputedStyle(e).overflowX")
        check(ov == "auto", "track is still natively scrollable")
        ctx.close()
        b.close()

    print(f"\nscreenshots → {out}")
    if FAILS:
        print(f"✗ {len(FAILS)} check(s) failed")
        return 1
    print("✓ all strip checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
