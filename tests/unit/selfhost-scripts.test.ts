import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Safety tests for scripts/selfhost (deploy/selfhost/README.md). Local only: temporary directories, a scratch git
 * repository, and a stub `docker` that records its arguments — the real Docker engine is never called (the compose
 * group aborts unless the stub is proven to be the `docker` the wrapper resolves), no network, no secrets generated.
 */
const ROOT = process.cwd();
const posix = (p: string) => p.replace(/\\/g, '/');
const LIB = posix(join(ROOT, 'scripts/selfhost/lib.sh'));

function findBash(): string | null {
  if (process.platform !== 'win32') return 'bash';
  try {
    const core = execFileSync('git', ['--exec-path'], { encoding: 'utf8' }).trim();
    const bash = resolve(core, '../../../bin/bash.exe'); // Git for Windows: <Git>/mingw64/libexec/git-core
    return existsSync(bash) ? bash : null;
  } catch {
    return null;
  }
}
const BASH = findBash();

type Env = NodeJS.ProcessEnv;

/** A clean child environment: no DOCKER_*, COMPOSE_*, GIT_* or MCCI_* leaking in from the developer's shell. */
function cleanEnv(extra: Record<string, string> = {}, prependPath?: string): Env {
  const env = {} as Env;
  for (const [k, v] of Object.entries(process.env)) {
    if (v === undefined || /^(DOCKER_|COMPOSE_|GIT_|MCCI_|PGPASSWORD$)/i.test(k)) continue;
    env[k] = v;
  }
  if (prependPath) {
    const key = Object.keys(env).find((k) => k.toUpperCase() === 'PATH') ?? 'PATH';
    env[key] = `${prependPath}${delimiter}${env[key] ?? ''}`;
  }
  return { ...env, ...extra };
}

function bash(args: string[], env: Env, input?: Buffer) {
  const r = spawnSync(BASH!, args, { env, input, encoding: 'buffer', cwd: ROOT });
  return { status: r.status, stdout: r.stdout?.toString() ?? '', stderr: r.stderr?.toString() ?? '' };
}

/** True when dir is inside any git working tree (the same rule lib.sh enforces). */
function insideGit(dir: string): boolean {
  try {
    execFileSync('git', ['-C', dir, 'rev-parse', '--is-inside-work-tree'], {
      env: cleanEnv({ GIT_DISCOVERY_ACROSS_FILESYSTEM: '1' }),
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}
// The scripts refuse any runtime directory inside a git working tree, so the temp base must be outside all of them.
// (On this developer machine the home folder is itself a repository, so %TEMP% is not eligible.) Only dummy,
// non-secret files are written there, and they are deleted afterwards.
const OUTSIDE_BASE = [tmpdir(), ...(process.platform === 'win32' ? ['C:/Users/Public'] : [])].find(
  (d) => existsSync(d) && !insideGit(d),
);
const tmpRoot = mkdtempSync(join(OUTSIDE_BASE ?? tmpdir(), 'mcci-selfhost-test-'));
const tmp = (name: string) => join(tmpRoot, name);
afterAll(() => rmSync(tmpRoot, { recursive: true, force: true }));

describe.skipIf(!BASH || !OUTSIDE_BASE)('selfhost lib.sh: runtime directory validation (H1)', () => {
  // The path travels in the environment (Windows command lines cannot carry every character, e.g. newlines).
  const check = (path: string, mode: 'new' | 'existing' = 'existing', extra: Record<string, string> = {}) =>
    bash(
      ['-c', '. "$1" && require_runtime "$2" && printf "OK %s" "$SELFHOST_RUNTIME"', '_', LIB, mode],
      cleanEnv({ ...extra, MCCI_SELFHOST_RUNTIME: path }),
    );
  const swapCase = (s: string) =>
    s.replace(/[a-z]/gi, (c) => (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()));

  it('accepts an existing directory outside every repository', () => {
    mkdirSync(tmp('outside'), { recursive: true });
    const r = check(tmp('outside'));
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toMatch(/^OK /);
  });

  it('creates a missing directory outside only in "new" mode, and only after validation', () => {
    expect(check(tmp('missing-a'), 'existing').stderr).toMatch(/does not exist/);
    expect(existsSync(tmp('missing-a'))).toBe(false);
    const r = check(join(tmp('missing-b'), 'nested'), 'new');
    expect(r.status, r.stderr).toBe(0);
    expect(existsSync(join(tmp('missing-b'), 'nested'))).toBe(true);
  });

  it('refuses the repository, its subdirectories and a not-yet-existing path inside it (nothing created)', () => {
    expect(check(ROOT).status).not.toBe(0);
    expect(check(join(ROOT, 'deploy')).status).not.toBe(0);
    const inside = join(ROOT, 'deploy', `zz-h1-runtime-${process.pid}`);
    const r = check(inside, 'new');
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/outside this repository|inside a git repository/);
    expect(existsSync(inside)).toBe(false);
  });

  it('refuses lower-case, mixed-case and (on Windows) backslash spellings of a path inside the repository', () => {
    for (const variant of [join(ROOT, 'deploy').toLowerCase(), swapCase(join(ROOT, 'deploy'))]) {
      const r = check(variant, 'new');
      expect(r.status, `${variant}: ${r.stdout}`).not.toBe(0);
    }
    if (process.platform === 'win32') expect(check(join(ROOT, 'deploy').replace(/\//g, '\\')).status).not.toBe(0);
  });

  it('refuses ".." and "." segments, relative paths, control characters, files and the file-system root', () => {
    expect(check(`${posix(tmp('outside'))}/../outside`).stderr).toMatch(/'\.' or '\.\.'/);
    expect(check(`${posix(tmp('outside'))}/./x`, 'new').stderr).toMatch(/'\.' or '\.\.'/);
    expect(check('relative/dir', 'new').stderr).toMatch(/absolute/);
    expect(check(`${posix(tmp('outside'))}/a\nb`, 'new').stderr).toMatch(/control characters/);
    writeFileSync(tmp('a-file'), 'x');
    expect(check(tmp('a-file')).stderr).toMatch(/not a directory/);
    expect(check('/').status).not.toBe(0);
  });

  it('refuses a directory inside any other git working tree, even with GIT_DIR / GIT_CEILING_DIRECTORIES set', () => {
    const repo = tmp('other-repo');
    mkdirSync(join(repo, 'sub'), { recursive: true });
    execFileSync('git', ['init', '-q', repo], { env: cleanEnv() });
    expect(check(join(repo, 'sub')).stderr).toMatch(/inside a git repository/);
    expect(check(join(repo, 'sub', 'new'), 'new').stderr).toMatch(/inside a git repository/);
    expect(existsSync(join(repo, 'sub', 'new'))).toBe(false);
    const hidden = check(join(repo, 'sub'), 'existing', {
      GIT_CEILING_DIRECTORIES: posix(repo),
      GIT_DIR: posix(join(tmp('outside'), 'nope')),
    });
    expect(hidden.stderr).toMatch(/inside a git repository/);
    // and GIT_DIR pointing at a real repository does not make an outside directory look inside
    expect(check(tmp('outside'), 'existing', { GIT_DIR: posix(join(ROOT, '.git')) }).status).toBe(0);
  });

  it('refuses a symlink / junction outside the repository that points into it', (ctx) => {
    const link = tmp('link-into-repo');
    try {
      symlinkSync(join(ROOT, 'deploy'), link, process.platform === 'win32' ? 'junction' : 'dir');
    } catch {
      ctx.skip(); // cannot create links here; reported as skipped, not passed
    }
    const r = check(link);
    expect(r.status, r.stdout).not.toBe(0);
    expect(r.stderr).toMatch(/outside this repository|inside a git repository/);
  });
});

describe.skipIf(!BASH || !OUTSIDE_BASE)('selfhost compose.sh: strict argument handling (M1)', () => {
  const runtime = tmp('compose-runtime');
  const stubDir = tmp('stub-bin');
  const log = posix(tmp('docker-args.log'));
  let env: Env;

  beforeAll(() => {
    mkdirSync(runtime, { recursive: true });
    writeFileSync(join(runtime, '.env'), readFileSync('deploy/selfhost/mcci/env.mcci.example')); // empty secrets
    mkdirSync(stubDir, { recursive: true });
    const stub = join(stubDir, 'docker');
    writeFileSync(
      stub,
      [
        '#!/bin/sh',
        ': > "$STUB_LOG"',
        'for a in "$@"; do printf "%s\\n" "$a" >> "$STUB_LOG"; done',
        'printf "POSTGRES_PASSWORD=%s\\nCOMPOSE_PROJECT_NAME=%s\\nCOMPOSE_FILE=%s\\n" "${POSTGRES_PASSWORD-<unset>}" "${COMPOSE_PROJECT_NAME-<unset>}" "${COMPOSE_FILE-<unset>}" > "$STUB_LOG.env"',
        'cat > "$STUB_LOG.stdin"',
        '',
      ].join('\n'),
    );
    chmodSync(stub, 0o755);
    env = cleanEnv({ MCCI_SELFHOST_RUNTIME: runtime, STUB_LOG: log }, stubDir);
    // Abort the group unless the wrapper would run the stub (never the real Docker engine).
    const which = bash(['-c', 'command -v docker'], env).stdout.trim();
    if (!which.endsWith('/docker') || !posix(which).toLowerCase().includes('stub-bin')) {
      throw new Error(`stub docker not first on PATH (got "${which}"); refusing to run wrapper tests`);
    }
  });

  const run = (args: string[], extra: Record<string, string> = {}) => {
    rmSync(log, { force: true });
    return bash([posix(join(ROOT, 'scripts/selfhost/compose.sh')), ...args], { ...env, ...extra });
  };
  const logged = () => readFileSync(log, 'utf8').trimEnd().split('\n');

  it.each([
    [[]],
    [['config']],
    [['config', '--environment']],
    [['config', '--services', '--environment']],
    [['config', '--quiet', '--environment']],
    [['config', '--quiet', '-o', 'out.yml']],
    [['config', '--format', 'json']],
    [['config', '--variables']],
    [['config', '--no-interpolate']],
    [['exec', 'db', 'env']],
    [['run', 'db', 'sh']],
    [['logs']],
    [['logs', 'auth']],
    [['top']],
    [['cp', 'db:/etc/passwd', '.']],
    [['attach', 'db']],
    [['-p', 'infra', 'down']],
    [['--project-name', 'infra', 'ps']],
    [['-f', 'other.yml', 'up']],
    [['--env-file', 'other.env', 'up']],
    [['--project-directory', '/tmp', 'up']],
    [['up', '-p', 'infra']],
    [['up', '--build']],
    [['up', '-dw']],
    [['up', '--wait-timeout']],
    [['up', '--wait-timeout', 'soon']],
    [['up', 'not-a-service']],
    [['down', '-v']],
    [['down', '--volumes']],
    [['down', '--rmi', 'all']],
    [['ps', '--format', 'json']],
    [['pull', '--policy', 'always']],
    [['version', 'extra']],
    [['psql-file']],
    [['psql-file', 'package.json']],
    [['psql-file', '../outside.sql']],
    [['psql-file', 'supabase/seed.sql', 'extra']],
    [['pg-dump', '--file', 'x']],
  ])('refuses %j before Docker runs', (args) => {
    const r = run(args);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/selfhost:/);
    expect(existsSync(log)).toBe(false);
  });

  it('refuses a .sql file outside supabase/ and remote engines (DOCKER_HOST / DOCKER_CONTEXT)', () => {
    writeFileSync(tmp('outside.sql'), 'select 1;');
    expect(run(['psql-file', tmp('outside.sql')]).stderr).toMatch(/under supabase\//);
    expect(run(['ps'], { DOCKER_HOST: 'tcp://10.0.0.1:2375' }).stderr).toMatch(/DOCKER_HOST/);
    expect(run(['ps'], { DOCKER_CONTEXT: 'remote' }).stderr).toMatch(/DOCKER_CONTEXT/);
    expect(existsSync(log)).toBe(false);
  });

  it.each([
    [
      ['config', '--quiet'],
      ['config', '--quiet'],
    ],
    [
      ['config', '--services'],
      ['config', '--services'],
    ],
    [
      ['pull', '-q'],
      ['pull', '-q'],
    ],
    [
      ['up', '-d', '--wait', '--wait-timeout', '120', 'db'],
      ['up', '-d', '--wait', '--wait-timeout', '120', 'db'],
    ],
    [
      ['ps', '-a'],
      ['ps', '-a'],
    ],
    [
      ['restart', 'auth'],
      ['restart', 'auth'],
    ],
    [
      ['down', '--remove-orphans'],
      ['down', '--remove-orphans'],
    ],
    [['version'], ['version']],
    [['pg-dump'], ['exec', '-T', 'db', 'pg_dump', '-U', 'postgres', '-Fc', 'postgres']],
  ])('accepts %j with the fixed project, files and runtime .env', (args, tail) => {
    const r = run(args);
    expect(r.status, r.stderr).toBe(0);
    const a = logged();
    expect(a.slice(0, 3)).toEqual(['compose', '--project-name', 'mcci-selfhost']);
    expect(a.filter((x) => x === '-p' || x === '--project-name')).toHaveLength(1);
    expect(a.filter((x) => x === '-f')).toHaveLength(2);
    expect(a.slice(a.indexOf('--env-file') + 1)[0]?.toLowerCase()).toBe(`${posix(runtime)}/.env`.toLowerCase());
    expect(a.slice(a.length - tail.length)).toEqual(tail);
  });

  it('runs psql-file through psql inside the db container with the file on stdin', () => {
    const r = run(['psql-file', 'supabase/seed.sql']);
    expect(r.status, r.stderr).toBe(0);
    const tail = [
      'exec',
      '-T',
      'db',
      'psql',
      '-X',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-q',
      '-A',
      '-t',
    ];
    expect(logged().slice(-tail.length)).toEqual(tail);
    expect(readFileSync(`${log}.stdin`)).toEqual(readFileSync('supabase/seed.sql'));
  });

  it('clears shell variables Compose would prefer over the runtime .env; loopback overlay only on request', () => {
    run(['ps'], { POSTGRES_PASSWORD: 'shell-value', COMPOSE_PROJECT_NAME: 'infra', COMPOSE_FILE: 'x.yml' });
    expect(readFileSync(`${log}.env`, 'utf8')).toBe(
      'POSTGRES_PASSWORD=<unset>\nCOMPOSE_PROJECT_NAME=<unset>\nCOMPOSE_FILE=<unset>\n',
    );
    run(['ps'], { MCCI_SELFHOST_DB_LOOPBACK: '1' });
    expect(logged().filter((x) => x === '-f')).toHaveLength(3);
    expect(logged().some((x) => x.endsWith('docker-compose.mcci.db-loopback.yml'))).toBe(true);
  });
});

describe.skipIf(!BASH || !OUTSIDE_BASE)('selfhost with-env.sh and init-runtime.sh (M6, L1)', () => {
  it('exports a password-free database URL and PGPASSWORD; refuses empty values', () => {
    const runtime = tmp('with-env-runtime');
    mkdirSync(runtime, { recursive: true });
    const values: Record<string, string> = {
      API_GW_HTTP_PORT: '18000',
      SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_unit-test',
      SUPABASE_SECRET_KEY: 'sb_secret_unit-test',
      DASHBOARD_USERNAME: 'unit',
      DASHBOARD_PASSWORD: 'unit-test-dashboard',
      POSTGRES_PASSWORD: 'unit-test-db-password',
    };
    writeFileSync(
      join(runtime, '.env'),
      Object.entries(values)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n') + '\n',
    );
    const script = posix(join(ROOT, 'scripts/selfhost/with-env.sh'));
    const r = bash(
      [script, 'sh', '-c', 'printf "%s|%s|%s" "$MCCI_SELFHOST_DB_URL" "${PGPASSWORD:+set}" "$MCCI_IT_SUPABASE_URL"'],
      cleanEnv({ MCCI_SELFHOST_RUNTIME: runtime }),
    );
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toBe('postgresql://postgres@127.0.0.1:15432/postgres|set|http://127.0.0.1:18000');
    expect(r.stdout).not.toContain(values.POSTGRES_PASSWORD);
    writeFileSync(join(runtime, '.env'), 'API_GW_HTTP_PORT=18000\nSUPABASE_PUBLISHABLE_KEY=\n');
    expect(bash([script, 'true'], cleanEnv({ MCCI_SELFHOST_RUNTIME: runtime })).stderr).toMatch(
      /SUPABASE_PUBLISHABLE_KEY is empty/,
    );
  });

  it('init-runtime refuses an existing .env and an in-repository path before generating anything', () => {
    const runtime = tmp('init-runtime');
    mkdirSync(runtime, { recursive: true });
    writeFileSync(join(runtime, '.env'), 'KEEP=1\n');
    const script = posix(join(ROOT, 'scripts/selfhost/init-runtime.sh'));
    const r = bash([script], cleanEnv({ MCCI_SELFHOST_RUNTIME: runtime }));
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/already exists/);
    expect(readFileSync(join(runtime, '.env'), 'utf8')).toBe('KEEP=1\n');
    const inside = join(ROOT, 'deploy', `zz-init-${process.pid}`);
    expect(bash([script], cleanEnv({ MCCI_SELFHOST_RUNTIME: inside })).status).not.toBe(0);
    expect(existsSync(inside)).toBe(false);
  });
});

describe('selfhost sync-upstream.mjs --offline (M2, M3)', () => {
  // PATH holds only node and git: an accidental `gh` (network) call would fail the run.
  const gitCore = execFileSync('git', ['--exec-path'], { encoding: 'utf8' }).trim();
  const offlineEnv = (() => {
    const env = cleanEnv();
    const key = Object.keys(env).find((k) => k.toUpperCase() === 'PATH') ?? 'PATH';
    // git-core holds git; on Git for Windows its DLLs live in mingw64/bin (no gh there either)
    env[key] = [dirname(process.execPath), gitCore, resolve(gitCore, '../../bin')].join(delimiter);
    return env;
  })();
  const sync = (args: string[]) => {
    const r = spawnSync(process.execPath, ['scripts/selfhost/sync-upstream.mjs', ...args], {
      env: offlineEnv,
      encoding: 'utf8',
      cwd: ROOT,
    });
    return { status: r.status, out: `${r.stdout}${r.stderr}` };
  };
  const copy = (name: string) => {
    const dir = tmp(name);
    cpSync('deploy/selfhost/upstream', dir, { recursive: true });
    return dir;
  };

  it('passes for the vendored tree and states how many modes were verified', () => {
    const r = sync(['--offline']);
    expect(r.status, r.out).toBe(0);
    expect(r.out).toMatch(/identical/);
    expect(r.out).toMatch(/modes: (all \d+ verified|\d+ verified from the git index, \d+ NOT verified)/);
  });

  it('fails on a changed file, an unexpected file (.env), a missing file and a changed LICENSE', () => {
    const changed = copy('c1');
    writeFileSync(
      join(changed, 'docker-compose.yml'),
      `${readFileSync(join(changed, 'docker-compose.yml'), 'utf8')}\n# local edit\n`,
    );
    expect(sync(['--offline', '--dir', changed])).toMatchObject({ status: 1 });
    expect(sync(['--offline', '--dir', changed]).out).toMatch(/changed\s+docker-compose\.yml/);
    const extra = copy('c2');
    writeFileSync(join(extra, '.env'), 'DEMO=1\n');
    expect(sync(['--offline', '--dir', extra]).out).toMatch(/extra\s+\.env/);
    const missing = copy('c3');
    unlinkSync(join(missing, 'reset.sh'));
    expect(sync(['--offline', '--dir', missing]).out).toMatch(/missing\s+reset\.sh/);
    const license = copy('c4');
    writeFileSync(join(license, 'LICENSE'), 'not the licence\n');
    const r = sync(['--offline', '--dir', license]);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/changed\s+LICENSE/);
  });

  it('does not claim modes are verified for untracked files; checks modes from the git index when tracked', () => {
    // The scratch repository sits ABOVE the copy, as the real repository sits above deploy/selfhost/upstream.
    const repo = tmp('modes-repo');
    mkdirSync(repo, { recursive: true });
    const dir = join(repo, 'upstream');
    cpSync('deploy/selfhost/upstream', dir, { recursive: true });
    const git = (...args: string[]) => execFileSync('git', ['-C', dir, ...args], { env: offlineEnv, stdio: 'ignore' });
    execFileSync('git', ['init', '-q', repo], { env: offlineEnv, stdio: 'ignore' });
    expect(sync(['--offline', '--dir', dir]).out).toMatch(/0 verified from the git index, \d+ NOT verified/);
    expect(sync(['--offline', '--dir', dir, '--require-tracked']).status).toBe(1);
    git('-c', 'core.autocrlf=false', 'add', '-A', '-f');
    const pin = JSON.parse(readFileSync('deploy/selfhost/UPSTREAM.json', 'utf8')) as {
      files: { path: string; mode: string }[];
    };
    for (const f of pin.files.filter((f) => f.mode === '100755')) git('update-index', '--chmod=+x', '--', f.path);
    const ok = sync(['--offline', '--dir', dir, '--require-tracked']);
    expect(ok.status, ok.out).toBe(0);
    expect(ok.out).toMatch(/modes: all \d+ verified from the git index/);
    git('update-index', '--chmod=-x', '--', 'reset.sh');
    const bad = sync(['--offline', '--dir', dir]);
    expect(bad.status).toBe(1);
    expect(bad.out).toMatch(/mode\s+reset\.sh \(100644, expected 100755\)/);
  });

  it('rejects missing option values, unknown flags and conflicting modes with exit code 2', () => {
    for (const args of [
      ['--export'],
      ['--dir'],
      ['--ref'],
      ['--bogus'],
      ['--offline', '--ref', 'x'],
      ['--require-tracked'],
      ['--export', tmp('x'), '--offline'],
    ]) {
      const r = sync(args);
      expect(r.status, `${args.join(' ')}: ${r.out}`).toBe(2);
    }
  });
});

describe('selfhost Compose interpolation is fully covered by the runtime .env template', () => {
  it('every ${VAR} used by the upstream file, the override and the overlay is a template key (so it can be scrubbed)', () => {
    const template = new Set(
      readFileSync('deploy/selfhost/mcci/env.mcci.example', 'utf8').match(/^[A-Z][A-Z0-9_]*(?==)/gm) ?? [],
    );
    const allowed = new Set(['MCCI_SELFHOST_DATA_DIR', 'MCCI_DB_LOOPBACK_PORT']);
    const used = new Set<string>();
    for (const f of [
      'deploy/selfhost/upstream/docker-compose.yml',
      'deploy/selfhost/mcci/docker-compose.mcci.yml',
      'deploy/selfhost/mcci/docker-compose.mcci.db-loopback.yml',
    ]) {
      for (const line of readFileSync(f, 'utf8').split('\n')) {
        if (line.trim().startsWith('#')) continue;
        for (const m of line.matchAll(/\$\{([A-Z][A-Z0-9_]*)/g)) used.add(m[1]!);
      }
    }
    expect([...used].filter((v) => !template.has(v) && !allowed.has(v))).toEqual([]);
  });
});

describe('selfhost database configuration volume (staging regression, commit 7eede6d)', () => {
  const active = (file: string) =>
    readFileSync(file, 'utf8')
      .split('\n')
      .filter((l) => !l.trim().startsWith('#'));

  it('nothing is bind-mounted over /etc/postgresql-custom; upstream keeps its named volume db-config', () => {
    for (const f of [
      'deploy/selfhost/mcci/docker-compose.mcci.yml',
      'deploy/selfhost/mcci/docker-compose.mcci.db-loopback.yml',
    ]) {
      expect(
        active(f).filter((l) => /:\/etc\/postgresql-custom(:|\s|$)/.test(l)),
        f,
      ).toEqual([]);
    }
    expect(active('deploy/selfhost/upstream/docker-compose.yml')).toContainEqual(
      expect.stringMatching(/^\s+- db-config:\/etc\/postgresql-custom\s*$/),
    );
  });

  it('init-runtime.sh no longer creates data/db/config', () => {
    expect(active('scripts/selfhost/init-runtime.sh').join('\n')).not.toMatch(/data\/db\/config/);
  });
});

describe('selfhost Auth and Storage hardening (docs/17 §12 D-M22, D-M24)', () => {
  const override = readFileSync('deploy/selfhost/mcci/docker-compose.mcci.yml', 'utf8');
  const service = (name: string) => override.split(/\n(?=  [a-z-]+:\n)/).find((b) => b.startsWith(`  ${name}:`)) ?? '';

  it('Auth keys its per-IP rate limits on X-Real-IP (without a header GoTrue applies none)', () => {
    expect(service('auth')).toMatch(/^\s+GOTRUE_RATE_LIMIT_HEADER: X-Real-IP$/m);
  });

  it('the Storage S3 protocol endpoint (SigV4 keys bypass RLS) is switched off', () => {
    expect(service('storage')).toMatch(/^\s+S3_PROTOCOL_ENABLED: 'false'$/m);
  });
});

describe('selfhost backup and restore-drill scripts (docs/17 §10)', () => {
  const src = (f: string) => readFileSync(`scripts/selfhost/${f}`, 'utf8');
  const code = (f: string) =>
    src(f)
      .split('\n')
      .filter((l) => !l.trim().startsWith('#'))
      .join('\n');
  const scripts = ['backup.sh', 'backup-verify.sh', 'restore-drill.sh'];

  it('run strict, with a private umask, and share lib.sh and backup-lib.sh', () => {
    for (const f of scripts) {
      expect(code(f), f).toMatch(/^set -euo pipefail$/m);
      expect(code(f), f).toMatch(/^umask 077$/m);
      expect(code(f), f).toMatch(/\. "\$here\/lib\.sh"\n\. "\$here\/backup-lib\.sh"/);
    }
  });

  it('back up the database, Storage, the db-config volume (pgsodium key) and the runtime .env', () => {
    expect(src('backup-lib.sh')).toMatch(
      /^BACKUP_FILES="db-base\.tar db-wal\.tar state\.json postgres\.dump storage\.tar db-config\.tar runtime-env\.tar"$/m,
    );
    expect(src('backup-lib.sh')).toMatch(/^DB_CONFIG_VOLUME=mcci-selfhost_db-config$/m);
    for (const name of [
      'db-base.tar',
      'db-wal.tar',
      'state.json',
      'postgres.dump',
      'storage.tar',
      'db-config.tar',
      'runtime-env.tar',
    ]) {
      expect(code('backup.sh')).toContain(`encrypt ${name}`);
    }
    expect(code('backup.sh')).toMatch(/pg_backup_start\(/);
    expect(code('backup.sh')).toMatch(/pg_backup_stop\(false\)/);
  });

  it('encrypt with AES-256 from a passphrase file only (never on a command line, never printed)', () => {
    const lib = code('backup-lib.sh');
    expect(lib).toMatch(/--symmetric --cipher-algo AES256/);
    expect(lib).toMatch(/--passphrase-file "\$BACKUP_PASSPHRASE_FILE"/);
    expect(lib).toMatch(/case "\$mode" in\s+600 \| 400\)/);
    for (const f of [...scripts, 'backup-lib.sh']) {
      expect(code(f), f).not.toMatch(/--passphrase[ =](?!-file)/);
      expect(code(f), f).not.toMatch(/(cat|less|head|tail)[^\n|]*PASSPHRASE/);
    }
  });

  it('never delete or overwrite existing data, volumes or backups', () => {
    for (const f of ['backup.sh', 'backup-verify.sh']) {
      expect(code(f), f).not.toMatch(/\brm -rf\b(?! "\$work")|docker volume rm|docker rm\b|\bdown\b|--force\b/);
    }
    expect(code('backup.sh')).toMatch(/\[ ! -e "\$set_dir" \] \|\| die/);
    expect(code('backup.sh')).toMatch(/mv "\$set_dir" "\$set_dir\.FAILED"/);
    // the drill removes only what it created: names with its own prefix, refused if they already exist
    const drill = code('restore-drill.sh');
    expect(drill).toMatch(/^id="mcci-restore-drill-\$\(date/m);
    expect(drill).toMatch(/docker volume inspect "\$v" >\/dev\/null 2>&1 \|\| die "volume \$v already exists"/);
    expect(drill.match(/docker volume rm [^\n]*/g)).toEqual([
      'docker volume rm "$vol" "$vol_fresh" >/dev/null 2>&1 || true',
    ]);
    expect(drill.match(/docker rm -f [^\n]*/g)?.every((l) => /"\$ctr(_fresh)?"/.test(l))).toBe(true);
    expect(drill).toMatch(/--network none/);
    expect(drill).not.toMatch(/ -p |--publish/);
  });

  it.skipIf(!BASH || !OUTSIDE_BASE)('refuses a backup or drill directory inside this repository', () => {
    const r = bash(
      ['-c', '. "$1" && resolve_external_dir MCCI_BACKUP_DIR "the backup directory" new', '_', LIB],
      cleanEnv({ MCCI_BACKUP_DIR: posix(join(ROOT, 'backups-must-not-be-here')) }),
    );
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/the backup directory must be outside this repository|inside a git repository/);
    expect(existsSync(join(ROOT, 'backups-must-not-be-here'))).toBe(false);
  });
});
