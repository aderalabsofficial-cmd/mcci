import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { NoAccess } from '@/components/admin/no-access';
import { StaffScreen, type StaffRow } from '@/components/admin/staff-screen';
import { PageHeader } from '@/components/shared/page-header';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { STAFF_MODULES, staffLevel, type Level } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.staff') };
}

export const dynamic = 'force-dynamic';

/**
 * Staff & Roles (prototype admin/staff, access.js). View needs Staff & audit level 1, every change level 3
 * (Secretary General by default). The admin layout has already required active staff with 2-step login. Data comes
 * through the person's own session: api.staff_directory() (0290), invitations (RLS: level 3 sees them, others none),
 * designations and role_permissions (RLS: staff).
 */
export default async function StaffPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const level = staffLevel(session.access, 'staff');
  const title = { en: msg('en', 'screens.admin.staff'), ur: msg('ur', 'screens.admin.staff') };

  if (level < 1) {
    return (
      <>
        <PageHeader locale={locale} title={title} bilingual={false} />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module="staff" />
      </>
    );
  }

  const supabase = await createClient();
  const [dir, invites, designations, limits] = await Promise.all([
    supabase.schema('api').rpc('staff_directory'),
    supabase
      .from('invitations')
      .select('id, email, full_name, designation, status, expires_at, created_at')
      .eq('kind', 'staff')
      .in('status', ['Invited', 'Expired'])
      .order('created_at', { ascending: false }),
    supabase.from('designations').select('name, seniority').order('seniority', { ascending: false }),
    supabase.from('role_permissions').select('designation, module, level'),
  ]);
  for (const r of [dir, invites, designations, limits]) if (r.error) throw new Error(r.error.message);

  const seniority = new Map((designations.data ?? []).map((d) => [d.name, d.seniority]));
  const now = Date.now();
  const rows: StaffRow[] = [
    ...(dir.data ?? []).map((s): StaffRow => ({
      kind: 'staff',
      id: s.user_id,
      name: s.full_name,
      email: s.email,
      designation: s.designation,
      seniority: s.seniority,
      status: s.active ? 'Active' : 'Disabled',
      totp: s.totp,
      lastActive: s.last_sign_in_at,
      sentAt: null,
      expiresAt: null,
      self: s.user_id === session.userId,
    })),
    ...(invites.data ?? []).map((i): StaffRow => ({
      kind: 'invitation',
      id: i.id,
      name: i.full_name ?? i.email,
      email: i.email,
      designation: i.designation ?? '',
      seniority: seniority.get(i.designation ?? '') ?? 0,
      // api.invite_lookup treats an overdue invitation as Expired; the list does the same
      status:
        i.status === 'Invited' && Date.parse(i.expires_at) <= now ? 'Expired' : (i.status as 'Invited' | 'Expired'),
      totp: false,
      lastActive: null,
      sentAt: i.created_at,
      expiresAt: i.expires_at,
      self: false,
    })),
  ];

  const grid: Record<string, Record<string, Level>> = {};
  for (const d of designations.data ?? [])
    grid[d.name] = Object.fromEntries(STAFF_MODULES.map((m) => [m, 0])) as Record<string, Level>;
  for (const l of limits.data ?? []) if (grid[l.designation]) grid[l.designation]![l.module] = l.level as Level;

  return (
    <>
      <PageHeader locale={locale} title={title} bilingual={false} />
      <StaffScreen
        locale={locale}
        canManage={level >= 3}
        me={{ name: session.access.full_name ?? '', designation: session.access.staff?.designation ?? '' }}
        rows={rows}
        designations={(designations.data ?? []).map((d) => ({ name: d.name, seniority: d.seniority }))}
        limits={grid}
      />
    </>
  );
}
