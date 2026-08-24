// ── Web Bot Auth signing (IETF draft-meunier-webbotauth-httpsig-protocol) ────
//
// Signs this site's own outbound automated requests (currently: the contact
// webhook delivery) with an RFC 9421 HTTP Message Signature, so the
// receiving service can verify the request actually originated from
// mazzeleczzare.com's infrastructure by fetching the public key from
// /.well-known/http-message-signatures-directory.
//
// PUBLIC_X and KEY_ID below are public (they're published in the JWKS at
// public/.well-known/http-message-signatures-directory) and are safe to
// hardcode. The private scalar (`d`) is the only secret; it's supplied at
// call time from the WEB_BOT_AUTH_PRIVATE_KEY env var (a Cloudflare Pages
// secret, never committed) and reconstituted into a full JWK here.

const SITE_ORIGIN = "https://mazzeleczzare.com";
const PUBLIC_X = "0AzxjDBCjGkobKyeoD9-pdILLCn2LBLefVsvCRKloW4";
const KEY_ID = "U5ShJHF6cxHtApznHP-x_P2wpUqEun1_8yvWMRLlwdU";
const SIGNATURE_LIFETIME_SECONDS = 300;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function randomNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64(bytes);
}

async function importPrivateKey(privateKeyD: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    { kty: "OKP", crv: "Ed25519", x: PUBLIC_X, d: privateKeyD, key_ops: ["sign"] },
    { name: "Ed25519" },
    false,
    ["sign"],
  );
}

/**
 * Adds Signature-Agent, Signature-Input, and Signature headers to `headers`
 * in place, signing the target request per the web-bot-auth protocol.
 */
export async function signOutboundRequest(
  targetUrl: string,
  headers: Headers,
  privateKeyD: string,
): Promise<void> {
  const authority = new URL(targetUrl).host.toLowerCase();
  const created = Math.floor(Date.now() / 1000);
  const expires = created + SIGNATURE_LIFETIME_SECONDS;
  const nonce = randomNonce();

  const signatureAgentValue = `"${SITE_ORIGIN}"`;
  const coveredComponents = `("@authority" "signature-agent";key="sig")`;
  const signatureParams =
    `${coveredComponents};created=${created};keyid="${KEY_ID}"` +
    `;alg="ed25519";expires=${expires};nonce="${nonce}";tag="web-bot-auth"`;

  const signatureBase =
    `"@authority": ${authority}\n` +
    `"signature-agent";key="sig": ${signatureAgentValue}\n` +
    `"@signature-params": ${signatureParams}`;

  const key = await importPrivateKey(privateKeyD);
  const signatureBytes = new Uint8Array(
    await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signatureBase)),
  );

  headers.set("Signature-Agent", `sig=${signatureAgentValue}`);
  headers.set("Signature-Input", `sig1=${signatureParams}`);
  headers.set("Signature", `sig1=:${toBase64(signatureBytes)}:`);
}
