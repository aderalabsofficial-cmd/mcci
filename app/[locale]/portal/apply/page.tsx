import { Lock } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { both, L } from '@/components/membership/ui';
import { ServicePicker, ServiceWizard } from '@/components/services/member';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { aiEnabled } from '@/lib/ai/extract';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadEligible, loadRequest, serviceCompany } from '@/lib/services/load';
import { svcLook } from '@/lib/services/reference';
import { loadServices } from '@/lib/site/load';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ r?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.apply') };
}

export const dynamic = 'force-dynamic';

/**
 * Request a Service (prototype member/apply): the seven services as big tiles, locked until the membership is active
 * (temporary counts when MCCI allows it); with ?r=<draft> the 4-step request: documents, AI reading, details, submit.
 */
export default async function ApplyPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const m = (k: string, v?: Record<string, string>) => msg(locale, `svc.apply.${k}`, v);
  const company = serviceCompany(session.access);
  const [services, eligible, sp] = await Promise.all([loadServices(), company ? loadEligible(company.id) : Promise.resolve(false), searchParams]);
  const hours = services[0]?.sla_hours ?? 24;

  if (sp.r && company) {
    const supabase = await createClient();
    const { data } = await supabase.from('service_requests').select('token, draft').eq('id', sp.r).maybeSingle();
    const detail = data?.draft ? await loadRequest(data.token, session.userId) : null;
    const s = detail ? services.find((x) => x.key === detail.service_key) : null;
    if (detail && s) {
      return (
        <div className="proto">
          <ServiceWizard
            locale={locale}
            aiOn={aiEnabled()}
            request={{ id: detail.id, data: detail.data }}
            service={{
              name: s.full_name_en || s.name_en,
              ur: s.name_ur ?? '',
              fee: s.fee,
              hours: s.sla_hours,
              docs: s.docs,
              fields: s.fields,
              note: msg(locale, `site.svc.${s.key}.note`),
            }}
            docs={detail.docs.map((d) => ({ id: d.id, file_name: d.file_name, url: d.url }))}
          />
        </div>
      );
    }
  }

  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>
            <L {...both('svc.apply.title')} />
          </h1>
          <p>{m('sub', { hours: String(hours) })}</p>
        </div>
      </div>
      {!eligible && (
        <div className="banner orange" role="status" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <Lock size={18} aria-hidden />
          <span style={{ flex: 1 }}>
            <b>{m('locked')}</b> {m('lockedSub')}
          </span>
          <Link className="btn btn-w" href="/portal/membership" data-action="nav">
            {m('myMembership')}
          </Link>
        </div>
      )}
      <ServicePicker
        locale={locale}
        companyId={company?.id ?? ''}
        open={eligible && !!company && (company.levels.svc ?? 0) >= 2}
        services={services.map((s) => ({
          key: s.key,
          name: s.name_en,
          ur: s.name_ur ?? '',
          fee: s.fee,
          hours: s.sla_hours,
          ...svcLook(s.key),
        }))}
      />
    </div>
  );
}
