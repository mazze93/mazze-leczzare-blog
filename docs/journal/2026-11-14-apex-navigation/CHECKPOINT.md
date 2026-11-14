# CHECKPOINT — apex navigation

**Last updated:** 2026-11-14 01:18Z
**State:** PLAN revision 2 written (it adopts the external review); **waiting on mazze's
go-ahead.** Nothing is committed; the journal files and `docs/journal/INTENTS.md` are
untracked.

## To resume

Read this file, then `PLAN.md`, then `DECISIONS.md`. The audit evidence is in
`~/Projects/inbox/2026-11-13/airlock-patrol/`, which covers two periods: the baseline,
then post-change states. Read `header-states.csv` and `studio-worker-inspection.md` there.

## Bursts

- [ ] 0 Deployment-aware route inventory and intent map (read-only).
  **Accept:** bearing-table is classified `worker-route`.
- [ ] 1 Taxonomy and naming decisions (needs mazze)
- [ ] 2 Project registry: (a) content validation, (b) ingest validation, (c) reachability
- [ ] 3 Gates: (3a) build over `dist/`, (3b) edge, scheduled.
  **Accept:** 3b fails without the bearing-table row while 3a is green.
- [ ] 4 Airlock as hub
- [ ] 5 Nav generated from data
- [ ] 6 Bench lists every project
- [ ] 7 Field notes, both senses
- [ ] 8 Return paths, per repo: provenance → rollback ID → PR → deploy by mechanism → live check
- [ ] 9 Indexing (edge-served routes included)
- [ ] Track S: Studio (separate approval)

## Deferred / needs mazze

1. Go-ahead on revision 2, and permission to commit the journal scaffold to `main`.
2. A read-only Cloudflare API token for CI (burst 3b): zone read, Workers routes read,
   Pages read.
3. Burst 1 decisions: bearings; the Studio name collision (proposal: the bench moves to
   `/bench/`, with a redirect from `/studio/`); the roles of `/writing/` and `/blog/`.
4. Track S: what Studio shows publicly; whether to recover its source into a repo.
5. Search Console access (burst 9).
6. If more than the three named items were meant, the earlier review's blockers (registry,
   ingest validation, reachability) need pasting into this session.

## Carried from the audit (outside this plan)

- Move the six zone-rule headers into origin repos.
- Align the bearing-table Worker headers.
- WebMCP `mcp-server-client` pack: keep or drop.
