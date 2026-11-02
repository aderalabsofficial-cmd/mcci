'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { removePublishedFile } from '@/lib/content/admin/storage';
import { createClient } from '@/lib/supabase/server';

/** content.media.remove: the record goes first (audited), then the published file */
export async function removeContentMedia(locale: Locale, id: string): Promise<{ ok: boolean; message: string }> {
  try {
    await requirePermission('eng', 2);
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('content_media_remove', { p_id: z.string().uuid().parse(id) });
    if (error) throw error;
    if (data) await removePublishedFile(data);
    revalidatePath('/[locale]/admin/content', 'page');
    revalidatePath('/[locale]/(site)/news', 'page');
    return { ok: true, message: msg(locale, 'eng.media.removed') };
  } catch (error) {
    if (error instanceof PermissionError) return { ok: false, message: msg(locale, 'access.errors.notAllowed') };
    console.error('content media remove failed');
    return { ok: false, message: msg(locale, 'eng.media.failed') };
  }
}
