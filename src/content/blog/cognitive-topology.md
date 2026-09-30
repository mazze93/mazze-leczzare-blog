---
title: "Cognitive Topology"
subtitle: "The failure mode isn't capability. It's topology."
description: "A white paper arguing that AI-assisted engineering fails on topology, not capability: roles, memory tiers, handoffs, and specs. A design argument, not a study."
pubDate: "2026-09-29"
category: "White Paper"
tags: ["cognitive topology", "AI-assisted engineering", "agent architecture", "memory", "handoffs", "Stratum", "white paper"]
readingTime: "~1 min"
contentType: "field-note"
heroImage: "../../assets/images/blog/cognitive-topology-card.png"
heroDim: false
heroImageAlt: "Title card reading Cognitive Topology: The failure mode isn't capability, it's topology. A tree of connected nodes descends through six labelled tiers, from working memory to archive."
project: "cognitive-topology"
draft: false
---

Models keep getting larger and the same failures keep happening: drift, contradictions, invented APIs, decisions that get lost between sessions. The paper argues the cause is structural. A bigger room does not make a meeting more productive.

Its answer is an architecture, four claims deep:

1. **Cognition is divisible.** Planning is not implementation; criticism is not creation.
2. **Memory is plural.** Working, episodic, and semantic memory should not share one buffer.
3. **Handoffs need a protocol.** State crosses a boundary as a compressed packet, not a replayed transcript.
4. **Specs precede agency.** An agent that writes a commitment, gets it ratified, and then acts against it is bounded.

## What this is, and isn't

It is a design argument and a specification, written by one person: 10 invariants, 12 agent roles, 6 memory tiers, and one handoff format. Those numbers describe the design. They are not results.

It does not report a controlled evaluation of the architecture. [Stratum](https://stratum.mazzeleczzare.com/), a macOS workbench and CLI, is being built against it, and that is where it gets tested.

## Read it

- [The page](/cognitive-topology/): the argument in brief, with the four claims and the failure modes.
- [The white paper (PDF, 34 pages)](/cognitive-topology/cognitive-topology-white-paper.pdf): the full architecture.
- [The reshape tessera](/tesserae/cognitive-topology-reshape/): how the design was folded into Stratum, with the record.
