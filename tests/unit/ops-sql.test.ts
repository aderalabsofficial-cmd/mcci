import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * supabase/ops/*.sql are run by hand on the self-hosted stack (deploy/selfhost/README.md §3a). They must stay in step
 * with the migrations and the seed they refer to.
 */
// The reconciliation covers exactly the 17 migrations applied by hand on staging (psql-file, 23 Oct 2026, up to and
// including 20261023000260). Every later migration is applied with the Supabase CLI and recorded by it.
const LAST_HAND_APPLIED = '20261023000260';
const migrations = readdirSync('supabase/migrations')
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => {
    const m = /^(\d{14})_(.+)\.sql$/.exec(f)!;
    return { version: m[1]!, name: m[2]! };
  })
  .filter((m) => m.version <= LAST_HAND_APPLIED);

describe('supabase/ops/record-applied-migrations.sql', () => {
  const sql = readFileSync('supabase/ops/record-applied-migrations.sql', 'utf8');

  it('records exactly the hand-applied migrations, with the names the CLI derives from the file names', () => {
    expect(migrations).toHaveLength(17);
    const recorded = [...sql.matchAll(/^\s+\('(\d{14})', '([a-z0-9_]+)', null\)/gm)].map((m) => ({
      version: m[1]!,
      name: m[2]!,
    }));
    expect(recorded).toEqual(migrations);
  });

  it('checks an object of every recorded migration before recording anything, in one transaction', () => {
    for (const { version } of migrations) expect(sql).toContain(`missing := missing || '${version}'::text;`);
    expect(sql.indexOf('raise exception')).toBeLessThan(sql.indexOf('insert into supabase_migrations'));
    expect(sql).toMatch(/^begin;$/m);
    expect(sql).toMatch(/^commit;$/m);
    expect(sql).toMatch(/on conflict \(version\) do nothing;/);
  });
});

describe('supabase/ops/remove-test-seed.sql', () => {
  const sql = readFileSync('supabase/ops/remove-test-seed.sql', 'utf8');
  const seed = readFileSync('supabase/seed.sql', 'utf8');

  it('targets exactly the seed personas (id and @test.local email) and no other user', () => {
    const fromSeed = [...seed.matchAll(/'([0-9a-f-]{36})', 'authenticated', 'authenticated', '([^']+@test\.local)'/g)]
      .map((m) => `${m[1]} ${m[2]}`)
      .sort();
    const targeted = [...sql.matchAll(/^\s+\('([0-9a-f-]{36})', '([^']+@test\.local)'\)/gm)]
      .map((m) => `${m[1]} ${m[2]}`)
      .sort();
    expect(fromSeed).toHaveLength(16);
    expect(targeted).toEqual(fromSeed);
    // auth users are deleted only where id AND email still match the seed
    expect(sql).toMatch(
      /delete from auth\.users where id in \(select s\.id from _seed_users s join auth\.users u on u\.id = s\.id and u\.email = s\.email\)/,
    );
  });

  it('refuses before deleting anything, and deletes companies before users (last-Owner guard)', () => {
    expect(sql.indexOf("raise exception 'not removing the test seed")).toBeLessThan(sql.indexOf('delete from'));
    expect(sql.indexOf('delete from public.companies')).toBeLessThan(sql.indexOf('delete from auth.users'));
    expect(sql).not.toMatch(/delete from public\.audit_log|truncate/i);
  });
});
