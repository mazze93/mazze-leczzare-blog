# Share Event API

Record a quote-share telemetry event when a reader shares a paragraph from a blog post.

## Endpoint

`POST https://mazzeleczzare.com/api/share-event`

`Content-Type: application/json`

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | string | yes | Event type — use `"share"` |
| `path` | string | yes | URL path of the page where the share occurred (e.g. `/blog/my-post/`) |
| `quoteId` | string | yes | Identifier of the shared paragraph (assigned by the page) |

## Example

```json
{
  "event": "share",
  "path": "/blog/the-jingle-of-me-radio/",
  "quoteId": "p-3"
}
```

## Responses

| Status | Meaning |
|--------|---------|
| 204 | Event recorded |
| 400 | Missing or invalid fields |
| 429 | Rate limit exceeded (20 requests per 60 s per fingerprint) |

## Notes

- CORS is enforced; requests must originate from `https://mazzeleczzare.com`.
- This endpoint is intended for first-party telemetry only.
