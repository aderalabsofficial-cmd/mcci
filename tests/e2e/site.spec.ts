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
  ['/', /Multan/],
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

// acceptance DEF-001 (6 Nov 2026): every public page linked "Staff portal" to /admin, which answers "not found" to
// visitors; the staff sign-in page is linked from nowhere on the public website (owner, 29 Oct 2026)
test('no public page links visitors to the admin or the staff sign-in', async ({ page }) => {
  for (const [path] of PAGES)
    for (const prefix of ['', '/ur']) {
      await page.goto(`${prefix}${path === '/' && prefix ? '' : path}`);
      await expect(page.locator('a[href*="/admin"], a[href*="/staff/login"]')).toHaveCount(0);
    }
});

test('every public page opens in English and Urdu, with the Urdu page right-to-left', async ({ page }) => {
  for (const [path, heading] of PAGES) {
    await page.context().clearCookies(); // the language choice is remembered in a cookie
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
    // a "could not load" note appears only when a read failed (lib/site/read-or.ts); never on a healthy page
    await expect(page.locator('[data-read-failed]')).toHaveCount(0);
    await page.goto(`/ur${path === '/' ? '' : path}`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
});

test('about: office-bearers and Secretariat by name, history, objectives and facilities from the earlier site', async ({
  page,
}) => {
  await page.goto('/about');
  await expect(page.locator('[data-group="bearers"] h3')).toHaveText([
    'Dr. Muhammad Shafiq Khan Pitafi',
    'Azhar Mumtaz Tipu',
    'Abdul Wahab',
  ]);
  await expect(page.locator('[data-group="secretariat"] .pc')).toHaveCount(4);
  await expect(page.locator('#history li')).toHaveCount(5);
  await expect(page.locator('#history')).toContainText('1959');
  await expect(page.locator('#objectives .sc')).toHaveCount(6);
  await expect(page.locator('#facilities')).toContainText('Mughis A. Sheikh Trade Library');
  await expect(page.locator('#facilities')).toContainText('SMEDA');
  await page.goto('/contact');
  await expect(page.locator('#touch')).toContainText('Sunday closed');
});

test('home: the hero stats, services and fees; the live panels show tokens, never company names', async ({ page }) => {
  await page.goto('/');
  // the figures are the server's own numbers (with the database: below), and nothing says "sample" about them
  await expect(page.locator('.hero-live [data-stat="issued"]')).toHaveText(/^[\d,]+$/);
  await expect(page.locator('.hero-live [data-stat="open"]')).toHaveText(/^[\d,]+$/);
  await expect(page.locator('.kpi')).toHaveCount(4);
  await expect(page.locator('.svc[href^="/service?s="]')).toHaveCount(7);
  await expect(page.locator('#fee-table tbody tr')).toHaveCount(3);
  await expect(page.locator('[data-read-failed]')).toHaveCount(0);
  // office-bearers: President, Senior Vice President, Vice President and the Secretary General, no empty place
  await expect(page.locator('.bearers .person')).toHaveCount(4);
  await expect(page.locator('[data-bearer="role_sg"]')).toContainText('Muhammad Shafiq');
  await expect(page.locator('[data-bearer="role_sg"]')).toContainText('Secretary General');
  for (const panel of ['.hero-live', '.desk-feed']) {
    await expect(page.locator(panel)).not.toContainText('Company A');
    await expect(page.locator(panel)).not.toContainText('DEMO');
  }
  await page.locator('.hero-live a[href="/live"]').click();
  await expect(page).toHaveURL(/\/live$/);
  await page.goto('/');
  // verify box goes to /verify
  await page.getByLabel('Document code').fill('MCCI-QR-ABCDE-23456');
  await page.locator('[data-action="verify.go"]').click();
  await expect(page).toHaveURL(/\/verify\?c=MCCI-QR-ABCDE-23456/);
});

test('home: every way in goes to a real page', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('main a[href], header a[href], footer a[href]')
    .evaluateAll((list) => [...new Set(list.map((a) => a.getAttribute('href')!))]);
  for (const href of hrefs) {
    if (href.startsWith('#')) {
      await expect(page.locator(href), href).toHaveCount(1);
      continue;
    }
    if (!href.startsWith('/') || href === '/admin') continue; // tel:, mailto:, the credit; /admin answers 404 when signed out
    expect((await page.request.get(href)).status(), href).toBe(200);
  }
  // Member login leads to the sign-in page; Become a member to sign-up
  await page.locator('.hdr-login').click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/');
  await page.locator('.qa[href="/register"]').click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create your account');
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

test('service detail: documents and fields from the service list; Apply now leads to sign-in and the request', async ({
  page,
}) => {
  await page.goto('/service?s=co');
  await expect(page.getByRole('main')).toContainText('Commercial invoice');
  await page.locator('[data-action="svc.new"]').click();
  await expect(page).toHaveURL(/\/login\?next=%2Fportal%2Fapply/);
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

  test('news ticker: the newest posts above the header in both languages; it pauses, and stands still for reduced motion', async ({
    page,
  }) => {
    const tag = randomUUID().slice(0, 6);
    const ahead = new Date(Date.now() + 60_000).toISOString(); // newest, so it is among the posts the bar shows
    const { data: post, error } = await admin
      .from('posts')
      .insert({
        category: 'Notice',
        title: `Ticker notice ${tag}`,
        title_ur: `ٹکر اعلان ${tag}`,
        body: 'Test post for the ticker.',
        body_ur: 'ٹکر کی جانچ',
        status: 'Live',
        published_at: ahead,
      })
      .select('id')
      .single();
    expect(error).toBeNull();
    try {
      // home: the bar sits on top, the sticky header directly under it, and a post opens on the News page
      await page.goto('/');
      const bar = page.locator('[data-ticker]');
      const item = bar.locator(`a[data-post="${post!.id}"]:not([tabindex="-1"])`);
      await expect(item).toContainText(`Ticker notice ${tag}`);
      await expect(item).toContainText('Notice');
      const tb = (await bar.boundingBox())!;
      const hb = (await page.locator('.lp .hdr').boundingBox())!;
      expect(tb.y).toBe(0);
      expect(Math.abs(hb.y - (tb.y + tb.height))).toBeLessThanOrEqual(1);
      const run = bar.locator('.tk-run');
      expect(await run.evaluate((e) => getComputedStyle(e).animationName)).toBe('tk-run');

      // pause (WCAG 2.2.2): the button says what it does next
      const pause = bar.locator('[data-action="ticker.pause"]');
      await pause.click();
      await expect(pause).toHaveAttribute('aria-pressed', 'true');
      await expect(pause).toHaveAccessibleName('Play the news ticker');
      expect(await run.evaluate((e) => getComputedStyle(e).animationPlayState)).toBe('paused');
      await expect(item).toHaveAttribute('href', `/news?post=${post!.id}#post`);
      await expect(bar.locator('[data-action="ticker.all"]')).toHaveAttribute('href', '/news#latest');

      // an inner page in Urdu: the Urdu title, right to left, inside the fixed header, the hero clear of both
      await page.goto('/ur/about');
      await expect(bar.locator(`a[data-post="${post!.id}"]:not([tabindex="-1"])`)).toContainText(`ٹکر اعلان ${tag}`);
      expect(await run.evaluate((e) => getComputedStyle(e).animationName)).toBe('tk-run-rtl');
      await expect(page.locator('header [data-ticker]')).toHaveCount(1);
      const header = (await page.locator('header:has([data-ticker])').boundingBox())!;
      const h1 = (await page.getByRole('heading', { level: 1 }).boundingBox())!;
      expect(h1.y).toBeGreaterThanOrEqual(header.y + header.height);

      // reduced motion, in Urdu as well as English: nothing moves, no copy, no pause button
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/ur/about');
      expect(await run.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
      await page.goto('/en/about');
      expect(await run.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
      await expect(bar.locator('.tk-list[aria-hidden]')).toBeHidden();
      await expect(bar.locator('[data-action="ticker.pause"]')).toBeHidden();
      // standing still, the newest post is first in the bar: it opens on the News page
      await bar.locator(`a[data-post="${post!.id}"]:not([tabindex="-1"])`).click();
      await expect(page).toHaveURL(new RegExp(`/news\\?post=${post!.id}`));
      await expect(page.getByRole('main')).toContainText(`Ticker notice ${tag}`);
    } finally {
      await admin.from('posts').delete().eq('id', post!.id);
    }
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

  test('home: the hero and the desk show exactly what api.site_stats says', async ({ page }) => {
    const { data } = await admin.schema('api').rpc('site_stats');
    const stats = data![0]!;
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('.hero-live [data-stat="issued"]')).toHaveText(
      stats.services_issued.toLocaleString('en-US'),
    );
    await expect(page.locator('.hero-live [data-stat="open"]')).toHaveText(stats.services_open.toLocaleString('en-US'));
    await expect(page.locator('[data-kpi="k1"] .kpi-num')).toHaveText(stats.services_issued.toLocaleString('en-US'));
    await expect(page.locator('[data-kpi="k4"] .kpi-num')).toHaveText(stats.members.toLocaleString('en-US'));
  });

  test('home: a complaint from the form becomes a ticket', async ({ page }) => {
    const tag = `t${randomUUID().slice(0, 6)}`;
    await page.goto('/#complaints');
    await page.getByLabel('Your name').fill(`Visitor ${tag}`);
    await page.getByLabel('Mobile or email').fill('0300-1234567');
    await page.getByLabel('Your message').fill('My request is waiting for a reply.');
    await page.locator('[data-contact="home"] [data-action="contact.send"]').click();
    await expect(page.locator('[data-outcome="ok"]')).toContainText(/ticket number is TK-/);
    await admin.from('tickets').delete().eq('name', `Visitor ${tag}`);
  });

  test('live board: figures and the anonymised feed', async ({ page }) => {
    await page.goto('/live');
    await expect(page.locator('[data-tile]')).toHaveCount(4);
    await expect(page.getByRole('main')).not.toContainText('Company A');
  });
});
