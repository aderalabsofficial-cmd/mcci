import 'server-only';
import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Public website data (migration 0370, M2), read on the server with the service role: the functions are not callable
 * by visitors, and none returns names, contacts or documents. Track and contact sit behind a per-address limit.
 */

export interface SiteStats {
  members: number;
  temporary: number;
  converted: number;
  services_issued: number;
  services_open: number;
  applications_open: number;
}

export interface FeedRow {
  kind: string;
  token: string;
  status: string;
  at: string | null;
}

export interface Tracked {
  kind: string;
  token: string;
  status: string;
  submitted_at: string | null;
  decided_at: string | null;
  due_at: string | null;
  printing: boolean;
}

export const TOKEN = /^MCCI-\d{4}-(M-)?\d{4,6}$/;

const EMPTY: SiteStats = { members: 0, temporary: 0, converted: 0, services_issued: 0, services_open: 0, applications_open: 0 };

export const siteStats = cache(async (): Promise<SiteStats> => {
  const { data, error } = await createAdminClient().schema('api').rpc('site_stats');
  if (error) {
    console.error('site.stats failed', error.code);
    return EMPTY;
  }
  return (data?.[0] as SiteStats | undefined) ?? EMPTY;
});

export const siteFeed = cache(async (limit = 8): Promise<FeedRow[]> => {
  const { data, error } = await createAdminClient().schema('api').rpc('site_feed', { p_limit: limit });
  if (error) {
    console.error('site.feed failed', error.code);
    return [];
  }
  return (data ?? []) as FeedRow[];
});

async function allowed(bucket: string, limit: number, seconds: number): Promise<boolean> {
  const { data } = await createAdminClient()
    .schema('api')
    .rpc('rate_limit_take', { p_bucket: bucket, p_limit: limit, p_window_seconds: seconds });
  return data !== false;
}

export type TrackResult = { kind: 'found'; row: Tracked } | { kind: 'none' } | { kind: 'invalid' } | { kind: 'limited' };

/** track.go: one token, stage and dates only; 30 lookups a minute per address */
export async function trackToken(raw: string, clientKey: string): Promise<TrackResult> {
  const token = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (!TOKEN.test(token)) return { kind: 'invalid' };
  if (!(await allowed(`track:${clientKey}`, 30, 60))) return { kind: 'limited' };
  const { data, error } = await createAdminClient().schema('api').rpc('site_track', { p_token: token });
  if (error) throw new Error(`track: ${error.message}`);
  const row = data?.[0] as Tracked | undefined;
  return row ? { kind: 'found', row } : { kind: 'none' };
}

export interface ContactInput {
  kind: 'contact' | 'complaint';
  name: string;
  contact: string;
  subject: string;
  ref: string;
  category: string;
  body: string;
}

/** contact.send: a ticket; 5 an hour per address */
export async function createTicket(input: ContactInput, clientKey: string): Promise<{ ticket: string; ref: string } | 'limited'> {
  if (!(await allowed(`contact:${clientKey}`, 5, 3600))) return 'limited';
  const { data, error } = await createAdminClient().schema('api').rpc('site_contact', {
    p_kind: input.kind,
    p_name: input.name,
    p_contact: input.contact,
    p_subject: input.subject,
    p_ref: input.ref,
    p_category: input.category,
    p_body: input.body,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('contact: no ticket');
  return { ticket: row.ticket, ref: row.public_ref };
}
