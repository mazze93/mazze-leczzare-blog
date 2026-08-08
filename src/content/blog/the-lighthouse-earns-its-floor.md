---
title: "The Lighthouse Earns Its Floor"
subtitle: "On intentional fragility, and the case for forgetting well"
description: "A system that forgets nothing does not become wiser; it becomes crowded. The editorial companion to a formal argument for accountable forgetting in local-first AI — why context should cost something to keep, and why the things we most want to protect should earn their protection rather than be granted it."
pubDate: 2026-07-04
author: "Mazze LeCzzare"
category: "Essay"
tags: ["intentional fragility", "AI", "memory", "context", "philosophy of mind", "local-first"]
readingTime: "~8 min"
contentType: 'dispatch'
project: "intentional-fragility"
committed: true
featured: true
draft: false
slug: "the-lighthouse-earns-its-floor"
---

A context window that forgets nothing does not become wiser. It becomes crowded.

We have built an entire discipline on the opposite assumption. Retrieval systems, long-context models, the whole apparatus of machine memory — they share a single buried objective: keep as much potentially relevant information as the budget allows. Forgetting is the failure mode. Every engineering instinct bends toward retention, toward the day the system finally remembers everything and never has to choose.

I think this is precisely backwards, and I think the reason is simple once you say it plainly. The scarce resource was never storage. Storage is cheap and getting cheaper. The scarce resource is attention — the finite span of what can actually condition a thought at the moment the thought is formed. Inside that span, every stale fact you have lovingly preserved is sitting in the chair of a fact that currently matters. The question is not *how much can we hold.* The question is harder and more honest: *what has earned its place here, and what has quietly turned to noise while still presenting itself as signal?*

That second clause is the dangerous one. Useless information that announces itself as useless is no real problem; you discard it. The problem is information that has gone stale while keeping its credentials — the decision that was load-bearing last week and is now just weight, the anchor that mattered once and has not mattered since, the confident note that keeps insisting on its own importance long after the importance has drained out of it. A memory system that cannot tell the difference is not faithful. It is hoarding.

So I want to make a case for the opposite design, which I have been calling *intentional fragility*. The premise is almost rude in its directness: context should cost something to keep. Not metaphorically — structurally. A unit of context should decay when it goes unused. It should rot, visibly, when its meaning drifts away from whatever the work is actually about now. And it should become *cheaper to discard* the more often it overpromises and underdelivers. Fragility, here, is not a weakness the system suffers. It is a faculty the system has.


The decay part is easy to accept; everyone forgets what they stop touching. The rot is more interesting, because rot is what happens to context that is touched constantly and has nonetheless gone wrong. You can return to a note every hour and still be returning to something that no longer fits the task in front of you. So you anchor the work — name what it is currently about — and you measure how far each piece of context has drifted from that center. Drift does not arrive as a cliff. It accrues as a gradient, a warning that deepens, until a thing that has wandered too far is finally let go. There is a mercy in making it gradual. You get to notice the drift before it becomes a cut.

But the real argument, the one I care about most, is none of this. It is about what a system pays attention to when it decides what to forget.

Almost every memory system tracks *what happened.* How recently was this used. How often. Did the last interaction with it succeed or fail. These are records of events. What no system tracks — what has no architectural home anywhere in the current toolkit — is what the system *expected* to happen. And the gap between the two, between the utility a piece of context predicted for itself and the utility it actually delivered, is not a minor signal. It is the signal. Every constructivist account of a mind, biological or otherwise, says the same thing: you learn from surprise. The discrepancy between prediction and outcome is the one teacher that ever taught anybody anything. We have built memory systems that record their history and cannot be surprised by it.

Give surprise a home and the behavior changes. Let each piece of context carry a revisable belief about its own usefulness — a real prior, updated every time it is asked to contribute and either does or doesn't. Now the system can do something it could not do before: it can identify the context that consistently predicts high value for itself and consistently fails to deliver, and it can let that context go *first.* This is exactly right, because overconfident-and-useless is the worst thing that can happen to an attention budget. Such a unit commits two offenses at once. It takes up space, and it lies about what the space is worth. The modest note that promises little and quietly delivers is a good tenant. The grand note that promises everything and produces nothing is the one to evict, and the system that tracks only success and failure can never quite catch it in the act.

There is a smaller idea inside this one that I find almost moral. When a piece of context fails badly, it would be easy to let that failure spread — to dock the confidence of everything connected to it, to treat proximity as guilt. The design refuses this. When error propagates across a relationship between two pieces of context, it does not lower the neighbor's estimate of its own worth. It widens the neighbor's *uncertainty.* The adjacent thing does not become less valuable; it becomes less sure, and being less sure, it goes looking for more evidence. The network is built as a structure of shared confidence, not shared blame. I did not set out to write an ethics into a decay function. But there it is, and I would not take it out.


Then there are the things you cannot afford to lose. Every memory system needs anchors — units flagged as critical, protected from the ordinary erosion so they are always there when needed. The obvious way to build this is to grant the anchor a permanent floor: a level below which it simply cannot fall.

And the obvious way is wrong, for a reason that took me a while to see clearly. A permanent floor re-introduces the exact failure the whole system exists to prevent. Suppose the anchor was designated in error — important once, and not anymore. The permanent floor will protect that mistake forever. The erosion that corrects every other kind of staleness is forbidden from touching this one. You have built a system that learns from everything except the things you were most certain about, which is to say you have built a system that cannot learn from its own certainty.

So the floor has to be earned. Not granted in perpetuity — derived, continuously, from the anchor's own demonstrated track record. An anchor whose predictions keep coming true holds a high floor and deserves it. An anchor whose prior erodes under repeated failure loses its protection in proportion to how wrong it has been. It remains the anchor. Its head start is preserved. But the floor it stands on is something it keeps re-earning, and misdesignation — the permanent error of the permanent floor — becomes self-correcting through the same machinery that governs everything else. The lighthouse keeps the light on. It does not get to keep the ground for free.


Up to here this is an argument about software, and I could leave it there. I don't want to, because the place this matters most is the place where the context being managed is a person.

I built this to be used by people for whom a wrong inference is not a bug report. Neurodivergent users. People in clinically-adjacent situations where a system's guess about an internal state — your mood, your attention, your capacity right now — is exactly the kind of guess that, acted on without permission, becomes a small violence. A system that infers your state and then *does something* about it — quietly rearranges your task, switches how it talks to you, decides on your behalf what you can handle — has crossed a line that no amount of accuracy redeems. It has moved from reading you to ruling you, on the strength of a guess.

So the line is drawn before the autonomy, not after the accuracy. The system is allowed to notice. It is allowed to form a provisional, revisable belief about what it noticed; noticing is a kind of literacy, and I don't want to forbid literacy. What it is not allowed to do is act on that belief without your word. Your account of yourself outranks its inference about you, always — not as a courtesy but as a rule of precedence wired into the thing. The model's read of you is provisional by construction. Yours is authoritative by construction. And the whole design earns the right to be deployed at all only because every one of its beliefs — about a piece of context, about an anchor, about you — stays correctable. That correctability is the entire difference between a tool you can live inside and a tool that has quietly decided it knows better.

This is the same refusal, dressed differently, that runs through everything I build. Do not let the machine conceal. Do not let it act on what it cannot confirm. Do not mistake a surface that never cracks for a surface with something solid underneath — sometimes the thing that never breaks is just the thing that was never load-bearing, never tested, never honest enough to fail where you could see it.

I have come to think forgetting is not the opposite of keeping faith with the past. It is how you keep faith with the present. A system that holds everything equally holds nothing in particular, and a mind — any mind — that cannot let the wrong things go is not loyal. It is stuck.

We hold strong beliefs weakly. The lighthouse keeps the light on, but it earns the floor it stands on.
