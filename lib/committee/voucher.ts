/**
 * Payment voucher helpers shared by the email, the member's Payments page and tests (pure; no server-only code).
 * Money is integer PKR; dates are shown in Asia/Karachi (CLAUDE.md §6).
 */

export interface VoucherLine {
  key?: string;
  label: string;
  amount: number;
  qty?: number;
}

export interface BankDetails {
  bank: string;
  title: string;
  iban: string;
  branch: string;
}

/** Rs. 17,500 */
export const pkr = (n: number) => `Rs. ${Math.round(n).toLocaleString('en-US')}`;

export function voucherDate(iso: string, locale: 'en' | 'ur'): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * The bank account to pay into, or null while MCCI has not confirmed it (settings.bank.confirmed must be exactly
 * true and every field filled). docs/14 item 4: vouchers say "to be confirmed" until then — never the placeholder.
 */
export function bankDetails(raw: Record<string, unknown> | null | undefined): BankDetails | null {
  if (!raw || raw.confirmed !== true) return null;
  const s = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string).trim() : '');
  const out = { bank: s('name'), title: s('title'), iban: s('iban'), branch: s('branch') };
  return out.bank && out.title && out.iban ? out : null;
}

/** the message key of a voucher line in messages/*.json (lines from older vouchers have no key: shown as stored) */
export function lineKey(line: VoucherLine): string | null {
  return line.key && ['admission', 'subscription', 'card', 'extraCards'].includes(line.key) ? line.key : null;
}

export const linesTotal = (lines: VoucherLine[]) => lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
