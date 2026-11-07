import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AboutMain } from '@/components/web/gen/about.gen';
import { webProps } from '@/components/web/props';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.about.title') };
}

/** About the Chamber (owner's website design, 6 Nov 2026): introduction, objectives, structure, sub-committees, secretariat, documents */
export default async function AboutPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  return <AboutMain {...webProps(locale)} />;
}
