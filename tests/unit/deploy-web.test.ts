import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Guards for the app deployment files (docs/20-deployment-plan.md): what must never regress in review. */
const read = (p: string) => readFileSync(p, 'utf8');
const nginx = read('deploy/web/nginx/app.mcci.aderalabs.tech.conf');
const stage1 = read('deploy/web/nginx/app.mcci.aderalabs.tech.http-only.conf');
const unit = read('deploy/web/mcci-web.service');
const release = read('scripts/deploy/release.sh');
const migrate = read('scripts/selfhost/migrate.sh');
const envExample = read('deploy/web/env.example');

describe('nginx for app.mcci.aderalabs.tech', () => {
  it('overwrites the client address on every proxied location (Auth rate limits and the app trust it)', () => {
    const proxied = nginx.split('location').filter((b) => b.includes('proxy_pass'));
    expect(proxied).toHaveLength(2);
    for (const block of proxied) {
      expect(block).toContain('proxy_set_header X-Real-IP $remote_addr;');
      expect(block).toContain('proxy_set_header X-Forwarded-For $remote_addr;');
      expect(block).not.toContain('$proxy_add_x_forwarded_for');
    }
  });

  it('exposes only the four client APIs of the gateway; Studio, admin and function APIs are 404', () => {
    expect(nginx).toContain('location ~ ^/(rest|auth|storage|realtime)/v1/ {');
    expect(nginx).toMatch(/location \^~ \/realtime\/v1\/api\/ \{\s+return 404;/);
    expect(nginx).toMatch(/location ~ \^\/\(functions\|graphql\)\/v1\/ \{\s+return 404;/);
    expect(nginx).toMatch(/location ~ \^\/\(pg\|mcp\|api\/mcp\)\(\/\|\$\) \{\s+return 404;/);
    expect(nginx.match(/proxy_pass http:\/\/127\.0\.0\.1:18000;/g)).toHaveLength(1);
    expect(nginx).toContain('proxy_pass http://127.0.0.1:3200;');
  });

  it('redirects HTTP to HTTPS, keeps ACME working, and stage 1 proxies nothing', () => {
    expect(nginx).toContain('return 301 https://$host$request_uri;');
    expect(nginx).toContain('root /var/www/letsencrypt;');
    expect(stage1).not.toContain('proxy_pass');
    expect(stage1).not.toContain('listen 443');
  });

  it('is not indexed before launch and sends HSTS without includeSubDomains', () => {
    expect(nginx).toContain('X-Robots-Tag "noindex, nofollow"');
    expect(nginx).toContain('Strict-Transport-Security "max-age=31536000"');
    expect(nginx).not.toMatch(/add_header Strict-Transport-Security[^;]*includeSubDomains/);
  });

  it('gives the app room for session-cookie headers (25 Oct 2026: 502 "upstream sent too big header" at sign-in)', () => {
    const app = nginx.slice(nginx.indexOf('location / {\n        proxy_pass http://127.0.0.1:3200'));
    const kb = (name: string) => Number(new RegExp(`${name} (\\d+)k;`).exec(app)?.[1] ?? 0);
    expect(kb('proxy_buffer_size')).toBeGreaterThanOrEqual(16);
    const buffers = /proxy_buffers (\d+) (\d+)k;/.exec(app);
    expect(buffers).not.toBeNull();
    const [count, size] = [Number(buffers![1]), Number(buffers![2])];
    // nginx refuses to start unless busy ≥ the larger buffer and busy < all buffers minus one
    expect(kb('proxy_busy_buffers_size')).toBeGreaterThanOrEqual(Math.max(kb('proxy_buffer_size'), size));
    expect(kb('proxy_busy_buffers_size')).toBeLessThan((count - 1) * size);
  });
});

describe('systemd unit and release script', () => {
  it('runs as an unprivileged user on loopback, with secrets only from the root-owned env file', () => {
    expect(unit).toContain('User=mcci-web');
    // localhost (not 127.0.0.1) keeps next-intl rewrites internal; ipv4first binds it to 127.0.0.1, where nginx proxies
    expect(unit).toContain('-H localhost -p 3200');
    expect(unit).toContain('Environment=NODE_OPTIONS=--dns-result-order=ipv4first');
    expect(unit).toContain('EnvironmentFile=/etc/mcci-web/env');
    expect(unit).toContain('NoNewPrivileges=true');
    expect(unit).toContain('ProtectSystem=strict');
  });

  it('builds as mcci-web with only the public settings, switches atomically and rolls back on a failed health check', () => {
    expect(release).toContain('runuser -u mcci-web -- env -i');
    expect(release).not.toMatch(/SUPABASE_SECRET_KEY|SMTP_PASS/);
    expect(release).toContain('mv -Tf "$ROOT/current.new" "$ROOT/current"');
    expect(release).toContain('install --frozen-lockfile');
    expect(release).toMatch(/failed its health check[\s\S]+switch_to "\$prev"/);
    expect(release).toContain('merge-base --is-ancestor');
  });

  it('trusts the proxy header only because the app listens on loopback behind nginx', () => {
    expect(envExample).toContain('TRUST_PROXY_CLIENT_IP=1');
    expect(envExample).toContain('SUPABASE_INTERNAL_URL=http://127.0.0.1:18000');
    expect(envExample).toMatch(/^SUPABASE_SECRET_KEY=$/m);
    expect(envExample).toMatch(/^SMTP_PASS=$/m);
  });
});

describe('selfhost migrate.sh', () => {
  it('wraps each migration and its history row in one transaction, through psql-file only', () => {
    expect(migrate).toContain("printf 'begin;\\n'");
    expect(migrate).toContain('insert into supabase_migrations.schema_migrations (version, name)');
    expect(migrate).toContain("printf 'commit;\\n'");
    expect(migrate).toContain('"$compose" psql-file');
    expect(migrate).not.toMatch(/MCCI_SELFHOST_DB_LOOPBACK|docker exec|up -d/);
  });

  it('refuses out-of-order migrations and files with their own transaction control', () => {
    expect(migrate).toContain('is older than the newest applied one');
    expect(migrate).toContain('has its own transaction control');
  });
});
