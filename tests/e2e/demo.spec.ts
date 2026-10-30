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
  const { data: cos } = await admin.from('companies').select('id').like('name', `%${tag}`);
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
  await page.getByLabel('Confirm password', { exact: true }).fill(password);
  await page.locator('[data-action="invite.activate"]').click();
  // account creation + first sign-in take several seconds when the laptop runs the whole suite
  await expect(page).toHaveURL(/\/portal/, { timeout: 20_000 });
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

  // each demo member approves in their portal (consent only: no signature, no code)
  for (const p of [proposer, seconder]) {
    // a demo member is an active member: no application of their own, the waiting request is on their home page
    await p.goto('/portal');
    await expect(p.getByRole('main')).toContainText('You are an MCCI member');
    await expect(p.getByRole('main')).not.toContainText('Start my application');
    await p.getByRole('link', { name: /Open requests \(1\)/ }).click();
    await expect(p).toHaveURL(/\/portal\/endorse/);
    await p.locator('[data-action="end.approve"]').first().click();
    await p.getByRole('dialog').locator('[data-action="end.approve.confirm"]').click();
    await expect(p.getByRole('main').getByRole('status')).toContainText('Approved');
  }
  const { data: ends } = await admin.from('endorsements').select('status').eq('application_id', app!.id);
  expect(ends!.map((e) => e.status)).toEqual(['Approved', 'Approved']);

  // one step removes everything demo, sign-in accounts included
  await page.goto('/admin/members');
  await card.locator('[data-action="demo.clear"]').click();
  await page.locator('[data-action="demo.clear.confirm"]').click();
  await expect(card.locator('[data-outcome="ok"]')).toContainText('Demo data removed', { timeout: 30_000 });
  expect((await admin.from('companies').select('id').eq('demo', true)).data).toEqual([]);
  expect((await admin.from('applications').select('id').eq('id', app!.id)).data).toEqual([]);
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  expect((users?.users ?? []).filter((x) => x.email?.endsWith(`-${tag}@test.local`))).toEqual([]);
});

test('a self-registered applicant marked as demo by the SG can choose the demo members; removed with the demo data', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  // someone who signed up on their own (as on production): a real company, a draft application
  const email = `demo-r-${tag}@test.local`;
  const { data: u, error: ue } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Self ${tag}` } });
  expect(ue).toBeNull();
  const { data: co } = await admin.from('companies').insert({ name: `Delta ${tag}`, biz_type: 'prop' }).select('id').single();
  await admin.from('company_users').insert({ company_id: co!.id, user_id: u.user!.id, role: 'Owner' });
  await admin.from('applications').insert({ company_id: co!.id, created_by: u.user!.id, stage: 'draft', form: { biz: 'prop', step: 3, name: `Delta ${tag}`, rep: `Self ${tag}` } });

  // a demo member to choose
  await signInAs(page, 'sg');
  await page.goto('/admin/members');
  const card = page.locator('[data-demo-card]');
  await card.locator('[data-action="demo.add"]').click();
  const add = page.getByRole('dialog');
  await add.getByLabel('Company name (DEMO is added)').fill(`Zeta ${tag}`);
  await add.getByLabel('Representative').fill(`Demo Zeta ${tag}`);
  await add.getByLabel('Name of the person signing in').fill(`Demo Zeta ${tag}`);
  await add.getByLabel('Mailbox for the invitation and codes').fill(`demo-z-${tag}@test.local`);
  await add.locator('[data-action="demo.add.confirm"]').click();
  await expect(card.locator('[data-outcome="ok"]')).toContainText('Demo account added');

  // before: the applicant finds no demo member (production had no real members either: "No members found")
  const applicant = await (await browser.newContext()).newPage();
  await applicant.goto('/login');
  await applicant.getByLabel('Mobile, email or member ID').fill(email);
  await applicant.getByRole('tabpanel', { name: 'Member login' }).getByLabel('Password', { exact: true }).fill(password);
  await applicant.locator('[data-action="login.member"]').click();
  await expect(applicant).toHaveURL(/\/portal/, { timeout: 20_000 });
  await applicant.goto('/portal/join');
  await applicant.locator('[data-role="proposer"] [data-action="end.pick"]').click();
  const pick = applicant.getByRole('dialog');
  await expect(pick).not.toContainText('Searching', { timeout: 15_000 });
  await expect(pick.locator('[data-member^="DEMO-"]')).toHaveCount(0);

  // the SG marks the applicant as demo
  await card.locator('[data-action="demo.mark"]').click();
  const mark = page.getByRole('dialog');
  await mark.getByLabel('Applicant').selectOption(co!.id);
  await mark.locator('[data-action="demo.mark.confirm"]').click();
  await expect(card.locator('[data-outcome="ok"]')).toContainText('is now a demo applicant');
  await expect(card.locator('table')).toContainText(`DEMO — Delta ${tag}`);
  // not in the official register
  await expect(page.getByRole('main').locator('table').first()).not.toContainText(`Delta ${tag}`);

  // after: the demo member is there to choose
  await applicant.goto('/portal/join');
  await applicant.locator('[data-role="proposer"] [data-action="end.pick"]').click();
  await expect(applicant.getByRole('dialog').locator('[data-member^="DEMO-A-"]')).toHaveCount(1);

  // removed with the demo data, sign-in included
  await page.goto('/admin/members');
  await card.locator('[data-action="demo.clear"]').click();
  await page.locator('[data-action="demo.clear.confirm"]').click();
  await expect(card.locator('[data-outcome="ok"]')).toContainText('Demo data removed', { timeout: 30_000 });
  expect((await admin.from('companies').select('id').eq('id', co!.id)).data).toEqual([]);
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  expect((users?.users ?? []).filter((x) => x.email === email)).toEqual([]);
});
