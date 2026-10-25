import { UnrecognizedActionError } from 'next/dist/client/components/unrecognized-action-error';
import { redirect } from 'next/navigation';
import { describe, expect, it } from 'vitest';
import { callAction, classifyActionError, guardForm } from '@/lib/client/call-action';

describe('server-action calls from the browser (lib/client/call-action.ts)', () => {
  it('a tab from an older release is "stale"; any other failed call is "unconfirmed"', () => {
    expect(classifyActionError(new UnrecognizedActionError('Server Action "x" was not found on the server.'))).toBe('stale');
    expect(classifyActionError(new TypeError('Failed to fetch'))).toBe('unconfirmed');
    expect(classifyActionError(new DOMException('The operation was aborted.', 'AbortError'))).toBe('unconfirmed');
  });

  it('passes the server’s own answer through, success or refusal', async () => {
    expect(await callAction('en', async () => ({ ok: true, message: 'Document accepted.' }))).toEqual({ ok: true, message: 'Document accepted.' });
    expect(await callAction('en', async () => ({ ok: false, message: 'Not allowed' }))).toEqual({ ok: false, message: 'Not allowed' });
  });

  it('turns a failed call into an explicit failure — never success, never silence', async () => {
    const stale = await callAction('en', async () => {
      throw new UnrecognizedActionError('Server Action "x" was not found on the server.');
    });
    expect(stale).toMatchObject({ ok: false, failure: 'stale' });
    expect(stale.message).toContain('Nothing was saved by this click');
    const cut = await callAction('ur', async () => {
      throw new TypeError('Failed to fetch');
    });
    expect(cut).toMatchObject({ ok: false, failure: 'unconfirmed' });
    expect(cut.message).toMatch(/[؀-ۿ]/);
  });

  it('forms keep their state and show the error instead of crashing (sign-in during the nginx 502)', async () => {
    const guarded = guardForm('en', async (_s: { error?: string; email?: string }) => {
      throw new TypeError('Failed to fetch');
    });
    expect(await guarded({ email: 'a@test.local' }, new FormData())).toEqual({
      email: 'a@test.local',
      error: expect.stringContaining('did not confirm'),
    });
  });

  it('never swallows Next.js redirects (sign-in ends with one)', async () => {
    let thrown: unknown;
    try {
      redirect('/portal');
    } catch (e) {
      thrown = e;
    }
    await expect(
      callAction('en', async () => {
        throw thrown;
      }),
    ).rejects.toBe(thrown);
    await expect(guardForm<{ error?: string }>('en', async () => Promise.reject(thrown))({}, new FormData())).rejects.toBe(thrown);
  });
});

describe('an action that never answers', () => {
  it('is reported as not confirmed after the timeout — the screen is never left waiting forever', async () => {
    const r = await callAction('en', () => new Promise<{ ok: boolean; message: string }>(() => {}), 20);
    expect(r).toMatchObject({ ok: false, failure: 'unconfirmed' });
  });
});
