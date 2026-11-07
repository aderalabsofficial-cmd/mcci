// Converts the owner's static website pages ("Website front MCCI") into TSX fragments for the Next.js site, so the
// markup stays exactly the design's while text, links and images become the app's own:
//   data-i18n="k"  → {m('k')}  (or dangerouslySetInnerHTML={{ __html: html('k') }} when the text carries markup;
//                    these are MCCI's own static strings from messages/*.json, never user input)
//   x.html#y       → <Link href="/x#y"> (next-intl, keeps the language) · assets/img/* → /images/landing/* via next/image
//   class / for / style / SVG attributes → their React names
// Usage: node scripts/design/html-to-jsx.mjs <design dir> <out dir> <messages-out.json>
// Each page gives one file <page>.gen.tsx exporting one component per marked region (see REGIONS); dynamic parts
// are replaced by hand-written components in app/[locale]/(site)/** (search "data-dyn").
import { mkdirSync, readFileSync, writeFileSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const sharp = require(path.resolve('node_modules/.pnpm', readdirSync('node_modules/.pnpm').find((d) => d.startsWith('sharp@')), 'node_modules/sharp'));

const [designDir, outDir, msgOut] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const ROUTES = { index: '/', about: '/about', services: '/services', membership: '/membership', news: '/news',
  leadership: '/leadership', contact: '/contact', login: '/login', launch: '/launch', 'preparing-account': '/welcome' };
const ATTR = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength',
  minlength: 'minLength', colspan: 'colSpan', rowspan: 'rowSpan', srcset: 'srcSet', autocomplete: 'autoComplete',
  inputmode: 'inputMode', novalidate: 'noValidate', crossorigin: 'crossOrigin', enterkeyhint: 'enterKeyHint',
  'accept-charset': 'acceptCharset', referrerpolicy: 'referrerPolicy', allowfullscreen: 'allowFullScreen', datetime: 'dateTime', allowfullscreen: 'allowFullScreen', frameborder: 'frameBorder',
  'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray', 'stroke-dashoffset': 'strokeDashoffset', 'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-opacity': 'strokeOpacity', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule', 'fill-opacity': 'fillOpacity',
  'stop-color': 'stopColor', 'stop-opacity': 'stopOpacity', 'text-anchor': 'textAnchor', 'font-size': 'fontSize',
  'font-weight': 'fontWeight', 'dominant-baseline': 'dominantBaseline', 'xlink:href': 'xlinkHref', 'clip-path': 'clipPath',
  'vector-effect': 'vectorEffect', 'shape-rendering': 'shapeRendering', viewbox: 'viewBox', 'xml:space': null,
  'xmlns:xlink': null, xmlns: null };
const BOOL = new Set(['hidden', 'disabled', 'checked', 'required', 'open', 'selected', 'multiple', 'autofocus', 'novalidate', 'defer', 'async', 'controls', 'muted', 'loop', 'playsinline', 'inert']);
const VOID = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'area', 'col', 'wbr', 'track', 'embed', 'param']);

const UR = (() => {
  const vm = require('node:vm');
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const f of ['assets/js/i18n.js', 'assets/js/i18n-pages.js']) vm.runInContext(readFileSync(path.join(designDir, f), 'utf8'), ctx);
  return ctx.window.MCCI_UR;
})();

const messages = existsSync(msgOut) ? JSON.parse(readFileSync(msgOut, 'utf8')) : { en: {}, ur: {} };
const usedImages = new Map();
// slots: elements whose design sample is replaced by the app's real data or real form: {slots.name}
const SLOTS = {
  chrome: { '#topbar': 'ticker', '.hdr-actions .lang': 'lang', '.hdr-actions .hdr-login': 'login', '.menu-side .btn-green': 'menuLogin' },
  index: { '.hero-live': 'heroLive', '#members': 'members', '#live': 'live', '#services': 'services', '#classes': 'fees', '.events-board': 'events' },
  services: { '#list .svc-grid': 'cards', '#fees .tbl': 'fees', '#verify': 'verify' },
  membership: { '#fees > .wrap > .tbl-wrap': 'fees' },
  news: { '+#news': 'latest' },
  contact: { '#complaints': 'complaints' },
};
let slotMap = {};
// structural labels in English in the design → messages landing.a11y_* (names of people stay as written)
const A11Y = {
  Breadcrumb: 'a11y_breadcrumb', 'On this page': 'a11y_onpage', Main: 'a11y_main', Mobile: 'a11y_mobile', Menu: 'a11y_menu',
  'Previous slide': 'a11y_prev', 'Next slide': 'a11y_next', 'Choose slide': 'a11y_choose', 'Business type': 'a11y_biztype',
  'The Multan Chamber of Commerce & Industry, home': 'a11y_home', "Multan's trade and industry": 'a11y_trade',
  'Map: The Multan Chamber of Commerce & Industry': 'a11y_map', 'An MoU signing at the chamber': 'a11y_mou',
  "The chamber's headquarters, Multan": 'a11y_hq',
};
if (process.env.NO_SLOTS) for (const k of Object.keys(SLOTS)) SLOTS[k] = {};
const imgDims = new Map();

const slug = (file) => file.replace(/^.*assets\/img\//, '').toLowerCase().replace(/[^a-z0-9./-]+/g, '-').replace(/-+/g, '-').replace(/\/?-\./g, '.');
const esc = (t) => t.replace(/[{}<>]/g, (c) => `{'${c}'}`);
const jsStr = (s) => JSON.stringify(s);
const collapse = (s) => s.replace(/\s+/g, ' ');

function styleObj(css) {
  const parts = css.split(';').map((p) => p.trim()).filter(Boolean).map((p) => {
    const i = p.indexOf(':');
    const k = p.slice(0, i).trim();
    const v = p.slice(i + 1).trim();
    const key = k.startsWith('--') ? jsStr(k) : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    return `${key}: ${jsStr(v)}`;
  });
  return `{{ ${parts.join(', ')} } as React.CSSProperties}`;
}

function hrefOf(h) {
  if (!h) return { kind: 'a', value: h };
  const m = /^([\w-]+)\.html(#.*)?$/.exec(h);
  if (m && ROUTES[m[1]] !== undefined) return { kind: 'link', value: ROUTES[m[1]] + (m[2] ?? '') };
  if (h.startsWith('#')) return { kind: 'a', value: h };
  if (h.startsWith('assets/docs/')) return { kind: 'a', value: '/docs/' + path.basename(h) };
  if (h.startsWith('assets/img/')) return { kind: 'a', value: '/images/landing/' + slug(h) };
  return { kind: 'a', value: h };
}

async function dims(file) {
  if (!imgDims.has(file)) {
    const meta = await sharp(path.join(designDir, file)).metadata();
    imgDims.set(file, [meta.width, meta.height]);
  }
  return imgDims.get(file);
}

async function attrs(el, tag, extra = {}) {
  const out = [];
  for (const a of [...el.attributes]) {
    let name = a.name;
    const v = a.value;
    if (name === 'data-i18n') continue;
    if (name in ATTR) { if (ATTR[name] === null) continue; name = ATTR[name]; }
    if (name === 'style') { out.push(`style=${styleObj(v)}`); continue; }
    if (['aria-label', 'title', 'alt', 'placeholder'].includes(name)) {
      const slide = /^Slide (\d+)$/.exec(v);
      if (slide) { out.push(`${name}={\`\${m('a11y_slide')} ${slide[1]}\`}`); continue; }
      if (A11Y[v]) { out.push(`${name}={m(${jsStr(A11Y[v])})}`); continue; }
    }
    if (BOOL.has(name)) { out.push(name === 'novalidate' ? 'noValidate' : name === 'autofocus' ? 'autoFocus' : name === 'playsinline' ? 'playsInline' : name); continue; }
    if (name === 'href' && tag === 'a') { const h = hrefOf(v); out.push(`href=${jsStr(h.value)}`); continue; }
    if (name === 'src' && tag === 'img') continue;
    if ((name === 'width' || name === 'height') && tag === 'img') continue; // set from the file itself
    if (name === 'loading' || name === 'decoding' || name === 'fetchpriority') continue;
    if (name.startsWith('on')) continue;
    out.push(`${name}=${jsStr(v)}`);
  }
  for (const [k, v] of Object.entries(extra)) out.push(`${k}=${v}`);
  return out.length ? ' ' + out.join(' ') : '';
}

async function node2jsx(node, depth) {
  const pad = '  '.repeat(depth);
  if (node.nodeType === 3) {
    // whitespace between table parts (and in selects) is not allowed in the DOM React builds
    if (/^(TABLE|THEAD|TBODY|TFOOT|TR|COLGROUP|SELECT)$/.test(node.parentElement?.tagName ?? '') && !node.textContent.trim()) return '';
    const t = collapse(node.textContent);
    return t.trim() === '' ? (t ? ' ' : '') : esc(t);
  }
  if (node.nodeType === 8) return '';
  if (node.nodeType !== 1) return '';
  const tag = node.tagName.toLowerCase();
  // "+selector": the slot goes in just before that element (real content the design has no place for)
  let before = '';
  for (const [sel, name] of Object.entries(slotMap)) {
    if (sel.startsWith('+')) { if (node.matches(sel.slice(1))) before += `{slots.${name}}`; continue; }
    if (node.matches(sel)) return `{slots.${name}}`;
  }
  if (before) { const k = slotMap; slotMap = Object.fromEntries(Object.entries(k).filter(([q]) => !q.startsWith('+'))); const out = before + (await node2jsx(node, depth)); slotMap = k; return out; }
  if (tag === 'script' || tag === 'noscript' || tag === 'template') return '';
  const key = node.getAttribute('data-i18n');
  let open = tag;
  let isLink = false;
  if (tag === 'a') {
    const h = hrefOf(node.getAttribute('href'));
    if (h.kind === 'link') { open = 'Link'; isLink = true; }
  }
  if (tag === 'img') {
    const src = node.getAttribute('src') || '';
    if (src.startsWith('assets/img/')) {
      usedImages.set(src, slug(src));
      const [w, h] = await dims(src);
      const lazy = node.getAttribute('loading') === 'lazy';
      return `<Image src=${jsStr('/images/landing/' + slug(src))}${await attrs(node, 'img', { width: `{${w}}`, height: `{${h}}`, ...(lazy ? {} : { priority: '' }) })} />`.replace(/ priority=/, ' priority');
    }
    return `{/* eslint-disable-next-line @next/next/no-img-element */}<img src=${jsStr(src)}${await attrs(node, 'img')} />`;
  }
  const a = await attrs(node, tag);
  if (key) {
    const en = node.innerHTML.trim();
    const rich = /<[a-z]/i.test(en);
    messages.en[key] = collapse(en).replace(/&amp;/g, rich ? '&amp;' : '&').replace(/&nbsp;/g, ' ');
    if (!rich) messages.en[key] = messages.en[key].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    if (UR[key] !== undefined) messages.ur[key] = UR[key];
    if (VOID.has(tag)) return `<${open}${a} />`;
    const parent = node.parentElement;
    if (!rich && parent?.classList.contains('hero-title')) return `<${open}${a}>{letters(m(${jsStr(key)}))}</${open}>`;
    if (!rich && (node.hasAttribute('data-words') || parent?.hasAttribute('data-words'))) return `<${open}${a}>{words(m(${jsStr(key)}))}</${open}>`;
    return rich
      ? `<${open}${a} dangerouslySetInnerHTML={{ __html: html(${jsStr(key)}) }} />`
      : `<${open}${a}>{m(${jsStr(key)})}</${open}>`;
  }
  if (VOID.has(tag)) return `<${open}${a} />`;
  const kids = [];
  for (const c of node.childNodes) kids.push(await node2jsx(c, depth + 1));
  const inner = kids.join('').replace(/^\s+|\s+$/g, (s) => (s.includes('\n') ? '' : s));
  void isLink;
  void pad;
  return `<${open}${a}>${inner}</${open}>`;
}

// regions: [page, css selector, component name]
const REGIONS = [
  ['about', '#topbar', 'Topbar'],
  ['about', 'header.hdr', 'Header'],
  ['about', '#menu', 'Menu'],
  ['about', 'footer.ftr', 'Footer'],
  ['index', 'main', 'HomeMain'],
  ['about', 'main', 'AboutMain'],
  ['services', 'main', 'ServicesMain'],
  ['membership', 'main', 'MembershipMain'],
  ['news', 'main', 'NewsMain'],
  ['leadership', 'main', 'LeadershipMain'],
  ['contact', 'main', 'ContactMain'],
];

const files = {};
for (const [page, sel, name] of REGIONS) {
  const dom = new JSDOM(readFileSync(path.join(designDir, `${page}.html`), 'utf8'));
  let el = dom.window.document.querySelector(sel);
  if (!el && sel === 'main') {
    // pages without <main>: everything between the menu overlay and the footer
    const body = dom.window.document.body;
    const wrap = dom.window.document.createElement('main');
    let on = false;
    for (const n of [...body.childNodes]) {
      if (n.nodeType === 1 && n.id === 'menu') { on = true; continue; }
      if (n.nodeType === 1 && n.matches('footer.ftr')) break;
      if (on) wrap.appendChild(n.cloneNode(true));
    }
    el = wrap;
  }
  if (!el) { console.error(`missing ${page} ${sel}`); continue; }
  slotMap = SLOTS[sel === 'main' ? page : 'chrome'] ?? {};
  for (const q of Object.keys(slotMap)) if (!dom.window.document.querySelector(q.replace(/^\+/, ''))) console.error(`slot ${q} not found in ${page}`);
  if (sel !== 'main') {
    // the chrome comes from about.html: its "current page" marks are set from the route at run time instead
    for (const a of el.querySelectorAll('[aria-current]')) { a.removeAttribute('aria-current'); a.classList.remove('on'); if (!a.className) a.removeAttribute('class'); }
  }
  // the app's own rules on top of the design (docs/10 orphan audit, axe, docs/15 §8 phones):
  //  - every control names the action WebFx wires to it
  //  - a tab panel that is a list keeps its list: the panel role moves to a wrapper
  //  - tables become cards on a phone (app/styles/mobile.css .mcards); the page sub-menu is a deliberate scroll strip
  {
    const doc = dom.window.document;
    const ACTIONS = { '#slPrev': 'slider.prev', '#slNext': 'slider.next', '.sl-dots button': 'slider.go' };
    for (const [q, a] of Object.entries(ACTIONS)) for (const b of el.querySelectorAll(q)) b.setAttribute('data-action', a);
    for (const list of el.querySelectorAll('ul[role=tabpanel], ol[role=tabpanel]')) {
      const panel = doc.createElement('div');
      for (const at of ['role', 'id', 'aria-labelledby', 'hidden'])
        if (list.hasAttribute(at)) { panel.setAttribute(at, list.getAttribute(at)); list.removeAttribute(at); }
      list.replaceWith(panel);
      panel.appendChild(list);
    }
    for (const w of el.querySelectorAll('.tbl-wrap')) w.classList.add('mcards');
    for (const s of el.querySelectorAll('.sub-nav')) s.setAttribute('data-scroll-x', '');
  }
  const inner = sel === 'main'
    ? (await Promise.all([...el.childNodes].map((c) => node2jsx(c, 2)))).join('')
    : await node2jsx(el, 2);
  const file = sel === 'main' ? page : 'chrome';
  (files[file] ??= []).push(`export function ${name}({ m, html, slots, words, letters }: Copy) {\n  void m;\n  void html;\n  void slots;\n  void words;\n  void letters;\n  return (\n    <>\n      ${inner.trim()}\n    </>\n  );\n}\n`);
}

for (const [file, comps] of Object.entries(files)) {
  const body = comps.join('\n');
  const head = `// GENERATED by scripts/design/html-to-jsx.mjs from "Website front MCCI/${file === 'chrome' ? 'about' : file}.html". Do not edit by hand:
// change the design, run the script again, and keep data and forms in the hand-written page around it.
${body.includes('<Image') ? "import Image from 'next/image';\n" : ''}${body.includes('<Link') ? "import { Link } from '@/i18n/navigation';\n" : ''}
export type Copy = {
  m: (key: string) => string;
  html: (key: string) => string;
  slots: Record<string, React.ReactNode>;
  words: (text: string) => React.ReactNode;
  letters: (text: string) => React.ReactNode;
};

`;
  writeFileSync(path.join(outDir, `${file}.gen.tsx`), head + body);
}

// images used by the pages, copied with web-safe names
mkdirSync('public/images/landing', { recursive: true });
for (const [src, to] of usedImages) {
  mkdirSync(path.dirname(path.join('public/images/landing', to)), { recursive: true });
  copyFileSync(path.join(designDir, src), path.join('public/images/landing', to));
}
mkdirSync('public/docs', { recursive: true });
for (const f of readdirSync(path.join(designDir, 'assets/docs'))) copyFileSync(path.join(designDir, 'assets/docs', f), path.join('public/docs', f));
writeFileSync(msgOut, JSON.stringify(messages, null, 1));
console.log(`components: ${REGIONS.length}, messages: ${Object.keys(messages.en).length} en / ${Object.keys(messages.ur).length} ur, images: ${usedImages.size}`);

// keep the generated files in the repository's own style
{
  const { execFileSync } = await import('node:child_process');
  const files = readdirSync(outDir).filter((f) => f.endsWith('.gen.tsx')).map((f) => path.join(outDir, f));
  execFileSync(process.execPath, ['node_modules/prettier/bin/prettier.cjs', '--write', '--log-level', 'warn', ...files], { stdio: 'inherit' });
}
