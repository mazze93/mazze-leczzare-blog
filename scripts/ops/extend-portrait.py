#!/usr/bin/env python3
"""
extend-portrait.py — widen the square about-page portrait into a 2:1 frame by
extending the photograph's own backdrop, never by cropping the subject.

Why: the /about hero is wide, the headshot is square. Cropping it to fill the
frame gave a giant zoomed-in head; letterboxing it against a flat colour left
a visible band where the photo's studio vignette met the flat fill. This
extends the backdrop from the photo's own outer edges instead, so tone,
falloff and grain continue past the original frame.

Method (deterministic — same input, same output):
  1. Read per-row colour profiles from each side of the photo: the seam
     columns, and a wider outer band. (An earlier version mirror-tiled the
     edge pixels; even blurred, the tiles read as vertical stripes.)
  2. Fill each side from the seam colour, relaxing to the band colour, and
     continue the studio vignette: darker with distance from the photo.
  3. Add the backdrop's texture back — low-frequency mottling and fine grain,
     each measured from a pure-backdrop patch of the photo, fixed seed.
  4. Composite the untouched photo in the centre over a feathered seam. The
     extension starts from the seam's own colour, so tone matches there.

The original photo is never modified; the subject is never scaled or moved.

Usage:
  python3 scripts/ops/extend-portrait.py \
      public/mazze-headshot.jpg src/assets/images/about/mazze-portrait-wide.jpg
Requires: Pillow, numpy.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

# ── Tunables ────────────────────────────────────────────────────────────────
OUT_ASPECT = 2.0        # output width / height
EDGE_PX = 12            # columns averaged for the seam colour of each row
BAND_FRAC = 0.08        # outer band averaged for the far-field colour of each row
PROFILE_SIGMA = 24      # vertical smoothing of the per-row profiles, px per 1600
RELAX_FRAC = 0.35       # distance (fraction of the extension) to go from seam colour to band colour
FEATHER_FRAC = 0.09     # seam feather, as a fraction of the photo width
VIGNETTE_FLOOR = 0.66   # brightness multiplier reached at the outer frame edge
MOTTLE_CELL = 48        # px per 1600; size of the backdrop's low-frequency blotches
SEED = 20260927         # grain and mottling are reproducible


def smooth_rows(profile: np.ndarray, sigma: float) -> np.ndarray:
    """Gaussian-smooth an (H×3) per-row colour profile along H. Pure."""
    radius = int(3 * sigma)
    k = np.exp(-0.5 * (np.arange(-radius, radius + 1) / sigma) ** 2)
    k /= k.sum()
    padded = np.pad(profile, ((radius, radius), (0, 0)), mode="edge")
    return np.stack([np.convolve(padded[:, c], k, mode="valid") for c in range(3)], axis=1)


def backdrop_stats(photo: np.ndarray, scale: float) -> tuple[float, float]:
    """(fine grain std, low-frequency mottle std) of a pure-backdrop patch,
    top-left above the subject. Pure."""
    h, w, _ = photo.shape
    patch = photo[int(h * 0.05):int(h * 0.30), int(w * 0.02):int(w * 0.12)].mean(axis=2)
    img = Image.fromarray(patch.clip(0, 255).astype(np.uint8))
    fine = np.asarray(img.filter(ImageFilter.GaussianBlur(3)), dtype=np.float32)
    coarse = np.asarray(img.filter(ImageFilter.GaussianBlur(MOTTLE_CELL * scale)), dtype=np.float32)
    return float((patch - fine).std()), float((fine - coarse).std())


def side_extension(seam: np.ndarray, far: np.ndarray, width: int) -> np.ndarray:
    """Fill `width` columns running away from the photo: seam colour at
    column 0 relaxing to the far-field band colour, then the studio vignette.
    Columns are ordered seam → frame edge. Pure."""
    d = np.arange(width, dtype=np.float32) / max(width - 1, 1)
    t = np.clip(d / RELAX_FRAC, 0, 1)
    t = t * t * (3 - 2 * t)
    base = seam[:, None, :] * (1 - t)[None, :, None] + far[:, None, :] * t[None, :, None]
    vignette = 1.0 - (1.0 - VIGNETTE_FLOOR) * d ** 1.4
    return base * vignette[None, :, None]


def extend(src: Path, dst: Path) -> None:
    """Build the wide image. Side effect: writes `dst` (JPEG, q92)."""
    photo = np.asarray(Image.open(src).convert("RGB"), dtype=np.float32)  # native size, not resampled
    h, w, _ = photo.shape
    scale = h / 1600
    out_w = int(round(h * OUT_ASPECT))
    side = (out_w - w) // 2
    band_w = max(8, int(w * BAND_FRAC))
    sigma = PROFILE_SIGMA * scale

    # 1. Per-row colour profiles from the photo's own edges. Built from rows,
    #    not tiled pixels, so the extension has no horizontal structure to
    #    repeat — the backdrop's vertical falloff carries straight across.
    l_seam = smooth_rows(photo[:, :EDGE_PX].mean(axis=1), sigma)
    l_far = smooth_rows(photo[:, :band_w].mean(axis=1), sigma * 2)
    r_seam = smooth_rows(photo[:, w - EDGE_PX:].mean(axis=1), sigma)
    r_far = smooth_rows(photo[:, w - band_w:].mean(axis=1), sigma * 2)

    # 2. Fill each side, seam → frame edge (left side is built mirrored).
    left = side_extension(l_seam, l_far, side)[:, ::-1]
    right = side_extension(r_seam, r_far, out_w - side - w)
    canvas = np.concatenate([left, photo, right], axis=1)
    extension = canvas.copy()

    # 3. Texture measured from the photo's backdrop: low-frequency mottling
    #    plus fine grain, both from a fixed seed.
    grain_std, mottle_std = backdrop_stats(photo, scale)
    rng = np.random.default_rng(SEED)
    cell = max(4, int(MOTTLE_CELL * scale))
    coarse = rng.normal(0.0, 1.0, size=(h // cell + 2, out_w // cell + 2)).astype(np.float32)
    coarse_img = Image.fromarray(((coarse - coarse.min()) / (np.ptp(coarse) or 1) * 255).astype(np.uint8))
    mottle = np.asarray(coarse_img.resize((out_w, h), Image.BICUBIC), dtype=np.float32)
    mottle = (mottle - mottle.mean()) / (mottle.std() or 1) * mottle_std
    grain = rng.normal(0.0, grain_std, size=(h, out_w)).astype(np.float32)
    extension = extension + (mottle + grain)[:, :, None]

    # 4. Composite the untouched photo over a feathered seam.
    feather = max(2, int(w * FEATHER_FRAC))
    alpha = np.zeros(out_w, dtype=np.float32)
    ramp = np.linspace(0.0, 1.0, feather, dtype=np.float32)
    ramp = ramp * ramp * (3 - 2 * ramp)  # smoothstep
    alpha[side:side + w] = 1.0
    alpha[side:side + feather] = ramp
    alpha[side + w - feather:side + w] = ramp[::-1]
    photo_on_canvas = np.zeros_like(canvas)  # noqa: canvas holds the photo only for shape
    photo_on_canvas[:, side:side + w] = photo
    result = photo_on_canvas * alpha[None, :, None] + extension * (1 - alpha[None, :, None])

    dst.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(result.clip(0, 255).astype(np.uint8)).save(dst, quality=92, optimize=True, progressive=True)
    print(f"wrote {dst} ({out_w}x{h}); photo untouched at x={side}..{side + w}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    extend(Path(sys.argv[1]), Path(sys.argv[2]))
