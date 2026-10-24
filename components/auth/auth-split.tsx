import Image from 'next/image';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';

/**
 * The prototype's login layout (site/login `.lg2`): a brand panel — logo, "Welcome to the digital Chamber.", the
 * tagline in English and Urdu — next to the form column (max 520 px). Stacked on phones. Shared by every auth page.
 */
export function AuthSplit({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-2">
      <div className="relative flex flex-col justify-center overflow-hidden bg-[linear-gradient(150deg,#0b2a5b,#1b4f9c_60%,#1fa6a0)] px-[30px] pt-[calc(var(--appbar-h)+40px)] pb-10 text-white md:p-[60px] md:pt-[120px]">
        <Link href="/" className="inline-flex w-fit" aria-label={msg(locale, 'brand.name')}>
          <Image
            src="/images/logo-white.png"
            width={96}
            height={96}
            alt={msg(locale, 'brand.logoAlt')}
            className="h-16 w-auto md:h-24"
            priority
          />
        </Link>
        <h1 className="mt-[30px] text-[32px] leading-[1.1] font-extrabold tracking-[-0.02em] md:text-[44px]">
          {msg(locale, 'auth.welcome')}
        </h1>
        {locale === 'en' && <p className="mt-3 max-w-[440px] text-[15px] text-white/90">{msg('en', 'auth.tagline')}</p>}
        <p lang="ur" dir="rtl" className="mt-3 max-w-[440px] text-[17px] leading-[1.9] text-white">
          {msg('ur', 'auth.tagline')}
        </p>
      </div>
      <div className="mx-auto flex w-full max-w-[520px] flex-col justify-center px-[30px] py-10 md:p-[60px]">
        {children}
      </div>
    </div>
  );
}
