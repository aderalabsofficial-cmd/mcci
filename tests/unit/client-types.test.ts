import { readFileSync } from 'node:fs';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { createAdminClient } from '@/lib/supabase/admin';
import type { createClient as createBrowserClient } from '@/lib/supabase/client';
import { RESTRICTED_CLIENT_COLUMNS, type ClientDatabase, type ClientRow } from '@/lib/supabase/client-types';
import type { createClient as createServerClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

/**
 * The expectTypeOf assertions are checked by `pnpm typecheck` (tsc includes tests/unit); at runtime they are no-ops.
 * The last test ties RESTRICTED_CLIENT_COLUMNS to the database: generated columns minus the columns pinned as
 * client-readable in supabase/tests/database/090_realtime_publication.test.sql.
 */
type FullRow = Database['public']['Tables']['endorsements']['Row'];
type BrowserClient = ReturnType<typeof createBrowserClient>;
type ServerClient = Awaited<ReturnType<typeof createServerClient>>;
type AdminClient = ReturnType<typeof createAdminClient>;
type Data<Q> = Q extends PromiseLike<{ data: infer D }> ? NonNullable<D> : never;

// Never called: only its inferred return type is inspected.
function _selections(browser: BrowserClient, server: ServerClient, admin: AdminClient) {
  return {
    browserNamed: browser.from('endorsements').select('id, status').single(),
    browserIp: browser.from('endorsements').select('ip').single(),
    browserUserAgent: browser.from('endorsements').select('user_agent').single(),
    browserMixed: browser.from('endorsements').select('id, ip').single(),
    browserEmbeddedIp: browser.from('applications').select('id, endorsements(ip)').single(),
    browserStar: browser.from('endorsements').select('*').single(),
    serverIp: server.from('endorsements').select('ip').single(),
    adminIp: admin.from('endorsements').select('id, ip, user_agent').single(),
  };
}
type S = ReturnType<typeof _selections>;
type QueryError = { error: true };

describe('client-side restricted-column types', () => {
  it('ClientRow<endorsements> has exactly the generated columns minus ip and user_agent', () => {
    expectTypeOf<ClientRow<'endorsements'>>().not.toHaveProperty('ip');
    expectTypeOf<ClientRow<'endorsements'>>().not.toHaveProperty('user_agent');
    expectTypeOf<keyof ClientRow<'endorsements'>>().toEqualTypeOf<Exclude<keyof FullRow, 'ip' | 'user_agent'>>();
    expectTypeOf<ClientRow<'endorsements'>['status']>().toEqualTypeOf<FullRow['status']>();
  });

  it('other tables and schemas are unchanged', () => {
    expectTypeOf<ClientRow<'applications'>>().toEqualTypeOf<Database['public']['Tables']['applications']['Row']>();
    expectTypeOf<ClientDatabase['api']>().toEqualTypeOf<Database['api']>();
    expectTypeOf<ClientDatabase['public']['Views']>().toEqualTypeOf<Database['public']['Views']>();
  });

  it('the generated Database type still describes the full table (trusted server access)', () => {
    expectTypeOf<FullRow>().toHaveProperty('ip');
    expectTypeOf<FullRow>().toHaveProperty('user_agent');
  });

  it('user-session clients get a query error type for the evidence columns; named columns still work', () => {
    expectTypeOf<Data<S['browserNamed']>>().toEqualTypeOf<{ id: string; status: FullRow['status'] }>();
    // postgrest-js does not reject the .select() call itself: the result becomes a SelectQueryError, so any use of
    // the data fails to compile. not.toBeNever() keeps toExtend from passing vacuously.
    expectTypeOf<Data<S['browserIp']>>().not.toBeNever();
    expectTypeOf<Data<S['browserIp']>>().toExtend<QueryError>();
    expectTypeOf<Data<S['browserUserAgent']>>().not.toBeNever();
    expectTypeOf<Data<S['browserUserAgent']>>().toExtend<QueryError>();
    expectTypeOf<Data<S['browserMixed']>>().not.toBeNever();
    expectTypeOf<Data<S['browserMixed']>>().toExtend<QueryError>();
    expectTypeOf<Data<S['serverIp']>>().not.toBeNever();
    expectTypeOf<Data<S['serverIp']>>().toExtend<QueryError>();
    expectTypeOf<Data<S['browserEmbeddedIp']>['endorsements'][number]>().not.toBeNever();
    expectTypeOf<Data<S['browserEmbeddedIp']>['endorsements'][number]>().toExtend<QueryError>();
  });

  it("select('*') is typed without the evidence columns (it still fails at runtime: ESLint rule, see eslint test)", () => {
    expectTypeOf<keyof Data<S['browserStar']>>().toEqualTypeOf<keyof ClientRow<'endorsements'>>();
  });

  it('the service-role client can still select the evidence columns', () => {
    expectTypeOf<Data<S['adminIp']>>().toEqualTypeOf<{
      id: string;
      ip: FullRow['ip'];
      user_agent: FullRow['user_agent'];
    }>();
  });

  it('RESTRICTED_CLIENT_COLUMNS = generated endorsements columns − columns 090 pins as client-readable', () => {
    const generated = readFileSync('lib/supabase/types.ts', 'utf8');
    const table = generated.slice(generated.search(/"?endorsements"?: \{/));
    const row = table.slice(table.indexOf('Row: {') + 'Row: {'.length, table.indexOf('}', table.indexOf('Row: {')));
    const generatedColumns = [...row.matchAll(/"?([a-z_]+)"?\??:/g)].map((m) => m[1]);

    const pgtap = readFileSync('supabase/tests/database/090_realtime_publication.test.sql', 'utf8');
    const pinned = pgtap.slice(
      pgtap.indexOf("has_column_privilege('authenticated', 'public.endorsements', a.attname"),
      pgtap.indexOf("'endorsements: clients read exactly the non-evidence columns'"),
    );
    const readable = [...pinned.matchAll(/\('([a-z_]+)'\)/g)].map((m) => m[1]);

    expect(generatedColumns.length).toBeGreaterThan(readable.length);
    expect(readable).toContain('status');
    const notReadable = generatedColumns.filter((c) => !readable.includes(c)).sort();
    expect(notReadable).toEqual([...RESTRICTED_CLIENT_COLUMNS.endorsements].sort());
  });
});
