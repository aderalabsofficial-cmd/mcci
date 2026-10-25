/** Committee date rules shared by the pages and tests (pure). */

/** today in Asia/Karachi as YYYY-MM-DD */
export const karachiToday = (now = new Date()) => now.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });

/** decisions are recorded on or after the meeting date (api.cmt_decide checks the same) */
export const canDecideOn = (m: { held_on: string | null } | null, today = karachiToday()) =>
  Boolean(m?.held_on && m.held_on <= today);
