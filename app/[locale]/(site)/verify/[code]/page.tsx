import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { VerifyView } from '@/components/site/verify-view';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { trustedClientIp } from '@/lib/net/client-ip';
import { verifyByReference } from '@/lib/verify/admin';

type Props = { params: Promise<{ locale: string; code: string }>; searchParams: Promise<{ s?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'verify.title'), robots: { index: false, follow: false } };
}

export const dynamic = 'force-dynamic';

/**
 * The address in every certificate QR (`/verify/<reference>?s=<signature>`, lib/qr/svg.ts verifyUrl): the signature is
 * checked first (a made-up or altered link is refused), then the current status comes from the database.
 */
export default async function VerifyCodePage({ params, searchParams }: Props) {
  const { locale: l, code: raw } = await params;
  const locale = asLocale(l);
  setRequestLocale(locale);
  const code = decodeURIComponent(raw).slice(0, 40);
  const sig = ((await searchParams).s ?? '').slice(0, 100) || null;
  const result = await verifyByReference(code, sig, trustedClientIp(await headers()) ?? 'unknown');
  return <VerifyView locale={locale} code={code} member="" result={result} />;
}
