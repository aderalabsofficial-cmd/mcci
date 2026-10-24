import { afterEach, describe, expect, it, vi } from 'vitest';
import { emailConfig, sendEmail } from '@/lib/email/send';

const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;
afterEach(() => vi.unstubAllGlobals());

describe('app email configuration (lib/email/send.ts)', () => {
  it('defaults to SMTP with the initial MCCI sender, switchable by configuration only', () => {
    const c = emailConfig(env({ SMTP_HOST: 'smtp.example' }));
    expect(c).toMatchObject({ transport: 'smtp', from: { address: 'mcci@aderalabs.tech', name: 'MCCI' } });
    expect(c.smtp).toMatchObject({ host: 'smtp.example', port: 587, secure: false });
    const official = emailConfig(
      env({ SMTP_HOST: 'smtp.mcci.org.pk', EMAIL_FROM: 'no-reply@mcci.org.pk', SMTP_PORT: '465', SMTP_SECURE: '1' }),
    );
    expect(official.from.address).toBe('no-reply@mcci.org.pk');
    expect(official.smtp).toMatchObject({ port: 465, secure: true });
    expect(official.replyTo).toBeUndefined();
  });

  it('adds a Reply-To only when configured (no-reply sender, replies to the MCCI mailbox)', async () => {
    const c = emailConfig(env({ SMTP_HOST: 'smtp.resend.com', EMAIL_REPLY_TO: 'mcci@aderalabs.tech' }));
    expect(c.replyTo).toBe('mcci@aderalabs.tech');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ID: 'r1' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await sendEmail(
      { to: 'a@test.local', subject: 'S', text: 'T', html: '<p>T</p>' },
      emailConfig(
        env({
          EMAIL_TRANSPORT: 'mailpit',
          MAILPIT_URL: 'http://127.0.0.1:54324',
          EMAIL_REPLY_TO: 'mcci@aderalabs.tech',
        }),
      ),
    );
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).ReplyTo).toEqual([{ Email: 'mcci@aderalabs.tech' }]);
  });

  it('refuses to pretend mail can be delivered without a relay', () => {
    expect(() => emailConfig(env({}))).toThrow(/SMTP_HOST is not set/);
    expect(() => emailConfig(env({ EMAIL_TRANSPORT: 'carrier-pigeon' }))).toThrow(/unknown EMAIL_TRANSPORT/);
  });

  it('allows the local mail catcher only outside production', () => {
    expect(emailConfig(env({ EMAIL_TRANSPORT: 'mailpit', MAILPIT_URL: 'http://127.0.0.1:54324' })).transport).toBe(
      'mailpit',
    );
    expect(() =>
      emailConfig(env({ EMAIL_TRANSPORT: 'mailpit', MAILPIT_URL: 'http://x', NODE_ENV: 'production' })),
    ).toThrow(/local development only/);
    // the e2e run of the production build may use a LOOPBACK catcher, never a remote one
    const e2e = { EMAIL_TRANSPORT: 'mailpit', NODE_ENV: 'production', MCCI_E2E: '1' };
    expect(emailConfig(env({ ...e2e, MAILPIT_URL: 'http://127.0.0.1:54324' })).transport).toBe('mailpit');
    expect(() => emailConfig(env({ ...e2e, MAILPIT_URL: 'http://mail.example:54324' }))).toThrow(
      /local development only/,
    );
  });

  it('posts to the mail catcher API with the configured sender', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ID: 'abc' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const id = await sendEmail(
      { to: 'a@test.local', subject: 'S', text: 'T', html: '<p>T</p>' },
      emailConfig(env({ EMAIL_TRANSPORT: 'mailpit', MAILPIT_URL: 'http://127.0.0.1:54324' })),
    );
    expect(id).toBe('abc');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe('http://127.0.0.1:54324/api/v1/send');
    expect(JSON.parse(init.body)).toMatchObject({
      From: { Email: 'mcci@aderalabs.tech' },
      To: [{ Email: 'a@test.local' }],
      Subject: 'S',
    });
  });
});
