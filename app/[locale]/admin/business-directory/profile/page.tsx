import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ConsentPanel, OutreachDetails, TagPanel } from '@/components/business/profile-panels';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { loadFacets, loadProfile } from '@/lib/business/load';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ id?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.bizprofile') };
}

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A business: the official record (read only), and apart from it MCCI's outreach details, tags, contact and consent. */
export default async function BusinessProfilePage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'biz', 'screens.admin.bizprofile');
  if (g.denied) return g.denied;
  const m = (k: string) => msg(locale, `biz.profile.${k}`);
  const col = (k: string) => msg(locale, `biz.columns.${k}`);
  const id = (await searchParams).id ?? '';
  const p = UUID.test(id) ? await loadProfile(id) : null;
  const back = (
    <Link className="btn" href="/admin/business-directory" data-action="biz.back">
      <ArrowLeft size={16} aria-hidden /> {m('back')}
    </Link>
  );
  if (!p) {
    return (
      <div className="proto">
        <div className="ph">
          <div>
            <h1>{msg(locale, 'screens.admin.bizprofile')}</h1>
            <p>{m(id ? 'notFound' : 'pickOne')}</p>
          </div>
          <div className="pb">{back}</div>
        </div>
      </div>
    );
  }
  const date = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '—';
  const out = staffLevel(session.access, 'out');
  const official: [string, string][] = [
    ['member_no', p.member_no],
    ['member_class', msg(locale, `biz.values.member_class.${p.member_class}`)],
    ['member_status', msg(locale, `biz.values.member_status.${p.member_status}`)],
    ['member_since', date(p.member_since)],
    ['valid_to', date(p.valid_to)],
    ['business_category', msg(locale, `biz.values.business_category.${p.business_category}`)],
    ['nature', p.nature ?? '—'],
    ['sector', p.sector ?? '—'],
    ['registration', msg(locale, `biz.values.registration.${p.registration}`)],
    ['rep_name', p.rep_name],
  ];
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1 data-business>{p.business_name}</h1>
          <p>{p.member_no}</p>
        </div>
        <div className="pb">{back}</div>
      </div>
      {p.incomplete && <div className="banner orange">{m('incomplete')}</div>}
      <div className="card" data-section="official">
        <div className="ch">
          <h3>{m('official')}</h3>
          <span className="bd blue">{m('readOnly')}</span>
        </div>
        <p className="muted">{m('officialNote')}</p>
        <div className="kv">
          {official.map(([k, v]) => (
            <div key={k}>
              <small>{col(k)}</small>
              <b>{v}</b>
            </div>
          ))}
          {p.contacts && (
            <>
              <div>
                <small>{col('address')}</small>
                <b>{p.contacts.address ?? '—'}</b>
              </div>
              <div>
                <small>{col('tel')}</small>
                <b dir="ltr">{p.contacts.tel ?? '—'}</b>
              </div>
              <div>
                <small>{col('email')}</small>
                <b dir="ltr">{p.contacts.email ?? '—'}</b>
              </div>
            </>
          )}
        </div>
        {!p.can_see_contacts && (
          <p className="muted" data-contacts-hidden>
            {m('contactsHidden')}
          </p>
        )}
      </div>
      <div className="card" data-section="outreach">
        <div className="ch">
          <h3>{m('outreach')}</h3>
          <span className="bd orange">{m('internal')}</span>
        </div>
        <OutreachDetails locale={locale} p={p} canEdit={g.level >= 2} />
      </div>
      <div className="card" data-section="tags">
        <div className="ch">
          <h3>{m('tags')}</h3>
        </div>
        <TagPanel locale={locale} p={p} facets={await loadFacets()} canEdit={g.level >= 2} />
      </div>
      {p.can_see_contacts && (
        <div className="card" data-section="consent">
          <div className="ch">
            <h3>{m('consent')}</h3>
          </div>
          <ConsentPanel locale={locale} p={p} canManage={out >= 2} canLift={out >= 3} />
        </div>
      )}
      <div className="card" data-section="history">
        <div className="ch">
          <h3>{m('history')}</h3>
        </div>
        <div className="tw" tabIndex={0} role="region" aria-label={m('history')}>
          <table>
            <thead>
              <tr>
                <th scope="col">{col('member_no')}</th>
                <th scope="col">{col('member_class')}</th>
                <th scope="col">{col('member_status')}</th>
                <th scope="col">{col('member_since')}</th>
                <th scope="col">{col('valid_to')}</th>
              </tr>
            </thead>
            <tbody>
              {p.memberships.map((h) => (
                <tr className="st" key={h.member_no}>
                  <td>{h.member_no}</td>
                  <td>{msg(locale, `biz.values.member_class.${h.class}`)}</td>
                  <td>{msg(locale, `biz.values.member_status.${h.status}`)}</td>
                  <td>{date(h.since)}</td>
                  <td>{date(h.valid_to)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {p.history.length > 0 && (
          <ul className="biz-history" data-history>
            {p.history.map((h, i) => (
              <li key={i}>
                <b>{date(h.at)}</b> {h.reason ?? m(h.action === 'INSERT' ? 'historyCreated' : 'historyChanged')}
                {h.old_status && h.new_status && h.old_status !== h.new_status
                  ? ` (${h.old_status} → ${h.new_status})`
                  : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
