/**
 * Integration tests run ONLY against the local Supabase stack (docs/17 §8). They are skipped unless MCCI_IT_LOCAL=1,
 * and they refuse any URL that is not loopback. Keys come from the environment and are never printed.
 *
 *   MCCI_IT_LOCAL=1
 *   MCCI_IT_SUPABASE_URL      API_URL from `supabase status -o env`
 *   MCCI_IT_PUBLISHABLE_KEY   PUBLISHABLE_KEY from `supabase status -o env`
 *   MCCI_IT_SECRET_KEY        SECRET_KEY from `supabase status -o env` (creates and removes synthetic users)
 */
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

export interface LocalEnv {
  url: string;
  publishableKey: string;
  secretKey: string;
}

export function readLocalEnv(): LocalEnv | null {
  if (process.env.MCCI_IT_LOCAL !== '1') return null;
  const url = process.env.MCCI_IT_SUPABASE_URL ?? '';
  const publishableKey = process.env.MCCI_IT_PUBLISHABLE_KEY ?? '';
  const secretKey = process.env.MCCI_IT_SECRET_KEY ?? '';
  if (!url || !publishableKey || !secretKey) {
    throw new Error('MCCI_IT_LOCAL=1 needs MCCI_IT_SUPABASE_URL, MCCI_IT_PUBLISHABLE_KEY and MCCI_IT_SECRET_KEY');
  }
  const host = new URL(url).hostname;
  if (!LOOPBACK.has(host)) throw new Error(`integration tests run only against a local stack (got host ${host})`);
  if (!publishableKey.startsWith('sb_publishable_') || !secretKey.startsWith('sb_secret_')) {
    throw new Error('integration tests expect the local publishable and secret keys (sb_publishable_… / sb_secret_…)');
  }
  return { url, publishableKey, secretKey };
}
