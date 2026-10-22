/** Public Supabase settings. Null while the project has no .env.local (e.g. M0, CI without a database). */
export function publicSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

export function requirePublicSupabaseEnv(): { url: string; anonKey: string } {
  const env = publicSupabaseEnv();
  if (!env)
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set (see .env.example).');
  return env;
}
