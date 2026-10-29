import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { NoAccess } from '@/components/admin/no-access';
import { CommitteeAdminCard } from '@/components/committee/admin-card';
import { EndorseAdminCard } from '@/components/endorse/admin-card';
import type { SlotEndorsement } from '@/components/endorse/slots';
import { OfficialForm } from '@/components/membership/official-form';
import { STAGE_TONE } from '@/components/review/kpi';
import { type ReviewData, ReviewScreen } from '@/components/review/review-screen';
import { PageHeader } from '@/components/shared/page-header';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { loadAppCommittee } from '@/lib/committee/load';
import { pkr } from '@/lib/committee/voucher';
import { applicableDocs, classOf, fee } from '@/lib/flow/application';
import { loadDocLists, loadEndorsements, loadPublicSettings } from '@/lib/membership/load';
import { FORM_FIELDS } from '@/lib/membership/reference';
import { formEndorser } from '@/lib/membership/view';
import { staffFileUrl, staffFileUrls } from '@/lib/files/urls';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { loadReviewFile } from '@/lib/review/load';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.mreview') };
}

export const dynamic = 'force-dynamic';

const LOW = 85;

/** Application Review (prototype admin/mreview) for the application ?t=<token>. Staff with module 'mem' ≥ 1. */
export default async function ReviewPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const [{ t }, session] = await Promise.all([searchParams, requireUser()]);
  const level = staffLevel(session.access, 'mem');
  const m = (k: string, v?: Record<string, string>) => msg(locale, `review.desk.${k}`, v);
  const title = { en: msg('en', 'review.desk.title'), ur: msg('ur', 'review.desk.title') };
  if (level < 1) {
    return (
      <>
        <PageHeader locale={locale} title={title} bilingual={false} />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module="mem" />
      </>
    );
  }
  const file = t ? await loadReviewFile(t) : null;
  if (!file) {
    return (
      <div className="proto">
        <PageHeader locale={locale} title={title} bilingual={false} />
        <div className="card">
          <p className="muted">{t ? m('notFound') : m('choose')}</p>
          <Link className="btn btn-primary" href="/admin/requests" data-action="nav">
            {m('back')}
          </Link>
        </div>
      </div>
    );
  }

  const [settings, docLists, ends] = await Promise.all([
    loadPublicSettings(),
    loadDocLists(),
    loadEndorsements(file.id),
  ]);
  // staff never get a storage link: the file route logs every view and watermarks images (0460)
  const itConvener = session.access.staff?.designation === 'IT Convener';
  const urls = staffFileUrls('application-docs', [
    ...file.docs.map((d) => d.path),
    file.photo_path,
    file.sign_path,
    file.stamp_path,
    ...ends.map((e) => e.signature_path),
    ...file.partners.map((p) => p.photo_path),
  ]);
  const partnerPhoto = (p: { photo_path: string | null }) => (p.photo_path ? (urls.get(p.photo_path) ?? null) : null);
  const endorsements: SlotEndorsement[] = ends.map((e) => ({
    id: e.id,
    role: e.role,
    status: e.status,
    member_no: e.member_no,
    company: e.company,
    rep: e.rep,
    requested_at: e.requested_at,
    expires_at: e.expires_at,
    decided_at: e.decided_at,
    decline_reason: e.decline_reason,
    ref: e.ref,
    reminders: e.reminders,
    signatureUrl: e.signature_path ? (urls.get(e.signature_path) ?? null) : null,
  }));
  const f = file.form;
  // only the documents this applicant was asked for (sales tax certificate if GST registered, Form C if a registered AOP)
  const reqs = applicableDocs(file.requirements, f);
  const byKey = new Map(file.docs.map((d) => [d.key, d]));
  const cls = file.class ?? classOf(f);
  const accepted = file.docs.filter((d) => d.status === 'ok').length;
  const days = file.submitted_at
    ? Math.max(0, Math.floor((Date.now() - new Date(file.submitted_at).getTime()) / 86_400_000))
    : 0;
  const when = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  const stepLabel = (step: string) => {
    try {
      return msg(locale, `membership.track.steps.${step}`);
    } catch {
      return step;
    }
  };
  const bizLabel = f.biz ? msg(locale, `membership.biz.${f.biz}.name`) : '—';

  const data: ReviewData = {
    id: file.id,
    token: file.token,
    stage: file.stage,
    stageLabel: msg(locale, `review.stages.${file.stage}`),
    stageTone: STAGE_TONE[file.stage] ?? 'gray',
    name: f.name ?? '',
    bizLabel: `${bizLabel}${f.manufacturing ? ` · ${msg(locale, 'membership.cat.mfg.name')}` : ''}`,
    particulars: FORM_FIELDS.filter((k) => k !== 'fax' || f.fax).map((k) => ({
      key: k,
      label: msg(locale, `membership.fields.${k}`),
      value: String(f[k] ?? ''),
      check: file.field_confidence[k] !== undefined && file.field_confidence[k]! < LOW,
    })),
    docs: reqs.map((r) => {
      const d = byKey.get(r.key);
      return {
        id: d?.id ?? '',
        key: r.key,
        short: msg(locale, `membership.docs.${r.key}`),
        label: r.label_en,
        required: r.required,
        file: d ? (r.key === 'photo' ? msg(locale, 'membership.wiz.docs.photoName') : (d.file_name ?? r.key)) : null,
        status: d?.status ?? null,
        reason: d?.reject_reason ?? null,
        url: d ? (urls.get(d.path) ?? null) : null,
        download: d && itConvener ? staffFileUrl('application-docs', d.path, true) : null,
        reuploaded: file.reuploaded.includes(r.key),
      };
    }),
    partners: file.partners.map((p) => ({
      name: p.name,
      cnic: p.cnic,
      mobile: p.mobile,
      email: p.email,
      card: p.extra_card,
      photo: partnerPhoto(p),
    })),
    checks: (['docs', 'identity', 'ntn', 'address'] as const).map((k) => ({
      key: k,
      label: m(`checks.${k}`),
      on: Boolean(file.review.checks?.[k]),
    })),
    history: file.history.map((h) => ({
      title: stepLabel(h.step),
      sub: [when(h.at), h.by_name, h.note].filter(Boolean).join(' · '),
    })),
    emails: file.emails.map((e) => ({
      label: e.template_key ?? '',
      status: e.status ?? 'queued',
      statusLabel: m(`emailStatus.${e.status === 'sent' || e.status === 'failed' ? e.status : 'queued'}`),
      at: when(e.at),
    })),
    kpis: {
      time: m('days', { n: String(days) }),
      timeSub: m('kTimeSub', { n: String(settings.processDays) }),
      docs: `${accepted} / ${reqs.length}`,
      cls: msg(locale, `membership.classes.${cls}`),
      clsSub: file.women ? m('kClassWomen') : m('kClassRule'),
      fee: f.biz
        ? `Rs. ${fee({ ...f }, file.women, file.partners.filter((p) => p.extra_card).length, settings.fees).total.toLocaleString('en-PK')}`
        : '—',
    },
    cls,
    photoUrl: file.photo_path ? (urls.get(file.photo_path) ?? null) : null,
    memberNo: file.member_no,
    endorsed: new Set(ends.filter((e) => e.status === 'Approved').map((e) => e.role)).size === 2,
  };

  const cmtLevel = staffLevel(session.access, 'cmt');
  const committee =
    cmtLevel >= 1 && ['committee', 'payment', 'temp', 'permanent', 'rejected'].includes(file.stage)
      ? await loadAppCommittee(file.id)
      : null;

  const form = (
    <OfficialForm
      form={f}
      partners={file.partners.map((p) => ({ ...p, photo: partnerPhoto(p) }))}
      photo={data.photoUrl}
      sign={file.sign_path ? (urls.get(file.sign_path) ?? null) : null}
      stamp={file.stamp_path ? (urls.get(file.stamp_path) ?? null) : null}
      official={{
        cls: `${cls}${file.women ? ' (Women Entrepreneur)' : ''}`,
        ...(committee?.member_no ? { status: 'Approved', no: committee.member_no } : {}),
        ...(committee?.voucher ? { fee: pkr(committee.voucher.amount) } : {}),
      }}
      proposer={formEndorser(endorsements, 'proposer')}
      seconder={formEndorser(endorsements, 'seconder')}
      chamber={settings.chamber}
      fees={settings.fees}
      processDays={settings.processDays}
      docLists={docLists}
    />
  );

  return (
    <div className="proto">
      <ReviewScreen
        locale={locale}
        data={data}
        level={level}
        form={form}
        endorse={<EndorseAdminCard locale={locale} items={endorsements} canRemind={level >= 2} />}
        committee={
          committee ? <CommitteeAdminCard locale={locale} data={committee} canOpenDesk={cmtLevel >= 1} /> : undefined
        }
      />
    </div>
  );
}
