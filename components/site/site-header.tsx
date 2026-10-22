'use client';

import { LogIn } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { LangToggle } from '@/components/shared/lang-toggle';
import { NavEntry } from '@/components/shared/nav-entry';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { NavItem } from '@/lib/nav/model';
import { cn } from '@/lib/utils';

/**
 * Public header (prototype .xnv): transparent over the hero, solid navy + blur after 40 px of scroll, 84 → 68 px.
 * Below 1181 px the links move into a menu sheet (action menu.toggle).
 */
export function SiteHeader({
  locale,
  nav,
  login,
  text,
}: {
  locale: Locale;
  nav: NavItem[];
  login: NavItem;
  text: {
    name: string;
    tagline: string;
    chamberUr: string;
    menu: string;
    close: string;
    logoAlt: string;
    mainMenu: string;
  };
}) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const loginButton = (wide = false) => (
    <NavEntry
      item={login}
      onNavigate={() => setOpen(false)}
      className={cn(
        'btn-gold inline-flex h-11 items-center justify-center gap-2 rounded-[12px] px-4 font-bold whitespace-nowrap',
        wide && 'w-full',
      )}
      disabledClassName="opacity-70"
    >
      <LogIn className="size-4" aria-hidden />
      {login.label[locale]}
    </NavEntry>
  );

  return (
    <header
      data-solid={solid || undefined}
      className={cn(
        'pt-safe fixed inset-x-0 top-0 z-50 transition-[background,box-shadow] duration-300',
        solid &&
          'bg-[rgba(8,26,60,.86)] shadow-[0_10px_40px_rgba(2,10,30,.35)] backdrop-blur-[18px] backdrop-saturate-[1.4]',
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-[1240px] items-center gap-[18px] px-[var(--gutter)] transition-[height] duration-300 sm:px-6',
          solid ? 'h-16 sm:h-[68px]' : 'h-[var(--xh)]',
        )}
      >
        <Link href="/" className="flex shrink-0 items-center gap-3 text-white">
          <Image
            src="/images/logo-white.png"
            width={54}
            height={54}
            alt={text.logoAlt}
            priority
            className={cn(
              'h-auto drop-shadow-[0_4px_14px_rgba(0,0,0,.35)] transition-[width] duration-300',
              solid ? 'w-11' : 'w-11 sm:w-[54px]',
            )}
          />
          <div className="leading-tight">
            <b className="block text-[19px] tracking-[.5px]">{text.name}</b>
            <small className="block text-[11.5px] opacity-80 max-sm:hidden">{text.tagline}</small>
            <small lang="ur" className="block text-[13px] leading-[1.6] opacity-75 max-sm:hidden">
              {text.chamberUr}
            </small>
          </div>
        </Link>

        <nav aria-label={text.mainMenu} className="ms-auto hidden min-[1181px]:block">
          <ul className="flex gap-0.5">
            {nav.map((item) => (
              <li key={item.id}>
                <NavEntry
                  item={item}
                  className="relative rounded-[10px] px-3 py-2.5 text-[14.5px] font-semibold whitespace-nowrap text-white/90 transition after:absolute after:inset-x-3 after:bottom-[5px] after:h-0.5 after:origin-left after:scale-x-0 after:rounded-sm after:bg-gold-600 after:transition-transform"
                  enabledClassName="hover:bg-white/8 hover:text-white hover:after:scale-x-100"
                  currentClassName="text-white after:scale-x-100"
                  disabledClassName="opacity-60"
                >
                  {item.label[locale]}
                </NavEntry>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-2.5 min-[1181px]:ms-0">
          <LangToggle variant="glass" />
          <div className="max-sm:hidden">{loginButton()}</div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                data-action="menu.toggle"
                aria-label={text.menu}
                className="flex size-11 flex-col justify-between rounded-xl border border-white/35 bg-white/8 px-[11px] py-3 min-[1181px]:hidden"
              >
                <i className="block h-0.5 rounded-sm bg-white" />
                <i className="block h-0.5 rounded-sm bg-white" />
                <i className="block h-0.5 rounded-sm bg-white" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="end"
              closeLabel={text.close}
              aria-describedby={undefined}
              className="border-white/10 bg-[rgba(8,26,60,.97)] px-4 pt-16 pb-6 text-white"
            >
              <SheetTitle className="sr-only">{text.menu}</SheetTitle>
              <ul className="flex flex-col">
                {nav.map((item) => (
                  <li key={item.id}>
                    <NavEntry
                      item={item}
                      onNavigate={() => setOpen(false)}
                      className="flex min-h-12 w-full items-center rounded-xl px-3 text-start text-[16px] font-semibold"
                      enabledClassName="hover:bg-white/8"
                      currentClassName="bg-white/10 text-gold-300"
                      disabledClassName="opacity-60"
                    >
                      {item.label[locale]}
                    </NavEntry>
                  </li>
                ))}
              </ul>
              <div className="mt-4">{loginButton(true)}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
