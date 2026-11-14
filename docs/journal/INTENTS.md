# Intents — stated vs. outcome

Phase 0 of `/session-journal` records the session's restated ask here,
**append-only**. At session close, fill `outcome`:

- `as-stated` — delivered what was asked, roughly as specified
- `diverged` — delivered something, but not what was originally specified
  (say what, in the last column)
- `abandoned` — stopped without delivering (rate limit, blocked, dropped)

A row left `outcome: —` is a session that ended without closing out — which is
itself the record. `scripts/ops/intent_divergence.py` reports the rate; a
standing `—` older than a few days is a `ws abandoned` candidate.

The point (mazze, 2026-08-31): "nearly every instance of my giving a direction
at the invocation of session-journal just about never turns out how I
originally specified." This file measures that instead of forgetting it.

| date | intent (restated ask) | load-bearing assumption | outcome | → what actually happened |
|------|-----------------------|-------------------------|---------|--------------------------|
| 2026-11-14 | Plan a legible apex: the airlock-led landing as the junction routing to every part of the work; the constellation fully loaded; the bench linking every project; field notes in both senses; studio. opened for creative work and music; everything cross-linked and indexed. Alidade is an input. | that the /work collection can serve as the single project registry (checked: false, it is a CV model; see DECISIONS) | — | |
