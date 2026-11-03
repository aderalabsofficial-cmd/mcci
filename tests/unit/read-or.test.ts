import { afterEach, describe, expect, it, vi } from 'vitest';
import { readOr } from '@/lib/site/read-or';

describe('readOr', () => {
  afterEach(() => vi.restoreAllMocks());

  it('passes through what was read, including an empty list', async () => {
    await expect(readOr('posts', Promise.resolve([1, 2]))).resolves.toEqual([1, 2]);
    await expect(readOr('posts', Promise.resolve([]))).resolves.toEqual([]);
  });

  it('turns a failed read into null and logs which read failed', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(readOr('services', Promise.reject(new Error('service_types: statement timeout')))).resolves.toBeNull();
    expect(log).toHaveBeenCalledWith('site.read services failed', 'service_types: statement timeout');
  });

  it('survives a rejection that is not an Error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(readOr('events', Promise.reject(undefined))).resolves.toBeNull();
  });
});
