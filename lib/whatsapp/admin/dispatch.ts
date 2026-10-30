import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types';
import { appUrl, isConfigured, provider, webhookSecret } from '@/lib/whatsapp/config';
import type { MediaKind, SendOutcome, TemplatePayload, WhatsappProvider } from '@/lib/whatsapp/provider/types';
import { signMedia } from '@/lib/whatsapp/signature';

/**
 * Sends what the database releases. api.wa_claim checks the rules for each message immediately before this runs, and
 * has already moved next_attempt_at forward, so a worker that dies leaves nothing half-owned: the message comes back
 * with the same idempotency key. Runs from the cron route (off in production until authorised) or staff's "send next batch".
 */
interface Claimed {
  id: string;
  phone: string;
  kind: string;
  body: string | null;
  template: TemplatePayload | null;
  attachment_id: string | null;
  key: string;
}

const LINK_MINUTES = 60;

async function mediaFor(id: string) {
  const db = createAdminClient();
  const { data } = await db.from('whatsapp_attachments').select('file_name, kind').eq('id', id).single();
  if (!data) return null;
  const exp = Math.floor(Date.now() / 1000) + LINK_MINUTES * 60;
  return {
    kind: data.kind as MediaKind,
    fileName: data.file_name,
    link: `${appUrl()}/api/whatsapp/media/${id}?exp=${exp}&sig=${signMedia(webhookSecret(), id, exp)}`,
  };
}

async function sendOne(p: WhatsappProvider, m: Claimed): Promise<SendOutcome> {
  const media = m.attachment_id ? await mediaFor(m.attachment_id) : null;
  if (m.attachment_id && !media)
    return { outcome: 'failed', code: 'attachment_missing', detail: 'The attachment no longer exists' };
  if (m.template) {
    const parameter = media
      ? {
          type: media.kind,
          [media.kind]: { link: media.link, ...(media.kind === 'document' ? { filename: media.fileName } : {}) },
        }
      : null;
    const template: TemplatePayload = parameter
      ? { ...m.template, components: [{ type: 'header', parameters: [parameter] }, ...(m.template.components ?? [])] }
      : m.template;
    return p.sendTemplateMessage(m.phone, m.key, template);
  }
  if (media) {
    return p.sendMediaMessage(m.phone, m.key, media.kind, {
      link: media.link,
      ...(media.kind === 'document' ? { filename: media.fileName } : {}),
      ...(m.body ? { caption: m.body.slice(0, 1024) } : {}),
    });
  }
  return p.sendSessionMessage(m.phone, m.key, m.body ?? '');
}

async function record(id: string, r: SendOutcome) {
  const db = createAdminClient();
  const { error } = await db.schema('api').rpc('wa_result', {
    p_id: id,
    p_outcome: r.outcome,
    p_provider_id: r.outcome === 'accepted' ? r.providerId : (null as unknown as string),
    p_wa_id: r.outcome === 'accepted' ? (r.waId as string) : (null as unknown as string),
    p_code: r.outcome === 'accepted' ? (null as unknown as string) : r.code,
    p_detail: r.outcome === 'accepted' ? (null as unknown as string) : r.detail,
  });
  if (error) console.error('whatsapp result not recorded', error.code);
}

/** one message staff just prepared: the database has already applied the rules */
export async function dispatchPrepared(messageId: string): Promise<SendOutcome> {
  const db = createAdminClient();
  const { data: m } = await db
    .from('whatsapp_messages')
    .select('id, phone, kind, body, template_payload, attachment_id, idempotency_key')
    .eq('id', messageId)
    .eq('state', 'submitting')
    .single();
  if (!m) return { outcome: 'failed', code: 'not_found', detail: 'Message not found' };
  const r = await sendOne(provider(), {
    id: m.id,
    phone: m.phone,
    kind: m.kind,
    body: m.body,
    template: m.template_payload as unknown as TemplatePayload | null,
    attachment_id: m.attachment_id,
    key: m.idempotency_key!,
  });
  await record(m.id, r);
  return r;
}

export interface TickResult {
  sent: number;
  stopped: string | null;
  reconciled: number;
}

/** one pass: stops at the first sign of a provider problem, so an outage pauses sending instead of burning retries */
export async function runTick(limit = 20): Promise<TickResult> {
  const out: TickResult = { sent: 0, stopped: null, reconciled: 0 };
  if (!isConfigured()) return { ...out, stopped: 'not_configured' };
  const db = createAdminClient();
  const p = provider();
  const account = await p.getAccountStatus();
  if (!account.ok) {
    await db.schema('api').rpc('wa_health_mark', {
      p_status: account.failure === 'auth' ? 'auth_failed' : 'provider_unavailable',
      p_steps: [] as unknown as Json,
      p_error: account.detail,
    });
    return { ...out, stopped: account.failure };
  }
  const { data, error } = await db.schema('api').rpc('wa_claim', { p_limit: limit });
  if (error) throw new Error(`claim: ${error.code}`);
  for (const m of (data ?? []) as unknown as Claimed[]) {
    if (out.stopped) break; // the rest come back on their own with the same key
    const r = await sendOne(p, m);
    await record(m.id, r);
    if (r.outcome === 'accepted') out.sent += 1;
    else if (r.outcome === 'retry' || r.outcome === 'ambiguous') out.stopped = r.code;
  }
  out.reconciled = await reconcile(p);
  return out;
}

/** asks about messages with no final answer: fills the WhatsApp id, catches missed events, finds stuck messages */
async function reconcile(p: WhatsappProvider): Promise<number> {
  const db = createAdminClient();
  const { data } = await db.schema('api').rpc('wa_reconcile_list', { p_limit: 20 });
  let n = 0;
  for (const row of (data ?? []) as unknown as { id: string; provider_id: string }[]) {
    const r = await p.getMessageStatus(row.provider_id);
    if (!r.ok) {
      if (r.failure === 'unavailable' || r.failure === 'auth') break;
      continue;
    }
    await db.schema('api').rpc('wa_reconcile', {
      p_id: row.id,
      p_state: r.value.state,
      p_wa_id: r.value.waId as string,
      p_code: r.value.code as string,
      p_detail: r.value.detail as string,
    });
    n += 1;
  }
  return n;
}
