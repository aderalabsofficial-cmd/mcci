import { mkdirSync, writeFileSync } from 'node:fs';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { expect, test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { totp } from '../support/totp';
import { ACCOUNTS_FILE, AUTH_DIR, type E2eAccounts, STAFF, STATE } from './accounts';

/**
 * Runs once before the browser projects. With the local Supabase stack (MCCI_IT_LOCAL=1 + keys, see
 * tests/integration/local-env.ts) it creates a synthetic member (company Owner with a member number) and a synthetic
 * Membership Officer with a verified TOTP authenticator, then signs both in THROUGH THE LOGIN PAGE and saves their
 * sessions. Without a stack it records `backend: false`; protected-area tests then skip with that reason.
 * auth.teardown.ts removes everything created here.
 */
setup('create e2e accounts and sign in through the UI', async ({ browser }) => {
  setup.setTimeout(120_000);
  mkdirSync(AUTH_DIR, { recursive: true });
  const env = readLocalEnv();
  if (!env) {
    writeFileSync(ACCOUNTS_FILE, JSON.stringify({ backend: false } satisfies E2eAccounts));
    return;
  }

  const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(env.url, env.secretKey, noSession);
  const run = randomUUID().slice(0, 8);
  const pw = () => randomBytes(18).toString('base64url');
  const accounts: E2eAccounts = {
    backend: true,
    run,
    member: {
      id: '',
      email: `e2e-${run}-member@test.local`,
      password: pw(),
      memberNo: `MCCI-C-9${randomInt(10000, 99999)}`,
    },
    staff: { id: '', email: `e2e-${run}-staff@test.local`, password: pw(), totpSecret: '' },
    sg: { id: '', email: `e2e-${run}-sg@test.local`, password: pw(), totpSecret: '' },
    president: { id: '', email: `e2e-${run}-president@test.local`, password: pw(), totpSecret: '' },
    convener: { id: '', email: `e2e-${run}-convener@test.local`, password: pw(), totpSecret: '' },
    itconv: { id: '', email: `e2e-${run}-itconv@test.local`, password: pw(), totpSecret: '' },
    reset: { id: '', email: `e2e-${run}-reset@test.local`, password: pw() },
    companyId: randomUUID(),
    memberRowId: randomUUID(),
  };
  // written first, so teardown can clean up whatever exists even if a later step fails
  writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts));

  for (const who of ['member', 'staff', 'sg', 'president', 'convener', 'itconv', 'reset'] as const) {
    const a = accounts[who]!;
    const created = await admin.auth.admin.createUser({
      email: a.email,
      password: a.password,
      email_confirm: true,
      user_metadata: {
        full_name: {
          member: `E2E Member ${run}`,
          staff: `E2E Officer ${run}`,
          sg: `E2E Secretary ${run}`,
          president: `E2E President ${run}`,
          convener: `E2E Convener ${run}`,
          itconv: `E2E IT Convener ${run}`,
          reset: `E2E Reset ${run}`,
        }[who],
      },
    });
    expect(created.error).toBeNull();
    a.id = created.data.user!.id;
    writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts));
  }
  const ok = (r: { error: { message: string } | null }) => expect(r.error?.message ?? null).toBeNull();
  ok(await admin.from('companies').insert({ id: accounts.companyId, name: `E2E ${run} Traders`, biz_type: 'pvt' }));
  ok(
    await admin
      .from('company_users')
      .insert({ company_id: accounts.companyId, user_id: accounts.member!.id, role: 'Owner' }),
  );
  ok(
    await admin.from('members').insert({
      id: accounts.memberRowId,
      member_no: accounts.member!.memberNo,
      company_id: accounts.companyId,
      class: 'Corporate',
      status: 'Permanent',
      rep_name: `E2E Member ${run}`,
      since: '2020-04-01',
      valid_to: '2099-03-31',
    }),
  );
  for (const who of Object.keys(STAFF) as (keyof typeof STAFF)[]) {
    ok(await admin.from('staff').insert({ user_id: accounts[who]!.id, designation: STAFF[who] }));
  }

  // each staff authenticator, enrolled with the person's own session (as the 2-step page does)
  for (const who of Object.keys(STAFF) as (keyof typeof STAFF)[]) {
    const a = accounts[who]!;
    const person = createClient(env.url, env.publishableKey, noSession);
    ok(await person.auth.signInWithPassword({ email: a.email, password: a.password }));
    const enrolled = await person.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'e2e' });
    ok(enrolled);
    const factor = enrolled.data as { id: string; totp: { secret: string } };
    const challenge = await person.auth.mfa.challenge({ factorId: factor.id });
    ok(
      await person.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.data!.id,
        code: totp(factor.totp.secret),
      }),
    );
    a.totpSecret = factor.totp.secret;
    writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts));
  }

  // sign in through the real login page and keep the sessions
  const member = await browser.newContext();
  const mp = await member.newPage();
  await mp.goto('/login');
  await mp.getByLabel('Mobile, email or member ID').fill(accounts.member!.email);
  await mp.getByRole('tabpanel', { name: 'Member login' }).getByLabel('Password').fill(accounts.member!.password);
  await mp.locator('[data-action="login.member"]').click();
  await expect(mp).toHaveURL(/\/portal$/);
  await member.storageState({ path: STATE.member });
  await member.close();

  for (const who of Object.keys(STAFF) as (keyof typeof STAFF)[]) {
    const a = accounts[who]!;
    const ctx = await browser.newContext();
    const sp = await ctx.newPage();
    await sp.goto('/staff/login');
    await sp.getByLabel('Staff email').fill(a.email);
    await sp.getByLabel('Password').fill(a.password);
    await sp.locator('[data-action="login.staff"]').click();
    await expect(sp).toHaveURL(/\/login\/verify$/);
    await sp.getByLabel('6-digit code').fill(totp(a.totpSecret));
    await sp.locator('[data-action="login.staff"]').click();
    await expect(sp).toHaveURL(/\/admin$/);
    await ctx.storageState({ path: STATE[who] });
    await ctx.close();
  }
});
