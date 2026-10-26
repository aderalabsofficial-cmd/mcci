import { BadgeCheck, Download, Eye } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { RequestActions } from '@/components/services/member';
import { RequestView } from '@/components/services/request-view';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadMyRequests, loadRequest, serviceCompany } from '@/lib/services/load';
import { loadServices } from '@/lib/site/load';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.application') };
}

export const dynamic = 'force-dynamic';

/**
 * Request detail (prototype member/application): progress, the 24-hour countdown, documents, messages; download when
 * issued; correct and send back when returned. Without ?t the newest sent request is shown.
 */
export default async function RequestPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const m = (k: string) => msg(locale, `svc.detail.${k}`);
  const company = serviceCompany(session.access);
  let token = (await searchParams).t;
  if (!token && company) token = (await loadMyRequests(company.id)).find((r) => !r.draft)?.token;
  const [detail, services] = await Promise.all([token ? loadRequest(token, session.userId) : Promise.resolve(null), loadServices()]);
  if (!detail || detail.draft) {
    return (
      <div className="proto">
        <div className="card em" style={{ textAlign: 'center' }}>
          <h2>{m('none')}</h2>
          <p className="muted">{m('noneSub')}</p>
          <Link className="btn btn-primary" href="/portal/applications" data-action="nav">
            {msg(locale, 'svc.list.title')}
          </Link>
        </div>
      </div>
    );
  }
  const s = services.find((x) => x.key === detail.service_key);
  const canAct = (session.access.companies.find((c) => c.id === detail.company_id)?.levels.svc ?? 0) >= 2;
  return (
    <div className="proto">
      <RequestView
        locale={locale}
        detail={detail}
        serviceName={s ? (locale === 'ur' ? s.name_ur || s.name_en : s.name_en) : detail.service_key}
        hours={s?.sla_hours ?? 24}
        audience="member"
        actions={
          <>
            {canAct && (
              <RequestActions
                locale={locale}
                request={{ id: detail.id, data: detail.data }}
                returned={detail.status === 'Returned'}
                fields={s?.fields ?? []}
                docs={detail.docs.map((d) => ({ id: d.id, file_name: d.file_name, url: d.url }))}
              />
            )}
            {detail.status === 'Issued' && detail.doc && (
              <div className="pb" style={{ marginTop: 10 }}>
                <Link className="btn btn-gold" href={`/portal/application/letter?t=${detail.token}`} data-action="doc.view">
                  <Download size={16} aria-hidden /> {m('download')}
                </Link>
              </div>
            )}
          </>
        }
        issued={
          detail.doc ? (
            <>
              <BadgeCheck size={48} color="#1fa34a" aria-hidden />
              <p className="muted">{detail.doc.code}</p>
              <Link className="btn btn-primary" href={`/portal/application/letter?t=${detail.token}`} data-action="doc.view">
                <Eye size={16} aria-hidden /> {m('view')}
              </Link>
            </>
          ) : null
        }
      />
    </div>
  );
}
