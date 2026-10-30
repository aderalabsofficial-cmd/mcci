import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Ask MCCI AI per-person limits (api.rate_limit_take is service-role only): 10 questions per 10 minutes and 60 per
 * day. Called only after requireUser() has established who is asking.
 */
export async function takeAskQuota(userId: string): Promise<boolean> {
  const db = createAdminClient();
  for (const [bucket, limit, seconds] of [
    [`ask-ai:${userId}`, 10, 600],
    [`ask-ai-day:${userId}`, 60, 86_400],
  ] as const) {
    const { data, error } = await db
      .schema('api')
      .rpc('rate_limit_take', { p_bucket: bucket, p_limit: limit, p_window_seconds: seconds });
    if (error) throw new Error(`rate limit check failed: ${error.message}`);
    if (data !== true) return false;
  }
  return true;
}
