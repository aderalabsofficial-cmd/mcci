import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { accessSchema } from '@/lib/permissions/levels';
import { readLocalEnv } from './local-env';
import { jwtClaims, Synthetic, totp, type User } from './synthetic';

/**
 * api.my_access() (migration 0270) through the real Auth + REST path: what lib/permissions reads on the server.
 * Synthetic users only (it-<run>-…@test.local), removed by teardown.
 */
const env = readLocalEnv();
let w: Synthetic;
let owner: User;
let services: User;
let outsider: User;
let officer: User;
let companyA: string;

beforeAll(async () => {
  if (!env) return;
  w = new Synthetic(env);
  owner = await w.user('acc-owner');
  services = await w.user('acc-services');
  outsider = await w.user('acc-outsider');
  officer = await w.user('acc-officer');
  companyA = await w.company('A', [
    { user: owner, role: 'Owner' },
    { user: services, role: 'Services' },
  ]);
  await w.company('B', [{ user: outsider, role: 'Owner' }]);
  await w.staff(officer, 'Membership Officer');
}, 120_000);

afterAll(async () => {
  if (w) await w.teardown();
}, 120_000);

const access = async (u: User) => {
  const { data, error } = await u.client.schema('api').rpc('my_access');
  expect(error).toBeNull();
  return accessSchema.parse(data);
};

describe.skipIf(!env)('api.my_access through Auth + REST (lib/permissions)', () => {
  it('an anonymous client cannot call it', async () => {
    const { error } = await w.anon.schema('api').rpc('my_access');
    expect(error).not.toBeNull();
  });

  it('members get their own company with the docs/06 levels and nothing else', async () => {
    const a = await access(owner);
    expect(a.user_id).toBe(owner.id);
    expect(a.staff).toBeNull();
    expect(a.companies).toHaveLength(1);
    expect(a.companies[0]).toMatchObject({ id: companyA, role: 'Owner' });
    expect(a.companies[0]!.levels.mship).toBe(3);
    const s = await access(services);
    expect(s.companies[0]!.levels).toMatchObject({ svc: 2, pay: 0 });
    const o = await access(outsider);
    expect(o.companies.map((c) => c.id)).not.toContain(companyA);
  });

  it('staff get their designation levels; TOTP enrolment + verify gives totp_verified and an AAL2 session', async () => {
    const before = await access(officer);
    expect(before.staff).toMatchObject({ designation: 'Membership Officer' });
    expect(before.staff!.levels.mem).toBe(2);
    expect(before.mfa.totp_verified).toBe(false);

    const enrolled = await officer.client.auth.mfa.enroll({ factorType: 'totp', friendlyName: `it-${w.run}` });
    expect(enrolled.error).toBeNull();
    const { id: factorId, totp: t } = enrolled.data as { id: string; totp: { secret: string } };
    const challenge = await officer.client.auth.mfa.challenge({ factorId });
    expect(challenge.error).toBeNull();
    const verified = await officer.client.auth.mfa.verify({
      factorId,
      challengeId: challenge.data!.id,
      code: totp(t.secret),
    });
    expect(verified.error).toBeNull();
    expect(jwtClaims(verified.data!.access_token).aal).toBe('aal2');

    const after = await access(officer);
    expect(after.mfa.totp_verified).toBe(true);
  });
});
