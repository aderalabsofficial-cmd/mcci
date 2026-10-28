import Image from 'next/image';
import { NavEntry } from '@/components/shared/nav-entry';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { CHAMBER } from '@/lib/chamber';
import { footerModel, msg } from '@/lib/nav/model';

/** Public footer (prototype .xft). Not shown inside the Android app, where the bottom tabs replace it. */
export function SiteFooter({ locale }: { locale: Locale }) {
  const columns = footerModel(locale);
  return (
    <footer className="relative overflow-hidden bg-navy-950 pt-10 pb-6 text-[#cbd5e1] sm:pt-16">
      <div className="footer-bg" aria-hidden />
      <div className="relative mx-auto max-w-[1240px] px-[var(--gutter)] sm:px-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-[30px] min-[901px]:grid-cols-[1.5fr_1fr_1fr_1fr] [&>*:first-child]:col-span-2 min-[901px]:[&>*:first-child]:col-span-1">
          <div>
            <Link href="/" className="flex items-center gap-3 text-white">
              <Image src="/images/logo-white.png" width={70} height={70} alt={msg(locale, 'brand.logoAlt')} />
              <div className="leading-tight">
                <b className="block text-[19px]">{msg(locale, 'brand.name')}</b>
                <small className="block text-[11.5px] opacity-80">{msg(locale, 'brand.digitalChamber')}</small>
              </div>
            </Link>
            <p className="mt-3.5 text-[14px] leading-[1.7]">
              <span dir="ltr">{CHAMBER.addr}</span>
              <br />
              {msg(locale, 'footer.tel')} <span dir="ltr">{CHAMBER.tel}</span> · <span dir="ltr">{CHAMBER.email}</span>
            </p>
            <p lang="ur" className="mt-3.5 font-urdu text-[19px] text-gold-300">
              {msg('ur', 'footer.tagline')}
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.heading.en}>
              <h2 className="mb-3 text-[14px] font-bold tracking-[.08em] text-gold-300 uppercase">
                {col.heading[locale]}
              </h2>
              <ul>
                {col.links.map((link) => (
                  <li key={link.id}>
                    <NavEntry
                      item={link}
                      className="block min-h-11 py-2.5 text-start transition sm:min-h-0 sm:py-1"
                      enabledClassName="hover:text-white"
                      disabledClassName="opacity-60"
                    >
                      {link.label[locale]}
                    </NavEntry>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-9 flex flex-wrap justify-between gap-2.5 border-t border-white/12 pt-[18px] text-[13px] opacity-75">
          <span>{msg(locale, 'footer.copyright', { year: String(new Date().getFullYear()) })}</span>
        </div>
      </div>
    </footer>
  );
}
