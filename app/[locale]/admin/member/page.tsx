import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { ActionButton } from '@/components/admin/action-button';
import { FlashProvider } from '@/components/admin/flash';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { staffFileUrl } from '@/lib/files/urls';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ id?: string; tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'memberRecord.title') };
}

export const dynamic = 'force-dynamic';

const TABS = ['particulars', 'partners', 'documents', 'certificates', 'payments', 'history'] as const;
type Tab = (typeof TABS)[number];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TONE: Record<string, string> = {
  Permanent: 'green',
  Temporary: 'blue',
  Expired: 'orange',
  Suspended: 'red',
  Cancelled: 'red',
  Valid: 'green',
  Superseded: 'gray',
  Revoked: 'red',
  Paid: 'green',
  Verified: 'green',
  Pending: 'orange',
  Rejected: 'red',
};

/**
 * Member Record (prototype admin/member; a tab of Members Register): one member's particulars, partners / directors
 * (with their photos), application documents, certificates, payments and history, with the register's actions
 * (renew, restore, blacklist / whitelist) for Members Register ≥ 2. Opened from the register (?id=member id). Each
 * section reads only what the person's own limits allow (RLS): a section they may not see is simply empty. Files open
 * through the logged, watermarked file route (0460).
 */
export default async function MemberRecordPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'reg', 'memberRecord.title');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `memberRecord.${k}`, v);
  const sp = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(sp.tab ?? '') ? (sp.tab as Tab) : 'particulars';
  const date = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
          timeZone: 'Asia/Karachi',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '—';

  const header = (
    <div className="ph">
      <div>
        <h1>{m('title')}</h1>
      </div>
    </div>
  );
  if (!sp.id || !UUID.test(sp.id)) {
    return (
      <div className="proto">
        {header}
        <div className="card">
          <p className="em">
            {m('choose')}{' '}
            <Link href="/admin/members" className="btn" data-action="nav">
              {m('toRegister')}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: member } = await supabase
    .from('members')
    .select(
      'id, member_no, class, women, status, rep_name, since, valid_to, serial, blacklisted, blacklist_note, company_id, companies!inner(name, biz_type, address, ntn, gst, tel, email, web, particulars, nature_sector, established, demo)',
    )
    .eq('id', sp.id)
    .maybeSingle();
  if (!member) {
    return (
      <div className="proto">
        {header}
        <div className="card">
          <p className="em">{m('notFound')}</p>
        </div>
      </div>
    );
  }
  const c = member.companies as unknown as {
    name: string;
    biz_type: string;
    address: string | null;
    ntn: string | null;
    gst: string | null;
    tel: string | null;
    email: string | null;
    web: string | null;
    particulars: string | null;
    nature_sector: string | null;
    established: string | null;
    demo: boolean;
  };
  const { data: app } = await supabase
    .from('applications')
    .select('id, token, decided_at, submitted_at, form')
    .eq('company_id', member.company_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const form = (app?.form ?? {}) as Record<string, unknown>;
  const [partners, docs, certs, vouchers, history] = await Promise.all([
    app
      ? supabase
          .from('application_partners')
          .select('id, position, name, cnic, mobile, email, address, photo_path')
          .eq('application_id', app.id)
          .order('position')
      : Promise.resolve({ data: [] }),
    app
      ? supabase.from('application_documents').select('id, key, file_name, path, status').eq('application_id', app.id)
      : Promise.resolve({ data: [] }),
    supabase
      .from('documents')
      .select('id, code, kind, title, status, valid_to, created_at')
      .eq('company_id', member.company_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('payment_vouchers')
      .select('id, voucher_no, ref_type, amount, status, due_at, paid_at, created_at')
      .eq('company_id', member.company_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('audit_log')
      .select('id, at, user_name, action, object, reason')
      .or(`object_id.eq.${member.id},object_id.eq.${member.member_no}`)
      .order('at', { ascending: false })
      .limit(50),
  ]);
  const appHistory = app
    ? (
        await supabase
          .from('application_history')
          .select('at, step, note, by_name')
          .eq('application_id', app.id)
          .order('at', { ascending: false })
      ).data
    : [];
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  const canAct = staffLevel(session.access, 'reg') >= 2;
  const canCerts = staffLevel(session.access, 'temp') >= 1;

  const field = (label: string, value: ReactNode) => (
    <div className="mr-f">
      <small>{label}</small>
      <b>{value || '—'}</b>
    </div>
  );
  const docLabel = (key: string) => {
    try {
      return msg(locale, `membership.docs.${key}`);
    } catch {
      return key;
    }
  };

  let body: ReactNode = null;
  if (tab === 'particulars') {
    body = (
      <div className="mr-grid" data-section="particulars">
        {field(m('f.name'), c.name)}
        {field(m('f.rep'), member.rep_name)}
        {field(m('f.mobile'), String(form.mobile ?? ''))}
        {field(m('f.email'), c.email)}
        {field(m('f.sector'), c.nature_sector)}
        {field(m('f.biz'), msg(locale, `membership.biz.${c.biz_type}.name`))}
        {field(m('f.address'), c.address)}
        {field(m('f.ntn'), c.ntn)}
        {field(m('f.gst'), c.gst)}
        {field(m('f.tel'), c.tel)}
        {field(m('f.since'), date(member.since))}
        {field(m('f.validTo'), date(member.valid_to))}
        {field(m('f.particulars'), c.particulars)}
      </div>
    );
  } else if (tab === 'partners') {
    const rows = partners.data ?? [];
    body = rows.length ? (
      <div data-section="partners">
        {rows.map((p, i) => (
          <div className="li st" key={p.id} data-partner={i + 1}>
            {p.photo_path ? (
              <a
                className="pphoto"
                href={staffFileUrl('application-docs', p.photo_path)}
                target="_blank"
                rel="noreferrer"
                data-action="member.partner.photo"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- watermarked copy from the file route */}
                <img
                  src={staffFileUrl('application-docs', p.photo_path)}
                  alt={m('partnerPhoto', { n: String(i + 1) })}
                />
              </a>
            ) : (
              <i style={{ background: '#14b8a622', color: '#14b8a6' }}>{i + 1}</i>
            )}
            <div>
              <b>{p.name || '—'}</b>
              <small>
                {p.cnic || '—'} · {p.mobile || '—'}
                {p.email ? ` · ${p.email}` : ''}
              </small>
              {p.address ? <small>{p.address}</small> : null}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="em">{m('none')}</p>
    );
  } else if (tab === 'documents') {
    const rows = docs.data ?? [];
    body = rows.length ? (
      <div data-section="documents">
        {rows.map((d) => (
          <div className="li st" key={d.id}>
            <div>
              <b>{docLabel(d.key)}</b>
              <small>{d.file_name ?? ''}</small>
            </div>
            <span className={`bd ${d.status === 'ok' ? 'green' : d.status === 'rejected' ? 'red' : 'gray'}`}>
              {msg(locale, `review.desk.${d.status === 'ok' ? 'accepted' : d.status}`)}
            </span>
            <a
              className="btn btn-sm"
              href={staffFileUrl('application-docs', d.path)}
              target="_blank"
              rel="noreferrer"
              data-action="member.doc.view"
            >
              {m('view')}
            </a>
          </div>
        ))}
      </div>
    ) : (
      <p className="em">{m('none')}</p>
    );
  } else if (tab === 'certificates') {
    const rows = certs.data ?? [];
    body = rows.length ? (
      <div data-section="certificates">
        {rows.map((d) => (
          <div className="li st" key={d.id}>
            <div>
              <b>{d.title}</b>
              <small>
                {d.code} · {date(d.created_at)}
                {d.valid_to ? ` · ${m('validTo', { d: date(d.valid_to) })}` : ''}
              </small>
            </div>
            <span className={`bd ${TONE[d.status] ?? 'gray'}`}>{d.status}</span>
            <Link
              className="btn btn-sm"
              href={`/verify?code=${encodeURIComponent(d.code)}`}
              data-action="member.cert.verify"
            >
              {m('verify')}
            </Link>
          </div>
        ))}
      </div>
    ) : (
      <p className="em">{m('none')}</p>
    );
  } else if (tab === 'payments') {
    const rows = vouchers.data ?? [];
    body = rows.length ? (
      <div className="tw" tabIndex={0} role="region" aria-label={m('tabs.payments')} data-section="payments">
        <table>
          <thead>
            <tr>
              {(['voucher', 'for', 'amount', 'status', 'paid'] as const).map((k) => (
                <th key={k} scope="col">
                  {m(`pay.${k}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id}>
                <td>
                  <b>{v.voucher_no}</b>
                </td>
                <td>{v.ref_type}</td>
                <td>Rs. {Number(v.amount).toLocaleString('en-PK')}</td>
                <td>
                  <span className={`bd ${TONE[v.status] ?? 'gray'}`}>{v.status}</span>
                </td>
                <td>{date(v.paid_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="em">{m('none')}</p>
    );
  } else {
    const rows = [
      ...(appHistory ?? []).map((h) => ({ at: h.at, what: h.step, note: h.note, by: h.by_name })),
      ...(history.data ?? []).map((h) => ({
        at: h.at,
        what: `${h.action} · ${h.object ?? ''}`,
        note: h.reason,
        by: h.user_name,
      })),
    ].sort((a, b) => b.at.localeCompare(a.at));
    body = rows.length ? (
      <div data-section="history">
        {rows.map((h, i) => (
          <div className="li st" key={i}>
            <div>
              <b>{h.what}</b>
              <small>
                {date(h.at)}
                {h.by ? ` · ${h.by}` : ''}
                {h.note ? ` · ${h.note}` : ''}
              </small>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="em">{m('none')}</p>
    );
  }

  return (
    <div className="proto">
      <FlashProvider>
        <div className="ph">
          <div>
            <h1>{c.name}</h1>
            <p>
              {member.member_no} · {msg(locale, `membership.classes.${member.class}`)}
              {member.women ? ` · ${msg(locale, 'membership.fee.women')}` : ''}{' '}
              <span className={`bd ${TONE[member.status] ?? 'gray'}`}>
                {msg(locale, `register.status.${member.status}`)}
              </span>
              {member.blacklisted && (
                <span className="bd red" title={member.blacklist_note ?? undefined} data-blacklisted>
                  {msg(locale, 'register.life.mustWhitelist')}
                </span>
              )}
              {c.demo && <span className="bd gray">{msg(locale, 'demo.badge')}</span>}
            </p>
          </div>
        </div>
        <div className="pb" style={{ marginBottom: 14 }} data-member={member.member_no}>
          {c.email && (
            <a className="btn" href={`mailto:${c.email}`} data-action="member.message">
              {m('message')}
            </a>
          )}
          {canAct && (member.status === 'Permanent' || member.status === 'Expired') && (
            <ActionButton locale={locale} action="reg.renew" target={member.id} subject={member.member_no} />
          )}
          {canAct && (member.status !== 'Permanent' || member.valid_to < today) && (
            <ActionButton locale={locale} action="reg.restore" target={member.id} subject={member.member_no} />
          )}
          {canAct && (
            <ActionButton
              locale={locale}
              action={member.blacklisted ? 'reg.whitelist' : 'reg.blacklist'}
              target={member.id}
              subject={member.member_no}
            />
          )}
          {canCerts && (
            <Link className="btn btn-primary" href="/admin/temp" data-action="member.cert.upload">
              {m('uploadScan')}
            </Link>
          )}
        </div>
        <nav className="pills" aria-label={m('sections')}>
          {TABS.map((t) => (
            <Link
              key={t}
              href={`/admin/member?id=${member.id}&tab=${t}`}
              className={`pill ${tab === t ? 'on' : ''}`}
              aria-current={tab === t ? 'page' : undefined}
              data-action="member.tab"
            >
              {m(`tabs.${t}`)}
            </Link>
          ))}
        </nav>
        <div className="card">{body}</div>
      </FlashProvider>
    </div>
  );
}
