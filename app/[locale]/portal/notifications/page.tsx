import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { NotesList } from '@/components/engagement/forms';
import { UrduSwitch } from '@/components/engagement/urdu-switch';
import { both, L } from '@/components/membership/ui';
import { asLocale } from '@/i18n/locale';
import { noteText } from '@/lib/membership/notes';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'eng.notes.title') };
}

export const dynamic = 'force-dynamic';

/**
 * Messages (prototype member/notifications): every portal message (also emailed) with this person's read state, and
 * the language preference. Messages are read under RLS: own, or the company's for areas the person may see.
 */
export default async function NotificationsPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const m = (k: string) => msg(locale, `eng.notes.${k}`);
  const supabase = await createClient();
  const [{ data: notes }, { data: reads }, { data: me }] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, title, body, template, vars, link, created_at, read_at')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('notification_reads').select('notification_id'),
    supabase.from('profiles').select('lang').eq('id', session.userId).single(),
  ]);
  const read = new Set((reads ?? []).map((r) => r.notification_id));
  const when = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>
            <L {...both('eng.notes.title')} />
          </h1>
        </div>
      </div>
      <div className="gr" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <section className="card" aria-labelledby="nt-h">
          <div className="ch">
            <h3 id="nt-h">{m('all')}</h3>
          </div>
          <NotesList
            locale={locale}
            rows={(notes ?? []).map((n) => {
              const t = noteText(locale, n);
              return {
                id: n.id,
                title: t.title,
                body: t.body,
                when: when(n.created_at),
                read: Boolean(n.read_at) || read.has(n.id),
                link: n.link,
              };
            })}
          />
        </section>
        <section className="card" aria-labelledby="pr-h">
          <div className="ch">
            <h3 id="pr-h">{m('reach')}</h3>
          </div>
          <p className="muted" style={{ marginBottom: 12 }}>
            {m('emailAlways')}
          </p>
          <UrduSwitch locale={locale} urduFirst={me?.lang === 'ur'} />
        </section>
      </div>
    </div>
  );
}
