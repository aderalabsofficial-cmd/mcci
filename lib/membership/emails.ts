import 'server-only';
import type { OutgoingEmail } from '@/lib/email/send';
import { msg } from '@/lib/nav/model';

/**
 * Membership emails sent by the app (docs/07): English and Urdu in one message, links to APP_URL only.
 * "Application received" is the receipt of action wiz.submit.
 */

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function appLink(path: string, env: NodeJS.ProcessEnv = process.env): string {
  const app = env.APP_URL;
  if (!app) throw new Error('APP_URL is not set: email links cannot be built');
  return `${app.replace(/\/+$/, '')}${path}`;
}

export function submittedEmail(
  to: string,
  name: string,
  token: string,
  env: NodeJS.ProcessEnv = process.env,
): OutgoingEmail {
  const link = appLink('/portal/mtrack', env);
  const parts = (['en', 'ur'] as const).map((l) => ({
    lang: l,
    greeting: msg(l, 'membership.email.greeting', { name: name || to }),
    body: msg(l, 'membership.email.submittedBody', { token }),
    next: msg(l, 'membership.email.submittedNext'),
    action: msg(l, 'membership.email.track'),
  }));
  const text = parts
    .map((p) => [p.greeting, '', p.body, '', p.next, '', `${p.action}: ${link}`].join('\n'))
    .join('\n\n— — —\n\n');
  const block = (p: (typeof parts)[number]) => `
  <div dir="${p.lang === 'ur' ? 'rtl' : 'ltr'}" lang="${p.lang}" style="margin:0 0 28px;font:16px/1.6 ${
    p.lang === 'ur' ? "'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',Tahoma,serif" : 'Arial,Helvetica,sans-serif'
  };color:#0e1b33">
    <p style="margin:0 0 12px">${esc(p.greeting)}</p>
    <p style="margin:0 0 12px">${esc(p.body)}</p>
    <p style="margin:0 0 12px">${esc(p.next)}</p>
    <p style="margin:18px 0"><a href="${esc(link)}" style="display:inline-block;background:#1b4f9c;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">${esc(p.action)}</a></p>
  </div>`;
  const html = `<!doctype html><html><body style="margin:0;background:#fbf6ec;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #eadfc6;border-radius:18px;padding:28px">
  <p style="margin:0 0 20px;font:700 18px Arial,Helvetica,sans-serif;color:#0b2a5b">Multan Chamber of Commerce &amp; Industry</p>
  ${parts.map(block).join('<hr style="border:0;border-top:1px solid #eadfc6;margin:0 0 24px">')}
</div></body></html>`;
  const subject = `${msg('en', 'membership.email.submittedSubject', { token })} · ${msg('ur', 'membership.email.submittedSubject', { token })}`;
  return { to, subject, text, html };
}

export type Decision = 'returned' | 'verified' | 'rejected';

/** membership_returned / membership_verified / membership_rejected (docs/07): the officer's note is quoted as written */
export function decisionEmail(
  kind: Decision,
  to: string,
  name: string,
  token: string,
  note: string | null,
  env: NodeJS.ProcessEnv = process.env,
): OutgoingEmail {
  const link = appLink(kind === 'returned' ? '/portal/join' : '/portal/mtrack', env);
  const parts = (['en', 'ur'] as const).map((l) => ({
    lang: l,
    greeting: msg(l, 'membership.email.greeting', { name: name || to }),
    body: msg(l, `review.email.${kind}Body`, { token }),
    next: kind === 'verified' ? msg(l, 'review.email.verifiedNext') : '',
    action: msg(l, kind === 'returned' ? 'review.email.returnedAction' : 'review.email.track'),
  }));
  const quoted = note?.trim() || '';
  const text = parts
    .map((p) =>
      [
        p.greeting,
        '',
        p.body,
        ...(quoted ? ['', quoted] : []),
        ...(p.next ? ['', p.next] : []),
        '',
        `${p.action}: ${link}`,
      ].join('\n'),
    )
    .join('\n\n— — —\n\n');
  const block = (p: (typeof parts)[number]) => `
  <div dir="${p.lang === 'ur' ? 'rtl' : 'ltr'}" lang="${p.lang}" style="margin:0 0 28px;font:16px/1.6 ${
    p.lang === 'ur' ? "'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',Tahoma,serif" : 'Arial,Helvetica,sans-serif'
  };color:#0e1b33">
    <p style="margin:0 0 12px">${esc(p.greeting)}</p>
    <p style="margin:0 0 12px">${esc(p.body)}</p>
    ${quoted ? `<p dir="auto" style="margin:0 0 12px;padding:10px 14px;background:#faf4e6;border-radius:10px">${esc(quoted)}</p>` : ''}
    ${p.next ? `<p style="margin:0 0 12px">${esc(p.next)}</p>` : ''}
    <p style="margin:18px 0"><a href="${esc(link)}" style="display:inline-block;background:#1b4f9c;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">${esc(p.action)}</a></p>
  </div>`;
  const html = `<!doctype html><html><body style="margin:0;background:#fbf6ec;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #eadfc6;border-radius:18px;padding:28px">
  <p style="margin:0 0 20px;font:700 18px Arial,Helvetica,sans-serif;color:#0b2a5b">Multan Chamber of Commerce &amp; Industry</p>
  ${parts.map(block).join('<hr style="border:0;border-top:1px solid #eadfc6;margin:0 0 24px">')}
</div></body></html>`;
  const subject = `${msg('en', `review.email.${kind}Subject`, { token })} · ${msg('ur', `review.email.${kind}Subject`, { token })}`;
  return { to, subject, text, html };
}
