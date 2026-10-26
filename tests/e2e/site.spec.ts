import { randomInt, randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';

/**
 * Public website (M2, prototype site/*): every page, both languages, and the actions that do something — business
 * type documents (pub.biz), FAQ (faq.toggle), directory search and details (dir.view, public fields only), token
 * tracking (track.go: stage and dates, no names), news calendar (cal.*), the blank form, and the contact form creating
 * a ticket with an emailed number (contact.send). The orphan, axe, overflow and tap-target audits cover these pages too.
 */
const env = readLocalEnv();
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

const PAGES: [string, RegExp][] = [
  ['/', /Multan’s trade/],
  ['/about', /About MCCI/],
  ['/membership', /Membership/],
  ['/services', /Digital Services/],
  ['/service?s=co', /Certificate of Origin/],
  ['/directory', /Business Directory/],
  ['/track', /Track a Token/],
  ['/live', /Live Board/],
  ['/news', /News & Events/],
  ['/resources', /Resources/],
  ['/contact', /Contact & Complaint Desk/],
];

test('every public page opens in English and Urdu, with the Urdu page right-to-left', async ({ page }) => {
  for (const [path, heading] of PAGES) {
    await page.context().clearCookies(); // the language choice is remembered in a cookie
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
    await page.goto(`/ur${path === '/' ? '' : path}`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
});

test('home: counters, services and journey; the live panel shows tokens, never company names', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.xstat')).not.toHaveCount(0);
  await expect(page.locator('.sc[href^="/service?s="]')).toHaveCount(7);
  await expect(page.locator('.steps8 [role="listitem"]')).toHaveCount(8);
  await expect(page.locator('.xlive')).not.toContainText('Company A');
  await expect(page.locator('.xlive')).not.toContainText('DEMO');
  // verify box goes to /verify
  await page.getByLabel('Document code').fill('MCCI-QR-ABCDE-23456');
  await page.locator('[data-action="verify.go"]').click();
  await expect(page).toHaveURL(/\/verify\?c=MCCI-QR-ABCDE-23456/);
});

test('membership: fees add up, documents change with the business type, FAQ opens', async ({ page }) => {
  await page.goto('/membership');
  await expect(page.locator('[data-class="Corporate"]')).toContainText('PKR 17,500');
  await expect(page.locator('[data-class="Associate"]')).toContainText('PKR 11,500');
  const panel = page.getByRole('tabpanel');
  const prop = await panel.locator('li').count();
  await page.getByRole('tab', { name: 'Ltd. / Pvt. Ltd Co.' }).click();
  await expect(panel).toHaveAttribute('data-biz', 'pvt');
  expect(await panel.locator('li').count()).toBeGreaterThan(prop);
  const q = page.locator('[data-action="faq.toggle"]').first();
  await expect(q).toHaveAttribute('aria-expanded', 'false');
  await q.click();
  await expect(q).toHaveAttribute('aria-expanded', 'true');
  await expect(q.locator('p')).toBeVisible();
});

test('service detail: documents and fields from the service list; online requests not open yet (said why)', async ({
  page,
}) => {
  await page.goto('/service?s=co');
  await expect(page.getByRole('main')).toContainText('Commercial invoice');
  await expect(page.locator('[data-action="svc.apply"]')).toBeDisabled();
  await expect(page.locator('[data-action="svc.apply"]')).toHaveAttribute('title', /next release/);
});

test('resources: the blank official form opens for anyone', async ({ page }) => {
  await page.goto('/resources');
  await page.locator('[data-resource="r1"] [data-action="res.download"]').click();
  await expect(page).toHaveURL(/\/resources\/form/);
  await expect(page.locator('.formv')).toBeVisible();
});

test.describe('with the local database', () => {
  test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
  let admin: SupabaseClient;
  test.beforeAll(() => {
    admin = createClient(env!.url, env!.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  });

  test('directory: listed members only, searchable; details show public fields', async ({ page }) => {
    const { data } = await admin.from('public_directory').select('member_no, company');
    await page.goto('/directory');
    if (!data?.length) {
      await expect(page.getByRole('main')).toContainText('No member companies are listed yet.');
      return;
    }
    const first = data[0]!;
    await expect(page.locator('tr[data-member]')).toHaveCount(data.length);
    await page.getByLabel('Search company or sector').fill('zzzz-no-such-company');
    await expect(page.getByRole('main')).toContainText('No company matches your search.');
    await page.getByLabel('Search company or sector').fill(first.company!.slice(0, 6));
    await page.locator(`tr[data-member="${first.member_no}"] [data-action="dir.view"]`).click();
    const d = page.getByRole('dialog');
    await expect(d).toContainText(first.member_no!);
    await expect(d).toContainText('Only public fields are shown');
    // never a member who did not choose to be listed
    const { data: hidden } = await admin.from('members').select('member_no').eq('public_listing', false);
    for (const h of hidden ?? []) await expect(page.locator(`tr[data-member="${h.member_no}"]`)).toHaveCount(0);
  });

  test('track: a real token shows its stage and dates only; unknown and malformed tokens say so', async ({ page }) => {
    const { data: app } = await admin
      .from('applications')
      .select('token, stage, companies(name)')
      .not('stage', 'in', '(draft,withdrawn)')
      .limit(1)
      .maybeSingle();
    await page.goto('/track?t=hello');
    await expect(page.locator('[data-track="invalid"]')).toBeVisible();
    await page.goto('/track?t=MCCI-2099-M-9999');
    await expect(page.locator('[data-track="none"]')).toContainText('No token found.');
    if (app) {
      await page.goto('/track');
      await page.getByLabel('Token').fill(app.token);
      await page.locator('[data-action="track.go"]').click();
      const found = page.locator('[data-track="found"]');
      await expect(found).toHaveAttribute('data-status', app.stage);
      await expect(found).toContainText(app.token);
      const company = (app.companies as unknown as { name: string } | null)?.name;
      if (company) await expect(page.getByRole('main')).not.toContainText(company);
    }
  });

  test.describe('contact', () => {
    // a fresh address per run: the form allows 5 tickets an hour per address
    test.use({
      extraHTTPHeaders: { 'x-real-ip': `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}` },
    });
    test('contact: a message and a complaint each create a ticket; the number is emailed', async ({ page }) => {
      const tag = `t${randomUUID().slice(0, 6)}`;
      const email = `contact-${tag}@test.local`;
      await page.goto('/contact');
      await page.getByLabel('Name').fill(`Visitor ${tag}`);
      await page.getByLabel('Mobile / email').fill(email);
      await page.getByLabel('Subject').fill('Membership question');
      await page.getByLabel('Message').fill('How long does the temporary membership last?');
      await page.locator('[data-action="contact.send"]').click();
      const ok = page.locator('[data-outcome="ok"]');
      await expect(ok).toContainText(/your ticket number is TK-\d{4}-\d{4}/);
      const ticket = /TK-\d{4}-\d{4}/.exec((await ok.textContent()) ?? '')![0];
      const { data: t } = await admin
        .from('tickets')
        .select('subject, email, status, created_by')
        .eq('id', ticket)
        .single();
      expect(t).toMatchObject({ subject: 'Membership question', email, status: 'Open', created_by: null });
      await expect
        .poll(async () => {
          const list = await (
            await fetch(`http://127.0.0.1:54324/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)
          ).json();
          return (list.messages ?? []).some((x: { Subject: string }) => x.Subject.includes(ticket));
        })
        .toBe(true);

      await page.getByRole('tab', { name: 'Complaint desk' }).click();
      await page.getByLabel('Name').fill(`Visitor ${tag}`);
      await page.getByLabel('Mobile / email').fill('0300-1234567');
      await page.getByLabel('Complaint about').selectOption('delay');
      await page.getByLabel('Details').fill('My request is waiting for a reply.');
      await page.locator('[data-action="contact.send"]').click();
      await expect(page.locator('[data-outcome="ok"]')).toContainText(/ticket number is TK-/);
      const { data: c } = await admin
        .from('tickets')
        .select('subject')
        .eq('name', `Visitor ${tag}`)
        .eq('subject', 'Complaint: Service delay');
      expect(c).toHaveLength(1);
      await admin.from('tickets').delete().eq('name', `Visitor ${tag}`);
    });
  });

  test('live board: figures and the anonymised feed', async ({ page }) => {
    await page.goto('/live');
    await expect(page.locator('[data-tile]')).toHaveCount(4);
    await expect(page.getByRole('main')).not.toContainText('Company A');
  });
});
