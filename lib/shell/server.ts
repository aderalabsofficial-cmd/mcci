import 'server-only';
import { cookies, headers } from 'next/headers';
import { detectShell, type Shell } from './detect';

export async function getShell(): Promise<Shell> {
  return detectShell((await headers()).get('user-agent'));
}

/** 'dark' | 'light' from the theme cookie, or null to follow the system setting. */
export async function getThemePreference(): Promise<'dark' | 'light' | null> {
  const value = (await cookies()).get('theme')?.value;
  return value === 'dark' || value === 'light' ? value : null;
}
