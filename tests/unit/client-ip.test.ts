import { describe, expect, it } from 'vitest';
import { forwardedAuthHeaders, isIpAddress, trustedClientIp } from '@/lib/net/client-ip';

const h = (o: Record<string, string>) => new Headers(o);
const trusted = { TRUST_PROXY_CLIENT_IP: '1' } as unknown as NodeJS.ProcessEnv;

describe('trusted client IP for Auth rate limits (docs/18 F1)', () => {
  it('forwards nothing unless the deployment declares a header-overwriting proxy', () => {
    expect(trustedClientIp(h({ 'x-real-ip': '198.51.100.7' }), {} as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(forwardedAuthHeaders(h({ 'x-real-ip': '198.51.100.7' }), {} as unknown as NodeJS.ProcessEnv)).toEqual({});
  });

  it('behind the proxy, forwards the single address the proxy wrote', () => {
    expect(trustedClientIp(h({ 'x-real-ip': '198.51.100.7' }), trusted)).toBe('198.51.100.7');
    expect(forwardedAuthHeaders(h({ 'x-real-ip': '2001:db8::7' }), trusted)).toEqual({ 'X-Real-IP': '2001:db8::7' });
  });

  it('rejects lists, ports, hostnames and junk instead of forwarding them', () => {
    for (const v of [
      '198.51.100.7, 10.0.0.1',
      '198.51.100.7:443',
      'evil.example',
      '999.1.1.1',
      '',
      'x::y::z',
      '1.2.3',
    ]) {
      expect(trustedClientIp(h({ 'x-real-ip': v }), trusted), v).toBeNull();
    }
  });

  it('ignores X-Forwarded-For unless explicitly configured as the trusted header', () => {
    expect(trustedClientIp(h({ 'x-forwarded-for': '198.51.100.7' }), trusted)).toBeNull();
    const env = { ...trusted, CLIENT_IP_HEADER: 'X-Forwarded-For' } as unknown as NodeJS.ProcessEnv;
    expect(trustedClientIp(h({ 'x-forwarded-for': '198.51.100.7' }), env)).toBe('198.51.100.7');
  });

  it('validates IPv4 and IPv6 strictly', () => {
    expect(['127.0.0.1', '0.0.0.0', '255.255.255.255', '::1', 'fe80::1', '2001:db8::1'].every(isIpAddress)).toBe(true);
    expect(['256.1.1.1', '01.2.3.4.5', '1.2.3', 'localhost', ':::', '[::1]'].some(isIpAddress)).toBe(false);
  });
});
