"""Build the session-record workbook from session_data.py.

Layout only: every row of content lives in session_data.py. Counts on the
Start Here tab and the tool-call total are formulas, so they follow edits.
Usage: python3 build_session_record.py OUT.xlsx
"""
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

import session_data as D

# ── Styles ───────────────────────────────────────────────────────────────
FONT = "Arial"
BODY = Font(name=FONT, size=10)
BOLD = Font(name=FONT, size=10, bold=True)
TITLE = Font(name=FONT, size=15, bold=True, color="1F2A44")
H2 = Font(name=FONT, size=11, bold=True, color="1F2A44")
MUTED = Font(name=FONT, size=9, italic=True, color="555555")
LINK = Font(name=FONT, size=10, color="0563C1", underline="single")
HEAD_FILL = PatternFill("solid", fgColor="1F2A44")
HEAD_FONT = Font(name=FONT, size=10, bold=True, color="FFFFFF")
MAZZE_FILL = PatternFill("solid", fgColor="EEF2F8")
WRAP = Alignment(wrap_text=True, vertical="top")
EDGE = Side(style="thin", color="C8CCD4")
BOX = Border(left=EDGE, right=EDGE, top=EDGE, bottom=EDGE)
TABLE_ROW = 3            # header row of every data tab
MAX_ROW = 200            # validation/conditional ranges leave room for added rows


# ── Generic table writer ─────────────────────────────────────────────────
def add_table(wb, name, title, note, headers, rows, widths, link_cols=()):
    """Create a tab: title (row 1), note (row 2), header (row 3), rows from 4.

    Side effects: adds a sheet to wb. Returns the sheet.
    link_cols are 1-based columns whose http(s) values become hyperlinks.
    """
    ws = wb.create_sheet(name)
    ws["A1"], ws["A1"].font = title, TITLE
    ws["A2"], ws["A2"].font = note, MUTED
    for col, text in enumerate(headers, start=1):
        c = ws.cell(row=TABLE_ROW, column=col, value=text)
        c.font, c.fill, c.alignment, c.border = HEAD_FONT, HEAD_FILL, WRAP, BOX
    for r, values in enumerate(rows, start=TABLE_ROW + 1):
        write_row(ws, r, values, link_cols)
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[ws.cell(row=1, column=i).column_letter].width = w
    ws.freeze_panes = f"A{TABLE_ROW + 1}"
    last_col = ws.cell(row=1, column=len(headers)).column_letter
    ws.auto_filter.ref = f"A{TABLE_ROW}:{last_col}{TABLE_ROW + len(rows)}"
    return ws


def write_row(ws, r, values, link_cols):
    for col, v in enumerate(values, start=1):
        c = ws.cell(row=r, column=col, value=v)
        c.font, c.alignment, c.border = BODY, WRAP, BOX
        if col in link_cols and isinstance(v, str) and v.startswith("http"):
            c.hyperlink, c.font = v, LINK


def add_dropdown(ws, col, options):
    dv = DataValidation(type="list", formula1='"' + ",".join(options) + '"', allow_blank=True)
    dv.add(f"{col}{TABLE_ROW + 1}:{col}{MAX_ROW}")
    ws.add_data_validation(dv)


def add_fill_rules(ws, col, last_col, colours):
    """Colour whole rows by the value in `col` (exact match)."""
    span = f"A{TABLE_ROW + 1}:{last_col}{MAX_ROW}"
    for value, hex_ in colours.items():
        ws.conditional_formatting.add(span, FormulaRule(
            formula=[f'${col}{TABLE_ROW + 1}="{value}"'], fill=PatternFill("solid", fgColor=hex_)))


# ── Tabs ─────────────────────────────────────────────────────────────────
def build_timeline(wb):
    rows = [(i, *row) for i, row in enumerate(D.TIMELINE, start=1)]
    ws = add_table(wb, "Timeline", "Timeline — every exchange, in order",
                   "Mazze's messages are verbatim (system reminders removed). Claude's rows are one-paragraph summaries; the export has the full replies. Times are EDT, from each message's timestamp.",
                   ["#", "Time (EDT)", "Who", "Message / what happened", "Kind", "Tool calls",
                    "Outputs", "Export turn", "Provenance"],
                   rows, [5, 9, 9, 70, 12, 9, 34, 8, 11])
    for r in range(TABLE_ROW + 1, TABLE_ROW + 1 + len(rows)):
        if ws.cell(row=r, column=3).value == "Mazze":
            for col in range(1, 10):
                ws.cell(row=r, column=col).fill = MAZZE_FILL
    total = TABLE_ROW + len(rows) + 2
    ws.cell(row=total, column=4, value="Total tool calls by Claude").font = BOLD
    ws.cell(row=total, column=6, value=f"=SUM(F{TABLE_ROW + 1}:F{total - 2})").font = BOLD
    ws.cell(row=total + 1, column=4,
            value="Counted from the tool-call record in the conversation export. The stop-hook message came from the harness, not from Mazze.").font = MUTED


def build_gemini(wb):
    add_table(wb, "Gemini Critique", "What Gemini got wrong (turns 1 and 3)",
              "Established by rendering Gemini's SVG with cairosvg and computing contrast and control points. Georgia wasn't installed, so text widths are approximate.",
              ["Category", "Gemini's claim or element", "What was actually there", "How established"],
              D.GEMINI, [15, 40, 62, 22])


def build_map(wb):
    add_table(wb, "Map Rebuild", "Map rebuild — 15 defects in the code Gemini called verified",
              "From map-rebuild-log.md, written during the rebuild. Row 16* was found later by the linter and was never in the log.",
              ["#", "Defect", "How it was found", "Step", "Fix"],
              D.MAP, [5, 46, 34, 7, 46])


def build_plate(wb):
    ws = add_table(wb, "Plate Build", "The Measure Taken — every render, failures kept",
                   "From plate-build-log.md, written as the plate was built. Iter 017 has no entry of its own in the log.",
                   ["Iter", "Layer", "Observed", "Decision", "Verdict"],
                   D.PLATE, [6, 18, 58, 46, 18])
    add_fill_rules(ws, "E", "E", {"Accepted": "E2F0D9", "Failed": "FBE3E1", "Overclaim caught": "FFF2CC"})


def build_mistakes(wb):
    rows = [(i, *row) for i, row in enumerate(D.MISTAKES, start=1)]
    add_table(wb, "Own Mistakes", "Claude's own mistakes and slips",
              "Owned in full. Most were caught by re-reading a claim against the artifact or by measuring; two are still unfixed.",
              ["#", "What happened", "Where", "How it was caught", "Outcome", "Provenance"],
              rows, [5, 58, 20, 36, 36, 11])


def build_research(wb):
    add_table(wb, "Research", "Sources",
              "From research-notes.md and the Cloudflare lookups. 'Not read' and 'Excluded' rows are listed so nothing looks more checked than it was.",
              ["Source", "Year", "Link", "Key finding", "Bearing on the essay", "How checked"],
              D.RESEARCH, [34, 6, 40, 58, 40, 22], link_cols=(3,))


def build_security(wb):
    ws = add_table(wb, "Security", "Security checks (touchstone and vulnerability verification)",
                   "Nothing here was filed as a vulnerability. Live = mazzeleczzare.com on 2026-10-08.",
                   ["Finding", "Check", "Verdict", "Evidence", "Impact", "Status"],
                   D.SECURITY, [42, 26, 26, 50, 26, 22])
    add_fill_rules(ws, "F", "F", {"Open": "FBE3E1", "Unverified": "FFF2CC", "Done": "E2F0D9"})


def build_deliverables(wb):
    ws = add_table(wb, "Deliverables", "Everything delivered",
                   "From the SendUserFile calls in the export and the deliver/ folder. Commits are listed below the files.",
                   ["Name", "Version", "Type", "Where it went", "Turn", "Provenance"],
                   D.DELIVERABLES, [52, 8, 26, 56, 7, 11], link_cols=(4,))
    start = TABLE_ROW + len(D.DELIVERABLES) + 2
    ws.cell(row=start, column=1, value="Commits on the branch (base: main at e165c22)").font = H2
    for i, (sha, kind, msg) in enumerate(D.COMMITS, start=start + 1):
        write_row(ws, i, [sha, kind, msg, f"{D.REPO}/commit/{sha}"], link_cols=(4,))


def build_open(wb):
    ws = add_table(wb, "Open Items", "Open items",
                   "Edit Status (dropdown), Owner and Next action. Row colour follows Status. Add rows below; counts on Start Here cover rows 4–200.",
                   ["Item", "Kind", "Status", "Owner", "Next action", "From turn"],
                   D.OPEN, [52, 15, 16, 9, 52, 9], link_cols=(5,))
    add_dropdown(ws, "C", D.OPEN_STATUSES)
    add_fill_rules(ws, "C", "F", {"Open": "FBE3E1", "Decision needed": "FCE4D6",
                                  "Unverified": "FFF2CC", "Idea": "EDEDED", "Done": "E2F0D9"})


# ── Start Here ───────────────────────────────────────────────────────────
TABS = [
    ("Timeline", "Every exchange in order: Mazze's words verbatim, Claude's replies summarised."),
    ("Gemini Critique", "What was wrong with Gemini's SVG and its claims about it."),
    ("Map Rebuild", "The 15 defects the layer-by-layer rebuild found, and how each was found."),
    ("Plate Build", "All 20 renders of the original plate, failures included."),
    ("Own Mistakes", "Claude's slips across the session, and what caught each one."),
    ("Research", "The sources, what each showed, and how it was checked."),
    ("Security", "The CSP bug, the header drift and the filing decision."),
    ("Deliverables", "Every file, artifact, commit and branch produced."),
    ("Open Items", "What's still open, with a status you can edit."),
]


def count(sheet, col, value):
    return f"=COUNTIF('{sheet}'!${col}${TABLE_ROW + 1}:${col}${MAX_ROW},\"{value}\")"


def build_start(wb):
    ws = wb.active
    ws.title = "Start Here"
    ws["A1"], ws["A1"].font = "A Picture of What It Expected — session record", TITLE
    ws["A2"] = "Conversation 'Models lying about their work' · 2026-10-08, 17:18–19:18 EDT · v1.0.0"
    ws["A2"].font = MUTED

    ws["A4"], ws["A4"].font = "At a glance", H2
    glance = [
        ("Messages from Mazze", "=COUNTIF('Timeline'!$C$4:$C$200,\"Mazze\")"),
        # Point at the Timeline's own total cell: a SUM over F4:F200 would also
        # catch that total row and double the figure (it did, in the first build).
        ("Tool calls by Claude", f"='Timeline'!$F${TABLE_ROW + len(D.TIMELINE) + 2}"),
        ("Own mistakes logged", "=COUNTA('Own Mistakes'!$B$4:$B$200)"),
        ("Open items: Open", count("Open Items", "C", "Open")),
        ("Open items: Decision needed", count("Open Items", "C", "Decision needed")),
        ("Open items: Unverified", count("Open Items", "C", "Unverified")),
    ]
    for i, (label, formula) in enumerate(glance, start=5):
        ws.cell(row=i, column=1, value=label).font = BODY
        c = ws.cell(row=i, column=2, value=formula)
        c.font, c.alignment = BOLD, Alignment(horizontal="left")

    row = write_list(ws, 12, "Tabs", ["Tab", "What's in it"], TABS)
    row = write_list(ws, row + 1, "Provenance codes", ["Code", "Meaning"], D.PROVENANCE)
    notes = [
        "Built from the conversation export (turns 0–24), not from memory. The context was compacted at 19:13 and the summary had two errors, both corrected here (see Own Mistakes).",
        "Not included: the full text of Claude's long replies, tool output, and Claude's own reasoning. The reasoning isn't visible to you, so quoting it couldn't be checked.",
    ]
    ws.cell(row=row + 1, column=1, value="Notes").font = H2
    for i, text in enumerate(notes, start=row + 2):
        ws.merge_cells(start_row=i, start_column=1, end_row=i, end_column=2)
        c = ws.cell(row=i, column=1, value=text)
        c.font, c.alignment = MUTED, WRAP
        ws.row_dimensions[i].height = 28
    ws.column_dimensions["A"].width = 30
    ws.column_dimensions["B"].width = 90


def write_list(ws, row, heading, headers, items):
    """Heading + two-column list. Returns the next free row."""
    ws.cell(row=row, column=1, value=heading).font = H2
    for col, text in enumerate(headers, start=1):
        c = ws.cell(row=row + 1, column=col, value=text)
        c.font, c.fill, c.border = HEAD_FONT, HEAD_FILL, BOX
    for i, (a, b) in enumerate(items, start=row + 2):
        write_row(ws, i, [a, b], ())
    return row + 2 + len(items)


def main(out: Path) -> None:
    wb = Workbook()
    build_start(wb)
    for builder in (build_timeline, build_gemini, build_map, build_plate, build_mistakes,
                    build_research, build_security, build_deliverables, build_open):
        builder(wb)
    for ws in wb.worksheets:          # print/PDF export: landscape, one page wide
        ws.page_setup.orientation = "landscape"
        ws.sheet_properties.pageSetUpPr.fitToPage = True
        ws.page_setup.fitToWidth, ws.page_setup.fitToHeight = 1, 0
    wb.save(out)
    print(out)


if __name__ == "__main__":
    main(Path(sys.argv[1]))
