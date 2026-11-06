/**
 * WhatsApp consent centre (migration 0690, docs/30 §12): the pure parts shared by the member page, the staff section,
 * the register and tests. The database is the authority (private.wa_phone, private.wa_status); these mirror it so the
 * screens can explain before the server refuses.
 */

/** the five message categories a member chooses from; nothing is ticked by default */
export const CONSENT_CATEGORIES = ['announcements', 'membership', 'events', 'opportunities', 'services'] as const;
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

/** one WhatsApp status per business (private.wa_status) */
export const WA_STATUSES = [
  'no_number',
  'not_collected',
  'full',
  'partial',
  'awaiting_verification',
  'opted_out',
  'blocked',
] as const;
export type WaStatus = (typeof WA_STATUSES)[number];

/** how staff may record consent on the member's behalf (api.wa_consent_record) */
export const STAFF_METHODS = ['phone', 'written', 'in_person', 'email', 'event_form', 'opt_in_flow', 'other'] as const;

/** Members Register filters: a status, or one of the two combined views the owner asked for */
export const REGISTER_FILTERS = [
  'no_number',
  'not_collected',
  'full',
  'partial',
  'opted_out',
  'not_verified',
  'active_no_consent',
] as const;
export type RegisterFilter = (typeof REGISTER_FILTERS)[number];

/** the badge colour the screens use for a status */
export const STATUS_TONE: Record<WaStatus, 'green' | 'blue' | 'orange' | 'red' | 'gray'> = {
  no_number: 'gray',
  not_collected: 'orange',
  full: 'green',
  partial: 'green',
  awaiting_verification: 'blue',
  opted_out: 'red',
  blocked: 'red',
};

export const isConsented = (s: WaStatus) => s === 'full' || s === 'partial';

/**
 * Any common way of writing a number → +<country><number>, as private.wa_phone does. Pakistani numbers must be
 * mobiles (+923XXXXXXXXX), because a landline has no WhatsApp for MCCI's purpose. null = not a number.
 */
export function normalizeWhatsapp(raw: string): string | null {
  let d = raw.replace(/[\s().-]/g, '');
  if (/^03\d{9}$/.test(d)) d = '+92' + d.slice(1);
  else if (/^3\d{9}$/.test(d)) d = '+92' + d;
  else if (/^923\d{9}$/.test(d)) d = '+' + d;
  else if (/^00[1-9]/.test(d)) d = '+' + d.slice(2);
  if (!/^\+[1-9]\d{7,14}$/.test(d)) return null;
  if (d.startsWith('+92') && !/^\+923\d{9}$/.test(d)) return null;
  return d;
}

/** +923001234567 → +92 300 1234567, for reading; the stored form never changes */
export function formatWhatsapp(phone: string | null | undefined): string {
  if (!phone) return '—';
  const m = /^\+92(3\d{2})(\d{7})$/.exec(phone);
  return m ? `+92 ${m[1]} ${m[2]}` : phone;
}

/** wa.me link with the JOIN text ready; null when MCCI's number is not known on this server */
export function joinLink(official: string | null | undefined, code: string): string | null {
  const to = (official ?? '').replace(/\D/g, '');
  if (to.length < 8) return null;
  return `https://wa.me/${to}?text=${encodeURIComponent(`JOIN ${code}`)}`;
}

/** does a register row match the chosen filter? */
export function matchesRegisterFilter(
  f: RegisterFilter,
  row: { status: WaStatus; verified: boolean },
  memberActive: boolean,
): boolean {
  switch (f) {
    case 'not_verified':
      return row.status !== 'no_number' && !row.verified;
    case 'active_no_consent':
      return memberActive && !isConsented(row.status) && row.status !== 'awaiting_verification';
    case 'opted_out':
      return row.status === 'opted_out' || row.status === 'blocked';
    default:
      return row.status === f;
  }
}

/** what api.wa_my_whatsapp returns: the member's own company only */
export interface MyWhatsapp {
  open: boolean;
  version: string | null;
  can_manage: boolean;
  status: WaStatus;
  name: string | null;
  phone: string | null;
  updated_at: string | null;
  verified_at: string | null;
  consent_status: 'granted' | 'withdrawn' | null;
  consent_at: string | null;
  consent_method: string | null;
  categories: string[];
  suppressed: boolean;
  suppression_source: string | null;
  join_expires_at: string | null;
  last_verification: { outcome: string; at: string } | null;
  official: string | null;
  suggestions: string[];
  history: { at: string; event: string; detail: string | null; phone: string | null; categories: string[] | null }[];
}

/** what api.wa_member_whatsapp returns for staff (number masked without contact access) */
export interface StaffWhatsapp {
  open: boolean;
  version: string | null;
  full_access: boolean;
  can_record: boolean;
  can_lift: boolean;
  status: WaStatus;
  name: string | null;
  phone: string | null;
  language: string | null;
  source: string | null;
  updated_at: string | null;
  updated_by: string | null;
  verified_at: string | null;
  verified_method: string | null;
  consent: {
    status: 'granted' | 'withdrawn';
    method: string;
    categories: string[];
    at: string;
    version: string | null;
    confirmed: boolean;
    evidence: string | null;
    who: string | null;
  } | null;
  suppression: { source: string; reason: string; at: string; member: boolean } | null;
  history: {
    at: string;
    event: string;
    detail: string | null;
    categories: string[] | null;
    phone: string | null;
    evidence: string | null;
    version: string | null;
    who: string | null;
  }[];
}

/** Karachi date and time, as the screens show it */
export function waWhen(iso: string | null | undefined, locale: 'en' | 'ur', withTime = true): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}
