import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AuthSplit } from '@/components/auth/auth-split';
import { FinishSignupForm } from '@/components/auth/signup-forms';
import { redirect } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { signupUnfinished } from '@/lib/auth/signup';
import { msg } from '@/lib/nav/model';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ welcome?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'auth.signup.finishTitle'), robots: { index: false } };
}

export const dynamic = 'force-dynamic';

/**
 * register.finish, step 3 of sign-up (owner, 4 Nov 2026): after the emailed code. Nobody signed in goes back to the
 * start; someone who finished already goes to the portal.
 */
export default async function FinishSignupPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return redirect({ href: '/register', locale });
  const meta = data.user.user_metadata ?? {};
  if (!signupUnfinished(meta)) return redirect({ href: '/portal', locale });
  return (
    <AuthSplit locale={locale}>
      <FinishSignupForm
        locale={locale}
        email={data.user.email ?? ''}
        name={typeof meta.full_name === 'string' ? meta.full_name : ''}
        welcome={(await searchParams).welcome === '1'}
      />
    </AuthSplit>
  );
}
