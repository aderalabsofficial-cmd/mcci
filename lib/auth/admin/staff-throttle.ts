import 'server-only';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Attempt limits for the staff sign-in page (owner's request, 29 Oct 2026), counted before the password is tried:
 * 5 per staff email and 10 per visitor address in 15 minutes (api.rate_limit_take; the email is stored only as a hash).
 * STAFF_LOGIN_ATTEMPTS changes the per-email number (the address allows twice as many); the browser tests raise it.
 * Supabase Auth's own limits and the mandatory 2-step code come on top. Needs the secret-key client, as nobody is
 * signed in yet (allowed only under lib/auth/admin, eslint.config.mjs).
 */
export async function staffAttemptAllowed(email: string, clientIp: string | null): Promise<boolean> {
  const db = createAdminClient();
  const take = async (bucket: string, limit: number) => {
    const { data, error } = await db.schema('api').rpc('rate_limit_take', {
      p_bucket: bucket,
      p_limit: limit,
      p_window_seconds: 900,
    });
    if (error) throw new Error(`rate limit check failed: ${error.message}`);
    return data === true;
  };
  const n = Number(process.env.STAFF_LOGIN_ATTEMPTS);
  const perEmail = Number.isInteger(n) && n > 0 ? n : 5;
  const who = createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 32);
  return (
    (await take(`staff-login:ip:${clientIp ?? 'unknown'}`, perEmail * 2)) &&
    (await take(`staff-login:email:${who}`, perEmail))
  );
}
