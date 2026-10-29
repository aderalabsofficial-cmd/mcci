'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/**
 * settings.save (admin/settings): one card of Platform Settings. Platform ≥ 2 (with the 2-step login); the database
 * (api.settings_save, migration 0510) checks the key, every field's type and range and audits the change with the reason.
 */
const KEYS = ['chamber', 'fees', 'sla', 'voucher', 'endorse', 'membership'] as const;
const input = z.object({
  key: z.enum(KEYS),
  value: z.record(z.string(), z.unknown()),
  reason: z.string().trim().max(300).optional(),
});

export async function saveSettings(
  localeIn: string,
  key: string,
  value: Record<string, unknown>,
  reason?: string,
): Promise<{ ok: boolean; message: string }> {
  const locale: Locale = asLocale(localeIn);
  try {
    const parsed = input.parse({ key, value, reason });
    await requirePermission('plat', 2);
    const supabase = await createClient();
    const { error } = await supabase.schema('api').rpc('settings_save', {
      p_key: parsed.key,
      p_value: parsed.value as never,
      ...(parsed.reason ? { p_reason: parsed.reason } : {}),
    });
    if (error) {
      const field = error.hint?.startsWith('invalid:') ? error.hint.slice(8) : null;
      if (error.code === '42501') return { ok: false, message: msg(locale, 'access.errors.notAllowed') };
      return {
        ok: false,
        message: field ? msg(locale, 'settings.errors.field', { f: field }) : msg(locale, 'settings.errors.invalid'),
      };
    }
    revalidatePath('/[locale]/admin/settings', 'page');
    return { ok: true, message: msg(locale, 'settings.saved') };
  } catch (error) {
    if (error instanceof PermissionError || error instanceof z.ZodError) {
      return { ok: false, message: msg(locale, 'access.errors.notAllowed') };
    }
    console.error('settings.save', error);
    return { ok: false, message: msg(locale, 'settings.errors.invalid') };
  }
}
