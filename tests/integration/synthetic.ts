import { randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { must, type Db } from './fixtures';
import type { LocalEnv } from './local-env';

/**
 * Synthetic world for the Auth and Storage API suites (docs/17 §11 A1–A12, S1–S12). Every run uses fresh ids and
 * `it-<run>-…@test.local` addresses. Everything created is tracked and removed by `teardown()`, which attempts every
 * step, then checks that nothing is left and throws a list of failures (audit_log rows stay: append-only by design).
 */
export const noSession = { auth: { persistSession: false, autoRefreshToken: false } } as const;

export interface User {
  id: string;
  email: string;
  password: string; // random, never logged
  client: Db;
}

type Res = { error: { message: string } | null };

export class Synthetic {
  readonly run = randomUUID().slice(0, 8);
  readonly service: Db;
  readonly anon: Db;
  private users: string[] = [];
  private companies: string[] = [];
  private objects: { bucket: string; path: string }[] = [];

  constructor(readonly env: LocalEnv) {
    this.service = createClient<Database>(env.url, env.secretKey, noSession);
    this.anon = createClient<Database>(env.url, env.publishableKey, noSession);
  }

  email(label: string) {
    return `it-${this.run}-${label}@test.local`;
  }

  password() {
    return randomBytes(18).toString('base64url');
  }

  client(): Db {
    return createClient<Database>(this.env.url, this.env.publishableKey, noSession);
  }

  /** Records an Auth user created outside `user()` (e.g. by sign-up) so teardown removes it. */
  track(userId: string) {
    if (!this.users.includes(userId)) this.users.push(userId);
  }

  /** Creates an Auth user through the admin API; signs in unless the user is left unconfirmed. */
  async user(label: string, opts: { confirmed?: boolean; meta?: Record<string, unknown> } = {}): Promise<User> {
    const email = this.email(label);
    const password = this.password();
    const confirmed = opts.confirmed ?? true;
    const created = await this.service.auth.admin.createUser({
      email,
      password,
      email_confirm: confirmed,
      user_metadata: opts.meta ?? { full_name: label },
    });
    if (created.error) throw new Error(`create user ${label}: ${created.error.message}`);
    this.track(created.data.user.id);
    const client = this.client();
    if (confirmed) {
      const signedIn = await client.auth.signInWithPassword({ email, password });
      if (signedIn.error) throw new Error(`sign in ${label}: ${signedIn.error.message}`);
    }
    return { id: created.data.user.id, email, password, client };
  }

  async company(label: string, members: { user: User; role: Database['public']['Enums']['company_role'] }[]) {
    const id = randomUUID();
    must(
      await this.service.from('companies').insert({ id, name: `IT ${this.run} ${label}`, biz_type: 'pvt' }),
      'company',
    );
    this.companies.push(id);
    if (members.length) {
      must(
        await this.service
          .from('company_users')
          .insert(members.map((m) => ({ company_id: id, user_id: m.user.id, role: m.role }))),
        'company users',
      );
    }
    return id;
  }

  /** Makes `user` an active staff member with `designation` (teardown removes staff rows of tracked users). */
  async staff(user: User, designation: string) {
    must(await this.service.from('staff').insert({ user_id: user.id, designation }), 'staff');
  }

  async application(companyId: string, createdBy: User, stage: Database['public']['Enums']['app_stage']) {
    const id = randomUUID();
    must(
      await this.service.from('applications').insert({ id, company_id: companyId, created_by: createdBy.id, stage }),
      'application',
    );
    return id;
  }

  async voucher(companyId: string, refId: string, status: Database['public']['Enums']['voucher_status']) {
    const rows = must(
      await this.service
        .from('payment_vouchers')
        .insert({
          company_id: companyId,
          ref_type: 'membership',
          ref_id: refId,
          lines: [{ label: 'IT', amount: 100 }],
          amount: 100,
          status,
          due_at: new Date(Date.now() + 86_400_000).toISOString(),
        })
        .select('id'),
      'voucher',
    );
    return rows![0]!.id;
  }

  /** Records a Storage object so teardown removes it (with the service role, which bypasses RLS). */
  object(bucket: string, path: string) {
    this.objects.push({ bucket, path });
    return path;
  }

  async teardown() {
    const failures: string[] = [];
    const step = async (what: string, run: () => PromiseLike<Res>) => {
      try {
        const { error } = await run();
        if (error) failures.push(`${what}: ${error.message}`);
      } catch (e) {
        failures.push(`${what}: ${e instanceof Error ? e.message : String(e)}`);
      }
    };
    const none = async (
      what: string,
      run: () => PromiseLike<{ count: number | null; error: { message: string } | null }>,
    ) => {
      try {
        const { count, error } = await run();
        if (error) failures.push(`${what}: ${error.message}`);
        else if (count) failures.push(`${what}: ${count} row(s) left behind`);
      } catch (e) {
        failures.push(`${what}: ${e instanceof Error ? e.message : String(e)}`);
      }
    };
    const s = this.service;
    const byBucket = new Map<string, string[]>();
    for (const o of this.objects) byBucket.set(o.bucket, [...(byBucket.get(o.bucket) ?? []), o.path]);
    for (const [bucket, paths] of byBucket) await step(`objects ${bucket}`, () => s.storage.from(bucket).remove(paths));
    for (const [bucket, paths] of byBucket) {
      for (const path of paths) {
        const res = await s.storage.from(bucket).download(path);
        if (!res.error) failures.push(`object ${bucket}/${path} left behind`);
      }
    }

    const companies = this.companies;
    const users = this.users;
    await step('notifications', () => s.from('notifications').delete().in('company_id', companies));
    await step('payment vouchers', () => s.from('payment_vouchers').delete().in('company_id', companies));
    const apps = must(await s.from('applications').select('id').in('company_id', companies), 'list applications');
    const appIds = (apps ?? []).map((a) => a.id);
    await step('endorsements', () => s.from('endorsements').delete().in('application_id', appIds));
    await step('application snapshots', () =>
      s.from('application_form_snapshots').delete().in('application_id', appIds),
    );
    await step('application history', () => s.from('application_history').delete().in('application_id', appIds));
    await step('applications', () => s.from('applications').delete().in('company_id', companies));
    await step('members', () => s.from('members').delete().in('company_id', companies));
    await step('staff', () => s.from('staff').delete().in('user_id', users));
    await step('companies', () => s.from('companies').delete().in('id', companies));
    for (const id of users) {
      await step(`auth user ${id}`, async () => {
        const res = await s.auth.admin.deleteUser(id);
        // already removed by the test itself (A12) is fine
        return res.error && /not.?found/i.test(res.error.message) ? { error: null } : res;
      });
    }

    const head = { count: 'exact', head: true } as const;
    await none('companies', () => s.from('companies').select('id', head).in('id', companies));
    await none('applications', () => s.from('applications').select('id', head).in('company_id', companies));
    await none('payment vouchers', () => s.from('payment_vouchers').select('id', head).in('company_id', companies));
    await none('staff', () => s.from('staff').select('user_id', head).in('user_id', users));
    await none('profiles', () => s.from('profiles').select('id', head).in('id', users));
    await none('profiles by run', () => s.from('profiles').select('id', head).like('email', `it-${this.run}-%`));
    // per id, not listUsers: one malformed auth.users row elsewhere makes the whole list fail
    for (const id of users) {
      const res = await s.auth.admin.getUserById(id);
      if (!res.error) failures.push(`auth user ${id} left behind`);
      else if (res.error.status !== 404) failures.push(`check auth user ${id}: ${res.error.message}`);
    }
    if (failures.length) throw new Error(`teardown incomplete (${failures.length}): ${failures.join('; ')}`);
  }
}

/** Base64url payload of a JWT (no verification: only used to read claims of tokens the server just issued). */
export function jwtClaims(token: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as Record<string, unknown>;
}

/**
 * Optional SQL hook for cases that need time travel on synthetic rows (A5 aged session, A7 code expiry, S1 owner):
 * MCCI_IT_SQL_CMD is a command line that reads SQL on stdin and runs it on the target database as `postgres`, e.g.
 * `docker exec -i <db container> psql -X -U postgres -d postgres -At -v ON_ERROR_STOP=1` (or the same through ssh
 * for the staging stack). Without it those cases are skipped and reported as not run. Only fixed statements with
 * validated uuid / synthetic-email parameters are sent; no secret is ever passed.
 */
export type Sql = (statement: string) => string;

export function readSqlHook(): Sql | null {
  const cmd = process.env.MCCI_IT_SQL_CMD ?? '';
  if (!cmd) return null;
  return (statement: string) => {
    const res = spawnSync(cmd, { shell: true, input: statement, encoding: 'utf8', timeout: 30_000 });
    if (res.status !== 0) throw new Error(`SQL hook failed (exit ${res.status}): ${(res.stderr ?? '').slice(0, 300)}`);
    return res.stdout.trim();
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function uuidParam(v: string) {
  if (!UUID.test(v)) throw new Error('not a uuid');
  return `'${v}'::uuid`;
}

export { totp } from '../support/totp';
