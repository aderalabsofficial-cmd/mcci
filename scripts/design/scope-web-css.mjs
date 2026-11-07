// Scopes the owner's website stylesheet ("Website front MCCI/assets/css/styles.css") under .lp so it never leaks
// into the member portal or the admin panel (app/styles/landing.css, part 1). Rules:
//   :root → .lp · body / html base rules → .lp (or dropped where the app shell owns them) · html[lang=ur] X / [dir=rtl] X
//   / body.cls X keep their prefix and gain .lp · every other selector gets ".lp " in front · @keyframes k → lp-k (and every
//   animation that names one) · @font-face dropped (the app self-hosts the faces) · Google font names → the app's font
//   variables · url(../img/x) → /images/landing/x.
// Usage: node scripts/design/scope-web-css.mjs <styles.css> > out.css
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const pnpm = new URL('../../node_modules/.pnpm/', import.meta.url);
const dir = readdirSync(pnpm).filter((d) => /^postcss@8\./.test(d)).sort().pop();
const postcss = require(new URL(`${dir}/node_modules/postcss/lib/postcss.js`, pnpm).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

// optional: SCOPE=.pa KEY=pa- to scope a stand-alone page's own styles under another wrapper
const SCOPE = process.env.SCOPE || '.lp';
const KEY = process.env.KEY || 'lp-';
const raw = readFileSync(process.argv[2], 'utf8');
const src = /<style>/.test(raw) ? raw.slice(raw.indexOf('<style>') + 7, raw.indexOf('</style>')) : raw;
const root = postcss.parse(src);

const frames = new Set();
root.walkAtRules('keyframes', (r) => frames.add(r.params.trim()));
root.walkAtRules('font-face', (r) => r.remove());
root.walkAtRules('keyframes', (r) => (r.params = `${KEY}${r.params.trim()}`));

const scopeOne = (sel) => {
  const s = sel.trim();
  if (s === ':root' || s === 'html' || s === 'body') return SCOPE;
  if (/^\*(::?[\w-]+)?$/.test(s)) return null; // the app's base layer already resets box sizing
  if (/^html\.lang-switching/.test(s)) return null; // the app switches language by route
  let st;
  if ((st = /^(\.(?:menu-open|js))\s+(.*)$/.exec(s))) return `${st[1]} ${SCOPE} ${st[2]}`; // state classes live on <body>
  if (/^html::?/.test(s) || /^body::?/.test(s)) return null; // shell-owned pseudo layers (safe-area strip etc.)
  let m;
  if ((m = /^(html\[[^\]]+\]|\[dir=("|')?rtl\2?\]|html\.[\w-]+)(?:\s+(.*))?$/.exec(s))) {
    return m[3] ? `${m[1]} ${SCOPE} ${m[3].replace(/^body\s+/, '')}` : `${m[1]} ${SCOPE}`;
  }
  if ((m = /^body(\.[\w-]+)(?:\s+(.*))?$/.exec(s))) return m[2] ? `${m[1]} ${SCOPE} ${m[2]}` : `${m[1]} ${SCOPE}`;
  if ((m = /^body\s+(.*)$/.exec(s))) return `${SCOPE} ${m[1]}`;
  if (/^\.lp\b/.test(s)) return s;
  return `${SCOPE} ${s}`;
};

root.walkRules((rule) => {
  if (rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
  const out = rule.selectors.map(scopeOne).filter(Boolean);
  if (!out.length) return rule.remove();
  rule.selectors = [...new Set(out)];
});

const renameAnim = (v) =>
  v.replace(/[\w-]+/g, (w) => (frames.has(w) ? `${KEY}${w}` : w));
root.walkDecls((d) => {
  if (d.prop === 'animation' || d.prop === 'animation-name') d.value = renameAnim(d.value);
  d.value = d.value
    .replace(/["']Plus Jakarta Sans["']/g, 'var(--font-jakarta)')
    .replace(/["']Manrope["']/g, 'var(--font-manrope)');
  d.value = d.value.replace(/url\((["']?)\.\.\/img\//g, 'url($1/images/landing/').replace(/url\((['"]?)assets\/img\//g, 'url($1/images/landing/');
});

process.stdout.write(root.toString());
