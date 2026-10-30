import type {
  MediaKind,
  ProviderMessage,
  ProviderSender,
  ProviderTemplate,
  Result,
  SendOutcome,
  TemplatePayload,
  WhatsappProvider,
} from './types';

/**
 * The IQPigeon WhatsApp API, from its source at commit b225748 (routes/api.php, StoreMessageRequest, MessageResource):
 * Bearer key; POST /api/v1/messages needs an Idempotency-Key; answers 202 "queued", with no WhatsApp id yet.
 * Errors look like { success:false, error:{ code, message } }. Nothing here is logged: no key, number or message text.
 */
export interface IqpigeonConfig {
  baseUrl: string;
  apiKey: string;
  connectionId: string;
  timeoutMs?: number;
}

type Json = Record<string, unknown>;
const get = (o: unknown, ...path: string[]): unknown =>
  path.reduce<unknown>((n, k) => (n as Json | null | undefined)?.[k], o);
const str = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);

/** Which answers are final. A 5xx may come after the message was queued, so it is never treated as "did not send". */
export function classifySend(status: number, body: unknown): SendOutcome {
  const code = str(get(body, 'error', 'code')) ?? `http_${status}`;
  const detail = (str(get(body, 'error', 'message')) ?? `The provider answered ${status}`).slice(0, 300);
  if (status >= 200 && status < 300) {
    const m = get(body, 'data', 'message') ?? get(body, 'message');
    const id = str(get(m, 'id'));
    if (!id) return { outcome: 'ambiguous', code: 'bad_response', detail: 'The provider did not return a message id' };
    if (get(m, 'status') === 'failed') {
      return {
        outcome: 'failed',
        code: str(get(m, 'failure_code')) ?? 'provider_failed',
        detail: (str(get(m, 'failure_message')) ?? detail).slice(0, 300),
      };
    }
    return { outcome: 'accepted', providerId: id, waId: str(get(m, 'wa_message_id')) };
  }
  if (status === 429) return { outcome: 'retry', code: 'rate_limited', detail };
  if (status >= 500) return { outcome: 'ambiguous', code, detail };
  return { outcome: 'failed', code, detail };
}

export function mapMessage(m: unknown): ProviderMessage {
  const status = str(get(m, 'status'));
  const known: ProviderMessage['state'][] = ['queued', 'processing', 'sent', 'delivered', 'read', 'failed'];
  return {
    state: known.includes(status as ProviderMessage['state']) ? (status as ProviderMessage['state']) : 'other',
    waId: str(get(m, 'wa_message_id')),
    code: str(get(m, 'failure_code')),
    detail: str(get(m, 'failure_message'))?.slice(0, 300) ?? null,
  };
}

export function createIqpigeonProvider(cfg: IqpigeonConfig): WhatsappProvider {
  const base = cfg.baseUrl.replace(/\/+$/, '');
  const timeout = cfg.timeoutMs ?? 20_000;

  async function call(method: string, path: string, body?: unknown, key?: string) {
    return fetch(`${base}/api/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(key ? { 'Idempotency-Key': key } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
      cache: 'no-store',
    });
  }

  async function read<T>(path: string, pick: (data: unknown) => T): Promise<Result<T>> {
    try {
      const res = await call('GET', path);
      const json: unknown = await res.json().catch(() => null);
      if (res.status === 401 || res.status === 403)
        return { ok: false, failure: 'auth', detail: `The provider answered ${res.status}` };
      if (res.status === 404) return { ok: false, failure: 'not_found', detail: 'Not found on the provider' };
      if (!res.ok)
        return {
          ok: false,
          failure: res.status >= 500 ? 'unavailable' : 'rejected',
          detail: `The provider answered ${res.status}`,
        };
      return { ok: true, value: pick(get(json, 'data') ?? json) };
    } catch {
      return { ok: false, failure: 'unavailable', detail: 'The provider could not be reached' };
    }
  }

  async function send(key: string, payload: Json): Promise<SendOutcome> {
    try {
      const res = await call('POST', '/messages', { connection_id: cfg.connectionId, ...payload }, key);
      return classifySend(res.status, await res.json().catch(() => null));
    } catch {
      // cut off or timed out: the provider may have taken it
      return { outcome: 'ambiguous', code: 'timeout', detail: 'No answer from the provider' };
    }
  }

  return {
    getAccountStatus: () =>
      read('/me', (d) => ({
        name: str(get(d, 'partner', 'name')) ?? '',
        status: str(get(d, 'partner', 'status')) ?? 'unknown',
      })),
    getSender: (id) =>
      read(`/connections/${encodeURIComponent(id)}`, (d): ProviderSender => ({
        id: str(get(d, 'connection', 'id')) ?? id,
        status: str(get(d, 'connection', 'status')) ?? 'unknown',
        displayPhone: str(get(d, 'connection', 'display_phone_number')),
        phoneNumberId: str(get(d, 'connection', 'phone_number_id')),
        wabaId: str(get(d, 'connection', 'waba_id')),
      })),
    getWebhookUrls: () =>
      read('/webhooks', (d) => {
        const list = get(d, 'webhooks');
        return Array.isArray(list) ? list.map((w) => str(get(w, 'url'))).filter((u): u is string => u !== null) : [];
      }),
    getTemplates: () =>
      read('/templates', (d) => {
        const list = get(d, 'templates');
        return (Array.isArray(list) ? list : []).map((t): ProviderTemplate => ({
          name: str(get(t, 'name')) ?? '',
          language: str(get(t, 'language')) ?? '',
          status: str(get(t, 'status')),
          category: str(get(t, 'category')),
          id: str(get(t, 'id')),
        }));
      }),
    sendTemplateMessage: (to, key, template: TemplatePayload) => send(key, { to, type: 'template', template }),
    sendSessionMessage: (to, key, body) => send(key, { to, type: 'text', body }),
    sendMediaMessage: (to, key, kind: MediaKind, media) => send(key, { to, type: kind, payload: media }),
    getMessageStatus: (providerId) =>
      read(`/messages/${encodeURIComponent(providerId)}`, (d) => mapMessage(get(d, 'message'))),
  };
}
