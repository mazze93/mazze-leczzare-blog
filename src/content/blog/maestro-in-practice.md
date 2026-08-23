---
title: "MAESTRO in Practice"
subtitle: "Threats, mitigations, and outcomes across 12 case studies"
description: "A field study of MAESTRO, the Cloud Security Alliance's seven-layer threat-modeling framework for agentic AI — twelve documented applications, a per-layer threat catalog, and eight prioritized recommendations, with every headline figure traced back to how confidently it's actually sourced."
pubDate: 2026-08-23
category: "Research"
tags: ["security", "AI", "agentic AI", "threat modeling", "MAESTRO", "MCP", "multi-agent systems"]
readingTime: "~7 min"
contentType: 'artifact'
artifactNote: "Full 42-page PDF: 12 case studies, a per-layer threat catalog, comparative insights, and an annotated evidence ledger flagging every quantitative claim's sourcing."
draft: false
---

Ken Huang introduced MAESTRO at the Cloud Security Alliance in February 2025 — Multi-Agent Environment, Security, Threat, Risk, and Outcome — as a threat-modeling framework built specifically for agentic AI. STRIDE, PASTA, and LINDDUN all predate the category they'd need to model: none of them has a native concept of a system that calls tools, holds memory across sessions, or negotiates with other agents on your behalf. MAESTRO's answer is a seven-layer decomposition — foundation models, data operations, agent frameworks, deployment infrastructure, evaluation and observability, security and compliance, and the agent ecosystem — plus explicit modeling of the threats that cross layer boundaries, which is where the interesting failures live.

A framework is a claim until it's been used. So I spent June compiling every documented application of MAESTRO I could find and hold to a citation — CSA's own case studies, IriusRisk's commercial threat-modeling library, Snyk Labs guidance, two academic preprints, and a TITO CI/CD scan run against a real agent pipeline — twelve in total, spanning March 2025 to May 2026. The report extracts what each one found: the threats identified, the mitigations applied, and what happened after.

**The full report is here as a PDF** — 12 case study deep dives, a canonical per-layer threat catalog (60+ threats, 40+ canonical mitigations), a comparative-insights section on which layers get hit most, eight prioritized recommendations, an implementation checklist, and an annotated reference list that grades every source by evidentiary weight:

**→ [MAESTRO in Practice (PDF, 42 pages)](/papers/maestro-in-practice.pdf)**

## What twelve case studies actually show

Layer 3 — Agent Frameworks — appears in all twelve. It's the orchestration hub sitting between the model (L1) and action execution (L4), and the failure that recurs across the set isn't a single vulnerability class so much as an architectural habit: collapsing L1→L3→L4 into one implicit trust domain, so that nothing between "the model decided to do this" and "the shell executed it" is actually checked. Seven of the twelve case studies exhibit that exact chain.

A few other patterns held up across sources rather than showing up once and vanishing:

- **RAG and agent memory are a persistence vector, not just a knowledge store.** Three separate case studies treat memory poisoning as the mechanism by which a single compromise survives the session that created it.
- **MCP servers can't be trusted by source alone.** The tool-poisoning and STDIO-injection findings recur across four case studies, and the through-line is the same one web security learned decades ago: anything the model can be induced to call is an input, not a trusted internal surface.
- **Lateral movement through agents is a growing pattern, not a hypothetical one.** CSA Labs' own incident review found cross-agent propagation in 0% of documented promptware incidents in 2023 and 38% by 2025–26 — the "Living Off the Agent" pattern, where an agent's own authenticated connections become the attacker's lateral-movement infrastructure.

## The recommendation that matters more than the other seven

Enforce explicit trust-boundary validation at every layer transition, especially L1↔L3↔L4. Require explicit authorization before any model output becomes executable intent. Treat LLM output as an untrusted input, the same way you'd treat a form field — never as an internal signal you can act on directly. This is recommendation one of eight in the report for a reason: it's the fix underneath most of the other findings, not a peer to them.

## Why the sourcing matters as much as the findings

A few of the numbers that circulate around agentic-AI security are striking enough to travel on their own — a 90% knowledge-base compromise rate from five poisoned documents, a 72.8% MCP tool-poisoning success rate. Both are real, cited figures. Both are also CSA Labs' framing of someone else's underlying research, not something reproduced first-hand in this report. I didn't want to launder that distinction by dropping the caveat between draft and publish, so the report carries an explicit evidence ledger — every headline figure, its sourcing status, and the editorial call made about how to present it. If you're going to cite a number from this space in your own work, the ledger tells you exactly how far back you'd need to go to verify it yourself.

That's the whole practice this report is trying to model, honestly, more than any single finding in it: a framework is only as useful as your ability to tell which of its claims you're allowed to trust unexamined, and which ones you're still on the hook for checking.

> **Shareable version:** [a 9-slide carousel (PDF)](/social/maestro-in-practice.pdf) distilling the framework, the four core findings, and the top recommendation — built for LinkedIn, sized for anywhere else.
