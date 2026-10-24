import 'server-only';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Identifier } from '../identifier';

/**
 * Resolves a member ID or mobile number to the account email for PASSWORD sign-in, before anyone is signed in — so
 * it needs the secret-key client (allowed only under lib/auth/admin, eslint.config.mjs). The email never leaves the
 * server: the caller passes it straight to Supabase Auth. "No match", "ambiguous" and "throttled" all return null,
 * and the caller shows one generic message, so the response does not tell which member IDs or numbers exist.
 *
 *   member ID → the company's single active Owner (several Owners or none: no match)
 *   mobile    → the single profile with that normalised number (none or several: no match)
 * Throttled per visitor address (30 per 5 min) and per identifier (10 per 5 min) with api.rate_limit_take.
 */
export async function resolveLoginEmail(id: Identifier, clientIp: string | null): Promise<string | null> {
  if (id.kind === 'email') return id.value;
  if (id.kind === 'invalid') return null;

  const db = createAdminClient();
  const take = async (bucket: string, limit: number) => {
    const { data, error } = await db.schema('api').rpc('rate_limit_take', {
      p_bucket: bucket,
      p_limit: limit,
      p_window_seconds: 300,
    });
    if (error) throw new Error(`rate limit check failed: ${error.message}`);
    return data === true;
  };
  const idHash = createHash('sha256').update(`${id.kind}:${id.value}`).digest('hex').slice(0, 32);
  if (!(await take(`login-resolve:ip:${clientIp ?? 'unknown'}`, 30))) return null;
  if (!(await take(`login-resolve:id:${idHash}`, 10))) return null;

  if (id.kind === 'member') {
    const member = await db.from('members').select('company_id').eq('member_no', id.value).maybeSingle();
    if (member.error || !member.data) return null;
    const owners = await db
      .from('company_users')
      .select('user_id')
      .eq('company_id', member.data.company_id)
      .eq('role', 'Owner')
      .eq('status', 'Active')
      .limit(2);
    if (owners.error || owners.data.length !== 1) return null;
    const profile = await db.from('profiles').select('email').eq('id', owners.data[0]!.user_id).maybeSingle();
    return profile.data?.email ?? null;
  }

  const profiles = await db.from('profiles').select('email').eq('mobile', id.value).limit(2);
  if (profiles.error || profiles.data.length !== 1) return null;
  return profiles.data[0]!.email;
}
