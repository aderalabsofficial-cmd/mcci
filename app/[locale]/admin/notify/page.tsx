import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { TestEmail } from '@/components/engagement/forms';
import { guardStaff } from '@/components/services/staff-page';
import { asLocale } from '@/i18n/locale';
import { OTHER_TEMPLATES, TEMPLATES } from '@/lib/engagement/templates';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'eng.notify.title') };
}

export const dynamic = 'force-dynamic';

/**
 * Notification Center (prototype admin/notify): every email the platform sends, with how many went out and how many
 * were not delivered (email_log), and "Send test" to the staff member's own address (eng ≥ 2). Wording lives in
 * messages/*.json and ships with a release.
 */
export default async function AdminNotifyPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'eng', 'eng.notify.title');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `eng.notify.${k}`, v);
  const supabase = await createClient();
  const rows = [
    ...TEMPLATES.map((t) => ({ key: t.key, event: m(`events.${t.event}`), test: true })),
    ...OTHER_TEMPLATES.map((k) => ({ key: k, event: m(`events.${k}`), test: false })),
  ];
  const count = async (key: string, failed: boolean) => {
    let q = supabase.from('email_log').select('id', { count: 'exact', head: true }).eq('template_key', key);
    q = failed ? q.eq('status', 'failed') : q.eq('status', 'sent');
    return (await q).count ?? 0;
  };
  const counts = await Promise.all(
    rows.map(async (r) => [await count(r.key, false), await count(r.key, true)] as const),
  );
  const canTest = g.level >= 2;
  const num = (n: number) => n.toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB');
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <section className="card" aria-labelledby="nt-h">
        <div className="ch">
          <h3 id="nt-h">{m('table')}</h3>
        </div>
        <p className="mb-3 text-[14px] text-muted">{m('wording')}</p>
        <div className="tw" tabIndex={0} role="region" aria-label={m('table')}>
          <table>
            <thead>
              <tr>
                {(['event', 'template', 'channels', 'sent', 'failed'] as const).map((c) => (
                  <th key={c} scope="col">
                    {m(`cols.${c}`)}
                  </th>
                ))}
                {canTest && (
                  <th scope="col">
                    <span className="sr-only">{m('test')}</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr className="st" key={r.key} data-template={r.key}>
                  <td>
                    <b>{r.event}</b>
                  </td>
                  <td>
                    <code className="text-[12px]">{r.key}</code>
                  </td>
                  <td>{m('channelsBoth')}</td>
                  <td data-sent={counts[i]![0]}>{num(counts[i]![0])}</td>
                  <td>{counts[i]![1] ? <span className="bd red">{num(counts[i]![1])}</span> : num(0)}</td>
                  {canTest && <td>{r.test && <TestEmail locale={locale} template={r.key} event={r.event} />}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
