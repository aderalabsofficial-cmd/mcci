'use client';

import { useEffect } from 'react';

const CITIES = [
  { key: 'london', x: 0.1, y: 0.22 },
  { key: 'riyadh', x: 0.25, y: 0.33 },
  { key: 'dubai', x: 0.38, y: 0.19 },
  { key: 'beijing', x: 0.68, y: 0.18 },
  { key: 'guangzhou', x: 0.86, y: 0.27 },
  { key: 'kl', x: 0.8, y: 0.42 },
] as const;

const REVEAL =
  '.quick-grid .qa, .pres-msg, .bearers-wrap, .sec-head, .sl-points, .mem-grid .mem, .kpis, .desk, .svc-grid .svc, .verify, .work-grid .wk, .join-txt, .fees, .news-grid .nw, .boards .board, .contact-info, .complaint';

/** 1,234 for counts; 39.8 for shares */
const fmt = (n: number, dec: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

function drawRoutes(canvas: HTMLCanvasElement, hero: Element, labels: Record<string, string>, multan: string, ur: boolean, still: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const dpr = Math.min(2, devicePixelRatio || 1);
  type Route = { key: string; ox: number; oy: number; cx: number; cy: number; x: number; y: number; delay: number; parts: number[] };
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
      return { key: c.key, ox, oy, cx: (ox + x) / 2, cy: (oy + y) / 2 - Math.abs(x - ox) * 0.35 - 40, x, y, delay: 1.1 + i * 0.25, parts: [Math.random(), Math.random() * 0.5 + 0.5] };
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
    const showLabels = W >= 1024; // on tablets they would run into the headline
    ctx.clearRect(0, 0, W, H);
    for (const r of routes) {
      const k = still ? 1 : Math.max(0, Math.min(1, (el - r.delay) / 1.6));
      if (k <= 0) continue;
      const ke = 1 - Math.pow(1 - k, 3);
      const N = 60;
      ctx.beginPath();
      for (let i = 0; i <= N * ke; i++) {
        const p = qp(r, i / N);
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
          const pk = (el * 0.18 * (0.7 + sp!) + pi * 0.5) % 1;
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
 * The design's motion, without its CDN scripts: blocks reveal on scroll, counters count up to the real figure from the
 * server (the number is in the HTML first, so without JavaScript it is simply there), the trade-route canvas, the card
 * glow, the slider and a gentle parallax. Under prefers-reduced-motion or inside the Android app nothing moves.
 */
export function LandingFx({ cities, multan, ur }: { cities: Record<string, string>; multan: string; ur: boolean }) {
  useEffect(() => {
    const root = document.documentElement;
    const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) => Array.from(c.querySelectorAll<T>(s));
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.shell === 'app';
    const cleanups: (() => void)[] = [];

    // ── reveal on scroll + counters ──
    const count = (el: HTMLElement) => {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      const to = Number(el.dataset.count) || 0;
      const dec = Number(el.dataset.dec ?? 0);
      const start = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / 1800);
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 4)), dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!still) {
      const blocks = $$(REVEAL);
      const seen = (el: Element) => {
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      };
      blocks.forEach((el) => {
        const sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.setProperty('--d', `${Math.min(sib, 6) * 0.07}s`);
        el.setAttribute('data-reveal', '');
        if (seen(el)) el.classList.add('in');
      });
      root.classList.add('js');
      const io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (!en.isIntersecting) continue;
            en.target.classList.add('in');
            $$('[data-count]', en.target).forEach(count);
            io.unobserve(en.target);
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -5% 0px' },
      );
      blocks.forEach((b) => io.observe(b));
      const hero = document.querySelector('.hero-live');
      if (hero) io.observe(hero);
      cleanups.push(() => io.disconnect());
      cleanups.push(() => root.classList.remove('js'));
    } else {
      $$('.mem').forEach((el) => el.classList.add('in'));
    }
    // the bars in the two tiles that always show them
    const memIo = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          memIo.unobserve(e.target);
        }
      });
    });
    $$('.mem').forEach((m) => memIo.observe(m));
    $$<HTMLElement>('.dt-row').forEach((row) => {
      const bar = row.querySelector<HTMLElement>('i');
      if (bar) bar.style.width = `calc((100% - 72px) * ${Number(row.dataset.ratio) || 0})`;
    });
    cleanups.push(() => memIo.disconnect());

    // ── slider: six photos, 2 s crossfade, the headline changes with each ──
    const slider = document.querySelector<HTMLElement>('.slider');
    if (slider) {
      const slides = $$('.sl', slider);
      const heads = $$('.sl-head', slider);
      const dots = $$<HTMLButtonElement>('.sl-dots button', slider);
      const num = slider.querySelector('#slNum');
      const SLIDE_MS = 2000;
      let cur = 0;
      let timer: ReturnType<typeof setInterval> | undefined;
      let visible = false;
      slider.style.setProperty('--dur', `${SLIDE_MS / 1000}s`);
      const go = (n: number) => {
        cur = (n + slides.length) % slides.length;
        slides.forEach((s, i) => s.classList.toggle('on', i === cur));
        heads.forEach((h, i) => h.classList.toggle('on', i === cur));
        dots.forEach((d, i) => {
          d.classList.remove('on');
          d.classList.toggle('done', i < cur);
          d.setAttribute('aria-selected', String(i === cur));
        });
        void dots[cur]!.offsetWidth; // restart the progress bar
        dots[cur]!.classList.add('on');
        if (num) num.textContent = `0${cur + 1}`;
      };
      const play = () => {
        clearInterval(timer);
        if (still || !visible) return;
        timer = setInterval(() => go(cur + 1), SLIDE_MS);
      };
      const prev = () => (go(cur - 1), play());
      const next = () => (go(cur + 1), play());
      slider.querySelector('#slPrev')?.addEventListener('click', prev);
      slider.querySelector('#slNext')?.addEventListener('click', next);
      dots.forEach((d, i) => d.addEventListener('click', () => (go(i), play())));
      const enter = () => (slider.classList.add('paused'), clearInterval(timer));
      const leave = () => (slider.classList.remove('paused'), go(cur), play());
      slider.addEventListener('mouseenter', enter);
      slider.addEventListener('mouseleave', leave);
      const io = new IntersectionObserver(
        (e) => {
          visible = e[0]!.isIntersecting;
          if (visible) {
            go(cur);
            play();
          } else clearInterval(timer);
        },
        { threshold: 0.3 },
      );
      io.observe(slider);
      cleanups.push(() => {
        clearInterval(timer);
        io.disconnect();
      });
    }

    if (!still) {
      // ── hero trade routes ──
      const canvas = document.querySelector<HTMLCanvasElement>('#routes');
      const hero = document.querySelector('.hero');
      if (canvas && hero) cleanups.push(drawRoutes(canvas, hero, cities, multan, ur, still));

      // ── glow that follows the cursor on service cards ──
      if (window.matchMedia('(hover: hover)').matches) {
        const glow = (e: PointerEvent) => {
          const c = (e.target as HTMLElement | null)?.closest<HTMLElement>('.svc');
          if (!c) return;
          const r = c.getBoundingClientRect();
          c.style.setProperty('--x', `${e.clientX - r.left}px`);
          c.style.setProperty('--y', `${e.clientY - r.top}px`);
        };
        document.addEventListener('pointermove', glow, { passive: true });
        cleanups.push(() => document.removeEventListener('pointermove', glow));
      }

      // ── gentle parallax on the membership photo ──
      const media = document.querySelector<HTMLElement>('.join-media');
      if (media) {
        const onScroll = () => {
          const r = media.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) return;
          const p = (r.top + r.height / 2 - window.innerHeight / 2) / (window.innerHeight + r.height);
          media.style.transform = `translate3d(0, ${(-p * 12).toFixed(2)}%, 0)`;
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        cleanups.push(() => window.removeEventListener('scroll', onScroll));
      }
    }
    return () => cleanups.forEach((c) => c());
  }, [cities, multan, ur]);
  return null;
}
