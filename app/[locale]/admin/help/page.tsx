import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { StaffGuide } from '@/components/assistant/staff-guide';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.help') };
}

export const dynamic = 'force-dynamic';

/** Ask MCCI AI for staff: every signed-in staff member; the answers only offer screens the person may open. */
export default async function StaffHelpPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  await requireUser();
  return <StaffGuide locale={locale} />;
}
