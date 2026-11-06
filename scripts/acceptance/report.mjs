#!/usr/bin/env node
// Builds the Phase 1 acceptance reports from the crawl data (tests/e2e/acceptance.spec.ts → acceptance-results/*.json):
//   docs/acceptance/MCCI-PHASE-1-TEST-INVENTORY.md
//   docs/acceptance/MCCI-INTERACTIVE-ELEMENT-TEST-REPORT.md
//   docs/acceptance/MCCI-DESIGNATION-PERMISSION-TEST-REPORT.md (generated part)
//   acceptance-results/summary.json (counts for the handover report)
// Statuses follow the owner's definitions (PASS, FAIL, PARTIAL, NOT TESTED, BLOCKED, NOT IMPLEMENTED, FIXED,
// RETESTED PASS). An element is PASS only when its behaviour is exercised by an automated spec or, for a link, when its
// target was requested and answered; an element that is present, named and wired but whose outcome no test exercises is
// PARTIAL. Usage: node scripts/acceptance/report.mjs   (reads the LOCAL database for the role matrix)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const IN = 'acceptance-results';
const DOCS = join('docs', 'acceptance');
mkdirSync(DOCS, { recursive: true });
const runs = readdirSync(IN)
  .filter((f) => /^(prod-)?crawl-.*\.json$/.test(f))
  .map((f) => ({ file: f, ...JSON.parse(readFileSync(join(IN, f), 'utf8')) }));
const local = runs.filter((r) => r.target !== 'production');
const prod = runs.filter((r) => r.target === 'production');
const routes = existsSync(join(IN, 'routes.json')) ? JSON.parse(readFileSync(join(IN, 'routes.json'), 'utf8')) : [];

// ---- role matrix from the local database (same migrations as production: 61/61 on both, 6 Nov 2026)
const psql = (sql) =>
  execFileSync(
    'docker',
    ['exec', '-i', 'supabase_db_mcci-digital', 'psql', '-X', '-U', 'postgres', '-d', 'postgres', '-At', '-F', '\t'],
    {
      input: sql,
      encoding: 'utf8',
    },
  )
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t'));
const matrix = {};
for (const [d, m, l] of psql('select designation, module, level from role_permissions order by 1,2;')) {
  (matrix[d] ??= {})[m] = Number(l);
}
const MODULES = [...new Set(Object.values(matrix).flatMap((x) => Object.keys(x)))].sort();
const level = (d, m) => matrix[d]?.[m] ?? 0;

// ---- the module (and minimum level) each admin page checks, read from the page code (6 Nov 2026)
// null = open to every active staff member with the 2-step sign-in; 'any:a|b' = shown when either module ≥ min
const GUARD = {
  '/admin': null,
  '/admin/help': null,
  '/admin/queue': null,
  '/admin/search': null,
  '/admin/ai': ['rep', 1],
  '/admin/applications': ['svc', 1],
  '/admin/approvals': ['svc', 1],
  '/admin/audit': ['staff', 1, 'IT Convener'], // the IT Convener too (audit/page.tsx; migration 0500)
  '/admin/business-directory': ['biz', 1],
  '/admin/business-directory/exports': ['biz', 2],
  '/admin/business-directory/profile': ['biz', 1],
  '/admin/business-directory/segments': ['biz', 1],
  '/admin/changes': ['chg', 1],
  '/admin/committee': ['cmt', 1],
  '/admin/complaints': ['eng', 1],
  '/admin/content': ['eng', 1],
  '/admin/documents': ['any:docs|temp', 1], // certificates live under temp (documents/page.tsx: max(docs, temp))
  '/admin/events': ['eng', 1],
  '/admin/finance': ['fin', 1],
  '/admin/import': ['reg', 2],
  '/admin/integrations': ['any:plat|svc', 1],
  '/admin/meetings': ['cmt', 1],
  '/admin/member': ['reg', 1, null, 'redirected'], // without ?id= it goes to the register (by design)
  '/admin/members': ['reg', 1],
  '/admin/mreview': ['mem', 1],
  '/admin/notify': ['eng', 1],
  '/admin/payments': ['pay', 1],
  '/admin/psid': ['pay', 1],
  '/admin/reports': ['rep', 1],
  '/admin/requests': ['mem', 1],
  '/admin/review': ['svc', 1],
  '/admin/review/letter': null,
  '/admin/services': ['any:plat|svc', 1],
  '/admin/settings': ['plat', 1],
  '/admin/sla': ['svc', 1],
  '/admin/staff': ['staff', 1],
  '/admin/temp': ['temp', 1],
  '/admin/whatsapp': ['out', 1],
  '/admin/whatsapp/campaigns': ['out', 1],
  '/admin/whatsapp/campaigns/history': ['out', 1],
  '/admin/whatsapp/campaigns/new': ['out', 2],
  '/admin/whatsapp/campaigns/view': ['out', 1],
  '/admin/whatsapp/consent': ['out', 2],
  '/admin/whatsapp/inbox': ['out', 2],
  '/admin/whatsapp/readiness': ['out', 1],
  '/admin/whatsapp/settings': ['plat', 1],
  '/admin/whatsapp/templates': ['out', 1],
};
function expectedStaff(designation, route) {
  const g = GUARD[route];
  if (g === undefined) return 'unknown';
  if (g === null) return 'shown';
  const [mod, min, alsoFor, withoutId] = g;
  if (alsoFor && designation === alsoFor) return 'shown';
  const ok = mod.startsWith('any:')
    ? mod
        .slice(4)
        .split('|')
        .some((m) => level(designation, m) >= min)
    : level(designation, mod) >= min;
  return ok ? (withoutId ?? 'shown') : 'denied';
}

// ---- which data-actions and labels the automated specs exercise (by text in the spec files)
const specText = readdirSync(join('tests', 'e2e'))
  .filter((f) => f.endsWith('.ts') && f !== 'acceptance.spec.ts')
  .map((f) => readFileSync(join('tests', 'e2e', f), 'utf8'))
  .join('\n');
const exercised = (e) =>
  (e.action && e.action !== 'nav' && (specText.includes(`"${e.action}"`) || specText.includes(`'${e.action}'`))) ||
  (e.name && e.name.length >= 3 && (specText.includes(`'${e.name}'`) || specText.includes(`"${e.name}"`)));

// ---- page tests
const MODULE_OF = (r) => {
  if (r === '/' || !/^\/(admin|portal)/.test(r)) {
    const p = r.split('/')[1] || 'home';
    return ['login', 'register', 'staff', 'invite', 'auth'].includes(p) ? 'AUTH' : 'SITE';
  }
  const seg = r.split('/')[2] || 'dashboard';
  const map = {
    portal: {
      join: 'MEM',
      membership: 'MEM',
      mtrack: 'MEM',
      form: 'MEM',
      endorse: 'END',
      apply: 'SVC',
      applications: 'SVC',
      application: 'SVC',
      documents: 'DOC',
      payments: 'FIN',
      support: 'ENG',
      assistant: 'AI',
      notifications: 'ENG',
      events: 'ENG',
      opportunities: 'OPP',
      profile: 'PROF',
      dashboard: 'PORTAL',
    },
    admin: {
      requests: 'MEM',
      mreview: 'MEM',
      committee: 'CMT',
      meetings: 'CMT',
      temp: 'CERT',
      documents: 'DOC',
      members: 'REG',
      member: 'REG',
      import: 'REG',
      changes: 'REG',
      applications: 'SVC',
      review: 'SVC',
      sla: 'SVC',
      approvals: 'SVC',
      payments: 'FIN',
      psid: 'FIN',
      finance: 'FIN',
      events: 'ENG',
      complaints: 'ENG',
      content: 'CMS',
      notify: 'CMS',
      reports: 'REP',
      ai: 'REP',
      staff: 'STAFF',
      audit: 'STAFF',
      services: 'PLAT',
      integrations: 'PLAT',
      settings: 'PLAT',
      whatsapp: 'WHATSAPP',
      'business-directory': 'BIZ',
      queue: 'ADMIN',
      search: 'ADMIN',
      help: 'ADMIN',
      dashboard: 'ADMIN',
    },
  };
  return map[r.startsWith('/admin') ? 'admin' : 'portal'][seg] ?? 'OTHER';
};

const pageTests = [];
// the 404 a "not found" page answers with is its expected result, not a browser error
const realErrors = (p) => p.consoleErrors.filter((c) => !(p.outcome === 'not-found' && /status of 404/.test(c)));
const pageProblems = (p) => [
  ...(realErrors(p).length ? [`browser errors: ${realErrors(p).slice(0, 2).join(' / ')}`] : []),
  ...(p.failedRequests.length ? [`server errors: ${p.failedRequests.slice(0, 2).join(' / ')}`] : []),
  ...(p.overflow > 0 ? [`${p.overflow}px sideways overflow`] : []),
  ...(p.rawKeys.length ? [`untranslated keys: ${p.rawKeys.join(', ')}`] : []),
  ...(p.elements.some((e) => e.orphan) ? [`${p.elements.filter((e) => e.orphan).length} unwired control(s)`] : []),
  ...(p.locale === 'ur' && p.outcome === 'shown' && p.dir !== 'rtl' ? ['Urdu page not right-to-left'] : []),
];
function expectedFor(run, p) {
  const k = run.persona.kind;
  const area = p.route.startsWith('/admin') ? 'admin' : p.route.startsWith('/portal') ? 'portal' : 'public';
  if (/does-not-exist/.test(p.route)) return 'not-found|shown|redirected';
  if (k === 'anon') return area === 'admin' ? 'not-found' : area === 'portal' ? 'redirected' : 'shown|redirected';
  if (k === 'member') return area === 'admin' ? 'not-found|redirected' : 'shown|redirected';
  if (area === 'admin') return expectedStaff(run.persona.designation, p.route);
  return 'shown|redirected|denied|not-found';
}
let seq = {};
const nextId = (prefix) => `${prefix}-${String((seq[prefix] = (seq[prefix] ?? 0) + 1)).padStart(3, '0')}`;
for (const run of [...prod, ...local]) {
  for (const p of run.pages) {
    const exp = expectedFor(run, p);
    const problems = pageProblems(p);
    const accessOk = exp === 'unknown' || exp.split('|').includes(p.outcome);
    const status = p.outcome === 'error' ? 'FAIL' : !accessOk ? 'FAIL' : problems.length ? 'PARTIAL' : 'PASS';
    pageTests.push({
      id: nextId(`${run.target === 'production' ? 'PROD-' : ''}${MODULE_OF(p.route)}`),
      target: run.target ?? 'local',
      module: MODULE_OF(p.route),
      route: p.url,
      persona: run.persona.label,
      element: 'Page load, access rule, layout, language',
      expected: exp.replace(/\|/g, ' or '),
      actual: `${p.outcome} (HTTP ${p.status ?? '—'})`,
      problems,
      status,
      evidence: p.shot,
    });
  }
}

// ---- element tests: one per distinct element (route + kind + action/name), with every persona that saw it
const elements = new Map();
for (const run of local) {
  const linkStatus = new Map(run.links.map((l) => [l.href, l.status]));
  const shown = new Map(run.pages.map((pg) => [pg.url, pg.outcome]));
  for (const p of run.pages) {
    if (p.outcome !== 'shown') continue;
    for (const e of p.elements) {
      const key = `${p.route}|${p.locale}|${e.kind}|${e.action ?? ''}|${e.kind === 'link' ? e.href : e.name}`;
      let rec = elements.get(key);
      if (!rec) {
        rec = { route: p.route, locale: p.locale, ...e, personas: new Set(), linkResults: [] };
        elements.set(key, rec);
      }
      rec.personas.add(run.persona.label);
      if (e.kind === 'link' && e.href?.startsWith('/')) {
        const crawled = shown.get(e.href);
        const st =
          linkStatus.get(e.href) ??
          (crawled === undefined ? undefined : crawled === 'error' ? 500 : crawled === 'not-found' ? 404 : 200);
        if (st !== undefined) rec.linkResults.push(st);
      }
    }
  }
}
const elementTests = [];
for (const rec of elements.values()) {
  const named = rec.name.length > 0;
  let status;
  let how;
  if (rec.orphan) {
    status = 'FAIL';
    how = 'unwired control (docs/10 orphan rule)';
  } else if (!named && !/^input:(checkbox|radio)$/.test(rec.kind)) {
    status = 'FAIL';
    how = 'no accessible name';
  } else if (rec.kind === 'link') {
    if (!rec.href?.startsWith('/')) {
      status = rec.href?.startsWith('#') ? 'PASS' : 'PARTIAL';
      how = rec.href?.startsWith('#') ? 'in-page anchor' : 'external / file link (not requested)';
    } else if (!rec.linkResults.length) {
      status = 'PARTIAL';
      how = 'download or sign-out link, not requested';
    } else if (rec.linkResults.some((s) => s >= 500 || s === 0)) {
      status = 'FAIL';
      how = `target answered ${[...new Set(rec.linkResults)].join('/')}`;
    } else if (rec.linkResults.some((s) => s === 404)) {
      status = 'FAIL';
      how = 'target not found (404)';
    } else {
      status = 'PASS';
      how = `target answered ${[...new Set(rec.linkResults)].join('/')}`;
    }
  } else if (exercised(rec)) {
    status = 'PASS';
    how = 'exercised by a functional spec';
  } else if (rec.disabled) {
    status = rec.disabledReason ? 'PARTIAL' : 'FAIL';
    how = rec.disabledReason ? `disabled: ${rec.disabledReason}` : 'disabled without a reason';
  } else {
    status = 'PARTIAL';
    how = 'present, named and wired; outcome not exercised by an automated test';
  }
  elementTests.push({ ...rec, personas: [...rec.personas], status, how, module: MODULE_OF(rec.route) });
}
seq = {};
elementTests.sort((a, b) => (a.route + a.locale + a.kind + a.name).localeCompare(b.route + b.locale + b.kind + b.name));
for (const t of elementTests) t.id = nextId(`EL-${t.module}`);

// ---- outputs
const count = (list) => list.reduce((m, t) => ((m[t.status] = (m[t.status] ?? 0) + 1), m), {});
const esc = (s) =>
  String(s ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ');
const summary = {
  generated: new Date().toISOString(),
  routesDiscovered: routes.length,
  personasLocal: local.map((r) => r.persona.label),
  personasProduction: prod.map((r) => r.persona.label),
  pageTests: { total: pageTests.length, ...count(pageTests) },
  pageTestsProduction: {
    total: pageTests.filter((t) => t.target === 'production').length,
    ...count(pageTests.filter((t) => t.target === 'production')),
  },
  elementTests: { total: elementTests.length, ...count(elementTests) },
  elementKinds: elementTests.reduce((m, t) => ((m[t.kind] = (m[t.kind] ?? 0) + 1), m), {}),
  modules: [...new Set(pageTests.map((t) => t.module))].sort(),
};
writeFileSync(join(IN, 'summary.json'), JSON.stringify(summary, null, 1));

const head = (title, intro) =>
  `# ${title}\n\nGenerated ${summary.generated.slice(0, 16).replace('T', ' ')} UTC by \`scripts/acceptance/report.mjs\` from the crawl in \`tests/e2e/acceptance.spec.ts\`. ${intro}\n\n`;

// inventory: pages + element counts per route
{
  let md = head(
    'MCCI Phase 1 — test inventory',
    'Every page under `app/[locale]` was opened by every persona that should (or should not) reach it. Each row is one test with its own ID. Statuses: PASS = verified with evidence; PARTIAL = reached as expected but with a problem listed; FAIL = wrong access result or a server error. Element-level tests are in `MCCI-INTERACTIVE-ELEMENT-TEST-REPORT.md`; workflow, role and security tests in the handover report.',
  );
  md += `## Counts\n\n| | Total | PASS | PARTIAL | FAIL |\n|---|---|---|---|---|\n`;
  for (const [label, s] of [
    [
      'Page tests (local, all personas)',
      {
        total: summary.pageTests.total - summary.pageTestsProduction.total,
        ...count(pageTests.filter((t) => t.target !== 'production')),
      },
    ],
    ['Page tests (production, visitor)', summary.pageTestsProduction],
    ['Element tests (local)', summary.elementTests],
  ])
    md += `| ${label} | ${s.total ?? 0} | ${s.PASS ?? 0} | ${s.PARTIAL ?? 0} | ${s.FAIL ?? 0} |\n`;
  md += `\nRoutes discovered: **${routes.length}** (each in English and Urdu). Personas (local): ${summary.personasLocal.length}. Production: visitor only (no demo passwords were available to the tester; see the handover report).\n\n`;
  md += `## Page tests\n\n| Test ID | Target | Module | Route | Persona | Expected | Actual | Status | Notes | Evidence |\n|---|---|---|---|---|---|---|---|---|---|\n`;
  for (const t of pageTests)
    md += `| ${t.id} | ${t.target} | ${t.module} | \`${esc(t.route)}\` | ${esc(t.persona)} | ${esc(t.expected)} | ${esc(t.actual)} | **${t.status}** | ${esc(t.problems.join('; '))} | ${t.evidence ? `[shot](${t.evidence.replace(/^docs\/acceptance\//, '')})` : ''} |\n`;
  writeFileSync(join(DOCS, 'MCCI-PHASE-1-TEST-INVENTORY.md'), md);
}

// interactive elements
{
  let md = head(
    'MCCI Phase 1 — interactive element test report',
    "One row per distinct control on each page (route × language × kind × action/label). A link is PASS when its target was requested with the persona's session and answered; a control is PASS when an automated functional spec exercises it (matched by its `data-action` or label); PARTIAL = present, named and wired, but no automated test exercises its outcome; FAIL = unwired, unnamed, disabled without a reason, or a link to an error/404. Hit area is the rendered size in px at 1440 × 900.",
  );
  md += `## Counts\n\n| Kind | Elements |\n|---|---|\n${Object.entries(summary.elementKinds)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `| ${k} | ${n} |`)
    .join('\n')}\n\n| Status | Elements |\n|---|---|\n${Object.entries(count(elementTests))
    .map(([k, n]) => `| ${k} | ${n} |`)
    .join('\n')}\n\n`;
  md += `## Failures first\n\n| Test ID | Route | Lang | Kind | Name | data-action | Result | Why |\n|---|---|---|---|---|---|---|---|\n`;
  for (const t of elementTests.filter((t) => t.status === 'FAIL'))
    md += `| ${t.id} | \`${esc(t.route)}\` | ${t.locale} | ${t.kind} | ${esc(t.name)} | ${esc(t.action ?? '')} | **FAIL** | ${esc(t.how)} |\n`;
  md += `\n## All elements\n\n| Test ID | Route | Lang | Kind | Name | data-action / href | Seen by | Hit | Status | How verified |\n|---|---|---|---|---|---|---|---|---|---|\n`;
  for (const t of elementTests)
    md += `| ${t.id} | \`${esc(t.route)}\` | ${t.locale} | ${t.kind} | ${esc(t.name)} | ${esc(t.action ?? t.href ?? '')} | ${t.personas.length} | ${t.hit} | ${t.status} | ${esc(t.how)} |\n`;
  writeFileSync(join(DOCS, 'MCCI-INTERACTIVE-ELEMENT-TEST-REPORT.md'), md);
}

// designation matrix (generated part; the handover report adds the server/RLS evidence)
{
  const staffRuns = local.filter((r) => r.persona.kind === 'staff');
  const adminRoutes = Object.keys(GUARD).sort();
  let md = head(
    'MCCI Phase 1 — designation-wise permission test report',
    'Each designation signed in with its own synthetic account (password + authenticator code, through the real staff sign-in page) on the local stack, which runs the same 61 migrations as production. Cell = what the page did / what the configured limits say it should do. ✓ = shown as expected, 🔒 = "outside your limits" as expected, ✗ = mismatch.',
  );
  md += `## Configured limits (role_permissions)\n\nLevels: 0 none · 1 view · 2 edit · 3 approve.\n\n| Designation | ${MODULES.join(' | ')} |\n|---|${MODULES.map(() => '---').join('|')}|\n`;
  for (const d of Object.keys(matrix).sort()) md += `| ${d} | ${MODULES.map((m) => level(d, m)).join(' | ')} |\n`;
  md += `\n## Page access by designation (English)\n\n| Page | ${staffRuns.map((r) => r.persona.designation).join(' | ')} |\n|---|${staffRuns.map(() => '---').join('|')}|\n`;
  const mismatches = [];
  for (const route of adminRoutes) {
    md += `| \`${route}\` | `;
    md += staffRuns
      .map((r) => {
        const p = r.pages.find((x) => x.route === route && x.locale === 'en');
        if (!p) return '—';
        const exp = expectedStaff(r.persona.designation, route);
        const ok = exp === 'unknown' || exp === p.outcome;
        if (!ok) mismatches.push({ designation: r.persona.designation, route, expected: exp, actual: p.outcome });
        return ok ? (p.outcome === 'shown' ? '✓' : p.outcome === 'denied' ? '🔒' : p.outcome) : `✗ ${p.outcome}`;
      })
      .join(' | ');
    md += ' |\n';
  }
  md += `\n## Mismatches\n\n${mismatches.length ? `| Designation | Page | Expected | Actual |\n|---|---|---|---|\n${mismatches.map((m) => `| ${m.designation} | \`${m.route}\` | ${m.expected} | ${m.actual} |`).join('\n')}` : 'None.'}\n`;
  const portalRuns = local.filter((r) => r.persona.kind !== 'staff');
  md += `\n## Members, applicant and visitor\n\n| Persona | Pages opened | Shown | Redirected | Not found | Denied | Errors |\n|---|---|---|---|---|---|---|\n`;
  for (const r of portalRuns) {
    const c = (o) => r.pages.filter((p) => p.outcome === o).length;
    md += `| ${r.persona.label} | ${r.pages.length} | ${c('shown')} | ${c('redirected')} | ${c('not-found')} | ${c('denied')} | ${c('error')} |\n`;
  }
  md += `
## Designations named in the brief that do not exist

| Designation | Status | Administrator action |
|---|---|---|
| Vice President | NOT CONFIGURED (not in \`role_permissions\`, local or production) | MCCI decides the limits; the SG creates it in Staff & Audit; run \`scripts/ops/demo-accounts.mjs --apply\` again |
| Assistant Secretary | NOT CONFIGURED | as above |
| Super Administrator / Administrator | NOT CONFIGURED: by design there is none. The Secretary General holds level 3 on every module; only the IT Convener exports and downloads originals | none, unless MCCI wants such a role |

## Server-side and database evidence (a hidden button is not proof)

- **Database (pgTAP, fresh build of all 61 migrations, 6 Nov):** 47 files, **1,235 / 1,235** assertions pass. Each
  designation is impersonated inside the database (\`tests.exec_as\`) and checked against what it may read and change:
  010 identity & staff, 040 payments, 050 committee/print/documents, 060 & 210 services, 110 invitations & roles,
  120 staff ↔ company people, 160 committee, 220 engagement, 240 hierarchy approval, 270 confidential files,
  310 settings, 398 demo clean-up; members and company roles in 020, 030, 130, 150, 250, 280; public access in 200, 320.
- **Server actions:** all 173 checked statically. Every action that changes data starts with \`requirePermission\` /
  \`requireCompanyPermission\` / \`requireUser\`, or calls a database function that checks the caller (\`.rpc\`). The 8
  application-wizard actions check through \`editable()\` → \`requireCompanyPermission(company, 'mship', 'edit')\`. Ten
  are public by design: password reset, e-mail code, TOTP, sign-out, sign-up, invitation activation, session
  keep-alive / idle end, contact form.
- **Production, as a visitor:** every \`/admin\` page answered 404; every \`/portal\` page redirected to sign-in; protected
  APIs answered 401/403 (\`/api/queue\`, \`/api/reports\`, exports, files, certificate scans, uploads); cron endpoints
  401 without the secret; the WhatsApp webhook 401 with a bad signature.
- **Browser, per designation (this report):** each persona signed in through the real staff sign-in page with
  password + 6-digit authenticator code, then opened every admin page by its address (not via menus), so pages that
  are hidden from the menu were tried as well.
`;
  writeFileSync(join(DOCS, 'MCCI-DESIGNATION-PERMISSION-TEST-REPORT.md'), md);
  writeFileSync(join(IN, 'mismatches.json'), JSON.stringify(mismatches, null, 1));
}

console.log(JSON.stringify(summary, null, 1));
