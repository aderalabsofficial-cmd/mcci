import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * The no-restricted-syntax selectors in eslint.config.mjs that cover what the types cannot: `select('*')` on
 * `endorsements` type-checks for user-session clients but fails at runtime ("permission denied", docs/17 §4a).
 * Runs the project's real config against snippets placed at representative paths. Every snippet must parse: a
 * syntax error would otherwise look like "not flagged".
 */
let eslint: ESLint;
const USER_CODE = 'app/[locale]/portal/endorse/example.tsx';
const SERVICE_ROLE_CODE = 'app/api/pdf/example.ts';

async function restricted(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath });
  const messages = result?.messages ?? [];
  expect(messages.filter((m) => m.fatal).map((m) => m.message)).toEqual([]);
  return messages.filter((m) => m.ruleId === 'no-restricted-syntax').map((m) => m.message);
}

const snippet = (query: string) => `declare const db: any;\ndeclare const cols: string;\nexport const q = ${query};\n`;

beforeAll(() => {
  eslint = new ESLint({ cwd: process.cwd() });
}, 60_000);

describe('ESLint guard for endorsements columns', () => {
  it.each([
    // string arguments
    ["db.from('endorsements').select('*')", 'star'],
    ["db.from('endorsements').select()", 'no argument means *'],
    ["db.from('endorsements').select('id, *')", 'star after a column'],
    ["db.from('endorsements').select('*').eq('id', 1)", 'star with a filter'],
    ["db.from('endorsements').select('*', { count: 'exact' })", 'star with options'],
    ["db\n  .from('endorsements')\n  .select(\n    '*',\n  )", 'multiline call'],
    ["db.from('applications').select('id, endorsements(*)')", 'embedded star'],
    ["db.from('applications').select('id, e:endorsements!fk(*)')", 'aliased embedded star'],
    ["db.from('applications').select('id, ...endorsements(*)')", 'spread embedded star'],
    ["db.from('applications').select('id, endorsements!inner(*)')", '!inner embedded star'],
    ["db.from('members').select('id, applications(id, endorsements(*))')", 'nested embedded star'],
    ["db.from('applications').select('id, endorsements(\\n  *\\n)')", 'escaped multiline embedded star'],
    ["db.from('applications').select('id, endorsements(id, *)')", 'embedded column then star'],
    ["db.from('applications').select('id, endorsements(id,*)')", 'embedded column then star, no space'],
    ["db.from('applications').select('id, e:endorsements!inner(id, *)')", 'aliased !inner column then star'],
    ["db.from('applications').select('id, ...endorsements(id, *)')", 'spread column then star'],
    ["db.from('applications').select('id, endorsements(members(id), *)')", 'nested embed then star'],
    [
      "db.from('applications').select('id, endorsements(id, members(id, companies(id)), *)')",
      'two-level nest then star',
    ],
    ["db.from('applications').select('id, endorsements(\\n  id,\\n  *\\n)')", 'escaped multiline column then star'],
    ["db.from('endorsements').select('id, ip')", 'evidence column'],
    ["db.from('endorsements').select('user_agent')", 'evidence column'],
    ["db.from('endorsements').select('id, addr:ip')", 'renamed evidence column'],
    ["db.from('endorsements').select('id, ip::text')", 'cast evidence column'],
    ["db.from('applications').select('id, endorsements(status, ip)')", 'embedded evidence column'],
    ["db.from('applications').select('id, endorsements(members(id), ip)')", 'embedded evidence after a nested embed'],
    // template-literal arguments
    ["db.from('endorsements').select(`*`)", 'template star'],
    ["db.from('endorsements').select(`id, *`)", 'template star after a column'],
    ["db.from('endorsements').select(`id, ip`)", 'template evidence column'],
    ["db.from('endorsements').select(`\n  id,\n  user_agent\n`)", 'multiline template evidence column'],
    ["db.from('applications').select(`id, endorsements(*)`)", 'template embedded star'],
    ["db.from('applications').select(`\n  id,\n  endorsements(*)\n`)", 'multiline template embedded star'],
    [
      "db.from('applications').select(`\n  id,\n  endorsements(\n    id,\n    *\n  )\n`)",
      'multiline template column then star',
    ],
    ["db.from('applications').select(`id, endorsements(id, ip)`)", 'template embedded evidence column'],
    ["db.from('endorsements').select(`id, ${cols}, *`)", 'static star next to a substitution'],
  ])(
    'flags %s in user-session code (%s)',
    async (query) => {
      expect(await restricted(snippet(query), USER_CODE)).toHaveLength(1);
    },
    30_000,
  );

  it.each([
    "db.from('endorsements').select('id, status, application_id')",
    "db.from('applications').select('*')",
    "db.from('applications').select('id, endorsements(id, status)')",
    "db.from('applications').select('id, endorsements(id, members(*))')",
    "db.from('applications').select('id, endorsements(id, members(id, companies(*)))')",
    "db.from('endorsements').select('id, description, decline_reason')",
    "db.from('endorsements').select('id, members(ip_address)')",
    "db.from('endorsements').select(`id, status`)",
    "db.from('endorsements').select(`\n  id,\n  status\n`)",
    "db.from('applications').select(`*`)",
    "db.from('applications').select(`\n  *,\n  endorsements(id, status)\n`)",
    "db.from('applications').select(`id, endorsements(id, members(*))`)",
    "db.from('members').select(`id, endorsements_count`)",
    "document.querySelector('x'); select('*')",
  ])(
    'allows %s',
    async (query) => {
      expect(await restricted(snippet(query), USER_CODE)).toHaveLength(0);
    },
    30_000,
  );

  // Documented limitation (docs/17 §4a): substituted parts are not inspected, so these are NOT flagged.
  it.each(["db.from('endorsements').select(`${cols}`)", "db.from('applications').select(`id, endorsements(${cols})`)"])(
    'does not inspect ${…} substitutions: %s',
    async (query) => {
      expect(await restricted(snippet(query), USER_CODE)).toHaveLength(0);
    },
    30_000,
  );

  it('service-role paths may name the evidence columns but must still list columns', async () => {
    expect(
      await restricted(snippet("db.from('endorsements').select('id, ip, user_agent')"), SERVICE_ROLE_CODE),
    ).toHaveLength(0);
    expect(await restricted(snippet("db.from('endorsements').select(`id, ip`)"), SERVICE_ROLE_CODE)).toHaveLength(0);
    expect(await restricted(snippet("db.from('endorsements').select('*')"), SERVICE_ROLE_CODE)).toHaveLength(1);
    expect(await restricted(snippet("db.from('endorsements').select(`*`)"), SERVICE_ROLE_CODE)).toHaveLength(1);
    expect(
      await restricted(snippet("db.from('applications').select(`id, endorsements(id, *)`)"), SERVICE_ROLE_CODE),
    ).toHaveLength(1);
  }, 30_000);
});
