import { describe, expect, it } from 'vitest';
import { isStaleClient, staleAnswer } from '@/lib/net/skew';

describe('version skew after a release (lib/net/skew.ts)', () => {
  it('only a request naming another release is stale', () => {
    expect(isStaleClient('abc1234', 'def5678')).toBe(true);
    expect(isStaleClient('def5678', 'def5678')).toBe(false);
    // a plain page load sends no ID; a build without an ID (local dev) never judges
    expect(isStaleClient(null, 'def5678')).toBe(false);
    expect(isStaleClient('', 'def5678')).toBe(false);
    expect(isStaleClient('abc1234', false)).toBe(false);
    expect(isStaleClient('abc1234', undefined)).toBe(false);
  });

  it('a navigation gets no page data (the router loads the page fully); an action is sent back to its page', () => {
    const nav = staleAnswer(false, '/about');
    expect(nav.status).toBe(409);
    expect(nav.headers['Content-Type']).toBe('text/plain');
    expect(nav.headers['x-action-redirect']).toBeUndefined();
    const action = staleAnswer(true, '/ur/admin/requests?status=open');
    expect(action.status).toBe(200);
    expect(action.headers['x-action-redirect']).toBe('/ur/admin/requests?status=open;replace');
    expect(action.headers['Cache-Control']).toBe('no-store');
  });
});
