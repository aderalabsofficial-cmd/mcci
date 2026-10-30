/**
 * MCCI's own view of a WhatsApp provider. These names are ours, not the provider's routes: business logic depends only
 * on this file, and lib/whatsapp/provider/iqpigeon.ts translates to the real API (docs/30 §2).
 */
export type MediaKind = 'image' | 'document' | 'video' | 'audio';

export interface TemplatePayload {
  name: string;
  language: { code: string };
  components?: unknown[];
}

/** Accepted is not delivered: it only means the provider took the message. */
export type SendOutcome =
  | { outcome: 'accepted'; providerId: string; waId: string | null }
  | { outcome: 'retry'; code: string; detail: string } // the provider said try later (rate limit)
  | { outcome: 'ambiguous'; code: string; detail: string } // no clear answer: it may have gone, retry only with the same key
  | { outcome: 'failed'; code: string; detail: string }; // permanent

export interface ProviderMessage {
  state: 'queued' | 'processing' | 'sent' | 'delivered' | 'read' | 'failed' | 'other';
  waId: string | null;
  code: string | null;
  detail: string | null;
}

export interface ProviderTemplate {
  name: string;
  language: string;
  status: string | null;
  category: string | null;
  id: string | null;
}

export interface ProviderSender {
  id: string;
  status: string;
  displayPhone: string | null;
  phoneNumberId: string | null;
  wabaId: string | null;
}

export type ProviderFailure = 'auth' | 'not_found' | 'unavailable' | 'rejected';
export type Result<T> = { ok: true; value: T } | { ok: false; failure: ProviderFailure; detail: string };

export interface WhatsappProvider {
  getAccountStatus(): Promise<Result<{ name: string; status: string }>>;
  getSender(id: string): Promise<Result<ProviderSender>>;
  getWebhookUrls(): Promise<Result<string[]>>;
  getTemplates(): Promise<Result<ProviderTemplate[]>>;
  sendTemplateMessage(to: string, key: string, template: TemplatePayload): Promise<SendOutcome>;
  sendSessionMessage(to: string, key: string, body: string): Promise<SendOutcome>;
  sendMediaMessage(
    to: string,
    key: string,
    kind: MediaKind,
    media: { link: string; filename?: string; caption?: string },
  ): Promise<SendOutcome>;
  getMessageStatus(providerId: string): Promise<Result<ProviderMessage>>;
}
