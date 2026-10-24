import { describe, expect, it } from 'vitest';
import { publicLocation } from '@/lib/net/public-url';

const APP = 'https://app.mcci.aderalabs.tech';
const INTERNAL = 'http://localhost:3200/portal';

describe('redirects behind the TLS proxy (Gate 5)', () => {
  it('re-bases a redirect to the loopback origin on APP_URL when the proxy served the public host', () => {
    expect(publicLocation('http://localhost:3200/login?next=%2Fportal', INTERNAL, 'app.mcci.aderalabs.tech', APP)).toBe(
      'https://app.mcci.aderalabs.tech/login?next=%2Fportal',
    );
    expect(publicLocation('https://localhost:3200/ur/login', INTERNAL, 'APP.mcci.aderalabs.tech', APP)).toBe(
      'https://app.mcci.aderalabs.tech/ur/login',
    );
    expect(publicLocation('/login', INTERNAL, 'app.mcci.aderalabs.tech', APP)).toBe(
      'https://app.mcci.aderalabs.tech/login',
    );
  });

  it('leaves local runs, other hosts and external redirects alone', () => {
    // no proxy header, or no APP_URL: local dev and e2e
    expect(publicLocation('http://localhost:3100/login', 'http://localhost:3100/portal', null, APP)).toBeNull();
    expect(publicLocation('http://localhost:3200/login', INTERNAL, 'app.mcci.aderalabs.tech', undefined)).toBeNull();
    // a forwarded host that is not APP_URL's is never trusted
    expect(publicLocation('http://localhost:3200/login', INTERNAL, 'evil.example', APP)).toBeNull();
    // a redirect to somewhere else stays as it is
    expect(publicLocation('https://accounts.example/x', INTERNAL, 'app.mcci.aderalabs.tech', APP)).toBeNull();
    // already public
    expect(publicLocation(`${APP}/login`, INTERNAL, 'app.mcci.aderalabs.tech', APP)).toBeNull();
    expect(publicLocation('http://localhost:3200/x', INTERNAL, 'app.mcci.aderalabs.tech', 'not a url')).toBeNull();
  });
});
