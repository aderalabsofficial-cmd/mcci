import type { Database } from './types';

/**
 * Columns the user-session clients (`client.ts` in the browser, `server.ts` with the user's cookies) cannot SELECT:
 * migration 0260 grants `authenticated` every `endorsements` column except these (signing evidence, docs/04).
 * The service-role client (`admin.ts`) keeps the full generated `Database` type and may read them.
 *
 * Keep in sync with supabase/tests/database/090_realtime_publication.test.sql, which pins the exact readable
 * `endorsements` column list: a grant change fails 090 first, then this list changes with it (docs/17 §4a).
 * tests/unit/client-types.test.ts checks the derived type against this list.
 */
export const RESTRICTED_CLIENT_COLUMNS = {
  endorsements: ['ip', 'user_agent'],
} as const;

type Restricted = { [T in keyof typeof RESTRICTED_CLIENT_COLUMNS]: (typeof RESTRICTED_CLIENT_COLUMNS)[T][number] };
type PublicTables = Database['public']['Tables'];

type ClientTables = {
  [T in keyof PublicTables]: T extends keyof Restricted
    ? Omit<PublicTables[T], 'Row'> & { Row: Omit<PublicTables[T]['Row'], Restricted[T]> }
    : PublicTables[T];
};

/** The generated `Database`, minus the columns user-session clients cannot read. Never edit `types.ts` by hand. */
export type ClientDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables'> & { Tables: ClientTables };
};

/** A row as a user-session client can read it, e.g. for typing Realtime payloads in the browser. */
export type ClientRow<T extends keyof ClientTables> = ClientTables[T]['Row'];
