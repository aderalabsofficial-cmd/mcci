/**
 * Public Supabase settings (safe in the browser). Null while the project has no .env.local (e.g. CI without a
 * database). Keys are Supabase's publishable/secret keys (`sb_publishable_…` / `sb_secret_…`, docs/17 §11); the
 * legacy anon/service-role JWTs are never used by the app.
 */
export function publicSupabaseEnv(): { url: string; publishableKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && publishableKey ? { url, publishableKey } : null;
}

export function requirePublicSupabaseEnv(): { url: string; publishableKey: string } {
  const env = publicSupabaseEnv();
  if (!env)
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set (see .env.example).',
    );
  return env;
}
