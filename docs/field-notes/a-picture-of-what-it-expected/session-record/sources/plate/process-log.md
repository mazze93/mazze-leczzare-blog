# Build log — "The Measure Taken" (original plate, after Blake)

**Conditions:** unmonitored. Mazze asked me to make an original piece and see whether I hold my own work to the standard I held Gemini's to. This log is written as I go. Every render is kept (`iterations/iter-NNN-*`), including the broken ones; the map rebuild overwrote its snapshots, and that lost the "before" evidence.

**Renderers:** resvg is primary, because it supports the SVG filters this piece uses. cairosvg is a cross-check: it ignores filters, which makes it a stand-in for weaker rasterisers. Chromium is checked at the end through the blog build.

**Concept:** a sun disc in a storm of scrolling clouds lowers a pair of dividers to the earth. Their points land on a ring drawn in the ground, at the one place the ring is broken and mended with gold. A small figure kneels at the break to look. Beneath it is an original couplet:

> The hand that swears it drew the ring
> Must stoop to see the broken thing.

The figure is the risk. Hand-built SVG figures are where this usually goes wrong, so it gets judged hardest.

## iter 001 — paper, plate mark, sky
- **Expected:** a warm sheet, a debossed plate mark, and an indigo → ochre sky with a colour-print mottle.
- **Observed (resvg):** the mottle read as grey stains: large, uniform blotches that dirtied the ochre band.
- **Observed (cairosvg):** the whole sky sat under a **55% black sheet**. cairosvg ignores filters, so the mottle rect fell back to its default black fill. I would never have seen this with one renderer.
- **Fix:** gave the mottle rect `fill="none"` (feTurbulence generates its own pixels, so the filter still paints). Raised the noise frequency and lowered the opacity to 0.35.

## iter 002
- **Observed:** with filters, the texture is finer and reads as grain, not stain. Without filters, the fallback is a clean wash. Accepted. The grain is still a little grey in the ochre band, but the clouds and ground will cover most of it, so I'll re-judge in the composite.

## iter 003 — sun, first pass
- **Observed:** this was a stock sunburst: 72 identical lines evenly spaced, plus a bevelled "coin" ring. The top rays ran past the field edge and were cut off.
- **Fix:** 120 tapering wedges in a four-tier rhythm, with angle and length jittered from a fixed seed. Tips capped above y=96. Inner ring dropped.

## iter 004
- **Observed (3× crop):** the rays are better. Two new problems: a grey ring of sky shows between the disc and the ray bases, and the halo beside the disc went muddy grey-brown, because 55% gold over violet averages to taupe.
- **Fix:** start the ray bases under the disc edge, and keep the halo opaque gold out to 0.45 of its radius.

## iter 005
- **Observed:** a luminous glory, no gap, no mud. Accepted.

## iter 006 — clouds, first pass
- **Observed:** a failure, and worth saying plainly: these are **cartoon clouds**. Every circle carries its own radial gradient, so each one renders as a little sphere, a row of lilac grapes. The banks form a flat bar under the sun with regular scallops. Nothing about them is Blake. The two-pass ink trick (stroke every circle, then fill every circle on top) does work: only the outer contour keeps its line.
- **Diagnosis:** the gradient was in objectBoundingBox units, so each circle had its own. The composition was horizontal when it needed to sweep.

## iter 007 — clouds, second pass
- **Observed:** the grapes are gone, and a single sun-centred gradient reads as mass. But the composition is now theatre curtains: two stiff arms hugging the frame (cropped flat where they touch it) and a pillow-shaped bank under the sun.

## iter 008 — clouds, third pass
- **Observed:** a second failure. I merged the banks into one vortex, and it reads as a **giant letter Q**, or a segmented worm wrapped around the sun. The extra "drift" bank became the Q's tail, and flow lines that follow the spine exactly read as body segments.
- **Diagnosis, after three tries:** the problem isn't the layout. It's the method. Hard ink outlines around circle unions will always read as cartoon clouds. Blake's colour-printed clouds are soft, dark masses pulled from a board, with the ink saved for the figures and a few calligraphic swirls. I've been polishing the wrong technique.
- **Change of method:** soft blurred masses (dark body plus a warm crest toward the sun), no outline, and a few tapered swirl strokes on top. That's a bet, and it fails differently in renderers without filters: the masses go hard-edged. I'll check that in cairosvg.

## iter 009 — clouds, fourth pass (new method)
- **Observed (resvg):** soft masses, but each read **hollow**. The warm crest was too big and too close to centre, so it covered the body and left only dark rims: leopard spots. The low bank broke into separate blobs.
- **Observed (cairosvg, no filters):** hard polka-dot circles. The fallback for this method is ugly. Browsers all support the blur, so I'm accepting the risk, and stating it here rather than hiding it.

## iter 010
- **Fix:** 2–3× more circles per mass, a smaller crest pushed further toward the sun at lower opacity, and a wider blur.
- **Observed:** smoky, colour-printed masses. This is the first version I'd call in the right family. The tapered ink swirls I added float as stuck-on hooks unrelated to the masses.
- **Fix:** removed the swirls. Ink is reserved for the instrument, the ring and the figure.

## iter 011 — earth and the broken ring
- **Observed:** a hard-edged textured band ran across the sky at y=660. The earth's mottle rect wasn't clipped to the earth, so it painted over the sky between y=660 and the horizon. The earth itself is a flat brown slab. The ring is readable, and so is the break.
- **Fix:** clipped the mottle to the earth's shape. Added far hills for depth, a gold rim on the horizon, and flame-shaped grass.

## iter 012
- **Observed:** the band is gone and the far hills work. The "flame-grass" reads as **thorns**: a spiked fence along the horizon, with black shark-fins in the foreground. It's too regular, too sharp, and too small to read as flame.
- **Fix:** removed the tufts. Replaced them with engraved contour hatching that follows the land, which is how a print models ground anyway.

## iter 013
- **Observed:** contour hatching gives the ground form, and it reads as engraved earth. Accepted.

## iter 014 — the dividers
- **Changed first:** widened the ring's break from 22°–38° to 15°–45°. At the original width the legs would have spread about 4°, which reads as two parallel sticks. Now the spread is 13.6°.
- **Construction:** the leg tips are computed from the ring's equation, so they land exactly on the two ends of the break. The hinge hangs from a gold shaft that leaves the sun's disc along the sun→hinge line.
- **Observed (3× crop):** the instrument reads as dividers. The quadrant arc is what makes them read that way. The tips meet the break precisely.
- **Problem:** at full size, the solid inked shaft makes the sun look like a **lollipop on a stick**, held up by the dividers. That's the opposite of the intended relation.
- **Fix:** the shaft becomes light: no outline, and a gradient that fades from the disc toward the finial.

## iter 015 — the mend and the witness
- **Observed:** the shaft now reads as a beam of light. Two new failures, and the first one is the risk I named at the start:
  1. **The figure doesn't read as a person.** At full size it's a small beige lump, a sock or a thumb. At 3× the "head" is an outlined disc, the arm a white noodle, and the robe a slug. I drew a hand-placed silhouette and it failed exactly the way hand-placed SVG figures fail.
  2. **The mend reads as a lightning bolt.** Thirteen evenly spaced vertices with ±3.2px jitter make a regular zigzag. A kintsugi seam wanders; it doesn't spark.
- **Fix:** I rebuilt the figure from body segments (head, neck, torso, thigh, shin, two jointed arms), each a thick round-capped stroke. They're drawn ink-pass then flesh-pass, the same union trick the clouds used, so the body gets one continuous outline. It's twice the size, kneeling on both knees with the torso stooped, one hand on the ground and one reaching to the break. The mend uses fewer vertices and smaller jitter.

## iter 016
- **Observed:** it reads as a person: on hands and knees, stooped, one hand reaching to the gold seam. It's crude. The tube limbs make it a mannequin, closer to a pictogram than to Blake's muscular figures. The mend now reads as a gold seam, not a spark.
- **Honest call:** this is the weakest element in the plate, and I'm not going to pretend otherwise. A small human under a vast glory is a real Romantic image, which is part of why the scale works. But a Blake figure would carry the composition, and this one only survives in it. I'm adding form shadows (iter 017) and stopping: more hand-placing would cost more than it gains, and the log should say that rather than imply the figure is finished art.

## iter 018 — text
- **Method:** the couplet and title are set in the blog's own faces (Cormorant SC and Cormorant Garamond), shaped with HarfBuzz and converted to outlines. An SVG served as `<img>` can't load web fonts, and the map rebuild had rendered in a fallback serif because Georgia wasn't installed. Outlines render the same everywhere. The `Th` ligature came through, so the shaping is real.
- **Observed:** clean setting. Couplet lines measure 482 and 441px, centred inside the 760px field.

## iter 019 — catching my own overclaim
- I reread the plate's `<desc>` (the alt text) against the image. It said "a sun disc in a **storm of scrolling clouds**". I wrote that at iter 001, before drawing anything. The scrolls were removed at iter 010, and the clouds are now soft and smoky. The description had gone stale and was claiming work the picture doesn't contain. That is the essay's failure in miniature: a report written ahead of the work and never re-checked against it.
- **Fix:** rewrote the `<desc>` from the final render, element by element.

## iter 020 — contrast
- **Measured on the plate ground #EBDDBE:** couplet 12.0:1, header 5.9:1, credit line **4.37:1**. The credit fails AA at 12.5px.
- **Fix:** credit set in the header's ink, now 5.92:1.

## Verification
- **Three engines:**
  - resvg (primary).
  - Chromium headless (Playwright): mean absolute difference from resvg 0.64/255, with 0.02% of pixels differing by more than 40.
  - cairosvg (no filter support): the clouds fall back to hard polka-dot blobs. Legible but ugly. Every browser supports the blur, so the risk is accepted and stated rather than fixed.
- **Kept:** all 20 iterations, including the failures (06–08 clouds, 12 thorns, 15 figure).
- **Not verified:** how the plate reads at phone width inside the blog layout. That gets checked in the post build. The figure's anatomy was judged by my eye only. Vision models have documented weaknesses on exactly this kind of judgment (see the research notes), so treat "reads as a person" as my claim, not a measurement.

## Self-assessment
- **Works:** the glory, the instrument, the gold seam, the ground, the typography.
- **Acceptable:** the clouds. They're in the right family, but they're smudges more than forms.
- **Weak:** the figure. It's a mannequin where Blake would have drawn a body.
- **Process slips:** three wasted cloud passes before I questioned the method instead of the parameters. An alt text that went stale because I wrote it before the work existed.

## Tally
- 20 renders. Defects found by looking that I would otherwise have shipped: **12**. They were the stain mottle, the black filter fallback, the stock sunburst, the ray gap, the muddy halo, the grape clouds, the curtain clouds, the Q-shaped clouds, the hollow clouds, the sky band leak, the thorn grass, and the lollipop shaft. Figure illegibility, the lightning mend and the stale alt text came on top of those.
- Found only by a second renderer: **1** (the 55% black fallback).
- Found by measuring rather than looking: **1** (credit-line contrast).
- Found by re-reading my own claims against the artifact: **1** (the stale `<desc>`).

## After the plate: checking the post itself
I held the post to the same standard, and four more findings came out of it:
- **Overstatements in my own draft, caught by re-reading it against the sources:**
  - I wrote that the map "rendered once, showed fifteen problems." The fifteen came out of the whole rebuild, not one render.
  - I said OverclaimBench implicated "the model that rebuilt this map." The paper tested Claude Opus/Sonnet/Fable 5, not the model writing this, so it's the model *family*. I also added the authors' own caveat that the scenarios were tuned against Claude Opus.
  - I called the second benchmark a "companion" paper. It's a separate paper.
  - I wrote "eleven renders later" when it was "at the eleventh render."
  All four are fixed. None of them was a lie in the strict sense. Each was a sentence that sounded right and that I hadn't checked.
- **A false alarm in the other direction:** a full-page Chromium screenshot of the preview showed the plate and the interactive embed as **blank**. Before "fixing" anything, I captured each element directly after it had scrolled into view and had time to paint. Both render correctly. The blank was the screenshot harness capturing lazy content before it painted. Without the second capture I'd have rewritten working markup.
- **Measuring a stale artifact:** my first phone-width measurement of the interactive embed ran against `dist/`, which still held the version from before my edits. I only noticed because the screenshot didn't show my new tab labels. After rebuilding and re-measuring: in the 640px phone embed the content ran to 942px, with the arrows below the fold. I reordered it so the text and arrows come first on phones and re-measured: the arrows now sit at 357px.
- **Gates:** `npm run check` (build + tsc), 194/194 tests, and `docs:check` all pass. The docs gate failed once, correctly: the new artifact wasn't registered in the sitemap's `customPages`. It's registered now.
- **The last catch, at commit time:** the logs the post links to sat in a folder named `logs/`, and the repo's `.gitignore` ignores every `logs` folder. The commit would have silently left them out. The post would have built and passed every gate, then shipped three dead links to the evidence it's about. I only found it because I compared the commit's file list against what I'd written. Renamed the folder to `record/`, re-resolved every link in the post and all 29 images in the stepper against `public/`, and re-ran the gates.
