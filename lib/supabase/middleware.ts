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
  if (!userId) return { response, userId: null, configured: true, expired: false };

  const now = Date.now();
  const seen = Number(request.cookies.get(SEEN_COOKIE)?.value);
  if (Number.isFinite(seen) && seen > 0 && now - seen > IDLE_MS) {
    // this session only: other devices keep their own sessions and their own clocks
    await supabase.auth.signOut({ scope: 'local' });
    response.cookies.delete(SEEN_COOKIE);
    return { response, userId: null, configured: true, expired: true };
  }
  const prefetch = request.headers.has('next-router-prefetch') || request.headers.get('purpose') === 'prefetch';
  if (!prefetch || !seen) {
    response.cookies.set(SEEN_COOKIE, String(now), {
      httpOnly: true,
      sameSite: 'lax',
      secure: request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:',
      path: '/',
      maxAge: 24 * 3600,
    });
  }
  return { response, userId, configured: true, expired: false };
}
