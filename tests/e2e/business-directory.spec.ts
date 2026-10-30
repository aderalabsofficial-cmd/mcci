import { randomBytes } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { NO_BACKEND, readAccounts } from './accounts';
import { signInAs } from './helpers';

/**
 * Business directory (docs/29): filters with a live count, sorting and paging keep the filter, selection survives
 * paging, segments stay dynamic, official data is untouched, consent and opt-out, export control and log.
 */
const accounts = readAccounts();
const tag = randomBytes(3).toString('hex').toUpperCase();
const TEXTILE = `E2E Textile ${tag}`;
const TRADER = `E2E Trader ${tag}`;
const NATURE = `E2E-Textile-${tag}`;
const PHONE = `+92300${String(Number.parseInt(tag, 16)).padStart(7, '0').slice(0, 7)}`;
const SEGMENT = `E2E segment ${tag}`;
let admin: SupabaseClient;
const companies: string[] = [];
const members: Record<string, string> = {};

const nature = (v: string) =>
  `/admin/business-directory?f=${encodeURIComponent(JSON.stringify({ groups: [{ match: 'all', exclude: false, rules: [{ field: 'nature', op: 'in', value: [v] }] }] }))}`;

test.beforeAll(async () => {
  if (!accounts.backend) return;
  const env = readLocalEnv()!;
  admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const [name, manufacturing, no] of [
    [TEXTILE, true, `E2E-${tag}-1`],
    [TRADER, false, `E2E-${tag}-2`],
  ] as const) {
    const { data: c, error } = await admin
      .from('companies')
      .insert({ name, biz_type: 'pvt', manufacturing, nature_sector: NATURE, address: 'Road 1', tel: '061-1' })
      .select('id')
      .single();
    expect(error).toBeNull();
    companies.push(c!.id);
    const { data: m, error: e2 } = await admin
      .from('members')
      .insert({
        member_no: no,
        company_id: c!.id,
        class: 'Corporate',
        status: 'Permanent',
        rep_name: 'E2E Rep',
        since: '2026-04-01',
        valid_to: '2099-03-31',
      })
      .select('id')
      .single();
    expect(e2).toBeNull();
    members[name] = m!.id;
  }
});

test.afterAll(async () => {
  if (!admin) return;
  await admin.from('segments').delete().eq('name', SEGMENT);
  await admin.from('outreach_suppressions').delete().eq('phone', PHONE);
  await admin.from('outreach_tags').delete().eq('name', `Tag ${tag}`);
  await admin.from('members').delete().in('company_id', companies);
  await admin.from('companies').delete().in('id', companies);
});

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop project only');
  test.skip(!accounts.backend, NO_BACKEND);
});

const row = (page: Page, name: string) => page.locator('[data-directory] tbody tr', { hasText: name });

test('filters, live count, sorting and selection across pages; a segment stays dynamic', async ({ page }) => {
  await signInAs(page, 'sg');
  await page.goto(nature(NATURE));
  await expect(row(page, TEXTILE)).toBeVisible();
  await expect(row(page, TRADER)).toBeVisible();
  await expect(page.locator('[data-chip]').first()).toContainText(NATURE);
  await expect(page.locator('[data-count="total"]')).toContainText('2 businesses');

  // the live count follows the builder before anything is applied
  await page.locator('[data-action="biz.rule.add"]').click();
  const added = page.locator('[data-rule="1"]');
  await added.locator('[data-field="rule-field"]').selectOption('business_category');
  await added.getByLabel('Manufacturing', { exact: true }).check();
  await expect(page.locator('[data-count="total"]')).toContainText('1 businesses');
  await page.locator('[data-action="biz.filter.apply"]').click();
  await expect(row(page, TRADER)).toHaveCount(0);
  await expect(row(page, TEXTILE)).toBeVisible();

  // sorting keeps the filter
  await page.locator('[data-action="biz.sort"][data-sort="member_no"]').click();
  await expect(page).toHaveURL(/sort=member_no/);
  await expect(row(page, TRADER)).toHaveCount(0);

  // exclusion
  await page.goto(nature(NATURE));
  await page.locator('[data-action="biz.group.add"]').click();
  const excl = page.locator('[data-group="1"]');
  await excl.locator('[data-field="exclude"]').check();
  await excl.getByLabel('Manufacturing', { exact: true }).check();
  await page.locator('[data-action="biz.filter.apply"]').click();
  await expect(row(page, TEXTILE)).toHaveCount(0);
  await expect(row(page, TRADER)).toBeVisible();

  // selection survives leaving and coming back
  await page.goto(nature(NATURE));
  await row(page, TEXTILE).locator('[data-action="biz.select.row"]').check();
  await expect(page.locator('[data-selection="ids"]')).toContainText('1 selected');
  await page.goto('/admin/business-directory/segments');
  await page.goto(nature(NATURE));
  await expect(row(page, TEXTILE).locator('[data-action="biz.select.row"]')).toBeChecked();
  await page.locator('[data-action="biz.select.matching"]').click();
  await expect(page.locator('[data-selection="matching"]')).toContainText('2 selected');
  await page.locator('[data-action="biz.select.clear"]').click();

  // saved as a dynamic segment: a new matching business joins it without saving again
  await page.locator('[data-action="biz.segment.save"]').click();
  await page.locator('[data-field="segment-name"]').fill(SEGMENT);
  await page.locator('[data-action="biz.segment.confirm"]').click();
  await expect(page.locator('[data-action="biz.segment.confirm"]')).toHaveCount(0);
  await page.goto('/admin/business-directory/segments');
  const card = page.locator(`[data-segment="${SEGMENT}"]`);
  await expect(card.locator('[data-kind="dynamic"]')).toBeVisible();
  await expect(card.locator('[data-segment-count]')).toHaveAttribute('data-segment-count', '2');
  await admin.from('companies').update({ nature_sector: 'Changed' }).eq('id', companies[1]!);
  await page.reload();
  await expect(card.locator('[data-segment-count]')).toHaveAttribute('data-segment-count', '1');
  await admin.from('companies').update({ nature_sector: NATURE }).eq('id', companies[1]!);
  await card.locator('[data-action="biz.segment.open"]').click();
  await expect(page.locator('[data-segment-open]')).toContainText(SEGMENT);
  await expect(page.locator('[data-chip]').first()).toContainText(NATURE);
  await page.goto('/admin/business-directory/segments');
  await card.locator('[data-action="biz.segment.delete"]').click();
  await page.locator('[data-action="biz.segment.delete.confirm"]').click();
  await expect(card).toHaveCount(0);
});

test('a profile keeps the official record apart; consent and opt-out work', async ({ page }) => {
  await signInAs(page, 'sg');
  await page.goto(`/admin/business-directory/profile?id=${members[TEXTILE]}`);
  await expect(page.locator('[data-business]')).toHaveText(TEXTILE);
  await expect(page.locator('[data-section="official"]')).toContainText('Read only');

  await page.locator('[data-field="city"]').fill('Multan');
  await page.locator('[data-action="biz.details.save"]').click();
  await expect(page.locator('[data-section="outreach"]').getByRole('status')).toContainText('Details saved');
  const { data: co } = await admin.from('companies').select('name, address').eq('id', companies[0]!).single();
  expect(co).toEqual({ name: TEXTILE, address: 'Road 1' });

  await page.locator('[data-field="tag-name"]').fill(`Tag ${tag}`);
  await page.locator('[data-action="biz.tag.add"]').click();
  await expect(page.locator(`[data-tag="Tag ${tag}"]`)).toBeVisible();

  // a bad number is refused; a good one starts with no consent
  await page.locator('[data-field="contact-phone"]').fill('12345');
  await page.locator('[data-action="biz.contact.save"]').click();
  await expect(page.locator('[data-section="consent"]').getByRole('alert')).toContainText('international format');
  await page.locator('[data-field="contact-phone"]').fill(PHONE);
  await page.locator('[data-action="biz.contact.save"]').click();
  await expect(page.locator('[data-consent-state="not_recorded"]')).toBeVisible();

  // consent needs evidence, then counts; withdrawing blocks the number at once
  await page.locator('[data-action="biz.consent.save"]').click();
  await expect(page.locator('[data-section="consent"]').getByRole('alert')).toContainText('evidence');
  await page.locator('[data-field="consent-evidence"]').fill('Signed form 12');
  await page.locator('[data-action="biz.consent.save"]').click();
  await expect(page.locator('[data-consent-state="granted"]')).toBeVisible();
  await expect(page.locator('[data-consent-history] tbody tr')).toHaveCount(1);

  await page.locator('[data-field="consent-status"]').selectOption('withdrawn');
  await page.locator('[data-action="biz.consent.save"]').click();
  await expect(page.locator('[data-consent-state="opted_out"]')).toBeVisible();
  await expect(page.locator('[data-suppression]')).toContainText('Consent withdrawn');

  await page.locator('[data-field="lift-reason"]').fill('Business asked to be contacted again');
  await page.locator('[data-action="biz.unsuppress"]').click();
  await expect(page.locator('[data-suppression]')).toHaveCount(0);
  await expect(page.locator('[data-consent-state="withdrawn"]')).toBeVisible();
});

test('exports: preview, three formats, formula protection, and a log entry', async ({ page }) => {
  await signInAs(page, 'sg');
  await admin.from('outreach_profiles').upsert({ company_id: companies[1]!, city: '=1+1' });
  await page.goto(
    `/admin/business-directory/exports?f=${encodeURIComponent(JSON.stringify({ groups: [{ match: 'all', exclude: false, rules: [{ field: 'nature', op: 'in', value: [NATURE] }] }] }))}`,
  );

  await expect(page.locator('[data-action="biz.export.download"]')).toBeDisabled();
  await page.locator('[data-action="biz.export.preview"]').click();
  await expect(page.locator('[data-preview-total="2"]')).toBeVisible();

  // a sensitive column blocks the download until there is a reason
  await page.locator('[data-column="email"]').check();
  await expect(page.locator('[data-action="biz.export.preview"]')).toBeDisabled();
  await page.locator('[data-field="reason"]').fill('Member contact list for the AGM');
  await page.locator('[data-action="biz.export.preview"]').click();
  await expect(page.locator('[data-preview-total="2"]')).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('[data-action="biz.export.download"]').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^mcci-business-directory-.*\.csv$/);
  await expect(page.getByRole('status').filter({ hasText: 'Downloaded' })).toBeVisible();

  const filter = {
    groups: [{ match: 'all', exclude: false, rules: [{ field: 'nature', op: 'in', value: [NATURE] }] }],
  };
  const post = (format: string, extra: object = {}) =>
    page.request.post('/api/business-directory/export', {
      data: { filter, fields: ['business_name', 'city', 'nature'], format, ...extra },
    });
  const csv = await post('csv');
  expect(csv.status()).toBe(200);
  expect(csv.headers()['cache-control']).toContain('no-store');
  const text = await csv.text();
  expect(text).toContain(TEXTILE);
  expect(text).toContain(`"'=1+1"`); // a formula cell is neutralised
  expect((await (await post('xlsx')).body()).subarray(0, 2).toString()).toBe('PK');
  expect((await (await post('pdf')).body()).subarray(0, 4).toString()).toBe('%PDF');

  const { data: log } = await admin
    .from('export_log')
    .select('format, record_count, fields, sensitive, reason')
    .order('id', { ascending: false })
    .limit(3);
  expect(log![0]).toMatchObject({ format: 'pdf', record_count: 2, sensitive: false });
  const { data: sensitive } = await admin
    .from('export_log')
    .select('reason, fields')
    .eq('reason', 'Member contact list for the AGM')
    .limit(1);
  expect(sensitive![0]!.fields).toContain('email');

  await page.reload();
  await expect(page.locator('[data-export-log] tbody tr').first()).toBeVisible();
});

test('permission boundaries: officer without sensitive columns, view-only staff without contacts, members refused', async ({ page, browser }) => {
  await signInAs(page, 'staff');
  const filter = { groups: [] };
  await page.goto('/admin/business-directory/exports');
  await expect(page.locator('[data-column="email"]')).toBeDisabled();
  const refused = await page.request.post('/api/business-directory/export', {
    data: { filter, fields: ['email'], format: 'csv', reason: 'I would like it' },
  });
  expect(refused.status()).toBe(403);

  const view = await browser.newPage();
  await signInAs(view, 'president');
  await view.goto(`/admin/business-directory/profile?id=${members[TEXTILE]}`);
  await expect(view.locator('[data-contacts-hidden]')).toBeVisible();
  await expect(view.locator('[data-section="consent"]')).toHaveCount(0);
  await expect(view.getByText('061-1')).toHaveCount(0);
  await view.close();

  const member = await browser.newPage();
  await signInAs(member, 'member');
  const out = await member.request.post('/api/business-directory/export', {
    data: { filter, fields: ['business_name'], format: 'csv' },
  });
  expect(out.status()).toBe(403);
  await member.goto('/admin/business-directory');
  await expect(member.locator('[data-directory]')).toHaveCount(0);
  await member.close();
});
