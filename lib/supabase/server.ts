import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requirePublicSupabaseEnv } from './env';
import type { ClientDatabase } from './client-types';

/**
 * Default client everywhere on the server: bound to the user's cookie session, so row-level security applies.
 * It has the user's column privileges too, hence `ClientDatabase`; only `admin.ts` is typed with the full schema.
 */
export async function createClient() {
  const { url, anonKey } = requirePublicSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient<ClientDatabase>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only there; the middleware refreshes the session.
        }
      },
    },
  });
}
