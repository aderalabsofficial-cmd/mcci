import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkMedia, placeholders, renderPreview, renderTemplate } from '@/lib/whatsapp/media';
import { classifySend, createIqpigeonProvider, mapMessage } from '@/lib/whatsapp/provider/iqpigeon';
import { signMedia, signWebhook, verifyMedia, verifyWebhookSignature } from '@/lib/whatsapp/signature';

describe('provider answers become stable outcomes', () => {
  const queued = { success: true, data: { message: { id: 'm1', status: 'queued', wa_message_id: null } } };

  it('accepted is only accepted, with no WhatsApp id yet', () => {
    expect(classifySend(202, queued)).toEqual({ outcome: 'accepted', providerId: 'm1', waId: null });
  });
  it('a rate limit waits; a server error may have gone through; a refusal is final', () => {
    expect(classifySend(429, { error: { code: 'rate_limit_exceeded', message: 'x' } }).outcome).toBe('retry');
    expect(classifySend(500, {}).outcome).toBe('ambiguous');
    expect(classifySend(404, { error: { code: 'connection_not_found', message: 'x' } })).toMatchObject({
      outcome: 'failed',
      code: 'connection_not_found',
    });
    expect(classifySend(401, {}).outcome).toBe('failed');
  });
  it('a success without an id is not treated as sent', () => {
    expect(classifySend(202, { data: {} }).outcome).toBe('ambiguous');
  });
  it('a replayed failure stays a failure', () => {
    expect(
      classifySend(202, {
        data: { message: { id: 'm', status: 'failed', failure_code: 'recipient_not_on_whatsapp' } },
      }),
    ).toMatchObject({ outcome: 'failed', code: 'recipient_not_on_whatsapp' });
  });
  it('maps message status, unknown values stay unknown', () => {
    expect(mapMessage({ status: 'delivered', wa_message_id: 'w' })).toMatchObject({ state: 'delivered', waId: 'w' });
    expect(mapMessage({ status: 'something' }).state).toBe('other');
  });
});

describe('adapter requests', () => {
  afterEach(() => vi.unstubAllGlobals());
  const provider = createIqpigeonProvider({ baseUrl: 'https://api.test/', apiKey: 'k', connectionId: 'c1' });

  it('sends the real schema: Bearer key, Idempotency-Key, connection id', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ data: { message: { id: 'm1', status: 'queued' } } }), { status: 202 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const r = await provider.sendTemplateMessage('+923001234567', 'key-1', {
      name: 'n',
      language: { code: 'ur' },
      components: [],
    });
    expect(r.outcome).toBe('accepted');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.test/api/v1/messages');
    const h = init.headers as Record<string, string>;
    expect(h.Authorization).toBe('Bearer k');
    expect(h['Idempotency-Key']).toBe('key-1');
    expect(JSON.parse(init.body as string)).toEqual({
      connection_id: 'c1',
      to: '+923001234567',
      type: 'template',
      template: { name: 'n', language: { code: 'ur' }, components: [] },
    });
  });
  it('a timeout is ambiguous: the message may have gone', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('t', 'TimeoutError');
      }),
    );
    expect((await provider.sendSessionMessage('+923001234567', 'k', 'x')).outcome).toBe('ambiguous');
  });
  it('reads failures as failures, never as an empty success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 401 })),
    );
    expect(await provider.getTemplates()).toMatchObject({ ok: false, failure: 'auth' });
  });
});

describe('signatures', () => {
  const now = 1_800_000_000;
  const t = String(now);
  it('accepts the provider format and a sha256= prefix', () => {
    const s = signWebhook('secret', t, '{"a":1}');
    expect(verifyWebhookSignature('secret', t, '{"a":1}', s, now)).toBe(true);
    expect(verifyWebhookSignature('secret', t, '{"a":1}', `sha256=${s}`, now)).toBe(true);
  });
  it('refuses a changed body, another secret, an old event, or nothing', () => {
    const s = signWebhook('secret', t, 'x');
    expect(verifyWebhookSignature('secret', t, 'y', s, now)).toBe(false);
    expect(verifyWebhookSignature('other', t, 'x', s, now)).toBe(false);
    expect(verifyWebhookSignature('secret', t, 'x', s, now + 301)).toBe(false);
    expect(verifyWebhookSignature('', t, 'x', s, now)).toBe(false);
    expect(verifyWebhookSignature('secret', null, 'x', s, now)).toBe(false);
  });
  it('media links are for one file and expire', () => {
    const s = signMedia('secret', 'id1', now + 60);
    expect(verifyMedia('secret', 'id1', String(now + 60), s, now)).toBe(true);
    expect(verifyMedia('secret', 'id2', String(now + 60), s, now)).toBe(false);
    expect(verifyMedia('secret', 'id1', String(now + 60), s, now + 61)).toBe(false);
  });
});

describe('attachments', () => {
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 1]);
  it('accepts a real PDF', () => {
    expect(checkMedia('a.PDF', 'application/pdf', pdf)).toMatchObject({ ok: true, kind: 'document' });
  });
  it('refuses a renamed file, a wrong extension, and an oversized one', () => {
    expect(checkMedia('a.pdf', 'application/pdf', new Uint8Array([0x4d, 0x5a]))).toEqual({ ok: false, reason: 'type' });
    expect(checkMedia('a.exe', 'application/pdf', pdf)).toEqual({ ok: false, reason: 'type' });
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set([0xff, 0xd8, 0xff]);
    expect(checkMedia('a.jpg', 'image/jpeg', big)).toEqual({ ok: false, reason: 'size' });
  });
});

describe('personalisation', () => {
  it('replaces only known names and nothing else', () => {
    expect(renderPreview('Hi {{business_name}} {{password}} {{city}}', { business_name: 'ACME', city: null })).toBe(
      'Hi ACME {{password}} ',
    );
  });
  it('fills template placeholders only through the mapping and shows what is missing', () => {
    expect(
      renderTemplate('{{1}} / {{2}} / {{3}}', { '1': 'business_name', '2': 'city' }, { business_name: 'ACME' }),
    ).toBe('ACME / [city?] / {{3}}');
    expect(placeholders('{{1}} {{2}} {{1}}')).toEqual(['1', '2']);
  });
});
