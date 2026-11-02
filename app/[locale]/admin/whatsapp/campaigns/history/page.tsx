import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { CampaignList } from '@/components/whatsapp/campaign-list';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.wahistory') };
}

export const dynamic = 'force-dynamic';

export default async function CampaignHistoryPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  return <CampaignList locale={locale} session={session} view="history" />;
}
