import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

// `endorsements` is readable by user-session clients only column by column (migration 0260, docs/17 §4a), so
// `select('*')` there fails at runtime with "permission denied" although it type-checks. The types
// (lib/supabase/client-types.ts) cover named columns; these selectors cover what types cannot. They inspect a string
// argument or the static parts of a template-literal argument; `${…}` substitutions, split builders and constants
// are not inspected (docs/17 §4a lists the gaps). In the patterns \x2c is a comma (a literal comma would end the
// selector) and an item may contain up to two levels of nested embeds, e.g. `members(id, companies(id))`.
const SELECT = "CallExpression[callee.property.name='select']";
const FROM_ENDORSEMENTS = "CallExpression[callee.property.name='from'][arguments.0.value='endorsements']";
const NESTED = String.raw`\((?:[^()]|\([^()]*\))*\)`;
const ITEMS_BEFORE = String.raw`\s*(?:(?:[^()\x2c]|${NESTED})*\x2c\s*)*`; // earlier items of the same embed
const EMBED_OPEN = String.raw`\bendorsements\b[^(\x2c]*\(`; // endorsements( / e:endorsements!inner( / ...endorsements(
const PATTERN = {
  star: String.raw`(^|\x2c)\s*\*`,
  evidence: String.raw`\b(ip|user_agent)\b`,
  embeddedStar: `${EMBED_OPEN}${ITEMS_BEFORE}\\*`,
  embeddedEvidence: `${EMBED_OPEN}${ITEMS_BEFORE}(?:\\w+\\s*:\\s*)?(?:ip|user_agent)\\b`,
};
/** The select's first argument as a string, or any static part of it as a template literal. */
const columnsMatch = (pattern, scope, message) => [
  { selector: `${SELECT}${scope}[arguments.0.value=/${pattern}/]`, message },
  { selector: `${SELECT}${scope} > TemplateLiteral > TemplateElement[value.cooked=/${pattern}/]`, message },
];
const STAR_MESSAGE =
  "endorsements: list the columns — '*' includes ip/user_agent, which user-session clients cannot read (docs/17 §4a).";
const EMBEDDED_STAR_MESSAGE = "endorsements(*): list the embedded columns — '*' includes ip/user_agent (docs/17 §4a).";
const EVIDENCE_MESSAGE =
  'endorsements.ip / user_agent are signing evidence: only the service-role client may read them (docs/17 §4a).';
const ENDORSEMENTS_STAR = [
  {
    selector: `${SELECT}[arguments.length=0]:has(${FROM_ENDORSEMENTS})`,
    message:
      "endorsements: list the columns — select() means '*', which user-session clients cannot read (docs/17 §4a).",
  },
  ...columnsMatch(PATTERN.star, `:has(${FROM_ENDORSEMENTS})`, STAR_MESSAGE),
  ...columnsMatch(PATTERN.embeddedStar, '', EMBEDDED_STAR_MESSAGE),
];
const ENDORSEMENTS_EVIDENCE = [
  ...columnsMatch(PATTERN.evidence, `:has(${FROM_ENDORSEMENTS})`, EVIDENCE_MESSAGE),
  ...columnsMatch(PATTERN.embeddedEvidence, '', EVIDENCE_MESSAGE),
];
// lib/auth/admin: privileged Auth operations that run before or around a user's own session (login identifier
// lookup, invitations, staff 2-step reset), each after its own server-side checks.
// lib/endorse/admin: the endorser's one-time code (issued to the server only) and storing the signature image in the
// applicant's file area, each after the endorser's own session has shown the request belongs to them.
const SERVICE_ROLE_PATHS = [
  'app/api/**',
  'lib/pdf/**',
  'lib/supabase/admin.ts',
  'lib/auth/admin/**',
  'lib/endorse/admin/**',
  'lib/verify/admin/**',
  'lib/temp/admin/**',
  'lib/demo/admin/**',
];

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'reference/**',
      'mcci-digital-prototypes/**',
      'mobile/**',
      'test-results/**',
      'playwright-report/**',
      'lib/supabase/types.ts',
      'next-env.d.ts',
      'deploy/selfhost/upstream/**', // verbatim upstream (deploy/selfhost/UPSTREAM.md)
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/supabase/admin',
              message:
                'Secret-key client: only cron handlers, PDF generation, /api/verify and lib/auth/admin (docs/01-architecture.md).',
            },
          ],
        },
      ],
    },
  },
  {
    // Playwright fixtures must be destructured, even when a callback needs none: ({}, testInfo) => …
    files: ['tests/e2e/**'],
    rules: { 'no-empty-pattern': 'off' },
  },
  {
    // the places allowed to use the service-role client
    files: [...SERVICE_ROLE_PATHS, 'tests/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // user-session code: no '*' and no evidence columns on endorsements
    files: ['**/*.{ts,tsx}'],
    ignores: [...SERVICE_ROLE_PATHS, 'tests/**'],
    rules: { 'no-restricted-syntax': ['error', ...ENDORSEMENTS_STAR, ...ENDORSEMENTS_EVIDENCE] },
  },
  {
    // service-role paths may read the evidence, but still list columns (they may also hold user-session clients)
    files: SERVICE_ROLE_PATHS,
    rules: { 'no-restricted-syntax': ['error', ...ENDORSEMENTS_STAR] },
  },
];

export default config;
