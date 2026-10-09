# Sources

The working source behind every image and tool in the field note. Before this
commit it existed only on an ephemeral cloud container.

| Folder | What | Notes |
|---|---|---|
| `gemini/gemini-original-map.svg` | The SVG Gemini returned, extracted from the pasted response (lines 169–321) | The object the essay critiques |
| `map-rebuild/` | Layer-by-layer rebuild: `build.py`, `layers/00–07`, final `map.svg`, build log, first blog concept | Renders are `public/images/blog/a-picture-of-what-it-expected/map/`. The build overwrote its own snapshots (failure F02) |
| `plate/` | *The Measure Taken*: `build.py` (keeps every iteration), cloud/divider generators, HarfBuzz text outliner, `layers/00–06`, `final.svg`, build log | Iteration renders are `…/plate/iter-001..020.webp` |
| `probes/` | `near_touch.py` (near-tangent geometry linter); `prodlike.mts` (serves `dist/` through the real `functions/_middleware.ts`, so a browser sees production headers; run with `node --experimental-strip-types`) | The second one found the live CSP embed bug that `astro preview` can't show |
| `decision-tree/` | *Tree of the Measure*, the decision-telemetry artifact for this session | Uses Google Fonts; swap to self-hosted `@font-face` before moving under `public/artifacts/` |

Paths inside the scripts point at the container they were written on
(`/home/claude/...`). Treat them as a record, not a ready-to-run tool.
