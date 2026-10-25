import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { FlashProvider } from '@/components/admin/flash';
import { NoAccess } from '@/components/admin/no-access';
import { Ic } from '@/components/membership/ui';
import { VoucherTable } from '@/components/payments/voucher-table';
import { PageHeader } from '@/components/shared/page-header';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { loadVouchers } from '@/lib/payments/load';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'pay.psid.title') };
}

export const dynamic = 'force-dynamic';

/**
 * Vouchers & Receipts (prototype admin/psid): how payment works today (manual: Accounts verify against the bank
 * statement; automatic bank confirmation is a later phase, docs/00) and every voucher with its actions (pay ≥ 2).
 */
export default async function PsidPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const level = staffLevel(session.access, 'pay');
  const m = (k: string) => msg(locale, `pay.psid.${k}`);
  if (level < 1) {
    return (
      <>
        <PageHeader locale={locale} title={{ en: msg('en', 'pay.psid.title'), ur: msg('ur', 'pay.psid.title') }} bilingual={false} />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module="pay" />
      </>
    );
  }
  const rows = await loadVouchers();
  const steps: [string, string][] = [
    ['file', 'issued'],
    ['landmark', 'pays'],
    ['upload', 'uploaded'],
    ['check', 'verify'],
    ['hourglass', 'temp'],
  ];
  return (
    <div className="proto">
      <FlashProvider>
        <div className="ph">
          <div>
            <h1>{m('title')}</h1>
            <p>{m('sub')}</p>
          </div>
        </div>
        <div className="card tmp-flow" style={{ marginBottom: 18 }}>
          <div className="ch">
            <h3>{m('how')}</h3>
            <span className="bd blue">{m('manual')}</span>
          </div>
          <div className="tflow">
            {steps.map(([icon, k], i) => (
              <div key={k}>
                <i>
                  <Ic name={icon} color="#fff" size={20} />
                </i>
                <b>
                  {i + 1}. {m(`steps.${k}.t`)}
                </b>
                <small>{m(`steps.${k}.d`)}</small>
              </div>
            ))}
          </div>
        </div>
        <VoucherTable locale={locale} rows={rows} title={m('table')} canAct={level >= 2} dateCol="due" />
      </FlashProvider>
    </div>
  );
}
