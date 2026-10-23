#!/usr/bin/env node
// Builds the static presentation copy of the v10 prototype for https://mcci.aderalabs.tech (docs/18 §8).
// reference/prototype stays untouched (it is the specification); this writes a NEW directory:
//   node scripts/demo/build-prototype-demo.mjs <out dir that does not exist yet>
// - leaves out screens that are not part of this phase or this presentation: admin/psid (1Bill PSID / vouchers
//   page), admin/integrations, plan (development plan)
// - removes every menu entry, tile and link that would lead to them (exact, counted patches: the build fails if the
//   prototype changes and a patch no longer matches), so nothing implies they exist
// - marks every page as a demonstration with sample data, not connected to MCCI systems (EN + UR), and noindex
// The result is static: no API, no database, no form posts (the prototype keeps its demo data in the browser).
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const SRC = resolve('reference/prototype');
const out = process.argv[2];
if (!out) throw new Error('usage: build-prototype-demo.mjs <out dir>');
const OUT = resolve(out);
if (existsSync(OUT)) throw new Error(`${OUT} already exists; refusing to overwrite`);
if (!existsSync(join(SRC, 'index.html'))) throw new Error('run from the repository root');

const EXCLUDED = ['admin/psid', 'admin/integrations', 'plan'];
cpSync(SRC, OUT, {
  recursive: true,
  filter: (p) => !EXCLUDED.some((e) => relative(SRC, p).replace(/\\/g, '/').startsWith(e)),
});

/** Replaces `from` with `to` in FILE exactly `times` times, or fails. */
function patch(file, from, to, times = 1) {
  const p = join(OUT, file);
  const text = readFileSync(p, 'utf8');
  const n = text.split(from).length - 1;
  if (n !== times)
    throw new Error(`${file}: expected ${times} match(es) of ${JSON.stringify(from.slice(0, 60))}, found ${n}`);
  writeFileSync(p, text.split(from).join(to));
  return n;
}

let patched = 0;
// admin menu: no Integrations, no Vouchers & Receipts (PSID) tab
patched += patch(
  'assets/js/admin.js',
  "['Services & Integrations', 'services', 'plug', '#ffb27a']",
  "['Services Setup', 'services', 'gear', '#ffb27a']",
);
patched += patch(
  'assets/js/admin.js',
  "[['payments', 'Payments', 'card'], ['psid', 'Vouchers & Receipts', 'invoice', '', '', () => db().psids.filter((p) => p.status === 'Receipt uploaded').length || '']]",
  "[['payments', 'Payments', 'card']]",
);
patched += patch(
  'assets/js/admin.js',
  "[['services', 'Services Setup', 'gear'], ['integrations', 'Integrations', 'plug']]",
  "[['services', 'Services Setup', 'gear']]",
);
// dashboard tiles that opened the vouchers page open Payments instead (in scope: voucher + receipt verification)
patched += patch('assets/js/admin.js', "'nav', 'psid.html')", "'nav', 'payments.html')", 4);
// staff-access module list
patched += patch('assets/js/access.js', "['services', 'integrations', 'settings']", "['services', 'settings']");
// "Development plan" links: top-bar menu, site footer, hub tile
patched += patch('assets/js/ui.js', '<a href="../blueprint.html">${ic(\'blueprint\', C.GD)} Development plan</a>', '');
patched += patch('assets/js/site.js', '<a href="../blueprint.html">Development plan</a>', '');
{
  const p = join(OUT, 'index.html');
  const text = readFileSync(p, 'utf8');
  const tile = /\s*<a class="t" href="plan\/">[\s\S]*?<\/a>/;
  if (!tile.test(text)) throw new Error('index.html: development-plan tile not found');
  writeFileSync(p, text.replace(tile, ''));
  patched++;
}

// every page: noindex + a visible note that this is a demonstration with sample data
const NOTE =
  '<div role="note" style="position:fixed;left:8px;bottom:8px;z-index:2147483647;pointer-events:none;' +
  'max-width:calc(100vw - 16px);padding:4px 10px;border-radius:999px;background:rgba(15,23,42,.82);color:#fff;' +
  'font:600 11px/1.5 system-ui,sans-serif">Demonstration prototype · sample data only · not connected to MCCI ' +
  'systems <span lang="ur" dir="rtl">· نمونہ ڈیمو، فرضی ڈیٹا</span></div>';
const html = [];
const walk = (d) =>
  readdirSync(d).forEach((n) => {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n.endsWith('.html')) html.push(p);
  });
walk(OUT);
const ROBOTS = '<meta name="robots" content="noindex, nofollow">';
let noted = 0;
for (const p of html) {
  let text = readFileSync(p, 'utf8');
  if (/<\/head>/i.test(text) && /<\/body>/i.test(text)) {
    text = text.replace(/<\/head>/i, `${ROBOTS}\n</head>`);
    text = text.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${NOTE}\n</body>`);
    noted++;
  } else if (/^<!DOCTYPE html><meta charset="utf-8"><meta http-equiv="refresh"/i.test(text)) {
    // one-line redirect stub (admin/, member/, site/, assets/…): noindex only, it never renders
    text = text.replace(/<meta charset="utf-8">/i, `<meta charset="utf-8">${ROBOTS}`);
  } else {
    throw new Error(`${relative(OUT, p)}: neither a full page nor a redirect stub`);
  }
  writeFileSync(p, text);
}

// nothing may still point at the hidden screens
const leftovers = [];
const all = [];
const walkAll = (d) =>
  readdirSync(d).forEach((n) => {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walkAll(p);
    else if (/\.(html|js)$/.test(n)) all.push(p);
  });
walkAll(OUT);
for (const p of all) {
  const t = readFileSync(p, 'utf8');
  // navigational references only: menu entries, module lists, page links. The page renderers themselves
  // (pg('psid', …), pg('integrations', …)) stay in admin.js but are inert: their HTML pages are not shipped.
  for (const re of [
    /psid\.html/,
    /\[\s*['"]psid['"]\s*,/,
    /\[\s*['"]integrations['"]\s*,|,\s*['"]integrations['"]\s*[,\]]/,
    /integrations\.html/,
    /blueprint\.html/,
    /href="[^"]*plan\//,
  ]) {
    if (re.test(t)) leftovers.push(`${relative(OUT, p)} ${re}`);
  }
}
if (leftovers.length) throw new Error(`links to hidden screens remain:\n${leftovers.join('\n')}`);
for (const e of EXCLUDED) if (existsSync(join(OUT, e))) throw new Error(`${e} was copied`);

console.log(`demo built: ${OUT}`);
console.log(`  pages: ${html.length} (all noindex; demonstration note on the ${noted} rendered pages)`);
console.log(`  patches applied: ${patched}; left out: ${EXCLUDED.join(', ')}; no link to them remains`);
