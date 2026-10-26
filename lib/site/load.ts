import 'server-only';
import { cache } from 'react';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { createClient } from '@/lib/supabase/server';

/** Public reference data for the website (readable by visitors under RLS): the seven services, the site settings. */

export interface ServiceType {
  key: string;
  name_en: string;
  name_ur: string | null;
  full_name_en: string | null;
  fee: number;
  docs: string[];
  fields: string[];
  sla_hours: number;
}

export const loadServices = cache(async (): Promise<ServiceType[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_types')
    .select('key, name_en, name_ur, full_name_en, fee, docs, fields, sla_hours')
    .eq('active', true)
    .order('sort');
  if (error) throw new Error(`service_types: ${error.message}`);
  return (data ?? []) as unknown as ServiceType[];
});

/** the launch moment for the Urdu countdown (settings.site.launchAt, migration 0370); null when not set */
export const loadLaunchAt = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from('public_settings').select('value').eq('key', 'site').maybeSingle();
  const at = (data?.value as { launchAt?: string } | null)?.launchAt;
  return at && !Number.isNaN(Date.parse(at)) ? at : null;
});

export interface PublicPost {
  id: string;
  slug: string | null;
  category: string | null;
  title: string;
  title_ur: string | null;
  body: string;
  body_ur: string | null;
  published_at: string | null;
}

export const loadPosts = cache(async (limit = 30): Promise<PublicPost[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, category, title, title_ur, body, body_ur, published_at')
    .eq('status', 'Live')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(`posts: ${error.message}`);
  return (data ?? []) as PublicPost[];
});

export interface PublicEvent {
  id: string;
  title: string;
  title_ur: string | null;
  type: string | null;
  starts_at: string;
  venue: string | null;
  seats: number | null;
  body: string | null;
  body_ur: string | null;
}

export const loadEvents = cache(async (): Promise<PublicEvent[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('id, title, title_ur, type, starts_at, venue, seats, body, body_ur')
    .eq('published', true)
    .gte('starts_at', new Date(Date.now() - 31 * 86400_000).toISOString())
    .order('starts_at');
  if (error) throw new Error(`events: ${error.message}`);
  return (data ?? []) as PublicEvent[];
});

const CATEGORIES = ['News', 'Notice', 'Circular', 'Event'];
/** a post's category in the reader's language (as written when MCCI uses another one) */
export const postCategory = (c: string, locale: Locale) => (CATEGORIES.includes(c) ? msg(locale, `site.news.categories.${c}`) : c);
