import 'server-only';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Service-role steps of signing an endorsement (docs/04), used only after the endorser's own session has shown the
 * request is theirs (api.end_inbox under RLS):
 *  - the one-time code is issued to the server, never to the browser (api.end_code_issue is service-role only);
 *  - the signature image goes into the applicant's private file area, which the endorser cannot write to;
 *  - doc_hash = sha256 of the application's form particulars at signing time (evidence of what was endorsed).
 */

export async function issueCode(
  endorsementId: string,
  userId: string,
): Promise<{ code: string; email: string } | { error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .schema('api')
    .rpc('end_code_issue', { p_endorsement: endorsementId, p_user: userId });
  if (error)
    return { error: error.hint === 'too_soon' ? 'too_soon' : error.code === '42501' ? 'not_allowed' : 'failed' };
  const row = data?.[0];
  return row?.code && row.email ? { code: row.code, email: row.email } : { error: 'failed' };
}

/** stores the PNG under the applicant's application and returns its path and the form hash */
export async function storeSignature(
  endorsementId: string,
  png: Buffer,
): Promise<{ path: string; docHash: string } | null> {
  const admin = createAdminClient();
  const { data: e } = await admin
    .from('endorsements')
    .select('application_id, applications(company_id, form)')
    .eq('id', endorsementId)
    .maybeSingle();
  const app = e?.applications as unknown as { company_id: string; form: unknown } | null;
  if (!e || !app) return null;
  const path = `${app.company_id}/applications/${e.application_id}/endorsements/${endorsementId}.png`;
  const { error } = await admin.storage
    .from('application-docs')
    .upload(path, png, { contentType: 'image/png', upsert: true, cacheControl: '0' });
  if (error) return null;
  const docHash = createHash('sha256')
    .update(JSON.stringify(app.form ?? {}))
    .digest('hex');
  return { path, docHash };
}

export async function runEndorsementJobs() {
  const admin = createAdminClient();
  const { data, error } = await admin.schema('api').rpc('end_jobs');
  if (error) throw new Error(`end_jobs: ${error.message}`);
  return data ?? [];
}
