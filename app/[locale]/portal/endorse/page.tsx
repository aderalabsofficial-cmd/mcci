import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { EndorseInbox, type InboxRow } from '@/components/endorse/inbox';
import { Kpi } from '@/components/review/kpi';
import { both, L } from '@/components/membership/ui';
import { asLocale } from '@/i18n/locale';
import { loadPublicSettings } from '@/lib/membership/load';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.endorse') };
}

export const dynamic = 'force-dynamic';

/** Endorsement requests (prototype member/endorse): requests to the member companies this person acts for. */
export default async function EndorsePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const [session, settings] = await Promise.all([requireUser(), loadPublicSettings()]);
  const supabase = await createClient();
  const { data, error } = await supabase.schema('api').rpc('end_inbox');
  if (error) throw new Error(`end_inbox: ${error.message}`);
  const m = (k: string, v?: Record<string, string>) => msg(locale, `endorse.${k}`, v);
  const est = (iso: string | null) =>
    iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)
      ? new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';
  const rows: InboxRow[] = (data ?? []).map((r) => ({
    id: r.id,
    role: r.role as 'proposer' | 'seconder',
    status: r.status,
    member_no: r.member_no,
    my_company: r.my_company,
    message: r.message,
    requested_at: r.requested_at,
    expires_at: r.expires_at,
    token: r.token,
    applicant: r.applicant ?? '',
    business: r.business ?? '',
    bizLabel: r.biz
      ? `${msg(locale, `membership.biz.${r.biz}.name`)}${r.manufacturing ? ` · ${msg(locale, 'membership.biz.mfg.name')}` : ''}`
      : '—',
    nature: r.nature ?? '',
    address: r.address ?? '',
    est: est(r.est),
    cls: r.class ? msg(locale, `membership.classes.${r.class}`) : '',
    partners: r.partners ?? [],
  }));
  const year = rows.filter((r) => r.status === 'Approved').length;
  const isMember = session.access.companies.length > 0 && rows.length > 0;

  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>
            <L {...both('endorse.inbox.title')} />
          </h1>
          <p>{isMember || rows.length ? m('inbox.sub') : m('inbox.notMember')}</p>
        </div>
      </div>
      <div className="kg">
        <Kpi
          label={m('inbox.kWaiting')}
          value={rows.filter((r) => r.status === 'Pending').length}
          sub={m('inbox.kWaitingSub', { days: String(settings.endorse.days) })}
          icon="clock"
          color="#f59e0b"
        />
        <Kpi
          label={m('inbox.kSigned')}
          value={year}
          sub={m('inbox.kSignedSub', { max: String(settings.endorse.maxPerYear) })}
          icon="signature"
          color="#1fa34a"
        />
        <Kpi
          label={m('inbox.kDeclined')}
          value={rows.filter((r) => r.status === 'Declined').length}
          icon="x"
          color="#ef4444"
        />
      </div>
      <EndorseInbox
        locale={locale}
        rows={rows}
        me={session.access.full_name ?? ''}
        needCode={settings.endorse.needCode}
      />
    </div>
  );
}
