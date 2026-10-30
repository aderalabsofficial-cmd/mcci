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
    if (accounts.companyId) {
      await step('opportunity replies', () =>
        admin.from('opportunity_replies').delete().eq('company_id', accounts.companyId!),
      );
      await step('opportunities', () => admin.from('opportunities').delete().eq('company_id', accounts.companyId!));
    }
    // MCCI inquiries shared by the e2e Secretary General
    await step('shared inquiries', () => admin.from('opportunities').delete().like('title', `E2E ${accounts.run} %`));
    if (accounts.companyId)
      await step('change requests', () => admin.from('change_requests').delete().eq('company_id', accounts.companyId!));
    // a committee the tests assigned (it refers to the staff rows below)
    const staffIds = (['staff', 'sg', 'president', 'convener', 'itconv'] as const)
      .map((w) => accounts[w]?.id)
      .filter((x): x is string => !!x);
    // support tickets and event bookings of the tests (engagement.spec): they refer to the company and the accounts
    const people = [accounts.member?.id, ...staffIds].filter((x): x is string => !!x);
    await step('ticket messages', () => admin.from('ticket_messages').delete().in('by_user', people));
    if (accounts.companyId) {
      await step('tickets', () => admin.from('tickets').delete().eq('company_id', accounts.companyId!));
      await step('event bookings', () =>
        admin.from('event_registrations').delete().eq('company_id', accounts.companyId!),
      );
    }
    await step('tickets assigned', () => admin.from('tickets').update({ assigned_to: null }).in('assigned_to', people));
    if (accounts.companyId) await step('company', () => admin.from('companies').delete().eq('id', accounts.companyId!));
    if (staffIds.length) {
      await step('committee', () => admin.from('committee_assignments').delete().in('proposed_by', staffIds));
      await step('committee (convener)', () => admin.from('committee_assignments').delete().in('convener', staffIds));
    }
    for (const id of staffIds) await step(`staff ${id}`, () => admin.from('staff').delete().eq('user_id', id));
    // invitations sent by the tests (staff and company users), and staff rows of accepted test invitations
    await step('invitations', () => admin.from('invitations').delete().like('email', `e2e-${accounts.run}-%`));
    // the two accounts above plus any created by the tests themselves (registration): all e2e-<run>-…@test.local
    const ids = new Set([accounts.member?.id, ...staffIds].filter((x): x is string => !!x));
    const extra = await admin.from('profiles').select('id').like('email', `e2e-${accounts.run}-%@test.local`);
    if (extra.error) failures.push(`list e2e profiles: ${extra.error.message}`);
    for (const p of extra.data ?? []) ids.add(p.id);
    for (const id of ids) await step(`staff row ${id}`, () => admin.from('staff').delete().eq('user_id', id));
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
