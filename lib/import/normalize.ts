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
// MCCI's own membership registers (Corporate and Associate, 2026-27)
alias('membership_no', ['membership enrolment', 'membership enrollment', 'enrolment no', 'enrollment no']);
alias('company_name', ['name of business']);
alias('sector', ['business sector']);

/**
 * Those registers have a two-row header: a group ("Authorized Representative") over its columns ("Name", "Mobile"…).
 * The number says which column wins when several hold the same thing: the representative is whom the account invitation
 * goes to, so theirs comes first and the business's own contact fills in where theirs is blank.
 */
const SUB_COLUMNS: Record<string, { field: Field | 'representative_cnic'; rank: number }> = {
  'authorized representative/name': { field: 'representative_name', rank: 0 },
  'authorized representative/mobile': { field: 'mobile', rank: 0 },
  'authorized representative/email': { field: 'email', rank: 0 },
  'authorized representative/cnic': { field: 'representative_cnic', rank: 0 },
  'business contact/phone mobile': { field: 'mobile', rank: 1 },
  'business contact/email': { field: 'email', rank: 1 },
  'business contact/women entrepreneurs': { field: 'women', rank: 0 },
  'business contact person/name': { field: 'representative_name', rank: 1 },
  'business contact person/mobile': { field: 'mobile', rank: 2 },
  'business contact person/email': { field: 'email', rank: 2 },
  'business contact person/cnic': { field: 'representative_cnic', rank: 1 },
};

export interface HeaderMap {
  /** row index (0-based) of the header row */
  row: number;
  columns: (Field | 'representative_cnic' | null)[];
  ignored: string[];
  /** a second header row sits under this one, and the data starts after it */
  subRow?: boolean;
  /** columns to read, best first, when the field's own column is blank */
  fallbacks?: Partial<Record<Field, number[]>>;
}

/** the row under a header is a sub-header when it names columns the header leaves blank and has no serial number */
function isSubHeader(top: unknown[], next: unknown[] | undefined): boolean {
  if (!next || String(next[0] ?? '').trim() !== '') return false;
  return next.filter((c, i) => String(c ?? '').trim() !== '' && String(top[i] ?? '').trim() === '').length >= 2;
}

function twoRowHeader(row: number, top: unknown[], below: unknown[]): HeaderMap {
  type Found = { col: number; field: Field | 'representative_cnic'; rank: number; grouped: boolean };
  const found: Found[] = [];
  const labels: string[] = [];
  let group = '';
  for (let col = 0; col < Math.max(top.length, below.length); col++) {
    const head = String(top[col] ?? '').trim();
    const cell = String(below[col] ?? '').trim();
    if (head) group = head;
    if (!head && !cell) {
      labels.push('');
      continue;
    }
    labels.push(cell ? `${group}: ${cell}` : head);
    const hit = cell ? SUB_COLUMNS[`${key(group).replace('authorised', 'authorized')}/${key(cell)}`] : undefined;
    if (hit) found.push({ col, ...hit, grouped: true });
    else if (!cell && ALIASES[key(head)]) found.push({ col, field: ALIASES[key(head)]!, rank: 0, grouped: false });
  }
  const columns: HeaderMap['columns'] = labels.map(() => null);
  const fallbacks: NonNullable<HeaderMap['fallbacks']> = {};
  const used = new Set<number>();
  for (const f of [...found].sort((a, b) => a.rank - b.rank || a.col - b.col)) {
    if (!columns.includes(f.field)) {
      columns[f.col] = f.field;
      used.add(f.col);
    } else if (f.grouped) {
      used.add(f.col);
      if (f.field !== 'representative_cnic') (fallbacks[f.field] ??= []).push(f.col);
    }
  }
  return { row, columns, ignored: labels.filter((l, i) => l && !used.has(i)), subRow: true, fallbacks };
}

/** the header row is the first of the first ten rows in which at least three cells name template fields */
export function findHeader(rows: unknown[][]): HeaderMap | null {
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const cells = (rows[r] ?? []).map((c) => key(String(c ?? '')));
    const columns = cells.map((c) => ALIASES[c] ?? null);
    const known = new Set(columns.filter(Boolean));
    if (known.size >= 3) {
      if (isSubHeader(rows[r] ?? [], rows[r + 1])) return twoRowHeader(r, rows[r] ?? [], rows[r + 1]!);
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

/** "Renewal 2026-27": the membership year it was renewed for ends on 31 March 2027 (the year runs 1 April – 31 March) */
export function renewalYearEnd(v: string): string | null {
  const m = /^renew(?:al|ed)? (20\d{2}) (\d{2}|20\d{2})$/.exec(key(v));
  if (!m) return null;
  const end = m[2]!.length === 2 ? 2000 + +m[2]! : +m[2]!;
  return end === +m[1]! + 1 ? `${end}-03-31` : null;
}

/** the membership year a register is for, from its title or headers ("Associate Class 2026-27"); null when it does not say */
export function registerYearEnd(rows: unknown[][], upTo: number): string | null {
  for (const row of rows.slice(0, upTo + 1)) {
    for (const cell of row) {
      const m = /\b(20\d{2})\s*[-/–]\s*(20\d{2}|\d{2})\b/.exec(String(cell ?? ''));
      if (!m) continue;
      const end = m[2]!.length === 2 ? 2000 + +m[2]! : +m[2]!;
      if (end === +m[1]! + 1) return `${end}-03-31`;
    }
  }
  return null;
}

function parseStatus(v: string): ImportData['status'] {
  const s = key(v);
  if (renewalYearEnd(v)) return 'Permanent';
  // MCCI's registers: renewed, restored or newly admitted members are all members in good standing
  if (['renewal', 'restoration', 'restored', 'new membership', 'new member', 'new'].includes(s)) return 'Permanent';
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

const yes = (v: string) => ['y', 'yes', 'true', '1', 'w', 'women', 'female', 'women entrepreneurs', 'women entrepreneur'].includes(key(v));

/** what registers write for "nothing here"; never stored as if it were a value */
const NOTHING = /^(n\s*\/?\s*a|nil|none|-+|\.+)$/i;

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
export function normalizeRow(
  cells: Partial<Record<Field | 'representative_cnic', unknown>>,
  confidence?: Partial<Record<Field, number>>,
  file: { registerYearEnd?: string | null } = {},
): ImportRow {
  const raw: Partial<Record<Field, string>> = {};
  for (const f of FIELDS) {
    const c = cells[f];
    const s = c instanceof Date ? (parseDate(c) ?? '') : clean(c);
    if (s && !NOTHING.test(s)) raw[f] = s;
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

  // no valid-to column: the file's own words give it, shown to the admin as a warning, never silently
  const renewalEnd = renewalYearEnd(raw.status ?? '');
  const fromFile = raw.valid_to ? null : (renewalEnd ?? file.registerYearEnd ?? null);
  if (fromFile) {
    cells = { ...cells, valid_to: fromFile };
    raw.valid_to = fromFile;
    warn('valid_to', renewalEnd ? 'valid_to_from_status' : 'valid_to_from_register');
  }

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
  // last renewed for a year that has ended: the member has lapsed, whatever the word "renewal" suggests
  if (renewalEnd && validTo && validTo < today()) status = 'Expired';
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

  if (fromFile) delete raw.valid_to; // raw is what the file said
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
  const body = rows.slice(header.row + (header.subRow ? 2 : 1)).filter((r) => r.some((c) => clean(c) !== ''));
  const yearEnd = registerYearEnd(rows, header.row);
  if (!body.length) return { problem: 'empty' };
  if (body.length > MAX_ROWS) return { problem: 'too_many' };
  const out = body.map((r) => {
    const cells: Partial<Record<Field | 'representative_cnic', unknown>> = {};
    header.columns.forEach((f, i) => {
      if (f && f !== 'representative_cnic') cells[f] = r[i];
    });
    for (const [f, cols] of Object.entries(header.fallbacks ?? {}) as [Field, number[]][]) {
      const blank = (v: unknown) => clean(v) === '' || NOTHING.test(clean(v));
      if (blank(cells[f])) cells[f] = cols.map((i) => r[i]).find((v) => !blank(v)) ?? cells[f];
    }
    return normalizeRow(cells, undefined, { registerYearEnd: yearEnd });
  });
  return { rows: out, ignored: header.ignored };
}
