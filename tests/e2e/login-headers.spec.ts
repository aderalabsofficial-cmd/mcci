import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, type Page, type Response, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { totp } from '../support/totp';

/**
 * Production bug 25 Oct 2026: the Secretary General's sign-in failed behind nginx with "upstream sent too big header"
 * (502), shown in the browser as "Application error: a client-side exception". nginx keeps a proxied response's
 * headers in one buffer (proxy_buffer_size; default one 4 KiB page). Sign-in responses carry the Supabase session
 * cookie, which grows with the account's metadata (copied into the JWT, the user and the identity) and its 2-step
 * factors. This measures the sign-in responses of a production-shaped staff account on the app directly and checks
 * them against the buffer that deploy/web/nginx/app.mcci.aderalabs.tech.conf gives the app.
 */
const env = readLocalEnv();
test.skip(!env, 'needs the local Supabase stack (MCCI_IT_LOCAL=1 with its URL and keys)');
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

/** the app location's header buffer in the nginx config (4 KiB when it sets none) */
function nginxHeaderBuffer(): number {
  const conf = readFileSync('deploy/web/nginx/app.mcci.aderalabs.tech.conf', 'utf8');
  const app = conf.slice(conf.indexOf('location / {\n        proxy_pass http://127.0.0.1:3200'));
  const k = /proxy_buffer_size (\d+)k;/.exec(app);
  return k ? Number(k[1]) * 1024 : 4096;
}

let admin: SupabaseClient;
const newPerson = () => ({
  id: '',
  email: `e2e-hdr-${randomUUID().slice(0, 8)}@test.local`,
  password: randomBytes(18).toString('base64url'),
});
const sg = newPerson();
const member = newPerson();

test.beforeAll(async () => {
  if (!env) return;
  admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const p of [sg, member]) {
    const { data, error } = await admin.auth.admin.createUser({ email: p.email, password: p.password, email_confirm: true });
    expect(error).toBeNull();
    p.id = data.user!.id;
    // what a self-registered, email-confirmed account carries (as in production: about 190 bytes)
    const meta = { sub: p.id, lang: 'en', email: p.email, full_name: 'Secretary General of the Chamber', email_verified: true, phone_verified: false };
    expect((await admin.auth.admin.updateUserById(p.id, { user_metadata: meta })).error).toBeNull();
  }
  expect((await admin.from('staff').insert({ user_id: sg.id, designation: 'Secretary General' })).error).toBeNull();
  // a 2-step set-up that was started but not finished (the production account had one)
  const own = createClient(env.url, env.publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  expect((await own.auth.signInWithPassword({ email: sg.email, password: sg.password })).error).toBeNull();
  expect((await own.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator app' })).error).toBeNull();
});

test.afterAll(async () => {
  if (!admin) return;
  if (sg.id) await admin.from('staff').delete().eq('user_id', sg.id);
  for (const p of [sg, member]) if (p.id) await admin.auth.admin.deleteUser(p.id);
});

/** bytes nginx must hold for the response head: status line + "Name: value\r\n" per header + blank line */
const headerBytes = async (r: Response) =>
  (await r.headersArray()).reduce((n, h) => n + h.name.length + 2 + Buffer.byteLength(h.value) + 2, 17 + 2);

async function signIn(page: Page, tab: 'member' | 'staff', who: { email: string; password: string }): Promise<number> {
  await page.goto('/login');
  if (tab === 'staff') {
    await page.getByRole('tab', { name: 'Staff' }).click();
    await page.getByLabel('Staff email').fill(who.email);
    await page.getByRole('tabpanel', { name: 'Staff' }).getByLabel('Password').fill(who.password);
  } else {
    await page.getByLabel('Mobile, email or member ID').fill(who.email);
    await page.getByRole('tabpanel', { name: 'Member login' }).getByLabel('Password').fill(who.password);
  }
  const posted = page.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/login');
  await page.locator(`[data-action="login.${tab}"]`).click();
  return headerBytes(await posted);
}

test('sign-in responses fit the header buffer nginx gives the app (member; staff with a started 2-step set-up)', async ({
  page,
  browser,
}) => {
  const limit = nginxHeaderBuffer();
  const memberBytes = await signIn(page, 'member', member);
  await expect(page).toHaveURL(/\/portal$/, { timeout: 20_000 });
  // the same browser, as in production: the earlier session's cookies are still there (the response replaces them)
  const old = (await page.context().cookies()).filter((c) => c.name.startsWith('sb-'));
  const ctx = await browser.newContext();
  await ctx.addCookies(old.map((c) => ({ ...c, value: c.value.replace(/.$/, 'x') })));
  const staffPage = await ctx.newPage();
  const staffBytes = await signIn(staffPage, 'staff', sg);
  await expect(staffPage).toHaveURL(/\/login\/verify$/);

  // finish the 2-step set-up the way the person does (the unfinished one is replaced by a new key on this page)
  const secret = (await staffPage.getByRole('main').locator('code').innerText()).trim();
  await staffPage.getByLabel('6-digit code').fill(totp(secret));
  const verified = staffPage.waitForResponse(
    (r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/login/verify',
  );
  await staffPage.locator('[data-action="login.staff"]').click();
  const verifyBytes = await headerBytes(await verified);
  await expect(staffPage).toHaveURL(/\/admin$/);

  // the Secretary General's screens of this release render (no client-side exception)
  for (const [path, heading] of [
    ['/admin/committee', 'Membership Committee'],
    ['/admin/meetings', 'Meetings & Minutes'],
  ] as const) {
    await staffPage.goto(path);
    await expect(staffPage.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(staffPage.getByText('Application error')).toHaveCount(0);
  }
  await ctx.close();
  console.log(
    `response headers: member sign-in ${memberBytes} B, staff sign-in ${staffBytes} B, 2-step ${verifyBytes} B; nginx buffer ${limit} B`,
  );
  for (const n of [memberBytes, staffBytes, verifyBytes]) {
    expect(n).toBeLessThan(limit);
    // keep real headroom: half the buffer
    expect(n).toBeLessThan(limit / 2);
  }
});
