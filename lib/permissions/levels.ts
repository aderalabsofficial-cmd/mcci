import { z } from 'zod';

/**
 * Permission model (docs/06): staff have a level 0..3 per admin module, member-company users a level 0..3 per area of
 * their company. 0 = no access, 1 = view, 2 = edit, 3 = approve. The numbers come from the database
 * (api.my_access(), migration 0270) — the same helpers the RLS policies use — never from the client.
 */
export const STAFF_MODULES = [
  'dash',
  'mem',
  'cmt',
  'temp',
  'reg',
  'svc',
  'docs',
  'pay',
  'eng',
  'rep',
  'staff',
  'plat',
] as const;
export const COMPANY_AREAS = ['mship', 'svc', 'docs', 'pay', 'events', 'profile'] as const;
export type StaffModule = (typeof STAFF_MODULES)[number];
export type CompanyArea = (typeof COMPANY_AREAS)[number];

export const LEVELS = { none: 0, view: 1, edit: 2, approve: 3 } as const;
export type LevelName = keyof typeof LEVELS;
export type Level = 0 | 1 | 2 | 3;

const level = z.number().int().min(0).max(3) as z.ZodType<Level>;

export const accessSchema = z.object({
  user_id: z.string().uuid(),
  email: z.string().nullable(),
  full_name: z.string().nullable(),
  lang: z.enum(['en', 'ur']).nullable(),
  staff: z
    .object({
      designation: z.string(),
      seniority: z.number().int(),
      levels: z.record(z.enum(STAFF_MODULES), level),
    })
    .nullable(),
  companies: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      role: z.enum(['Owner', 'Manager', 'Services', 'Accounts', 'Viewer']),
      levels: z.record(z.enum(COMPANY_AREAS), level),
    }),
  ),
  mfa: z.object({ totp_verified: z.boolean() }),
});
export type Access = z.infer<typeof accessSchema>;

export function toLevel(required: Level | LevelName): Level {
  return typeof required === 'number' ? required : LEVELS[required];
}

/** Staff level on a module; 0 for members and deactivated staff (api.my_access returns no staff block for them). */
export function staffLevel(access: Access, module: StaffModule): Level {
  return access.staff?.levels[module] ?? 0;
}

/** Level of the current user in one of their companies; 0 when they do not belong to it. */
export function companyLevel(access: Access, companyId: string, area: CompanyArea): Level {
  return access.companies.find((c) => c.id === companyId)?.levels[area] ?? 0;
}

export type Denial = 'not-signed-in' | 'mfa-required' | 'not-staff' | 'insufficient-level' | 'not-in-company';

/** Why a staff action is refused, or null when allowed. Staff need a TOTP-verified session (AAL2, docs/09). */
export function staffDenial(
  access: Access | null,
  aal: string | null,
  module: StaffModule,
  required: Level | LevelName,
): Denial | null {
  if (!access) return 'not-signed-in';
  if (!access.staff) return 'not-staff';
  if (aal !== 'aal2') return 'mfa-required';
  return staffLevel(access, module) >= toLevel(required) ? null : 'insufficient-level';
}

/** Why a member-company action is refused, or null when allowed. */
export function companyDenial(
  access: Access | null,
  companyId: string,
  area: CompanyArea,
  required: Level | LevelName,
): Denial | null {
  if (!access) return 'not-signed-in';
  const company = access.companies.find((c) => c.id === companyId);
  if (!company) return 'not-in-company';
  return company.levels[area] >= toLevel(required) ? null : 'insufficient-level';
}
