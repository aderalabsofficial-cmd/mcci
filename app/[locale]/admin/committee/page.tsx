import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { CalendarDays } from 'lucide-react';
import { NoAccess } from '@/components/admin/no-access';
import { CommitteeAgenda, type DeskItem } from '@/components/committee/desk';
import { Kpi } from '@/components/review/kpi';
import { PageHeader } from '@/components/shared/page-header';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { type AgendaItem, canDecideOn, loadDesk } from '@/lib/committee/load';
import { voucherDate } from '@/lib/committee/voucher';
import { signedUrls } from '@/lib/membership/view';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ m?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'committee.desk.title') };
}

export const dynamic = 'force-dynamic';

function sub(locale: Locale, a: AgendaItem): string {
  const parts = [
    a.biz ? msg(locale, `membership.biz.${a.biz}.name`) : null,
    a.cls ? msg(locale, `membership.classes.${a.cls}`) + (a.women ? ` · ${msg(locale, 'committee.desk.women')}` : '') : null,
    a.proposer || a.seconder
      ? msg(locale, 'committee.desk.endorsedBy', { proposer: a.proposer ?? '—', seconder: a.seconder ?? '—' })
      : null,
  ];
  return parts.filter(Boolean).join(' · ');
}

/**
 * Committee Desk (prototype admin/committee): the agenda of a Membership Committee meeting with approve / defer /
 * reject. Staff with module 'cmt' ≥ 1 read it; deciding needs cmt ≥ 3 (Committee Secretary, SG — docs/06).
 */
export default async function CommitteePage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const level = staffLevel(session.access, 'cmt');
  const m = (k: string, v?: Record<string, string>) => msg(locale, `committee.desk.${k}`, v);
  if (level < 1) {
    return (
      <>
        <PageHeader locale={locale} title={{ en: msg('en', 'committee.desk.title'), ur: msg('ur', 'committee.desk.title') }} bilingual={false} />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module="cmt" />
      </>
    );
  }
  const desk = await loadDesk((await searchParams).m);
  const urls = await signedUrls([...desk.agenda, ...desk.waiting].map((a) => a.photo_path));
  const toDesk = (a: AgendaItem): DeskItem => ({
    appId: a.appId,
    token: a.token,
    item: a.item,
    name: a.name,
    sub: sub(locale, a),
    photo: a.photo_path ? (urls.get(a.photo_path) ?? null) : null,
    deferred: a.deferred ? m('deferredFrom', { meeting: a.deferred.meeting, note: a.deferred.note ?? '' }) : null,
  });
  const pending = desk.meetings.filter((x) => x.status === 'Pending');
  const c = desk.current;

  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
        <div className="pb">
          <Link className="btn" href="/admin/meetings" data-action="nav">
            <CalendarDays size={16} aria-hidden /> {m('meetings')}
          </Link>
        </div>
      </div>
      <div className="kg">
        <Kpi label={m('kAgenda')} value={desk.agenda.length} sub={c ? c.id : m('kAgendaNone')} icon="award" color="#c8963e" />
        <Kpi label={m('kApproved')} value={desk.counts.approved} sub={m('kApprovedSub')} icon="check" color="#1fa34a" />
        <Kpi label={m('kDeferred')} value={desk.counts.deferred} sub={m('kDeferredSub')} icon="clock" color="#f59e0b" />
        <Kpi label={m('kPayment')} value={desk.counts.payment} sub={m('kPaymentSub')} icon="card" color="#14b8a6" />
      </div>

      {pending.length > 1 && (
        <nav className="pb" aria-label={m('pickMeeting')} style={{ marginBottom: 12 }}>
          {pending.map((x) => (
            <Link
              key={x.id}
              className={`btn btn-w ${x.id === c?.id ? 'btn-primary' : ''}`}
              href={`/admin/committee?m=${x.id}`}
              aria-current={x.id === c?.id ? 'page' : undefined}
              data-action="nav"
            >
              {x.id} · {x.held_on ? voucherDate(`${x.held_on}T12:00:00+05:00`, locale) : '—'} ({x.open})
            </Link>
          ))}
        </nav>
      )}

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="ch">
          <h3>
            {c
              ? m('agendaOf', {
                  meeting: c.name,
                  id: c.id,
                  date: c.held_on ? voucherDate(`${c.held_on}T12:00:00+05:00`, locale) : '—',
                })
              : m('agenda')}
          </h3>
        </div>
        {c ? (
          // stays mounted when the last file leaves the agenda, so the confirmation of that decision stays visible
          <CommitteeAgenda
            locale={locale}
            meeting={c.id}
            items={desk.agenda.map(toDesk)}
            canDecide={level >= 3}
            heldYet={canDecideOn(c)}
            approveAllSlot="header"
            empty={m('emptyAgenda')}
          />
        ) : (
          <p className="em">
            {m('noMeeting')}{' '}
            <Link href="/admin/meetings" data-action="nav">
              {m('scheduleLink')}
            </Link>
          </p>
        )}
      </div>

      {desk.waiting.length > 0 && (
        <div className="card">
          <div className="ch">
            <h3>{m('waiting')}</h3>
          </div>
          <p className="muted" style={{ marginBottom: 10 }}>
            {m('waitingHelp')}
          </p>
          <CommitteeAgenda
            locale={locale}
            meeting=""
            items={desk.waiting.map(toDesk)}
            canDecide={false}
            heldYet={false}
            approveAllSlot="none"
          />
        </div>
      )}
    </div>
  );
}
