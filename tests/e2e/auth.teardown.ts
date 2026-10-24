import { rmSync } from 'node:fs';
import { expect, test as teardown } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { AUTH_DIR, readAccounts } from './accounts';

/** Removes the synthetic e2e accounts and their company (company_users go with it), then the session files. */
teardown('remove e2e accounts', async () => {
  const accounts = readAccounts();
  const env = readLocalEnv();
  if (accounts.backend && env) {
    const admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const failures: string[] = [];
    const step = async (what: string, run: () => PromiseLike<{ error: { message: string } | null }>) => {
      const { error } = await run();
      if (error && !/not.?found/i.test(error.message)) failures.push(`${what}: ${error.message}`);
    };
    if (accounts.memberRowId)
      await step('member', () => admin.from('members').delete().eq('id', accounts.memberRowId!));
    if (accounts.companyId) await step('company', () => admin.from('companies').delete().eq('id', accounts.companyId!));
    if (accounts.staff?.id) await step('staff', () => admin.from('staff').delete().eq('user_id', accounts.staff!.id));
    // the two accounts above plus any created by the tests themselves (registration): all e2e-<run>-…@test.local
    const ids = new Set([accounts.member?.id, accounts.staff?.id].filter((x): x is string => !!x));
    const extra = await admin.from('profiles').select('id').like('email', `e2e-${accounts.run}-%@test.local`);
    if (extra.error) failures.push(`list e2e profiles: ${extra.error.message}`);
    for (const p of extra.data ?? []) ids.add(p.id);
    for (const id of ids) await step(`auth user ${id}`, () => admin.auth.admin.deleteUser(id));
    const left = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .like('email', `e2e-${accounts.run}-%`);
    if (left.count) failures.push(`${left.count} e2e profile(s) left behind`);
    expect(failures).toEqual([]);
  }
  rmSync(AUTH_DIR, { recursive: true, force: true });
});
