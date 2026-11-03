import { describe, expect, it } from 'vitest';
import { dateInQuestion, matchGuide } from '@/lib/assistant/staff-guide';
import { checkDocument } from '@/lib/files/check';
import { checkContentMedia } from '@/lib/content/media';
import {
  buildStatement,
  buildTrialBalance,
  financialYearLabel,
  formatPaisa,
  monthsBetween,
  parseRupees,
  presetRange,
  type FinAccount,
  type FinGroup,
} from '@/lib/finance/statement';
import { isTabFilter, tabValue, withTab } from '@/lib/whatsapp/audience';

const groups: FinGroup[] = [
  { code: 'R', kind: 'receipt', name_en: 'Receipts', name_ur: null, sort: 0 },
  { code: 'A', kind: 'expense', name_en: 'Administrative', name_ur: null, sort: 10 },
  { code: 'D', kind: 'expense', name_en: 'Bank Charges', name_ur: null, sort: 20 },
];
const acc = (id: string, group_code: string, sort = 1): FinAccount => ({
  id,
  group_code,
  name_en: id,
  name_ur: null,
  auto_source: null,
  sort,
  active: true,
});
const accounts = [acc('fee', 'R'), acc('salary', 'A'), acc('charges', 'D')];

describe('the Profit & Loss statement', () => {
  const st = buildStatement(
    groups,
    accounts,
    [
      { account_id: 'fee', month: '2026-09-01', paisa: 1000_00 },
      { account_id: 'salary', month: '2026-09-01', paisa: 700_00 },
      { account_id: 'charges', month: '2026-09-01', paisa: 43_42 },
      { account_id: 'fee', month: '2026-10-01', paisa: 500_00 },
    ],
    '2026-09-01',
    '2026-10-31',
  );
  it('has a column for each month and adds up', () => {
    expect(st.months).toEqual(['2026-09-01', '2026-10-01']);
    expect(st.receiptCells).toEqual([1000_00, 500_00]);
    expect(st.expenseCells).toEqual([743_42, 0]);
    expect(st.grossReceipts).toBe(1500_00);
    expect(st.grossExpense).toBe(743_42);
    expect(st.result).toBe(756_58);
    expect(st.resultCells).toEqual([256_58, 500_00]);
  });
  it('shows a loss when expense is more than receipts, and keeps nil lines in place', () => {
    const loss = buildStatement(
      groups,
      accounts,
      [{ account_id: 'salary', month: '2026-09-01', paisa: 5 }],
      '2026-09-01',
      '2026-09-30',
    );
    expect(loss.result).toBe(-5);
    expect(loss.expenses[1]?.rows[0]?.total).toBe(0);
  });
  it('a retired account with figures still appears; one without does not', () => {
    const retired = [...accounts, { ...acc('old', 'A', 2), active: false }, { ...acc('gone', 'A', 3), active: false }];
    const s = buildStatement(
      groups,
      retired,
      [{ account_id: 'old', month: '2026-09-01', paisa: 1 }],
      '2026-09-01',
      '2026-09-30',
    );
    expect(s.expenses[0]?.rows.map((r) => r.id)).toEqual(['salary', 'old']);
  });
  it('months cross a year end', () => {
    expect(monthsBetween('2026-11-15', '2027-02-01')).toEqual(['2026-11-01', '2026-12-01', '2027-01-01', '2027-02-01']);
  });
});

describe('the Trial Balance', () => {
  const st = buildStatement(
    groups,
    accounts,
    [
      { account_id: 'fee', month: '2026-09-01', paisa: 1000_00 },
      { account_id: 'salary', month: '2026-09-01', paisa: 300_00 },
    ],
    '2026-09-01',
    '2026-09-30',
  );
  it('agrees when the books do', () => {
    const tb = buildTrialBalance(st, [{ id: 'b', name: 'Bank', closing: 900_00 }], 200_00);
    expect(tb.debit).toBe(1200_00);
    expect(tb.credit).toBe(1200_00);
  });
  it('shows the difference when a balance is wrong', () => {
    const tb = buildTrialBalance(st, [{ id: 'b', name: 'Bank', closing: 901_00 }], 200_00);
    expect(tb.debit - tb.credit).toBe(1_00);
  });
  it('an overdrawn bank sits on the credit side, a negative fund on the debit side', () => {
    const tb = buildTrialBalance(st, [{ id: 'b', name: 'Bank', closing: -5_00 }], -1_00);
    expect(tb.lines.find((l) => l.key === 'bank:b')).toMatchObject({ debit: 0, credit: 5_00 });
    expect(tb.lines.find((l) => l.key === 'fund')).toMatchObject({ debit: 1_00, credit: 0 });
  });
});

describe('amounts', () => {
  it('reads rupees and paisa exactly', () => {
    expect(parseRupees('1,234.50')).toBe(123450);
    expect(parseRupees('4344.2')).toBe(434420);
    expect(parseRupees('0.07')).toBe(7);
    expect(parseRupees('19.99')).toBe(1999);
  });
  it('refuses what is not a positive amount', () => {
    for (const bad of ['', '0', '-5', 'abc', '1.234', '1e5']) expect(parseRupees(bad)).toBeNull();
  });
  it("prints as MCCI's statement does", () => {
    expect(formatPaisa(0)).toBe('-');
    expect(formatPaisa(123400)).toBe('1,234');
    expect(formatPaisa(434420, true)).toBe('(4,344.20)');
    expect(formatPaisa(-5)).toBe('(0.05)');
  });
});

describe('period buttons', () => {
  it('15 days ends today', () => {
    expect(presetRange('15d', '2026-11-02', 7)).toEqual({ from: '2026-10-19', to: '2026-11-02' });
  });
  it('month, quarter and year follow the financial year', () => {
    expect(presetRange('month', '2026-02-10', 7)).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(presetRange('quarter', '2026-11-02', 7)).toEqual({ from: '2026-10-01', to: '2026-12-31' });
    expect(presetRange('quarter', '2027-01-15', 7)).toEqual({ from: '2027-01-01', to: '2027-03-31' });
    expect(presetRange('year', '2026-09-30', 7)).toEqual({ from: '2026-07-01', to: '2027-06-30' });
    expect(presetRange('year', '2027-03-01', 7)).toEqual({ from: '2026-07-01', to: '2027-06-30' });
    expect(presetRange('year', '2027-03-01', 1)).toEqual({ from: '2027-01-01', to: '2027-12-31' });
  });
  it('names the year as the statement does', () => {
    expect(financialYearLabel('2026-09-01', 7)).toBe('2026-2027');
    expect(financialYearLabel('2027-02-01', 7)).toBe('2026-2027');
  });
});

describe('uploads are judged by their bytes', () => {
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 1]);
  const exe = new Uint8Array([0x4d, 0x5a, 0, 0]);
  it('documents', () => {
    expect(checkDocument('return.PDF', pdf)).toMatchObject({ ok: true, ext: 'pdf' });
    expect(checkDocument('return.pdf', exe)).toEqual({ ok: false, reason: 'type' });
    expect(checkDocument('return.exe', pdf)).toEqual({ ok: false, reason: 'type' });
    expect(checkDocument('big.pdf', new Uint8Array(10 * 1024 * 1024 + 1))).toEqual({ ok: false, reason: 'size' });
  });
  it('published media: no SVG, and a renamed file is refused', () => {
    expect(checkContentMedia('a.pdf', pdf)).toMatchObject({ ok: true, kind: 'file' });
    expect(checkContentMedia('a.jpg', exe)).toEqual({ ok: false, reason: 'type' });
    expect(checkContentMedia('a.svg', new TextEncoder().encode('<svg onload=alert(1)>'))).toEqual({
      ok: false,
      reason: 'type',
    });
  });
});

describe('Ask MCCI AI for staff', () => {
  const all = () => 3;
  it('finds the task in English and Urdu', () => {
    expect(matchGuide('how do I record the electricity bill?', all)[0]?.key).toBe('expense');
    expect(matchGuide('ووٹر لسٹ کیسے بنے گی', all)[0]?.key).toBe('voter');
    expect(matchGuide('profit and loss for this month', all)[0]?.key).toBe('statement');
    expect(matchGuide('restore a lapsed member with arrears', all)[0]?.key).toBe('restore');
  });
  it('never offers a screen the person cannot open', () => {
    const noFinance = (m: string) => (m === 'fin' ? 0 : 3);
    expect(matchGuide('profit and loss', noFinance).map((g) => g.module)).not.toContain('fin');
    expect(matchGuide('profit and loss', () => 0)).toEqual([]);
  });
  it('finds nothing in nonsense', () => {
    expect(matchGuide('zzzz qqqq', all)).toEqual([]);
  });
  it('reads the date in a question', () => {
    expect(dateInQuestion('voter list for 13 July 2028')).toBe('2028-07-13');
    expect(dateInQuestion('voters on July 13, 2028')).toBe('2028-07-13');
    expect(dateInQuestion('voters on 2028-7-13')).toBe('2028-07-13');
    expect(dateInQuestion('13/07/2028')).toBe('2028-07-13');
    expect(dateInQuestion('voter list')).toBeNull();
  });
});

describe('audience tabs', () => {
  it('one choice per tab, keeping the others', () => {
    const f = withTab(withTab({ groups: [] }, 'member_class', 'Corporate'), 'renewal', 'due');
    expect(tabValue(f, 'member_class')).toBe('Corporate');
    expect(tabValue(f, 'renewal')).toBe('due');
    const g = withTab(f, 'member_class', null);
    expect(tabValue(g, 'member_class')).toBeNull();
    expect(tabValue(g, 'renewal')).toBe('due');
    expect(withTab(g, 'renewal', null)).toEqual({ groups: [] });
  });
  it('a filter the tabs cannot show opens the detailed builder', () => {
    expect(isTabFilter(withTab({ groups: [] }, 'city', 'Multan'))).toBe(true);
    expect(
      isTabFilter({
        groups: [{ match: 'all', exclude: true, rules: [{ field: 'city', op: 'in', value: ['Multan'] }] }],
      }),
    ).toBe(false);
    expect(
      isTabFilter({
        groups: [{ match: 'all', exclude: false, rules: [{ field: 'rep_name', op: 'contains', value: 'A' }] }],
      }),
    ).toBe(false);
  });
});
