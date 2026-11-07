import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { LeadershipMain } from '@/components/web/gen/leadership.gen';
import { webProps } from '@/components/web/props';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.site.leadership') };
}

/** Leadership (owner's website design, 6 Nov 2026): the President, the office-bearers and the Executive Committee 2026-28 */
export default async function LeadershipPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  return <LeadershipMain {...webProps(locale)} />;
}
