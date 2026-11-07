import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ServicesMain } from '@/components/web/gen/services.gen';
import { webProps } from '@/components/web/props';
import { VerifyBox } from '@/components/web/verify-box';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { loadServices, type ServiceType } from '@/lib/site/load';
import { readOr } from '@/lib/site/read-or';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.services.pageTitle') };
}

/** the design's card for each MCCI service key: its anchor, short mark and description (a new service shows its own name) */
const DESIGN: Record<string, { id: string; code: string; d: string; name: string }> = {
  ebil: { id: 'svc-ebil', code: 'EB', d: 'sv_ebil_d', name: 'svc_ebil' },
  visa: { id: 'svc-visa', code: 'VR', d: 'sv_visa_d', name: 'svc_visa' },
  other: { id: 'svc-reco', code: 'RL', d: 'sv_reco_d', name: 'svc_reco' },
  guar: { id: 'svc-china', code: 'CN', d: 'sv_china_d', name: 'svc_china' },
  co: { id: 'svc-co', code: 'CO', d: 'sv_co_d', name: 'svc_co' },
  att: { id: 'svc-attest', code: 'DA', d: 'sv_attest_d', name: 'svc_attest' },
  sample: { id: 'svc-samples', code: 'FS', d: 'sv_samples_d', name: 'svc_samples' },
};
const rs = (n: number) => `Rs ${n.toLocaleString('en-US')}`;

function Cards({ locale, services }: { locale: Locale; services: ServiceType[] | null }) {
  const m = (k: string) => msg(locale, `landing.${k}`);
  const name = (s: ServiceType) => (locale === 'ur' ? s.name_ur || s.name_en : s.name_en);
  return (
    <div className="svc-grid">
      {(services ?? []).map((s) => {
        const d = DESIGN[s.key];
        return (
          <Link
            key={s.key}
            className="svc"
            id={d?.id ?? `svc-${s.key}`}
            href={`/service?s=${s.key}`}
            data-action="svc.open"
            data-service={s.key}
          >
            <span className="svc-ico">{d?.code ?? s.key.slice(0, 2).toUpperCase()}</span>
            <h3>{d ? m(d.name) : name(s)}</h3>
            <p>{d ? m(d.d) : (s.full_name_en ?? name(s))}</p>
            <span className="svc-go" dir="ltr">
              {s.fee ? rs(s.fee) : m('sv_ask')}
            </span>
          </Link>
        );
      })}
      <div className="svc" id="track">
        <span className="svc-ico">#</span>
        <h3>{m('track')}</h3>
        <p>{m('track_d')}</p>
        <Link className="svc-go" href="/track" data-action="nav">
          {m('track_go')}
        </Link>
      </div>
    </div>
  );
}

function Fees({ locale, services }: { locale: Locale; services: ServiceType[] | null }) {
  const m = (k: string) => msg(locale, `landing.${k}`);
  return (
    <table className="tbl" data-fees="services">
      <thead>
        <tr>
          <th>{m('sf_c1')}</th>
          <th className="num">{m('fo_fee')}</th>
        </tr>
      </thead>
      <tbody>
        {(services ?? []).map((s) => (
          <tr key={s.key}>
            <td>{DESIGN[s.key] ? m(DESIGN[s.key]!.name) : locale === 'ur' ? s.name_ur || s.name_en : s.name_en}</td>
            <td className="num">{s.fee ? s.fee.toLocaleString('en-US') : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Services (owner's website design, 6 Nov 2026). The cards and the fee table are MCCI's service list from the
 * database (Settings → Services: names and fees MCCI keeps current); each card opens the real request page. The verify
 * box opens the public verification page.
 */
export default async function ServicesPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const services = await readOr('services', loadServices());
  return (
    <ServicesMain
      {...webProps(locale, {
        cards: <Cards locale={locale} services={services} />,
        fees: <Fees locale={locale} services={services} />,
        verify: <VerifyBox locale={locale} />,
      })}
    />
  );
}
