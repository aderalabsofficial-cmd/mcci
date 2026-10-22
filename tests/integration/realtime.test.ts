import { randomUUID } from 'node:crypto';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildWorld, type Db, type World } from './fixtures';
import { readLocalEnv } from './local-env';

/**
 * Realtime postgres_changes under RLS and column privileges (docs/17 §4a, migration 0260).
 * Positive: the right subscriber receives the change within 3 s (docs/04 acceptance test 1).
 * Negative: other tenants, anonymous clients, other roles and client-side filters receive nothing within 5 s.
 * Requires migration 0260 applied to the local stack and MCCI_IT_LOCAL=1 (see local-env.ts).
 */
type Row = Record<string, unknown>;
type Event = RealtimePostgresChangesPayload<Row>;

const env = readLocalEnv();
const ARRIVE_MS = 3_000;
const QUIET_MS = 5_000;

async function listen(client: Db, table: string, filter?: string) {
  const events: Event[] = [];
  const channel = client
    .channel(`it-${table}-${randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) }, (p: Event) => {
      events.push(p);
    });
  await new Promise<void>((resolve, reject) => {
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') resolve();
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(err ?? new Error(status));
    });
  });
  return events;
}

const recordOf = (e: Event): Row => ('new' in e ? (e.new as Row) : {});

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

describe.skipIf(!env)('Realtime on the local stack (synthetic users, local only)', () => {
  let w: World;

  beforeAll(async () => {
    w = await buildWorld(env!);
  }, 60_000);

  afterAll(async () => {
    await w?.teardown();
  }, 60_000);

  it('applicant receives their own application change; another company and anonymous receive nothing', async () => {
    const own = await listen(w.ownerA.client, 'applications');
    const other = await listen(w.ownerB.client, 'applications');
    const anonymous = await listen(w.anon, 'applications');
    await w.service
      .from('applications')
      .update({ form: { name: 'RT change' } })
      .eq('id', w.applicationA);

    expect(await waitFor(own, (e) => recordOf(e).id === w.applicationA)).toBeDefined();
    await quiet();
    expect(other.filter((e) => recordOf(e).company_id === w.companyA)).toHaveLength(0);
    expect(anonymous).toHaveLength(0);
  });

  it('staff with mem >= 1 receive application changes', async () => {
    const staff = await listen(w.officer.client, 'applications');
    await w.service
      .from('applications')
      .update({ form: { name: 'RT staff' } })
      .eq('id', w.applicationA);
    expect(await waitFor(staff, (e) => recordOf(e).id === w.applicationA)).toBeDefined();
  });

  it('a client-side filter cannot widen access to another company', async () => {
    const widened = await listen(w.ownerB.client, 'applications', `company_id=eq.${w.companyA}`);
    await w.service
      .from('applications')
      .update({ form: { name: 'RT filter' } })
      .eq('id', w.applicationA);
    await quiet();
    expect(widened).toHaveLength(0);
  });

  it('a user notification reaches only that user', async () => {
    const a = await listen(w.ownerA.client, 'notifications');
    const b = await listen(w.ownerB.client, 'notifications');
    await w.service.from('notifications').insert({ user_id: w.ownerA.id, title: 'RT', body: 'personal' });
    expect(await waitFor(a, (e) => recordOf(e).user_id === w.ownerA.id)).toBeDefined();
    await quiet();
    expect(b).toHaveLength(0);
  });

  it('a company payment notice reaches the Owner but not the Services user (pay = 0)', async () => {
    const owner = await listen(w.ownerA.client, 'notifications');
    const services = await listen(w.servicesA.client, 'notifications');
    await w.service
      .from('notifications')
      .insert({ company_id: w.companyA, area: 'pay', title: 'RT', body: 'voucher due' });
    expect(await waitFor(owner, (e) => recordOf(e).area === 'pay')).toBeDefined();
    await quiet();
    expect(services.filter((e) => recordOf(e).area === 'pay')).toHaveLength(0);
  });

  it('endorser and applicant receive the endorsement change without the evidence columns', async () => {
    const endorser = await listen(w.ownerE.client, 'endorsements');
    const applicant = await listen(w.ownerA.client, 'endorsements');
    const outsider = await listen(w.ownerB.client, 'endorsements');
    await w.service.from('endorsements').update({ reminders: 1 }).eq('id', w.endorsementA);

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

  it('the endorser company receives no application rows', async () => {
    const endorser = await listen(w.ownerE.client, 'applications');
    await w.service
      .from('applications')
      .update({ form: { name: 'RT endorser' } })
      .eq('id', w.applicationA);
    await quiet();
    expect(endorser).toHaveLength(0);
  });

  it('payment vouchers reach users with pay access only', async () => {
    const owner = await listen(w.ownerA.client, 'payment_vouchers');
    const services = await listen(w.servicesA.client, 'payment_vouchers');
    await w.service.from('payment_vouchers').insert({
      company_id: w.companyA,
      ref_type: 'membership',
      ref_id: w.applicationA,
      lines: [{ label: 'RT', amount: 100 }],
      amount: 100,
      due_at: new Date(Date.now() + 86_400_000).toISOString(),
    });
    expect(await waitFor(owner, (e) => recordOf(e).company_id === w.companyA)).toBeDefined();
    await quiet();
    expect(services).toHaveLength(0);
  });
});
