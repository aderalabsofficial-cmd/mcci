import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { VerifyView } from '@/components/site/verify-view';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { trustedClientIp } from '@/lib/net/client-ip';
import { verifyDocument } from '@/lib/verify/admin';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ c?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'verify.title') };
}

export const dynamic = 'force-dynamic';

/** Verify a document (prototype site/verify): public, rate-limited, every lookup counted (docs/08). */
export default async function VerifyPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const code = ((await searchParams).c ?? '').slice(0, 40);
  const result = code ? await verifyDocument(code, trustedClientIp(await headers()) ?? 'unknown') : null;
  return <VerifyView locale={locale} code={code} result={result} />;
}
