/* site-fx.js — motion for the public website: solid-on-scroll header, reading progress, scroll reveal,
   animated counters, gold particle field over the hero, 3D tilt and cursor glow on cards.
   Everything is decorative and switches off for prefers-reduced-motion. */
(function () {
  'use strict';
  const M = window.M, D = document, W = window;
  if (M.ROLE !== 'site') return;
  const calm = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let first = true;

  const header = () => { const h = D.getElementById('xnv'), p = D.getElementById('xprog'); if (!h) return; const y = W.scrollY, max = D.documentElement.scrollHeight - innerHeight; h.classList.toggle('solid', y > 40); if (p) p.style.width = (max > 0 ? (y / max) * 100 : 0) + '%'; };
  W.addEventListener('scroll', header, { passive: true });

  const counters = (root) => root.querySelectorAll('[data-count]').forEach((el) => {
    const to = +el.dataset.count, suf = el.dataset.suf || ''; if (calm) { el.textContent = to.toLocaleString() + suf; return; }
    const t0 = performance.now(), dur = 1600; const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e).toLocaleString() + suf; if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
  });

  const reveal = () => {
    const els = D.querySelectorAll('.xrv,.xjour,.xtl,body[data-role=site] .sc,body[data-role=site] .card');
    if (!('IntersectionObserver' in W) || calm) { els.forEach((e) => { e.classList.add('in'); counters(e); }); return; }
    const io = new IntersectionObserver((xs) => xs.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); counters(x.target); io.unobserve(x.target); } }), { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    els.forEach((e, i) => { if (e.matches('.sc,.card') && !e.classList.contains('xrv')) { e.classList.add('xrv'); e.style.setProperty('--d', (i % 4) * 90 + 'ms'); } io.observe(e); });
  };

  const particles = () => D.querySelectorAll('canvas.xpt').forEach((c) => {
    if (calm || c._on) return; c._on = true; const g = c.getContext('2d'); let w, h, P = [];
    const size = () => { const r = c.getBoundingClientRect(); w = c.width = r.width * devicePixelRatio; h = c.height = r.height * devicePixelRatio; const n = Math.min(70, Math.round(r.width / 22)); P = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 1.8 + .6) * devicePixelRatio, vx: (Math.random() - .5) * .25, vy: -(Math.random() * .35 + .08), a: Math.random() * .6 + .2 })); };
    size(); W.addEventListener('resize', size);
    const tick = () => { if (!c.isConnected) return; g.clearRect(0, 0, w, h); for (const p of P) { p.x += p.vx; p.y += p.vy; if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; } g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fillStyle = `rgba(240,196,106,${p.a})`; g.fill(); }
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, d = dx * dx + dy * dy, lim = 110 * devicePixelRatio; if (d < lim * lim) { g.strokeStyle = `rgba(240,205,120,${0.12 * (1 - Math.sqrt(d) / lim)})`; g.lineWidth = devicePixelRatio * .6; g.beginPath(); g.moveTo(P[i].x, P[i].y); g.lineTo(P[j].x, P[j].y); g.stroke(); } }
      requestAnimationFrame(tick); };
    tick();
  });

  const tilt = () => {
    if (calm || !W.matchMedia('(hover:hover)').matches) return;
    D.querySelectorAll('.xtilt,body[data-role=site] .sc').forEach((el) => {
      if (el._t) return; el._t = true; const big = el.classList.contains('xtilt');
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%'); const k = big ? 8 : 5; el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * k}deg) rotateY(${(x - 0.5) * k}deg) translateY(-4px)`; });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  };

  const parallax = () => { if (calm) return; const bg = D.querySelector('.xhero .xbg'); if (!bg || bg._p) return; bg._p = true; W.addEventListener('scroll', () => { if (W.scrollY < innerHeight * 1.2) bg.style.translate = `0 ${W.scrollY * 0.25}px`; }, { passive: true }); };

  const settle = () => D.querySelectorAll('.xrv,.xjour,.xtl,body[data-role=site] .sc,body[data-role=site] .card').forEach((e) => { e.classList.add('xrv', 'in'); e.style.transition = 'none'; e.querySelectorAll('[data-count]').forEach((c) => { c.textContent = (+c.dataset.count).toLocaleString() + (c.dataset.suf || ''); }); e.querySelectorAll('.steps8>div,.xtl-s,.xjour-bar i').forEach((x) => { x.style.transition = 'none'; }); });
  const run = () => { header(); if (first) reveal(); else settle(); particles(); tilt(); parallax(); if (!first) D.querySelectorAll('.xfx').forEach((e) => { e.style.animation = 'none'; e.style.opacity = 1; e.style.transform = 'none'; }); first = false; };
  const render0 = M.render; M.render = () => { render0(); run(); };
  D.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (a && a.getAttribute('href').length > 1) { const t = D.querySelector(a.getAttribute('href')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' }); } } if (e.target.closest('.xnv nav a')) D.body.classList.remove('sbo'); });
})();
