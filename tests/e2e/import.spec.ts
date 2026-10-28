import { randomInt } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { signInAs } from './helpers';

/**
 * Existing-member import (migration 0360, admin/import), through the screens: the Secretary General uploads a CSV;
 * the preview shows a new row (selected), an existing member (skipped, never changed) and a row with errors (cannot
 * be imported); nothing is in the register until IMPORT is typed; the imported member keeps the file's number and
 * status; the import is rolled back.
 */
const env = readLocalEnv();
test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

// an Associate number below the sequence start, so the official numbering is not moved by the test
const no = `MCCI-A-0${randomInt(100, 999)}`;
const company = `Import Test ${no}`;
const email = `import-${no.toLowerCase()}@test.local`;
const MAILPIT = 'http://127.0.0.1:54324';
let admin: SupabaseClient;

test.beforeAll(() => {
  if (env) admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
});

test.afterAll(async () => {
  if (!admin) return;
  // safety net if the test stopped before the roll back
  const { data: m } = await admin.from('members').select('id, company_id').eq('member_no', no).maybeSingle();
  if (m) {
    await admin.from('import_rows').update({ created_member: null }).eq('created_member', m.id);
    await admin.from('members').delete().eq('id', m.id);
    await admin.from('companies').delete().eq('id', m.company_id);
  }
  await admin.from('invitations').delete().eq('email', email);
});

const csv = [
  'membership_no,class,women,company_name,business_type,representative_name,email,member_since,valid_to,status',
  `${no},Associate,N,${company},prop,Rep Import,${email},01/04/2016,31/03/2027,Permanent`,
  'MCCI-C-9001,Corporate,N,Company B (member),pvt,Someone Else,b@test.local,,31/03/2028,Permanent',
  'MCCI-C-77,Corporate,N,,pvt,No Company,,,31/03/2027,Permanent',
].join('\r\n');

test('import: preview checks every row, nothing is written before IMPORT, numbers kept, rolled back', async ({ page }) => {
  test.setTimeout(120_000);
  await signInAs(page, 'sg');
  await page.goto('/admin/import');
  await page.locator('[data-action="imp.file"]').click();
  const d = page.getByRole('dialog');
  await d.getByLabel('File').setInputFiles({ name: 'members.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await d.locator('[data-action="imp.file.confirm"]').click();
  await expect(page).toHaveURL(/\/admin\/import\?id=/);
  const preview = page.locator('[data-import-preview]');
  await expect(preview.locator('[data-outcome="ok"]')).toContainText('Read 3 rows: 2 new, 1 already in the register, 0 possible duplicates, 1 with errors');

  const row = (n: number) => preview.locator(`tr[data-row="${n}"]`);
  await expect(row(1)).toHaveAttribute('data-decision', 'create');
  await expect(row(2)).toHaveAttribute('data-match', 'exists');
  await expect(row(2)).toHaveAttribute('data-decision', 'skip');
  await expect(row(2)).toContainText('Representative Rep B → Someone Else');
  await expect(row(2).locator('[data-action="imp.decide"]')).toBeDisabled(); // managed on the platform: never updated by a file
  await expect(row(3).locator('[data-issue="required"]')).toContainText('Company name is missing');
  await expect(row(3).locator('[data-action="imp.decide"]')).toBeDisabled();
  // nothing in the register yet
  expect((await admin.from('members').select('id').eq('member_no', no)).data).toEqual([]);

  // a decision is saved and confirmed by the server
  await row(1).locator('[data-action="imp.decide"]').selectOption('skip');
  await expect(preview.locator('[data-action="imp.commit"]')).toBeDisabled();
  await row(1).locator('[data-action="imp.decide"]').selectOption('create');
  await expect(row(1)).toHaveAttribute('data-decision', 'create');

  await preview.locator('[data-action="imp.commit"]').click();
  const c = page.getByRole('dialog');
  await expect(c.locator('[data-action="imp.commit.confirm"]')).toBeDisabled();
  await c.getByLabel('Type IMPORT to confirm').fill('IMPORT');
  await c.locator('[data-action="imp.commit.confirm"]').click();
  await expect(preview.locator('[data-outcome="ok"]')).toContainText('Imported: 1 created, 0 updated, 2 skipped, 0 failed');
  await expect(preview).toHaveAttribute('data-status', 'committed');
  // every imported member is invited by email right away (migration 0406)
  await expect(preview.locator('[data-outcome="ok"]')).toContainText('Invitations: 1 sent, 0 not delivered', { timeout: 30_000 });
  await expect(preview.locator('[data-invites]')).toContainText('1 sent');
  await expect(preview.locator('[data-action="imp.invite"]')).toBeDisabled();
  await expect
    .poll(async () => {
      const list = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)).json();
      for (const x of list.messages ?? []) {
        const msg = await (await fetch(`${MAILPIT}/api/v1/message/${x.ID}`)).json();
        if (/\/invite\/\S+/.test(msg.Text ?? '') && (msg.Text ?? '').includes(company)) return true;
      }
      return false;
    }, { timeout: 20_000 })
    .toBe(true);
  const { data: inv } = await admin.from('invitations').select('company_role, status, expires_at, companies!inner(name)').eq('companies.name', company).single();
  expect(inv).toMatchObject({ company_role: 'Owner', status: 'Invited' });
  expect(new Date(inv!.expires_at).getTime()).toBeGreaterThan(Date.now() + 29 * 86_400_000);

  const { data: m } = await admin.from('members').select('member_no, class, status, rep_name, since, valid_to, imported, public_listing, companies(name)').eq('member_no', no).single();
  expect(m).toMatchObject({ member_no: no, class: 'Associate', status: 'Permanent', rep_name: 'Rep Import', since: '2016-04-01', valid_to: '2027-03-31', imported: true, public_listing: false });
  expect((await admin.from('members').select('rep_name').eq('member_no', 'MCCI-C-9001').single()).data?.rep_name).toBe('Rep B');
  await page.goto('/admin/members');
  await expect(page.getByRole('main').locator('table').first()).toContainText(no);

  await page.goBack();
  await preview.locator('[data-action="imp.rollback"]').click();
  await page.locator('[data-action="imp.rollback.confirm"]').click();
  await expect(preview.locator('[data-outcome="ok"]')).toContainText('Rolled back: 1 members removed, 0 kept');
  expect((await admin.from('members').select('id').eq('member_no', no)).data).toEqual([]);
  // its invitation went with it
  expect((await admin.from('invitations').select('id').eq('email', email)).data).toEqual([]);
});

test('import: a file that is not a spreadsheet is refused whatever its name', async ({ page }) => {
  await signInAs(page, 'sg');
  await page.goto('/admin/import');
  await page.locator('[data-action="imp.file"]').click();
  const d = page.getByRole('dialog');
  await d.getByLabel('File').setInputFiles({ name: 'members.csv', mimeType: 'text/csv', buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]) });
  await d.locator('[data-action="imp.file.confirm"]').click();
  await expect(d.locator('[data-outcome="refused"]')).toContainText('Only CSV, Excel (.xlsx, .xls) or PDF files can be imported.');
});

test('import: a PDF directory is read by AI only after consent; uncertain rows are not selected; discarded', async ({ page }) => {
  await signInAs(page, 'sg');
  await page.goto('/admin/import');
  await page.locator('[data-action="imp.file"]').click();
  const d = page.getByRole('dialog');
  await d.getByLabel('File').setInputFiles({ name: 'directory.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% scanned directory (test)\n%%EOF\n') });
  // the consent tick is required for a PDF
  await expect(d.getByLabel(/send it to OpenAI/)).toBeVisible();
  await d.getByLabel(/send it to OpenAI/).check();
  await d.locator('[data-action="imp.file.confirm"]').click();
  const preview = page.locator('[data-import-preview]');
  await expect(preview.locator('[data-outcome="ok"]')).toContainText('Read 2 rows');
  await expect(preview).toContainText('Read by AI from a PDF');
  await expect(preview.locator('tr[data-row="1"]')).toHaveAttribute('data-decision', 'create');
  await expect(preview.locator('tr[data-row="2"]')).toHaveAttribute('data-decision', 'skip');
  await expect(preview.locator('tr[data-row="2"] [data-issue="low_confidence"]')).toContainText('AI was not sure about Valid to');
  await expect(preview.locator('tr[data-row="1"]')).toContainText('2027-03-31');

  await preview.locator('[data-action="imp.discard"]').click();
  await page.locator('[data-action="imp.discard.confirm"]').click();
  await expect(preview.locator('[data-outcome="ok"]')).toContainText('Import discarded. Nothing was imported.');
  await expect(preview).toHaveAttribute('data-status', 'discarded');
  expect((await admin.from('members').select('id').in('member_no', ['MCCI-A-0050', 'MCCI-A-0051'])).data).toEqual([]);
});
