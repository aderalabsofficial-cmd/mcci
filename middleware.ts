import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { publicLocation } from './lib/net/public-url';
import { updateSession } from './lib/supabase/middleware';

const intl = createIntlMiddleware(routing);

// member portal and admin panel, with or without the /ur prefix
const PROTECTED = /^\/(?:ur\/)?(?:portal|admin)(?:\/|$)/;

export async function middleware(request: NextRequest) {
  return toPublicHost(request, await handle(request));
}

async function handle(request: NextRequest): Promise<NextResponse> {
  const { response, userId, configured } = await updateSession(request, intl(request));
  // First line of defence only: layouts check the session and staff 2-step again on the server, and every data
  // access is enforced by RLS / api.* functions in the database.
  if (configured && !userId && PROTECTED.test(request.nextUrl.pathname)) {
    const path = request.nextUrl.pathname;
    const ur = path === '/ur' || path.startsWith('/ur/');
    const login = new URL(ur ? '/ur/login' : '/login', request.url);
    // without the locale prefix: the login page's redirect() adds it again
    login.searchParams.set('next', path.replace(/^\/ur(?=\/|$)/, '') || '/');
    return NextResponse.redirect(login);
  }
  return response;
}

// behind the TLS proxy, redirects to this server's own (loopback) origin go to APP_URL instead (lib/net/public-url.ts)
function toPublicHost(request: NextRequest, response: NextResponse): NextResponse {
  const location = response.headers.get('location');
  const next =
    location && publicLocation(location, request.url, request.headers.get('x-forwarded-host'), process.env.APP_URL);
  if (next) response.headers.set('location', next);
  return response;
}

export const config = {
  // everything except API routes, Next internals and files with an extension
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
