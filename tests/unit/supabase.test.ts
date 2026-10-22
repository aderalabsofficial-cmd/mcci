import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAdminClient } from '@/lib/supabase/admin';
import { publicSupabaseEnv, requirePublicSupabaseEnv } from '@/lib/supabase/env';

afterEach(() => vi.unstubAllEnvs());

describe('supabase env guards', () => {
  it('reports no public env until both values are set', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    expect(publicSupabaseEnv()).toBeNull();
    expect(() => requirePublicSupabaseEnv()).toThrow(/must be set/);
  });

  it('refuses to build the service-role client without the server key', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    expect(() => createAdminClient()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('builds the service-role client when configured', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
    expect(createAdminClient().from).toBeTypeOf('function');
  });
});
