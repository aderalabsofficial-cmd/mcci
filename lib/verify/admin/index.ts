import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Public document verification (action verify.go, docs/08): a minimal projection through api.doc_verify (service
 * role only; counts the scan), behind a per-address rate limit. Used by /verify and /api/verify/[code].
 */
export interface Verified {
  code: string;
  title: string;
  kind: string;
  company: string | null;
  member_no: string | null;
  status: 'Valid' | 'Temporary' | 'Superseded' | 'Expired' | 'Revoked';
  valid_to: string | null;
  superseded_by: string | null;
  issued: string | null;
}

export type VerifyResult = { kind: 'found'; doc: Verified } | { kind: 'none' } | { kind: 'invalid' } | { kind: 'limited' };

export const CODE = /^MCCI-QR-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/;

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export async function verifyDocument(raw: string, clientKey: string): Promise<VerifyResult> {
  const code = normalizeCode(raw);
  if (!CODE.test(code)) return { kind: 'invalid' };
  const admin = createAdminClient();
  const { data: ok } = await admin
    .schema('api')
    .rpc('rate_limit_take', { p_bucket: `verify:${clientKey}`, p_limit: 30, p_window_seconds: 60 });
  if (ok === false) return { kind: 'limited' };
  const { data, error } = await admin.schema('api').rpc('doc_verify', { p_code: code });
  if (error) throw new Error(`verify: ${error.message}`);
  const row = data?.[0] as Verified | undefined;
  return row ? { kind: 'found', doc: row } : { kind: 'none' };
}
