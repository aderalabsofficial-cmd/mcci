'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * The QR registry (action qr.revoke — docs ≥ 3; docs/06). Temporary membership is abolished (0440): its issue /
 * extend / revoke actions are gone. The api.* function checks again and writes the audit.
 */

export interface TempResult {
  ok: boolean;
  message: string;
}

const reason = z.string().trim().min(3).max(500);
const refresh = () => {
  for (const p of ['admin/temp', 'admin/documents', 'admin', 'admin/payments', 'portal', 'portal/documents', 'portal/membership'])
    revalidatePath(`/[locale]/${p}`, 'page');
};

function fail(locale: Locale, error: unknown, what: string): TempResult {
  const t = (k: string) => msg(locale, `temp.errors.${k}`);
  if (error instanceof PermissionError) return { ok: false, message: t('notAllowed') };
  const e = error as { code?: string; hint?: string; message?: string };
  if (e?.code === '42501') return { ok: false, message: t('notAllowed') };
  const known = ['reason_required', 'wrong_status', 'max_extensions', 'wrong_stage', 'not_paid', 'not_found'];
  if (e?.code === 'P0001' && e.hint && known.includes(e.hint)) return { ok: false, message: t(e.hint) };
  console.error(`${what} failed`, e?.code, e?.message);
  return { ok: false, message: t('generic') };
}

export async function revokeDocument(locale: Locale, code: string, why: string): Promise<TempResult> {
  try {
    await requirePermission('docs', 3);
    const text = reason.safeParse(why);
    if (!text.success) return { ok: false, message: msg(locale, 'temp.errors.reason_required') };
    const supabase = await createClient();
    const { error } = await supabase
      .schema('api')
      .rpc('qr_revoke', { p_code: z.string().regex(/^MCCI-QR-[A-Z0-9]{5}-[A-Z0-9]{5}$/).parse(code), p_reason: text.data });
    if (error) throw error;
    refresh();
    return { ok: true, message: msg(locale, 'temp.done.docRevoked', { code }) };
  } catch (error) {
    return fail(locale, error, 'qr.revoke');
  }
}
