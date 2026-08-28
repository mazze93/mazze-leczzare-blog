# auth.md

Agent authentication and access disclosure for `mazzeleczzare.com`, per the
[Auth.md](https://auth.md/) convention for agent registration discovery.

## Audience

This document is for AI agents, crawlers, and other automated clients
deciding how to authenticate to this site. It is a personal publication and
portfolio — there is exactly one human operator, and there is no
self-service registration, API key issuance, or agent onboarding flow.

## No agent registration is offered

There is no `POST`-a-registration, no client-credentials flow, and no
public API key issuance. If you are looking for a `register_uri` or an
OAuth dynamic client registration endpoint, none exists — do not attempt to
probe for one.

## Public, credential-free surface

Everything an agent legitimately needs is already open, unauthenticated,
and discoverable:

| Resource | Purpose |
| -------- | ------- |
| Any page, with `Accept: text/markdown` | Server-rendered Markdown of that page (see `functions/_middleware.ts`) |
| `/rss.xml` | Full post feed |
| `/.well-known/agent-skills/index.json` | Agent-skills index (agentskills.io schema) |
| `/.well-known/mcp/server-card.json` | MCP server card |
| `/.well-known/agent-card.json` | A2A Agent Card |
| `/.well-known/api-catalog` | RFC 9727 linkset of the routes below |
| `/.well-known/http-message-signatures-directory` | Web Bot Auth JWKS — verifies signatures on requests *this site* sends out, not inbound requests |

None of the above require a token, key, or header of any kind.

## Two write endpoints exist, but are not agent-callable

`POST /api/contact` and `POST /api/share-event` require no bearer token —
but they enforce a same-origin check (`Origin`/`Referer` must match the
request's own origin) and reject anything else with `403`. They exist for
this site's own browser-side JavaScript, not for direct agent use. An agent
wanting to reach the site owner should use the information in
`/.well-known/agent-skills/contact/SKILL.md` as a *description* of the
contact flow, not call the endpoint directly.

## `/admin` is a human-only area, not an agent resource

`/admin` is gated by a password login (`POST /api/login`) that sets an
`HttpOnly`, `__Host`-prefixed session cookie — not an
[RFC 6750](https://www.rfc-editor.org/rfc/rfc6750) Bearer token in an
`Authorization` header. This site also publishes
`/.well-known/oauth-protected-resource` and
`/.well-known/oauth-authorization-server`, which describe that boundary in
OAuth-shaped metadata for discovery tooling; they are not an invitation to
register or obtain a token as an agent, and `bearer_methods_supported` is
deliberately omitted from the protected-resource metadata because no
Bearer-header flow exists to advertise. There is no path — human or agent —
to `/admin` other than the site owner's own password.
