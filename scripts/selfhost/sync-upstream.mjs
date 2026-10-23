#!/usr/bin/env node
// Verifies (and, into a NEW directory only, exports) the upstream self-hosted Supabase configuration pinned in
// deploy/selfhost/UPSTREAM.json. It never overwrites files.
//
//   node scripts/selfhost/sync-upstream.mjs --offline [--dir <path>] [--require-tracked]
//        NO network: compares <path> (default deploy/selfhost/upstream) with UPSTREAM.json — every file's content
//        (git blob hash), no missing or unexpected files (e.g. upstream/.env), the separately recorded LICENSE, and the
//        expected file modes from the git index for tracked files. Untracked files are reported as "mode not
//        verified"; --require-tracked makes that a failure (use it after committing, e.g. in CI).
//   node scripts/selfhost/sync-upstream.mjs [--dir <path>]          same content check against GitHub (gh api) + pin drift
//   node scripts/selfhost/sync-upstream.mjs --ref <tag|sha>         report what a newer upstream ref changes (read-only)
//   node scripts/selfhost/sync-upstream.mjs --export <dir>          write the pinned tree + LICENSE into a NEW <dir>
//
// Exit codes: 0 verified, 1 differences found, 2 usage or environment error.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PIN_FILE = join(ROOT, 'deploy/selfhost/UPSTREAM.json');
const VENDOR_DIR = join(ROOT, 'deploy/selfhost/upstream');
const MODES = new Set(['100644', '100755']);

function usage(message) {
  console.error(`sync-upstream: ${message}`);
  console.error(
    'usage: sync-upstream.mjs [--offline] [--dir <path>] [--require-tracked] | --ref <tag|sha> | --export <dir>',
  );
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { offline: false, requireTracked: false, dir: VENDOR_DIR, ref: undefined, exportDir: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined || v === '' || v.startsWith('--')) usage(`${a} needs a value`);
      return v;
    };
    if (a === '--offline') opts.offline = true;
    else if (a === '--require-tracked') opts.requireTracked = true;
    else if (a === '--dir') opts.dir = resolve(value());
    else if (a === '--ref') opts.ref = value();
    else if (a === '--export') opts.exportDir = value();
    else usage(`unknown argument: ${a}`);
  }
  if (opts.exportDir && (opts.offline || opts.ref || opts.requireTracked))
    usage('--export cannot be combined with other modes');
  if (opts.ref && opts.offline) usage('--ref needs the network; it cannot be combined with --offline');
  if (opts.requireTracked && !opts.offline) usage('--require-tracked is an --offline option');
  return opts;
}

const blobSha = (bytes) =>
  createHash('sha1')
    .update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes]))
    .digest('hex');

function readPin() {
  if (!existsSync(PIN_FILE)) usage(`missing ${relative(ROOT, PIN_FILE)}`);
  const pin = JSON.parse(readFileSync(PIN_FILE, 'utf8'));
  const problems = [];
  if (!/^[0-9a-f]{40}$/.test(pin.commit ?? '')) problems.push('commit');
  if (!Array.isArray(pin.files) || pin.files.length === 0) problems.push('files');
  if (!pin.license || !/^[0-9a-f]{40}$/.test(pin.license.sha ?? '')) problems.push('license');
  const seen = new Set();
  for (const f of pin.files ?? []) {
    if (!f.path || f.path.startsWith('/') || f.path.split('/').includes('..') || seen.has(f.path))
      problems.push(`path ${f.path}`);
    if (!MODES.has(f.mode) || !/^[0-9a-f]{40}$/.test(f.sha ?? '')) problems.push(`entry ${f.path}`);
    if ((pin.exclude ?? []).some((x) => f.path.startsWith(x))) problems.push(`excluded path recorded ${f.path}`);
    seen.add(f.path);
  }
  if (seen.has(pin.license?.path ?? 'LICENSE')) problems.push('LICENSE listed twice');
  if (problems.length) usage(`UPSTREAM.json is malformed: ${problems.slice(0, 5).join(', ')}`);
  return { ...pin, license: { path: 'LICENSE', mode: '100644', ...pin.license } };
}

const gh = (path) => {
  try {
    return execFileSync('gh', ['api', path], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    console.error(`gh api ${path} failed: ${String(e.stderr ?? e.message).trim()}`);
    process.exit(2);
  }
};
const ghJson = (path) => JSON.parse(gh(path));

/** Resolves a tag (annotated or lightweight) or commit sha to a commit sha. */
function resolveCommit(repo, ref) {
  if (/^[0-9a-f]{40}$/.test(ref)) return ref;
  let obj = ghJson(`repos/${repo}/git/ref/tags/${ref}`).object;
  while (obj.type === 'tag') obj = ghJson(`repos/${repo}/git/tags/${obj.sha}`).object;
  if (obj.type !== 'commit') throw new Error(`${ref} does not point to a commit (${obj.type})`);
  return obj.sha;
}

/** The subtree's files at a commit: [{ path, mode, sha }] relative to the subtree, excluded folders removed. */
function upstreamFiles(repo, commit, subtree, exclude) {
  const rootTree = ghJson(`repos/${repo}/git/commits/${commit}`).tree.sha;
  const top = ghJson(`repos/${repo}/git/trees/${rootTree}`).tree;
  const sub = top.find((e) => e.path === subtree && e.type === 'tree');
  if (!sub) throw new Error(`${subtree}/ not found at ${commit}`);
  const listing = ghJson(`repos/${repo}/git/trees/${sub.sha}?recursive=1`);
  if (listing.truncated) throw new Error('upstream tree listing was truncated');
  const files = listing.tree
    .filter((e) => e.type === 'blob' && !exclude.some((x) => e.path.startsWith(x)))
    .map(({ path, mode, sha }) => ({ path, mode, sha }));
  const lic = top.find((e) => e.path === 'LICENSE');
  return { subtreeSha: sub.sha, files, license: lic && { path: 'LICENSE', mode: lic.mode, sha: lic.sha } };
}

function localFiles(dir) {
  const out = new Map();
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else out.set(relative(dir, p).split(sep).join('/'), blobSha(readFileSync(p)));
    }
  };
  if (!existsSync(dir)) usage(`no such directory: ${dir}`);
  walk(dir);
  return out;
}

/** Git index entries under dir: Map(path relative to dir -> { mode, sha }). Empty when dir is not in a repository. */
function indexEntries(dir) {
  let out;
  try {
    out = execFileSync('git', ['-C', dir, 'ls-files', '--stage', '-z', '--', '.'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch {
    return new Map();
  }
  const entries = new Map();
  for (const rec of out.split('\0').filter(Boolean)) {
    const [meta, path] = rec.split('\t');
    const [mode, sha] = meta.split(' ');
    entries.set(path, { mode, sha });
  }
  return entries;
}

/** expected: [{path, sha, mode?}], actual: Map(path -> sha | {sha, mode}). */
function compare(expected, actual, { modes = false } = {}) {
  const changed = [];
  const missing = [];
  const modeDiffs = [];
  for (const f of expected) {
    const a = actual.get(f.path);
    if (a === undefined) missing.push(f.path);
    else {
      const sha = typeof a === 'string' ? a : a.sha;
      if (sha !== f.sha) changed.push(f.path);
      if (modes && typeof a !== 'string' && a.mode !== f.mode)
        modeDiffs.push(`${f.path} (${a.mode}, expected ${f.mode})`);
    }
  }
  const known = new Set(expected.map((f) => f.path));
  const extra = [...actual.keys()].filter((p) => !known.has(p));
  return { changed, missing, extra, modeDiffs };
}

function report(title, { changed, missing, extra, modeDiffs = [] }) {
  const n = changed.length + missing.length + extra.length + modeDiffs.length;
  console.log(`${title}: ${n === 0 ? 'identical' : `${n} difference(s)`}`);
  for (const p of changed) console.log(`  changed  ${p}`);
  for (const p of missing) console.log(`  missing  ${p}`);
  for (const p of extra) console.log(`  extra    ${p}`);
  for (const p of modeDiffs) console.log(`  mode     ${p}`);
  return n;
}

const opts = parseArgs(process.argv.slice(2));
const pin = readPin();
const expectedAll = [...pin.files, pin.license];

if (opts.offline) {
  const dirLabel = relative(ROOT, opts.dir) || '.';
  let failures = report(
    `${dirLabel} vs UPSTREAM.json (${pin.tag} ${pin.commit.slice(0, 12)}), offline`,
    compare(expectedAll, localFiles(opts.dir)),
  );
  const index = indexEntries(opts.dir);
  const tracked = expectedAll.filter((f) => index.has(f.path));
  const untracked = expectedAll.length - tracked.length;
  const idx = compare(tracked, new Map(tracked.map((f) => [f.path, index.get(f.path)])), { modes: true });
  failures += report(`git index for ${tracked.length} tracked file(s): content and mode`, { ...idx, extra: [] });
  console.log(
    untracked === 0
      ? `modes: all ${expectedAll.length} verified from the git index`
      : `modes: ${tracked.length} verified from the git index, ${untracked} NOT verified (untracked; expected modes are in UPSTREAM.json)`,
  );
  if (opts.requireTracked && untracked > 0) {
    console.log(`--require-tracked: ${untracked} file(s) are not in the git index`);
    failures += untracked;
  }
  process.exit(failures ? 1 : 0);
}

if (opts.exportDir) {
  const target = resolve(opts.exportDir);
  if (existsSync(target)) usage(`refusing to export into an existing path: ${target}`);
  const commit = resolveCommit(pin.repo, pin.tag);
  if (commit !== pin.commit) usage(`tag ${pin.tag} now points to ${commit}, not the pinned ${pin.commit}`);
  const { subtreeSha, files, license } = upstreamFiles(pin.repo, commit, pin.subtree, pin.exclude);
  for (const f of [...files, ...(license ? [license] : [])]) {
    const bytes = Buffer.from(ghJson(`repos/${pin.repo}/git/blobs/${f.sha}`).content, 'base64');
    if (blobSha(bytes) !== f.sha) throw new Error(`hash mismatch for ${f.path}`);
    mkdirSync(dirname(join(target, f.path)), { recursive: true });
    writeFileSync(join(target, f.path), bytes);
  }
  console.log(
    `exported ${files.length} files + LICENSE from ${pin.repo}@${commit} (${pin.subtree}/ tree ${subtreeSha})`,
  );
  process.exit(0);
}

const ref = opts.ref ?? pin.tag;
const commit = resolveCommit(pin.repo, ref);
if (ref === pin.tag && commit !== pin.commit) {
  console.error(
    `tag ${pin.tag} now points to ${commit}, not the pinned ${pin.commit} — investigate before trusting it`,
  );
  process.exit(1);
}
const upstream = upstreamFiles(pin.repo, commit, pin.subtree, pin.exclude);
const expected = [...upstream.files, ...(upstream.license ? [upstream.license] : [])];
console.log(
  `upstream ${pin.repo} ${ref} -> ${commit} (${pin.subtree}/ tree ${upstream.subtreeSha}, ${expected.length} files)`,
);
const local = localFiles(opts.dir);

if (ref === pin.tag) {
  let failures = report(`${relative(ROOT, opts.dir)} vs pinned ${pin.tag}`, compare(expected, local));
  const recorded = new Map(expectedAll.map((f) => [f.path, { sha: f.sha, mode: f.mode }]));
  failures += report(
    'UPSTREAM.json (content and mode) vs pinned upstream',
    compare(expected, recorded, { modes: true }),
  );
  process.exit(failures ? 1 : 0);
} else {
  report(
    `upstream changes ${pin.tag} -> ${ref}`,
    compare(expected, new Map(expectedAll.map((f) => [f.path, { sha: f.sha, mode: f.mode }])), { modes: true }),
  );
  report(`local edits vs pinned ${pin.tag}`, compare(expectedAll, local));
  console.log('Read-only report: nothing was written. To adopt a new ref, export it into a new directory and review.');
}
