import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { startApplication } from '@/lib/membership/actions';
import type { MyApplication, MyMembership } from '@/lib/membership/load';
import { pkr, voucherDate } from '@/lib/committee/voucher';
import { msg } from '@/lib/nav/model';
import { both, Ic, L, NextCard } from './ui';

/**
 * An existing member (added by MCCI, imported, or a labelled demo member) without an open online application: their
 * membership, the proposer / seconder requests waiting for them, and services — never "start an application".
 */
function MemberNext({ member, locale }: { member: MyMembership; locale: Locale }) {
  const t = (k: string, vars?: Record<string, string>) => msg(locale, `membership.next.member.${k}`, vars);
  const active = member.status === 'Permanent' || member.status === 'Temporary';
  const k = active ? 't' : member.status === 'Suspended' ? 'tSuspended' : 'tExpired';
  const vars = { no: member.member_no, cls: msg(locale, `membership.classes.${member.class}`), until: voucherDate(`${member.valid_to}T12:00:00+05:00`, locale) };
  const body = [
    member.demo ? t('demo') : '',
    active ? t('d', vars) : t('dExpired', vars),
    member.pendingEndorsements > 0 ? t('waiting', { n: String(member.pendingEndorsements) }) : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <NextCard tone={active ? (member.status === 'Temporary' ? 'teal' : 'green') : 'red'} icon={active ? 'badge' : 'flag'} title={both(`membership.next.member.${k}`)} body={body}>
      {member.pendingEndorsements > 0 && (
        <Link className="btn btn-gold btn-big" href="/portal/endorse" data-action="nav">
          <Ic name="signature" /> <L {...both('membership.next.member.requests', { n: String(member.pendingEndorsements) })} />
        </Link>
      )}
      <Link className="btn btn-big" href="/portal/membership" data-action="nav">
        <Ic name="award" /> <L {...both('membership.next.myMembership')} />
      </Link>
      {active && (
        <Link className="btn btn-big" href="/portal/apply" data-action="nav">
          <Ic name="file" /> <L {...both('membership.next.member.service')} />
        </Link>
      )}
    </NextCard>
  );
}

/** "What to do now" for the member's stage (prototype member.js next()) */
export function HomeNext({ app, locale, member = null }: { app: MyApplication | null; locale: Locale; member?: MyMembership | null }) {
  const t = (k: string, vars?: Record<string, string>) => msg(locale, `membership.next.${k}`, vars);
  // already a member and no application in progress: the membership itself
  if (member && (!app || ['withdrawn', 'draft', 'rejected', 'permanent'].includes(app.stage))) {
    return <MemberNext member={member} locale={locale} />;
  }
  const progress = (
    <Link className="btn btn-big" href="/portal/mtrack" data-action="nav">
      <Ic name="clock" /> <L {...both('membership.next.progress')} />
    </Link>
  );
  const start = (label: string) => (
    <form action={startApplication}>
      <input type="hidden" name="locale" value={locale} />
      <button type="submit" className="btn btn-gold btn-big" data-action="register.start">
        <Ic name="send" /> <L {...both(label)} />
      </button>
    </form>
  );

  if (!app || app.stage === 'withdrawn') {
    const k = app ? 'withdrawn' : 'start';
    return (
      <NextCard tone="gold" icon="filePlus" title={both(`membership.next.${k}.t`)} body={t(`${k}.d`)}>
        {start(`membership.next.${k}.b`)}
      </NextCard>
    );
  }
  switch (app.stage) {
    case 'draft':
      return (
        <NextCard
          tone="gold"
          icon="filePlus"
          title={both('membership.next.draft.t')}
          body={t('draft.d', { step: String((app.form.step ?? 0) + 1) })}
        >
          <Link className="btn btn-gold btn-big" href="/portal/join" data-action="nav">
            <Ic name="send" /> <L {...both('membership.next.draft.b')} />
          </Link>
        </NextCard>
      );
    case 'submitted':
    case 'review':
      return (
        <NextCard tone="blue" icon="shield" title={both('membership.next.review.t')} body={t('review.d')}>
          {progress}
        </NextCard>
      );
    case 'returned':
      return (
        <NextCard
          tone="red"
          icon="flag"
          title={both('membership.next.returned.t')}
          body={app.return_note || t('returned.d')}
        >
          <Link className="btn btn-danger btn-big" href="/portal/join" data-action="nav">
            <Ic name="flag" color="#fff" /> <L {...both('membership.next.returned.b')} />
          </Link>
        </NextCard>
      );
    case 'proposer':
      return (
        <NextCard tone="gold" icon="users" title={both('membership.next.proposer.t')} body={t('proposer.d')}>
          <Link className="btn btn-gold btn-big" href="/portal/join#endorse" data-action="nav">
            <Ic name="users" /> <L {...both('membership.next.proposer.b')} />
          </Link>
        </NextCard>
      );
    case 'committee':
      return (
        <NextCard
          tone="blue"
          icon="award"
          title={both('membership.next.committee.t')}
          body={
            app.agenda
              ? `${t('committee.agenda', { meeting: app.agenda.meeting, item: String(app.agenda.item ?? '') })} ${t('committee.d')}`
              : t('committee.d')
          }
        >
          {progress}
        </NextCard>
      );
    case 'payment': {
      // receipt with Accounts → blue; receipt not accepted → the reason (prototype member.js next())
      const v = app.voucher;
      if (v?.status === 'Receipt uploaded' || v?.status === 'Rejected') {
        const k = v.status === 'Rejected' ? 'paymentRejected' : 'paymentReceived';
        return (
          <NextCard
            tone={k === 'paymentRejected' ? 'red' : 'blue'}
            icon="card"
            title={both(`membership.next.${k}.t`)}
            body={k === 'paymentRejected' ? `${t(`${k}.d`)} ${v.reject_reason ?? ''}` : t(`${k}.d`, { voucher: v.no })}
          >
            <Link className="btn btn-gold btn-big" href="/portal/payments" data-action="psid.show">
              <Ic name="card" /> <L {...both(`membership.next.${k}.b`)} />
            </Link>
          </NextCard>
        );
      }
      return (
        <NextCard
          tone="gold"
          icon="card"
          title={both('membership.next.payment.t')}
          body={
            app.voucher
              ? t('payment.voucher', {
                  no: app.member_no ?? '',
                  voucher: app.voucher.no,
                  amount: pkr(app.voucher.amount),
                  due: voucherDate(app.voucher.due_at, locale),
                })
              : t('payment.d')
          }
        >
          <Link className="btn btn-gold btn-big" href="/portal/payments" data-action="psid.show">
            <Ic name="card" /> <L {...both('membership.next.payment.b')} />
          </Link>
          {progress}
        </NextCard>
      );
    }
    case 'temp':
    case 'permanent': {
      const k = app.stage;
      return (
        <NextCard
          tone={k === 'temp' ? 'teal' : 'green'}
          icon={k === 'temp' ? 'hourglass' : 'check'}
          title={both(`membership.next.${k}.t`)}
          body={
            k === 'temp' && app.temp
              ? t(app.temp.status === 'expired' ? 'tempExpired' : 'tempUntil', {
                  no: app.member_no ?? '',
                  until: voucherDate(app.temp.expires_at, locale),
                })
              : t(`${k}.d`)
          }
        >
          {app.temp?.code && (
            <Link className="btn btn-gold btn-big" href={`/portal/documents?code=${app.temp.code}`} data-action="doc.view">
              <Ic name="file" /> <L {...both('membership.next.certificate')} />
            </Link>
          )}
          <Link className="btn btn-big" href="/portal/membership" data-action="nav">
            <Ic name="award" /> <L {...both('membership.next.myMembership')} />
          </Link>
        </NextCard>
      );
    }
    default:
      return (
        <NextCard
          tone="red"
          icon="x"
          title={both('membership.next.rejected.t')}
          body={app.reject_note || t('rejected.d')}
        >
          {progress}
        </NextCard>
      );
  }
}
