import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/** Removes one published file. Called only after the database has checked who is asking and removed the record. */
export async function removePublishedFile(path: string): Promise<void> {
  const { error } = await createAdminClient().storage.from('site-media').remove([path]);
  if (error) console.error('published file not removed');
}
