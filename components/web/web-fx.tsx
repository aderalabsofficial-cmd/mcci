'use client';

import { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';

const CITIES = [
  { key: 'london', x: 0.1, y: 0.22 },
  { key: 'riyadh', x: 0.25, y: 0.33 },
  { key: 'dubai', x: 0.38, y: 0.19 },
  { key: 'beijing', x: 0.68, y: 0.18 },
  { key: 'guangzhou', x: 0.86, y: 0.27 },
  { key: 'kl', x: 0.8, y: 0.42 },
] as const;

const REVEAL =
  '.quick-grid .qa, .pres-msg, .bearers-wrap, .sec-head, .sl-points, .mem-grid .mem, .kpis, .desk, .svc-grid .svc, .verify, .work-grid .wk, .join-txt, .fees, .news-grid .nw, .boards .board, .ftr-top, .org, .help-band, [data-r]';

const fmt = (n: number, dec: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtTime = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${m < 10 ? '0' : ''}${m}m`;
};

/** the trade-route canvas behind the home hero: Multan to six partner cities */
function drawRoutes(
  canvas: HTMLCanvasElement,
  hero: Element,
  labels: Record<string, string>,
  multan: string,
  ur: boolean,
  still: boolean,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const dpr = Math.min(2, devicePixelRatio || 1);
  type Route = {
    key: string;
    ox: number;
    oy: number;
    cx: number;
    cy: number;
    x: number;
    y: number;
    delay: number;
    parts: number[];
  };
  let W = 0;
  let H = 0;
  let routes: Route[] = [];
  let visible = true;
  let frame = 0;
  const t0 = performance.now();
  const size = () => {
    const r = canvas.getBoundingClientRect();
    W = r.width;
    H = r.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const small = W < 700;
    const ox = W * 0.52;
    const oy = H * (small ? 0.3 : 0.5);
    routes = CITIES.map((c, i) => {
      let x = c.x * W;
      let y = c.y * H;
      if (small) {
        x = (0.08 + (i / 5) * 0.84) * W;
        y = (i % 2 ? 0.1 : 0.05) * H;
      }
      return {
        key: c.key,
        ox,
        oy,
        cx: (ox + x) / 2,
        cy: (oy + y) / 2 - Math.abs(x - ox) * 0.35 - 40,
        x,
        y,
        delay: 1.1 + i * 0.25,
        parts: [Math.random(), Math.random() * 0.5 + 0.5],
      };
    });
  };
  const qp = (r: Route, k: number) => {
    const a = 1 - k;
    return { x: a * a * r.ox + 2 * a * k * r.cx + k * k * r.x, y: a * a * r.oy + 2 * a * k * r.cy + k * k * r.y };
  };
  const draw = (now: number) => {
    if (!still) frame = requestAnimationFrame(draw);
    if (!visible || !routes.length) return;
    const el = (now - t0) / 1000;
    const showLabels = W >= 1024;
    ctx.clearRect(0, 0, W, H);
    for (const r of routes) {
      const k = still ? 1 : Math.max(0, Math.min(1, (el - r.delay) / 1.6));
      if (k <= 0) continue;
      const ke = 1 - Math.pow(1 - k, 3);
      ctx.beginPath();
      for (let i = 0; i <= 60 * ke; i++) {
        const p = qp(r, i / 60);
        if (i) ctx.lineTo(p.x, p.y);
        else ctx.moveTo(p.x, p.y);
      }
      const g = ctx.createLinearGradient(r.ox, r.oy, r.x, r.y);
      g.addColorStop(0, 'rgba(43,209,133,.85)');
      g.addColorStop(1, 'rgba(60,198,207,.55)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      if (k < 1) continue;
      ctx.fillStyle = 'rgba(60,198,207,1)';
      ctx.beginPath();
      ctx.arc(r.x, r.y, 3.5, 0, 7);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,198,207,.4)';
      ctx.beginPath();
      ctx.arc(r.x, r.y, 7 + Math.sin(el * 2 + r.delay) * 2, 0, 7);
      ctx.stroke();
      if (showLabels) {
        ctx.font = ur ? "400 16px 'Jameel Noori Nastaleeq', serif" : "800 12px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = 'rgba(238,245,240,.92)';
        ctx.textAlign = 'center';
        const label = labels[r.key] ?? '';
        ctx.fillText(ur ? label : label.toUpperCase(), r.x, r.y - 14);
      }
      if (!still) {
        r.parts.forEach((sp, pi) => {
          const pk = (el * 0.18 * (0.7 + sp) + pi * 0.5) % 1;
          const p = qp(r, pk);
          ctx.fillStyle = `rgba(255,255,255,${0.9 - pk * 0.6})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.2, 0, 7);
          ctx.fill();
        });
      }
    }
    const o = routes[0]!;
    const pulse = still ? 0.5 : (el % 2) / 2;
    ctx.strokeStyle = `rgba(43,209,133,${1 - pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(o.ox, o.oy, 8 + pulse * 30, 0, 7);
    ctx.stroke();
    ctx.fillStyle = '#2bd185';
    ctx.beginPath();
    ctx.arc(o.ox, o.oy, 5.5, 0, 7);
    ctx.fill();
    if (showLabels) {
      ctx.font = ur ? "400 20px 'Jameel Noori Nastaleeq', serif" : "800 13px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(ur ? multan : multan.toUpperCase(), o.ox, o.oy + 30);
    }
  };
  size();
  window.addEventListener('resize', size);
  const io = new IntersectionObserver((e) => {
    visible = e[0]!.isIntersecting;
  });
  io.observe(hero);
  frame = requestAnimationFrame(draw);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', size);
    io.disconnect();
  };
}

/**
 * The website's motion and small interactions (the design's main.js, without its stand-ins: the language switch is a
 * route here, the live feed, the verify box and the complaint form are real). Runs on every public page and again after
 * each client navigation, cleaning up what it started. Under prefers-reduced-motion or inside the Android app
 * nothing moves; ?snap=1 shows every animation in its final state (screenshots).
 */
export function WebFx({ cities, multan, ur }: { cities: Record<string, string>; multan: string; ur: boolean }) {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('js');
    const snap = /[?&]snap=1\b/.test(location.search);
    if (snap) root.classList.add('snap');
    const still = snap || window.matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.shell === 'app';
    const canHover = window.matchMedia('(hover: hover)').matches;
    const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) => c.querySelector<T>(s);
    const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) =>
      Array.from(c.querySelectorAll<T>(s));
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(
      t: K,
      f: (e: WindowEventMap[K]) => void,
      o?: AddEventListenerOptions,
    ) => {
      window.addEventListener(t, f, o);
      cleanups.push(() => window.removeEventListener(t, f, o));
    };
    const every = (f: () => void, ms: number) => {
      const id = window.setInterval(f, ms);
      cleanups.push(() => window.clearInterval(id));
    };
    const bind = (el: Element, t: string, f: EventListener) => {
      el.addEventListener(t, f);
      cleanups.push(() => el.removeEventListener(t, f));
    };

    // ── header: shadow, reading progress, the current page in the menu, active section on the home page ──
    const hdr = $('#hdr');
    const bar = $('.progress i');
    const path = pathname.replace(/\/$/, '') || '/';
    for (const a of $$<HTMLAnchorElement>('.hdr-nav .ni > a, .menu-nav > a')) {
      const target = new URL(a.href, location.href).pathname.replace(/^\/ur(?=\/|$)/, '').replace(/\/$/, '') || '/';
      const here = target === path && !new URL(a.href, location.href).hash;
      a.classList.toggle('on', here && path !== '/');
      if (here) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
    const spyLinks =
      path === '/' ? $$<HTMLAnchorElement>('.ni > a').filter((a) => /#[\w-]+$/.test(a.getAttribute('href') ?? '')) : [];
    const spySections = spyLinks.map((a) =>
      document.getElementById((a.getAttribute('href') ?? '').split('#')[1] ?? ''),
    );
    const onScroll = () => {
      hdr?.classList.toggle('scrolled', window.scrollY > 10);
      if (bar) {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      }
      if (!spyLinks.length) return;
      const mark = innerHeight * 0.35;
      let active = -1;
      let best = -Infinity;
      spySections.forEach((s, i) => {
        if (!s) return;
        const top = s.getBoundingClientRect().top;
        if (top <= mark && top > best) {
          best = top;
          active = i;
        }
      });
      spyLinks.forEach((a, i) => a.classList.toggle('on', i === active));
    };
    on('scroll', onScroll, { passive: true });

    // ── dropdowns: close after a pick and on Escape ──
    for (const item of $$('.has-sub')) {
      for (const a of $$('.sub a', item))
        bind(a, 'click', () => (item.classList.add('shut'), (a as HTMLElement).blur()));
      bind(item, 'mouseleave', () => item.classList.remove('shut'));
    }
    on('keydown', (e) => {
      if (e.key === 'Escape' && (document.activeElement as HTMLElement | null)?.closest('.hdr-nav'))
        (document.activeElement as HTMLElement).blur();
    });

    // ── phone and tablet menu ──
    const menuBtn = $('#menuBtn');
    const menu = $('#menu');
    const setMenu = (open: boolean) => {
      if (!menuBtn || !menu) return;
      const r = menuBtn.getBoundingClientRect();
      menu.style.setProperty('--mx', `${r.left + r.width / 2}px`);
      if (hdr) menu.style.top = `${Math.max(0, hdr.getBoundingClientRect().bottom)}px`;
      root.classList.toggle('menu-open', open);
      document.body.classList.toggle('menu-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      menu.inert = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    if (menuBtn && menu) {
      $$('.menu-nav > *').forEach((a, i) => a.style.setProperty('--i', String(i)));
      menu.inert = true;
      bind(menuBtn, 'click', () => setMenu(!root.classList.contains('menu-open')));
      for (const a of $$('.menu a')) bind(a, 'click', () => setMenu(false));
      on('keydown', (e) => {
        if (e.key === 'Escape' && root.classList.contains('menu-open')) {
          setMenu(false);
          menuBtn.focus();
        }
      });
      on('resize', () => {
        if (innerWidth > 1280 && root.classList.contains('menu-open')) setMenu(false);
      });
      cleanups.push(() => setMenu(false));
    }

    // ── news bar pause (WCAG 2.2.2) ──
    const tbPause = $('#tbPause');
    const topbar = $('#topbar');
    if (tbPause && topbar) {
      if (still) topbar.classList.add('paused');
      const sync = () => {
        const p = topbar.classList.contains('paused');
        tbPause.setAttribute('aria-pressed', String(p));
        tbPause.setAttribute('aria-label', (p ? tbPause.dataset.labelPlay : tbPause.dataset.labelPause) ?? '');
      };
      sync();
      bind(tbPause, 'click', () => (topbar.classList.toggle('paused'), sync()));
    }

    // ── headings: the split markup comes from the server (components/web/words.tsx); Urdu headings fade in whole ──
    if (ur || still) for (const h of $$('[data-words]')) h.classList.add('words-plain');

    // ── counters and reveal on scroll ──
    const countUp = (el: HTMLElement) => {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      const isTime = el.hasAttribute('data-time');
      const target = parseFloat((isTime ? el.dataset.time : el.dataset.count) ?? '0') || 0;
      const dec = parseInt(el.dataset.dec ?? '0', 10);
      const show = (v: number) => (el.textContent = isTime ? fmtTime(v) : fmt(v, dec));
      if (still) return void show(target);
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 1800);
        show(target * (1 - Math.pow(1 - k, 4)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    for (const el of $$(REVEAL)) {
      el.setAttribute('data-reveal', '');
      const sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--d', `${Math.min(sib, 6) * 0.07}s`);
    }
    const reveal = (el: HTMLElement) => {
      io.unobserve(el);
      if (el.classList.contains('in')) return;
      el.classList.add('in');
      $$('[data-count],[data-time]', el).forEach(countUp);
      if (el.matches('[data-count],[data-time]')) countUp(el);
      if (el.classList.contains('desk'))
        for (const row of $$('.dt-row', el)) {
          const i = row.querySelector<HTMLElement>('i');
          if (i && row.dataset.avg) i.style.width = `calc((100% - 72px) * ${parseFloat(row.dataset.avg) / 24})`;
        }
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && reveal(en.target as HTMLElement)),
      {
        threshold: 0.12,
        rootMargin: '0px 0px -5% 0px',
      },
    );
    cleanups.push(() => io.disconnect());
    let pending = $$('[data-reveal], .hero-live, [data-words], .wipe, .page-hero [data-count]');
    pending.forEach((el) => io.observe(el));
    const sweep = () => {
      pending = pending.filter((el) => {
        if (el.classList.contains('in')) return false;
        const r = el.getBoundingClientRect();
        if ((r.width || r.height) && r.top < innerHeight * 0.96 && r.bottom > 0) {
          reveal(el);
          return false;
        }
        return true;
      });
    };
    let sweepQ = false;
    on(
      'scroll',
      () => {
        if (sweepQ) return;
        sweepQ = true;
        window.setTimeout(() => ((sweepQ = false), sweep()), 300);
      },
      { passive: true },
    );
    window.setTimeout(sweep, still ? 0 : 1200);
    every(() => pending.length && sweep(), 1000);

    // ── tilt on photo cards and tiles; glow on service cards ──
    if (canHover && !still) {
      for (const c of $$('.wk, .qa, .tilt')) {
        bind(c, 'mousemove', ((e: MouseEvent) => {
          const r = c.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          c.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateY(-4px)`;
          c.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
          c.style.setProperty('--my', `${(y + 0.5) * 100}%`);
        }) as EventListener);
        bind(c, 'mouseleave', () => (c.style.transform = ''));
      }
      for (const c of $$('.svc')) {
        bind(c, 'mousemove', ((e: MouseEvent) => {
          const r = c.getBoundingClientRect();
          c.style.setProperty('--x', `${e.clientX - r.left}px`);
          c.style.setProperty('--y', `${e.clientY - r.top}px`);
        }) as EventListener);
      }
    }

    // ── the trade slider (home): six photos, crossfade, the headline changes with each ──
    const slider = $('.slider');
    if (slider) {
      const slides = $$('.sl', slider);
      const heads = $$('.sl-head', slider);
      const dots = $$('.sl-dots button', slider);
      const num = $('#slNum', slider);
      let cur = 0;
      let timer = 0;
      let visible = false;
      slider.style.setProperty('--dur', '2s');
      const go = (n: number) => {
        if (!slides.length) return;
        cur = (n + slides.length) % slides.length;
        slides.forEach((s, i) => s.classList.toggle('on', i === cur));
        heads.forEach((h, i) => h.classList.toggle('on', i === cur));
        dots.forEach((d, i) => {
          d.classList.remove('on');
          d.classList.toggle('done', i < cur);
          d.setAttribute('aria-selected', String(i === cur));
        });
        void dots[cur]?.offsetWidth;
        dots[cur]?.classList.add('on');
        if (num) num.textContent = `${cur < 9 ? '0' : ''}${cur + 1}`;
      };
      const play = () => {
        window.clearInterval(timer);
        if (still || !visible) return;
        timer = window.setInterval(() => go(cur + 1), 2000);
      };
      cleanups.push(() => window.clearInterval(timer));
      const prev = $('#slPrev', slider);
      const next = $('#slNext', slider);
      if (prev) bind(prev, 'click', () => (go(cur - 1), play()));
      if (next) bind(next, 'click', () => (go(cur + 1), play()));
      dots.forEach((d, i) => bind(d, 'click', () => (go(i), play())));
      const check = () => {
        const r = slider.getBoundingClientRect();
        const vh = window.innerHeight;
        const v = r.bottom > vh * 0.15 && r.top < vh * 0.85;
        if (v && !visible) {
          visible = true;
          go(cur);
          play();
        } else if (!v && visible) {
          visible = false;
          window.clearInterval(timer);
        }
      };
      on('scroll', check, { passive: true });
      on('resize', check);
      every(check, 1000);
      check();
    }

    // ── plain photo crossfade beside the chamber introduction ──
    for (const box of $$('[data-pslider]')) {
      const imgs = $$('img', box);
      let i = 0;
      const show = (n: number) => {
        i = (n + imgs.length) % imgs.length;
        imgs.forEach((im, k) => im.classList.toggle('on', k === i));
      };
      show(0);
      if (!still) every(() => !document.hidden && show(i + 1), 2000);
    }

    // ── tabs (membership documents, news) ──
    for (const box of $$('[data-tabs]')) {
      const btns = $$('[role=tab]', box);
      for (const b of btns)
        bind(b, 'click', () => {
          for (const o of btns) {
            const sel = o === b;
            o.setAttribute('aria-selected', String(sel));
            const panel = document.getElementById(o.getAttribute('aria-controls') ?? '');
            if (panel) panel.hidden = !sel;
          }
        });
    }

    // ── the trade-route canvas (home hero) ──
    const canvas = $<HTMLCanvasElement>('#routes');
    const hero = $('.hero');
    if (canvas && hero) cleanups.push(drawRoutes(canvas, hero, cities, multan, ur, still));

    onScroll();
    return () => cleanups.forEach((f) => f());
  }, [pathname, cities, multan, ur]);
  return null;
}
