import { randomBytes, randomUUID } from 'node:crypto';
import { expect, type Browser, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { signInAs } from './helpers';

/**
 * Demo mode for presentations (migration 0350), all through the screens: the Secretary General adds two demo members
 * and a demo applicant; each accepts the emailed invitation and sets a password; the demo applicant asks the two
 * demo members to propose and second; each signs with the 6-digit code from their mailbox. Demo accounts stay out of
 * the official register; "Remove all demo data" deletes them, their sign-in accounts included.
 */
const env = readLocalEnv();
test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));
test.describe.configure({ mode: 'serial' });

const MAILPIT = 'http://127.0.0.1:54324';
// never all digits: emails are searched for the 6-digit signing code
const tag = `t${randomUUID().slice(0, 5)}`;
const password = randomBytes(18).toString('base64url');
const people = {
  proposer: { email: `demo-p-${tag}@test.local`, company: `Alpha ${tag}`, rep: `Demo Proposer ${tag}`, kind: 'member' },
  seconder: { email: `demo-s-${tag}@test.local`, company: `Beta ${tag}`, rep: `Demo Seconder ${tag}`, kind: 'member' },
  applicant: { email: `demo-a-${tag}@test.local`, company: `Gamma ${tag}`, rep: `Demo Applicant ${tag}`, kind: 'applicant' },
} as const;
let admin: SupabaseClient;

test.beforeAll(() => {
  if (env) admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
});

test.afterAll(async () => {
  if (!admin) return;
  // safety net if the test stopped before "Remove all demo data"
  const { data: cos } = await admin.from('companies').select('id').like('name', `DEMO — %${tag}`);
  for (const c of cos ?? []) {
    await admin.from('endorsements').delete().in('endorser_member_id', (await admin.from('members').select('id').eq('company_id', c.id)).data?.map((m) => m.id) ?? []);
    await admin.from('applications').delete().eq('company_id', c.id);
    await admin.from('members').delete().eq('company_id', c.id);
    await admin.from('companies').delete().eq('id', c.id);
  }
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of users?.users ?? []) if (u.email?.endsWith(`-${tag}@test.local`)) await admin.auth.admin.deleteUser(u.id);
});

async function mail(to: string, pattern: RegExp): Promise<string> {
  let found = '';
  await expect
    .poll(
      async () => {
        const list = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)).json();
        for (const msg of list.messages ?? []) {
          const m = await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json();
          const hit = pattern.exec(m.Text ?? '');
          if (hit) return (found = hit[1]!);
        }
        return '';
      },
      { timeout: 20_000 },
    )
    .not.toBe('');
  return found;
}

/** accept the invitation from the mailbox and set a password: the person is then signed in */
async function activate(browser: Browser, email: string): Promise<Page> {
  const link = await mail(email, /(https?:\/\/\S+\/invite\/\S+)/);
  const page = await (await browser.newContext()).newPage();
  await page.goto(new URL(link).pathname);
  await page.getByLabel('Create password').fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.locator('[data-action="invite.activate"]').click();
  await expect(page).toHaveURL(/\/portal/);
  return page;
}

test('demo members: added by the SG, sign in on their own, propose and second with the emailed code; removed in one step', async ({
  page,
  browser,
}) => {
  test.setTimeout(240_000);
  await signInAs(page, 'sg');
  await page.goto('/admin/members');
  const card = page.locator('[data-demo-card]');
  for (const p of Object.values(people)) {
    await card.locator('[data-action="demo.add"]').click();
    const d = page.getByRole('dialog');
    await d.getByLabel('Account').selectOption(p.kind);
    await d.getByLabel('Company name (DEMO is added)').fill(p.company);
    await d.getByLabel('Representative').fill(p.rep);
    await d.getByLabel('Name of the person signing in').fill(p.rep);
    await d.getByLabel('Mailbox for the invitation and codes').fill(p.email);
    await d.locator('[data-action="demo.add.confirm"]').click();
    await expect(card.locator('[data-outcome="ok"]')).toContainText('Demo account added');
  }
  await expect(card.locator('[data-demo-row^="DEMO-A-"]')).toHaveCount(2);
  // not in the official register
  await expect(page.getByRole('main').locator('table').first()).not.toContainText(`DEMO — ${people.proposer.company}`);

  // each person accepts the invitation and sets their own password
  const proposer = await activate(browser, people.proposer.email);
  const seconder = await activate(browser, people.seconder.email);
  const applicant = await activate(browser, people.applicant.email);

  // the demo applicant's form (set up directly: the wizard itself is covered by application.spec)
  const { data: co } = await admin.from('companies').select('id').eq('name', `DEMO — ${people.applicant.company}`).single();
  const { data: u } = await admin.from('company_users').select('user_id').eq('company_id', co!.id).single();
  const { data: app, error } = await admin
    .from('applications')
    .insert({ company_id: co!.id, created_by: u!.user_id, stage: 'draft', form: { biz: 'prop', step: 3, name: `Gamma ${tag}`, rep: people.applicant.rep } })
    .select('id')
    .single();
  expect(error).toBeNull();

  await applicant.goto('/portal/join');
  for (const [role, who] of [['proposer', people.proposer], ['seconder', people.seconder]] as const) {
    await applicant.locator(`[data-role="${role}"] [data-action="end.pick"]`).click();
    const d = applicant.getByRole('dialog');
    await expect(d.locator('[data-member^="DEMO-A-"]')).toHaveCount(2);
    const no = (await admin.from('members').select('member_no, companies!inner(name)').eq('companies.name', `DEMO — ${who.company}`).single()).data!.member_no;
    await d.locator(`[data-member="${no}"] [data-action="end.compose"]`).click();
    await d.locator('[data-action="end.compose"]').click();
    await expect(applicant.locator(`[data-role="${role}"]`)).toContainText(who.rep);
  }

  // each demo member signs with the code from their mailbox
  for (const [p, who] of [[proposer, people.proposer], [seconder, people.seconder]] as const) {
    await p.goto('/portal/endorse');
    await p.locator('[data-action="end.sign"]').first().click();
    const d = p.getByRole('dialog');
    const pad = d.locator('canvas.sigpad');
    const box = (await pad.boundingBox())!;
    await p.mouse.move(box.x + 30, box.y + 40);
    await p.mouse.down();
    await p.mouse.move(box.x + 200, box.y + 80, { steps: 10 });
    await p.mouse.up();
    await d.locator('[data-action="end.code"]').click();
    await d.getByLabel('6-digit code from your email').fill(await mail(who.email, /\b(\d{6})\b/));
    await d.locator('[data-action="end.sign.confirm"]').click();
    await expect(p.getByRole('main').getByRole('status')).toContainText('Signed');
  }
  const { data: ends } = await admin.from('endorsements').select('status').eq('application_id', app!.id);
  expect(ends!.map((e) => e.status)).toEqual(['Approved', 'Approved']);

  // one step removes everything demo, sign-in accounts included
  await page.goto('/admin/members');
  await card.locator('[data-action="demo.clear"]').click();
  await page.locator('[data-action="demo.clear.confirm"]').click();
  await expect(card.locator('[data-outcome="ok"]')).toContainText('Demo data removed');
  expect((await admin.from('companies').select('id').eq('demo', true)).data).toEqual([]);
  expect((await admin.from('applications').select('id').eq('id', app!.id)).data).toEqual([]);
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  expect((users?.users ?? []).filter((x) => x.email?.endsWith(`-${tag}@test.local`))).toEqual([]);
});
