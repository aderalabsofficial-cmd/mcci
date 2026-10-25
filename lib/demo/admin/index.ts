import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Demo-mode cleanup with the service role (migration 0350): after api.demo_clear has removed every demo row, this
 * deletes the stored files under the demo companies' folders and the demo sign-in accounts (only accounts linked to
 * nothing but demo companies and never staff — api.demo_clear decides which).
 */
const BUCKETS = ['application-docs', 'receipts', 'certificates', 'service-docs', 'form-snapshots'];

async function removeFolder(bucket: string, prefix: string): Promise<number> {
  const admin = createAdminClient();
  let removed = 0;
  // storage lists one level at a time: walk the tree under the company folder
  const walk = async (path: string): Promise<string[]> => {
    const { data } = await admin.storage.from(bucket).list(path, { limit: 1000 });
    const files: string[] = [];
    for (const item of data ?? []) {
      const full = `${path}/${item.name}`;
      if (item.id) files.push(full);
      else files.push(...(await walk(full)));
    }
    return files;
  };
  const files = await walk(prefix);
  for (let i = 0; i < files.length; i += 100) {
    const { data } = await admin.storage.from(bucket).remove(files.slice(i, i + 100));
    removed += data?.length ?? 0;
  }
  return removed;
}

export async function removeDemoLeftovers(companies: string[], users: string[]): Promise<{ files: number; accounts: number }> {
  const admin = createAdminClient();
  let files = 0;
  for (const c of companies) for (const b of BUCKETS) files += await removeFolder(b, c);
  let accounts = 0;
  for (const u of users) {
    const { error } = await admin.auth.admin.deleteUser(u);
    if (!error) accounts++;
    else console.error('demo account not removed', error.status);
  }
  return { files, accounts };
}
