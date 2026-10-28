import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Service-role file steps for certificate scans (migration 0450): the bucket has no staff branch, so the scans are
 * stored and read here, always after the caller's permission check (requirePermission('temp', 2) in
 * lib/certificates/actions.ts) and with the record change made under the caller's own session.
 */
const BUCKET = 'certificates';

export async function storeScan(path: string, bytes: Uint8Array | Buffer, contentType: string): Promise<void> {
  const { error } = await createAdminClient().storage.from(BUCKET).upload(path, bytes, { contentType, upsert: false, cacheControl: '0' });
  if (error) throw error;
}

export async function replaceScan(path: string, bytes: Uint8Array | Buffer): Promise<void> {
  const { error } = await createAdminClient().storage.from(BUCKET).upload(path, bytes, { contentType: 'image/png', upsert: true, cacheControl: '0' });
  if (error) throw error;
}

export async function removeScan(path: string): Promise<void> {
  await createAdminClient().storage.from(BUCKET).remove([path]);
}

export async function readScan(path: string): Promise<Uint8Array> {
  const { data, error } = await createAdminClient().storage.from(BUCKET).download(path);
  if (error || !data) throw error ?? new Error('scan missing');
  return new Uint8Array(await data.arrayBuffer());
}
