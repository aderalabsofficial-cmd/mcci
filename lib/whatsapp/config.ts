import 'server-only';
import { createIqpigeonProvider } from './provider/iqpigeon';
import type { WhatsappProvider } from './provider/types';

/** Secrets come only from the server environment. Screens get `publicConfig()`, which never contains them. */
const KEYS = [
  'IQPIGEON_API_URL',
  'IQPIGEON_API_KEY',
  'IQPIGEON_CONNECTION_ID',
  'IQPIGEON_PHONE_NUMBER_ID',
  'IQPIGEON_WEBHOOK_SECRET',
] as const;

export function missingConfig(): string[] {
  return KEYS.filter((k) => !process.env[k]?.trim());
}
export const isConfigured = () => missingConfig().length === 0;
export const webhookSecret = () => process.env.IQPIGEON_WEBHOOK_SECRET?.trim() ?? '';
export const senderPhoneNumberId = () => process.env.IQPIGEON_PHONE_NUMBER_ID?.trim() ?? '';
export const connectionId = () => process.env.IQPIGEON_CONNECTION_ID?.trim() ?? '';
export const appUrl = () => (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
export const webhookUrl = () => `${appUrl()}/api/webhooks/whatsapp`;

export function publicConfig() {
  return {
    baseUrl: process.env.IQPIGEON_API_URL?.trim() || null,
    connectionId: connectionId() || null,
    phoneNumberId: senderPhoneNumberId() || null,
    webhookUrl: webhookUrl(),
    apiKeySet: Boolean(process.env.IQPIGEON_API_KEY?.trim()),
    webhookSecretSet: Boolean(webhookSecret()),
    missing: missingConfig(),
  };
}

export function provider(): WhatsappProvider {
  return createIqpigeonProvider({
    baseUrl: process.env.IQPIGEON_API_URL!.trim(),
    apiKey: process.env.IQPIGEON_API_KEY!.trim(),
    connectionId: connectionId(),
  });
}
