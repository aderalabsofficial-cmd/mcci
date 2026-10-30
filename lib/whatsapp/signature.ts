import { createHmac, timingSafeEqual } from 'node:crypto';

/** Signed events (IQPigeon: HMAC-SHA256 of `timestamp.body`, hex) and signed media links. Pure, used by route handlers. */
export const WEBHOOK_MAX_AGE_SECONDS = 300;

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function signWebhook(secret: string, timestamp: string, body: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

/** a replayed old event fails on its age even with a valid signature */
export function verifyWebhookSignature(
  secret: string,
  timestamp: string | null,
  body: string,
  signature: string | null,
  nowSeconds = Date.now() / 1000,
): boolean {
  if (!secret || !timestamp || !signature || !/^[0-9]{9,11}$/.test(timestamp)) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > WEBHOOK_MAX_AGE_SECONDS) return false;
  const given = signature.includes('=') ? (signature.split('=', 2)[1] ?? '') : signature;
  return same(signWebhook(secret, timestamp, body), given);
}

/** the link Meta fetches a file from: one attachment, expires, and says nothing about the file */
export function signMedia(secret: string, id: string, expires: number): string {
  return createHmac('sha256', `media:${secret}`).update(`${id}.${expires}`).digest('hex');
}

export function verifyMedia(
  secret: string,
  id: string,
  expires: string | null,
  sig: string | null,
  nowSeconds = Date.now() / 1000,
): boolean {
  if (!secret || !expires || !sig || !/^[0-9]{9,11}$/.test(expires) || Number(expires) < nowSeconds) return false;
  return same(signMedia(secret, id, Number(expires)), sig);
}
