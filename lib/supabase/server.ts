import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { forwardedAuthHeaders } from '@/lib/net/client-ip';
import { requirePublicSupabaseEnv } from './env';
import { serverSupabaseUrl } from './server-env';
import type { ClientDatabase } from './client-types';

/**
 * Default client everywhere on the server: bound to the user's cookie session, so row-level security applies.
 * It has the user's column privileges too, hence `ClientDatabase`; only `admin.ts` is typed with the full schema.
 * Requests carry the visitor's trusted address (lib/net/client-ip.ts) so Auth rate-limits the visitor, not the app.
 */
export async function createClient() {
  const { publishableKey } = requirePublicSupabaseEnv();
  const cookieStore = await cookies();
  const extra = forwardedAuthHeaders(await headers());
  return createServerClient<ClientDatabase>(serverSupabaseUrl(), publishableKey, {
    global: { headers: extra },
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
