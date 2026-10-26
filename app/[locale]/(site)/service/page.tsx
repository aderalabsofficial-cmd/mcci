import { CreditCard, Download, FileText, LogIn, Upload } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { C, PageHero, Section, SitePage } from '@/components/site/blocks';
import { SERVICE_LOOK, serviceName } from '@/components/site/services';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { loadServices } from '@/lib/site/load';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ s?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const key = (await searchParams).s;
  const s = (await loadServices()).find((x) => x.key === key);
  return { title: s ? serviceName(s, locale) : msg(locale, 'site.services.pageTitle') };
}

const HOW = [
  { k: 'how1', icon: LogIn, color: C.CB },
  { k: 'how2', icon: Upload, color: C.GD },
  { k: 'how3', icon: CreditCard, color: C.TL },
  { k: 'how4', icon: Download, color: C.PU },
] as const;

/**
 * Service detail (prototype site/service?s=…): what to prepare and how it works. Online requests are milestone M7;
 * until then "Apply now" is shown disabled with the reason (orphan rule), and the Secretariat's contact is offered.
 */
export default async function ServicePage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const services = await loadServices();
  const key = (await searchParams).s;
  const s = services.find((x) => x.key === key) ?? services[0];
  const m = (k: string, v?: Record<string, string>) => msg(locale, `site.service.${k}`, v);
  if (!s) {
    return (
      <SitePage locale={locale}>
        <PageHero locale={locale} title="site.services.pageTitle" sub="site.service.notFound" />
      </SitePage>
    );
  }
  const look = SERVICE_LOOK[s.key] ?? { icon: FileText, color: C.CB };
  const other = locale === 'en' ? 'ur' : 'en';
  const name = (l: 'en' | 'ur') => (l === 'ur' ? s.name_ur || s.name_en : s.full_name_en || s.name_en);
  return (
    <SitePage locale={locale}>
      <PageHero
        locale={locale}
        title=""
        sub=""
        text={{ title: name(locale), other: name(other), sub: m('response', { hours: String(s.sla_hours) }) }}
      />
      <Section n={1} title={m('need')} sub={m('needSub')} id="need">
        <div className="g2">
          <div className="card">
            <ul className="doclist">
              {s.docs.map((d) => (
                <li key={d}>
                  <FileText size={18} color={look.color} aria-hidden />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
            <h3 style={{ margin: '18px 0 8px', fontWeight: 800 }}>{m('fields')}</h3>
            <ul className="doclist">
              {s.fields.map((f) => (
                <li key={f}>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            {HOW.map((h, i) => (
              <div className="stp st" key={h.k}>
                <i style={{ background: h.color, color: '#fff' }}>{i + 1}</i>
                <div>
                  <b>{m(h.k)}</b>
                  <small>{m(`${h.k}Sub`)}</small>
                </div>
              </div>
            ))}
            <p className="muted" style={{ marginTop: 8 }}>
              {msg(locale, `site.svc.${s.key}.note`)} · {m('fee', { fee: s.fee.toLocaleString('en-US') })}
            </p>
            <div className="pb" style={{ marginTop: 14 }}>
              <button type="button" className="btn btn-primary" disabled aria-disabled="true" title={m('applySoon')} data-action="svc.apply">
                {m('applyNow')}
              </button>
              <Link className="btn" href="/track" data-action="nav">
                {m('trackToken')}
              </Link>
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              {m('applySoon')}
            </p>
          </div>
        </div>
      </Section>
    </SitePage>
  );
}
