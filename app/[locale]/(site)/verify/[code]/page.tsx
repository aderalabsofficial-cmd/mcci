import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { VerifyView } from '@/components/site/verify-view';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { trustedClientIp } from '@/lib/net/client-ip';
import { verifyDocument } from '@/lib/verify/admin';

type Props = { params: Promise<{ locale: string; code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'verify.title') };
}

export const dynamic = 'force-dynamic';

/** The address in every certificate QR (`/verify/<code>`): the same check as the form. */
export default async function VerifyCodePage({ params }: Props) {
  const { locale: l, code: raw } = await params;
  const locale = asLocale(l);
  setRequestLocale(locale);
  const code = decodeURIComponent(raw).slice(0, 40);
  const result = await verifyDocument(code, trustedClientIp(await headers()) ?? 'unknown');
  return <VerifyView locale={locale} code={code} result={result} />;
}
