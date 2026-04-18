---
title: "Static-First Is a Discipline"
description: "Why I still prefer static publishing for personal infrastructure, even when modern frameworks make dynamic everything easy."
pubDate: "Mar 05 2026"
heroImage: "../../assets/images/blog/hero-signal-grid.svg"
---

Static-first is not nostalgia.

It is an operating principle.

For a personal site, I want the default state to be durable, inspectable, cheap to host, and hard to break accidentally. That does not mean “never interactive.” It means interaction starts as an exception, not a reflex.

Most personal websites do not fail because they lack capability. They fail because they inherit too much surface area too early. Too many moving parts. Too many packages. Too many assumptions about what must happen at runtime. The result is a site that looks modern for a moment and then quietly becomes expensive to maintain.

Static publishing narrows the blast radius. Pages render predictably. Metadata is explicit. Caching is simple. Failure modes are easier to reason about. Security posture improves because there is less machinery exposed in the first place.

That is why this site leans on Astro for the shell and uses React islands selectively. The island model is useful precisely because it puts pressure on the question that matters: should this piece hydrate at all?

If the answer is no, it stays static.

If the answer is yes, the interaction should justify its cost in clarity, delight, or utility.

That is the discipline. Not anti-JavaScript dogma. Not purity. Just a bias toward simplicity until complexity proves its case.
