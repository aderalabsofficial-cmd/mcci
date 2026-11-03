import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PageHero, Section, SitePage, Unavailable } from '@/components/site/blocks';
import { ServiceCards } from '@/components/site/services';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { loadServices } from '@/lib/site/load';
import { readOr } from '@/lib/site/read-or';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.services.pageTitle') };
}

/** Digital Services (prototype site/services): the seven chamber services from service_types */
export default async function ServicesPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const services = await readOr('services', loadServices());
  return (
    <SitePage locale={locale}>
      <PageHero locale={locale} title="site.services.pageTitle" sub="site.services.pageSub" />
      <Section n={1} title={msg(locale, 'site.services.all')} sub={msg(locale, 'site.services.allSub')} id="all">
        {services ? <ServiceCards locale={locale} services={services} /> : <Unavailable locale={locale} />}
      </Section>
    </SitePage>
  );
}
