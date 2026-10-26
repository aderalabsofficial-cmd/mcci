'use client';

import { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';

/**
 * Public-site motion (prototype site-fx.js, docs/12 "Motion"): blocks reveal as they scroll into view, counters count
 * up, cards glow where the pointer is. Progressive: everything is visible without JavaScript; under
 * prefers-reduced-motion or inside the Android app nothing moves (blocks and final numbers are shown at once).
 */
export function SiteFx() {
  const path = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.shell === 'app';
    const blocks = Array.from(document.querySelectorAll<HTMLElement>('.site .xrv, .site .xtl, .site .xjour'));
    const counters = Array.from(document.querySelectorAll<HTMLElement>('.site [data-count]'));
    const finalText = (el: HTMLElement) => `${Number(el.dataset.count).toLocaleString('en-US')}${el.dataset.suf ?? ''}`;
    if (still || !('IntersectionObserver' in window)) {
      blocks.forEach((b) => b.classList.add('in'));
      counters.forEach((c) => (c.textContent = finalText(c)));
      return;
    }
    const count = (el: HTMLElement) => {
      const to = Number(el.dataset.count) || 0;
      const start = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / 1400);
        el.textContent = `${Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US')}${el.dataset.suf ?? ''}`;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const seen = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };
    // what is on screen now is shown at once; the rest waits for its turn
    blocks.filter(seen).forEach((b) => b.classList.add('in'));
    root.classList.add('fx');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          if (el.dataset.count !== undefined) count(el);
          else el.classList.add('in');
          io.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    blocks.filter((b) => !b.classList.contains('in')).forEach((b) => io.observe(b));
    counters.forEach((c) => io.observe(c));
    const glow = (e: PointerEvent) => {
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>('.site .sc');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    document.addEventListener('pointermove', glow, { passive: true });
    return () => {
      io.disconnect();
      document.removeEventListener('pointermove', glow);
      root.classList.remove('fx');
    };
  }, [path]);
  return null;
}
