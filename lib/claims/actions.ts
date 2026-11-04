'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * claim.approve / claim.reject (migration 0680): an existing member who signed up asks to be linked to their membership.
 * Staff of the Members Register (reg ≥ 2) approve, which makes the account a user of the member's company in the chosen
 * role, or reject with a reason. The database checks again, audits, and tells the person in their portal.
 */
export interface ClaimResult {
  ok: boolean;
  message: string;
}

const decision = z.object({
  id: z.string().uuid(),
  approve: z.boolean(),
  member: z.string().uuid().nullable(),
  role: z.enum(['Owner', 'Manager', 'Services', 'Accounts', 'Viewer']),
  note: z.string().trim().max(1000),
});

export async function decideClaim(
  locale: Locale,
  input: { id: string; approve: boolean; member: string | null; role: string; note: string },
): Promise<ClaimResult> {
  const t = (k: string) => msg(locale, `claims.${k}`);
  try {
    await requirePermission('reg', 2);
    const d = decision.parse(input);
    if (!d.approve && d.note.length < 3) return { ok: false, message: t('errors.reason_required') };
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('claim_decide', {
      p_id: d.id,
      p_approve: d.approve,
      p_member: d.member ?? undefined,
      p_role: d.role,
      p_note: d.note,
    });
    if (error) throw error;
    revalidatePath('/[locale]/admin/members', 'page');
    return { ok: true, message: t(d.approve ? 'done.approved' : 'done.rejected') };
  } catch (error) {
    if (error instanceof PermissionError) return { ok: false, message: t('errors.notAllowed') };
    if (error instanceof z.ZodError) return { ok: false, message: t('errors.fields') };
    const e = error as { code?: string; hint?: string; message?: string };
    if (e?.code === '42501') return { ok: false, message: t('errors.notAllowed') };
    if (e?.code === 'P0001' && ['wrong_stage', 'not_found', 'linked', 'reason_required'].includes(e.hint ?? ''))
      return { ok: false, message: t(`errors.${e.hint}`) };
    console.error('claim.decide failed', e?.code, e?.message);
    return { ok: false, message: t('errors.generic') };
  }
}
