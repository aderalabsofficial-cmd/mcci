import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import { forwardedAuthHeaders } from '@/lib/net/client-ip';
import { IDLE_MS, SEEN_COOKIE } from '@/lib/session/idle';
import { publicSupabaseEnv } from './env';

/**
 * Refreshes the Supabase auth cookie on every request and reports whether a valid user is signed in (null when the
 * Supabase env vars are not set). Skipped until the env vars exist.
 *
 * Sign-out after 15 minutes without activity (owner's request, 26 Oct 2026): every page load and every saved action of
 * a signed-in person passes here and is recorded in an httpOnly cookie; when more than IDLE_MS has passed since the
 * last one, the session is signed out (its refresh token revoked) and the person goes to sign-in. Next.js's background
 * link prefetches are not activity. In the browser, components/shell/idle-guard.tsx counts typing and clicks.
 *
 * The cookie holds "<time>.<session id>" and only counts for that session: a new sign-in starts its own clock, and the
 * cookie is removed once nobody is signed in. (29 Oct 2026: the cookie used to outlive the session it belonged to, so
 * after an idle sign-out the next sign-in was signed straight out again until the browser's data was cleared.)
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
): Promise<{ response: NextResponse; userId: string | null; configured: boolean; expired: boolean }> {
  const env = publicSupabaseEnv();
  if (!env) return { response, userId: null, configured: false, expired: false };

  const supabase = createServerClient(process.env.SUPABASE_INTERNAL_URL || env.url, env.publishableKey, {
    global: { headers: forwardedAuthHeaders(request.headers) },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Do not put logic between client creation and getUser(): it is what refreshes the token.
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? null;
  if (!userId) {
    if (request.cookies.has(SEEN_COOKIE)) response.cookies.delete(SEEN_COOKIE);
    return { response, userId: null, configured: true, expired: false };
  }

  const now = Date.now();
  const session = sessionId((await supabase.auth.getSession()).data.session?.access_token);
  const [time, owner] = (request.cookies.get(SEEN_COOKIE)?.value ?? '').split('.');
  // the time of the last activity of THIS session; a cookie left by another session does not count
  const seen = owner === session ? Number(time) : 0;
  if (Number.isFinite(seen) && seen > 0 && now - seen > IDLE_MS) {
    // this session only: other devices keep their own sessions and their own clocks
    await supabase.auth.signOut({ scope: 'local' });
    response.cookies.delete(SEEN_COOKIE);
    return { response, userId: null, configured: true, expired: true };
  }
  const prefetch = request.headers.has('next-router-prefetch') || request.headers.get('purpose') === 'prefetch';
  if (!prefetch || !seen) {
    response.cookies.set(SEEN_COOKIE, `${now}.${session}`, {
      httpOnly: true,
      sameSite: 'lax',
      secure: request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:',
      path: '/',
      maxAge: 24 * 3600,
    });
  }
  return { response, userId, configured: true, expired: false };
}

/** the session id inside the (already verified) access token; '' if there is none */
function sessionId(token: string | undefined): string {
  try {
    const payload = JSON.parse(atob(token!.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))) as { session_id?: unknown };
    return typeof payload.session_id === 'string' ? payload.session_id : '';
  } catch {
    return '';
  }
}
