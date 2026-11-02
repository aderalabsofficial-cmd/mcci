/**
 * The Profit & Loss statement and the Trial Balance, built from plain figures so the arithmetic is tested on its own.
 * Layout follows MCCI's statement: receipts line by line, expenses in groups (A, A-1 … D), expenses in brackets, then
 * gross receipts, gross expense and the profit or loss. All amounts are paisa (bigint in the database, safe integers here).
 */
export interface FinGroup {
  code: string;
  kind: 'receipt' | 'expense';
  name_en: string;
  name_ur: string | null;
  sort: number;
}
export interface FinAccount {
  id: string;
  group_code: string;
  name_en: string;
  name_ur: string | null;
  auto_source: string | null;
  sort: number;
  active: boolean;
}
export interface Figure {
  account_id: string;
  month: string;
  paisa: number;
}
export interface StatementRow {
  id: string;
  name_en: string;
  name_ur: string | null;
  cells: number[];
  total: number;
  auto: boolean;
}
export interface StatementSection {
  code: string;
  name_en: string;
  name_ur: string | null;
  rows: StatementRow[];
  total: number;
}
export interface Statement {
  months: string[];
  receipts: StatementSection[];
  expenses: StatementSection[];
  receiptCells: number[];
  expenseCells: number[];
  resultCells: number[];
  grossReceipts: number;
  grossExpense: number;
  result: number;
}

/** first day of every month the range touches, as YYYY-MM-01 */
export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let y = Number(from.slice(0, 4));
  let m = Number(from.slice(5, 7));
  const end = Number(to.slice(0, 4)) * 12 + Number(to.slice(5, 7));
  while (y * 12 + m <= end) {
    out.push(`${y}-${String(m).padStart(2, '0')}-01`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function buildStatement(
  groups: FinGroup[],
  accounts: FinAccount[],
  figures: Figure[],
  from: string,
  to: string,
): Statement {
  const months = monthsBetween(from, to);
  const index = new Map(months.map((m, i) => [m, i]));
  const byAccount = new Map<string, number[]>();
  for (const f of figures) {
    const i = index.get(f.month);
    if (i === undefined) continue;
    const cells = byAccount.get(f.account_id) ?? months.map(() => 0);
    cells[i] = (cells[i] ?? 0) + Number(f.paisa);
    byAccount.set(f.account_id, cells);
  }
  const section = (g: FinGroup): StatementSection => {
    const rows = accounts
      .filter((a) => a.group_code === g.code && (a.active || byAccount.has(a.id)))
      .sort((a, b) => a.sort - b.sort)
      .map((a): StatementRow => {
        const cells = byAccount.get(a.id) ?? months.map(() => 0);
        return {
          id: a.id,
          name_en: a.name_en,
          name_ur: a.name_ur,
          cells,
          total: cells.reduce((s, v) => s + v, 0),
          auto: a.auto_source !== null,
        };
      });
    return {
      code: g.code,
      name_en: g.name_en,
      name_ur: g.name_ur,
      rows,
      total: rows.reduce((s, r) => s + r.total, 0),
    };
  };
  const ordered = [...groups].sort((a, b) => a.sort - b.sort);
  const receipts = ordered.filter((g) => g.kind === 'receipt').map(section);
  const expenses = ordered.filter((g) => g.kind === 'expense').map(section);
  const sumCells = (list: StatementSection[]) =>
    months.map((_, i) => list.reduce((s, g) => s + g.rows.reduce((n, r) => n + (r.cells[i] ?? 0), 0), 0));
  const receiptCells = sumCells(receipts);
  const expenseCells = sumCells(expenses);
  const grossReceipts = receiptCells.reduce((s, v) => s + v, 0);
  const grossExpense = expenseCells.reduce((s, v) => s + v, 0);
  return {
    months,
    receipts,
    expenses,
    receiptCells,
    expenseCells,
    resultCells: months.map((_, i) => (receiptCells[i] ?? 0) - (expenseCells[i] ?? 0)),
    grossReceipts,
    grossExpense,
    result: grossReceipts - grossExpense,
  };
}

export interface TrialLine {
  key: string;
  name_en: string;
  name_ur: string | null;
  debit: number;
  credit: number;
}
export interface TrialBalance {
  lines: TrialLine[];
  debit: number;
  credit: number;
}

/**
 * A cash-basis Trial Balance for the period: expenses and the closing bank and cash balances on the debit side; receipts
 * and the fund brought forward on the credit side. The fund brought forward is the books at the day before the period.
 * The two sides agree when the books do; a difference means a balance has been entered or computed wrongly.
 */
export function buildTrialBalance(
  statement: Statement,
  banks: { id: string | null; name: string; closing: number }[],
  broughtForward: number,
): TrialBalance {
  const lines: TrialLine[] = [];
  for (const b of banks) {
    if (b.closing !== 0)
      lines.push({
        key: `bank:${b.id ?? 'cash'}`,
        name_en: b.name,
        name_ur: null,
        debit: Math.max(b.closing, 0),
        credit: Math.max(-b.closing, 0),
      });
  }
  for (const g of statement.expenses)
    for (const r of g.rows)
      if (r.total !== 0)
        lines.push({
          key: r.id,
          name_en: `${g.name_en}: ${r.name_en}`,
          name_ur: null,
          debit: r.total,
          credit: 0,
        });
  for (const g of statement.receipts)
    for (const r of g.rows)
      if (r.total !== 0) lines.push({ key: r.id, name_en: r.name_en, name_ur: r.name_ur, debit: 0, credit: r.total });
  lines.push({
    key: 'fund',
    name_en: 'Fund brought forward',
    name_ur: 'سابقہ فنڈ',
    debit: Math.max(-broughtForward, 0),
    credit: Math.max(broughtForward, 0),
  });
  return {
    lines,
    debit: lines.reduce((s, l) => s + l.debit, 0),
    credit: lines.reduce((s, l) => s + l.credit, 0),
  };
}

/** "1,234.50" → 123450 paisa; null when it is not a positive amount with at most two decimals */
export function parseRupees(raw: string): number | null {
  const s = raw.replace(/[,\s]/g, '');
  if (!/^\d{1,11}(\.\d{1,2})?$/.test(s)) return null;
  const [whole, dec = ''] = s.split('.');
  const paisa = Number(whole) * 100 + Number(dec.padEnd(2, '0'));
  return paisa > 0 ? paisa : null;
}

/** paisa to "1,234.50" or "1,234" as MCCI's statement shows it; expenses in brackets; a nil line as "-" */
export function formatPaisa(paisa: number, bracket = false): string {
  if (paisa === 0) return '-';
  const abs = Math.abs(paisa);
  const whole = Math.floor(abs / 100).toLocaleString('en-US');
  const dec = abs % 100;
  const text = dec ? `${whole}.${String(dec).padStart(2, '0')}` : whole;
  return bracket || paisa < 0 ? `(${text})` : text;
}

export const PRESETS = ['15d', 'month', 'quarter', 'year', 'custom'] as const;
export type Preset = (typeof PRESETS)[number];

const day = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** A preset ends today except month, quarter and year, which cover the period containing today (the financial year's). */
export function presetRange(preset: Preset, today: string, yearStartMonth: number): { from: string; to: string } {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7));
  if (preset === '15d') {
    const t = new Date(`${today}T00:00:00Z`);
    t.setUTCDate(t.getUTCDate() - 14);
    return { from: t.toISOString().slice(0, 10), to: today };
  }
  if (preset === 'quarter') {
    const offset = (m - yearStartMonth + 12) % 12;
    const startOffset = offset - (offset % 3);
    const startAbs = y * 12 + (m - 1) - offset + startOffset;
    const sy = Math.floor(startAbs / 12);
    const sm = (startAbs % 12) + 1;
    const endAbs = startAbs + 2;
    const ey = Math.floor(endAbs / 12);
    const em = (endAbs % 12) + 1;
    return { from: day(sy, sm, 1), to: day(ey, em, lastDay(ey, em)) };
  }
  if (preset === 'year') {
    const sy = m >= yearStartMonth ? y : y - 1;
    const endMonth = yearStartMonth === 1 ? 12 : yearStartMonth - 1;
    const ey = yearStartMonth === 1 ? sy : sy + 1;
    return { from: day(sy, yearStartMonth, 1), to: day(ey, endMonth, lastDay(ey, endMonth)) };
  }
  return { from: day(y, m, 1), to: day(y, m, lastDay(y, m)) };
}

/** "2026-2027" as the statement's heading says it */
export function financialYearLabel(on: string, yearStartMonth: number): string {
  const y = Number(on.slice(0, 4));
  const m = Number(on.slice(5, 7));
  if (yearStartMonth === 1) return String(y);
  const start = m >= yearStartMonth ? y : y - 1;
  return `${start}-${start + 1}`;
}
