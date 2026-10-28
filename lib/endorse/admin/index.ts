import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/** the hourly endorsement job (expiry, reminders) with the service role (docs/04) */
export async function runEndorsementJobs() {
  const admin = createAdminClient();
  const { data, error } = await admin.schema('api').rpc('end_jobs');
  if (error) throw new Error(`end_jobs: ${error.message}`);
  return data ?? [];
}
