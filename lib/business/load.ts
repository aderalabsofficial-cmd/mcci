import 'server-only';
import type { Filter } from '@/lib/business/filters';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';

/** Directory reads through the person's own session: api.biz_* check the module level in the database. */
export interface DirectoryRow {
  member_id: string;
  company_id: string;
  business_name: string;
  member_no: string;
  member_class: string;
  member_status: string;
  business_category: string;
  nature: string | null;
  registration: string;
  city: string | null;
  district: string | null;
  valid_to: string;
  rep_name: string;
  whatsapp_available: boolean;
  consent: string;
  opted_out: boolean;
  incomplete: boolean;
  tag_names: string[];
}
export interface Facets {
  nature: string[];
  sector: string[];
  city: string[];
  district: string[];
  tags: { id: string; name: string }[];
  campaigns: { id: string; name: string }[];
}
export interface DuplicateGroup {
  why: 'name' | 'ntn' | 'phone';
  rows: { member_id: string; member_no: string; business_name: string }[];
}
export interface BusinessProfile extends DirectoryRow {
  sector: string | null;
  member_since: string;
  official: {
    nature_items: string[] | null;
    established: string | null;
    sales_tax: boolean;
    web: string | null;
    particulars: string | null;
  };
  can_see_contacts: boolean;
  contacts: { address: string | null; tel: string | null; email: string | null } | null;
  whatsapp: { name: string | null; phone: string; language: string | null } | null;
  outreach: { city: string | null; district: string | null; notes: string | null; updated_at: string } | null;
  tags: { id: string; name: string }[];
  memberships: { member_no: string; class: string; status: string; since: string; valid_to: string }[];
  history: {
    at: string;
    reason: string | null;
    old_status: string | null;
    new_status: string | null;
    action: string;
  }[];
  consents:
    { status: string; method: string; evidence: string | null; recorded_at: string; current_number: boolean }[] | null;
  suppression: { reason: string; source: string; created_at: string } | null;
}

export async function searchDirectory(
  filter: Filter,
  q: string,
  sort: string,
  dir: string,
  page: number,
  size: number,
) {
  const db = await createClient();
  const { data, error } = await db.schema('api').rpc('biz_search', {
    p_def: filter as unknown as Json,
    p_q: q,
    p_sort: sort,
    p_dir: dir,
    p_page: page,
    p_size: size,
  });
  if (error) throw new Error(`directory: ${error.message}`);
  return data as unknown as { total: number; rows: DirectoryRow[] };
}

export async function loadFacets(): Promise<Facets> {
  const db = await createClient();
  const [{ data, error }, { data: campaigns }] = await Promise.all([
    db.schema('api').rpc('biz_facets'),
    db.schema('api').rpc('wa_campaign_options'),
  ]);
  if (error) throw new Error(`facets: ${error.message}`);
  return { ...(data as unknown as Omit<Facets, 'campaigns'>), campaigns: (campaigns ?? []) as unknown as Facets['campaigns'] };
}

export async function loadDuplicates(): Promise<DuplicateGroup[]> {
  const db = await createClient();
  const { data, error } = await db.schema('api').rpc('biz_duplicates');
  if (error) throw new Error(`duplicates: ${error.message}`);
  return data as unknown as DuplicateGroup[];
}

export async function loadProfile(member: string): Promise<BusinessProfile | null> {
  const db = await createClient();
  const { data, error } = await db.schema('api').rpc('biz_profile', { p_member: member });
  if (error) throw new Error(`profile: ${error.message}`);
  return data as unknown as BusinessProfile | null;
}

export async function loadSegments() {
  const db = await createClient();
  const { data, error } = await db
    .from('segments')
    .select('id, name, description, kind, definition, updated_at')
    .order('name');
  if (error) throw new Error(`segments: ${error.message}`);
  return data ?? [];
}

export async function countSegment(definition: unknown): Promise<number | null> {
  const db = await createClient();
  const { data, error } = await db.schema('api').rpc('biz_count', { p_def: definition as Json, p_q: '' });
  return error ? null : (data as unknown as { total: number }).total;
}

export async function loadExportLog() {
  const db = await createClient();
  const { data, error } = await db
    .from('export_log')
    .select('id, at, format, record_count, fields, sensitive, reason, profiles:user_id(full_name)')
    .order('id', { ascending: false })
    .limit(25);
  if (error) throw new Error(`export log: ${error.message}`);
  return data ?? [];
}
