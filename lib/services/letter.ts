import 'server-only';
import type { LetterData } from '@/components/services/letter';
import { loadRequest } from '@/lib/services/load';
import { createClient } from '@/lib/supabase/server';

/** the issued letter of one request, as the person may read it (member company or staff, RLS) */
export async function loadLetter(token: string, userId: string): Promise<LetterData | null> {
  const r = await loadRequest(token, userId);
  if (!r || r.status !== 'Issued' || !r.doc) return null;
  const supabase = await createClient();
  const { data: t } = await supabase.from('service_types').select('name_en, full_name_en, fields').eq('key', r.service_key).single();
  const fields = ((t?.fields ?? []) as string[]).map((f): [string, string] => [f, r.data[f] ?? '']);
  const signed = [...r.history].reverse().find((h) => h.step === 'signed and issued');
  return {
    code: r.doc.code,
    status: r.doc.status,
    token: r.token,
    service_key: r.service_key,
    service_name: t?.full_name_en || t?.name_en || r.service_key,
    company: r.company,
    member_no: r.member?.member_no ?? '',
    member_status: r.member?.status ?? 'Permanent',
    issued_at: r.issued_at ?? r.doc.created_at,
    fields,
    signed_by: signed?.by_name ?? null,
  };
}
