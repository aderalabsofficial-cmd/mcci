import { writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { must, type Db } from './fixtures';
import { readLocalEnv } from './local-env';
import { Synthetic, type User } from './synthetic';

/**
 * Realtime soak (docs/17 §4a, supabase/realtime#2289): Realtime restarts its database connection every 10 minutes
 * and, without upstream's workaround (`REGION: us-east-1`, docker-compose.mcci.yml), changes written during the few
 * seconds of reconnection are not delivered. This test keeps one confirmed subscription open for
 * MCCI_IT_SOAK_MINUTES (≥ 25 covers at least two reconnect cycles), writes one personal notification every
 * SOAK_EVERY_MS and requires every one to arrive. It refreshes the session before the access token expires.
 * Skipped unless MCCI_IT_SOAK_MINUTES is set; never part of the normal integration run. A JSON summary (counts,
 * gaps, channel states; no tokens) is written to MCCI_IT_SOAK_REPORT when set.
 */
const env = readLocalEnv();
const minutes = Number(process.env.MCCI_IT_SOAK_MINUTES ?? '0');
const SOAK_EVERY_MS = 3_000;
const REFRESH_EVERY_MS = 20 * 60_000;
const ARRIVE_MS = 3_000;

type Event = RealtimePostgresChangesPayload<Record<string, unknown>>;
let w: Synthetic;
let user: User;
// The report is (re)written as soon as anything is known, so a run that dies early still leaves evidence.
const report: Record<string, unknown> = { minutes, completed: false };
const writeReport = () => {
  if (process.env.MCCI_IT_SOAK_REPORT) writeFileSync(process.env.MCCI_IT_SOAK_REPORT, JSON.stringify(report, null, 2));
};

beforeAll(async () => {
  if (!env || !minutes) return;
  w = new Synthetic(env);
  user = await w.user('soak');
  report.run = w.run;
  writeReport();
}, 60_000);

afterAll(async () => {
  if (!w) return;
  try {
    await user?.client.removeAllChannels();
    const del = must(
      await w.service.from('notifications').delete().eq('user_id', user.id).select('id'),
      'delete soak notifications',
    );
    await w.teardown();
    report.cleanup = { notificationsDeleted: del?.length ?? 0, teardown: 'ok, nothing left behind' };
  } catch (e) {
    report.cleanup = { teardown: `FAILED: ${e instanceof Error ? e.message : String(e)}` };
    throw e;
  } finally {
    report.cleanupAt = new Date().toISOString();
    writeReport();
  }
}, 120_000);

async function subscribe(client: Db, states: { at: number; status: string }[], received: Map<string, number>) {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('no postgres_changes confirmation')), 15_000);
    client
      .channel(`soak-${randomUUID()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (p: Event) => {
        const title = (p.new as { title?: string }).title ?? '';
        if (!received.has(title)) received.set(title, Date.now());
      })
      .on('system', {}, (p: { extension?: string; status?: string; message?: string }) => {
        states.push({ at: Date.now(), status: `system:${p.extension ?? '-'}:${p.status ?? '-'}` });
        if (p.extension === 'postgres_changes') {
          clearTimeout(timer);
          if (p.status === 'ok') resolve();
          else reject(new Error(`subscription refused: ${p.message ?? p.status}`));
        }
      })
      .subscribe((status) => states.push({ at: Date.now(), status }));
  });
}

describe.skipIf(!env || !minutes)('Realtime soak (reconnect cycles)', () => {
  it(
    `delivers every change over ${minutes} minutes`,
    async () => {
      const states: { at: number; status: string }[] = [];
      const received = new Map<string, number>();
      const sent: { title: string; at: number }[] = [];
      await subscribe(user.client, states, received);

      const start = Date.now();
      report.startedAt = new Date(start).toISOString();
      writeReport();
      let lastRefresh = start;
      let seq = 0;
      while (Date.now() - start < minutes * 60_000) {
        if (Date.now() - lastRefresh > REFRESH_EVERY_MS) {
          const refreshed = await user.client.auth.refreshSession();
          if (refreshed.error) throw new Error(`refresh: ${refreshed.error.message}`);
          await user.client.realtime.setAuth(refreshed.data.session!.access_token);
          lastRefresh = Date.now();
          states.push({ at: lastRefresh, status: 'token-refreshed' });
        }
        const title = `soak-${w.run}-${String(++seq).padStart(5, '0')}`;
        const at = Date.now();
        must(
          await w.service.from('notifications').insert({ user_id: user.id, title, body: 'soak' }).select('id'),
          'insert',
        );
        sent.push({ title, at });
        await new Promise((r) => setTimeout(r, SOAK_EVERY_MS));
      }
      await new Promise((r) => setTimeout(r, ARRIVE_MS));

      const missed = sent.filter((s) => !received.has(s.title));
      const late = sent.filter((s) => received.has(s.title) && received.get(s.title)! - s.at > ARRIVE_MS);
      const latencies = sent.filter((s) => received.has(s.title)).map((s) => received.get(s.title)! - s.at);
      const summary = {
        endedAt: new Date().toISOString(),
        durationMinutes: +((Date.now() - start) / 60_000).toFixed(2),
        completed: Date.now() - start >= minutes * 60_000,
        sent: sent.length,
        received: sent.length - missed.length,
        missed: missed.map((m) => ({ seq: m.title.slice(-5), atMinute: +((m.at - start) / 60_000).toFixed(2) })),
        lateOver3s: late.length,
        maxLatencyMs: Math.max(0, ...latencies),
        states: states.map((s) => ({ atMinute: +((s.at - start) / 60_000).toFixed(2), status: s.status })),
      };
      Object.assign(report, summary, { result: missed.length === 0 ? 'PASS' : 'FAIL (changes missed)' });
      writeReport();
      console.log(
        `soak: sent ${summary.sent}, missed ${missed.length}, late ${late.length}, max ${summary.maxLatencyMs} ms`,
      );
      expect(missed).toEqual([]);
    },
    (minutes + 5) * 60_000,
  );
});
