import 'server-only';
import { createClient } from '@/lib/supabase/server';

/** WhatsApp reads through the person's own session: row-level security and api.wa_* decide what each designation sees. */
export interface Dashboard {
  withNumber: number;
  consented: number;
  suppressed: number;
  activeCampaigns: number;
  submitted: number;
  delivered: number;
  read: number;
  failed: number;
  unknown: number;
  inbound: number;
  unmatched: number;
  webhookLast: string | null;
  webhookRejected: number;
}
export interface CampaignStats {
  status: Record<string, number>;
  reasons: Record<string, number>;
  replies: number;
  optOuts: number;
}

export async function loadDashboard(): Promise<Dashboard> {
  const db = await createClient();
  const { data, error } = await db.schema('api').rpc('wa_dashboard');
  if (error) throw new Error(`dashboard: ${error.code}`);
  return data as unknown as Dashboard;
}

export async function loadHealth() {
  const db = await createClient();
  const { data } = await db
    .from('whatsapp_health')
    .select('status, steps, checked_at, last_ok_at, last_error, last_auth_failure_at')
    .single();
  return data;
}

export async function loadSettings() {
  const db = await createClient();
  const { data, error } = await db.schema('api').rpc('wa_settings_read');
  if (error) throw new Error(`settings: ${error.code}`);
  return data as unknown as {
    sendingEnabled: boolean;
    ratePerMinute: number;
    maxCampaign: number;
    approvalThreshold: number;
    windowHours: number;
    staleMinutes: number;
    consentOpen: boolean;
    consentVersion: string;
  };
}

export async function loadTemplates() {
  const db = await createClient();
  const { data, error } = await db
    .from('whatsapp_templates')
    .select(
      'id, name, language, category, status, provider_id, header_type, header, body, footer, buttons, var_map, synced_at',
    )
    .order('name')
    .order('language');
  if (error) throw new Error(`templates: ${error.code}`);
  return data ?? [];
}
export type TemplateRow = Awaited<ReturnType<typeof loadTemplates>>[number];

export async function loadCampaigns() {
  const db = await createClient();
  const { data, error } = await db
    .from('whatsapp_campaigns')
    .select('id, name, mode, status, category, created_at, scheduled_at, finished_at, profiles:created_by(full_name)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(`campaigns: ${error.code}`);
  return data ?? [];
}

export async function loadCampaign(id: string) {
  const db = await createClient();
  const { data, error } = await db
    .from('whatsapp_campaigns')
    .select(
      'id, name, purpose, mode, status, category, message_kind, body, filter, created_by, approved_at, reject_reason, scheduled_at, started_at, finished_at, created_at, whatsapp_templates(name, language, body, var_map), whatsapp_attachments(file_name), segments(name), profiles:created_by(full_name)',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`campaign: ${error.code}`);
  return data;
}

export async function loadCampaignStats(id: string): Promise<CampaignStats> {
  const db = await createClient();
  const { data, error } = await db.schema('api').rpc('wa_campaign_stats', { p_id: id });
  if (error) throw new Error(`stats: ${error.code}`);
  return data as unknown as CampaignStats;
}

export async function loadRecipients(id: string) {
  const db = await createClient();
  const { data } = await db
    .from('whatsapp_campaign_recipients')
    .select('id, business_name, member_no, phone, status, reason')
    .eq('campaign_id', id)
    .order('business_name')
    .limit(300);
  return data ?? [];
}

export async function loadConversations(q: string, filter: string) {
  const db = await createClient();
  let query = db
    .from('whatsapp_conversations')
    .select(
      'id, phone, profile_name, status, company_id, assigned_to, last_inbound_at, last_outbound_at, companies(name)',
    )
    .order('last_inbound_at', { ascending: false, nullsFirst: false })
    .limit(100);
  if (filter === 'unmatched') query = query.is('company_id', null);
  else if (['open', 'pending', 'resolved'].includes(filter)) query = query.eq('status', filter as never);
  const safe = q.replace(/[^\p{L}\p{N} +]/gu, '').trim();
  if (safe) query = query.or(`phone.ilike.%${safe}%,profile_name.ilike.%${safe}%`);
  const { data, error } = await query;
  if (error) throw new Error(`conversations: ${error.code}`);
  return data ?? [];
}

export async function loadConversation(id: string) {
  const db = await createClient();
  const [{ data: c }, { data: messages }, { data: notes }] = await Promise.all([
    db
      .from('whatsapp_conversations')
      .select('id, phone, profile_name, status, company_id, assigned_to, last_inbound_at, companies(name)')
      .eq('id', id)
      .maybeSingle(),
    db
      .from('whatsapp_messages')
      .select('id, direction, kind, body, state, failure_code, failure_detail, created_at, attachment_id')
      .eq('conversation_id', id)
      .order('created_at', { ascending: false })
      .limit(100),
    db
      .from('whatsapp_notes')
      .select('id, body, created_at, profiles:author(full_name)')
      .eq('conversation_id', id)
      .order('id', { ascending: false })
      .limit(50),
  ]);
  return c ? { ...c, messages: messages ?? [], notes: notes ?? [] } : null;
}

export async function loadStaffOptions() {
  const db = await createClient();
  const { data } = await db.schema('api').rpc('staff_directory');
  return ((data ?? []) as unknown as { user_id: string; full_name: string | null; active: boolean }[])
    .filter((s) => s.active)
    .map((s) => ({ id: s.user_id, name: s.full_name ?? '—' }));
}

export async function loadCompanyHistory(company: string) {
  const db = await createClient();
  const { data: messages } = await db
    .from('whatsapp_messages')
    .select(
      'id, direction, kind, body, state, failure_code, created_at, wa_id, whatsapp_templates(name), whatsapp_campaigns(name)',
    )
    .eq('company_id', company)
    .order('created_at', { ascending: false })
    .limit(30);
  const { data: conversation } = await db
    .from('whatsapp_conversations')
    .select('id, last_inbound_at, last_outbound_at')
    .eq('company_id', company)
    .maybeSingle();
  return { messages: messages ?? [], conversation };
}

export async function loadSuppressions() {
  const db = await createClient();
  const { data } = await db.schema('api').rpc('wa_consent_overview');
  return (data ?? { numbers: [], suppressions: [] }) as unknown as {
    numbers: {
      member_id: string;
      business_name: string;
      member_no: string;
      phone: string;
      consent: string;
      opted_out: boolean;
      categories: string[] | null;
      at: string | null;
      version: string | null;
    }[];
    suppressions: { phone: string; reason: string; source: string; created_at: string }[];
  };
}
