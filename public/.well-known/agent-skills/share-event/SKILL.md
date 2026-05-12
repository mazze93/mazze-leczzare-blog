# Share Event API

Record a quote-share telemetry event when a reader shares a paragraph from a blog post.

## Endpoint

`POST https://mazzeleczzare.com/api/share-event`

`Content-Type: application/json`

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | string | yes | Event type — must be `quote_share_clicked` or `quote_share_visited` |
| `path` | string | yes | URL path of the page where the share occurred (e.g. `/blog/my-post/`). Must start with `/`, max 180 chars, alphanumeric plus `_` and `-` only, no `..` or `//`. |
| `quoteId` | string | yes | Identifier of the shared paragraph. Format: `quote-<n>` where `<n>` is 1–4 digits (e.g. `quote-3`). |

## Example

```json
{
  "event": "quote_share_clicked",
  "path": "/blog/the-jingle-of-me/",
  "quoteId": "quote-3"
}
```

## Responses

| Status | Meaning |
|--------|---------|
| 204 | Event recorded |
| 400 | Missing or invalid fields |
| 429 | Rate limit exceeded (20 requests per 60 s per fingerprint) |
| 503 | Rate limiter temporarily unavailable |

## Notes

- CORS is enforced; requests must originate from `https://mazzeleczzare.com` (matching `Origin` or `Referer` header).
- This endpoint is intended for first-party telemetry only.
- Allowed event names: `quote_share_clicked`, `quote_share_visited`.
- `quoteId` must match the pattern `quote-<1–4 digits>`.
