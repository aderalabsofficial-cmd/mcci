import { randomUUID } from 'node:crypto';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildWorld, changed, type Db, type World } from './fixtures';
import { readLocalEnv } from './local-env';

/**
 * Realtime postgres_changes under RLS and column privileges (docs/17 §4a, migration 0260).
 * Positive: the right subscriber receives the change within 3 s (docs/04 acceptance test 1).
 * Negative: other tenants, deactivated staff, other roles and client-side filters receive nothing within 5 s.
 * Every negative case has a positive control in the same test, every write is checked to have changed a row, and
 * every listener is confirmed by Realtime, so silence cannot come from a failed write or a refused subscription.
 * Residual risks R-RT1 (anonymous metadata notices) and R-RT2 (DELETE ids to every subscriber) are pinned as
 * observed behaviour, not as requirements: if Realtime changes, the test fails and docs/17 §4a must be reviewed.
 * Requires migration 0260 applied to the local stack and MCCI_IT_LOCAL=1 (see local-env.ts).
 */
type Row = Record<string, unknown>;
type Event = RealtimePostgresChangesPayload<Row>;
interface SystemMessage {
  extension?: string;
  status?: string;
  message?: string;
}

const env = readLocalEnv();
const ARRIVE_MS = 3_000;
const QUIET_MS = 5_000;

// SUBSCRIBED only means the channel was joined. Changes are delivered once Realtime has registered the
// postgres_changes subscription in the database, which it reports with a `system` message; wait for that too, or a
// change written right after joining (e.g. while the tenant's replication starts) is silently missed. A refusal
// arrives the same way, with status `error`, and no CHANNEL_ERROR.
async function subscribe(client: Db, table: string, filter?: string) {
  const events: Event[] = [];
  const system = await new Promise<SystemMessage>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no postgres_changes confirmation for ${table}`)), 10_000);
    const channel = client
      .channel(`it-${table}-${randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) }, (p: Event) => {
        events.push(p);
      })
      .on('system', {}, (p: SystemMessage) => {
        if (p.extension === 'postgres_changes') {
          clearTimeout(timer);
          resolve(p);
        }
      });
    channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timer);
        reject(err ?? new Error(status));
      }
    });
  });
  return { events, system };
}

/** A confirmed subscription: fails unless Realtime reports the postgres_changes subscription as `ok`. */
async function listen(client: Db, table: string, filter?: string) {
  const { events, system } = await subscribe(client, table, filter);
  if (system.status !== 'ok')
    throw new Error(`subscription to ${table} not confirmed: ${system.message ?? system.status}`);
  return events;
}

const recordOf = (e: Event): Row => (e.new ?? {}) as Row;
const oldOf = (e: Event): Row => (e.old ?? {}) as Row;

async function waitFor(events: Event[], match: (e: Event) => boolean, ms = ARRIVE_MS) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    const hit = events.find(match);
    if (hit) return hit;
    await new Promise((r) => setTimeout(r, 100));
  }
  return undefined;
}

const quiet = () => new Promise((r) => setTimeout(r, QUIET_MS));

// Contract of realtime.apply_rls for a subscriber whose role cannot SELECT the table's primary key (anon on every
// published table): INSERT/UPDATE produce a notice with an error and no row content (R-RT1). Incidental fields
// (timestamps, column lists) are deliberately not pinned.
function expectMetadataOnly(events: Event[], secrets: string[]) {
  for (const e of events) {
    expect(Object.keys(recordOf(e)), 'no record').toHaveLength(0);
    expect(Object.keys(oldOf(e)), 'no old_record').toHaveLength(0);
    if (e.eventType !== 'DELETE') expect(e.errors ?? []).toContainEqual(expect.stringMatching(/401|Unauthorized/));
    const text = JSON.stringify(e);
    for (const s of secrets) expect(text, 'no identifiers or content').not.toContain(s);
  }
}

// Private channel join: authorised only by RLS policies on realtime.messages (no migration adds one).
function joinPrivate(client: Db, topic: string) {
  return new Promise<{ status: string; message?: string }>((resolve) => {
    const channel = client.channel(topic, { config: { private: true } });
    const done = (status: string, message?: string) => {
      clearTimeout(timer);
      void client.removeChannel(channel);
      resolve({ status, message });
    };
    const timer = setTimeout(() => done('NO_REPLY'), 10_000);
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') done(status, err?.message);
    });
  });
}

describe.skipIf(!env)('Realtime on the local stack (synthetic users, local only)', () => {
  let w: World;

  beforeAll(async () => {
    w = await buildWorld(env!);
  }, 60_000);

  afterAll(async () => {
    await w?.teardown();
  }, 60_000);

  const touchApplication = async (name: string) =>
    changed(
      await w.service.from('applications').update({ form: { name } }).eq('id', w.applicationA).select('id'),
      'update application',
    );

  it('applicant receives their own application change; another company nothing; anonymous metadata only', async () => {
    const own = await listen(w.ownerA.client, 'applications');
    const other = await listen(w.ownerB.client, 'applications');
    const anonymous = await listen(w.anon, 'applications');
    await touchApplication('RT change');

    expect(await waitFor(own, (e) => recordOf(e).id === w.applicationA)).toBeDefined();
    await quiet();
    expect(other.filter((e) => recordOf(e).company_id === w.companyA)).toHaveLength(0);
    expect(other).toHaveLength(0);
    expectMetadataOnly(anonymous, [w.applicationA, w.companyA, w.ownerA.id, 'RT change']);
  });

  it('staff with mem >= 1 receive application changes', async () => {
    const staff = await listen(w.officer.client, 'applications');
    await touchApplication('RT staff');
    expect(await waitFor(staff, (e) => recordOf(e).id === w.applicationA)).toBeDefined();
  });

  it('deactivated staff receive no application events (active staff, same designation, do)', async () => {
    const off = await listen(w.officerOff.client, 'applications');
    const on = await listen(w.officer.client, 'applications');
    await touchApplication('RT deactivated');
    expect(await waitFor(on, (e) => recordOf(e).id === w.applicationA)).toBeDefined();
    await quiet();
    expect(off).toHaveLength(0);
  });

  it('a client-side filter cannot widen access to another company', async () => {
    const widened = await listen(w.ownerB.client, 'applications', `company_id=eq.${w.companyA}`);
    const control = await listen(w.ownerA.client, 'applications', `company_id=eq.${w.companyA}`);
    await touchApplication('RT filter');
    expect(await waitFor(control, (e) => recordOf(e).id === w.applicationA)).toBeDefined();
    await quiet();
    expect(widened).toHaveLength(0);
  });

  it('a table outside supabase_realtime produces no change events, even for a reader with row access', async () => {
    const visible = await w.ownerA.client.from('companies').select('id').eq('id', w.companyA);
    expect(visible.data).toHaveLength(1); // RLS lets Owner A read the row, so silence is due to the publication
    const sub = await subscribe(w.ownerA.client, 'companies');
    const control = await listen(w.ownerA.client, 'applications');
    changed(
      await w.service
        .from('companies')
        .update({ name: `RT renamed ${randomUUID().slice(0, 8)}` })
        .eq('id', w.companyA)
        .select('id'),
      'rename company',
    );
    await touchApplication('RT unpublished control');
    expect(await waitFor(control, (e) => recordOf(e).id === w.applicationA)).toBeDefined();
    await quiet();
    expect(sub.system.status).toBe('error'); // Realtime refuses the subscription: "Unable to subscribe to changes …"
    expect(sub.events).toHaveLength(0);
  });

  it('a user notification reaches only that user', async () => {
    const a = await listen(w.ownerA.client, 'notifications');
    const b = await listen(w.ownerB.client, 'notifications');
    changed(
      await w.service
        .from('notifications')
        .insert({ user_id: w.ownerA.id, title: 'RT', body: 'personal' })
        .select('id'),
      'insert notification',
    );
    expect(await waitFor(a, (e) => recordOf(e).user_id === w.ownerA.id)).toBeDefined();
    await quiet();
    expect(b).toHaveLength(0);
  });

  it('a company payment notice reaches the Owner but not the Services user (pay = 0)', async () => {
    const owner = await listen(w.ownerA.client, 'notifications');
    const services = await listen(w.servicesA.client, 'notifications');
    changed(
      await w.service
        .from('notifications')
        .insert({ company_id: w.companyA, area: 'pay', title: 'RT', body: 'voucher due' })
        .select('id'),
      'insert company notification',
    );
    expect(await waitFor(owner, (e) => recordOf(e).area === 'pay')).toBeDefined();
    await quiet();
    expect(services.filter((e) => recordOf(e).area === 'pay')).toHaveLength(0);
  });

  it('delete events: owner, other companies and staff all receive the id only (R-RT2); anonymous an event with no row data or id', async () => {
    const id = randomUUID();
    const title = `RT secret title ${randomUUID().slice(0, 8)}`;
    changed(
      await w.service
        .from('notifications')
        .insert({ id, user_id: w.ownerA.id, title, body: 'RT secret body' })
        .select('id'),
      'insert notification',
    );
    const owner = await listen(w.ownerA.client, 'notifications');
    const outsider = await listen(w.ownerB.client, 'notifications');
    const staff = await listen(w.officer.client, 'notifications');
    const anonymous = await listen(w.anon, 'notifications');
    changed(await w.service.from('notifications').delete().eq('id', id).select('id'), 'delete notification');

    const isThisDelete = (e: Event) => e.eventType === 'DELETE' && oldOf(e).id === id;
    // Pinned observed behaviour: DELETE is not RLS-checked, so the id reaches every subscriber that may read the key
    for (const events of [owner, outsider, staff]) {
      const hit = await waitFor(events, isThisDelete);
      expect(hit, 'delete event with the id').toBeDefined();
      expect(oldOf(hit!)).toEqual({ id });
    }
    await quiet();
    const anonDeletes = anonymous.filter((e) => e.eventType === 'DELETE');
    expect(
      anonDeletes.length,
      'anonymous receives a delete event containing no row data or id (R-RT1)',
    ).toBeGreaterThan(0);
    for (const e of [...owner, ...outsider, ...staff, ...anonymous].filter((e) => e.eventType === 'DELETE')) {
      const text = JSON.stringify(e);
      expect(text).not.toContain(title);
      expect(text).not.toContain('RT secret body');
      expect(text).not.toContain(w.ownerA.id);
    }
    expectMetadataOnly(anonymous, [id, w.ownerA.id, title]);
  });

  it('endorser and applicant receive the endorsement change without the evidence columns', async () => {
    const endorser = await listen(w.ownerE.client, 'endorsements');
    const applicant = await listen(w.ownerA.client, 'endorsements');
    const outsider = await listen(w.ownerB.client, 'endorsements');
    changed(
      await w.service.from('endorsements').update({ reminders: 1 }).eq('id', w.endorsementA).select('id'),
      'update endorsement',
    );

    for (const events of [endorser, applicant]) {
      const hit = await waitFor(events, (e) => recordOf(e).id === w.endorsementA);
      expect(hit).toBeDefined();
      expect(recordOf(hit!)).toHaveProperty('status');
      expect(recordOf(hit!)).not.toHaveProperty('ip');
      expect(recordOf(hit!)).not.toHaveProperty('user_agent');
    }
    await quiet();
    expect(outsider).toHaveLength(0);
  });

  it('the endorser company receives no application rows (the applicant, as control, does)', async () => {
    const endorser = await listen(w.ownerE.client, 'applications');
    const control = await listen(w.ownerA.client, 'applications');
    await touchApplication('RT endorser');
    expect(await waitFor(control, (e) => recordOf(e).id === w.applicationA)).toBeDefined();
    await quiet();
    expect(endorser).toHaveLength(0);
  });

  it('payment vouchers reach users with pay access only', async () => {
    const owner = await listen(w.ownerA.client, 'payment_vouchers');
    const services = await listen(w.servicesA.client, 'payment_vouchers');
    changed(
      await w.service
        .from('payment_vouchers')
        .insert({
          company_id: w.companyA,
          ref_type: 'membership',
          ref_id: w.applicationA,
          lines: [{ label: 'RT', amount: 100 }],
          amount: 100,
          due_at: new Date(Date.now() + 86_400_000).toISOString(),
        })
        .select('id'),
      'insert voucher',
    );
    expect(await waitFor(owner, (e) => recordOf(e).company_id === w.companyA)).toBeDefined();
    await quiet();
    expect(services).toHaveLength(0);
  });

  // Scope: joining a private broadcast/presence channel only. Says nothing about postgres_changes notices (R-RT1).
  it('private broadcast channels reject unauthorised subscribers (realtime.messages has no policy)', async () => {
    for (const client of [w.anon, w.ownerA.client, w.officer.client]) {
      const joined = await joinPrivate(client, `company:${w.companyA}`);
      expect(joined.status).toBe('CHANNEL_ERROR');
      expect(joined.message).toMatch(/Unauthorized/);
    }
  });
});
