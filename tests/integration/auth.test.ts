import { randomInt } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readLocalEnv } from './local-env';
import { jwtClaims, readSqlHook, Synthetic, totp, uuidParam } from './synthetic';

/**
 * Auth API A1–A12 (docs/17 §11) against the running stack: the pinned GoTrue with the settings fixed in
 * deploy/selfhost/mcci/docker-compose.mcci.yml. Synthetic @test.local users only, created and removed by this suite.
 *
 * Email delivery is not exercised: confirmation, email-change and one-time codes are obtained with the admin
 * generate-link API (which sends nothing) and then redeemed through the PUBLIC verify endpoint, exactly as the emailed
 * link or code would be. Cases that need time travel (A5 aged session, A7 expiry) use the optional SQL hook
 * (MCCI_IT_SQL_CMD, synthetic.ts) and are skipped without it.
 *
 * A10 sends the client address in X-Real-IP, as the TLS proxy must (docs/17 §3, D-M22): GoTrue applies its per-IP
 * limits only when GOTRUE_RATE_LIMIT_HEADER names a header that carries a value.
 */
const env = readLocalEnv();
const sql = readSqlHook();
let w: Synthetic;

beforeAll(() => {
  if (env) w = new Synthetic(env);
});
afterAll(async () => {
  if (w) await w.teardown();
}, 120_000);

const authHeaders = (extra: Record<string, string> = {}) => ({
  apikey: env!.publishableKey,
  'content-type': 'application/json',
  ...extra,
});

/** Sends `n` requests and returns the 1-based index of the first 429, or 0 if none. */
async function firstLimited(n: number, send: (i: number) => Promise<Response>) {
  for (let i = 1; i <= n; i++) {
    const res = await send(i);
    await res.arrayBuffer();
    if (res.status === 429) return i;
  }
  return 0;
}

describe.skipIf(!env)('Auth API A1–A12', () => {
  it('A1: a new Auth user gets a profile (language from metadata) and no staff rights', async () => {
    const ur = await w.user('a1-ur', { meta: { full_name: 'A1 Urdu', lang: 'ur', designation: 'Secretary General' } });
    const en = await w.user('a1-en', { meta: { lang: 'fr' } });
    const p = await w.service.from('profiles').select('id, email, full_name, lang').in('id', [ur.id, en.id]);
    expect(p.error).toBeNull();
    const byId = new Map(p.data!.map((r) => [r.id, r]));
    expect(byId.get(ur.id)).toMatchObject({ email: ur.email, full_name: 'A1 Urdu', lang: 'ur' });
    expect(byId.get(en.id)).toMatchObject({ email: en.email, full_name: en.email.split('@')[0], lang: 'en' });
    // metadata cannot grant staff rights: no staff row, and the user sees no staff data
    const staff = await w.service.from('staff').select('user_id').in('user_id', [ur.id, en.id]);
    expect(staff.data).toEqual([]);
    const own = await ur.client.from('staff').select('user_id');
    expect(own.error).toBeNull();
    expect(own.data).toEqual([]);
  });

  it('A2: sign-in fails before email confirmation and works after the confirmation link is redeemed', async () => {
    const u = await w.user('a2', { confirmed: false });
    const before = await u.client.auth.signInWithPassword({ email: u.email, password: u.password });
    expect(before.error?.code).toBe('email_not_confirmed');
    // a forged token does not confirm
    const forged = await w.client().auth.verifyOtp({ token_hash: 'f'.repeat(56), type: 'signup' });
    expect(forged.error).not.toBeNull();
    expect((await u.client.auth.signInWithPassword({ email: u.email, password: u.password })).error?.code).toBe(
      'email_not_confirmed',
    );
    const link = await w.service.auth.admin.generateLink({ type: 'signup', email: u.email, password: u.password });
    expect(link.error).toBeNull();
    const verified = await w
      .client()
      .auth.verifyOtp({ token_hash: link.data.properties!.hashed_token, type: 'signup' });
    expect(verified.error).toBeNull();
    const after = await u.client.auth.signInWithPassword({ email: u.email, password: u.password });
    expect(after.error).toBeNull();
    expect(after.data.session?.access_token).toBeTruthy();
  });

  it('A3: passwords shorter than 10 characters are rejected (sign-up and password change)', async () => {
    const signUp = await w.client().auth.signUp({ email: w.email('a3-short'), password: 'Abc12345!' });
    expect(signUp.error?.code).toBe('weak_password');
    const u = await w.user('a3');
    const change = await u.client.auth.updateUser({ password: 'Abc12345!' });
    expect(change.error?.code).toBe('weak_password');
    // control: 10 characters are accepted on the same fresh session
    const ok = await u.client.auth.updateUser({ password: 'Abcd12345!' });
    expect(ok.error).toBeNull();
  });

  it('A4: an email change needs both confirmations; profiles.email follows only after the second', async () => {
    const u = await w.user('a4');
    const newEmail = w.email('a4-new');
    const current = await w.service.auth.admin.generateLink({ type: 'email_change_current', email: u.email, newEmail });
    expect(current.error).toBeNull();
    const next = await w.service.auth.admin.generateLink({ type: 'email_change_new', email: u.email, newEmail });
    expect(next.error).toBeNull();

    const first = await w.client().auth.verifyOtp({
      token_hash: current.data.properties!.hashed_token,
      type: 'email_change',
    });
    expect(first.error).toBeNull();
    const mid = await w.service.auth.admin.getUserById(u.id);
    expect(mid.data.user?.email).toBe(u.email); // one confirmation is not enough
    expect((await w.service.from('profiles').select('email').eq('id', u.id).single()).data?.email).toBe(u.email);

    // the code sent to the new address (the admin link's token_hash for email_change_new is not accepted by this
    // GoTrue, while the 6-digit code from the same generate-link call is: both reach the same verify endpoint)
    const second = await w
      .client()
      .auth.verifyOtp({ email: newEmail, token: next.data.properties!.email_otp, type: 'email_change' });
    expect(second.error).toBeNull();
    expect((await w.service.auth.admin.getUserById(u.id)).data.user?.email).toBe(newEmail);
    expect((await w.service.from('profiles').select('email').eq('id', u.id).single()).data?.email).toBe(newEmail);
  });

  it('A5 (control): a session younger than 24 h may change the password without re-authentication', async () => {
    // GoTrue's secure_password_change asks for a re-authentication nonce only when the session is older than 24 h.
    const u = await w.user('a5-fresh');
    expect((await u.client.auth.updateUser({ password: w.password() })).error).toBeNull();
  });

  it.skipIf(!sql)('A5: a session older than 24 h cannot change the password without re-authentication', async () => {
    const u = await w.user('a5-aged');
    sql!(`update auth.sessions set created_at = now() - interval '25 hours' where user_id = ${uuidParam(u.id)};`);
    const res = await u.client.auth.updateUser({ password: w.password() });
    expect(res.error?.code).toBe('reauthentication_needed');
    // the old password still works: nothing was changed
    expect((await w.client().auth.signInWithPassword({ email: u.email, password: u.password })).error).toBeNull();
  });

  it('A6: TOTP enrol → challenge → verify reaches AAL2; a wrong code is rejected', async () => {
    const u = await w.user('a6');
    const enrolled = await u.client.auth.mfa.enroll({ factorType: 'totp', friendlyName: `it-${w.run}` });
    expect(enrolled.error).toBeNull();
    const { id: factorId, totp: t } = enrolled.data as { id: string; totp: { secret: string } };
    const session = (await u.client.auth.getSession()).data.session!;
    expect(jwtClaims(session.access_token).aal).toBe('aal1');

    const wrongChallenge = await u.client.auth.mfa.challenge({ factorId });
    expect(wrongChallenge.error).toBeNull();
    const good = totp(t.secret);
    const wrong = String((Number(good) + 500_000) % 1_000_000).padStart(6, '0');
    const rejected = await u.client.auth.mfa.verify({ factorId, challengeId: wrongChallenge.data!.id, code: wrong });
    expect(rejected.error).not.toBeNull();

    const challenge = await u.client.auth.mfa.challenge({ factorId });
    expect(challenge.error).toBeNull();
    const verified = await u.client.auth.mfa.verify({
      factorId,
      challengeId: challenge.data!.id,
      code: totp(t.secret),
    });
    expect(verified.error).toBeNull();
    expect(jwtClaims(verified.data!.access_token).aal).toBe('aal2');
  });

  it('A7: an email one-time code signs in once; wrong and reused codes are rejected', async () => {
    const u = await w.user('a7');
    const link = await w.service.auth.admin.generateLink({ type: 'magiclink', email: u.email });
    expect(link.error).toBeNull();
    const code = link.data.properties!.email_otp;
    expect(code).toMatch(/^\d{6}$/); // GOTRUE_MAILER_OTP_LENGTH 6
    const wrong = String((Number(code) + 1) % 1_000_000).padStart(6, '0');
    expect((await w.client().auth.verifyOtp({ email: u.email, token: wrong, type: 'email' })).error?.code).toBe(
      'otp_expired',
    );
    const ok = await w.client().auth.verifyOtp({ email: u.email, token: code, type: 'email' });
    expect(ok.error).toBeNull();
    expect(ok.data.session?.access_token).toBeTruthy();
    expect((await w.client().auth.verifyOtp({ email: u.email, token: code, type: 'email' })).error?.code).toBe(
      'otp_expired',
    );
  });

  it.skipIf(!sql)('A7: an email one-time code older than GOTRUE_MAILER_OTP_EXP (3600 s) is rejected', async () => {
    const u = await w.user('a7-exp');
    const link = await w.service.auth.admin.generateLink({ type: 'magiclink', email: u.email });
    expect(link.error).toBeNull();
    const id = uuidParam(u.id);
    sql!(
      `update auth.users set recovery_sent_at = now() - interval '61 minutes' where id = ${id};` +
        `update auth.one_time_tokens set created_at = now() - interval '61 minutes' where user_id = ${id};`,
    );
    const res = await w
      .client()
      .auth.verifyOtp({ email: u.email, token: link.data.properties!.email_otp, type: 'email' });
    expect(res.error?.code).toBe('otp_expired');
  });

  it('A8: anonymous sign-in is rejected and creates no user', async () => {
    const profiles = async () => (await w.service.from('profiles').select('id', { count: 'exact', head: true })).count;
    const before = await profiles();
    const res = await w.client().auth.signInAnonymously();
    expect(res.error?.code).toBe('anonymous_provider_disabled');
    expect(res.data.user).toBeNull();
    expect(await profiles()).toBe(before);
  });

  it('A9: sign-out everywhere revokes the refresh tokens of every session', async () => {
    const u = await w.user('a9');
    const other = w.client();
    expect((await other.auth.signInWithPassword({ email: u.email, password: u.password })).error).toBeNull();
    const otherRefresh = (await other.auth.getSession()).data.session!.refresh_token;
    const ownRefresh = (await u.client.auth.getSession()).data.session!.refresh_token;
    // control: a refresh token works before sign-out
    const control = w.client();
    const refreshed = await control.auth.refreshSession({ refresh_token: otherRefresh });
    expect(refreshed.error).toBeNull();
    const otherRefresh2 = refreshed.data.session!.refresh_token;

    expect((await u.client.auth.signOut({ scope: 'global' })).error).toBeNull();
    for (const token of [ownRefresh, otherRefresh2]) {
      const res = await w.client().auth.refreshSession({ refresh_token: token });
      expect(res.error).not.toBeNull();
    }
    // the other session's access token no longer resolves to a user (its session row is gone)
    const access = refreshed.data.session!.access_token;
    const res = await fetch(`${env!.url}/auth/v1/user`, {
      headers: { ...authHeaders(), authorization: `Bearer ${access}` },
    });
    expect(res.status).toBe(403);
  });

  it('A10: sign-in, code verification and code requests are rate-limited per client address', async () => {
    // TEST-NET-2 addresses (RFC 5737), fresh per run, so a real client is never limited by this test
    const ip = `198.51.100.${randomInt(1, 255)}`;
    const other = `198.51.100.${(Number(ip.split('.')[3]) % 254) + 1}`;
    const xri = (addr: string) => authHeaders({ 'x-real-ip': addr });

    const signIn = (addr: string) => () =>
      fetch(`${env!.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: xri(addr),
        body: JSON.stringify({ email: w.email('a10-nobody'), password: 'not-the-password' }),
      });
    // GOTRUE_RATE_LIMIT_TOKEN_REFRESH 150 (burst per address)
    expect(await firstLimited(151, signIn(ip))).toBeGreaterThan(0);
    expect((await signIn(other)()).status).not.toBe(429); // another address is not affected

    const verify = (addr: string) => () =>
      fetch(`${env!.url}/auth/v1/verify`, {
        method: 'POST',
        headers: xri(addr),
        body: JSON.stringify({ type: 'email', email: w.email('a10-nobody'), token: '123456' }),
      });
    // GOTRUE_RATE_LIMIT_VERIFY 30
    expect(await firstLimited(31, verify(ip))).toBeGreaterThan(0);
    expect((await verify(other)()).status).not.toBe(429);

    const otp = (addr: string) => (i: number) =>
      fetch(`${env!.url}/auth/v1/otp`, {
        method: 'POST',
        headers: xri(addr),
        // unknown addresses and create_user false: no user is created and no email is sent
        body: JSON.stringify({ email: w.email(`a10-otp-${i}`), create_user: false }),
      });
    // GOTRUE_RATE_LIMIT_OTP 30
    expect(await firstLimited(31, otp(ip))).toBeGreaterThan(0);
  });

  it('A10 (per address): a new code request within a minute of the last code for that address is refused', async () => {
    const u = await w.user('a10-freq');
    // generate-link records the send time exactly as a delivered email does (no SMTP on the test stack); a failed
    // delivery records nothing, so it cannot be used here
    expect((await w.service.auth.admin.generateLink({ type: 'magiclink', email: u.email })).error).toBeNull();
    const again = await w.client().auth.signInWithOtp({ email: u.email, options: { shouldCreateUser: false } });
    expect(again.error?.code).toBe('over_email_send_rate_limit'); // GOTRUE_SMTP_MAX_FREQUENCY, Auth default 1m
  });

  it("A11: a user's JWT on REST returns only their own profile", async () => {
    const a = await w.user('a11-a');
    const b = await w.user('a11-b');
    const mine = await a.client.from('profiles').select('id');
    expect(mine.error).toBeNull();
    expect(mine.data).toEqual([{ id: a.id }]);
    expect((await a.client.from('profiles').select('id').eq('id', b.id)).data).toEqual([]);
    const upd = await a.client.from('profiles').update({ full_name: 'hijack' }).eq('id', b.id).select('id');
    expect(upd.data).toEqual([]);
    // control: the service role sees both, and b's name is unchanged
    const both = await w.service.from('profiles').select('id, full_name').in('id', [a.id, b.id]);
    expect(both.data).toHaveLength(2);
    expect(both.data!.find((r) => r.id === b.id)?.full_name).not.toBe('hijack');
  });

  it('A12: deleting an Auth user removes the profile (cascade)', async () => {
    const u = await w.user('a12');
    expect((await w.service.from('profiles').select('id').eq('id', u.id)).data).toHaveLength(1);
    expect((await w.service.auth.admin.deleteUser(u.id)).error).toBeNull();
    expect((await w.service.from('profiles').select('id').eq('id', u.id)).data).toEqual([]);
  });
});
