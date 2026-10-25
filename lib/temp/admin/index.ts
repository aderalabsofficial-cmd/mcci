import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/** Scheduled jobs (docs/07 temp-alerts, temp-expire, vouchers), service role only, called by /api/cron/daily. */
export interface TempJobRow {
  kind: string;
  member_no: string;
  expires_at: string;
  email: string | null;
  full_name: string | null;
}

export async function runTempJobs(): Promise<TempJobRow[]> {
  const { data, error } = await createAdminClient().schema('api').rpc('temp_jobs');
  if (error) throw new Error(`temp_jobs: ${error.message}`);
  return (data ?? []) as TempJobRow[];
}

export async function runVoucherJobs(): Promise<number> {
  const { data, error } = await createAdminClient().schema('api').rpc('voucher_jobs');
  if (error) throw new Error(`voucher_jobs: ${error.message}`);
  return Number(data ?? 0);
}
