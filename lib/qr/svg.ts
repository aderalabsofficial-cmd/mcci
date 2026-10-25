import 'server-only';
import QRCode from 'qrcode';

/**
 * QR codes for issued documents (docs/08 "QR & verification"): the code encodes the public verification link
 * `${VERIFY_BASE_URL or APP_URL/verify}/${code}`. Rendered as inline SVG on the server (prints sharp, no request).
 */
export function verifyUrl(code: string, env: NodeJS.ProcessEnv = process.env): string {
  const base = (env.VERIFY_BASE_URL || `${(env.APP_URL ?? '').replace(/\/+$/, '')}/verify`).replace(/\/+$/, '');
  return `${base}/${encodeURIComponent(code)}`;
}

export async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0b2a5b', light: '#0000' } });
}
