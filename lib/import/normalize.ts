/**
 * Existing-member directory import (docs/13 "Member Excel import"): turns the rows of an uploaded register (CSV, Excel,
 * or a PDF read by AI) into the template's fields, with every problem listed per row. Pure functions: the same checks
 * run again in the database (migration 0360, private.import_row_errors), which never trusts this file.
 *
 * Nothing is guessed silently. A value the file does not give exactly (a number written without "MCCI-", a class taken
 * from the number, a status worked out from the expiry date) becomes a warning the admin sees in the preview.
 * The representative's CNIC is not imported: the register does not keep it (docs/17 D-M7).
 */

export const FIELDS = [
  'membership_no',
  'class',
  'women',
  'company_name',
  'business_type',
  'sector',
  'address',
  'ntn',
  'gst',
  'representative_name',
  'mobile',
  'email',
  'member_since',
  'valid_to',
  'status',
  'certificate_serial',
] as const;
export type Field = (typeof FIELDS)[number];

/** the template's header row (docs/13); representative_cnic is accepted in files but not kept */
export const TEMPLATE_HEADERS = [
  'membership_no',
  'class',
  'women',
  'company_name',
  'business_type',
  'sector',
  'address',
  'ntn',
  'gst',
  'representative_name',
  'representative_cnic',
  'mobile',
  'email',
  'member_since',
  'valid_to',
  'status',
  'certificate_serial',
];

export const MAX_ROWS = 5000;
export const MAX_CELL = 500;

export interface Issue {
  field: Field | 'row';
  level: 'error' | 'warning';
  code: string;
}

export interface ImportData {
  membership_no: string;
  class: 'Corporate' | 'Associate' | '';
  women: boolean;
  company_name: string;
  business_type: 'prop' | 'aop' | 'pvt' | 'mnc' | 'public' | '';
  sector: string;
  address: string;
  ntn: string;
  gst: string;
  representative_name: string;
  mobile: string;
  email: string;
  member_since: string;
  valid_to: string;
  status: 'Permanent' | 'Expired' | 'Suspended' | '';
  certificate_serial: string;
}

export interface ImportRow {
  data: ImportData;
  raw: Partial<Record<Field, string>>;
  issues: Issue[];
  /** AI reading only: the lowest certainty among the row's fields, 0–1 */
  confidence?: number;
}

// ───────── headers ─────────

const key = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** spellings seen in chamber registers → template field (compared after lower-casing and dropping punctuation) */
const ALIASES: Record<string, Field | 'representative_cnic'> = {};
const alias = (field: Field | 'representative_cnic', names: string[]) => {
  for (const n of [field.replace(/_/g, ' '), ...names]) ALIASES[key(n)] = field;
};
alias('membership_no', ['membership no', 'membership number', 'member no', 'member number', 'membership', 'mem no', 'm no', 'reg no', 'registration no']);
alias('class', ['membership class', 'category', 'member class', 'type of membership', 'membership type']);
alias('women', ['woman', 'women member', 'lady member', 'female', 'w']);
alias('company_name', ['company', 'company name', 'firm', 'firm name', 'name of firm', 'name of company', 'business name', 'name of the firm', 'organisation', 'organization']);
alias('business_type', ['business type', 'type of business', 'constitution', 'status of business', 'legal status', 'firm type']);
alias('sector', ['nature of business', 'business', 'trade', 'line of business', 'industry']);
alias('address', ['business address', 'office address', 'postal address', 'address of firm']);
alias('ntn', ['ntn no', 'ntn number', 'national tax number', 'tax no']);
alias('gst', ['gst no', 'strn', 'sales tax', 'sales tax no', 'sales tax registration', 'stn']);
alias('representative_name', ['representative', 'authorized rep', 'authorised rep', 'authorized representative', 'authorised representative', 'rep', 'rep name', 'name of representative', 'owner', 'owner name', 'proprietor', 'contact person', 'name']);
alias('representative_cnic', ['cnic', 'cnic no', 'rep cnic', 'nic', 'nic no']);
alias('mobile', ['mobile no', 'cell', 'cell no', 'phone', 'phone no', 'contact', 'contact no', 'tel', 'telephone']);
alias('email', ['e mail', 'email address', 'mail']);
alias('member_since', ['since', 'date of membership', 'membership date', 'joined', 'date joined', 'enrolment date', 'enrollment date']);
alias('valid_to', ['valid upto', 'valid up to', 'valid till', 'valid until', 'expiry', 'expiry date', 'expires', 'valid to date', 'renewed upto', 'renewal upto']);
alias('status', ['membership status', 'member status', 'state']);
alias('certificate_serial', ['serial', 'serial no', 'certificate no', 'certificate serial no', 'cert no']);

export interface HeaderMap {
  /** row index (0-based) of the header row */
  row: number;
  columns: (Field | 'representative_cnic' | null)[];
  ignored: string[];
}

/** the header row is the first of the first ten rows in which at least three cells name template fields */
export function findHeader(rows: unknown[][]): HeaderMap | null {
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const cells = (rows[r] ?? []).map((c) => key(String(c ?? '')));
    const columns = cells.map((c) => ALIASES[c] ?? null);
    const known = new Set(columns.filter(Boolean));
    if (known.size >= 3) {
      // the same field twice: only the first column counts
      const seen = new Set<string>();
      const cols = columns.map((c) => (c && !seen.has(c) ? (seen.add(c), c) : null));
      const ignored = (rows[r] ?? []).map((c) => String(c ?? '').trim()).filter((_, i) => cells[i] && !cols[i]);
      return { row: r, columns: cols, ignored };
    }
  }
  return null;
}

// ───────── cells ─────────

const clean = (v: unknown) =>
  String(v ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CELL);

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const iso = (y: number, m: number, d: number): string | null => {
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return null; // 31 June and the like
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

/**
 * Dates as registers write them: 2027-03-31, 31/03/2027, 31-03-2027, 31.03.27, 31 Mar 2027, March 31, 2027, Excel
 * dates. Day before month (Pakistan); two-digit years are 20xx.
 */
export function parseDate(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    // SheetJS gives Excel dates as local midnight; add 12 h so no time zone moves it to the day before
    const t = new Date(v.getTime() + 12 * 3600_000);
    return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  }
  const s = clean(v).toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ');
  if (!s) return null;
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
  if (m) return iso(+m[1]!, +m[2]!, +m[3]!);
  m = /^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{2}|\d{4})$/.exec(s);
  if (m) return iso(m[3]!.length === 2 ? 2000 + +m[3]! : +m[3]!, +m[2]!, +m[1]!);
  m = /^(\d{1,2})(?:st|nd|rd|th)?[-/. ]([a-z]{3,9})[-/. ](\d{2}|\d{4})$/.exec(s);
  if (m && MONTHS[m[2]!.slice(0, m[2]!.startsWith('sept') ? 4 : 3)])
    return iso(m[3]!.length === 2 ? 2000 + +m[3]! : +m[3]!, MONTHS[m[2]!.slice(0, m[2]!.startsWith('sept') ? 4 : 3)]!, +m[1]!);
  m = /^([a-z]{3,9})[-/. ](\d{1,2})(?:st|nd|rd|th)? (\d{4})$/.exec(s);
  if (m && MONTHS[m[1]!.slice(0, 3)]) return iso(+m[3]!, MONTHS[m[1]!.slice(0, 3)]!, +m[2]!);
  return null;
}

function parseClass(v: string): ImportData['class'] {
  const s = key(v);
  if (['corporate', 'corp', 'c', 'corporate member'].includes(s)) return 'Corporate';
  if (['associate', 'assoc', 'a', 'associate member'].includes(s)) return 'Associate';
  return '';
}

function parseStatus(v: string): ImportData['status'] {
  const s = key(v);
  if (['permanent', 'active', 'valid', 'current', 'renewed', 'regular'].includes(s)) return 'Permanent';
  if (['expired', 'lapsed', 'not renewed', 'inactive', 'due'].includes(s)) return 'Expired';
  if (['suspended', 'suspend', 'on hold'].includes(s)) return 'Suspended';
  return '';
}

function parseBizType(v: string, company: string): { value: ImportData['business_type']; inferred: boolean } {
  const s = key(v);
  if (s) {
    if (/^(prop|proprietor|proprietorship|sole proprietor(ship)?|individual|sole)$/.test(s)) return { value: 'prop', inferred: false };
    if (/^(aop|partnership|association of persons|firm)$/.test(s)) return { value: 'aop', inferred: false };
    if (/^(pvt|pvt ltd|private|private limited|private limited company|smc pvt ltd|smc)$/.test(s)) return { value: 'pvt', inferred: false };
    if (/^(mnc|multinational|multi national|foreign)$/.test(s)) return { value: 'mnc', inferred: false };
    if (/^(public|public limited|public limited company|plc|listed)$/.test(s)) return { value: 'public', inferred: false };
    return { value: '', inferred: false };
  }
  const c = key(company);
  if (/\b(pvt|private)\b/.test(c)) return { value: 'pvt', inferred: true };
  if (/\b(limited|ltd)\b/.test(c)) return { value: 'public', inferred: true };
  return { value: 'prop', inferred: true };
}

const yes = (v: string) => ['y', 'yes', 'true', '1', 'w', 'women', 'female'].includes(key(v));

/**
 * membership numbers as written: MCCI-C-1134, MCCI/C/1134, mcci c 1134, C-1134, or only 1134 (with a class). The
 * digits are kept exactly, leading zeros too: a number already issued is never changed, only written the standard way.
 */
export function parseMemberNo(v: string, cls: ImportData['class']): { value: string; built: boolean } {
  const s = v.toUpperCase().replace(/\s+/g, ' ').trim();
  let m = /^MCCI[\s/_.-]*([CA])[\s/_.-]*(\d{1,6})$/.exec(s);
  if (m) return { value: `MCCI-${m[1]}-${m[2]}`, built: s !== `MCCI-${m[1]}-${m[2]}` };
  m = /^([CA])[\s/_.-]*(\d{1,6})$/.exec(s);
  if (m) return { value: `MCCI-${m[1]}-${m[2]}`, built: true };
  m = /^(\d{1,6})$/.exec(s);
  if (m && cls) return { value: `MCCI-${cls[0]}-${m[1]}`, built: true };
  return { value: s, built: false };
}

const today = () => new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10); // Asia/Karachi

/** one row of the file (by template field) → normalised data and its issues */
export function normalizeRow(cells: Partial<Record<Field | 'representative_cnic', unknown>>, confidence?: Partial<Record<Field, number>>): ImportRow {
  const raw: Partial<Record<Field, string>> = {};
  for (const f of FIELDS) {
    const c = cells[f];
    const s = c instanceof Date ? (parseDate(c) ?? '') : clean(c);
    if (s) raw[f] = s;
  }
  const issues: Issue[] = [];
  const err = (field: Issue['field'], code: string) => issues.push({ field, level: 'error', code });
  const warn = (field: Issue['field'], code: string) => issues.push({ field, level: 'warning', code });

  let cls = parseClass(raw.class ?? '');
  const no = parseMemberNo(raw.membership_no ?? '', cls);
  const noClass = /^MCCI-([CA])-/.exec(no.value)?.[1];
  if (!raw.membership_no) err('membership_no', 'required');
  else if (!/^MCCI-[CA]-\d{1,6}$/.test(no.value)) err('membership_no', 'membership_no');
  else if (no.built) warn('membership_no', 'membership_no_written');
  if (!cls && noClass) {
    cls = noClass === 'C' ? 'Corporate' : 'Associate';
    if (raw.class) err('class', 'class');
    else warn('class', 'class_from_number');
  } else if (!cls) err('class', raw.class ? 'class' : 'required');
  else if (noClass && noClass !== cls[0]) err('class', 'class_mismatch');

  const company = raw.company_name ?? '';
  if (!company) err('company_name', 'required');
  const rep = raw.representative_name ?? '';
  if (!rep) err('representative_name', 'required');

  const biz = parseBizType(raw.business_type ?? '', company);
  if (raw.business_type && !biz.value) err('business_type', 'business_type');
  else if (biz.inferred) warn('business_type', 'business_type_inferred');

  const validTo = raw.valid_to ? parseDate(cells.valid_to) : null;
  if (!raw.valid_to) err('valid_to', 'required');
  else if (!validTo) err('valid_to', 'date');
  const since = raw.member_since ? parseDate(cells.member_since) : null;
  if (raw.member_since && !since) err('member_since', 'date');
  if (since && validTo && since > validTo) err('member_since', 'since_after_valid');

  let status = parseStatus(raw.status ?? '');
  if (raw.status && !status) err('status', 'status');
  else if (!raw.status && validTo) {
    status = validTo < today() ? 'Expired' : 'Permanent';
    warn('status', 'status_inferred');
  } else if (!raw.status) err('status', 'required');
  if (status === 'Permanent' && validTo && validTo < today()) warn('valid_to', 'expired_but_permanent');

  const email = (raw.email ?? '').toLowerCase();
  if (!email) warn('email', 'no_email');
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) err('email', 'email');

  const ntn = (raw.ntn ?? '').toUpperCase().replace(/\s+/g, '');
  if (ntn && !/^[0-9A-Z][0-9A-Z-]{4,19}$/.test(ntn)) warn('ntn', 'ntn');

  const data: ImportData = {
    membership_no: no.value,
    class: cls,
    women: yes(raw.women ?? ''),
    company_name: company,
    business_type: biz.value,
    sector: raw.sector ?? '',
    address: raw.address ?? '',
    ntn,
    gst: (raw.gst ?? '').toUpperCase().replace(/\s+/g, ''),
    representative_name: rep,
    mobile: raw.mobile ?? '',
    email,
    member_since: since ?? '',
    valid_to: validTo ?? '',
    status,
    certificate_serial: raw.certificate_serial ?? '',
  };

  const row: ImportRow = { data, raw, issues };
  if (confidence) {
    // AI reading: the row is as certain as its least certain field that has a value
    const present = FIELDS.filter((f) => raw[f]).map((f) => confidence[f] ?? 0);
    row.confidence = present.length ? Math.min(...present) : 0;
    for (const f of FIELDS) if (raw[f] && (confidence[f] ?? 0) < 0.8) warn(f, 'low_confidence');
  }
  return row;
}

/** a parsed sheet (rows of cells, header included) → rows, the header found, and the columns that were not used */
export function normalizeSheet(rows: unknown[][]): { rows: ImportRow[]; ignored: string[] } | { problem: 'no_header' | 'empty' | 'too_many' } {
  const header = findHeader(rows);
  if (!header) return { problem: 'no_header' };
  const body = rows.slice(header.row + 1).filter((r) => r.some((c) => clean(c) !== ''));
  if (!body.length) return { problem: 'empty' };
  if (body.length > MAX_ROWS) return { problem: 'too_many' };
  const out = body.map((r) => {
    const cells: Partial<Record<Field | 'representative_cnic', unknown>> = {};
    header.columns.forEach((f, i) => {
      if (f && f !== 'representative_cnic') cells[f] = r[i];
    });
    return normalizeRow(cells);
  });
  return { rows: out, ignored: header.ignored };
}
