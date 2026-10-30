import { generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * A TEST-ONLY Ed25519 key for signed QR links (lib/qr/sign.ts): made once on this machine in node_modules/.cache
 * (git-ignored; not test-results, which Playwright empties at the start of a run) and given to the e2e app server as
 * QR_SIGNING_KEY. Never the production key, never committed.
 */
const FILE = 'node_modules/.cache/mcci-e2e/qr-signing-key.pem';

export function qrTestKey(): string {
  if (!existsSync(FILE)) {
    mkdirSync(dirname(FILE), { recursive: true });
    const pem = generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    writeFileSync(FILE, pem, { mode: 0o600 });
  }
  return readFileSync(FILE, 'utf8');
}
