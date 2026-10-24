const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

/** Strict single-address check that also runs in the Edge runtime (middleware), where `node:net` is unavailable. */
export function isIpAddress(value: string): boolean {
  if (IPV4.test(value)) return true;
  if (!value.includes(':') || !/^[0-9a-fA-F:.]+$/.test(value)) return false;
  try {
    return new URL(`http://[${value}]/`).hostname.length > 2;
  } catch {
    return false;
  }
}

/**
 * The visitor's address, for Auth's per-IP rate limits (docs/18 F1, D-M22). Auth keys its limits on `X-Real-IP`
 * (GOTRUE_RATE_LIMIT_HEADER); when the Next.js server calls Auth for a visitor it must pass the visitor's address,
 * not its own — otherwise every user shares one bucket, or the limits do not apply at all.
 *
 * A forwarded header is only as trustworthy as whatever set it. It is used ONLY when the deployment declares that a
 * proxy overwrites it (`TRUST_PROXY_CLIENT_IP=1`; nginx `proxy_set_header X-Real-IP $remote_addr`, the app bound
 * to loopback). Otherwise nothing is forwarded, so a client talking to the app directly cannot choose its own key.
 * The value must be a single, valid IP address (no lists, no ports).
 */
export function trustedClientIp(headers: Headers, env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.TRUST_PROXY_CLIENT_IP !== '1') return null;
  const name = (env.CLIENT_IP_HEADER || 'x-real-ip').toLowerCase();
  const value = headers.get(name)?.trim() ?? '';
  return value && isIpAddress(value) ? value : null;
}

/** Extra headers for Supabase requests made on behalf of this visitor. */
export function forwardedAuthHeaders(headers: Headers, env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const ip = trustedClientIp(headers, env);
  return ip ? { 'X-Real-IP': ip } : {};
}
