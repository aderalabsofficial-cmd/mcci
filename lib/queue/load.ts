import 'server-only';
import type { Session } from '@/lib/permissions/server';
import { staffLevel } from '@/lib/permissions/levels';
import { createClient } from '@/lib/supabase/server';

/**
 * "My queue" (prototype admin bottom bar; docs/15 MA): what is waiting for this staff member, by their own limits —
 * each list is read with their session (row-level security) and only for modules where they can act. Used by
 * /admin/queue and, as JSON, by the Android app (/api/queue). Demo companies are left out.
 */
export interface QueueItem {
  ref: string;
  title: string;
  status: string;
  at: string | null;
  href: string;
}
export interface QueueGroup {
  key: 'applications' | 'committee' | 'payments' | 'services' | 'complaints' | 'certificates' | 'notifications';
  count: number;
  items: QueueItem[];
}

export async function loadQueue(session: Session): Promise<QueueGroup[]> {
  const db = await createClient();
  const can = (m: Parameters<typeof staffLevel>[1], l: number) => staffLevel(session.access, m) >= l;
  const groups: Promise<QueueGroup | null>[] = [];

  if (can('mem', 2))
    groups.push(
      (async () => {
        const { data, count } = await db
          .from('applications')
          .select('id, token, stage, submitted_at, companies!inner(name, demo)', { count: 'exact' })
          .eq('companies.demo', false)
          .in('stage', ['submitted', 'review'])
          .order('submitted_at', { ascending: true })
          .limit(10);
        return {
          key: 'applications' as const,
          count: count ?? 0,
          items: (data ?? []).map((a) => ({
            ref: a.token,
            title: (a.companies as { name: string }).name,
            status: a.stage,
            at: a.submitted_at,
            href: `/admin/mreview?t=${a.token}`,
          })),
        };
      })(),
    );
  if (can('cmt', 1))
    groups.push(
      (async () => {
        const { data, count } = await db
          .from('applications')
          .select('id, token, stage, submitted_at, companies!inner(name, demo)', { count: 'exact' })
          .eq('companies.demo', false)
          .eq('stage', 'committee')
          .limit(10);
        return {
          key: 'committee' as const,
          count: count ?? 0,
          items: (data ?? []).map((a) => ({
            ref: a.token,
            title: (a.companies as { name: string }).name,
            status: a.stage,
            at: a.submitted_at,
            href: '/admin/committee',
          })),
        };
      })(),
    );
  if (can('pay', 2))
    groups.push(
      (async () => {
        const { data, count } = await db
          .from('payment_vouchers')
          .select('voucher_no, amount, status, created_at', { count: 'exact' })
          .eq('status', 'Receipt uploaded')
          .order('created_at', { ascending: true })
          .limit(10);
        return {
          key: 'payments' as const,
          count: count ?? 0,
          items: (data ?? []).map((v) => ({
            ref: v.voucher_no,
            title: `Rs ${v.amount}`,
            status: v.status,
            at: v.created_at,
            href: '/admin/payments',
          })),
        };
      })(),
    );
  if (can('svc', 2))
    groups.push(
      (async () => {
        const { data, count } = await db
          .from('service_requests')
          .select('id, token, service_key, status, submitted_at, assigned_to', { count: 'exact' })
          .in('status', ['Submitted', 'In review', 'Ready to sign'])
          .or(`assigned_to.is.null,assigned_to.eq.${session.userId}`)
          .order('submitted_at', { ascending: true })
          .limit(10);
        return {
          key: 'services' as const,
          count: count ?? 0,
          items: (data ?? []).map((r) => ({
            ref: r.token,
            title: r.service_key,
            status: r.status,
            at: r.submitted_at,
            href: `/admin/review?t=${r.token}`,
          })),
        };
      })(),
    );
  if (can('eng', 2))
    groups.push(
      (async () => {
        const { data, count } = await db
          .from('tickets')
          .select('id, public_ref, subject, status, created_at, assigned_to', { count: 'exact' })
          .in('status', ['Open', 'In progress'])
          .or(`assigned_to.is.null,assigned_to.eq.${session.userId}`)
          .order('created_at', { ascending: true })
          .limit(10);
        return {
          key: 'complaints' as const,
          count: count ?? 0,
          items: (data ?? []).map((t) => ({
            ref: t.public_ref ?? t.id,
            title: t.subject,
            status: t.status,
            at: t.created_at,
            href: `/admin/complaints?t=${t.id}`,
          })),
        };
      })(),
    );
  if (can('temp', 2))
    groups.push(
      (async () => {
        const { data, count } = await db
          .from('certificate_scans')
          .select('id, file_name, status, uploaded_at', { count: 'exact' })
          .or('status.in.(uploaded,extracted,failed),and(status.eq.confirmed,stamped_path.is.null)')
          .order('uploaded_at', { ascending: true })
          .limit(10);
        return {
          key: 'certificates' as const,
          count: count ?? 0,
          items: (data ?? []).map((s) => ({
            ref: s.file_name ?? s.id.slice(0, 8),
            title: s.file_name ?? '',
            status: s.status,
            at: s.uploaded_at,
            href: '/admin/certs',
          })),
        };
      })(),
    );
  groups.push(
    (async () => {
      const { data, count } = await db
        .from('notifications')
        .select('id, title, created_at, link, read_at', { count: 'exact' })
        .eq('user_id', session.userId)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(10);
      return {
        key: 'notifications' as const,
        count: count ?? 0,
        items: (data ?? []).map((n) => ({
          ref: '',
          title: n.title,
          status: 'new',
          at: n.created_at,
          href: n.link ?? '/admin',
        })),
      };
    })(),
  );
  return (await Promise.all(groups)).filter((g): g is QueueGroup => g !== null);
}
