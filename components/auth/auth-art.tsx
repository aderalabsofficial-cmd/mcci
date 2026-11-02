'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/landing/logo';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';

const PHOTOS = ['chamber-building', 'agm', 'delegation', 'multan-aerial'];

/**
 * The design's photo panel: a slow slideshow behind the chamber's name and one headline. On /login and /register the
 * pane's own heading is the page's h1 and the panel is decoration; on the single-form pages (forgot, reset, 2-step,
 * invitation, staff) `solo` makes its headline the h1.
 */
export function AuthArt({ locale, solo = false }: { locale: Locale; solo?: boolean }) {
  const [at, setAt] = useState(0);
  const m = (k: string) => msg(locale, `landing.${k}`);
  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.shell === 'app';
    if (still) return;
    const t = setInterval(() => {
      if (!document.hidden) setAt((i) => (i + 1) % PHOTOS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <aside className="au-art" aria-hidden={solo ? undefined : true}>
      <div className="art-photos" aria-hidden>
        {PHOTOS.map((p, i) => (
          <Image className={i === at ? 'on' : ''} src={`/images/landing/${p}.jpg`} alt="" key={p} fill sizes="(max-width: 900px) 100vw, 50vw" priority={i === 0} />
        ))}
      </div>
      <svg className="art-star" viewBox="0 0 400 400" aria-hidden>
        <g fill="none" strokeLinejoin="round">
          <path d="M200 20 L250 130 L380 200 L250 270 L200 380 L150 270 L20 200 L150 130 Z" />
          <path d="M73 73 L180 120 L327 73 L280 180 L327 327 L220 280 L73 327 L120 220 Z" />
          <circle cx="200" cy="200" r="62" />
          <circle cx="200" cy="200" r="150" strokeDasharray="4 8" />
        </g>
      </svg>
      <div className="art-in">
        <div className="art-brand">
          <span className="art-seal">
            <Logo />
          </span>
          <span className="art-name">
            <b>{m('brand_1')}</b>
            <small>{m('brand_2')}</small>
          </span>
        </div>
        <div className="art-copy">
          {solo ? (
            <div className="art-solo">
              <h1 className="art-title">{msg(locale, 'auth.welcome')}</h1>
              <p>{msg(locale, 'auth.tagline')}</p>
            </div>
          ) : (
            <>
              <div className="art-msg art-in-msg">
                <h2>{m('au.art_in_t')}</h2>
                <p>{m('au.art_in_d')}</p>
              </div>
              <div className="art-msg art-up-msg">
                <h2>{m('au.art_up_t')}</h2>
                <p>{m('au.art_up_d')}</p>
              </div>
            </>
          )}
        </div>
        <div className="art-chips">
          <span>
            <i className="pulse" />
            <span>{m('au.chip1')}</span>
          </span>
          <span>{m('au.chip2')}</span>
          <span>{m('au.chip3')}</span>
        </div>
      </div>
    </aside>
  );
}
