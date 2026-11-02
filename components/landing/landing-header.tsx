'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LangToggle } from '@/components/shared/lang-toggle';
import { Logo } from '@/components/landing/logo';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';

type Sub = { href: string; label: string; anchor?: boolean };
type Entry = { key: string; href: string; label: string; anchor?: boolean; subs?: Sub[]; wide?: boolean; end?: boolean };

const SERVICE_KEYS = ['ebil', 'co', 'visa', 'guar', 'sample', 'other', 'att'] as const;

/** the design's seven menu items; in-page anchors on the home page, real routes for what lives on its own page */
function entries(locale: Locale): Entry[] {
  const m = (k: string) => msg(locale, `landing.${k}`);
  return [
    { key: 'home', href: '#top', anchor: true, label: m('nav_home') },
    {
      key: 'about',
      href: '#about',
      anchor: true,
      label: m('nav_about'),
      subs: [
        { href: '#bearers', anchor: true, label: m('sub_bearers') },
        { href: '/about#leadership', label: m('sub_committees') },
      ],
    },
    {
      key: 'services',
      href: '#services',
      anchor: true,
      label: m('nav_services'),
      wide: true,
      subs: SERVICE_KEYS.map((k) => ({ href: `/service?s=${k}`, label: m(`svc_${k}`) })),
    },
    {
      key: 'join',
      href: '#join',
      anchor: true,
      label: m('nav_join'),
      subs: [
        { href: '#classes', anchor: true, label: m('sub_classes') },
        { href: '#fee-table', anchor: true, label: m('sub_fee') },
        { href: '/membership', label: m('sub_apply') },
      ],
    },
    { key: 'live', href: '#live', anchor: true, label: m('nav_live') },
    { key: 'news', href: '#news', anchor: true, label: m('nav_news') },
    {
      key: 'contact',
      href: '#contact',
      anchor: true,
      label: m('nav_contact'),
      end: true,
      subs: [
        { href: '#contact', anchor: true, label: m('sub_contact') },
        { href: '#complaints', anchor: true, label: m('sub_complaints') },
      ],
    },
  ];
}

const Chev = () => (
  <svg className="chev" viewBox="0 0 24 24" aria-hidden>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/** an in-page anchor on the home page; from anywhere else it still arrives there */
function Go({ item, onClick, children, className }: { item: Sub; onClick?: () => void; children: ReactNode; className?: string }) {
  if (item.anchor) {
    return (
      <a href={item.href} onClick={onClick} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={item.href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}

/**
 * The design's white header: the logo in its own colours, every link visible and, at tablet and phone width, the
 * circular-reveal menu. Everything is a real anchor or route (orphan audit, docs/10-testing.md). The Android app has
 * its own app bar and tabs instead (app/[locale]/(site)/layout.tsx).
 */
export function LandingHeader({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [shut, setShut] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const items = entries(locale);
  const m = (k: string) => msg(locale, `landing.${k}`);
  const login = msg(locale, 'common.memberLogin');

  useEffect(() => {
    const spy = items.map((i) => [i.key, document.querySelector(i.href)] as const);
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
      // the menu order differs from the page order, so take the lowest section already reached
      const mark = window.innerHeight * 0.35;
      let best = -Infinity;
      let current: string | null = null;
      for (const [key, el] of spy) {
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= mark && top > best) {
          best = top;
          current = key;
        }
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
    // the sections never change while this header is on the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const r = menuBtn.current?.getBoundingClientRect();
    if (r) root.style.setProperty('--lp-mx', `${r.left + r.width / 2}px`);
    root.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (open) {
        setOpen(false);
        menuBtn.current?.focus();
      } else if ((document.activeElement as HTMLElement | null)?.closest('.hdr-nav')) {
        (document.activeElement as HTMLElement).blur();
      }
    };
    const onResize = () => {
      if (window.innerWidth > 1023) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      root.classList.remove('menu-open');
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="lp">
      <header className={`hdr ${scrolled ? 'scrolled' : ''}`} id="hdr">
        <div className="hdr-bar">
          <a className="hdr-brand" href="#top" aria-label={m('brand_full')}>
            <Logo />
            <span className="hdr-name">
              <b>{m('brand_1')}</b>
              <small>{m('brand_2')}</small>
            </span>
          </a>

          <nav className="hdr-nav" aria-label={msg(locale, 'common.mainMenu')}>
            {items.map((item) => (
              <div
                key={item.key}
                className={`ni ${item.subs ? 'has-sub' : ''} ${shut === item.key ? 'shut' : ''}`}
                onMouseLeave={() => setShut(null)}
              >
                <a href={item.href} className={active === item.key ? 'on' : undefined}>
                  <span>{item.label}</span>
                  {item.subs && <Chev />}
                </a>
                {item.subs && (
                  <div className={`sub ${item.wide ? 'sub-wide' : ''} ${item.end ? 'sub-end' : ''}`}>
                    {item.subs.map((sub) => (
                      <Go
                        key={sub.href}
                        item={sub}
                        onClick={() => {
                          setShut(item.key);
                          (document.activeElement as HTMLElement | null)?.blur();
                        }}
                      >
                        {sub.label}
                      </Go>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="hdr-actions">
            <LangToggle variant="slide" />
            <Link className="btn btn-green hdr-login" href="/login" data-action="nav">
              {login}
            </Link>
            <button
              ref={menuBtn}
              className="menu-btn"
              type="button"
              data-action="menu.toggle"
              aria-expanded={open}
              aria-controls="lp-menu"
              aria-label={msg(locale, 'common.menu')}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="menu-ico" aria-hidden>
                <i />
                <i />
                <i />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="menu" id="lp-menu" role="dialog" aria-modal="true" aria-label={msg(locale, 'common.menu')} inert={!open}>
        <div className="menu-bg" aria-hidden />
        <div className="menu-inner">
          <button
            type="button"
            className="menu-close"
            data-action="menu.toggle"
            aria-label={msg(locale, 'common.close')}
            onClick={() => {
              setOpen(false);
              menuBtn.current?.focus();
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <nav className="menu-nav" aria-label={m('mobile_nav')}>
            {items.map((item, i) =>
              item.subs ? (
                <details key={item.key} style={{ '--i': i } as React.CSSProperties}>
                  <summary>
                    <span>{item.label}</span>
                    <Chev />
                  </summary>
                  <div className="mn-sub">
                    {item.subs.map((sub) => (
                      <Go key={sub.href} item={sub} onClick={() => setOpen(false)}>
                        {sub.label}
                      </Go>
                    ))}
                  </div>
                </details>
              ) : (
                <a key={item.key} href={item.href} onClick={() => setOpen(false)} style={{ '--i': i } as React.CSSProperties}>
                  {item.label}
                </a>
              ),
            )}
          </nav>
          <div className="menu-side">
            <Link className="btn btn-green" href="/login" data-action="nav" onClick={() => setOpen(false)}>
              {login}
            </Link>
            <p className="menu-online">
              <span className="pulse" />
              <span>{m('always_on')}</span>
            </p>
          </div>
        </div>
        <div className="menu-tiles" aria-hidden />
      </div>
    </div>
  );
}
