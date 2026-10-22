import { randomBytes, randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { LocalEnv } from './local-env';

/**
 * Synthetic, local-only world for Realtime tests. Every run uses fresh ids and @test.local addresses; teardown removes
 * the rows and the Auth users it created (audit_log rows remain: the log is append-only by design).
 */
export type Db = SupabaseClient<Database>;

export interface Persona {
  id: string;
  email: string;
  client: Db;
}

export interface World {
  service: Db;
  anon: Db;
  ownerA: Persona;
  servicesA: Persona;
  ownerB: Persona;
  ownerE: Persona;
  officer: Persona;
  companyA: string;
  companyB: string;
  companyE: string;
  memberE: string;
  applicationA: string;
  endorsementA: string;
  teardown: () => Promise<void>;
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false } } as const;

function must<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}

export async function buildWorld(env: LocalEnv): Promise<World> {
  const run = randomUUID().slice(0, 8);
  const service: Db = createClient<Database>(env.url, env.secretKey, noSession);
  const anon: Db = createClient<Database>(env.url, env.publishableKey, noSession);
  const createdUsers: string[] = [];

  async function persona(label: string): Promise<Persona> {
    const email = `rt-${run}-${label}@test.local`;
    const password = randomBytes(18).toString('base64url'); // never logged, discarded after sign-in
    const created = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: label },
    });
    if (created.error) throw new Error(`create user ${label}: ${created.error.message}`);
    const userId = created.data.user.id;
    createdUsers.push(userId);
    const client: Db = createClient<Database>(env.url, env.publishableKey, noSession);
    const signedIn = await client.auth.signInWithPassword({ email, password });
    if (signedIn.error) throw new Error(`sign in ${label}: ${signedIn.error.message}`);
    await client.realtime.setAuth(signedIn.data.session.access_token);
    return { id: userId, email, client };
  }

  const [ownerA, servicesA, ownerB, ownerE, officer] = [
    await persona('owner-a'),
    await persona('services-a'),
    await persona('owner-b'),
    await persona('owner-e'),
    await persona('officer'),
  ];

  const companyA = randomUUID();
  const companyB = randomUUID();
  const companyE = randomUUID();
  must(
    await service.from('companies').insert([
      { id: companyA, name: `RT ${run} A`, biz_type: 'pvt' },
      { id: companyB, name: `RT ${run} B`, biz_type: 'pvt' },
      { id: companyE, name: `RT ${run} E`, biz_type: 'pvt' },
    ]),
    'companies',
  );
  must(
    await service.from('company_users').insert([
      { company_id: companyA, user_id: ownerA.id, role: 'Owner' },
      { company_id: companyA, user_id: servicesA.id, role: 'Services' },
      { company_id: companyB, user_id: ownerB.id, role: 'Owner' },
      { company_id: companyE, user_id: ownerE.id, role: 'Owner' },
    ]),
    'company users',
  );
  must(await service.from('staff').insert({ user_id: officer.id, designation: 'Membership Officer' }), 'staff');

  const memberE = randomUUID();
  must(
    await service.from('members').insert({
      id: memberE,
      member_no: `MCCI-RT-${run}`,
      company_id: companyE,
      class: 'Corporate',
      status: 'Permanent',
      rep_name: `RT ${run} E`,
      since: '2020-04-01',
      valid_to: '2099-03-31',
    }),
    'member',
  );

  const applicationA = randomUUID();
  must(
    await service
      .from('applications')
      .insert({ id: applicationA, company_id: companyA, created_by: ownerA.id, stage: 'review' }),
    'application',
  );
  const endorsementA = randomUUID();
  must(
    await service.from('endorsements').insert({
      id: endorsementA,
      application_id: applicationA,
      role: 'proposer',
      endorser_member_id: memberE,
      expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      ip: '203.0.113.9', // TEST-NET-3 address: synthetic evidence that must never reach a client
      user_agent: 'rt-synthetic-agent',
    }),
    'endorsement',
  );

  async function teardown() {
    for (const p of [ownerA, servicesA, ownerB, ownerE, officer]) await p.client.removeAllChannels();
    await anon.removeAllChannels();
    await service.from('notifications').delete().in('company_id', [companyA, companyB, companyE]);
    await service.from('notifications').delete().in('user_id', createdUsers);
    await service.from('payment_vouchers').delete().in('company_id', [companyA, companyB]);
    await service.from('endorsements').delete().eq('id', endorsementA);
    await service.from('application_history').delete().eq('application_id', applicationA);
    await service.from('applications').delete().in('company_id', [companyA, companyB]);
    await service.from('members').delete().eq('id', memberE);
    await service.from('staff').delete().eq('user_id', officer.id);
    // company_users go with their company (cascade); deleting them first would trip the last-Owner guard (F-20)
    await service.from('companies').delete().in('id', [companyA, companyB, companyE]);
    for (const id of createdUsers) await service.auth.admin.deleteUser(id);
  }

  return {
    service,
    anon,
    ownerA,
    servicesA,
    ownerB,
    ownerE,
    officer,
    companyA,
    companyB,
    companyE,
    memberE,
    applicationA,
    endorsementA,
    teardown,
  };
}
