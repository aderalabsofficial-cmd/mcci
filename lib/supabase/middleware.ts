import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import { publicSupabaseEnv } from './env';

/** Refreshes the Supabase auth cookie on every request. Skipped until the env vars exist. */
export async function updateSession(request: NextRequest, response: NextResponse): Promise<NextResponse> {
  const env = publicSupabaseEnv();
  if (!env) return response;

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Do not put logic between client creation and getUser(): it is what refreshes the token.
  await supabase.auth.getUser();
  return response;
}
