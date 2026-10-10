# Build log

Renderer: cairosvg 2.x at 1000×1000. Georgia is not installed here; it falls back to DejaVu Serif, which is wider. So text widths in these renders are pessimistic.

## Step 00 — frame
- **Added:** parchment, four nested rules (20/27/34/40), edge labels.
- **Expected:** a clean frame, with labels mirrored in the margin.
- **Observed:** as expected. The labels are now symmetric: all four sit 10px from the edge, outside the frame. In the source, WEST was outside and EAST sat inside the border band.
- **New finding:** the 0.4 and 0.5 hairlines render as pale grey even at full size. At phone width (~380px, a 0.38× scale) they drop below a device pixel. Hairlines can carry texture but not structure.
- **Kept:** the words NADIR / MERIDIAN as written. Whether NADIR belongs at the top is a question for the author, not a bug for me to fix.

## Step 01 — nimbus, rays, nodes
- **Added:** eight rings about (500, 420), eight rays, eight nodes. Everything is clipped to the inner rule via `#art`.
- **Expected:** the source's r=390 ring would cross the frame (420 − 390 = 30 < 40). I predicted this from the numbers and rendered to check.
- **Observed:** confirmed. The clipped ring merged with the dotted frame rule into a single ambiguous dotted band.
- **Fix:** pulled the outer four radii to 370/356/344/326 and moved the cardinal nodes onto r=344. The re-render shows four distinct rings with clear air above them.
- **Note:** the clip prevents overflow, but it can't make overflow look intentional. A ring cut flat by the frame still reads as a mistake. The real fix was choosing radii that fit.
- **Open:** the downward ray runs to the bottom of the frame. It will cross the ground and the scale, so it gets resolved in the ground step.

## Step 02 — ochre contours
- **Added:** the upper boundary, five lower contours, and two side ridges. Numerals are deferred to a label layer.
- **Fix before render:** replaced the `Q…T…T` boundary with two explicit, mirrored cubics. The `T` command reflects the previous control point, which put the last control at (960, 470) and bent the end of the line into a hook.
- **Observed (render 1):** the boundary is clean. But each ridge closed with `Z`, which drew a straight chord and left a visible beak at the lower outer corner.
- **Fix:** closed each ridge with a cubic whose handles continue the neighbouring tangents.
- **Observed (zoomed crop, render 2):** the beak was gone, and the crop exposed a second defect I hadn't predicted: a 9–13° kink where the two ridge segments meet. The handles on either side of each join weren't collinear.
- **Fix:** realigned the handles. Render 3 is smooth.
- **Note:** the kink was invisible at full size and obvious at 3×. Inspecting at one zoom level would have missed it.
- **Open:** the boundary's crest (y=170) runs 10px under the heavy r=260 ring (y=160). That near-tangency is ambiguous. Deciding after the wings, which may cover it.

## Step 03 — wings
- **Added:** the source wing strokes, unchanged, scaled 0.876 about the wing root (500, 450). The factor comes from the numbers: (450 − 60)/(450 − 5) pulls the worst tip, (60, 5), down to y = 60.
- **Observed:** every tip is now inside the frame. Two new problems appeared that only exist once the wings sit on the other layers:
  1. The upper diagonal rays run almost parallel to the wing primaries, so each wing looked like it had an extra stray quill.
  2. The wings didn't cover the boundary crest. The near-tangent with the r=260 ring stayed visible at top centre.
- **Fix:** stopped the upper diagonals at the r=260 nodes, and raised the crest to y=125, midway between the r=260 and r=326 rings.
- **Re-render:** the upper sky reads as wings, rings, and one ochre arc. No doubled lines.
- **Note:** both problems came from interactions between layers. Neither layer is wrong on its own, so checking layers in isolation can't find these. Only the composite shows them.

## Step 04 — figure
- **Added:** the source's flame body and its inner sweeps and hatching.
- **Change:** filled the outer contour with parchment. Without the fill, the body is a transparent outline, and every ray, ring and the wing root show through it.
- **Observed:** the figure now reads as standing in front, and the wings appear to emerge from behind it. Contours stop at its edges.
- **Consequence:** the downward ray became pointless. The body covers it down to y=750, and below that it would only cut the ground and the scale. Removed.

## Step 05 — ground
- **Added:** six strata, as in the source.
- **Observed (render 1):** three problems at once.
  1. Every stratum had a V-notch at x=500. Each line meets itself at the axis with opposed tangents. The 3× crop made it obvious.
  2. A 40px band at the base was a snarl: the figure's foot (750), the first stratum (755), the source's 800 contour (crest 750), a node (764), and three ring bottoms (764–790).
  3. The figure hovered 5px above the ground line, another near-tangency.
- **Fix:** set the handles on either side of x=500 to the centre height, so each line crosses the axis level. Added an opaque parchment ground mass under the first stratum, which hides the ring bottoms and the node beneath it. Dropped the 800 contour, since the ground is the base. Moved the foot down to 768 so the ground overlaps it.
- **Observed (render 2):** the strata are clean, and the figure now stands in the ground.
- **False alarm:** at crop scale, the line under the foot looked lighter. I measured the darkest pixel per column across x=470–530 and it was identical (82) everywhere. The downscaled crop had misled me, so nothing needed fixing. Measuring caught a wrong "fix" before I made it.
- **Follow-on:** the lower diagonal rays now ended exactly on the tips of the second stratum, which made an ambiguous wedge. I stopped them at r=370, but that dotted ring is too faint to read as an endpoint, so I moved them to the visible r=326 dash-dot ring instead.

## Step 06 — compass and scale
- **Placement measured, not guessed:** I ran a largest-empty-square search on the render's ink mask. The best spot on the left is 97px, centred at (94, 202). The source's spot at (85, 85) is now under the wing tips.
- **Compass:** redrawn as a four-point rose at 0.85 scale. The source's star was lopsided and pointed north only.
- **Scale:** used an alternating engraved bar. Retitled "Scale of Distance · yards", because a horizontal bar can't scale elevation.
- **Observed:** with "1000 yds" centred on its tick, the numeral sat left of the tick. Moving the units into the title put every numeral on its tick.

## Step 07 — elevation labels
- **Position:** the figure now covers the contours at x=500, so the source's label spots are inside the body. I computed points and tangents on the visible arms instead: 1200 at (145, 607.9) rotated −18.6°, and 1000 at (855, 706.3) rotated +16.6°. The two 1400s sit inside the inner ridges, between the r=326 and r=260 rings. The source's (250, 365) sat on the r=260 ring.
- **Knockout:** each label is drawn twice, a parchment stroke first and then the ink. Two passes don't depend on `paint-order` support.
- **Contrast:** label ink is #8E5418 (5.62:1). The source ochre #A86824 measures 4.13:1, which is fine for lines but fails AA for small text.

## Verification
- `map.svg` parses as XML: 115 elements.
- Rendered in two independent engines, cairosvg and resvg. They differ on 0.19% of pixels, nearly all in text, because each engine falls back to a different font. Geometry, occlusion and clipping match.
- **Phone width (380px):** structure, figure, wings and rings read clearly. The 8–10px text (edge labels, compass letters, scale numerals) doesn't, and the hairline rules fade out. The text is decorative and the SVG carries a `<title>`/`<desc>`, but if the piece goes on the blog it should link to a full-resolution version.
- **Not verified:** real Georgia metrics, since Georgia isn't installed here. Text could sit slightly narrower than in these renders. Also untested in a browser engine (Blink/WebKit).

## Tally
| # | Defect | How it was found |
|---|---|---|
| 1 | Wing tips outside the frame | source render |
| 2 | Outer ring merging with the frame rule | predicted from numbers, confirmed by render |
| 3 | `T` hook in the boundary | source render, then checked by computing the control point |
| 4 | Ridge beak from a bare `Z` | render |
| 5 | Ridge kinks (9–13°) | 3× crop only |
| 6 | Diagonal rays doubling the wing quills | composite only |
| 7 | Crest near-tangent to the r=260 ring | composite only |
| 8 | V-notch in every stratum | 3× crop |
| 9 | Snarl of eight elements at the base | composite only |
| 10 | Figure floating 5px above the ground | composite only |
| 11 | Lower rays ending on stratum tips | composite only |
| 12 | Compass sitting under the wing tips | composite + empty-space measurement |
| 13 | Elevation labels inside the figure / on a ring | composite |
| 14 | Scale numeral off its tick | 3× crop |
| 15 | Label ochre failing AA (4.13:1) | measured |
| — | "Lighter line under the foot" | **false alarm**: the pixel measurement said no |

Seven of the fifteen exist only in the composite. Neither layer is wrong alone; the defect is the relationship. Reading the code layer by layer can't surface those.
