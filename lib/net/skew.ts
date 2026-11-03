/**
 * Version skew after a release (docs/20 §4). Each release is built with its commit as the Next.js deployment ID
 * (scripts/deploy/release.sh → NEXT_DEPLOYMENT_ID → next.config deploymentId), and the browser sends it with every
 * in-app navigation and server action (x-deployment-id). A tab opened before the release sends the old one: its
 * server action IDs and page tree belong to code that is gone. Self-hosted, Next.js does not compare the two (only
 * Vercel does), and on 3 Nov 2026 such an action from an open staff tab looped between routes until it timed out (504).
 *
 * The middleware answers a stale request so the browser loads the page afresh instead: a navigation gets a response
 * that is not page data (the router then does a full page load), a server action gets a redirect to the page it came
 * from with no page data (a full page load too). The action does not run, so nothing is done twice or half-done.
 */

export const DEPLOYMENT_HEADER = 'x-deployment-id';

/** true when the request comes from a page of another release; never when this build has no deployment ID */
export function isStaleClient(sent: string | null | undefined, current: string | false | null | undefined): boolean {
  return Boolean(current) && Boolean(sent) && sent !== current;
}

/** what the stale request gets: headers and status only, the body is empty */
export function staleAnswer(isAction: boolean, pageUrl: string): { status: number; headers: Record<string, string> } {
  const common = { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain' };
  return isAction
    ? { status: 200, headers: { ...common, 'x-action-redirect': `${pageUrl};replace` } }
    : { status: 409, headers: common };
}
