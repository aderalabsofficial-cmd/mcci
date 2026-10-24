import 'server-only';
import nodemailer from 'nodemailer';

/**
 * App-sent email (invitations now; the notification emails of docs/07 later). Auth's own emails — confirmation,
 * email code, password reset, email change — are sent by Supabase Auth through ITS SMTP settings, not here.
 *
 * Everything comes from the environment, so moving from the initial sender (mcci@aderalabs.tech) to MCCI's official
 * domain is a configuration change only. A mailbox alone does not deliver mail: SMTP_HOST/USER/PASS must point at a
 * relay that is allowed to send for the sender's domain (SPF/DKIM/DMARC — docs/17 §10).
 *
 *   EMAIL_TRANSPORT  smtp (default) | mailpit (local development and tests only: the Supabase CLI mail catcher's HTTP
 *                    API; refused when NODE_ENV=production, except for the Playwright run of the production build —
 *                    MCCI_E2E=1, set by playwright.config.ts — and only with a loopback MAILPIT_URL)
 *   EMAIL_FROM       sender address, default mcci@aderalabs.tech;  EMAIL_FROM_NAME, default "MCCI"
 *   SMTP_HOST, SMTP_PORT (587), SMTP_SECURE (1 = implicit TLS, e.g. 465), SMTP_USER, SMTP_PASS
 *   MAILPIT_URL      e.g. http://127.0.0.1:54324 (from `supabase status`)
 */
export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailConfig {
  transport: 'smtp' | 'mailpit';
  from: { address: string; name: string };
  smtp?: { host: string; port: number; secure: boolean; user?: string; pass?: string };
  mailpitUrl?: string;
}

export function emailConfig(env: NodeJS.ProcessEnv = process.env): EmailConfig {
  const transport = (env.EMAIL_TRANSPORT || 'smtp') as EmailConfig['transport'];
  const from = { address: env.EMAIL_FROM || 'mcci@aderalabs.tech', name: env.EMAIL_FROM_NAME || 'MCCI' };
  if (transport === 'mailpit') {
    if (!env.MAILPIT_URL) throw new Error('MAILPIT_URL is required with EMAIL_TRANSPORT=mailpit');
    const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(env.MAILPIT_URL).hostname);
    if (env.NODE_ENV === 'production' && !(env.MCCI_E2E === '1' && loopback))
      throw new Error('EMAIL_TRANSPORT=mailpit is for local development only');
    return { transport, from, mailpitUrl: env.MAILPIT_URL };
  }
  if (transport !== 'smtp') throw new Error(`unknown EMAIL_TRANSPORT ${transport}`);
  if (!env.SMTP_HOST) throw new Error('SMTP_HOST is not set: app email cannot be delivered');
  return {
    transport,
    from,
    smtp: {
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: env.SMTP_SECURE === '1',
      user: env.SMTP_USER || undefined,
      pass: env.SMTP_PASS || undefined,
    },
  };
}

/** Sends one email; resolves to a message id, rejects on any delivery error (callers decide what to tell the user). */
export async function sendEmail(mail: OutgoingEmail, config: EmailConfig = emailConfig()): Promise<string> {
  if (config.transport === 'mailpit') {
    const res = await fetch(new URL('/api/v1/send', config.mailpitUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        From: { Email: config.from.address, Name: config.from.name },
        To: [{ Email: mail.to }],
        Subject: mail.subject,
        Text: mail.text,
        HTML: mail.html,
      }),
    });
    if (!res.ok) throw new Error(`mail catcher refused the message (${res.status})`);
    return ((await res.json()) as { ID: string }).ID;
  }
  const s = config.smtp!;
  const transporter = nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure,
    requireTLS: !s.secure, // STARTTLS on 587: never send credentials or mail in the clear
    auth: s.user ? { user: s.user, pass: s.pass } : undefined,
  });
  const info = await transporter.sendMail({
    from: { address: config.from.address, name: config.from.name },
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
  return info.messageId;
}
