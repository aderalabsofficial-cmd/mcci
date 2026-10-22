import { randomBytes, randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { LocalEnv } from './local-env';

/**
 * Synthetic, local-only world for Realtime tests. Every run uses fresh ids and @test.local addresses; teardown removes
 * the rows and the Auth users it created (audit_log rows remain: the log is append-only by design). If setup fails
 * part-way, everything created so far is removed before the error is rethrown.
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
  officerOff: Persona;
  companyA: string;
  companyB: string;
  companyE: string;
  memberE: string;
  applicationA: string;
  endorsementA: string;
  teardown: () => Promise<void>;
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false } } as const;

type Result<T> = { data: T; error: { message: string } | null };

export function must<T>(res: Result<T>, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}

/** A write that must have affected at least one row (append `.select('id')`): no error AND rows returned. */
export function changed<T>(res: Result<T[] | null>, what: string): T[] {
  const rows = must(res, what) ?? [];
  if (rows.length === 0) throw new Error(`${what}: no row was written`);
  return rows;
}

export async function buildWorld(env: LocalEnv): Promise<World> {
  const run = randomUUID().slice(0, 8);
  const service: Db = createClient<Database>(env.url, env.secretKey, noSession);
  const anon: Db = createClient<Database>(env.url, env.publishableKey, noSession);
  const personas: Persona[] = [];
  const createdUsers: string[] = [];
  const companyA = randomUUID();
  const companyB = randomUUID();
  const companyE = randomUUID();
  const memberE = randomUUID();
  const applicationA = randomUUID();
  const endorsementA = randomUUID();

  // Deletes only by the ids chosen above and the users this run created (`.in(col, [])` matches nothing), so it is
  // safe after a partial setup. Every step is attempted; any failure, and any row left behind, is reported.
  async function teardown() {
    const failures: string[] = [];
    async function step(what: string, run: () => PromiseLike<{ error: { message: string } | null }>) {
      try {
        const { error } = await run();
        if (error) failures.push(`${what}: ${error.message}`);
      } catch (e) {
        failures.push(`${what}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    async function none(
      what: string,
      run: () => PromiseLike<{ count: number | null; error: { message: string } | null }>,
    ) {
      try {
        const { count, error } = await run();
        if (error) failures.push(`${what}: ${error.message}`);
        else if (count) failures.push(`${what}: ${count} row(s) left behind`);
      } catch (e) {
        failures.push(`${what}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    const companies = [companyA, companyB, companyE];

    for (const c of [...personas.map((p) => p.client), anon]) {
      try {
        const results = await c.removeAllChannels();
        if (results.some((r) => r !== 'ok')) failures.push(`remove channels: ${results.join(', ')}`);
      } catch (e) {
        failures.push(`remove channels: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    await step('notifications (companies)', () => service.from('notifications').delete().in('company_id', companies));
    await step('notifications (users)', () => service.from('notifications').delete().in('user_id', createdUsers));
    await step('payment vouchers', () => service.from('payment_vouchers').delete().in('company_id', companies));
    await step('endorsement', () => service.from('endorsements').delete().eq('id', endorsementA));
    await step('application history', () =>
      service.from('application_history').delete().eq('application_id', applicationA),
    );
    await step('applications', () => service.from('applications').delete().in('company_id', companies));
    await step('member', () => service.from('members').delete().eq('id', memberE));
    await step('staff', () => service.from('staff').delete().in('user_id', createdUsers));
    // company_users go with their company (cascade); deleting them first would trip the last-Owner guard (F-20)
    await step('companies', () => service.from('companies').delete().in('id', companies));
    for (const id of createdUsers) await step(`auth user ${id}`, () => service.auth.admin.deleteUser(id));

    const head = { count: 'exact', head: true } as const;
    await none('companies', () => service.from('companies').select('id', head).in('id', companies));
    await none('company users', () =>
      service.from('company_users').select('user_id', head).in('company_id', companies),
    );
    await none('applications', () => service.from('applications').select('id', head).in('company_id', companies));
    await none('notifications', () => service.from('notifications').select('id', head).in('user_id', createdUsers));
    await none('payment vouchers', () =>
      service.from('payment_vouchers').select('id', head).in('company_id', companies),
    );
    await none('endorsement', () => service.from('endorsements').select('id', head).eq('id', endorsementA));
    await none('member', () => service.from('members').select('id', head).eq('id', memberE));
    await none('staff', () => service.from('staff').select('user_id', head).in('user_id', createdUsers));
    await none('profiles', () => service.from('profiles').select('id', head).in('id', createdUsers));

    if (failures.length) throw new Error(`teardown incomplete (${failures.length}): ${failures.join('; ')}`);
  }

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
    const p = { id: userId, email, client };
    personas.push(p);
    return p;
  }

  try {
    const ownerA = await persona('owner-a');
    const servicesA = await persona('services-a');
    const ownerB = await persona('owner-b');
    const ownerE = await persona('owner-e');
    const officer = await persona('officer');
    const officerOff = await persona('officer-off');

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
    // same designation, deactivated: private.staff_level() is 0 while staff.active is false (F-08)
    must(
      await service.from('staff').insert({
        user_id: officerOff.id,
        designation: 'Membership Officer',
        active: false,
        deactivated_at: new Date().toISOString(),
      }),
      'deactivated staff',
    );

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

    must(
      await service
        .from('applications')
        .insert({ id: applicationA, company_id: companyA, created_by: ownerA.id, stage: 'review' }),
      'application',
    );
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

    return {
      service,
      anon,
      ownerA,
      servicesA,
      ownerB,
      ownerE,
      officer,
      officerOff,
      companyA,
      companyB,
      companyE,
      memberE,
      applicationA,
      endorsementA,
      teardown,
    };
  } catch (setupError) {
    try {
      await teardown();
    } catch (cleanupError) {
      throw new AggregateError([setupError, cleanupError], 'setup failed and cleanup was incomplete');
    }
    throw setupError;
  }
}
