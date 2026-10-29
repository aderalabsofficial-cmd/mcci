/**
 * The staff sign-in page (owner's request, 29 Oct 2026: staff do not sign in on the members' page, and the admin side
 * should not invite sign-in attempts from anyone). It lives at /staff/login and is linked from nowhere on the public
 * website. MCCI can give it a private address instead by setting STAFF_LOGIN_PATH on the server (e.g. /mcci-desk-k7q2,
 * 8–64 letters, digits, - or _): /staff/login then answers 404 and only the private address opens the page. Pure (no
 * Node APIs): the middleware uses it too.
 */
export const STAFF_LOGIN_PAGE = '/staff/login';

export function staffLoginPath(value: string | undefined = process.env.STAFF_LOGIN_PATH): string {
  const path = value?.trim();
  return path && /^\/[A-Za-z0-9_-]{8,64}$/.test(path) && path !== STAFF_LOGIN_PAGE ? path : STAFF_LOGIN_PAGE;
}
