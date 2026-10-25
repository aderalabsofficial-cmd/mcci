import fs from 'node:fs';
const [, , root, out] = process.argv;
const js = ['member.js', 'docs.js', 'core.js', 'endorse.js', 'ui.js', 'admin.js', 'access.js'].map((f) => fs.readFileSync(`${root}/js/${f}`, 'utf8')).join('\n');
const used = new Set();
for (const m of js.matchAll(/class="([^"$]*)/g)) m[1].split(/\s+/).forEach((c) => /^[a-z][a-z0-9-]*$/.test(c) && used.add(c));
for (const m of js.matchAll(/class=\?"([^"]*)"/g)) m[1].split(/[\s${}]+/).forEach((c) => /^[a-z][a-z0-9-]*$/.test(c) && used.add(c));
// M.btn variants etc. ('p w', 'gold big')
for (const m of js.matchAll(/'((?:p|w|big|gold|danger|p big|gold big|p w|w danger)(?: [a-z]+)*)'/g)) m[1].split(' ').forEach((c) => used.add(c));
const skip = new Set(['btn', 'bi', 'bi-en', 'bi-ur', 'dark', 'badge', 'app', 'sb', 'br', 'ni', 'firm', 'demo-fab', 'srch', 'tb', 'hb', 'nv']);
const css = ['style.css', 'v7.css'].map((f) => fs.readFileSync(`${root}/${f}`, 'utf8')).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
// split into top-level blocks, keeping @media wrappers
function blocks(text) {
  const res = []; let i = 0;
  while (i < text.length) {
    const open = text.indexOf('{', i); if (open < 0) break;
    const head = text.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (j < text.length && depth) { if (text[j] === '{') depth++; else if (text[j] === '}') depth--; j++; }
    res.push({ head, body: text.slice(open + 1, j - 1) }); i = j;
  }
  return res;
}
const classesIn = (sel) => [...sel.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((m) => m[1]);
const keep = (sel) => { const cs = classesIn(sel); return cs.length && cs.some((c) => used.has(c) && !skip.has(c)) && !cs.some((c) => skip.has(c) && c !== 'dark'); };
const scope = (sel) => sel.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
  if (/^body\.dark\b/.test(s)) return '.dark .proto' + s.replace(/^body\.dark/, '');
  if (/^(html|body)\b/.test(s)) return null;
  return '.proto ' + s;
}).filter(Boolean).join(',\n');
let outCss = '';
for (const b of blocks(css)) {
  if (b.head.startsWith('@media')) {
    const inner = blocks(b.body).filter((x) => x.head.split(',').some(keep)).map((x) => `  ${scope(x.head.split(',').filter(keep).join(','))} {${x.body}}`);
    if (inner.length) outCss += `${b.head} {\n${inner.join('\n')}\n}\n`;
  } else if (b.head.startsWith('@keyframes')) {
    outCss += `${b.head} {${b.body}}\n`;
  } else if (!b.head.startsWith('@') && b.head.split(',').some(keep)) {
    const sel = scope(b.head.split(',').filter(keep).join(','));
    if (sel) outCss += `${sel} {${b.body}}\n`;
  }
}
fs.writeFileSync(out, outCss);
console.log('used classes:', used.size, 'output bytes:', outCss.length);
