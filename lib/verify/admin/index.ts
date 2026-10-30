import 'server-only';
import { createHash } from 'node:crypto';
import { checkSignature, type SignatureCheck } from '@/lib/qr/sign';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Public membership verification (owner, 30 Oct 2026; migration 0520, docs/26): by certificate reference — from a
 * signed QR link or typed — or by membership number. Minimal answer (api.public_verify_*), never a member or company
 * row. A QR link whose signature does not match is refused before the database is asked. Per-address rate limits
 * (references 30 / min; membership numbers 10 / min and 60 / hour, against enumeration); every check is logged with a
 * hash of the address, never the address.
 */
export interface PublicVerification {
  business_name: string;
  member_no: string | null;
  category: 'Manufacturing' | 'Non-manufacturing' | null;
  class: 'Corporate' | 'Associate' | null;
  member_status: 'Active' | 'Temporary' | 'Expired' | 'Suspended' | 'Revoked' | null;
  member_since: string | null;
  valid_to: string | null;
  certificate_status: 'Valid' | 'Superseded' | 'Expired' | 'Revoked' | 'Temporary' | null;
  certificate_ref: string | null;
  replaced_by: string | null;
  checked_on: string;
}

export type VerifyResult =
  | { kind: 'found'; v: PublicVerification; signature: SignatureCheck }
  | { kind: 'none' }
  | { kind: 'invalid' }
  | { kind: 'tampered' }
  | { kind: 'limited' };

export const CODE = /^MCCI-QR-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/;
export const MEMBER_NO = /^[A-Z0-9][A-Z0-9-]{1,29}$/;

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

/** the address as a short one-way hash (with a server-side secret), for the abuse log */
function clientHash(client: string): string {
  return createHash('sha256')
    .update(`${process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'mcci'}:verify:${client}`)
    .digest('hex')
    .slice(0, 24);
}

async function take(bucket: string, limit: number, seconds: number): Promise<boolean> {
  const { data } = await createAdminClient()
    .schema('api')
    .rpc('rate_limit_take', { p_bucket: bucket, p_limit: limit, p_window_seconds: seconds });
  return data !== false;
}

async function log(channel: 'qr' | 'code' | 'member', outcome: 'invalid' | 'tampered' | 'limited', who: string) {
  await createAdminClient()
    .schema('api')
    .rpc('public_verify_log', { p_channel: channel, p_outcome: outcome, p_client: who });
}

/** a certificate reference, with the QR link's signature when there is one */
export async function verifyByReference(raw: string, signature: string | null, client: string): Promise<VerifyResult> {
  const code = normalizeCode(raw);
  const channel = signature ? 'qr' : 'code';
  const who = clientHash(client);
  if (!CODE.test(code)) {
    await log(channel, 'invalid', who);
    return { kind: 'invalid' };
  }
  const sig = checkSignature(code, signature);
  if (sig === 'invalid') {
    await log(channel, 'tampered', who);
    return { kind: 'tampered' };
  }
  if (!(await take(`verify:${who}`, 30, 60))) {
    await log(channel, 'limited', who);
    return { kind: 'limited' };
  }
  const { data, error } = await createAdminClient()
    .schema('api')
    .rpc('public_verify_code', { p_code: code, p_channel: channel, p_client: who });
  if (error) throw new Error(`verify: ${error.message}`);
  const row = data?.[0] as PublicVerification | undefined;
  return row ? { kind: 'found', v: row, signature: sig } : { kind: 'none' };
}

/** a membership number: same minimal answer, tighter limits (numbers are sequential, so enumeration is guarded) */
export async function verifyByMember(raw: string, client: string): Promise<VerifyResult> {
  const no = raw.trim().toUpperCase().replace(/\s+/g, '');
  const who = clientHash(client);
  if (!MEMBER_NO.test(no)) {
    await log('member', 'invalid', who);
    return { kind: 'invalid' };
  }
  if (!(await take(`verify-member:${who}`, 10, 60)) || !(await take(`verify-member-h:${who}`, 60, 3600))) {
    await log('member', 'limited', who);
    return { kind: 'limited' };
  }
  const { data, error } = await createAdminClient()
    .schema('api')
    .rpc('public_verify_member', { p_no: no, p_client: who });
  if (error) throw new Error(`verify: ${error.message}`);
  const row = data?.[0] as PublicVerification | undefined;
  return row ? { kind: 'found', v: row, signature: 'absent' } : { kind: 'none' };
}
