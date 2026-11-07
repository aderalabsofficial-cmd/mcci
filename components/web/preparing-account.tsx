'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { Link, useRouter } from '@/i18n/navigation';

type Both = { en: string; ur: string };

/** English big words letter by letter; the Urdu line beside it stays whole so its letters keep joining */
function Split({ text }: { text: string }) {
  return (
    <>
      {text.split('').map((c, n) => (
        <span key={n} className="ch" aria-hidden style={{ '--c': n } as React.CSSProperties}>
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </>
  );
}

const COUNT = 5; // seconds
const READY_AT = COUNT * 1000 + 700;
const GO_AT = READY_AT + 1900;
const LEAVE_AT = GO_AT + 2200;

/**
 * The owner's "Preparing your account" screen (Website front MCCI/preparing-account.html), as a React page: a five
 * second dial with the chamber's wheel, status lines in both languages, "Ready?", "Here we go!", then the person's
 * first screen, which is prefetched meanwhile. The drawing is the design's own script, started once and cleaned up.
 */
export function PreparingAccount({
  next,
  text,
}: {
  next: string;
  text: { title: Both; tag: Both; steps: Both[]; ready: Both; go: Both; brand: Both; skip: string };
}) {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    router.prefetch(next);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = (id: string) => stage.querySelector<HTMLElement>(`#${id}`)!;
    const timers: number[] = [];
    const later = (f: () => void, ms: number) => timers.push(window.setTimeout(f, ms));
    let frameId = 0;
    let stopped = false;

    // clock ticks: 60 marks, every fifth one longer
    const ticks = $('ticks');
    const ns = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const major = i % 5 === 0;
      const r1 = major ? 136 : 139;
      const l = document.createElementNS(ns, 'line');
      l.setAttribute('x1', String(150 + Math.cos(a) * r1));
      l.setAttribute('y1', String(150 + Math.sin(a) * r1));
      l.setAttribute('x2', String(150 + Math.cos(a) * 147));
      l.setAttribute('y2', String(150 + Math.sin(a) * 147));
      l.setAttribute('class', `tick${major ? ' major' : ''}`);
      l.style.setProperty('--i', String(i));
      ticks.appendChild(l);
    }
    // star burst pieces
    const burst = $('burst');
    for (let k = 0; k < 18; k++) {
      const b = document.createElement('i');
      b.style.setProperty('--a', `${k * 20 + (k % 2 ? 8 : 0)}deg`);
      b.style.setProperty('--k', String(k));
      burst.appendChild(b);
    }

    // status lines, one per second
    const st = $('st');
    const setStatus = (n: number) => {
      st.classList.add('swap');
      later(() => {
        $('stEn').textContent = text.steps[n]!.en;
        $('stUr').textContent = text.steps[n]!.ur;
        st.classList.remove('swap');
      }, 220);
    };

    // countdown badge
    const count = $('count');
    const showNumber = (html: string) => {
      const old = count.querySelector('.in');
      if (old) {
        old.classList.remove('in');
        old.classList.add('out');
        later(() => old.remove(), 420);
      }
      const s = document.createElement('span');
      s.className = 'in';
      s.innerHTML = html; // a digit or the design's own tick mark, never text from anywhere else
      count.appendChild(s);
    };
    showNumber(String(COUNT));

    // the wheel ticks one fifth of a turn per second
    const wheel = stage.querySelector<HTMLElement>('#wheel')!;
    let deg = 0;
    const turnWheel = (by: number, ms: number, ease: string) => {
      deg += by;
      wheel.style.transition = `transform ${ms}ms ${ease}`;
      wheel.style.transform = `rotate(${deg}deg)`;
    };
    const pulse = () => {
      if (reduce) return;
      const p = document.createElement('div');
      p.className = 'pulse';
      $('pulses').appendChild(p);
      later(() => p.remove(), 1700);
    };

    // background particles: they gather and swirl in, then stream out
    const cv = stage.querySelector<HTMLCanvasElement>('#fx')!;
    const ctx = cv.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    type P = { r: number; c: string; a: number; x: number; y: number; vx: number; vy: number };
    let W = 0;
    let H = 0;
    let cx = 0;
    let cy = 0;
    let inner = 60;
    const parts: P[] = [];
    let mode: 'gather' | 'warp' = 'gather';
    let charge = 0;
    let warp = 0;
    const colors = ['43,209,133', '60,198,207', '195,236,214'];
    const centre = () => {
      const r = $('dial').getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      inner = r.width * 0.42;
    };
    const spawnEdge = (p: P) => {
      const side = (Math.random() * 4) | 0;
      p.x = side === 0 ? -10 : side === 1 ? W + 10 : Math.random() * W;
      p.y = side === 2 ? -10 : side === 3 ? H + 10 : Math.random() * H;
      p.vx = (Math.random() - 0.5) * 0.4;
      p.vy = (Math.random() - 0.5) * 0.4;
    };
    const spawnCentre = (p: P) => {
      const a = Math.random() * Math.PI * 2;
      const d = inner * (0.6 + Math.random() * 0.6);
      p.x = cx + Math.cos(a) * d;
      p.y = cy + Math.sin(a) * d;
      p.vx = Math.cos(a);
      p.vy = Math.sin(a);
    };
    const size = () => {
      W = innerWidth;
      H = innerHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      centre();
      const n = Math.round(Math.min(130, Math.max(50, (W * H) / 11000)));
      while (parts.length < n)
        parts.push({
          r: Math.random() * 1.8 + 0.6,
          c: colors[(Math.random() * 3) | 0]!,
          a: Math.random() * 0.5 + 0.4,
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
        });
      parts.length = n;
    };
    size();
    window.addEventListener('resize', size);

    let last = performance.now();
    const frame = (now: number) => {
      if (stopped) return;
      frameId = requestAnimationFrame(frame);
      const dt = Math.min(3, (now - last) / 16.67);
      last = now;
      ctx.clearRect(0, 0, W, H);
      if (reduce) {
        for (const p of parts) {
          ctx.fillStyle = `rgba(${p.c},${p.a * 0.7})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 7);
          ctx.fill();
        }
        return;
      }
      if (mode === 'gather') {
        for (const p of parts) {
          const dx = cx - p.x;
          const dy = cy - p.y;
          const d = Math.hypot(dx, dy) || 1;
          p.vx += ((dx / d) * 0.05 + (-dy / d) * 0.07) * charge * dt;
          p.vy += ((dy / d) * 0.05 + (dx / d) * 0.07) * charge * dt;
          p.vx *= Math.pow(0.975, dt);
          p.vy *= Math.pow(0.975, dt);
          p.x += p.vx * dt + (Math.random() - 0.5) * 0.3;
          p.y += p.vy * dt + (Math.random() - 0.5) * 0.3;
          if (d < inner * 0.9 || p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) spawnEdge(p);
        }
        for (let i = 0; i < parts.length; i++)
          for (let j = i + 1; j < parts.length; j++) {
            const dx = parts[i]!.x - parts[j]!.x;
            const dy = parts[i]!.y - parts[j]!.y;
            const d = dx * dx + dy * dy;
            if (d < 12100) {
              ctx.strokeStyle = `rgba(60,198,207,${0.18 * (1 - d / 12100)})`;
              ctx.lineWidth = 0.7;
              ctx.beginPath();
              ctx.moveTo(parts[i]!.x, parts[i]!.y);
              ctx.lineTo(parts[j]!.x, parts[j]!.y);
              ctx.stroke();
            }
          }
        for (const p of parts) {
          ctx.fillStyle = `rgba(${p.c},${p.a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 7);
          ctx.fill();
        }
      } else {
        warp = Math.max(0.12, warp - 0.006 * dt);
        ctx.lineCap = 'round';
        for (const p of parts) {
          const dx = p.x - cx;
          const dy = p.y - cy;
          const d = Math.hypot(dx, dy) || 1;
          const sp = (1.5 + d * 0.035) * warp * 6;
          p.vx = (dx / d) * sp;
          p.vy = (dy / d) * sp;
          const px = p.x;
          const py = p.y;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60) {
            spawnCentre(p);
            continue;
          }
          const tail = Math.min(1, d / (Math.max(W, H) * 0.5));
          ctx.strokeStyle = `rgba(${p.c},${(0.2 + tail * 0.55) * p.a})`;
          ctx.lineWidth = p.r * (0.6 + tail);
          ctx.beginPath();
          ctx.moveTo(px - p.vx * 2.5, py - p.vy * 2.5);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }
    };
    frameId = requestAnimationFrame(frame);

    // the timeline
    let t0 = 0;
    let shown = COUNT;
    const fired = { ready: false, go: false, leave: false, end: false };
    const finish = () => {
      fired.end = true;
      stage.classList.add('done');
      showNumber('<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>');
      turnWheel(720, reduce ? 0 : 1600, 'cubic-bezier(.12,.75,.2,1)');
      mode = 'warp';
      warp = 1.4;
      parts.forEach(spawnCentre);
    };
    const loop = () => {
      if (stopped) return;
      const el = performance.now() - t0;
      charge = Math.min(1, el / (COUNT * 1000));
      const left = Math.max(0, COUNT - Math.floor(el / 1000));
      if (left !== shown && left > 0) {
        shown = left;
        showNumber(String(left));
        turnWheel(72, 750, 'cubic-bezier(.34,1.56,.64,1)');
        setStatus(COUNT - left);
        pulse();
      }
      if (el >= COUNT * 1000 && !fired.end) finish();
      if (el >= READY_AT && !fired.ready) {
        fired.ready = true;
        $('sayReady').classList.add('show');
      }
      if (el >= GO_AT && !fired.go) {
        fired.go = true;
        const r = $('sayReady');
        r.classList.add('leave');
        later(() => r.classList.remove('show', 'leave'), 500);
        later(() => $('sayGo').classList.add('show'), 300);
        warp = Math.max(warp, 0.9);
      }
      if (el >= LEAVE_AT && !fired.leave) {
        fired.leave = true;
        router.replace(next);
        return;
      }
      later(loop, 50);
    };
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      stage.classList.add('ready-in');
      later(
        () => {
          centre();
          stage.classList.add('go');
          t0 = performance.now();
          pulse();
          loop();
        },
        reduce ? 0 : 700,
      );
    };
    const img = stage.querySelector<HTMLImageElement>('.bg img');
    if (!img || img.complete) start();
    else {
      img.addEventListener('load', start);
      img.addEventListener('error', start);
      later(start, 1500);
    }
    return () => {
      stopped = true;
      cancelAnimationFrame(frameId);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('resize', size);
    };
  }, [next, router, text]);

  return (
    <div className="pa">
      <div className="stage" id="stage" ref={stageRef}>
        <div className="bg" aria-hidden>
          <Image src="/images/landing/multan-skyline.webp" alt="" fill sizes="100vw" priority />
        </div>
        <div className="tint" aria-hidden />
        <svg className="bg-star s1" viewBox="0 0 400 400" aria-hidden>
          <path d="M200 20 L250 130 L380 200 L250 270 L200 380 L150 270 L20 200 L150 130 Z" />
          <path d="M73 73 L180 120 L327 73 L280 180 L327 327 L220 280 L73 327 L120 220 Z" />
          <circle cx="200" cy="200" r="150" />
        </svg>
        <svg className="bg-star s2" viewBox="0 0 400 400" aria-hidden>
          <path d="M200 20 L250 130 L380 200 L250 270 L200 380 L150 270 L20 200 L150 130 Z" />
          <path d="M73 73 L180 120 L327 73 L280 180 L327 327 L220 280 L73 327 L120 220 Z" />
          <circle cx="200" cy="200" r="62" />
        </svg>
        <div className="tiles" aria-hidden />
        <canvas id="fx" aria-hidden />
        <div className="flash" aria-hidden />

        <main className="center">
          <div className="dial" id="dial" aria-hidden>
            <svg className="dial-svg" viewBox="0 0 300 300">
              <defs>
                <linearGradient id="progGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#3cc6cf" />
                  <stop offset=".5" stopColor="#2bd185" />
                  <stop offset="1" stopColor="#ffffff" />
                </linearGradient>
              </defs>
              <g id="ticks" />
              <circle className="track" cx="150" cy="150" r="128" />
              <circle className="prog" cx="150" cy="150" r="128" />
            </svg>
            <div className="sweep" />
            <div id="pulses" />
            <div className="seal">
              <span className="logo">
                <Image src="/images/landing/logo-ring.png" alt="" width={320} height={320} priority />
                <Image id="wheel" src="/images/landing/logo-wheel.png" alt="" width={320} height={320} priority />
              </span>
            </div>
            <div className="burst" id="burst" />
            <div className="count" id="count" />
          </div>

          <div className="phases">
            <section className="phase phase-load" id="phaseLoad">
              <h1 className="t-en" lang="en">
                {text.title.en}
                <span className="dots" aria-hidden>
                  <i>.</i>
                  <i>.</i>
                  <i>.</i>
                </span>
              </h1>
              <p className="t-ur ur" lang="ur">
                {text.title.ur}
              </p>
              <div className="divider" aria-hidden>
                <i />
                <b />
                <i />
              </div>
              <p className="tag-en" lang="en">
                {text.tag.en}
              </p>
              <p className="tag-ur ur" lang="ur">
                {text.tag.ur}
              </p>
              <div className="status">
                <div className="bar">
                  <i />
                </div>
                <p className="st" id="st" role="status" aria-live="polite">
                  <span id="stEn" lang="en">
                    {text.steps[0]!.en}
                  </span>
                  <span className="ur" lang="ur" id="stUr">
                    {text.steps[0]!.ur}
                  </span>
                </p>
              </div>
            </section>

            <div className="say ready-line" id="sayReady" aria-live="polite">
              <h2 className="big-en" aria-label={text.ready.en}>
                <Split text={text.ready.en} />
              </h2>
              <p className="big-ur ur" lang="ur">
                {text.ready.ur}
              </p>
            </div>
            <div className="say go-line" id="sayGo" aria-live="polite">
              <h2 className="big-en" aria-label={text.go.en}>
                <Split text={text.go.en} />
              </h2>
              <p className="big-ur ur" lang="ur">
                {text.go.ur}
              </p>
              <span className="go-arrow" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </div>
        </main>

        <p className="brand">
          <span lang="en">{text.brand.en}</span>
          <b aria-hidden />
          <span className="ur" lang="ur">
            {text.brand.ur}
          </span>
        </p>
        <Link className="pa-skip" href={next} replace data-action="welcome.continue">
          {text.skip}
        </Link>
      </div>
    </div>
  );
}
