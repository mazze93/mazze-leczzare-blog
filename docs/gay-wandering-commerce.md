# Gay Wandering commerce activation

The `/gay-wandering/` page is complete and defaults to a first-edition contact
link until checkout is activated. Production checkout uses Lemon Squeezy's hosted
overlay so payment, tax collection, fraud handling, receipts, and signed download
delivery do not become site infrastructure.

## Product

- **Name:** Gay Wandering — Reader No. 01
- **Type:** Single payment, pay what you want
- **Minimum:** $15 USD
- **Suggested:** $28 USD
- **Tax category:** Ebook
- **File:** `Gay-Wandering-Reader-No-01.zip`
- **Receipt button:** Return to the book nook
- **Receipt URL:** `https://mazzeleczzare.com/gay-wandering/`

The ZIP already contains the definitive offline HTML reader, archival PDF,
instructions, personal-use terms, release notes, and SHA-256 manifest.

## Site activation

Set this build-time environment variable in the Cloudflare Pages production and
preview environments:

```text
PUBLIC_GAY_WANDERING_CHECKOUT_URL=https://YOUR-STORE.lemonsqueezy.com/buy/YOUR-VARIANT
```

Rebuild the site. The page then changes both calls to action from the contact list
to Lemon Squeezy checkout buttons, loads the official overlay script, and adds the
live offer to the page's Book schema.

## Required end-to-end test

1. Purchase once with the product temporarily discounted to its lowest testable
   amount. Do not publish the launch announcement first.
2. Confirm checkout returns successfully and the receipt contains the ZIP.
3. Download and unzip the bundle on a second device.
4. Open `gay-wandering-reader.html` with networking disabled.
5. Run `shasum -a 256 -c MANIFEST.sha256` from inside the unzipped folder.
6. Restore the $15 minimum and $28 suggested price.
7. Confirm the production page shows “Get the complete reader,” not “Join the
   first-edition list.”

## Relationship after purchase

The receipt may invite the buyer to hear about Reader No. 02 and physical editions,
but enrollment must remain optional. Do not place a newsletter gate between payment
and the purchased files.
