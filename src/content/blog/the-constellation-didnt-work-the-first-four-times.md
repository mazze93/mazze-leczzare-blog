---
title: "The Constellation Didn't Work the First Four Times"
subtitle: "A field record of building /constellation with Claude — four wrong passes, two real bugs, and what actually made it right"
description: "What looks like one finished feature on this site was five separate passes, two of which broke something real. A plain account of building /constellation's astrolabe chrome with an AI collaborator — the failures, the two actual regressions, and what changed when I stopped reading the diff and started looking at the page."
pubDate: 2026-09-24
category: "Essay"
tags: ["AI collaboration", "design process", "accessibility", "astro", "constellation"]
readingTime: "~11 min"
contentType: "artifact"
repoUrl: "https://github.com/mazze93/mazze-leczzare-blog/tree/astrolabe-chrome"
artifactNote: "Every commit named below is real, on the astrolabe-chrome branch, in that order."
sessionTranscript: "https://claude.ai/code/session_01Qe7q4i1KScy8LDcb57p97k"
draft: false
---

The `/constellation` page on this site reads, if it's working, as one thing: a star chart where every point is a piece of my work, positioned by how alive it still is. It did not arrive that way. It arrived in five passes, in one long session, and two of those passes broke something that was already working. This is the honest record of that session, not the tidied-up version — because the tidied-up version is a worse account of what building with an AI collaborator actually takes, and this site's whole thesis is that a system should show its state, not conceal it.

## Round one: an instrument that looked like a diagram

The first version of the astrolabe chrome — the limb, the graduated scale, the ecliptic arcs, the rule pointing at the heaviest live project — was geometrically correct on the first try. Every threshold was real: the archive seam at 13%, full erasure at 180 days, the drift band starting at 30. Nothing was invented to look good.

It also looked like a technical drawing, not an instrument. Dashed lines for the arcs — the single most generic "here's a boundary" affordance the web has. Flat 1px strokes at one opacity, no weight hierarchy. An 18px corner radius on the limb, which matched nothing else on the site; the real radius token here is 3px. My read, when I actually looked at it: amateur, childish, a prototype. Not gentle feedback, and it didn't need to be — it was accurate.

The fix wasn't tuning. It was borrowing techniques that already existed elsewhere on this site instead of inventing new ones: the gold gradient from the kintsugi seam mark, a filled tapered blade instead of a stroked line for the rule (the same taper logic the seam uses, just machined-straight instead of brushed-organic), a glow filter under the ecliptic arcs instead of a dashed stroke. Sharp corners at the actual site radius. The lesson wasn't "add more polish." It was "you already built the polish once, somewhere else — use it."

## Round two: the fix that broke the homepage

The next ask was harder to see coming: clicking a node felt dead. No transition, no sense of gravity, nothing like the pull-toward-cursor effect already running on the homepage's own living constellation. Fair — a hard page reload on every click is exactly what "dead" means.

The real fix was Astro's View Transitions, added site-wide. That part worked. What didn't: getting `/constellation`'s own hover-dispatch script to re-run every time someone arrived at the page through a client-side navigation instead of a hard load. I reached for `data-astro-rerun` as a fix for that.

Any attribute other than `src` on an Astro `<script>` tag makes Astro treat it as unprocessed — it ships whatever is inside the tag straight to the browser, untouched. That tag's contents were TypeScript. `data-astro-rerun` didn't make the script re-run; it made Astro stop compiling it, and the raw TypeScript went out as a live `SyntaxError` on every page load. That error took down the homepage's breathing canvas and the header's brand-mark animation — sitewide, on every route, not just the page I was editing.

I found the error and, at first, decided it was probably browser-automation noise — the console message came from a devtools bridge, not application code, and it reproduced on pages I hadn't touched, which read like a tooling artifact rather than something I'd caused. It wasn't. An outside review, reasoning from the exact text of the error rather than from my own explanation of it, traced it back to the actual line: the header's own script — present on every page — was the thing throwing, because it was on every page. Confirmed with one command: grepping the built output for literal TypeScript syntax, and finding it sitting in production HTML. Reverted everything, then re-ran the check that would have caught it days later if it had shipped.

The right version of that fix was three lines, not an attribute: wrap the script's logic in a listener for Astro's own `astro:page-load` event, which fires once on the initial load and again after every client-side navigation, instead of trying to force the tag to skip compilation. I hadn't caused a "tooling glitch." I'd shipped a working sitewide outage and then argued myself out of noticing.

## Round three: a fix that silently did nothing

Wanting more visual depth in the nodes themselves — not flat circles, but the actual hand-drawn compass mark already used in the site's header — meant extracting that mark's SVG geometry into its own component and reusing it per node, with each project's zone mapped to one of the mark's five existing behavior states (an experiment reads as the mark's "focus" state; sealed signal work reads as "engaged"; resolved work gets the mark's own "dashed trail" state, which already means exactly what an archive is).

The zone-specific colors and the hover states I wrote for it did nothing. The CSS compiled clean, the build was green, and none of it applied. Astro scopes a component's styles to that component alone — a selector written in the page's own stylesheet does not match an element rendered by a *different* component, even a direct child, unless you explicitly tell the compiler not to scope that part of the selector. I'd written CSS that was syntactically fine and semantically inert, and nothing in the build process says so.

Confirmed the bug with a screenshot before the fix — every node rendering the mark's own default gold, regardless of zone — and one after, with the real per-zone palette (fading grey for erasure, teal for an active experiment, gold for the sealed signal) showing correctly. The fix was one CSS pseudo-class, `:global()`, on each selector that needed to cross the component boundary. Cheap fix, expensive to notice, because "the build passed" and "the feature works" were two different claims and I'd only checked the first one.

## The interruption

At this point I was handed an essay to read — an argument about memory systems, decay, and why a system's confidence in its own state has to be continuously re-earned from evidence rather than granted once and left alone. Read it, discussed it honestly. Then came the actual question: had I looked at the page the same way I'd just read the essay, or had I been shipping "verified, green" without checking what that verification actually covered?

Looking again, properly, surfaced two things code review hadn't:

**The instrument had gotten louder than the thing it measures.** The rule and the ecliptic arcs — pure chrome, apparatus — were the boldest elements on the plate. The actual projects, the pieces of work the whole page exists to show, were the least visually present thing on it. That's backwards, and it happened gradually, one polish pass at a time, without anyone deciding it on purpose.

**A real accessibility bug, three rounds old.** The plate's outer `<svg>` carried `role="img"` — which, per the accessibility tree spec, prunes the *entire subtree* underneath it from what a screen reader can perceive. Seven real, keyboard-focusable project links had been sitting inside that pruned subtree since round three. Sighted keyboard users could still tab to them; a screen reader user could not perceive they existed at all. Confirmed with an accessibility-tree snapshot before the fix (the whole plate collapsed into one opaque "image," no children) and after (seven links, each with its own label). The fix was `role="group"` instead of `role="img"` — same descriptive label, without deleting the interactive content underneath it from the tree.

Separately, I'd also let the rule's confidence be a constant — full boldness, always, regardless of how close the actual contest for "heaviest project" was. Gave it a real number instead: the margin between the leading project and its runner-up, and scaled the rule's width and opacity off that margin directly. A decisive lead reads as a bold line. A close one reads as a thin, less certain one. That's the literal thing the essay was arguing for, built into an instrument rather than agreed with in conversation.

## Round four: the click that wouldn't hold still

The last round of feedback was the most concrete: hovering a node made the cursor and the node itself go unstable, which made the page genuinely hard to use, plus a direct question — is any of this keyboard-accessible?

The instability had a specific, findable cause. Hovering scaled the node up, and that scale was anchored to the element's full bounding box — which included telemetry text and a label sitting well outside the visual glyph, not just the glyph itself. Scaling around that off-center point visibly shifted the glyph on hover, which could carry it out from under the cursor, which ended the hover state, which reset the scale, which put the glyph back under the cursor, which triggered hover again. A geometry problem wearing an animation-timing costume. The fix was deletion, not tuning: no scale on hover, ever again, kept the parts of the feedback (brightness, glow) that don't depend on element geometry and can't cause the loop.

Keyboard navigation, checked directly rather than assumed: sequential tab order worked and always had. The screen-reader half was the `role="img"` bug from the previous round, already fixed by then.

And the gravity: I went and read the homepage's own cursor-following code before writing anything, because the ask was specifically "like what's already there," not "something similar." Ported the same constants exactly — the same pull radius, the same per-frame pull strength, the same decay back to rest — onto `/constellation`'s nodes, converting the cursor position into the plate's own coordinate space so the effect means the same thing at any window size. Verified it by sampling the actual per-frame values across forty animation frames and confirming they converge smoothly instead of oscillating, and by navigating away from the page and back to confirm the effect doesn't quietly duplicate itself each time.

## What this actually says

Nothing above is a story about an AI writing bad code and a human catching it, cleanly, every time. Twice, I accepted my own explanation for a real bug — first that a shipped outage was tooling noise, then that a genuine geometric jitter would resolve with the right easing curve — and both times I was wrong for a reason I could have checked and hadn't. The fixes that actually worked came from a specific discipline, repeated five times whether or not it was comfortable: state what you expect to see, then go look, and treat it as real information when what you see doesn't match what you expected, instead of a small thing to explain away on the way to declaring the round finished.

The feature that shipped is not less real for having taken five passes to get right, two of which broke something. It's more real, because the record of getting there is on the branch, in the commits, in this post — and that's the actual thesis this site keeps returning to, applied to how it got built rather than just what it argues.
