import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { CalendarDays } from 'lucide-react';
import { NoAccess } from '@/components/admin/no-access';
import { CommitteeAssignment } from '@/components/committee/assignment';
import { CommitteeDesk, type DeskItem } from '@/components/committee/desk';
import { Kpi } from '@/components/review/kpi';
import { PageHeader } from '@/components/shared/page-header';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { type CommitteePerson, type ForwardedFile, loadCommittee, loadForwarded } from '@/lib/committee/load';
import { voucherDate } from '@/lib/committee/voucher';
import { staffFileUrls } from '@/lib/files/urls';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'committee.desk.title') };
}

export const dynamic = 'force-dynamic';

function sub(locale: Locale, a: ForwardedFile): string {
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
 * Membership Committee desk (docs/21 §1 and point 24, migration 0430): who sits on the committee (assigned by the SG,
 * approved by the President) and every file the Membership Officer forwarded — no meeting or agenda first. The
 * Convener decides; members add notes; the officer types a missing number. Staff with module 'cmt' ≥ 1 (or the
 * President) read it; meetings and minutes stay as an optional record.
 */
export default async function CommitteePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const level = staffLevel(session.access, 'cmt');
  const designation = session.access.staff?.designation ?? '';
  const m = (k: string, v?: Record<string, string>) => msg(locale, `committee.desk.${k}`, v);
  if (level < 1 && designation !== 'President (Signatory)') {
    return (
      <>
        <PageHeader locale={locale} title={{ en: msg('en', 'committee.desk.title'), ur: msg('ur', 'committee.desk.title') }} bilingual={false} />
        <NoAccess locale={locale} designation={designation} module="cmt" />
      </>
    );
  }
  const isSg = designation === 'Secretary General' && staffLevel(session.access, 'staff') >= 3;
  const [desk, committee, staff] = await Promise.all([
    loadForwarded(),
    loadCommittee(),
    isSg ? loadStaffChoices() : Promise.resolve<CommitteePerson[]>([]),
  ]);
  const urls = staffFileUrls('application-docs', desk.files.map((a) => a.photo_path));
  const day = (iso: string | null) => (iso ? voucherDate(iso, locale) : '');
  const items: DeskItem[] = desk.files.map((a) => ({
    appId: a.appId,
    token: a.token,
    name: a.name,
    sub: sub(locale, a),
    photo: a.photo_path ? (urls.get(a.photo_path) ?? null) : null,
    memberNo: a.memberNo,
    forwarded: a.forwardedAt ? day(a.forwardedAt) : null,
    notes: a.notes.map((n) => ({ by: n.by ?? '—', at: day(n.at), note: n.note ?? '' })),
    demo: a.demo,
  }));
  const fmt = (x: typeof committee.current) =>
    x ? { ...x, decidedAt: x.decidedAt ? day(x.decidedAt) : null } : null;

  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('subV2')}</p>
        </div>
        <div className="pb">
          <Link className="btn" href="/admin/meetings" data-action="nav">
            <CalendarDays size={16} aria-hidden /> {m('meetings')}
          </Link>
        </div>
      </div>
      <div className="kg">
        <Kpi label={m('kForwarded')} value={desk.files.length} sub={m('kForwardedSub')} icon="award" color="#c8963e" />
        <Kpi label={m('kReady')} value={desk.ready} sub={m('kReadySub')} icon="users" color="#3b82f6" />
        <Kpi label={m('kReturned')} value={desk.counts.returned} sub={m('kReturnedSub')} icon="clock" color="#f59e0b" />
        <Kpi label={m('kPayment')} value={desk.counts.payment} sub={m('kPaymentSub')} icon="card" color="#14b8a6" />
      </div>

      <CommitteeAssignment
        locale={locale}
        current={fmt(committee.current)}
        pending={committee.pending}
        staff={staff}
        canPropose={isSg}
        canApprove={designation === 'President (Signatory)'}
      />

      <div className="card">
        <div className="ch">
          <h3>{m('forwarded')}</h3>
        </div>
        {!committee.current && <p className="muted">{m('noCommitteeYet')}</p>}
        {committee.current && !committee.meConvener && <p className="muted">{m('onlyConvener', { name: committee.current.convener.name })}</p>}
        <CommitteeDesk
          locale={locale}
          items={items}
          canDecide={committee.meConvener}
          canNote={committee.meMember}
          canNumber={staffLevel(session.access, 'mem') >= 2}
        />
      </div>
    </div>
  );
}

/** active staff the Secretary General may put on the committee */
async function loadStaffChoices(): Promise<CommitteePerson[]> {
  const supabase = await createClient();
  const { data } = await supabase.schema('api').rpc('staff_directory');
  return (data ?? [])
    .filter((s) => s.active)
    .map((s) => ({ id: s.user_id, name: s.full_name ?? s.email ?? '—', designation: s.designation }));
}
