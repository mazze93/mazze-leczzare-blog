# GitHub Repository Hardening Sprint — illustrative handoff

This is a fictional example of the deliverable format. No customer repository was audited and no customer result is claimed. It does not certify a repository or establish that an application is secure.

## Engagement

Example repository: `example-team/service` (fictional). Scope: one repository, three existing GitHub Actions workflows. The owner approves settings changes; implementation is reviewed in pull requests. Application testing and production infrastructure are outside this example.

## Findings and evidence format

| ID | Observed configuration | Proposed change | Acceptance evidence | Status in this sample |
|---|---|---|---|---|
| A01 | A workflow-level write token is inherited by a pull-request test job | Set read-only workflow defaults; grant necessary writes only to the release job | Recorded workflow revision, PR run and reviewed permissions table | Illustrative; not executed |
| A02 | A branch rule names a check that no longer exists | Agree the intended check with the owner and update the rule to its real name | A controlled failing PR remains blocked and an ordinary passing PR can merge through the intended review path | Illustrative; not executed |
| A03 | Third-party Actions references use movable tags | Verify official upstream revisions, pin them, and configure the update process | Source URL and full revision for each pin, plus a passing workflow at the reviewed revision | Illustrative; not executed |
| A04 | Dependency updates have no agreed review cadence | Add an appropriate Dependabot configuration and document who reviews it | Configuration diff and observed first update run; pending checks remain pending | Illustrative; not executed |

## Before changing settings

Record the repository's default branch, existing rulesets and bypass actors, enabled checks, contributor signing setup if relevant, repository plan and the last passing build. Confirm that the proposed controls are supported and will not lock out routine maintenance. An unavailable setting is reported as unavailable, never as enforced.

## Change record

The real handoff names each pull request, reviewed commit, settings change, approver and timestamp. It separates verified behavior, inferred benefit, accepted exceptions and outstanding work. No raw secrets, production tokens or private source snippets belong in the public version.

## Validation record

Each real acceptance check records its command or UI action, target revision, expected behavior, observed behavior and evidence location. A green workflow alone does not establish that a branch rule enforced it. A blocked PR alone does not establish that a legitimate PR can merge.

## Recovery

Restore the captured settings with the owner, then revert the specific implementation pull requests in the agreed order. Re-run the original passing workflow and validate the normal contributor path. Do not reset branches, delete work, disable unrelated protections or rotate credentials as a substitute for diagnosis.

## Handoff

A real engagement includes the baseline, approved changes, validation record, exception list, rollback instructions and a 45-minute walkthrough. Follow-up covers defects in the agreed changes for seven calendar days. Additional repositories, new requirements and unrelated failures receive their own scope.
