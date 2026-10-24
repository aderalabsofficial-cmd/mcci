import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAdminClient } from '@/lib/supabase/admin';
import { publicSupabaseEnv, requirePublicSupabaseEnv } from '@/lib/supabase/env';
import { serverSupabaseUrl } from '@/lib/supabase/server-env';

afterEach(() => vi.unstubAllEnvs());

describe('supabase env guards', () => {
  it('reports no public env until both the URL and the publishable key are set', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
    expect(publicSupabaseEnv()).toBeNull();
    expect(() => requirePublicSupabaseEnv()).toThrow(/must be set/);
  });

  it('ignores the legacy anon key name (publishable/secret keys only, docs/17 §11)', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'legacy');
    expect(publicSupabaseEnv()).toBeNull();
  });

  it('refuses to build the secret-key client without the server key', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x');
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    expect(() => createAdminClient()).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it('builds the secret-key client when configured', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_x');
    expect(createAdminClient().from).toBeTypeOf('function');
  });

  it('the server reaches Supabase through SUPABASE_INTERNAL_URL when set, else the public URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://mcci.example');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x');
    vi.stubEnv('SUPABASE_INTERNAL_URL', '');
    expect(serverSupabaseUrl()).toBe('https://mcci.example');
    vi.stubEnv('SUPABASE_INTERNAL_URL', 'http://127.0.0.1:18000');
    expect(serverSupabaseUrl()).toBe('http://127.0.0.1:18000');
  });
});
