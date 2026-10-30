#!/usr/bin/env node
// Launch cleanup of named demo companies (migration 0530, docs/20). Runs ON THE SERVER from the release directory:
//
//   cd /opt/mcci-web/current
//   node --env-file=/etc/mcci-web/env scripts/ops/demo-purge.mjs --companies <id,id,…>            # dry run
//   node --env-file=/etc/mcci-web/env scripts/ops/demo-purge.mjs --companies <id,id,…> --apply    # deletes
//
// 1. api.demo_purge(companies, apply): refuses non-demo companies and any dependency from a record that stays; with
//    --apply deletes the rows in one transaction (audited, audit_log kept).
// 2. with --apply: removes every stored file under <company id>/ in every bucket, then the sign-in accounts that
//    belonged only to these companies (never staff, never anyone with another company).
// Prints counts and ids only — no names, emails or file contents. Take and verify a backup first.
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const i = args.indexOf('--companies');
const companies = (i >= 0 ? (args[i + 1] ?? '') : '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
if (!companies.length || companies.some((c) => !UUID.test(c))) {
  console.error('usage: demo-purge.mjs --companies <uuid,uuid,…> [--apply]');
  process.exit(2);
}
const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('SUPABASE_INTERNAL_URL / SUPABASE_SECRET_KEY missing (run with --env-file=/etc/mcci-web/env)');
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data, error } = await db.schema('api').rpc('demo_purge', { p_companies: companies, p_apply: apply });
if (error) {
  console.error(`refused: ${error.message}`);
  process.exit(1);
}
const users = data.filter((r) => r.kind === 'user').map((r) => r.item);
console.log(apply ? '== APPLIED (database)' : '== DRY RUN (nothing changed)');
for (const r of data.filter((r) => r.kind === 'rows')) console.log(`  ${String(r.n).padStart(5)}  ${r.item}`);
console.log(`  accounts: ${users.join(', ') || 'none'}`);

// stored files under <company>/ in each bucket (storage lists one level at a time)
const { data: buckets, error: be } = await db.storage.listBuckets();
if (be) throw new Error(`listing buckets failed: ${be.message}`);
async function filesUnder(bucket, prefix) {
  const out = [];
  const queue = [prefix];
  while (queue.length) {
    const path = queue.shift();
    const { data: items, error: le } = await db.storage.from(bucket).list(path, { limit: 1000 });
    if (le) throw new Error(`listing ${bucket}/${path} failed: ${le.message}`);
    for (const it of items ?? []) (it.id ? out : queue).push(`${path}/${it.name}`);
  }
  return out;
}
let files = 0;
for (const b of buckets) {
  for (const c of companies) {
    const list = await filesUnder(b.id, c);
    if (!list.length) continue;
    console.log(`  files: ${b.id}/${c}/ ${list.length}`);
    if (!apply) continue;
    for (let k = 0; k < list.length; k += 100) {
      const { error: re } = await db.storage.from(b.id).remove(list.slice(k, k + 100));
      if (re) throw new Error(`removing files in ${b.id} failed: ${re.message}`);
    }
    files += list.length;
  }
}
if (!apply) process.exit(0);

let accounts = 0;
for (const u of users) {
  const { error: ue } = await db.auth.admin.deleteUser(u);
  if (ue && !/not.?found/i.test(ue.message)) throw new Error(`removing account ${u} failed: ${ue.message}`);
  accounts++;
}
console.log(`== done: ${files} files and ${accounts} accounts removed`);
