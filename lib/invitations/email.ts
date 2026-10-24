import 'server-only';
import { msg } from '@/lib/nav/model';
import { sendEmail, type OutgoingEmail } from '@/lib/email/send';

/**
 * The invitation email (actions staff.invite / staff.resend / user.invite / user.resend). English and Urdu in one
 * message, because the invitee's language is not known yet. The link carries the one-time token (shown nowhere
 * else: the database keeps only its hash) and always points at APP_URL, never at the request's Host header.
 */
export interface InvitationMail {
  to: string;
  name: string | null;
  inviter: string;
  token: string;
  kind: 'staff' | 'company_user';
  designation?: string | null;
  company?: string | null;
  role?: string | null;
  note?: string | null;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function invitationLink(token: string, env: NodeJS.ProcessEnv = process.env): string {
  const app = env.APP_URL;
  if (!app) throw new Error('APP_URL is not set: invitation links cannot be built');
  return `${app.replace(/\/+$/, '')}/invite/${encodeURIComponent(token)}`;
}

export function invitationEmail(mail: InvitationMail, env: NodeJS.ProcessEnv = process.env): OutgoingEmail {
  const link = invitationLink(mail.token, env);
  const parts = (['en', 'ur'] as const).map((l) => {
    const vars = {
      name: mail.name || mail.to,
      inviter: mail.inviter,
      designation: mail.designation ?? '',
      company: mail.company ?? '',
      role: mail.role ? msg(l, `access.roleNames.${mail.role}`) : '',
      email: mail.to,
    };
    return {
      lang: l,
      greeting: msg(l, 'access.invite.emailGreeting', vars),
      body: msg(l, mail.kind === 'staff' ? 'access.invite.emailStaff' : 'access.invite.emailCompany', vars),
      action: msg(l, 'access.invite.emailAction'),
      expiry: msg(l, 'access.invite.emailExpiry', vars),
      noteLabel: msg(l, 'access.invite.emailNote', vars),
    };
  });
  const note = mail.note?.trim() || null;

  const text = parts
    .map((p) =>
      [p.greeting, '', p.body, ...(note ? ['', p.noteLabel, note] : []), '', `${p.action}: ${link}`, '', p.expiry].join(
        '\n',
      ),
    )
    .join('\n\n— — —\n\n');

  const block = (p: (typeof parts)[number]) => `
  <div dir="${p.lang === 'ur' ? 'rtl' : 'ltr'}" lang="${p.lang}" style="margin:0 0 28px;font:16px/1.6 ${
    p.lang === 'ur' ? "'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',Tahoma,serif" : 'Arial,Helvetica,sans-serif'
  };color:#0e1b33">
    <p style="margin:0 0 12px">${esc(p.greeting)}</p>
    <p style="margin:0 0 12px">${esc(p.body)}</p>
    ${note ? `<p style="margin:0 0 4px;color:#55687f">${esc(p.noteLabel)}</p><p style="margin:0 0 12px;padding:10px 14px;background:#faf4e6;border-radius:10px">${esc(note)}</p>` : ''}
    <p style="margin:18px 0"><a href="${esc(link)}" style="display:inline-block;background:#1b4f9c;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">${esc(p.action)}</a></p>
    <p style="margin:0;color:#55687f;font-size:14px">${esc(p.expiry)}</p>
  </div>`;

  const html = `<!doctype html><html><body style="margin:0;background:#fbf6ec;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #eadfc6;border-radius:18px;padding:28px">
  <p style="margin:0 0 20px;font:700 18px Arial,Helvetica,sans-serif;color:#0b2a5b">Multan Chamber of Commerce &amp; Industry</p>
  ${parts.map(block).join('<hr style="border:0;border-top:1px solid #eadfc6;margin:0 0 24px">')}
</div></body></html>`;

  const subject = `${msg('en', 'access.invite.emailSubject')} · ${msg('ur', 'access.invite.emailSubject')}`;
  return { to: mail.to, subject, text, html };
}

/** Sends the invitation; false (and a log line without the token) when delivery failed. */
export async function sendInvitation(mail: InvitationMail): Promise<boolean> {
  try {
    await sendEmail(invitationEmail(mail));
    return true;
  } catch (error) {
    console.error('invitation email not sent', mail.kind, error instanceof Error ? error.message : 'unknown error');
    return false;
  }
}
