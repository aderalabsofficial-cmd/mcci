#!/usr/bin/env node
// Demo accounts for the owner's end-to-end test of the whole flow (owner, 4 Nov 2026; migration 0660). Runs ON THE
// SERVER from the release directory, by the owner:
//
//   cd /opt/mcci-web/current
//   node --env-file=/etc/mcci-web/env scripts/ops/demo-accounts.mjs              # dry run: what would be made
//   node --env-file=/etc/mcci-web/env scripts/ops/demo-accounts.mjs --apply      # make them; passwords shown ONCE
//   node --env-file=/etc/mcci-web/env scripts/ops/demo-accounts.mjs --remove     # deactivate staff, block sign-in,
//                                                                                 # then prints the purge command
//
// Every account is confirmed already (no email needed) and has an address at DEMO_DOMAIN (default demo.mcci.test),
// which never receives mail. The passwords are generated here and printed only to this terminal; they are not stored
// anywhere else (write them down, or run --remove and --apply again for new ones). Staff still set up their 2-step
// sign-in (an authenticator app) at their first staff sign-in: that protection is not switched off for demo staff.
// A designation that does not exist (e.g. Vice President) is skipped and reported: MCCI creates it, with its
// permissions, in Staff & Audit, then this is run again.
import { randomInt } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const mode = args.includes('--apply') ? 'apply' : args.includes('--remove') ? 'remove' : 'dry';
const domain = (process.env.DEMO_DOMAIN || 'demo.mcci.test').toLowerCase();
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
  console.error('DEMO_DOMAIN is not a domain');
  process.exit(2);
}
const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('SUPABASE_INTERNAL_URL / SUPABASE_SECRET_KEY missing (run with --env-file=/etc/mcci-web/env)');
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// who is made: the applicant, a proposer and a seconder in each class (they must share the applicant's class), staff
const ACCOUNTS = [
  { local: 'applicant', name: 'Demo Applicant', company: { name: 'Applicant Test Company' } },
  {
    local: 'proposer.corporate',
    name: 'Demo Proposer (Corporate)',
    company: { name: 'Proposer Corporate', class: 'Corporate' },
  },
  {
    local: 'seconder.corporate',
    name: 'Demo Seconder (Corporate)',
    company: { name: 'Seconder Corporate', class: 'Corporate' },
  },
  {
    local: 'proposer.associate',
    name: 'Demo Proposer (Associate)',
    company: { name: 'Proposer Associate', class: 'Associate' },
  },
  {
    local: 'seconder.associate',
    name: 'Demo Seconder (Associate)',
    company: { name: 'Seconder Associate', class: 'Associate' },
  },
  { local: 'accounts', name: 'Demo Accounts Officer', designation: 'Accounts Officer' },
  { local: 'it.convener', name: 'Demo IT Convener', designation: 'IT Convener' },
  { local: 'president', name: 'Demo President', designation: 'President (Signatory)' },
  { local: 'vice.president', name: 'Demo Vice President', designation: 'Vice President' },
  { local: 'membership.officer', name: 'Demo Membership Officer', designation: 'Membership Officer' },
  { local: 'assistant.secretary', name: 'Demo Assistant Secretary', designation: 'Assistant Secretary' },
  { local: 'committee.convener', name: 'Demo Committee Convener', designation: 'Membership Committee Convener' },
].map((a) => ({ ...a, email: `demo.${a.local}@${domain}` }));

// 14 characters, no look-alikes (0/O, 1/l/I), at least one of each kind
function password() {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '@#%+=?'];
  const all = sets.join('');
  const chars = sets.map((s) => s[randomInt(s.length)]);
  while (chars.length < 14) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

async function existing() {
  const found = new Map();
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const u of data.users)
      if (u.email?.toLowerCase().endsWith(`@${domain}`)) found.set(u.email.toLowerCase(), u.id);
    if (data.users.length < 200) break;
  }
  return found;
}

// ends by returning (not process.exit, which can crash Node on Windows right after network calls)
async function main() {
  const have = await existing();

  if (mode === 'remove') {
    const ids = [...have.values()];
    if (!ids.length) {
      console.log(`no demo accounts at @${domain}`);
      return 0;
    }
    const { data: companies, error } = await db.schema('api').rpc('demo_accounts_remove', { p_users: ids });
    if (error) {
      console.error(`refused: ${error.message}`);
      return 1;
    }
    // no one signs in with them again; the purge below deletes the member accounts with their companies
    for (const id of ids) await db.auth.admin.updateUserById(id, { ban_duration: '876000h' });
    console.log(
      `${ids.length} demo accounts can no longer sign in; demo staff rows deactivated (kept for the audit log).`,
    );
    if (companies?.length) {
      console.log('\nNow remove their demo companies, applications and files (take and verify a backup first):');
      console.log(`  node --env-file=/etc/mcci-web/env scripts/ops/demo-purge.mjs --companies ${companies.join(',')}`);
      console.log(
        `  node --env-file=/etc/mcci-web/env scripts/ops/demo-purge.mjs --companies ${companies.join(',')} --apply`,
      );
    }
    return 0;
  }

  if (mode === 'dry') {
    console.log(`Dry run: these accounts would be made at @${domain} (run with --apply to make them):\n`);
    for (const a of ACCOUNTS)
      console.log(
        `  ${a.designation ? `staff · ${a.designation}` : a.company.class ? `member · ${a.company.class}` : 'applicant'}`.padEnd(
          46,
        ) +
          a.email +
          (have.has(a.email) ? '  (exists already, kept)' : ''),
      );
    return 0;
  }

  // apply: sign-in accounts first (confirmed, no email), then their staff rows and demo companies in one database call
  const made = [];
  for (const a of ACCOUNTS) {
    const pw = password();
    if (have.has(a.email)) {
      // made before (perhaps removed since): signs in again, with a new password shown now
      const id = have.get(a.email);
      const { error } = await db.auth.admin.updateUserById(id, { password: pw, ban_duration: 'none' });
      if (error) {
        console.error(`${a.email}: not updated (${error.message})`);
        continue;
      }
      made.push({ ...a, id, password: pw });
      continue;
    }
    const { data, error } = await db.auth.admin.createUser({
      email: a.email,
      password: pw,
      email_confirm: true,
      user_metadata: { full_name: a.name, mcci_demo: true },
    });
    if (error) {
      console.error(`${a.email}: not made (${error.message})`);
      continue;
    }
    made.push({ ...a, id: data.user.id, password: pw, fresh: true });
  }
  const fresh = made.filter((a) => a.fresh);
  const { data: result, error } = await db.schema('api').rpc('demo_accounts_setup', {
    p: {
      // staff rows for all (a removed one is active again); demo companies only for new accounts
      staff: made.filter((a) => a.designation).map((a) => ({ user: a.id, designation: a.designation })),
      companies: fresh
        .filter((a) => a.company)
        .map((a) => ({ user: a.id, company: a.company.name, class: a.company.class ?? null, rep: a.name })),
    },
  });
  if (error) {
    console.error(`database refused: ${error.message}`);
    return 1;
  }
  const skipped = new Map((result ?? []).filter((r) => r.skipped).map((r) => [r.user, r.skipped]));
  // an account whose designation does not exist would sign in as nobody: it is not kept (made again on a later run)
  for (const id of skipped.keys()) await db.auth.admin.deleteUser(id);

  const staffPath = process.env.STAFF_LOGIN_PATH || '/staff-login';
  console.log('\nDemo accounts (passwords are shown only now):\n');
  for (const a of made) {
    const role = a.designation
      ? `staff · ${a.designation}`
      : a.company.class
        ? `member · ${a.company.class}`
        : 'applicant';
    if (skipped.has(a.id)) {
      console.log(
        `  ${role.padEnd(44)} ${a.email.padEnd(44)} SKIPPED: ${skipped.get(a.id)} (create it in Staff & Audit, run --apply again)`,
      );
      continue;
    }
    console.log(`  ${role.padEnd(44)} ${a.email.padEnd(44)} ${a.password}`);
  }
  console.log(
    `\nMembers and the applicant sign in at /login; staff at ${staffPath} and set up their 2-step sign-in first.`,
  );
  return 0;
}
process.exitCode = await main();
