// Generates the reference-data INSERTs for supabase/migrations/*_settings_reference.sql from the specs, so the
// seed cannot drift from them by hand-copying:
//   - docs/catalogue/reference-data.json  → document_requirements, service_types, settings
//   - docs/06-roles-permissions.md         → designations, role_permissions
// Usage: node scripts/db/gen-reference-seed.mjs > /tmp/seed.sql   (output is pasted into the migration once;
// applied migrations are never edited, later changes go in a new migration)
import { readFileSync } from 'node:fs';

const ref = JSON.parse(readFileSync('docs/catalogue/reference-data.json', 'utf8'));
const roles = readFileSync('docs/06-roles-permissions.md', 'utf8');

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;
const out = [];

// ── designations + role_permissions from the markdown matrix ──
// only the "Designations (seniority L1–L5)" section; the later "Member company roles" table has the same shape
const section = roles.slice(
  roles.indexOf('## Designations'),
  roles.indexOf('\n## ', roles.indexOf('## Designations') + 1),
);
const header = section.split('\n').find((l) => l.startsWith('| Designation | L |'));
const modules = header
  .split('|')
  .map((s) => s.trim())
  .filter(Boolean)
  .slice(2);
const rows = section
  .split('\n')
  .filter((l) => /^\| [A-Z].*\| [1-5] \|/.test(l) && !l.startsWith('| Designation'))
  .map((l) =>
    l
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean),
  );
out.push('insert into public.designations (name, seniority) values');
out.push(rows.map((r) => `  (${q(r[0])}, ${Number(r[1])})`).join(',\n') + '\non conflict (name) do nothing;\n');
out.push('insert into public.role_permissions (designation, module, level) values');
out.push(
  rows.flatMap((r) => modules.map((m, i) => `  (${q(r[0])}, ${q(m)}, ${Number(r[i + 2])})`)).join(',\n') +
    '\non conflict (designation, module) do nothing;\n',
);

// ── document requirements per business type ──
out.push('insert into public.document_requirements (biz_type, key, label_en, short_en, required, sort) values');
out.push(
  Object.entries(ref.DOCS)
    .flatMap(([biz, docs]) =>
      docs.map(
        (d, i) => `  (${q(biz)}, ${q(d.k)}, ${q(d.label)}, ${q(d.short)}, ${d.req ? 'true' : 'false'}, ${i + 1})`,
      ),
    )
    .join(',\n') + '\non conflict (biz_type, key) do nothing;\n',
);

// ── the seven services (fees are placeholders until MCCI confirms, docs/14) ──
const s = ref.settings;
out.push(
  'insert into public.service_types (key, name_en, full_name_en, name_ur, fee, docs, fields, sla_hours, sort) values',
);
out.push(
  ref.SV.map(
    (v, i) =>
      `  (${q(v.k)}, ${q(v.n)}, ${q(v.full)}, ${q(v.ur)}, ${Number(s.svcFee[v.k] ?? 0)}, ${j(v.docs)}, ${j(v.fields)}, ${Number(s.slaHours)}, ${i + 1})`,
  ).join(',\n') + '\non conflict (key) do nothing;\n',
);

// ── settings: prototype flat keys mapped onto the docs/02 key structure ──
const settings = {
  temp: {
    days: s.tempDays,
    alert1: s.tempAlert1,
    alert2: s.tempAlert2,
    extendDays: s.tempExtendDays,
    maxExtensions: s.tempMaxExt,
    autoIssue: s.autoTemp,
    servicesAllowed: s.tempServices,
    inDirectory: s.tempInDirectory,
  },
  fees: s.fees,
  endorse: { ...s.endorse, tempMembersMayEndorse: false }, // docs/02 + docs/14 default
  sla: { hours: s.slaHours, processDays: s.processDays },
  voucher: { dueDays: s.psidDays }, // prototype name "psidDays"; PSID itself is out of scope
  bank: s.bank,
  chamber: s.chamber,
  payment: { provider: 'manual' },
  courier: { provider: 'manual' },
  lang: { urduFirst: s.urduFirst, emailCopy: s.emailCopy },
  classRule: { turnoverMin: s.corpTurnover }, // prototype "corpTurnover"; docs/02 class rule (turnover ≥ 50 M)
  app: { minVersion: null, latestVersion: null, playUrl: null, iosUrl: null }, // docs/15 §6
};
out.push('insert into private.settings (key, value) values');
out.push(
  Object.entries(settings)
    .map(([k, v]) => `  (${q(k)}, ${j(v)})`)
    .join(',\n') + '\non conflict (key) do nothing;',
);

console.log(out.join('\n'));
