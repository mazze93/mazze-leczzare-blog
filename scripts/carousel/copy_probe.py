#!/usr/bin/env python3
"""
copy_probe.py — prose-touchstone probes for carousel slide copy.

Usage:
    python3 scripts/carousel/copy_probe.py docs/social/<slug>/slides.json src/content/blog/<slug>.md

Reads every string in slides.json (except `source` provenance notes), then
reports, per probe, the hits that are NOT verbatim in the source post. The
author's own constructions are his to keep; this flags only what the carousel
introduced. Exit code 1 if any introduced hit remains, so it can gate a build.

Probes (countable proxies for the editorial gate):
  negation_pivot  "not X. It's Y" / "isn't X, it's Y" / "not only … but"
                  / "X, not Y" / "rather than" — the mold, not the words.
  triad           exactly-three-item lists and "a, b, and c" tricolons.
  em_dash         em-dash use (a cadence tell when dense).
  hedge_filler    stock filler: "truly", "crucially", "in today's",
                  "it's worth noting", "delve", "landscape", "game-changer".

No network, no side effects. Pure functions; I/O only in main().
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# ── Patterns ──────────────────────────────────────────────────────────────
NEGATION_PIVOT = [
    re.compile(r"\b(?:is|was|are)\s+not\b[^.?!]{0,80}[.;,—-]\s*(?:it|this|that|they)(?:'s|\s+is|\s+are)\b", re.I),
    re.compile(r"\b(?:isn't|aren't|wasn't)\b[^.?!]{0,80}[,;—-]\s*(?:it|this|that|they)(?:'s|\s+is|\s+are)\b", re.I),
    re.compile(r"\bnot\s+only\b[^.?!]{0,120}\b(?:but|it\s+is|also)\b", re.I),
    re.compile(r"\bnot\s+(?:just|merely|simply)\b", re.I),
    re.compile(r",\s+not\s+\w+", re.I),
    re.compile(r"\brather\s+than\b", re.I),
    # period-joined form — the shape the first prose-touchstone regex missed
    re.compile(r"\bnot\s+\w[^.?!]{0,60}\.\s+(?:It|This|That)(?:'s|\s+is)\b"),
]
# "a, b, and c" AND the asyndetic "a, b, c" — the first draft of this probe
# only caught the conjoined form and missed "repeated challenges, lost time,
# tools abandoned" (2026-10-30). Probing the probe is the point.
TRICOLON = re.compile(r"\b[\w'-]+(?:\s+[\w'-]+){0,3},\s+[\w'-]+(?:\s+[\w'-]+){0,3},\s+(?:(?:and|or)\s+)?[\w'-]+(?:\s+[\w'-]+){0,3}[.:;]", re.I)
EM_DASH = re.compile(r"—")
FILLER = re.compile(r"\b(?:truly|crucially|in today's|it's worth noting|delve|landscape|game-?changer|unlock|seamless)\b", re.I)


# ── Pure helpers ──────────────────────────────────────────────────────────
def collect_strings(node, skip_keys=("source", "slug", "url", "theme", "kind")) -> list[str]:
    """Flatten every user-visible string in the slides tree."""
    out: list[str] = []
    if isinstance(node, str):
        out.append(node)
    elif isinstance(node, list):
        for item in node:
            out.extend(collect_strings(item, skip_keys))
    elif isinstance(node, dict):
        for key, value in node.items():
            if key in skip_keys:
                continue
            out.extend(collect_strings(value, skip_keys))
    return out


def normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("’", "'").replace("*", "")).strip().lower()


def introduced(hit: str, post_norm: str) -> bool:
    """A hit is 'introduced' when its matched text does not occur in the post."""
    return normalise(hit) not in post_norm


def triad_lists(slides: dict) -> list[list[str]]:
    """Every `list` field with exactly three items."""
    return [s["list"] for s in slides["slides"] if isinstance(s.get("list"), list) and len(s["list"]) == 3]


def run_probes(slides: dict, post_text: str) -> dict[str, list[str]]:
    post_norm = normalise(post_text)
    strings = collect_strings(slides)
    report: dict[str, list[str]] = {"negation_pivot": [], "tricolon": [], "triad_list": [], "em_dash": [], "hedge_filler": []}
    for s in strings:
        for pat in NEGATION_PIVOT:
            for m in pat.finditer(s):
                if introduced(m.group(0), post_norm):
                    report["negation_pivot"].append(s)
        for m in TRICOLON.finditer(s):
            if introduced(m.group(0), post_norm):
                report["tricolon"].append(s)
        if EM_DASH.search(s):
            report["em_dash"].append(s)
        if FILLER.search(s):
            report["hedge_filler"].append(s)
    report["triad_list"] = [" | ".join(lst) for lst in triad_lists(slides)]
    return {k: sorted(set(v)) for k, v in report.items()}


def self_test() -> None:
    """Probe the probe: restated forms of the mold must still fire."""
    post = ""
    cases = [
        "The control is not a detector. It's a policy.",   # period-joined
        "The control isn't a detector, it's a policy.",    # comma-joined
        "This is not only a tool but a stance.",
        "Govern it as code, not vibes.",
    ]
    for c in cases:
        hits = run_probes({"slides": [{"body": c}]}, post)["negation_pivot"]
        assert hits, f"probe blind to: {c!r}"
    for c in ["It costs time, trust, and money.", "It costs repeated challenges, lost time, tools abandoned."]:
        hits = run_probes({"slides": [{"body": c}]}, post)["tricolon"]
        assert hits, f"tricolon probe blind to: {c!r}"


# ── Entry point ───────────────────────────────────────────────────────────
def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(__doc__)
        return 2
    self_test()
    slides = json.loads(Path(argv[1]).read_text())
    post = Path(argv[2]).read_text()
    report = run_probes(slides, post)
    blocking = report["negation_pivot"] + report["hedge_filler"]
    for probe, hits in report.items():
        print(f"{probe:15} {len(hits)}")
        for h in hits:
            print(f"    · {h}")
    print("\nself-test: negation probe 4/4, tricolon probe 2/2 restated forms")
    return 1 if blocking else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
