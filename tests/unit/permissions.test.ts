import { describe, expect, it } from 'vitest';
import {
  accessSchema,
  companyDenial,
  companyLevel,
  staffDenial,
  staffLevel,
  type Access,
} from '@/lib/permissions/levels';

const COMPANY_A = '0a000000-0000-4000-8000-00000000000a';
const COMPANY_B = '0b000000-0000-4000-8000-00000000000b';
const levels = (v: Record<string, number>) => v as Access['companies'][number]['levels'];

const member: Access = {
  user_id: '11111111-0000-4000-8000-000000000001',
  email: 'owner.a@test.local',
  full_name: 'Owner A',
  lang: 'en',
  staff: null,
  companies: [
    {
      id: COMPANY_A,
      name: 'A',
      role: 'Services',
      levels: levels({ mship: 1, svc: 2, docs: 1, pay: 0, events: 1, profile: 1 }),
    },
  ],
  mfa: { totp_verified: false },
};
const officer: Access = {
  ...member,
  user_id: '22222222-0000-4000-8000-000000000003',
  staff: {
    designation: 'Membership Officer',
    seniority: 3,
    levels: { dash: 1, mem: 2, cmt: 1, temp: 1, reg: 1, svc: 0, docs: 1, pay: 0, eng: 0, rep: 1, staff: 0, plat: 0 },
  },
  companies: [],
  mfa: { totp_verified: true },
};

describe('permission decisions (docs/06, api.my_access)', () => {
  it('parses exactly what api.my_access returns and rejects anything else', () => {
    expect(accessSchema.parse(officer)).toEqual(officer);
    expect(() => accessSchema.parse({ ...officer, staff: { ...officer.staff, levels: { mem: 4 } } })).toThrow();
    expect(() => accessSchema.parse({ ...member, companies: [{ ...member.companies[0], role: 'Admin' }] })).toThrow();
  });

  it('staff: needs a staff record, a TOTP-verified session (AAL2) and the level', () => {
    expect(staffDenial(null, null, 'mem', 'view')).toBe('not-signed-in');
    expect(staffDenial(member, 'aal2', 'mem', 'view')).toBe('not-staff');
    expect(staffDenial(officer, 'aal1', 'mem', 'view')).toBe('mfa-required');
    expect(staffDenial(officer, 'aal2', 'mem', 'edit')).toBeNull();
    expect(staffDenial(officer, 'aal2', 'mem', 'approve')).toBe('insufficient-level');
    expect(staffDenial(officer, 'aal2', 'pay', 1)).toBe('insufficient-level');
    expect(staffLevel(member, 'mem')).toBe(0);
  });

  it('members: only their own company, and only up to the role matrix level', () => {
    expect(companyDenial(member, COMPANY_A, 'svc', 'edit')).toBeNull();
    expect(companyDenial(member, COMPANY_A, 'pay', 'view')).toBe('insufficient-level');
    expect(companyDenial(member, COMPANY_B, 'svc', 'view')).toBe('not-in-company');
    expect(companyDenial(null, COMPANY_A, 'svc', 'view')).toBe('not-signed-in');
    expect(companyLevel(member, COMPANY_B, 'mship')).toBe(0);
  });
});
