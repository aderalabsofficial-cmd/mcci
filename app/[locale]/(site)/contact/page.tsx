import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ComplaintForm } from '@/components/landing/complaint-form';
import { ContactMain } from '@/components/web/gen/contact.gen';
import { webProps } from '@/components/web/props';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.contact.title') };
}

/**
 * Contact (owner's website design, 6 Nov 2026): the Secretariat's details and who to ask for what; the Complaints &
 * Suggestions form is the real one (contact.send: a complaint goes to the complaint desk with a ticket number).
 */
export default async function ContactPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  return <ContactMain {...webProps(locale, { complaints: <ComplaintForm locale={locale} /> })} />;
}
