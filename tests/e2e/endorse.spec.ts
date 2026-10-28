import { randomBytes, randomUUID } from 'node:crypto';
import { expect, type Browser, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { signInAs } from './helpers';

/**
 * Proposer & seconder (docs/04; consent only since 0430, docs/21 point 17): the applicant of a verified file picks a
 * proposer and a seconder from the eligible members and sends the requests; each endorser signs in, reads the summary
 * and presses Approve — no signature, no emailed code. After both, the file waits for the Membership Officer to type
 * the number and forward it. Staff add an existing member in the Members Register.
 */
const env = readLocalEnv();
test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

type Person = { id: string; email: string; password: string; company: string; memberNo: string; rep: string };

let admin: SupabaseClient;
let applicant: Person;
const endorsers: Person[] = [];
let appId = '';
const tag = `t${randomUUID().slice(0, 5)}`;

async function person(name: string): Promise<Person> {
  const email = `e2e-end-${randomUUID().slice(0, 8)}@test.local`;
  const password = randomBytes(18).toString('base64url');
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  expect(error).toBeNull();
  const company = randomUUID();
  await admin.from('companies').insert({ id: company, name: `${name} Co ${tag}`, biz_type: 'prop' });
  await admin.from('company_users').insert({ company_id: company, user_id: data.user!.id, role: 'Owner' });
  return { id: data.user!.id, email, password, company, memberNo: '', rep: name };
}

test.beforeAll(async () => {
  if (!env) return;
  admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  applicant = await person('Endorse Applicant');
  for (const [i, name] of ['Proposer', 'Seconder'].entries()) {
    const p = await person(`${name} Member ${tag}`);
    p.memberNo = `MCCI-A-9${String(Date.now()).slice(-4)}${i}`;
    const { error } = await admin.from('members').insert({
      member_no: p.memberNo,
      company_id: p.company,
      class: 'Associate',
      status: 'Permanent',
      rep_name: p.rep,
      since: '2015-04-01',
      valid_to: `${new Date().getUTCFullYear() + 1}-03-31`,
    });
    expect(error).toBeNull();
    endorsers.push(p);
  }
  const { data: app, error } = await admin
    .from('applications')
    .insert({
      company_id: applicant.company,
      created_by: applicant.id,
      stage: 'proposer',
      submitted_at: new Date().toISOString(),
      class: 'Associate',
      jurisdiction_ok: true,
      decl1: true,
      decl2: true,
      sign_path: `${applicant.company}/applications/x/sign/s.png`,
      form: {
        biz: 'prop',
        nature: { sector: 'trade', items: ['Wholesaler'], other: '' },
        addrMatch: true,
        name: `Endorse Traders ${tag}`,
        address: '2 Bosan Road, Multan',
        ntn: '1234567-9',
        tel: '061-2',
        email: 'e@test.local',
        particulars: 'Wholesale & Distribution: Wholesaler',
        est: '2016-01-01',
        rep: 'Endorse Applicant',
        desig: 'Proprietor',
        cnic: '36302-5555555-5',
        mobile: '0300-5555555',
      },
    })
    .select('id')
    .single();
  expect(error).toBeNull();
  appId = app!.id;
});

test.afterAll(async () => {
  if (!admin || !applicant?.id) return;
  const people = [applicant, ...endorsers];
  await admin.from('endorsements').delete().eq('application_id', appId);
  await admin.from('email_log').delete().eq('application_id', appId);
  await admin.from('applications').delete().eq('id', appId);
  await admin.from('members').delete().in('member_no', endorsers.map((e) => e.memberNo));
  for (const p of people) {
    await admin.from('notifications').delete().eq('user_id', p.id);
    await admin.from('companies').delete().eq('id', p.company);
    await admin.auth.admin.deleteUser(p.id);
  }
});

async function login(page: Page, who: Person) {
  await page.goto('/login');
  await page.getByLabel('Mobile, email or member ID').fill(who.email);
  await page.getByRole('tabpanel', { name: 'Member login' }).getByLabel('Password').fill(who.password);
  await page.locator('[data-action="login.member"]').click();
  await expect(page).toHaveURL(/\/portal$/, { timeout: 20_000 });
}

async function approve(browser: Browser, who: Person) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, who);
  await page.goto('/portal/endorse');
  await page.locator('[data-action="end.approve"]').first().click();
  // consent only: no signature pad, no emailed code (owner's decision, docs/21 point 17)
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('canvas')).toHaveCount(0);
  await expect(dialog.getByLabel(/code/i)).toHaveCount(0);
  await dialog.locator('[data-action="end.approve.confirm"]').click();
  await expect(page.getByRole('main').getByRole('status')).toContainText('Approved — the applicant can see it now.');
  await ctx.close();
}

const stage = async () =>
  (await admin.from('applications').select('stage').eq('id', appId).single()).data!.stage as string;

test('applicant asks a proposer and a seconder; both approve in their portal; the file waits for the officer', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  await login(page, applicant);
  await page.goto('/portal/join');
  for (const [i, role] of ['proposer', 'seconder'].entries()) {
    const who = endorsers[i]!;
    await page.locator(`[data-role="${role}"] [data-action="end.pick"]`).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Search by name, company, sector or membership no.').fill(who.memberNo);
    await dialog.locator(`[data-member="${who.memberNo}"] [data-action="end.compose"]`).click();
    await dialog.locator('[data-action="end.compose"]').click();
    await expect(page.getByRole('main').getByRole('status')).toContainText('Request sent');
    await expect(page.locator(`[data-role="${role}"]`)).toContainText(who.rep);
    const { data } = await admin.from('endorsements').select('role, status').eq('application_id', appId).eq('role', role);
    expect(data).toEqual([{ role, status: 'Pending' }]);
  }

  // the applicant's own company never appears as a choice; endorsers approve in turn
  await approve(browser, endorsers[0]!);
  expect(await stage()).toBe('proposer');
  await approve(browser, endorsers[1]!);
  // nothing moves by itself: the Membership Officer types the number and forwards (0430)
  expect(await stage()).toBe('proposer');

  const { data: rows } = await admin
    .from('endorsements')
    .select('status, signature_path, ref')
    .eq('application_id', appId);
  expect(rows!.every((r) => r.status === 'Approved' && !r.signature_path && /^[0-9A-F]{12}$/.test(r.ref))).toBe(true);
});

test('staff add an existing member and invite its owner', async ({ page }) => {
  test.setTimeout(90_000);
  const company = `Register Test ${tag}`;
  const email = `e2e-reg-${tag}@test.local`;
  await signInAs(page, 'staff');
  await page.goto('/admin/members');
  await expect(page.getByRole('heading', { name: 'Members Register' })).toBeVisible();
  await page.locator('[data-action="mem.add"]').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Business / company name').fill(company);
  await dialog.getByLabel('Authorized representative').fill('Register Owner');
  await dialog.getByLabel("Owner's name (portal account)").fill('Register Owner');
  await dialog.getByLabel("Owner's email (invitation)").fill(email);
  await dialog.locator('[data-action="mem.add.confirm"]').click();
  await expect(page.getByRole('main').getByRole('status')).toContainText(/Member MCCI-A-\d+ added/);
  await expect(page.getByRole('cell', { name: company })).toBeVisible();

  const { data: c } = await admin.from('companies').select('id').eq('name', company).single();
  await admin.from('invitations').delete().eq('company_id', c!.id);
  await admin.from('members').delete().eq('company_id', c!.id);
  await admin.from('companies').delete().eq('id', c!.id);
});
