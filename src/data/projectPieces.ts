/**
 * External pieces per project node — works that belong to a constellation
 * but live outside the blog/signal content collections (papers, standalone
 * spine pages, gallery artifacts, live instruments).
 *
 * The graph's physics stay frontmatter-driven (see utils/nodes.ts); this
 * registry only enriches the project PAGE, gathering the full gravity well
 * in one place. Add pieces here when publishing outside the collections.
 */

export interface ExternalPiece {
  title: string;
  kind: "spine" | "paper" | "artifact" | "instrument" | "essay";
  href: string;
  desc: string;
  date?: string; // ISO, display only
}

export const PROJECT_THESES: Record<string, string> = {
  "intentional-fragility":
    "A system should be built to break in the right places — and the break is the record, not the failure. Context should cost something to keep; protection should be earned, not granted; the gap between what a system expected and what happened is the signal worth keeping. One idea, instantiated across essays, a formal paper, and two live instruments.",
};

export const PROJECT_PIECES: Record<string, ExternalPiece[]> = {
  "intentional-fragility": [
    {
      title: "Intentional Fragility — the spine",
      kind: "spine",
      href: "/intentional-fragility/",
      desc: "The standing statement: the argument written three ways, two live instruments, and the research program that tests it in the field.",
      date: "2026-07-15",
    },
    {
      title: "Intentional Fragility: Accountable Forgetting in Local-First AI",
      kind: "paper",
      href: "/papers/intentional-fragility.pdf",
      desc: "The formal companion — decay model, drift gradient, and earned-floor mechanics made precise.",
      date: "2026-06-12",
    },
    {
      title: "Two instruments, one refusal",
      kind: "artifact",
      href: "https://fieldnotes.mazzeleczzare.com/mz/intentional-fragility/",
      desc: "Interactive: the kintsugi circuit breaker and a working Physarum routing solver, running the same discipline in unrelated domains.",
      date: "2026-07-15",
    },
    {
      title: "The Concept Is Not the State",
      kind: "essay",
      href: "/blog/concept-is-not-the-state/",
      desc: "The argument's second face: emotion concepts can be causally operative in a model without functional emotion becoming a natural kind.",
    },
    {
      title: "The Jingle of Me",
      kind: "essay",
      href: "/blog/the-jingle-of-me/",
      desc: "The argument's third face: why Secure Pride exists — protection-first, identity-grounded.",
    },
  ],
};
