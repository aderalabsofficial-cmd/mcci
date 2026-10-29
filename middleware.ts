import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { STAFF_LOGIN_PAGE, staffLoginPath } from './lib/auth/staff-path';
import { publicLocation } from './lib/net/public-url';
import { updateSession } from './lib/supabase/middleware';

const intl = createIntlMiddleware(routing);

// member portal and admin panel, with or without the /ur prefix
const PROTECTED = /^\/(?:ur\/)?(?:portal|admin)(?:\/|$)/;

export async function middleware(request: NextRequest) {
  return toPublicHost(request, await handle(request));
}

async function handle(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;
  const ur = path === '/ur' || path.startsWith('/ur/');
  const bare = path.replace(/^\/ur(?=\/|$)/, '') || '/';
  const staffPath = staffLoginPath();
  // the staff sign-in page (lib/auth/staff-path.ts): at a private address, the default one answers 404
  const staffPage =
    staffPath !== STAFF_LOGIN_PAGE && bare.replace(/\/$/, '') === staffPath
      ? NextResponse.rewrite(new URL(`/${ur ? 'ur' : 'en'}${STAFF_LOGIN_PAGE}${request.nextUrl.search}`, request.url))
      : staffPath !== STAFF_LOGIN_PAGE && bare.replace(/\/$/, '') === STAFF_LOGIN_PAGE
        ? notFound(request, ur)
        : null;
  const { response, userId, configured, expired } = await updateSession(request, staffPage ?? intl(request));
  // First line of defence only: layouts check the session and staff 2-step again on the server, and every data
  // access is enforced by RLS / api.* functions in the database.
  // Only page loads are redirected. A POST (server action) must never be: a 307 keeps the method, the browser re-sends
  // the action to /login, which does not contain it, Next.js forwards it back to a portal page, the middleware redirects
  // again — a loop that held server connections until they timed out (found 26 Oct 2026 with the idle sign-out). A
  // signed-out action goes on to the action itself, whose own checks refuse it.
  const pageLoad = request.method === 'GET' || request.method === 'HEAD';
  if (configured && !userId && pageLoad && PROTECTED.test(path)) {
    const admin = bare === '/admin' || bare.startsWith('/admin/');
    // Nobody signed in asks for the admin panel: it answers "not found" and points to no sign-in page. A staff
    // session that just ran out (15 minutes idle) goes back to the staff sign-in page.
    if (admin && !expired) return notFound(request, ur, response);
    const login = new URL(`${ur ? '/ur' : ''}${admin ? staffPath : '/login'}`, request.url);
    // without the locale prefix: the login page's redirect() adds it again
    login.searchParams.set('next', bare);
    // signed out after 15 minutes without activity: the login page says why
    if (expired) login.searchParams.set('expired', '1');
    const redirect = NextResponse.redirect(login);
    // the cleared session cookies go with the redirect
    for (const c of response.cookies.getAll()) redirect.cookies.set(c);
    return redirect;
  }
  return response;
}

/** a page that does not exist: Next.js answers its 404 page (with any cleared session cookies) */
function notFound(request: NextRequest, ur: boolean, from?: NextResponse): NextResponse {
  const response = NextResponse.rewrite(new URL(`/${ur ? 'ur' : 'en'}/__missing`, request.url));
  for (const c of from?.cookies.getAll() ?? []) response.cookies.set(c);
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
