import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { MembershipMain } from '@/components/web/gen/membership.gen';
import { webProps } from '@/components/web/props';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { loadPublicSettings } from '@/lib/membership/load';
import { msg } from '@/lib/nav/model';
import { readOr } from '@/lib/site/read-or';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.membership.title') };
}

const n = (v: number) => v.toLocaleString('en-US');

/** the class fee table from MCCI's fee settings (Settings → Fees), in the design's markup */
async function FeeTable({ locale }: { locale: Locale }) {
  const m = (k: string) => msg(locale, `landing.${k}`);
  const fees = (await readOr('settings', loadPublicSettings()))?.fees;
  const rows = [
    ['f1', fees?.Corporate],
    ['f2', fees?.Associate],
    ['f3', fees?.Women],
  ] as const;
  return (
    <div className="tbl-wrap mcards" data-r>
      <table className="tbl" data-fees="membership">
        <thead>
          <tr>
            <th>{m('ft_class')}</th>
            <th className="num">{m('ft_adm')}</th>
            <th className="num">{m('ft_ann')}</th>
            <th className="num">{m('ft_card')}</th>
            <th className="num">{m('ft_total')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, f]) => (
            <tr key={k}>
              <td>{m(k)}</td>
              <td className="num">{f ? n(f.admission) : '—'}</td>
              <td className="num">{f ? n(f.subscription) : '—'}</td>
              <td className="num">{f ? n(f.card) : '—'}</td>
              <td className="num">
                <b>{f ? n(f.admission + f.subscription + f.card) : '—'}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Membership (owner's website design, 6 Nov 2026): classes, fees (from MCCI's settings), how to apply, documents, rules, forms */
export default async function MembershipPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  return <MembershipMain {...webProps(locale, { fees: <FeeTable locale={locale} /> })} />;
}
