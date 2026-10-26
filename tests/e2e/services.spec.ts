import { expect, type Page, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { readAccounts } from './accounts';
import { signInAs } from './helpers';

/**
 * Services (M7, migration 0380), through the screens: the member (Permanent) requests a service — documents, AI
 * reading, details, submit — and gets a token and a fee voucher; the Services desk starts, returns with a note; the
 * member corrects and sends back; the desk approves; signing waits for the fee; Accounts record the fee at the
 * counter; the Secretary General signs; the letter carries a QR that verifies publicly. Then each of the seven
 * services is requested and issued.
 */
const env = readLocalEnv();
test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));
test.describe.configure({ mode: 'serial' });

let admin: SupabaseClient;
const pdf = (name: string) => ({ name, mimeType: 'application/pdf', buffer: Buffer.from(`%PDF-1.4\n% ${name}\n%%EOF\n`) });

test.beforeAll(() => {
  admin = createClient(env!.url, env!.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
});

test.afterAll(async ({}, info) => {
  // only the desktop project runs these tests: other projects' workers must not clean up under its feet
  if (info.project.name !== 'desktop') return;
  if (!admin) return;
  const company = readAccounts().companyId;
  const { data: reqs } = await admin.from('service_requests').select('id').eq('company_id', company);
  const ids = (reqs ?? []).map((r) => r.id);
  if (ids.length) {
    await admin.from('payment_vouchers').delete().eq('ref_type', 'service').in('ref_id', ids);
    const { data: docs } = await admin.from('service_requests').select('issued_doc').in('id', ids).not('issued_doc', 'is', null);
    await admin.from('service_requests').update({ issued_doc: null }).in('id', ids);
    await admin.from('service_requests').delete().in('id', ids);
    // the issued letters (registry documents) refer to the test member: removed with the requests
    const docIds = (docs ?? []).map((d) => d.issued_doc as string);
    if (docIds.length) await admin.from('documents').delete().in('id', docIds);
  }
});

async function memberPage(page: Page) {
  await signInAs(page, 'member');
  return page;
}

async function startRequest(page: Page, service: string) {
  await page.goto('/portal/apply');
  await page.locator(`[data-action="svc.new"][data-service="${service}"]`).click();
  await expect(page).toHaveURL(/\/portal\/apply\?r=/, { timeout: 15_000 });
  // as a person would: the new page has finished loading before the first file goes up (an action started while
  // Next.js is still navigating can be cut off — docs/20 "actions cut off under load")
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Document file').setInputFiles(pdf(`${service}-document.pdf`));
  await expect(page.locator(`[data-doc="${service}-document.pdf"]`)).toBeVisible();
}

test('a request from start to issued letter: return, correction, fee at the counter, signature, public verification', async ({ page, browser }) => {
  test.setTimeout(180_000);
  await memberPage(page);
  await startRequest(page, 'co');
  // AI reads the documents and fills the details; the member checks them
  await page.locator('[data-action="svc.ai"]').click();
  await expect(page.locator('[data-step="3"]')).toBeVisible();
  await expect(page.getByLabel('Consignee')).toHaveValue('ACME GmbH');
  await expect(page.getByLabel('Consignee')).toHaveAttribute('data-ai', 'filled');
  await page.getByLabel('Invoice value (USD)').fill('15000');
  await page.locator('[data-step="3"] [data-action="svc.step"]').click();
  await expect(page.locator('[data-step="4"]')).toContainText('PKR');
  await page.locator('[data-action="svc.submit"]').click();
  await expect(page).toHaveURL(/\/portal\/application\?t=MCCI-/, { timeout: 15_000 });
  await expect(page.locator('[data-outcome="ok"]')).toContainText(/Fee voucher PV-/);
  const token = new URL(page.url()).searchParams.get('t')!;
  await expect(page.locator('[data-request]')).toHaveAttribute('data-status', 'Submitted', { timeout: 15_000 });
  const { data: req } = await admin.from('service_requests').select('id, data').eq('token', token).single();
  expect(req!.data).toMatchObject({ Consignee: 'ACME GmbH', 'Invoice value (USD)': '15000' });

  // the desk (the Secretary General has every level)
  const sg = await (await browser.newContext()).newPage();
  await signInAs(sg, 'sg');
  await sg.goto('/admin/applications');
  await expect(sg.locator(`[data-column="Submitted"] [aria-label="Open ${token}"]`)).toBeVisible();
  await sg.goto(`/admin/review?t=${token}`);
  await sg.locator('[data-action="svc.start"]').click();
  await expect(sg.locator('[data-request]')).toHaveAttribute('data-status', 'In review', { timeout: 15_000 });
  await sg.locator('[data-action="svc.return"]').click();
  await sg.getByRole('dialog').getByLabel('What to correct').fill('Please attach the signed C.O. form');
  await sg.locator('[data-action="svc.return.confirm"]').click();
  await expect(sg.locator('[data-request]')).toHaveAttribute('data-status', 'Returned', { timeout: 15_000 });

  // the member corrects and sends it back
  await page.reload();
  await expect(page.getByRole('main')).toContainText('Please attach the signed C.O. form');
  await page.locator('[data-action="svc.fix"]').click();
  const fix = page.getByRole('dialog');
  await fix.getByLabel('Document file').setInputFiles(pdf('co-form-signed.pdf'));
  await expect(fix.locator('[data-doc="co-form-signed.pdf"]')).toBeVisible();
  await fix.getByLabel('Note for MCCI (optional)').fill('Signed form attached');
  await fix.locator('[data-action="svc.fix.send"]').click();
  await expect(page.locator('[data-request]')).toHaveAttribute('data-status', 'In review', { timeout: 15_000 });

  // approve; the signature waits for the fee
  await sg.reload();
  await sg.locator('[data-action="svc.approve"]').click();
  await expect(sg.locator('[data-request]')).toHaveAttribute('data-status', 'Ready to sign', { timeout: 15_000 });
  await expect(sg.locator('[data-action="svc.sign"]')).toBeDisabled();

  // Accounts record the fee at the counter
  const { data: v } = await admin.from('payment_vouchers').select('voucher_no').eq('ref_type', 'service').eq('ref_id', req!.id).single();
  await sg.goto('/admin/psid');
  await sg.locator(`[data-voucher="${v!.voucher_no}"] [data-action="psid.markpaid"]`).first().click();
  await sg.getByRole('dialog').getByLabel('Bank / counter receipt reference').fill('MCCI-CASH-SVC-1');
  await sg.locator('[data-action="psid.markpaid.confirm"]').click();
  await expect.poll(async () => (await admin.from('payment_vouchers').select('status').eq('voucher_no', v!.voucher_no).single()).data?.status).toBe('Paid');

  // the signatory signs from the queue; the letter is a QR document
  await sg.goto('/admin/approvals');
  await sg.locator(`[data-request="${token}"] [data-action="svc.sign"]`).click();
  await expect(sg.locator('[data-outcome="ok"]')).toContainText('Signed and issued: MCCI-QR-');
  const { data: done } = await admin.from('service_requests').select('status, documents:issued_doc(code, kind, status)').eq('token', token).single();
  const doc = done!.documents as unknown as { code: string; kind: string; status: string };
  expect([done!.status, doc.kind, doc.status]).toEqual(['Issued', 'letter', 'Valid']);

  await page.reload();
  await page.locator('[data-action="doc.view"]').first().click();
  await expect(page.locator(`[data-letter="${doc.code}"]`)).toContainText('Certificate of Origin');
  await expect(page.locator(`[data-letter="${doc.code}"]`)).toContainText('ACME GmbH');
  const pub = await (await browser.newContext()).newPage();
  await pub.goto(`/verify?c=${doc.code}`);
  await expect(pub.locator('[data-verify="found"]')).toContainText('Valid');
});

test('each of the seven services can be requested, approved and issued', async ({ page, browser }) => {
  test.setTimeout(300_000);
  // fees are MCCI's placeholders: set to 0 for this run so the flow does not wait at the counter (restored after)
  const { data: before } = await admin.from('service_types').select('key, fee, fields').order('sort');
  await admin.from('service_types').update({ fee: 0 }).neq('key', '');
  try {
    await memberPage(page);
    const sg = await (await browser.newContext()).newPage();
    await signInAs(sg, 'sg');
    for (const s of before ?? []) {
      await startRequest(page, s.key);
      await page.locator('[data-step="1"] [data-action="svc.step"]').click();
      for (const f of s.fields as string[]) await page.getByLabel(f, { exact: true }).fill(`${f} for ${s.key}`);
      await page.locator('[data-step="3"] [data-action="svc.step"]').click();
      await page.locator('[data-action="svc.submit"]').click();
      await expect(page).toHaveURL(/\/portal\/application\?t=MCCI-/, { timeout: 15_000 });
      const token = new URL(page.url()).searchParams.get('t')!;
      await sg.goto(`/admin/review?t=${token}`);
      await sg.locator('[data-action="svc.start"]').click();
      await expect(sg.locator('[data-request]')).toHaveAttribute('data-status', 'In review', { timeout: 15_000 });
      await sg.locator('[data-action="svc.approve"]').click();
      await expect(sg.locator('[data-request]')).toHaveAttribute('data-status', 'Ready to sign', { timeout: 15_000 });
      await sg.locator('[data-action="svc.sign"]').click();
      await sg.locator('[data-action="svc.sign.confirm"]').click();
      await expect(sg.locator('[data-request]')).toHaveAttribute('data-status', 'Issued', { timeout: 15_000 });
      const { data } = await admin.from('service_requests').select('status, issued_doc').eq('token', token).single();
      expect(data).toMatchObject({ status: 'Issued' });
      expect(data!.issued_doc).not.toBeNull();
    }
  } finally {
    for (const s of before ?? []) await admin.from('service_types').update({ fee: s.fee }).eq('key', s.key);
  }
});

test('a member cannot see another company’s request, and staff without the services module are refused', async ({ page }) => {
  const { data: other } = await admin.from('service_requests').select('token').neq('company_id', readAccounts().companyId).limit(1).maybeSingle();
  await memberPage(page);
  if (other) {
    await page.goto(`/portal/application?t=${other.token}`);
    await expect(page.getByRole('main')).toContainText('No request selected');
  }
  const staff = page.context();
  await staff.clearCookies();
  await signInAs(page, 'staff'); // Membership Officer: services module 0
  await page.goto('/admin/applications');
  await expect(page.getByRole('main')).toContainText(/outside|limits/i);
});
