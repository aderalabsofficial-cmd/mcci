import 'server-only';
import QRCode from 'qrcode';
import { signReference } from './sign';

/**
 * QR codes for issued documents (docs/08 "QR & verification", docs/26): the code encodes the public verification link
 * `${VERIFY_BASE_URL or APP_URL/verify}/${code}?s=<Ed25519 signature>` (lib/qr/sign.ts; no signature when no key is
 * configured). Rendered as inline SVG on the server (prints sharp, no request).
 */
export function verifyUrl(code: string, env: NodeJS.ProcessEnv = process.env): string {
  const base = verifyBase(env);
  if (!code) return `${base}/`;
  const sig = signReference(code, env);
  return `${base}/${encodeURIComponent(code)}${sig ? `?s=${sig}` : ''}`;
}

/**
 * Where the public verification page lives. VERIFY_BASE_URL may name the page itself (https://host/verify) or only the
 * site (https://host — as production had it, which made QR links point at https://host/<code>, a 404): a bare site
 * address gets /verify added. Without it, APP_URL + /verify.
 */
export function verifyBase(env: NodeJS.ProcessEnv = process.env): string {
  const raw = (env.VERIFY_BASE_URL || env.APP_URL || '').trim().replace(/\/+$/, '');
  try {
    const u = new URL(raw);
    if (u.pathname === '/' || u.pathname === '') return `${u.origin}/verify`;
    return raw;
  } catch {
    return `${raw}/verify`;
  }
}

export async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#0b2a5b', light: '#0000' },
  });
}
