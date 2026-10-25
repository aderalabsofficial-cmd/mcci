import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { NoAccess } from '@/components/admin/no-access';
import { MeetingsTable } from '@/components/committee/meetings';
import { PageHeader } from '@/components/shared/page-header';
import { asLocale } from '@/i18n/locale';
import { karachiToday, loadMeetings } from '@/lib/committee/load';
import { voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'committee.meetings.title') };
}

export const dynamic = 'force-dynamic';

/**
 * Meetings & Minutes (prototype admin/meetings): every committee meeting with its agenda size or minutes. Reading needs
 * module 'cmt' ≥ 1; scheduling and minutes cmt ≥ 2 (checked again in api.cmt_meeting_create / api.cmt_minutes).
 */
export default async function MeetingsPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const level = staffLevel(session.access, 'cmt');
  const m = (k: string, v?: Record<string, string>) => msg(locale, `committee.meetings.${k}`, v);
  if (level < 1) {
    return (
      <>
        <PageHeader locale={locale} title={{ en: msg('en', 'committee.meetings.title'), ur: msg('ur', 'committee.meetings.title') }} bilingual={false} />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module="cmt" />
      </>
    );
  }
  const meetings = await loadMeetings();
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <MeetingsTable
        locale={locale}
        canEdit={level >= 2}
        today={karachiToday()}
        rows={meetings.map((x) => ({
          id: x.id,
          name: x.name,
          committee: x.committee,
          date: x.held_on ? voucherDate(`${x.held_on}T12:00:00+05:00`, locale) : '—',
          agenda: m('agendaCount', { open: String(x.open), decided: String(x.decided) }),
          status: x.status,
          minutes: x.minutes,
        }))}
      />
    </div>
  );
}
