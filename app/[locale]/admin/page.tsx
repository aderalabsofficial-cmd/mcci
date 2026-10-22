import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.dashboard') };
}

/** Staff dashboard. M0: the frame only; needs-attention list, KPIs and charts arrive with the data (M1+). */
export default async function AdminHomePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        locale={locale}
        title={{ en: msg('en', 'screens.admin.dashboard'), ur: msg('ur', 'screens.admin.dashboard') }}
        bilingual={false}
      />
      <section className="rounded-[var(--card-radius)] border border-line bg-card p-[var(--card-pad)] sm:shadow-card">
        <h2 className="text-[length:var(--section-title)] font-bold">{msg(locale, 'admin.glanceTitle')}</h2>
        <p className="mt-1 text-muted">{msg(locale, 'admin.glanceBody')}</p>
      </section>
    </>
  );
}
