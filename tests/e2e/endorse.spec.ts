import { randomBytes, randomUUID } from 'node:crypto';
import { expect, type Browser, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { signInAs } from './helpers';

/**
 * Release 3 proposer & seconder (docs/04): the applicant of a verified file picks a proposer and a seconder from the
 * eligible members and sends the requests; each endorser signs in, reads the declaration, draws a signature and
 * confirms with the 6-digit code emailed to them (read from Mailpit); after the second signature the file moves to
 * the Membership Committee. Staff add an existing member in the Members Register.
 */
const env = readLocalEnv();
test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

const MAILPIT = 'http://127.0.0.1:54324';
type Person = { id: string; email: string; password: string; company: string; memberNo: string; rep: string };

let admin: SupabaseClient;
let applicant: Person;
const endorsers: Person[] = [];
let appId = '';
// never all digits: emails are searched for the 6-digit signing code
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
  await expect(page).toHaveURL(/\/portal$/);
}

/** the newest 6-digit code Mailpit caught for this address */
async function codeFor(email: string): Promise<string> {
  let found = '';
  await expect
    .poll(
      async () => {
        const list = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)).json();
        const id = list.messages?.[0]?.ID;
        if (!id) return '';
        const m = await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json();
        found = /\b(\d{6})\b/.exec(m.Text ?? '')?.[1] ?? '';
        return found;
      },
      { timeout: 15_000 },
    )
    .toMatch(/^\d{6}$/);
  return found;
}

async function sign(browser: Browser, who: Person) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, who);
  await page.goto('/portal/endorse');
  await page.locator('[data-action="end.sign"]').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('[data-action="end.decl"]')).toHaveAttribute('aria-pressed', 'true');
  const pad = dialog.locator('canvas.sigpad');
  const box = (await pad.boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 90, { steps: 8 });
  await page.mouse.move(box.x + 220, box.y + 50, { steps: 8 });
  await page.mouse.up();
  await dialog.locator('[data-action="end.code"]').click();
  await expect(dialog.getByRole('status')).toContainText('We emailed a 6-digit code');
  await dialog.getByLabel('6-digit code from your email').fill(await codeFor(who.email));
  await dialog.locator('[data-action="end.sign.confirm"]').click();
  await expect(page.getByRole('main').getByRole('status')).toContainText('Signed — the applicant can see it now.');
  await ctx.close();
}

const stage = async () =>
  (await admin.from('applications').select('stage').eq('id', appId).single()).data!.stage as string;

test('applicant asks a proposer and a seconder; both sign with an emailed code; the file goes to committee', async ({
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

  // the applicant's own company never appears as a choice; endorsers sign in turn
  await sign(browser, endorsers[0]!);
  expect(await stage()).toBe('proposer');
  await sign(browser, endorsers[1]!);
  expect(await stage()).toBe('committee');

  const { data: rows } = await admin
    .from('endorsements')
    .select('status, signature_path')
    .eq('application_id', appId);
  expect(rows!.every((r) => r.status === 'Approved' && r.signature_path)).toBe(true);
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
