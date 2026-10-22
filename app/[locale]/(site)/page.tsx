import { setRequestLocale } from 'next-intl/server';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { getShell } from '@/lib/shell/server';
import { cn } from '@/lib/utils';

type Props = { params: Promise<{ locale: string }> };

/**
 * Public home. M0: the hero frame only (hero-bg.jpg under the transparent header, 80 % brand colour layer).
 * Live activity, counters, journey, services, verify, news and the launch countdown arrive in M2.
 */
export default async function HomePage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const other = locale === 'en' ? 'ur' : 'en';
  // Inside the app the hero is compact (220 px, docs/15-mobile-app.md §5.3) and sits under a solid app bar.
  const inApp = (await getShell()) === 'app';

  return (
    <section
      className={cn(
        'relative isolate flex items-center overflow-hidden text-white',
        inApp
          ? 'min-h-[220px] py-6'
          : 'min-h-[300px] pt-[calc(var(--xh)+24px)] pb-10 sm:min-h-svh sm:pt-[calc(var(--xh)+40px)] sm:pb-[120px]',
      )}
    >
      <div className="hero-bg" aria-hidden />
      <div className="hero-ov" aria-hidden />
      <div className="mx-auto w-full max-w-[1240px] px-[var(--gutter)] sm:px-6">
        <p className="text-[13px] font-bold tracking-[.06em] text-gold-300 uppercase sm:text-[15px]">
          {msg(locale, 'home.eyebrow')}
        </p>
        <h1 className="mt-2 mb-2 text-[32px] leading-[1.1] font-extrabold tracking-[-.03em] [text-shadow:0_6px_30px_rgba(0,0,0,.35)] sm:mt-[18px] sm:mb-2.5 sm:text-[clamp(40px,6vw,76px)]">
          {msg(locale, 'home.title')}
        </h1>
        <p lang={other} className="text-[18px] text-white/90 sm:text-[26px]">
          {msg(other, 'home.title')}
        </p>
        <p className="mt-3 max-w-[640px] text-[15px] text-white/90 sm:text-[18px]">{msg(locale, 'home.subtitle')}</p>
      </div>
    </section>
  );
}
