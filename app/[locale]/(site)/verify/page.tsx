import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { VerifyView } from '@/components/site/verify-view';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { trustedClientIp } from '@/lib/net/client-ip';
import { verifyByMember, verifyByReference } from '@/lib/verify/admin';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ c?: string; m?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'verify.title') };
}

export const dynamic = 'force-dynamic';

/** Public verification (prototype site/verify; docs/26): by certificate reference (?c=) or membership number (?m=). */
export default async function VerifyPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const sp = await searchParams;
  const code = (sp.c ?? '').slice(0, 40);
  const member = (sp.m ?? '').slice(0, 30);
  const client = trustedClientIp(await headers()) ?? 'unknown';
  const result = code
    ? await verifyByReference(code, null, client)
    : member
      ? await verifyByMember(member, client)
      : null;
  return <VerifyView locale={locale} code={code} member={member} result={result} />;
}
