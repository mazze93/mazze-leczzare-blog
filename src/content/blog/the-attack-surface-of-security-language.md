---
title: "The Attack Surface of Security Language"
subtitle: "How words like trusted, anomalous, and authorized become infrastructure"
description: "Every alert rule, IAM policy, and fraud model carries a theory of what is normal. Once that theory is buried inside a label, the label stops describing and starts deciding. A case for governing security vocabulary like code."
pubDate: 2026-08-06
author: "Mazze LeCzzare"
category: "Essay"
tags: ["security engineering", "language", "classification", "NIST", "governance", "AI safety"]
readingTime: "~9 min"
heroImage: "../../assets/images/blog/load-bearing-lexicon-hero.png"
heroImageAlt: "A cracked black stele on a desk of astrolabes, star charts, and old books, engraved with the words trusted, anomalous, authorized, and privileged."
contentType: 'dispatch'
project: secure-pride
committed: true
draft: false
slug: "the-attack-surface-of-security-language"
---

Security tooling is sold as if it were about attackers.

Most of the time, it is about ordinary lives: the volunteer locked out of a shared account, the administrator working past midnight, the user whose behavior does not resemble the model's idea of a person. The system does not ask who they are. It asks whether they fit.

That work begins in language.

Every alert rule, IAM policy, fraud model, content filter, and incident report carries a theory of what is normal. The theory may be explicit. More often, it is buried inside labels such as *trusted*, *anomalous*, *authorized*, *privileged*, or *user error*. Once those labels govern a system, they stop being descriptive. They become mechanisms.

The word becomes executable.

## Detection Is Not Perception

Security systems do not perceive threats. They classify signals through a model of expected behavior.

That distinction matters because context is never neutral. Every baseline encodes a population it considers ordinary. The employee who travels frequently, the volunteer sharing an account, the administrator working at an unusual hour, and the user whose language does not resemble the training data may all appear anomalous without being dangerous.

An anomaly is not a threat. It is a distance from a chosen baseline.

The baseline still has consequences. A person repeatedly challenged by authentication controls loses time. A nonprofit with limited staff may abandon a tool that produces too many false positives. A security team may begin treating alerts as background noise. The system has not merely detected behavior; it has distributed friction across a population.

That makes the construction of "normal" a threat-modeling concern, not a footnote.

Modern risk frameworks increasingly acknowledge this context. NIST describes AI systems as inherently socio-technical, shaped by human behavior and social dynamics, while its Cybersecurity Framework 2.0 places organizational context and governance at the center of risk management.[^1][^2] The language of security has already admitted that systems operate inside institutions. The next step is to examine what that admission requires of the categories those systems use.

## Metaphors Become Policy

Cybersecurity depends on metaphors. We speak of attack surfaces, defense in depth, trust boundaries, immune systems, least privilege, and zero trust because technical systems are difficult to reason about without compression.

The danger begins when a metaphor becomes policy without showing its work.

An "attack surface" can help an engineer enumerate exposure. It can also encourage an organization to treat every human interaction as a liability. "Least privilege" can constrain unnecessary access. It can also become a justification for making ordinary work impossible. NIST's definition is operationally clear — restrict access to the minimum necessary for assigned tasks — but applying it still requires judgment about which tasks, which users, and whose account of necessity prevails.[^3][^4]

"Trusted user" can describe a temporary authorization state. It can also harden into a social category that receives less scrutiny and more power.

The metaphor does not determine the outcome by itself. Institutions do that through implementation, ownership, and review. But language makes some decisions easier to see than others.

A system that labels a person "trusted" may conceal the fact that trust is being granted by someone, for a purpose, within a scope, and under conditions that can change. The label compresses all of that into a character judgment.

That compression is an operational risk.

## Who Defines Normal?

Security programs often ask whether a behavior is acceptable without asking who established the standard.

This is where technical classification becomes political. Someone decides which users are representative, which workflows are suspicious, which exceptions deserve accommodation, and whose inconvenience counts as an acceptable cost.

The decisions may be made by a security architect, a vendor's training corpus, a policy committee, an undocumented convention, or a model operating beyond the understanding of the people responsible for it. The authority remains real even when the decision process is invisible.

The problem is not that systems classify. They must classify. The problem is pretending that classification is observation rather than interpretation.

A mature security posture should make its categories inspectable:

- What does "authorized" mean in this system?
- Who owns that definition?
- What evidence supports the baseline?
- Which populations experience the most friction?
- What happens when the category is wrong?
- When will the definition be revisited?

Without those questions, security language becomes a form of governance without an accountable record.

## The Load-Bearing Lexicon

In my own work, I have started treating certain security terms as a **load-bearing lexicon**.

A load-bearing term is a word that carries operational force. If changing its definition would alter an alert, permission, workflow, escalation path, or user consequence, the term should be governed like code.

That means every high-impact term needs:

- A precise definition.
- An owner with authority to change it.
- A declared scope.
- Known failure modes.
- Evidence or rationale.
- A review date.
- A record of contested interpretations.

Consider *authorized*. It might mean that a user authenticated successfully. It might mean that the user is permitted to perform a particular action. It might mean that the action was approved in advance. Those are different states. Collapsing them creates gaps that an attacker can exploit and operators may not notice until after an incident.

The same applies to *privileged*, *safe*, *anomalous*, and *user error*. These words should not enter policy, detection rules, prompt libraries, or access-control logic as vibes.

They need schemas.

## Stele as Constraint

This is where Stele becomes useful — not as a metaphor for integrity, but as a constraint on how categories enter a system.

A governed harness can require high-impact terms to carry metadata before they are allowed to control behavior. A lexicon manifest can record definitions and owners. A pre-commit or CI check can block new policy terms that lack that metadata. A decision ledger can preserve evidence, disagreement, impact analysis, and scheduled review.

The point is not to make language bureaucratic for its own sake. The point is to prevent invisible assumptions from becoming infrastructure.

In systems such as Stele, Context Synapse, or Secure Pride, the question is not simply whether a control exists. The question is whether the control can expose the categories through which it makes decisions.

A system should be able to say:

- What did we classify?
- Under which definition?
- Based on what evidence?
- With whose authority?
- What alternatives were rejected?
- Who bore the resulting friction?
- When will we check whether the category still holds?

That is more demanding than adding another detector. It is also closer to the actual problem.

## Neuroscience as Supporting Evidence

Neuroscience can help explain why these categories become persuasive.

Human perception is not passive recording. It involves prediction, salience, attention, and error correction. We notice deviations from expectations because expectations organize what we perceive in the first place.

The analogy is useful when it clarifies why detection systems need context, adaptation, and recovery. It becomes misleading when it suggests that an organization can operate like a body with one coherent interest, one boundary, or one definition of health.

Organizations contain conflicting interests. Their boundaries are negotiated. Their security decisions affect people unevenly. A system that "protects the whole" may protect one group by imposing costs on another.

The organism metaphor should therefore support a richer question: how does a system sense, decide, recover, and revise its model of the world? It should not replace the political analysis of who controls those processes.

## The Human Cost of False Certainty

False positives are often treated as a tuning problem: lower the threshold, adjust the model, retrain the classifier.

Sometimes that is correct. But a false positive also leaves a social residue.

A volunteer stops reporting suspicious behavior because previous reports produced no useful response. An administrator creates a workaround because the approved path is too slow. A user learns that the system's definition of legitimate behavior does not include them. A security team begins ignoring alerts because the alert stream has become a second inbox.

The control has failed even if its dashboard still looks active.

This is why friction must be measured alongside detection. A security system that catches more anomalies while driving users into unsafe workarounds may be increasing exposure rather than reducing it.

The relevant question is not only "Did the system block the event?" It is "What behavior did the system produce after the block?"

## Categories Must Remain Repairable

Every system eventually makes a decision about who belongs, what counts as ordinary, which deviations deserve intervention, and whose friction is acceptable.

Those decisions will be made in language before they are made in code.

The mature system is not the one that claims perfect detection. It is the one that keeps its categories visible, contestable, versioned, and repairable.

That requires treating security vocabulary as part of the system's control plane. Definitions need owners. Policies need provenance. Exceptions need records. Models need review. Disagreement needs somewhere to go besides an incident channel.

Security engineering cannot eliminate interpretation. It can expose where interpretation enters the system and give people a way to challenge it before the category hardens into infrastructure.

The moment a word becomes load-bearing, it becomes part of the attack surface.

## Author's Note

This essay emerged from work on governed AI workflows, security tooling for under-resourced organizations, and research into how minimally trained users reason about vulnerabilities with LLM assistance. Secure Pride applies an open-source, AI-assisted security approach to LGBTQ+ and SOGI-sensitive organizations, while Stele explores integrity controls for high-risk AI workflows.

The practical test is simple: if a term can change what a system permits, blocks, escalates, or records, it deserves more than a definition in a glossary. It deserves an owner, evidence, a failure mode, and a way back.

## Sources

[^1]: NIST. [Artificial Intelligence Risk Management Framework (AI RMF 1.0).](https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf)

[^2]: NIST. [The NIST Cybersecurity Framework (CSF) 2.0.](https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf)

[^3]: NIST. [Security and Privacy Controls for Information Systems and Organizations, SP 800-53 Rev. 5.](https://csrc.nist.gov/CSRC/media/Projects/risk-management/800-53%20Downloads/800-53r5/SP_800-53_v5_1-derived-OSCAL.pdf)

[^4]: NIST CSRC. [Least Privilege — Glossary.](https://csrc.nist.gov/glossary/term/least_privilege)
