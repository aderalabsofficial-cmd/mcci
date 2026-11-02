import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  buildStatement,
  buildTrialBalance,
  type FinAccount,
  type FinGroup,
  type Statement,
  type TrialBalance,
} from './statement';

/** Accounts read through the person's own session: row-level security and api.fin_* decide. */
export interface FinBank {
  id: string;
  name: string;
  is_default: boolean;
  opening_paisa: number;
  sort: number;
}
export interface FinEntry {
  id: string;
  entry_no: string;
  account_id: string;
  amount_paisa: number;
  on_date: string;
  bank_id: string | null;
  party: string | null;
  reference: string | null;
  note: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  status: 'Recorded' | 'Verified' | 'Voided';
  created_by: string | null;
  void_reason: string | null;
}
export interface FinChart {
  groups: FinGroup[];
  accounts: FinAccount[];
  banks: FinBank[];
  settings: { yearStartMonth: number; openingOn: string };
}

export async function loadChart(): Promise<FinChart> {
  const db = await createClient();
  const [g, a, b, s] = await Promise.all([
    db.from('fin_groups').select('code, kind, name_en, name_ur, sort').order('sort'),
    db.from('fin_accounts').select('id, group_code, name_en, name_ur, auto_source, sort, active').order('sort'),
    db.from('fin_banks').select('id, name, is_default, opening_paisa, sort').eq('active', true).order('sort'),
    db.schema('api').rpc('fin_settings'),
  ]);
  if (g.error ?? a.error ?? b.error ?? s.error) throw new Error('accounts could not be read');
  const raw = (s.data ?? {}) as { yearStartMonth?: number; openingOn?: string };
  return {
    groups: (g.data ?? []) as FinGroup[],
    accounts: (a.data ?? []) as FinAccount[],
    banks: (b.data ?? []) as FinBank[],
    settings: { yearStartMonth: raw.yearStartMonth ?? 7, openingOn: raw.openingOn ?? '2000-01-01' },
  };
}

export async function loadStatement(chart: FinChart, from: string, to: string, verifiedOnly: boolean): Promise<Statement> {
  const db = await createClient();
  const { data, error } = await db
    .schema('api')
    .rpc('fin_figures', { p_from: from, p_to: to, p_verified_only: verifiedOnly });
  if (error) throw new Error('figures could not be read');
  return buildStatement(
    chart.groups,
    chart.accounts,
    (data ?? []).map((f) => ({ account_id: f.account_id, month: f.month, paisa: Number(f.paisa) })),
    from,
    to,
  );
}

const dayBefore = (d: string) => {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() - 1);
  return t.toISOString().slice(0, 10);
};

async function books(on: string): Promise<Map<string | null, number>> {
  const db = await createClient();
  const { data, error } = await db.schema('api').rpc('fin_books', { p_to: on });
  if (error) throw new Error('books could not be read');
  return new Map((data ?? []).map((r) => [r.bank_id as string | null, Number(r.paisa)]));
}

export interface BankLine {
  id: string | null;
  name: string;
  closing: number;
  statement: number | null;
  difference: number | null;
}

/** closing books per bank (and cash in hand), beside what the bank's own statement says for that month end */
export async function loadBankLines(chart: FinChart, to: string): Promise<BankLine[]> {
  const db = await createClient();
  const closing = await books(to);
  const month = `${to.slice(0, 7)}-01`;
  const { data } = await db.from('fin_bank_balances').select('bank_id, balance_paisa').eq('month', month);
  const entered = new Map((data ?? []).map((r) => [r.bank_id, Number(r.balance_paisa)]));
  const lines: BankLine[] = chart.banks.map((b) => {
    const c = closing.get(b.id) ?? 0;
    const s = entered.get(b.id) ?? null;
    return { id: b.id, name: b.name, closing: c, statement: s, difference: s === null ? null : s - c };
  });
  const cash = closing.get(null);
  if (cash) lines.push({ id: null, name: 'Cash in hand', closing: cash, statement: null, difference: null });
  return lines;
}

export async function loadTrialBalance(
  chart: FinChart,
  statement: Statement,
  banks: BankLine[],
  from: string,
): Promise<TrialBalance> {
  const before = await books(dayBefore(from));
  const fund = [...before.values()].reduce((s, v) => s + v, 0);
  return buildTrialBalance(statement, banks, fund);
}

export async function loadEntries(from: string, to: string): Promise<FinEntry[]> {
  const db = await createClient();
  const { data, error } = await db
    .from('fin_entries')
    .select(
      'id, entry_no, account_id, amount_paisa, on_date, bank_id, party, reference, note, attachment_path, attachment_name, status, created_by, void_reason',
    )
    .gte('on_date', from)
    .lte('on_date', to)
    .order('on_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error('entries could not be read');
  return (data ?? []) as FinEntry[];
}

export interface Breakdown {
  category: string;
  class: string;
  vouchers: number;
  paisa: number;
}

export async function loadBreakdown(from: string, to: string): Promise<Breakdown[]> {
  const db = await createClient();
  const { data, error } = await db.schema('api').rpc('fin_membership_breakdown', { p_from: from, p_to: to });
  if (error) throw new Error('breakdown could not be read');
  return (data ?? []).map((r) => ({
    category: r.category,
    class: r.class,
    vouchers: Number(r.vouchers),
    paisa: Number(r.paisa),
  }));
}

export async function loadClosedMonths(): Promise<string[]> {
  const db = await createClient();
  const { data } = await db.from('fin_closed_months').select('month').order('month', { ascending: false }).limit(36);
  return (data ?? []).map((r) => r.month);
}
