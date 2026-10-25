import 'server-only';
import type { OutgoingEmail } from '@/lib/email/send';
import { msg } from '@/lib/nav/model';

/**
 * One email in English and Urdu (docs/07: members' language is not always known), from messages/*.json keys:
 * a greeting, paragraphs, an optional quoted block (e.g. a reason or a one-time code), and one button to APP_URL.
 * Links always point at APP_URL, never at the request's Host header.
 */
export interface BilingualMail {
  to: string;
  name?: string | null;
  subject: string;
  paragraphs: string[];
  vars?: Record<string, string>;
  quote?: string | null;
  /** shown large and spaced, e.g. a 6-digit code */
  code?: string | null;
  action?: { label: string; path: string };
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function appUrl(path: string, env: NodeJS.ProcessEnv = process.env): string {
  const app = env.APP_URL;
  if (!app) throw new Error('APP_URL is not set: email links cannot be built');
  return `${app.replace(/\/+$/, '')}${path}`;
}

export function bilingualEmail(m: BilingualMail, env: NodeJS.ProcessEnv = process.env): OutgoingEmail {
  const vars = m.vars ?? {};
  const link = m.action ? appUrl(m.action.path, env) : null;
  const parts = (['en', 'ur'] as const).map((l) => ({
    lang: l,
    greeting: msg(l, 'membership.email.greeting', { name: m.name || m.to }),
    paragraphs: m.paragraphs.map((p) => msg(l, p, vars)),
    action: m.action ? msg(l, m.action.label, vars) : null,
  }));
  const quote = m.quote?.trim() || '';
  const text = parts
    .map((p) =>
      [
        p.greeting,
        '',
        ...p.paragraphs.flatMap((x) => [x, '']),
        ...(m.code ? [m.code, ''] : []),
        ...(quote ? [quote, ''] : []),
        ...(p.action && link ? [`${p.action}: ${link}`] : []),
      ].join('\n'),
    )
    .join('\n\n— — —\n\n');
  const block = (p: (typeof parts)[number]) => `
  <div dir="${p.lang === 'ur' ? 'rtl' : 'ltr'}" lang="${p.lang}" style="margin:0 0 28px;font:16px/1.6 ${
    p.lang === 'ur' ? "'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',Tahoma,serif" : 'Arial,Helvetica,sans-serif'
  };color:#0e1b33">
    <p style="margin:0 0 12px">${esc(p.greeting)}</p>
    ${p.paragraphs.map((x) => `<p style="margin:0 0 12px">${esc(x)}</p>`).join('')}
    ${m.code ? `<p dir="ltr" style="margin:6px 0 14px;font:700 30px/1 'Courier New',monospace;letter-spacing:8px;color:#0b2a5b">${esc(m.code)}</p>` : ''}
    ${quote ? `<p dir="auto" style="margin:0 0 12px;padding:10px 14px;background:#faf4e6;border-radius:10px">${esc(quote)}</p>` : ''}
    ${p.action && link ? `<p style="margin:18px 0"><a href="${esc(link)}" style="display:inline-block;background:#1b4f9c;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">${esc(p.action)}</a></p>` : ''}
  </div>`;
  const html = `<!doctype html><html><body style="margin:0;background:#fbf6ec;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #eadfc6;border-radius:18px;padding:28px">
  <p style="margin:0 0 20px;font:700 18px Arial,Helvetica,sans-serif;color:#0b2a5b">Multan Chamber of Commerce &amp; Industry</p>
  ${parts.map(block).join('<hr style="border:0;border-top:1px solid #eadfc6;margin:0 0 24px">')}
</div></body></html>`;
  const subject = `${msg('en', m.subject, vars)} · ${msg('ur', m.subject, vars)}`;
  return { to: m.to, subject, text, html };
}
