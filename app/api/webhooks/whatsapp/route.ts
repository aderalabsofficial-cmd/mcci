import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types';
import { senderPhoneNumberId, webhookSecret } from '@/lib/whatsapp/config';
import { verifyWebhookSignature } from '@/lib/whatsapp/signature';

/**
 * POST /api/webhooks/whatsapp: status events and replies from the provider. Trusted only when the signature is valid,
 * the timestamp is recent and the event is for MCCI's own number (the provider had a defect that could route another
 * account's events: docs/30 §7). A plausible phone number proves nothing. A failed check stores nothing from the body.
 */
export const dynamic = 'force-dynamic';

const MAX_BYTES = 256 * 1024;
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(req: Request) {
  const secret = webhookSecret();
  const own = senderPhoneNumberId();
  if (!secret || !own) return NextResponse.json({ error: 'not_configured' }, { status: 503, headers: NO_STORE });
  const body = await req.text();
  if (body.length > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413, headers: NO_STORE });
  if (!verifyWebhookSignature(secret, req.headers.get('x-iqp-timestamp'), body, req.headers.get('x-iqp-signature'))) {
    return NextResponse.json({ error: 'bad_signature' }, { status: 401, headers: NO_STORE });
  }
  let event: {
    id?: unknown;
    type?: unknown;
    data?: { metadata?: { phone_number_id?: unknown } } & Record<string, unknown>;
  };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'bad_body' }, { status: 400, headers: NO_STORE });
  }
  const db = createAdminClient();
  const eventId = req.headers.get('x-iqp-event-id') ?? (typeof event.id === 'string' ? event.id : '');
  if (!eventId || !event.data) return NextResponse.json({ error: 'bad_body' }, { status: 400, headers: NO_STORE });
  if (String(event.data.metadata?.phone_number_id ?? '') !== own) {
    // signed, but not MCCI's number: counted for the settings screen, nothing from it is kept
    await db.schema('api').rpc('wa_webhook_reject', { p_reason: 'other_account' });
    console.error('whatsapp webhook: event for another number refused');
    return NextResponse.json({ error: 'other_account' }, { status: 403, headers: NO_STORE });
  }
  const { data, error } = await db.schema('api').rpc('wa_webhook', {
    p_event_id: eventId,
    p_type: typeof event.type === 'string' ? event.type : 'unknown',
    p_data: event.data as unknown as Json,
  });
  if (error) {
    console.error('whatsapp webhook failed', error.code);
    return NextResponse.json({ error: 'failed' }, { status: 500, headers: NO_STORE }); // the provider will retry
  }
  return NextResponse.json({ ok: true, result: data }, { headers: NO_STORE });
}
