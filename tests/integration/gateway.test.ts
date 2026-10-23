import { connect } from 'node:net';
import { networkInterfaces } from 'node:os';
import { describe, expect, it } from 'vitest';
import { readLocalEnv } from './local-env';

/**
 * Gateway checks G1–G8 (docs/17 §3) for the self-hosted Envoy gateway — NOT the Supabase CLI's Kong, which checks no
 * keys. Runs only with MCCI_IT_SELFHOST=1 against a loopback URL (scripts/selfhost/gateway-checks.sh sets it up from
 * the runtime .env without printing values). Expected statuses come from the pinned upstream
 * deploy/selfhost/upstream/volumes/api/envoy/lds.template.yaml. Needs the MCCI migrations applied (G3, G7).
 */
const env = readLocalEnv();
const selfhost = process.env.MCCI_IT_SELFHOST === '1';
const dashboardUser = process.env.MCCI_IT_DASHBOARD_USER ?? '';
const dashboardPassword = process.env.MCCI_IT_DASHBOARD_PASSWORD ?? '';

async function call(path: string, headers: Record<string, string> = {}, init: RequestInit = {}) {
  return fetch(`${env!.url}${path}`, { redirect: 'manual', ...init, headers: { ...headers, ...init.headers } });
}
const pub = () => ({ apikey: env!.publishableKey });
const secret = () => ({ apikey: env!.secretKey });
const basic = (user: string, password: string) => ({
  authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`,
});

/** TCP connect to host:port; resolves 'open' or the error code (ECONNREFUSED, ETIMEDOUT, …). */
function probe(host: string, port: number) {
  return new Promise<string>((resolve) => {
    const socket = connect({ host, port, timeout: 2_000 });
    socket.once('connect', () => (socket.destroy(), resolve('open')));
    socket.once('timeout', () => (socket.destroy(), resolve('ETIMEDOUT')));
    socket.once('error', (e: NodeJS.ErrnoException) => resolve(e.code ?? 'error'));
  });
}

describe.skipIf(!env || !selfhost)('self-hosted gateway G1–G8 (local isolated stack)', () => {
  it('G1: a request without an API key is rejected with 401', async () => {
    expect((await call('/rest/v1/public_settings')).status).toBe(401);
    expect((await call('/auth/v1/settings')).status).toBe(401);
  });

  it('G2: an unknown API key is rejected with 401', async () => {
    const forged = `sb_publishable_${'x'.repeat(32)}`;
    expect((await call('/rest/v1/public_settings', { apikey: forged })).status).toBe(401);
    expect((await call('/rest/v1/public_settings', { apikey: 'invalid-key' })).status).toBe(401);
  });

  it('G3: the publishable key reads public_settings (4 keys)', async () => {
    const res = await call('/rest/v1/public_settings?select=key', pub());
    expect(res.status).toBe(200);
    expect(((await res.json()) as unknown[]).length).toBe(4);
  });

  it('G4: the OpenAPI root is denied to the publishable key (the secret key, as control, is allowed)', async () => {
    expect((await call('/rest/v1/', pub())).status).toBe(403);
    expect((await call('/rest/v1/', secret())).status).toBe(200);
  });

  it('G5a: /pg/ needs the service-role key', async () => {
    expect((await call('/pg/config/version')).status).toBe(401);
    expect((await call('/pg/config/version', pub())).status).toBe(403);
    expect((await call('/pg/config/version', secret())).status).toBe(200); // control, loopback only
  });

  it('G5b: the gateway port is closed on every non-loopback IPv4 address of this host', async () => {
    const port = Number(new URL(env!.url).port);
    const external = Object.values(networkInterfaces())
      .flat()
      .filter((a) => a && a.family === 'IPv4' && !a.internal)
      .map((a) => a!.address);
    // Fail closed: with no external address nothing would be probed, so this must not pass silently.
    if (external.length === 0) {
      throw new Error('G5b NOT TESTED: this host has no non-loopback IPv4 address; run it where one exists');
    }
    for (const address of external) expect(await probe(address, port), `${address}:${port}`).not.toBe('open');
    // Reachability through the TLS proxy / firewall can only be verified on staging (docs/17 §11).
  });

  it('G6: Realtime tenant and OpenAPI admin endpoints are denied to every key', async () => {
    for (const headers of [pub(), secret()]) {
      expect((await call('/realtime/v1/api/tenants', headers)).status).toBe(403);
      expect((await call('/realtime/v1/api/openapi', headers)).status).toBe(403);
    }
  });

  it('G7: service-role-only database functions and private schemas are closed to public clients', async () => {
    const rpc = (headers: Record<string, string>) =>
      call(
        '/rest/v1/rpc/settings_for_server',
        { ...headers, 'content-profile': 'api', 'content-type': 'application/json' },
        { method: 'POST', body: '{}' },
      );
    expect([401, 403]).toContain((await rpc(pub())).status);
    expect((await rpc(secret())).status).toBe(200); // control: the function exists and works server-side
    expect((await call('/rest/v1/settings', { ...pub(), 'accept-profile': 'private' })).status).toBe(406);
    expect((await call('/mcp', secret())).status).toBe(403);
    expect((await call('/api/mcp', secret())).status).toBe(403);
    // The other half of G7 — no secret key in the browser bundle — is the T-B1 build scan, not this test.
  });

  it('G8a: Studio requires authentication', async () => {
    expect((await call('/')).status).toBe(401); // same expectation as upstream tests/test-self-hosted.sh
    expect((await call('/', basic('mcci-not-a-user', 'wrong-password'))).status).toBe(401);
    expect(dashboardUser && dashboardPassword, 'dashboard credentials for the positive control').toBeTruthy();
    const ok = await call('/', basic(dashboardUser, dashboardPassword));
    expect(ok.status).toBeGreaterThanOrEqual(200);
    expect(ok.status).toBeLessThan(400);
  });

  // UNVERIFIED expectation, not a security check: upstream's own tests only assert the 401 status, and whether Envoy's
  // basic_auth filter adds a WWW-Authenticate challenge could not be confirmed offline. If only this test fails, correct
  // the expectation (docs/17 §3); G8a is the security check.
  it('G8b (unverified): the 401 from Studio carries a WWW-Authenticate: Basic challenge', async () => {
    expect((await call('/')).headers.get('www-authenticate') ?? '').toMatch(/^Basic/i);
  });
});
