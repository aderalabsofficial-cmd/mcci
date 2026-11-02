import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types';
import {
  connectionId,
  isConfigured,
  missingConfig,
  provider,
  senderPhoneNumberId,
  webhookUrl,
} from '@/lib/whatsapp/config';

/**
 * The connection test. "Connected" needs every step: the API answering is not enough. Sender ownership is checked by
 * asking for MCCI's connection with MCCI's key: the provider scopes connections to the key's account, and the phone
 * number id must match the one configured here.
 */
export type HealthStatus =
  | 'not_configured'
  | 'incomplete'
  | 'connected'
  | 'auth_failed'
  | 'sender_not_registered'
  | 'provider_unavailable'
  | 'webhook_failed';
export interface HealthStep {
  key: 'auth' | 'account' | 'sender' | 'isolation' | 'templates' | 'webhook';
  ok: boolean;
  detail?: string;
}

export async function testConnection(): Promise<{
  status: HealthStatus;
  steps: HealthStep[];
  account: string | null;
  display: string | null;
}> {
  const steps: HealthStep[] = [];
  let status: HealthStatus = 'connected';
  let account: string | null = null;
  let display: string | null = null;
  const detail: Record<string, string | number> = {};

  if (!isConfigured()) {
    status = missingConfig().length >= 5 ? 'not_configured' : 'incomplete';
  } else {
    const p = provider();
    const me = await p.getAccountStatus();
    steps.push({ key: 'auth', ok: me.ok, detail: me.ok ? undefined : me.detail });
    if (!me.ok) {
      status = me.failure === 'auth' ? 'auth_failed' : 'provider_unavailable';
    } else {
      account = me.value.name;
      detail.accountName = me.value.name;
      if (me.value.id) detail.accountId = me.value.id;
      steps.push({ key: 'account', ok: me.value.status === 'active', detail: me.value.status });
      const sender = await p.getSender(connectionId());
      const active = sender.ok && sender.value.status === 'active';
      steps.push({ key: 'sender', ok: active, detail: sender.ok ? sender.value.status : sender.detail });
      const own = sender.ok && sender.value.phoneNumberId === senderPhoneNumberId();
      steps.push({ key: 'isolation', ok: own });
      if (sender.ok) {
        display = sender.value.displayPhone;
        if (display) detail.displayPhone = display;
        if (sender.value.wabaId) detail.wabaId = sender.value.wabaId;
      }
      const templates = await p.getTemplates();
      steps.push({
        key: 'templates',
        ok: templates.ok,
        detail: templates.ok ? String(templates.value.length) : templates.detail,
      });
      if (templates.ok) {
        detail.templatesTotal = templates.value.length;
        detail.templatesApproved = templates.value.filter((t) => t.status === 'APPROVED').length;
      }
      const hooks = await p.getWebhookUrls();
      const hooked = hooks.ok && hooks.value.includes(webhookUrl());
      steps.push({ key: 'webhook', ok: hooked });
      if (!active || !own)
        status =
          sender.ok || (!sender.ok && sender.failure === 'not_found')
            ? 'sender_not_registered'
            : 'provider_unavailable';
      else if (!templates.ok) status = 'provider_unavailable';
      else if (!hooked) status = 'webhook_failed';
      else if (me.value.status !== 'active') status = 'auth_failed';
    }
  }
  const db = createAdminClient();
  const { error } = await db.schema('api').rpc('wa_health_mark', {
    p_status: status,
    p_steps: steps as unknown as Json,
    p_error: steps.find((s) => !s.ok)?.key ?? (status === 'connected' ? '' : status),
    p_detail: detail as unknown as Json,
  });
  if (error) console.error('whatsapp health not recorded', error.code);
  return { status, steps, account, display };
}

const STALE_MS = 10 * 60_000;
const CHECK_LIMIT_MS = 15_000;

/**
 * The screens show the saved result of the last test, so an answer from before the credentials were complete must not
 * outlive them (it did: "Not configured" stayed on screen after MCCI's number was connected). Re-checks when the saved
 * answer says not configured, or is over 10 minutes old. A slow or failed provider never blocks the page.
 */
export async function refreshHealthIfStale(): Promise<void> {
  if (!isConfigured()) return;
  try {
    const { data } = await createAdminClient().from('whatsapp_health').select('status, checked_at').single();
    const age = data?.checked_at ? Date.now() - Date.parse(data.checked_at) : Number.POSITIVE_INFINITY;
    if (data && !['not_configured', 'incomplete'].includes(data.status) && age < STALE_MS) return;
    await Promise.race([testConnection(), new Promise((resolve) => setTimeout(resolve, CHECK_LIMIT_MS))]);
  } catch {
    console.error('whatsapp health refresh failed');
  }
}
