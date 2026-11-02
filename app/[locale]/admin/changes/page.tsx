import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { DeclarationDecision } from '@/components/members/lifecycle';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { staffFileUrl } from '@/lib/files/urls';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.changes') };
}

export const dynamic = 'force-dynamic';

const TONE: Record<string, string> = { Pending: 'orange', Approved: 'green', Rejected: 'red' };

/** Change Declarations (owner's list of 1 Nov 2026): the review queue. Approval updates the member's live profile. */
export default async function ChangesPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'chg', 'screens.admin.changes');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `register.life.review.${k}`, v);
  const f = (k: string) => msg(locale, `register.life.change.fields.${k}`);
  const supabase = await createClient();
  const { data } = await supabase
    .from('change_declarations')
    .select('id, context, summary, fields, documents, status, created_at, decided_at, decision_note, member_id, companies(name), members(member_no)')
    .order('created_at', { ascending: false })
    .limit(200);
  const rows = data ?? [];
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', year: 'numeric' });
  const card = (d: (typeof rows)[number]) => {
    const fields = (d.fields ?? []) as { field: string; old: string | null; new: string }[];
    const docs = (d.documents ?? []) as { path: string; name: string }[];
    const co = d.companies as unknown as { name: string } | null;
    const mem = d.members as unknown as { member_no: string } | null;
    return (
      <section className="card" key={d.id} data-declaration={d.id} data-status={d.status} data-company={co?.name}>
        <div className="ch">
          <h3>
            {d.member_id ? (
              <Link href={`/admin/member?id=${d.member_id}`} data-action="member.open" className="rowlink">
                {co?.name ?? '—'}
              </Link>
            ) : (
              (co?.name ?? '—')
            )}
          </h3>
          <span className={`bd ${TONE[d.status] ?? 'gray'}`}>{m(`status.${d.status}`)}</span>
        </div>
        <p className="muted">
          {mem?.member_no ?? ''} · {date(d.created_at)} · {m(`context.${d.context}`)}
        </p>
        <p dir="auto">{d.summary}</p>
        {fields.length > 0 && (
          <div className="tw" tabIndex={0} role="region" aria-label={m('fields')}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{m('field')}</th>
                  <th scope="col">{m('old')}</th>
                  <th scope="col">{m('new')}</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((x) => (
                  <tr key={x.field}>
                    <td>{f(x.field)}</td>
                    <td dir="auto">{x.old || '—'}</td>
                    <td dir="auto">
                      <b>{x.new}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pb" style={{ marginTop: 10 }}>
          {docs.map((doc) => (
            <a key={doc.path} className="btn btn-w" href={staffFileUrl('member-docs', doc.path)} target="_blank" rel="noreferrer" data-action="chg.doc">
              {doc.name}
            </a>
          ))}
        </div>
        {d.decision_note && <p className="muted">{d.decision_note}</p>}
        {d.status === 'Pending' && g.level >= 3 && <DeclarationDecision locale={locale} id={d.id} />}
      </section>
    );
  };
  const pending = rows.filter((r) => r.status === 'Pending');
  const decided = rows.filter((r) => r.status !== 'Pending');
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <h2 className="fin-title">{m('waiting', { n: String(pending.length) })}</h2>
      {pending.length ? pending.map(card) : <p className="em card">{m('none')}</p>}
      {decided.length > 0 && (
        <>
          <h2 className="fin-title">{m('decided')}</h2>
          {decided.map(card)}
        </>
      )}
    </div>
  );
}
