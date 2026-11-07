import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { MyWhatsapp, StaffWhatsapp, WaStatus } from '@/lib/whatsapp/consent';

/** the member's own company (api.wa_my_whatsapp checks the company role in the database) */
export async function loadMyWhatsapp(company: string): Promise<MyWhatsapp | null> {
  const db = await createClient();
  const [{ data, error }, wording] = await Promise.all([
    db.schema('api').rpc('wa_my_whatsapp', { p_company: company }),
    db.schema('api').rpc('wa_consent_wording'),
  ]);
  if (error) {
    if (error.code === '42501') return null;
    throw new Error(error.message);
  }
  const w = (wording.data ?? null) as { en?: string | null; ur?: string | null } | null;
  return { ...(data as unknown as MyWhatsapp), wording: { en: w?.en ?? null, ur: w?.ur ?? null } };
}

/** one business for staff; null when the person's limits do not include WhatsApp (out ≥ 1 or biz ≥ 1) */
export async function loadStaffWhatsapp(company: string): Promise<StaffWhatsapp | null> {
  const { data, error } = await (await createClient()).schema('api').rpc('wa_member_whatsapp', { p_company: company });
  if (error) {
    if (error.code === '42501') return null;
    throw new Error(error.message);
  }
  return data as unknown as StaffWhatsapp;
}

export type RegisterWhatsapp = Record<string, { status: WaStatus; verified: boolean; categories: string[] }>;

/** the register's WhatsApp column; null when the person's limits do not include it */
export async function loadRegisterWhatsapp(): Promise<RegisterWhatsapp | null> {
  const { data, error } = await (await createClient()).schema('api').rpc('wa_register_status');
  if (error) {
    if (error.code === '42501') return null;
    throw new Error(error.message);
  }
  return (data ?? {}) as unknown as RegisterWhatsapp;
}
