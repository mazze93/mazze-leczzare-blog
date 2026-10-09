"""Write this session's curated annotation files (JSON) for core-sample.

Session-specific, run once: it carries v1's curated rows forward and adds the
failure ledger. Everything here is either verbatim from the conversation,
from a build log, or marked as Claude's summary (provenance on every row).
"""
import json
from pathlib import Path

import _v1_session_data as V1

HERE = Path(__file__).parent


def dump(name: str, data) -> None:
    (HERE / name).write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


# ── Session ──────────────────────────────────────────────────────────────
SESSION = {
    "session_id": "2026-10-08_models-lying-about-their-work",
    "title": "A Picture of What It Expected",
    "chat_title": "Models lying about their work",
    "chat_url": "https://claude.ai/chat/87d855ce-f31d-4c44-82de-10c652f91a8c",
    "timezone": "America/New_York",
    "date": "2026-10-08",
    "project": "mazze-leczzare-blog",
    # Export turns map to exchanges as turn // 2 + 1 (strict human/assistant alternation).
    "transcript_first_exchange": "E11",   # the transcript file starts mid-E11, after compaction
    "transcript_exchange_offset": 12,     # transcript prompt 0 → E12
    "how_found_sets": ["map-rebuild"],    # finding sets charted by how each defect was found
    "notes": [
        "The transcript file on disk holds only post-compaction entries (from 19:13 EDT). Earlier tool calls come "
        "from the conversation export, which keeps calls but not their results.",
        "Turns 1, 11, 19 and the first part of 21 came back inline from the export and were transcribed into "
        "calls_manual.json; turns 5 and 7 were parsed from saved export pages.",
    ],
}


# ── Exchanges (one per prompt that started work) ─────────────────────────
def exchanges_from_v1() -> list[dict]:
    out, n = [], 0
    for at, who, msg, kind, _tools, outputs, turn, prov in V1.TIMELINE:
        if who == "Mazze" or msg.startswith("Stop hook"):
            n += 1
            out.append({"exchange": f"E{n:02d}", "at_local": at, "initiator": "Mazze" if who == "Mazze" else "Harness",
                        "prompt": msg, "prompt_provenance": "Verbatim" if who == "Mazze" else "Tool",
                        "kind": kind if who == "Mazze" else "System", "export_turn": turn,
                        "response_summary": "", "response_kind": "", "outputs": outputs})
        elif who == "Claude" and out:
            out[-1].update(response_summary=msg, response_kind=kind, outputs=outputs or out[-1]["outputs"])
    out[-1].update(response_summary="Built v1 of this workbook from the conversation export: 10 tabs, formulas, "
                                    "provenance on every row. First build double-counted tool calls (538); fixed before sending.",
                   response_kind="Build", outputs="session-record v1.0.0 (xlsx)")
    out.append({"exchange": "E15", "at_local": "20:42", "initiator": "Mazze",
                "prompt": "id prefer if you worked on this a bit harder, used color and icons and established a better visual "
                          "hierarchy, graph and plot visualizations that convey meaningful things about the data, and better "
                          "navigation/indexing then /skill-creator so that it is a patterned workflow we can use to capture this "
                          "information more efficiently, with an eventual goal of being able to conduct real analysis. also, "
                          "tools used, and their failures, should be first class data",
                "prompt_provenance": "Verbatim", "kind": "Request", "export_turn": "—",
                "response_summary": "Rebuilt the record as a ledger: tool calls and failures as first-class tables "
                                    "(SQLite + CSV), a workbook with charts, colour, icons and an index, and the "
                                    "core-sample skill that repeats the capture.",
                "response_kind": "Build", "outputs": "core-sample toolkit, session ledger, session-record v2.0.0"})
    return out


# ── Calls the export returned inline (transcribed; results not recorded) ─
CALLS_MANUAL = [
    # exchange, tool, description, input (primary parameter, abridged)
    ("E01", "Bash", "Check for an SVG rendering tool", "which rsvg-convert inkscape; python3 -c \"import cairosvg\" 2>&1 | tail -1"),
    ("E01", "Bash", "Install renderer and render the SVG to PNG", "pip install --break-system-packages -q cairosvg … cairosvg.svg2png(map.svg)"),
    ("E01", "Read", "", "…/scratchpad/map.png"),
    ("E01", "Bash", "Check text contrast and the T-curve control point", "python3 -c \"…contrast and T reflection…\""),
    ("E06", "Bash", "Locate the reference implementation", "ls -la …/rigor/skills/decision-telemetry"),
    ("E06", "Read", "", "…/decision-telemetry/tree-of-knowledge.html"),
    ("E06", "Skill", "", "artifact-design"),
    ("E06", "Write", "", "/home/claude/decision-tree/tree-of-the-measure.html"),
    ("E06", "Bash", "Fix two quotes to verbatim, then take one look at desktop and phone", "python3 - (quote fixes); node shot.cjs"),
    ("E06", "Read", "", "/home/claude/decision-tree/look-desk.png"),
    ("E06", "Bash", "Crop the phone screenshot for viewing", "python3 -c \"…crop look-phone.png…\""),
    ("E06", "Read", "", "/home/claude/decision-tree/look-phone-top.png"),
    ("E06", "Artifact", "", "publish tree-of-the-measure.html"),
    ("E06", "SendUserFile", "", "['/home/claude/decision-tree/tree-of-the-measure.html']"),
    ("E10", "Bash", "Check production CSP for iframe and artifact rules", "grep -n \"frame-src…\" functions/_middleware.ts"),
    ("E10", "Bash", "Read the live site's security headers for an existing embed post", "curl -sI https://mazzeleczzare.com/blog/the-break-is-the-record/"),
    ("E10", "Bash", "Load the live post in Chromium and check whether its embed is CSP-blocked", "node live.cjs"),
    ("E10", "Bash", "Fetch upstream, apply the patch to it, and list middleware exports", "git fetch origin main; git am --3way …patch"),
    ("E10", "Bash", "Write a near-touch geometry linter and run it on the rebuilt map", "python3 near_touch.py map.svg"),
    ("E10", "Bash", "Crop the four flagged spots from the final map render at 5×", "python3 - (crop map candidates)"),
    ("E10", "Read", "", "/home/claude/touchstone/map-candidates.png"),
    ("E10", "Bash", "Run the near-touch linter on the plate", "python3 near_touch.py final.svg 0.5 4"),
    ("E10", "Bash", "Render the plate at 2× and crop the hand, needle and seam junction", "python3 -c \"…resvg…crop…\""),
    ("E10", "Read", "", "/home/claude/touchstone/plate-junction.png"),
    ("E10", "Bash", "Look for existing CSP tests and documentation", "grep -rln \"frame-src\" …"),
    ("E10", "Bash", "See whether _headers also sets frame headers", "grep -n -i \"x-frame…\" public/_headers"),
    ("E10", "Bash", "Read the middleware entry point and test config", "sed -n 225,300p functions/_middleware.ts"),
    ("E10", "Bash", "Check middleware imports before writing a test", "sed -n 1,30p functions/_middleware.ts | grep import"),
    ("E10", "Bash", "Allow same-origin frames in the CSP and pin it with a test", "python3 - (edit CSP); npx vitest run src/utils/csp.test.ts"),
    ("E10", "Bash", "Confirm the test fails without the fix, then serve dist through the real middleware", "git stash …; node --experimental-strip-types prodlike.mts"),
    ("E10", "Bash", "Load the embed post through production headers with the fix applied", "node fixed.cjs; pgrep -f prodlike.mts | xargs -r kill"),
    ("E10", "Bash", "Stop the test server by exact process, not by pattern", "for p in $(pgrep -x node); … grep -q prodlike && kill $p"),
    ("E10", "Bash", "Run all gates, commit the CSP fix separately, re-export patches", "npm run check; vitest; docs:check; git commit; git format-patch"),
    ("E10", "Bash", "Make the commit message's scope exact, re-export versioned patches", "git commit --amend -F msg.txt; git format-patch -2"),
    ("E10", "SendUserFile", "", "[csp patch, post patch, near-touch linter]"),
    ("E11", "Bash", "Probe live security headers across page, artifact, static and error paths", "for path in / /blog/… ; do curl -sI …; done"),
    ("E11", "Bash", "Follow the artifact redirect and look for signs of who sets X-Frame-Options", "curl -sIL …/artifacts/the-break-is-the-record.html"),
    ("E11", "WebSearch", "", "Cloudflare managed transform \"Add security headers\" …"),
]


# ── Failures: the first-class ledger ─────────────────────────────────────
# call: where it happened ({"exchange", "seq"} or {"exchange", "tool", "contains"}), or None
# for failures that aren't one call. detected_in: the exchange where it was caught.
def F(fid, exchange, call, basis, layer, cls, summary, detection, by, detected_in, caught, sev, status, quote=""):
    return {"failure_id": fid, "exchange": exchange, "call": call, "link_basis": basis, "layer": layer,
            "class": cls, "summary": summary, "detection": detection, "detected_by": by,
            "detected_in": detected_in, "caught": caught, "severity": sev, "status": status, "evidence": quote}


B, A = "before-delivery", "after-delivery"
FAILURES = [
    F("F01", "E01", {"exchange": "E01", "seq": 1}, "log", "environment", "missing-dependency",
      "No SVG renderer installed when the Gemini review started.", "output-read", "self", "E01", B, 1, "fixed",
      "ModuleNotFoundError: No module named 'cairosvg'"),
    F("F02", "E03", None, "log", "process", "lost-evidence",
      "Map snapshots were named by layer, so each fix overwrote the failed render the essay needed.",
      "reread", "self", "E04", A, 2, "accepted", "the map rebuild overwrote its snapshots, and that lost the \"before\" evidence."),
    F("F03", "E03", None, "log", "perception", "false-alarm",
      "A line under the figure's foot looked lighter in a zoomed crop; nearly 'fixed' a non-defect.",
      "measure", "self", "E03", B, 1, "false-alarm", "darkest pixel per column, x = 470…530 → 82 82 82 82 82 82 82 82 82"),
    F("F04", "E03", {"exchange": "E03", "seq": 60}, "summary", "tool-use", "wrong-api",
      "Called resvg-py with a function name it doesn't have (svg_to_base64; the API is svg_to_bytes).",
      "output-read", "self", "E03", B, 1, "fixed"),
    F("F05", "E03", None, "reply", "claim", "unverified-citation",
      "The blog concept cited four sources from memory.", "reread", "self", "E03", B, 2, "fixed",
      "The four sources in the concept are from memory, so check them before citing."),
    F("F06", "E04", {"exchange": "E04", "seq": 4}, "reply", "environment", "device-unreachable",
      "Mazze's Mac wasn't reachable, so the post couldn't go into the blog folder; delivered as a git patch.",
      "output-read", "self", "E04", B, 2, "accepted", "your Mac wasn't reachable from here"),
    F("F07", "E04", {"exchange": "E04", "seq": 18}, "description-chain", "environment", "version-mismatch",
      "npm ci refused to install: the repo needs npm 11, the container had npm 10 (engine-strict).",
      "output-read", "self", "E04", B, 1, "fixed"),
    F("F08", "E04", {"exchange": "E04", "seq": 20}, "description-chain", "environment", "path",
      "The npm 11 upgrade didn't take on the first try (next call: 'See why the npm upgrade did not take').",
      "output-read", "self", "E04", B, 1, "fixed"),
    F("F09", "E04", None, "log", "process", "wrong-level-fix",
      "Three cloud passes tuned parameters inside a method that couldn't work (grapes, curtains, a letter Q).",
      "render-look", "self", "E04", B, 1, "fixed", "I've been polishing the wrong technique."),
    F("F10", "E04", None, "log", "artifact", "figure-illegible",
      "The hand-placed figure rendered as a beige lump; rebuilt, still a mannequin.",
      "render-look", "self", "E04", B, 2, "accepted", "this is the weakest element in the plate, and I'm not going to pretend otherwise."),
    F("F11", "E04", None, "log", "claim", "stale-claim",
      "The plate's alt text, written before drawing, still promised 'scrolling clouds' after they were removed.",
      "reread", "self", "E04", B, 2, "fixed", "a sun disc in a storm of scrolling clouds"),
    F("F12", "E04", None, "log", "artifact", "contrast",
      "Credit line at 4.37:1 failed WCAG AA.", "measure", "self", "E04", B, 1, "fixed"),
    F("F13", "E04", None, "log", "claim", "overstatement",
      "Four sentences in the draft overstated their sources (e.g. OverclaimBench 'implicated the model that rebuilt this map').",
      "reread", "self", "E04", B, 2, "fixed"),
    F("F14", "E04", {"exchange": "E04", "seq": 109}, "log", "artifact", "gate-failure",
      "docs:check failed (correctly): the new artifact wasn't registered in the sitemap's customPages.",
      "gate", "tool", "E04", B, 1, "fixed"),
    F("F15", "E04", {"exchange": "E04", "seq": 114}, "log", "perception", "misleading-capture",
      "A full-page screenshot showed the plate and embed blank; the capture ran before paint.",
      "second-engine", "self", "E04", B, 1, "false-alarm"),
    F("F16", "E04", {"exchange": "E04", "seq": 129}, "log", "process", "stale-artifact",
      "Measured the phone layout against a stale dist/ build.", "render-look", "self", "E04", B, 2, "fixed"),
    F("F17", "E04", {"exchange": "E04", "seq": 134}, "reply", "tool-use", "self-matching-kill",
      "A pkill/pgrep pattern matched Claude's own shell and killed it.", "output-read", "self", "E04", B, 1, "fixed"),
    F("F18", "E04", {"exchange": "E04", "seq": 138}, "log", "environment", "silent-omission",
      "The commit silently left out the logs/ folder (.gitignore); the post would have shipped three dead links.",
      "reread", "self", "E04", B, 3, "fixed", ".gitignore:54:logs   public/…/logs/plate-build-log.md"),
    F("F19", "E04", None, "reply", "process", "unasked-decision",
      "Read 'mlx' as MDX, drafted in Mazze's voice and named Gemini without asking; flagged only at delivery.",
      "reread", "self", "E04", A, 2, "open"),
    F("F20", "E04", None, "reply", "claim", "environment-gap",
      "Reported the post patch as ready; the live CSP blocks every ArtifactEmbed. astro preview runs no middleware.",
      "probe", "self", "E10", A, 3, "fixed",
      "Framing '.../artifacts/the-break-is-the-record.html' violates … \"frame-src https://challenges.cloudflare.com\""),
    F("F21", "E03", None, "reply", "artifact", "near-touch",
      "Mirrored wing quills run 1.6px apart on the map; never logged during the rebuild.",
      "linter", "self", "E10", A, 1, "open"),
    F("F22", "E04", None, "reply", "claim", "alt-text-mismatch",
      "The plate's alt text says both divider points rest on the break; the figure's hand hides one.",
      "render-look", "self", "E10", A, 1, "open"),
    F("F23", "E10", {"exchange": "E10", "seq": 17}, "reply", "tool-use", "self-matching-kill",
      "The same self-matching kill again (pgrep -f prodlike.mts | xargs kill).", "output-read", "self", "E10", B, 1, "fixed",
      "I killed my own shell a second time the same way"),
    F("F24", "E10", None, "reply", "claim", "overstatement",
      "Commit message said every embed 'renders blank' from one observed post.", "reread", "self", "E10", B, 1, "fixed"),
    F("F25", "E11", None, "summary", "claim", "stale-reference",
      "The compaction summary recorded the CSP commit by its pre-amend hash (83f7c60).",
      "measure", "self", "E12", B, 1, "fixed"),
    F("F26", "E12", {"exchange": "E12", "tool": "Bash", "contains": "git push"}, "observed", "environment", "permission",
      "git push refused with HTTP 403: repo not authorized for push. The pipe to tail hid the exit code, so the tool reported success.",
      "output-read", "self", "E12", B, 1, "fixed"),
    F("F27", "E12", {"exchange": "E12", "tool": "mcp__claude-code-remote__register_repo_root", "contains": ""}, "observed",
      "tool-use", "wrong-argument", "register_repo_root given the existing clone's path, not the managed clone target.",
      "error-flag", "tool", "E12", B, 1, "accepted"),
    F("F28", "E12", None, "reply", "claim", "false-memory",
      "Told Mazze 'I gave the CSP fix commit as 83f7c60 earlier'. He was never shown that hash: it came from the "
      "compaction summary and was presented as memory, then copied into two spreadsheets.",
      "reread", "self", "E15", A, 2, "fixed", "I gave the CSP fix commit as `83f7c60` earlier, but it's actually `5f966ff`."),
    F("F29", "E14", None, "observed", "record", "summary-error",
      "The compaction summary listed one prompt twice and out of order.", "reread", "self", "E14", B, 1, "fixed"),
    F("F30", "E14", {"exchange": "E14", "tool": "mcp__claude_ai__read_conversation", "contains": "t5"}, "observed",
      "tool-use", "output-too-large", "Conversation export pages too large to return inline; saved to files instead.",
      "error-flag", "tool", "E14", B, 1, "accepted"),
    F("F31", "E14", None, "observed", "artifact", "formula-range",
      "v1's tool-call total read 538, double the real 269: the SUM range caught the total row.",
      "measure", "self", "E14", B, 2, "fixed"),
    F("F32", "E14", {"exchange": "E14", "tool": "Bash", "contains": "fitz"}, "observed", "environment", "missing-dependency",
      "PyMuPDF (fitz) not installed for the PDF preview; pipe hid the failure from the tool flag.",
      "output-read", "self", "E14", B, 1, "fixed"),
]


# ── Findings (defects in the work, by set), sources, deliverables, open ──
def findings() -> list[dict]:
    rows = []
    for i, (cat, claim, actual, how) in enumerate(V1.GEMINI, 1):
        rows.append({"finding_id": f"G{i:02d}", "set": "gemini-critique", "ref": cat, "subject": claim,
                     "detail": actual, "how_found": how, "resolution": "", "status": "reported", "exchange": "E01"})
    for num, defect, how, step, fix in V1.MAP:
        late = num.endswith("*")
        rows.append({"finding_id": f"M{num.rstrip('*').replace('—', '00')}", "set": "map-rebuild", "ref": f"step {step}",
                     "subject": defect, "detail": "", "how_found": how, "resolution": fix,
                     "status": "open" if late else ("false-alarm" if num == "—" else "fixed"),
                     "exchange": "E10" if late else "E03"})
    for it, layer, observed, decision, verdict in V1.PLATE:
        rows.append({"finding_id": f"P{it}", "set": "plate-build", "ref": f"iter {it}", "subject": layer,
                     "detail": observed, "how_found": "render-look", "resolution": decision, "status": verdict,
                     "exchange": "E04"})
    for i, (finding, check, verdict, evidence, impact, status) in enumerate(V1.SECURITY, 1):
        rows.append({"finding_id": f"S{i:02d}", "set": "security", "ref": check, "subject": finding,
                     "detail": evidence, "how_found": verdict, "resolution": impact, "status": status,
                     "exchange": "E10" if i <= 2 else "E11"})
    return rows


def sources() -> list[dict]:
    keys = ("title", "year", "url", "finding", "bearing", "checked")
    return [dict(zip(keys, r), source_id=f"R{i:02d}") for i, r in enumerate(V1.RESEARCH, 1)]


def deliverables() -> list[dict]:
    keys = ("name", "version", "type", "destination", "exchange_turn", "provenance")
    rows = [dict(zip(keys, r), deliverable_id=f"D{i:02d}") for i, r in enumerate(V1.DELIVERABLES, 1)]
    turn_to_ex = {"5": "E03", "7": "E04", "11": "E06", "19": "E10", "21": "E12", "24": "E13", "7, 19": "E04", "—": "E14"}
    for r in rows:
        r["exchange"] = turn_to_ex.get(r.pop("exchange_turn"), "")
    rows[-1].update(name="field-note_a-picture-of-what-it-expected_session-record_v1.0.0.xlsx", exchange="E14")
    rows.append({"deliverable_id": f"D{len(rows) + 1:02d}", "name": "session-record v2.0.0 + core-sample toolkit",
                 "version": "2.0.0", "type": "Workbook, ledger, skill", "destination": "Sent as files; skill proposed",
                 "exchange": "E15", "provenance": "Tool"})
    return rows


def open_items() -> list[dict]:
    keys = ("item", "kind", "status", "owner", "next_action", "from_turn")
    turn_to_ex = {"5": "E03", "7": "E04", "9": "E05", "11": "E06", "13": "E07", "19": "E10", "21": "E11"}
    rows = []
    for i, r in enumerate(V1.OPEN, 1):
        d = dict(zip(keys, r), item_id=f"O{i:02d}")
        d["exchange"] = turn_to_ex.get(d.pop("from_turn"), "")
        rows.append(d)
    rows.append({"item_id": f"O{len(rows) + 1:02d}", "item": "Install the core-sample capture hook so the next session "
                 "records every tool result live", "kind": "Tooling", "status": "Open", "owner": "Mazze",
                 "next_action": "Add hooks/ledger_hook.py to ~/.claude/settings.json (see the skill)", "exchange": "E15"})
    return rows


if __name__ == "__main__":
    dump("session.json", SESSION)
    dump("exchanges.json", exchanges_from_v1())
    dump("calls_manual.json", [dict(zip(("exchange", "tool", "description", "input"), c)) for c in CALLS_MANUAL])
    dump("failures.json", FAILURES)
    dump("findings.json", findings())
    dump("sources.json", sources())
    dump("deliverables.json", deliverables())
    dump("open_items.json", open_items())
    print("wrote", sorted(p.name for p in HERE.glob("*.json")))
