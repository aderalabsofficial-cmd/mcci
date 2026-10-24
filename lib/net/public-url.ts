/**
 * Behind the TLS proxy, Next.js knows only its own loopback address (`next start -H localhost -p 3200`), so absolute
 * redirects built from `request.url` (next-intl's locale redirects, the sign-in redirect in middleware.ts) would send
 * browsers to http://localhost:3200. When the request came through the proxy for the public host (nginx sets
 * X-Forwarded-Host to the host it served, and that equals APP_URL's host), a redirect to the server's own origin is
 * re-based on APP_URL. Everything else (local runs, other hosts, external redirects) is left as it is.
 *
 * Returns the new Location, or null when it should not change. Runs in the Edge runtime (middleware).
 */
export function publicLocation(
  location: string,
  requestUrl: string,
  forwardedHost: string | null,
  appUrl: string | undefined,
): string | null {
  if (!appUrl || !forwardedHost) return null;
  let app: URL;
  let target: URL;
  try {
    app = new URL(appUrl);
    target = new URL(location, requestUrl);
  } catch {
    return null;
  }
  if (forwardedHost.trim().toLowerCase() !== app.host) return null;
  // same host:port as the request (the scheme may differ: Next takes it from X-Forwarded-Proto)
  if (target.host !== new URL(requestUrl).host || target.origin === app.origin) return null;
  return new URL(target.pathname + target.search + target.hash, app.origin).toString();
}
