#!/usr/bin/env node
// The owner's clean-up of their own test records before launch (owner, 4 Nov 2026; migration 0670). Runs ON THE
// SERVER from the release directory, by the owner, after a verified backup:
//
//   cd /opt/mcci-web/current
//   node --env-file=/etc/mcci-web/env scripts/ops/launch-cleanup.mjs                               # list candidates
//   node --env-file=/etc/mcci-web/env scripts/ops/launch-cleanup.mjs --companies <id,id,…>         # check them
//   node --env-file=/etc/mcci-web/env scripts/ops/launch-cleanup.mjs --companies <id,id,…> --apply # mark them demo
//
// Candidates are the companies that are not demo and have no member: the drafts of test applications and the
// sign-up accounts that never applied. The database refuses any company that holds a member, an application past
// draft, a payment voucher or a document. --apply only marks the chosen companies as demo; the removal itself is the
// tested demo purge, printed at the end to run next (dry run first). Certificates are not handled here: withdraw and
// delete them on the Certificates screen (Withdraw confirmation, Delete scan), which keeps the audit trail.
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const i = args.indexOf('--companies');
const companies = (i >= 0 ? (args[i + 1] ?? '') : '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
if (companies.some((c) => !UUID.test(c)) || (apply && !companies.length)) {
  console.error('usage: launch-cleanup.mjs [--companies <uuid,uuid,…> [--apply]]');
  process.exit(2);
}
const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('SUPABASE_INTERNAL_URL / SUPABASE_SECRET_KEY missing (run with --env-file=/etc/mcci-web/env)');
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const show = (rows) => {
  for (const r of rows)
    console.log(
      `  ${r.company_id}  ${(r.company ?? '').slice(0, 40).padEnd(40)}  applications: ${(r.drafts ?? '—').padEnd(36)}  accounts: ${r.accounts}` +
        (r.refused ? `   REFUSED: ${r.refused}` : ''),
    );
};

// ends by returning (not process.exit, which can crash Node on Windows right after network calls)
async function main() {
  if (!companies.length) {
    const { data, error } = await db.schema('api').rpc('launch_cleanup_candidates');
    if (error) {
      console.error(`refused: ${error.message}`);
      return 1;
    }
    console.log('Companies without a member (candidates). Pick the test ones and run with --companies:\n');
    show(data ?? []);
    return 0;
  }
  const { data, error } = await db.schema('api').rpc('launch_cleanup_mark', { p_companies: companies, p_apply: apply });
  if (error) {
    console.error(`refused: ${error.message}`);
    return 1;
  }
  show(data ?? []);
  if (!apply) {
    console.log('\nDry run: nothing changed. Run again with --apply to mark these for removal.');
    return 0;
  }
  console.log('\nMarked. Now remove them (dry run first, then --apply):');
  console.log(`  node --env-file=/etc/mcci-web/env scripts/ops/demo-purge.mjs --companies ${companies.join(',')}`);
  console.log(`  node --env-file=/etc/mcci-web/env scripts/ops/demo-purge.mjs --companies ${companies.join(',')} --apply`);
  return 0;
}
process.exitCode = await main();
