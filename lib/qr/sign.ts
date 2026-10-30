import { createPrivateKey, createPublicKey, type KeyObject, sign, verify } from 'node:crypto';

/**
 * Signed certificate QR links (owner, 30 Oct 2026; docs/26). Every QR carries the certificate's random reference
 * (MCCI-QR-XXXXX-XXXXX, ~50 bits) and an Ed25519 signature over "MCCI-VERIFY:v1:<reference>" made with a key that
 * exists only on the server (QR_SIGNING_KEY, PKCS#8 PEM — never in the repository, the browser or the QR itself).
 *
 * The verification page checks the signature first: a made-up or altered link is refused without touching the
 * database. The signature only proves the link was made by MCCI; whether the certificate is still valid always comes
 * from the database (current status, revoked, replaced, expired) — so a copied QR can never make an old certificate look
 * valid. A reference typed by hand (no signature) is still looked up, behind the same rate limit, and shown as
 * "checked by reference". Without a key configured, links carry no signature and everything works by reference.
 */
const DOMAIN = 'MCCI-VERIFY:v1:';
const SIG = /^[A-Za-z0-9_-]{86}$/; // 64-byte Ed25519 signature, base64url without padding

function readKey(pem: string | undefined): KeyObject | null {
  const text = pem?.trim();
  if (!text) return null;
  try {
    // accepts the PEM itself or the PEM base64-encoded on one line (for env files)
    const body = text.startsWith('-----') ? text : Buffer.from(text, 'base64').toString('utf8');
    return createPrivateKey(body.replace(/\\n/g, '\n'));
  } catch {
    return null;
  }
}

let cached: { pem: string | undefined; key: KeyObject | null } | null = null;
function signingKey(env: NodeJS.ProcessEnv = process.env): KeyObject | null {
  if (!cached || cached.pem !== env.QR_SIGNING_KEY)
    cached = { pem: env.QR_SIGNING_KEY, key: readKey(env.QR_SIGNING_KEY) };
  return cached.key;
}

/** the signature for a reference, or null when no key is configured */
export function signReference(reference: string, env: NodeJS.ProcessEnv = process.env): string | null {
  const key = signingKey(env);
  if (!key) return null;
  return sign(null, Buffer.from(DOMAIN + reference), key).toString('base64url');
}

export type SignatureCheck = 'valid' | 'invalid' | 'absent' | 'unconfigured';

/** checks a link's signature for its reference; malformed or wrong signatures are 'invalid' */
export function checkSignature(
  reference: string,
  signature: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): SignatureCheck {
  if (!signature) return 'absent';
  const key = signingKey(env);
  if (!key) return 'unconfigured';
  if (!SIG.test(signature)) return 'invalid';
  try {
    return verify(null, Buffer.from(DOMAIN + reference), createPublicKey(key), Buffer.from(signature, 'base64url'))
      ? 'valid'
      : 'invalid';
  } catch {
    return 'invalid';
  }
}
