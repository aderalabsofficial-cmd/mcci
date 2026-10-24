#!/usr/bin/env node
// T-B1 (docs/17 §3, §11): scans what reaches browsers and what is committed for secrets, privileged configuration and
// internal addresses. Prints file paths, rule names and counts only — never a matched value.
//   pnpm build && node scripts/security/scan-client-bundle.mjs          (exit 1 on any finding)
//
// client  = .next/static/** (every JS/CSS/JSON chunk shipped to browsers) + public/**
// tracked = every file in `git ls-files` (secret VALUES only; names in docs and tests are expected there)
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SECRET_ENV_NAMES = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SMTP_USER',
  'SUPABASE_SECRET_KEY',
  'SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'POSTGRES_PASSWORD',
  'DASHBOARD_PASSWORD',
  'OPENAI_API_KEY',
  'SMTP_PASS',
  'RESEND_API_KEY',
  'CRON_SECRET',
  'FCM_SERVICE_ACCOUNT_JSON',
  'VAULT_ENC_KEY',
  'PG_META_CRYPTO_KEY',
  'S3_PROTOCOL_ACCESS_KEY_SECRET',
];

// Patterns for secret VALUES (apply to the client bundle and to tracked files)
const VALUE_RULES = [
  ['supabase secret key', /sb_secret_[A-Za-z0-9_-]{16,}/g],
  ['private key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  ['OpenAI key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/g],
  ['AWS access key id', /\bAKIA[0-9A-Z]{16}\b/g],
  ['Resend key', /\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}/g],
];
const JWT = /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{16,}/g;

// Only in the client bundle: names of server-only secrets and addresses browsers must never be pointed at
const CLIENT_RULES = [
  ['server-only secret env name', new RegExp(`\\b(?:${SECRET_ENV_NAMES.join('|')})\\b`, 'g')],
  [
    'loopback gateway / database address',
    /\b(?:127\.0\.0\.1|localhost):(?:18000|15432|5432|6543|54321|54322|8000|3000\/pg)\b/g,
  ],
  [
    'internal Compose host',
    /\bhttps?:\/\/(?:kong|auth|rest|realtime|storage|meta|studio|db|supavisor|api-gw|imgproxy|functions)(?::\d+)?\//g,
  ],
  ['database connection string', /\bpostgres(?:ql)?:\/\/[^\s"'`]+/g],
  ['admin route', /\/(?:pg|api\/mcp|mcp)\/[a-z]/g],
];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** JWTs whose payload claims a privileged role (service_role / supabase_admin) — anon tokens are public by design. */
function privilegedJwts(text) {
  let n = 0;
  for (const m of text.matchAll(JWT)) {
    try {
      const claims = JSON.parse(Buffer.from(m[0].split('.')[1], 'base64url').toString('utf8'));
      if (['service_role', 'supabase_admin', 'postgres'].includes(claims.role)) n++;
    } catch {
      /* not a JWT payload */
    }
  }
  return n;
}

function scan(files, rules) {
  const findings = [];
  for (const f of files) {
    const buf = readFileSync(f);
    if (buf.includes(0)) continue; // binary
    const text = buf.toString('utf8');
    for (const [rule, re] of rules) {
      const n = [...text.matchAll(re)].length;
      if (n) findings.push({ file: f, rule, n });
    }
    const jwt = privilegedJwts(text);
    if (jwt) findings.push({ file: f, rule: 'privileged JWT (service_role)', n: jwt });
  }
  return findings;
}

const report = (title, files, findings) => {
  console.log(`${title}: ${files.length} files scanned, ${findings.length} finding(s)`);
  for (const x of findings) console.log(`  ${x.rule}: ${x.file} (${x.n})`);
};

const nextStatic = walk('.next/static');
if (nextStatic.length === 0) {
  console.error('no .next/static output: run `pnpm build` first (the scan must not pass without a bundle)');
  process.exit(2);
}
const client = [...nextStatic, ...walk('public')];
const clientFindings = scan(client, [...VALUE_RULES, ...CLIENT_RULES]);
report('client bundle (.next/static + public)', client, clientFindings);

const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter((f) => f && existsSync(f) && statSync(f).size < 5_000_000);
const trackedFindings = scan(tracked, VALUE_RULES);
report('tracked files (secret values)', tracked, trackedFindings);

process.exit(clientFindings.length + trackedFindings.length > 0 ? 1 : 0);
