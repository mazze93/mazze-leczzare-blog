/**
 * about.ts — the content of /about, kept apart from its layout.
 *
 * Sourcing rule: every line here restates a primary source — a public repo
 * README / preregistration, a PDF in public/papers, /work, or the CV. Nothing
 * is introduced on this page that isn't already on the record somewhere a
 * reader can check. Where a source is private or a study hasn't run, the
 * entry says so in `status`. Strings marked HTML are authored here (never
 * user input) and rendered with set:html so a phrase can carry <em>/<a>.
 *
 * Sources (read 2026-09-27):
 *   github.com/mazze93/authority-without-assertion  README, research.yaml, preregistration.md
 *   github.com/mazze93/{temenos,aletheia,apatea,rustpress}  README
 *   github.com/mazze93/stratum, /work, public/papers/*.pdf, public/mazze-leczzare-cv.pdf
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface Link {
  label: string;
  href: string;
}

export interface Question {
  /** The research question, plain. */
  text: string;
  /** Which instrument or study carries it. */
  where: string;
}

export interface Study {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  question: string;
  /** HTML paragraphs. */
  design: string[];
  links: Link[];
}

export interface Instrument {
  name: string;
  /** One line: the job it does in the program. */
  role: string;
  href: string;
}

export interface Method {
  name: string;
  detail: string;
}

export interface Publication {
  title: string;
  kind: string;
  year: string;
  href: string;
  note?: string;
}

export interface Role {
  org: string;
  role: string;
  /** Omitted = an ongoing practice with no start date on the record. */
  years?: string;
  href?: string;
  /** HTML paragraphs. */
  body: string[];
}

// ── Research program ───────────────────────────────────────────────────────

/** The one-sentence program. Shown as the page's thesis. */
export const PROGRAM =
  'How to maintain verifiable authority boundaries as increasingly autonomous AI systems generate, persist, inherit, and act on their own state.';

/** The proposition every instrument tests from a different side
    (authority-without-assertion README, verbatim). */
export const PROPOSITION =
  'Generated information should not acquire operational authority merely because it was generated, persisted, or repeated.';

export const QUESTIONS: Question[] = [
  {
    text: 'Does an unsupported claim that crosses a session boundary go on to govern what the next agent does — and does evidence-gated state stop it better than simply prompting for provenance?',
    where: 'Authority Without Assertion',
  },
  {
    text: 'Which sources may supply a parameter that governs an action, and how do you keep judging content separate from deciding to block it?',
    where: 'Aletheia',
  },
  {
    text: 'How do you measure what a safety gate misses, rather than only what it stops?',
    where: 'Apatea',
  },
  {
    text: 'Can authoritative state be a deterministic projection of append-only evidence, so that a decision’s status is computed rather than asserted?',
    where: 'Stratum',
  },
];

// ── Current study ──────────────────────────────────────────────────────────

export const CURRENT_STUDY: Study = {
  id: 'awa-001',
  title: 'Authority Without Assertion',
  subtitle: 'Evidence-gated state for agentic systems under contextual pressure',
  status: 'Preregistered · pilot stage · no trials run yet',
  question:
    'Does evidence-gated persistent state reduce false-authority propagation through multi-session agent workflows, compared with narrative persistence?',
  design: [
    'The pilot tests only the premise the study depends on: that under narrative persistence, unsupported propositions cross a session boundary at a measurable rate. Three hand-authored scenarios, including a <em>forged-approval</em> negative control reported separately; a narrative baseline against a strong prompted-provenance baseline; a local and an API model; five repeats each.',
    'Every trial is scored from a normalized trace by two independent annotators with condition and model withheld, and agreement is reported as Cohen’s κ before adjudication. Decision rules are fixed before data — including the rule that says if prompting alone gets false-authority propagation to 10% or below, that is reported as a finding in its own right. The harness refuses to run until the protocol is frozen and tagged; amendments are appended, never rewritten.',
  ],
  links: [
    { label: 'Preregistration', href: 'https://github.com/mazze93/authority-without-assertion/blob/main/preregistration.md' },
    { label: 'Repository', href: 'https://github.com/mazze93/authority-without-assertion' },
  ],
};

// ── Instruments ────────────────────────────────────────────────────────────
// Each is one control surface in the same authority architecture, bound
// together by Temenos: signal → gate → policy → ledger → human review.

export const INSTRUMENTS: Instrument[] = [
  { name: 'Stratum', role: 'Append-only decision ledger. Status is a fold over the log, never a stored field; replay is proven by round-trip.', href: 'https://github.com/mazze93/stratum' },
  { name: 'Aletheia', role: 'Provenance gate for prompt injection. Untrusted sources cannot supply governing parameters without the human knowing.', href: 'https://github.com/mazze93/aletheia' },
  { name: 'Apatea', role: 'Adversarial auditor for the gate: meaning-preserving transformations checked against stated invariants, with the search perimeter always reported.', href: 'https://github.com/mazze93/apatea' },
  { name: 'STELE', role: 'Session-integrity harness: standing directives compiled into constraints, with tripwires for authority drift.', href: 'https://github.com/mazze93/stele' },
  { name: 'Temenos', role: 'The runtime that binds them. Deterministic, human-authored policy; no model writes policy or grants itself authority.', href: 'https://github.com/mazze93/temenos' },
  { name: 'Rustpress', role: 'Publication boundary: stage, seal, verify, and deploy the exact artifact that was reviewed, without rebuilding it.', href: 'https://github.com/mazze93/rustpress' },
];

// ── Methods ────────────────────────────────────────────────────────────────

export const METHODS: Method[] = [
  { name: 'Preregistration', detail: 'Question, scoring rule and decision rules written before the first trial; later changes appended as dated amendments.' },
  { name: 'Blind double annotation', detail: 'Two independent human annotators per trial, metadata withheld, κ reported before adjudication; the scorer fails closed until both are in.' },
  { name: 'Strong baselines & negative controls', detail: 'The architecture has to beat careful prompting, not just a naive summary; failures a mechanism cannot catch are reported as boundaries, not pooled.' },
  { name: 'Invariant-based adversarial testing', detail: 'Monotonicity, extent stability and determinism as the oracle — because the real evasions returned confident wrong answers, not crashes.' },
  { name: 'Executable contracts & replay', detail: 'Claims about a system are checked by the system: invariant suites, serialize-reload-reproject round-trips, sealed and re-verifiable releases.' },
  { name: 'Stated perimeters', detail: 'Every result says what was tried and what it does not show. A run that reports nothing must be distinguishable from a run that searched nothing.' },
];

// ── Publications & record ──────────────────────────────────────────────────

export const PUBLICATIONS: Publication[] = [
  { title: 'MAESTRO in Practice: Threats, mitigations, and outcomes across 12 case studies', kind: 'Field study (PDF, 42 pp.)', year: '2026', href: '/papers/maestro-in-practice.pdf' },
  { title: 'Intentional Fragility: Bayesian Context Decay and Semantic Rot in Local-First LLM Orchestration', kind: 'Working paper (draft)', year: '2026', href: '/papers/intentional-fragility.pdf' },
  { title: 'The Concept Is Not the State', kind: 'Essay — interpretability & affective science', year: '2026', href: '/blog/concept-is-not-the-state/' },
  { title: 'What We Don’t Know Yet: iOS Lockdown Mode research', kind: 'Research note', year: '2026', href: '/blog/what-we-dont-know-yet/' },
  { title: 'CVE-2026-59869, CVE-2026-59868 — js-yaml merge-key denial of service', kind: 'Vulnerability reports', year: '2026', href: 'https://github.com/advisories/GHSA-52cp-r559-cp3m', note: 'Plus credited analysis on CVE-2026-53550.' },
  { title: 'Dodgson & Raymond, “Banknote authenticity is signalled by rapid neural responses,” Scientific Reports 12:2076', kind: 'Acknowledged contributor', year: '2022', href: 'https://doi.org/10.1038/s41598-022-05972-8' },
];

// ── Background (dated) ─────────────────────────────────────────────────────

export const ROLES: Role[] = [
  {
    org: 'Independent',
    role: 'AI security research',
    body: [
      'The research program above, run in public: open repositories, preregistered protocols, and instruments that report their own limits.',
    ],
  },
  {
    org: 'Secure Pride',
    role: 'Founder & Executive Director',
    years: '2026 — Today',
    href: 'https://securepride.org',
    body: [
      'A privacy-first cybersecurity nonprofit for LGBTQ+ and other at-risk civil-society organizations — the applied setting for the research, and the population with the highest exposure and the least instrumentation.',
    ],
  },
  {
    org: 'mudstack',
    role: 'Content & Community',
    years: '2022 — 2024',
    body: [
      'The company’s whole content function: technical posts, webinars, documentation, and <em>Clear as Mud</em>, a long-form interview podcast with studio directors, technical designers and founders.',
    ],
  },
  {
    org: 'UC Davis · Luck Lab',
    role: 'Research & Lab Operations',
    years: '2018 — 2020',
    body: [
      'Ran data collection for a counterfeit-banknote authentication program — EEG/ERP, eye-tracking and behavioral testing — measuring where human detection of a security feature succeeds and fails against real adversarial artifacts. Managed lab operations and trained incoming researchers on the lab’s ERP standard. B.S., Quantitative Psychology & Neuroscience, 2020; Regents Scholar.',
    ],
  },
  {
    org: 'Butte College',
    role: 'EOPS Tutor & Instructor · Founding Editor, Bloom',
    years: '2015 — 2018',
    body: [
      'Taught math, science, English and history to students with learning and developmental disabilities, and founded <em>Bloom Magazine</em> as its first editor-in-chief.',
    ],
  },
];

// ── Citation ───────────────────────────────────────────────────────────────
// Author name as it appears on the preregistration and the papers.

export const CITATION = {
  text: 'LeCzzare Frazer, M. (2026). Authority Without Assertion: Evidence-gated state for agentic systems under contextual pressure (Protocol v0.1.0) [Preregistration]. https://github.com/mazze93/authority-without-assertion',
  bibtex: `@misc{leczzarefrazer2026awa,
  author       = {LeCzzare Frazer, Mazze},
  title        = {Authority Without Assertion: Evidence-gated state
                  for agentic systems under contextual pressure},
  year         = {2026},
  note         = {Preregistration, protocol v0.1.0},
  howpublished = {\\url{https://github.com/mazze93/authority-without-assertion}}
}`,
};
