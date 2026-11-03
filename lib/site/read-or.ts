import { unstable_rethrow } from 'next/navigation';

/**
 * One read for a public page that must still open when that read fails (a busy database hitting the visitor time
 * limit, say). null means "could not read", so the page can say so instead of claiming there is nothing there.
 */
export async function readOr<T>(what: string, read: Promise<T>): Promise<T | null> {
  try {
    return await read;
  } catch (e) {
    // Next's own signals (a page found to be dynamic, notFound, redirect) are not failed reads: they must go through,
    // or a page would be built once with the note in it
    unstable_rethrow(e);
    console.error(`site.read ${what} failed`, (e as Error)?.message);
    return null;
  }
}
