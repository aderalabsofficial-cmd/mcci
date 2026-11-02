import { NextResponse } from 'next/server';
import { loadBankLines, loadChart, loadStatement, loadTrialBalance } from '@/lib/finance/load';
import { formatPaisa } from '@/lib/finance/statement';
import { PermissionError, requirePermission } from '@/lib/permissions/server';

/** GET /api/finance/export?report=pl|tb&from&to: the statement or the Trial Balance as CSV. Accounts ≥ 1. */
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, private' };
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const cell = (v: string) => {
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET(req: Request) {
  try {
    await requirePermission('fin', 1);
  } catch (error) {
    if (error instanceof PermissionError) return NextResponse.json({ error: 'notAllowed' }, { status: 403, headers: NO_STORE });
    throw error;
  }
  const u = new URL(req.url);
  const from = u.searchParams.get('from') ?? '';
  const to = u.searchParams.get('to') ?? '';
  const report = u.searchParams.get('report') === 'tb' ? 'tb' : 'pl';
  if (!DAY.test(from) || !DAY.test(to) || to < from) return NextResponse.json({ error: 'date' }, { status: 400, headers: NO_STORE });
  const chart = await loadChart();
  const st = await loadStatement(chart, from, to, u.searchParams.get('verified') === '1');
  const rows: string[][] = [];
  if (report === 'pl') {
    rows.push(['Profit & Loss Statement', `${from} to ${to}`]);
    rows.push(['Group', 'Description', ...st.months.map((m) => m.slice(0, 7)), 'Total']);
    for (const g of st.receipts)
      for (const r of g.rows) rows.push(['Receipts', r.name_en, ...r.cells.map((c) => formatPaisa(c)), formatPaisa(r.total)]);
    rows.push(['', 'Gross Receipts', ...st.receiptCells.map((c) => formatPaisa(c)), formatPaisa(st.grossReceipts)]);
    for (const g of st.expenses)
      for (const r of g.rows)
        rows.push([`${g.code} ${g.name_en}`, r.name_en, ...r.cells.map((c) => formatPaisa(c, c !== 0)), formatPaisa(r.total, r.total !== 0)]);
    rows.push(['', 'Gross Expense', ...st.expenseCells.map((c) => formatPaisa(c, c !== 0)), formatPaisa(st.grossExpense, st.grossExpense !== 0)]);
    rows.push(['', st.result < 0 ? 'Loss' : 'Profit', ...st.resultCells.map((c) => formatPaisa(c)), formatPaisa(st.result)]);
  } else {
    const banks = await loadBankLines(chart, to);
    const tb = await loadTrialBalance(chart, st, banks, from);
    rows.push(['Trial Balance', `${from} to ${to}`]);
    rows.push(['Account', 'Debit', 'Credit']);
    for (const l of tb.lines) rows.push([l.name_en, l.debit ? formatPaisa(l.debit) : '', l.credit ? formatPaisa(l.credit) : '']);
    rows.push(['Total', formatPaisa(tb.debit), formatPaisa(tb.credit)]);
  }
  const csv = rows.map((r) => r.map(cell).join(',')).join('\r\n');
  return new NextResponse(`﻿${csv}`, {
    headers: {
      ...NO_STORE,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mcci-${report}-${from}-${to}.csv"`,
    },
  });
}
