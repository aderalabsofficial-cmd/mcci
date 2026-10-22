import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';

const intl = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  return updateSession(request, intl(request));
}

export const config = {
  // everything except API routes, Next internals and files with an extension
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
