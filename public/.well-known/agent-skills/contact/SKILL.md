# Contact API

Send a message to Mazze Leczzare via the contact form endpoint.

## Endpoint

`POST https://mazzeleczzare.com/api/contact`

`Content-Type: application/json`

## Request Body

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | yes | 2–80 characters |
| `email` | string | yes | valid email address |
| `message` | string | yes | 20–4000 characters |
| `startedAt` | number | yes | Unix timestamp (ms) when user began composing; must be ≥1500ms before submission |
| `company` | string | no | Honeypot field — must be empty or omitted |

## Example

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "message": "I'd love to discuss your work on neuroscience and storytelling.",
  "startedAt": 1700000000000
}
```

## Responses

| Status | Meaning |
|--------|---------|
| 200 | Message delivered successfully |
| 400 | Validation error (check field constraints) |
| 429 | Rate limited — try again later |
| 500 | Server error |

## Notes

- Do not populate the `company` field; it is a spam honeypot and a non-empty value will cause a 400 error.
- The `startedAt` timestamp prevents automated spam; set it to `Date.now()` before composing the message, not immediately before sending.
