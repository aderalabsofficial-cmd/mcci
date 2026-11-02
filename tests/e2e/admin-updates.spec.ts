import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { readAccounts } from './accounts';
import { signInAs } from './helpers';

/**
 * The owner's admin updates of 1 Nov 2026 (docs/31), end to end: Accounts on MCCI's statement, the voter list, the
 * register and member record, change declarations, media on posts, access, the audience tabs and Ask MCCI AI.
 */
const accounts = readAccounts();
test.describe.configure({ mode: 'serial' });

const tag = randomBytes(3).toString('hex').toUpperCase();
const seed = (Number.parseInt(tag, 16) % 80_000) + 10_000;
const PDF = { name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') };
const PNG = {
  name: 'photo.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/AAAMBAQAY3Y2wAAAAAElFTkSuQmCC',
    'base64',
  ),
};
let admin: SupabaseClient;
const ids: Record<string, { member: string; company: string; no: string; name: string }> = {};

test.beforeAll(async () => {
  const env = readLocalEnv();
  if (!env) return;
  admin = createClient(env.url, env.secretKey, { auth: { persistSession: false } });
  await admin.from('fin_entries').delete().like('party', 'MEPCO %'); // an interrupted run must not change the totals
  await admin.from('staff_permission_overrides').delete().eq('module', 'fin').eq('reason', 'e2e');
  const rows = [
    ['exact', 'Corporate', '2026-07-13', '2099-03-31', 'Permanent', null],
    ['late', 'Corporate', '2026-07-14', '2099-03-31', 'Permanent', null],
    ['assoc', 'Associate', '2010-01-01', '2099-03-31', 'Permanent', null],
    ['legacy', 'Associate', null, '2099-03-31', 'Permanent', null],
  ] as const;
  let n = seed;
  for (const [key, cls, since, valid, status] of rows) {
    n += 1;
    const name = `Upd ${key} ${tag}`;
    const { data: c } = await admin.from('companies').insert({ name, biz_type: 'prop' }).select('id').single();
    const no = `MCCI-${cls[0]}-${n}`;
    const { data: m, error } = await admin
      .from('members')
      .insert({
        member_no: no,
        company_id: c!.id,
        class: cls,
        status,
        rep_name: `Rep ${key}`,
        since,
        valid_to: valid,
        imported: key === 'legacy',
      })
      .select('id')
      .single();
    if (error) throw error;
    ids[key] = { member: m!.id, company: c!.id, no, name };
  }
});

test.afterAll(async () => {
  if (!admin) return;
  for (const v of Object.values(ids)) {
    await admin.from('members').delete().eq('id', v.member);
    await admin.from('companies').delete().eq('id', v.company);
  }
});

const voterRow = (page: Page, key: string) => page.locator(`[data-voter="${ids[key]!.no}"]`);

test('the voter list follows the rules, with filters, reasons and a logged export', async ({ page }) => {
  await signInAs(page, 'sg');
  await page.goto('/admin/reports');
  await page.locator('[data-field="voter-cutoff"]').fill('2028-07-13');
  await page.locator('[data-action="voter.apply"]').click();
  await expect(page).toHaveURL(/cutoff=2028-07-13/);
  await expect(voterRow(page, 'exact')).toHaveAttribute('data-reason', 'eligible');
  await expect(voterRow(page, 'late')).toHaveCount(0); // not on the eligible list
  await page.locator('[data-action="voter.result"][data-result="not_eligible"]').click();
  await expect(voterRow(page, 'late')).toHaveAttribute('data-reason', 'too_new');
  await expect(voterRow(page, 'legacy')).toHaveAttribute('data-reason', 'no_date');
  await expect(voterRow(page, 'legacy')).toContainText('Enrollment date missing');
  await page.locator('[data-action="voter.class"][data-class="Associate"]').click();
  await expect(voterRow(page, 'late')).toHaveCount(0);
  await expect(voterRow(page, 'legacy')).toBeVisible();
  await page.goto('/admin/ai?cutoff=2028-07-13');
  await expect(voterRow(page, 'exact')).toBeVisible(); // the same list on the AI page
  const res = await page.request.get('/api/reports/voters?cutoff=2028-07-13&result=eligible');
  expect(res.ok()).toBe(true);
  const csv = await res.text();
  expect(csv).toContain(ids.exact!.no);
  expect(csv).not.toContain(ids.late!.no);
  const { count } = await admin.from('voter_list_exports').select('id', { count: 'exact', head: true }).eq('cutoff', '2028-07-13');
  expect(count).toBeGreaterThan(0);
});

test('the voter list and Accounts are closed to staff without access', async ({ page }) => {
  await signInAs(page, 'staff');
  expect((await page.request.get('/api/reports/voters?cutoff=2028-07-13')).status()).toBe(403);
  await page.goto('/admin/finance');
  await expect(page.locator('[data-sheet]')).toHaveCount(0);
});

test('register: search and tabs; a click opens the record; a legacy date comes from the records', async ({ page }) => {
  await signInAs(page, 'sg');
  await page.goto('/admin/members?show=noDate');
  const link = page.getByRole('link', { name: ids.legacy!.name });
  await expect(link).toBeVisible();
  await expect(page.getByRole('link', { name: ids.exact!.name })).toHaveCount(0);
  await page.locator('[data-field="reg-search"]').fill(ids.legacy!.no);
  await page.locator('[data-action="reg.search"]').click();
  await expect(page).toHaveURL(/q=MCCI/);
  await page.getByRole('link', { name: ids.legacy!.name }).click();
  await expect(page).toHaveURL(/admin\/member\?id=/);
  await expect(page.locator('[data-enrollment="none"]')).toContainText('Date missing');
  await expect(page.getByRole('main')).toContainText('Valid till');
  await page.locator('[data-field="enroll-secp"]').fill('2005-06-01');
  await page.locator('[data-field="enroll-fbr"]').fill('2003-02-01');
  await page.locator('[data-action="reg.enrollment.save"]').click();
  await expect(page.locator('[data-enrollment="2003-02-01"]')).toBeVisible();
  await page.getByRole('link', { name: 'Back to the register' }).click();
  await expect(page).toHaveURL(/admin\/members/);
  // the page without a member sends you to the register rather than to an empty screen
  await page.goto('/admin/member');
  await expect(page).toHaveURL(/admin\/members/);
});

test('renewal: declaration required; period editable with a reason; a declared change reaches the queue and the profile', async ({ page }) => {
  await signInAs(page, 'sg');
  await admin.from('members').update({ valid_to: '2026-03-31' }).eq('id', ids.assoc!.member);
  await page.goto(`/admin/member?id=${ids.assoc!.member}`);
  await page.locator('[data-action="reg.renew"]').click();
  const d = page.getByRole('dialog');
  await d.locator('[data-field="renew-from"]').fill('2027-01-15');
  await d.locator('[data-field="declare-change"]').check();
  await d.locator('[data-field="change-summary"]').fill('New representative appointed');
  await d.locator('[data-field="change-rep_name"]').fill(`New Rep ${tag}`);
  await d.locator('[data-field="change-document"]').setInputFiles(PDF);
  await expect(d.locator('[data-uploaded="doc.pdf"]')).toBeVisible();
  await d.locator('[data-action="reg.renew.confirm"]').click();
  await expect(d.getByRole('alert')).toContainText(/reason/i); // the changed date needs its reason
  expect((await admin.from('change_declarations').select('id').eq('company_id', ids.assoc!.company)).data).toHaveLength(0); // and nothing is left behind
  await d.locator('[data-field="renew-reason"]').fill('DGTO order of 5 January');
  await d.locator('[data-action="reg.renew.confirm"]').click();
  await expect(page.getByRole('status').filter({ hasText: /Renewal voucher PV-/ })).toBeVisible();
  const { data: q } = await admin.from('membership_requests').select('valid_from, no_change, declaration_id').eq('member_id', ids.assoc!.member).eq('status', 'open').single();
  expect(q).toMatchObject({ valid_from: '2027-01-15', no_change: false });
  expect(q!.declaration_id).toBeTruthy();

  await page.goto('/admin/changes');
  const card = page.locator(`[data-declaration="${q!.declaration_id}"]`);
  await expect(card).toContainText('New representative appointed');
  await expect(card).toContainText(`New Rep ${tag}`);
  expect((await admin.from('members').select('rep_name').eq('id', ids.assoc!.member).single()).data!.rep_name).toBe('Rep assoc');
  await card.locator('[data-action="chg.reject"]').click();
  await expect(card.getByRole('alert')).toContainText(/reason/i); // a refusal needs its reason
  await card.locator('[data-action="chg.approve"]').click();
  await expect(page.locator(`[data-declaration="${q!.declaration_id}"][data-status="Approved"]`)).toBeVisible();
  expect((await admin.from('members').select('rep_name').eq('id', ids.assoc!.member).single()).data!.rep_name).toBe(`New Rep ${tag}`);

  // it stays in the member's history
  await page.goto(`/admin/member?id=${ids.assoc!.member}&tab=history`);
  await expect(page.locator(`[data-section="history"] [data-declaration="${q!.declaration_id}"]`)).toContainText('Approved');
  await expect(page.locator('[data-section="history"] [data-request="renewal"]')).toContainText('15 Jan 2027');
});

test('Accounts: an expense on MCCI\'s chart reaches the statement and the Trial Balance; verified by someone else', async ({ page, browser }) => {
  test.setTimeout(120_000);
  await signInAs(page, 'sg');
  await page.goto('/admin/finance');
  await expect(page.locator('[data-table="receipts"]')).toContainText('Membership Fee: Admission');
  await expect(page.locator('[data-group="A-7"]')).toContainText('Electricity');
  await page.locator('[data-action="fin.tab"][data-tab="entries"]').click();
  await page.getByRole('combobox', { name: 'Account' }).selectOption({ label: 'Electricity' });
  await page.locator('[data-field="fin-amount"]').fill('1,250.50');
  await page.locator('[data-field="fin-party"]').fill(`MEPCO ${tag}`);
  await page.locator('[data-field="fin-attachment"]').setInputFiles(PDF);
  await expect(page.locator('[data-uploaded="doc.pdf"]')).toBeVisible();
  await page.locator('[data-action="fin.entry.save"]').click();
  await expect(page.getByRole('status').filter({ hasText: /Entry FE-\d{4}-\d+ saved/ })).toBeVisible();
  const row = page.locator('[data-entry]', { hasText: `MEPCO ${tag}` });
  await expect(row).toContainText('(1,250.50)');
  await expect(row).toHaveAttribute('data-status', 'Recorded');
  await expect(row.locator('[data-action="fin.entry.verify"]')).toHaveCount(0); // not your own

  await page.locator('[data-action="fin.tab"][data-tab="statement"]').click();
  await expect(page.locator('[data-account="Electricity"]')).toContainText('1,250.50');
  await expect(page.locator('[data-total="expense"]')).toContainText('1,250.50');
  await page.locator('[data-action="fin.preset"][data-preset="year"]').click();
  await expect(page.locator('[data-account="Electricity"]')).toContainText('1,250.50');
  await page.locator('[data-action="fin.tab"][data-tab="trial"]').click();
  await expect(page.locator('[data-trial-agrees="true"]')).toBeVisible();
  const csv = await page.request.get(`/api/finance/export?report=pl&from=2020-01-01&to=2099-12-31`);
  expect(await csv.text()).toContain('Electricity');

  // the President views but does not record by default; given Approve level, a second person verifies it
  const entry = (await admin.from('fin_entries').select('id').eq('party', `MEPCO ${tag}`).single()).data!;
  const second = await browser.newContext();
  const other = await second.newPage();
  await signInAs(other, 'president');
  await other.goto('/admin/finance?tab=entries&preset=year');
  await expect(other.locator('[data-action="fin.entry.save"]')).toHaveCount(0);
  await expect(other.locator('[data-entry]', { hasText: `MEPCO ${tag}` }).locator('[data-action="fin.entry.verify"]')).toHaveCount(0);
  await admin.from('staff_permission_overrides').insert({ user_id: accounts.president!.id, module: 'fin', level: 3, reason: 'e2e' });
  await other.reload();
  await other.locator('[data-entry]', { hasText: `MEPCO ${tag}` }).locator('[data-action="fin.entry.verify"]').click();
  await expect(other.locator('[data-entry][data-status="Verified"]', { hasText: `MEPCO ${tag}` })).toBeVisible({ timeout: 20_000 });
  await admin.from('staff_permission_overrides').delete().eq('user_id', accounts.president!.id).eq('module', 'fin');
  await second.close();

  await page.goto('/admin/finance?tab=entries');
  await page.locator('[data-entry]', { hasText: `MEPCO ${tag}` }).locator('[data-action="fin.entry.void"]').click();
  const d = page.getByRole('dialog');
  await d.locator('[data-action="fin.entry.void.confirm"]').click();
  await expect(d.getByRole('alert')).toContainText(/reason/i);
  await d.locator('[data-field="fin-void-reason"]').fill('Entered against the wrong month');
  await d.locator('[data-action="fin.entry.void.confirm"]').click();
  await expect(page.locator('[data-entry][data-status="Voided"]', { hasText: `MEPCO ${tag}` })).toBeVisible();
  expect((await admin.from('fin_entries').select('status').eq('id', entry.id).single()).data!.status).toBe('Voided');
});

test('payments filter by class and by admission, renewal or restoration', async ({ page }) => {
  await signInAs(page, 'sg');
  await page.goto('/admin/payments');
  await page.locator('[data-action="pay.class"][data-class="Associate"]').click();
  await expect(page).toHaveURL(/class=Associate/);
  await page.locator('[data-action="pay.category"][data-category="renewal"]').click();
  await expect(page).toHaveURL(/class=Associate.*category=renewal/);
  const voucher = (await admin.from('membership_requests').select('voucher_no').eq('member_id', ids.assoc!.member).eq('kind', 'renewal').single()).data!.voucher_no;
  await expect(page.locator(`[data-voucher="${voucher}"]`).first()).toBeVisible();
  await page.locator('[data-action="pay.class"][data-class="Corporate"]').click();
  await expect(page.locator(`[data-voucher="${voucher}"]`)).toHaveCount(0);
});

test('a new post carries its photo and file to the public news page', async ({ page }) => {
  test.setTimeout(90_000);
  await signInAs(page, 'sg');
  await page.goto('/admin/content');
  await page.locator('[data-action="post.create"]').click();
  const d = page.getByRole('dialog');
  await d.getByLabel('Status').selectOption('Live');
  const title = `Media post ${tag}`;
  await d.locator('input[name="title"]').fill(title);
  await d.locator('textarea[name="body"]').fill('A post with a photo and a file.');
  await d.locator('[data-field="media-files"]').setInputFiles([PNG, PDF]);
  await expect(d.locator('[data-media-new="photo.png"]')).toBeVisible();
  await d.locator('[data-action="post.save"]').click();
  await expect(d).toBeHidden({ timeout: 30_000 });
  const { data: post } = await admin.from('posts').select('id').eq('title', title).single();
  const { data: media } = await admin.from('content_media').select('kind').eq('post_id', post!.id);
  expect(media?.map((m) => m.kind).sort()).toEqual(['file', 'image']);
  await page.goto(`/news?post=${post!.id}#post`);
  await expect(page.locator('[data-gallery] img')).toHaveCount(1);
  await expect(page.locator('[data-action="media.file"]')).toContainText('doc.pdf');
  // a renamed file is refused by its bytes
  const bad = await page.request.post('/api/content/media', {
    multipart: { post: post!.id, file: { name: 'x.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not an image') } },
  });
  expect(bad.status()).toBe(400);
  await admin.from('posts').delete().eq('id', post!.id);
});

test('access: a new designation and a service officer, each after the password', async ({ page }) => {
  test.setTimeout(90_000);
  await signInAs(page, 'sg');
  const sg = accounts.sg!;
  // other specs use this account's password in the same run; the limit of 5 tries in 15 minutes is tested elsewhere
  execSync(process.env.MCCI_IT_SQL_CMD ?? '', { input: "delete from private.rate_limits where bucket like 'reauth:%';" });
  await page.goto('/admin/staff');
  const name = `Media Officer ${tag}`;
  const card = page.locator('[data-section="add-designation"]');
  await card.locator('[data-field="designation-name"]').fill(name);
  await card.getByLabel('Your password').fill('wrong-password-here');
  await card.locator('[data-action="perm.designation"]').click();
  await expect(card.getByRole('alert')).toBeVisible();
  await expect(card.locator('[data-field="designation-name"]')).toHaveValue(name); // what was typed stays
  expect((await admin.from('designations').select('name').eq('name', name)).data).toHaveLength(0);
  await card.getByLabel('Your password').fill(sg.password);
  await card.locator('[data-action="perm.designation"]').click();
  await expect(card.getByRole('status')).toContainText(name);
  await page.goto('/admin/staff'); // a designation with no translated hint must not break the page
  await expect(page.locator(`[data-designation="${name}"]`)).toBeVisible();

  const officers = page.locator('[data-section="service-officers"]');
  await officers.locator('[data-action="perm.service.pick"][data-service="co"]').click();
  const first = officers.locator('input[name="officers"]').first();
  await first.check();
  await officers.getByLabel('Your password').fill(sg.password);
  await officers.locator('[data-action="perm.service"]').click();
  await expect(officers.getByRole('status')).toBeVisible();
  const { data: set } = await admin.from('service_assignees').select('user_id').eq('service_key', 'co');
  expect(set).toHaveLength(1);
  await admin.from('service_assignees').delete().eq('service_key', 'co');
  await admin.from('role_permissions').delete().eq('designation', name);
  await admin.from('designations').delete().eq('name', name);
});

test('WhatsApp audience: tabs instead of dropdowns; WhatsApp settings carry the daily limit', async ({ page }) => {
  await signInAs(page, 'sg');
  await page.goto('/admin/whatsapp/campaigns/new');
  const tabs = page.locator('[data-section="audience-tabs"]');
  await expect(tabs.locator('select')).toHaveCount(0);
  await tabs.locator('[data-tab="member_class"][data-value="Corporate"]').click();
  await expect(page).toHaveURL(/member_class/);
  await expect(tabs.locator('[data-tab="member_class"][data-value="Corporate"]')).toHaveAttribute('aria-current', 'true');
  await tabs.locator('[data-tab="renewal"][data-value="lapsed"]').click();
  await expect(tabs.locator('[data-tab="member_class"][data-value="Corporate"]')).toHaveAttribute('aria-current', 'true');
  await expect(tabs.locator('[data-tab="renewal"][data-value="lapsed"]')).toHaveAttribute('aria-current', 'true');
  await tabs.locator('[data-action="wa.tabs.clear"]').click();
  await expect(tabs.locator('[data-tab="member_class"][data-value="all"]')).toHaveAttribute('aria-current', 'true');
  await page.goto('/admin/whatsapp/settings');
  await expect(page.locator('[data-field="daily-limit"]')).toHaveValue('250');
});

test('Ask MCCI AI answers staff in plain words and links only to what they may open', async ({ page }) => {
  await signInAs(page, 'sg');
  await page.goto('/admin/help');
  await page.locator('[data-field="guide-question"]').fill('voter list for 13 July 2028');
  await page.locator('[data-action="guide.ask"]').click();
  await expect(page.locator('[data-guide-link*="cutoff=2028-07-13"]')).toBeVisible();
  await page.locator('[data-action="guide.suggest"][data-suggest="expense"]').click();
  await expect(page.locator('[data-guide-link*="/admin/finance"]')).toBeVisible();
  await page.locator('[data-guide-link*="/admin/finance"] [data-action="guide.open"]').first().click();
  await expect(page).toHaveURL(/admin\/finance/);

  await page.context().clearCookies();
  await signInAs(page, 'staff'); // a Membership Officer has no Accounts access
  await page.goto('/admin/help');
  await page.locator('[data-field="guide-question"]').fill('profit and loss statement');
  await page.locator('[data-action="guide.ask"]').click();
  await expect(page.locator('[data-guide-answer]')).toBeVisible();
  await expect(page.locator('[data-guide-link*="/admin/finance"]')).toHaveCount(0);
});
