import 'server-only';
import { publicStorageUrl } from '@/lib/membership/load';
import { createClient } from '@/lib/supabase/server';

/**
 * Payments for staff (prototype admin/payments, admin/psid): every voucher with its company and receipts, read with the
 * staff member's own session (RLS: pay ≥ 1). Receipt files open through 10-minute signed URLs.
 */

export interface Receipt {
  id: string;
  method: 'upload' | 'counter';
  status: 'Submitted' | 'Accepted' | 'Rejected';
  bank_ref: string | null;
  reason: string | null;
  uploaded_at: string;
  url: string | null;
}

export interface StaffVoucher {
  no: string;
  company: string;
  ref_type: string;
  token: string | null;
  amount: number;
  status: string;
  due_at: string;
  paid_at: string | null;
  created_at: string;
  reject_reason: string | null;
  receipts: Receipt[];
}

export async function loadVouchers(): Promise<StaffVoucher[]> {
  const supabase = await createClient();
  const [{ data: vs, error }, { data: rs }] = await Promise.all([
    supabase
      .from('payment_vouchers')
      .select('id, voucher_no, company_id, ref_type, ref_id, amount, status, due_at, paid_at, created_at, reject_reason, companies(name)')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('payment_receipts')
      .select('id, voucher_id, path, method, status, bank_ref, reason, uploaded_at')
      .order('uploaded_at', { ascending: false }),
  ]);
  if (error) throw new Error(`vouchers: ${error.message}`);
  const apps = (vs ?? []).filter((v) => v.ref_type === 'membership').map((v) => v.ref_id);
  const { data: appRows } = apps.length
    ? await supabase.from('applications').select('id, token').in('id', apps)
    : { data: [] as { id: string; token: string }[] };
  const waiting = (rs ?? []).filter((r) => r.status === 'Submitted' && r.path).map((r) => r.path!);
  const { data: signed } = waiting.length
    ? await supabase.storage.from('receipts').createSignedUrls(waiting, 600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const url = new Map((signed ?? []).filter((s) => s.path && s.signedUrl).map((s) => [s.path!, publicStorageUrl(s.signedUrl!)]));
  return (vs ?? []).map((v) => ({
    no: v.voucher_no,
    company: (v.companies as unknown as { name: string } | null)?.name ?? '—',
    ref_type: v.ref_type,
    token: appRows?.find((a) => a.id === v.ref_id)?.token ?? null,
    amount: v.amount,
    status: v.status,
    due_at: v.due_at,
    paid_at: v.paid_at,
    created_at: v.created_at,
    reject_reason: v.reject_reason,
    receipts: (rs ?? [])
      .filter((r) => r.voucher_id === v.id)
      .map((r) => ({
        id: r.id,
        method: r.method as Receipt['method'],
        status: r.status as Receipt['status'],
        bank_ref: r.bank_ref,
        reason: r.reason,
        uploaded_at: r.uploaded_at,
        url: r.path ? (url.get(r.path) ?? null) : null,
      })),
  }));
}

export interface BankSettings {
  name: string;
  title: string;
  iban: string;
  branch: string;
  confirmed: boolean;
}

export async function loadBank(): Promise<BankSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema('api').rpc('settings_bank');
  if (error || !data) return null;
  const b = data as Record<string, unknown>;
  const s = (k: string) => (typeof b[k] === 'string' ? (b[k] as string) : '');
  return { name: s('name'), title: s('title'), iban: s('iban'), branch: s('branch'), confirmed: b.confirmed === true };
}
