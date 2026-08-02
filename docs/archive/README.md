# docs/archive/

Files pulled out of a build path but kept in version control rather than
deleted. Nothing here is served — `docs/` is not part of the site build.

| File | Was | Why it moved |
| --- | --- | --- |
| `the_breakthrough_artifact.duplicate.html` | `src/pages/blog/the_breakthrough_artifact.html` | Byte-identical duplicate of `public/essays/the-breakthrough-artifact.html`, so the same document published at two URLs (`/blog/the_breakthrough_artifact/` and `/essays/the-breakthrough-artifact.html`). Only the `/essays/` one is linked — from the catalogue at `/writing/` — so that one is canonical. The old URL 301s to it via `public/_redirects`. Kept here because it is the historical `src/pages/` copy; the live content is the `/essays/` file, and that is the one to edit. |
