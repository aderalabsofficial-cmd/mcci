/**
 * Inactivity limit for every signed-in session (owner's request, 26 Oct 2026): 15 minutes, or SESSION_IDLE_MINUTES
 * (1–120) if MCCI sets another value on the server. Shared by the middleware (server) and the idle guard (browser,
 * which receives the value from the layout).
 */
const minutes = Number(process.env.SESSION_IDLE_MINUTES);
export const IDLE_MINUTES = Number.isFinite(minutes) && minutes >= 1 && minutes <= 120 ? minutes : 15;
export const IDLE_MS = IDLE_MINUTES * 60_000;
export const SEEN_COOKIE = 'mcci_seen';
