import { describe, expect, it } from 'vitest';
import { voucherEmail } from '@/lib/committee/emails';
import { canDecideOn, karachiToday } from '@/lib/committee/rules';
import { bankDetails, lineKey, linesTotal, pkr, voucherDate } from '@/lib/committee/voucher';
import { noteText } from '@/lib/membership/notes';

const env = { APP_URL: 'https://app.example.test' } as unknown as NodeJS.ProcessEnv;
const placeholder = {
  name: 'MCCI bank (to be confirmed by MCCI)',
  title: 'Multan Chamber of Commerce & Industry',
  iban: 'PK00 XXXX 0000 0000 0000 0000',
  branch: 'Any branch',
  confirmed: false,
};

describe('payment voucher helpers (lib/committee/voucher.ts)', () => {
  it('formats integer PKR', () => {
    expect(pkr(17500)).toBe('Rs. 17,500');
    expect(pkr(0)).toBe('Rs. 0');
  });

  it('never shows the placeholder bank account: only an account MCCI confirmed (docs/14 item 4)', () => {
    expect(bankDetails(placeholder)).toBeNull();
    expect(bankDetails({ ...placeholder, confirmed: 'true' })).toBeNull();
    expect(bankDetails({ ...placeholder, confirmed: true, iban: ' ' })).toBeNull();
    expect(bankDetails({ name: 'Bank X', title: 'MCCI', iban: 'PK36 SCBL 0000 0011 2345 6702', branch: 'Multan', confirmed: true })).toEqual({
      bank: 'Bank X',
      title: 'MCCI',
      iban: 'PK36 SCBL 0000 0011 2345 6702',
      branch: 'Multan',
    });
    expect(bankDetails(null)).toBeNull();
  });

  it('labels known fee lines in both languages and keeps older lines as stored', () => {
    expect(lineKey({ key: 'admission', label: 'Admission fee', amount: 5000 })).toBe('admission');
    expect(lineKey({ key: 'something', label: 'X', amount: 1 })).toBeNull();
    expect(lineKey({ label: 'Admission', amount: 5000 })).toBeNull();
    expect(linesTotal([{ label: 'a', amount: 5000 }, { label: 'b', amount: 12000 }, { label: 'c', amount: 500 }])).toBe(17500);
  });

  it('shows dates in Asia/Karachi', () => {
    // 19:30 UTC on 31 Oct is 00:30 on 1 Nov in Karachi
    expect(voucherDate('2026-10-31T19:30:00Z', 'en')).toBe('1 Nov 2026');
    expect(voucherDate('', 'en')).toBe('');
  });
});

describe('committee date rule (api.cmt_decide: on or after the meeting date)', () => {
  it('allows decisions from the meeting day on, in Karachi time', () => {
    expect(canDecideOn({ held_on: '2026-10-26' }, '2026-10-26')).toBe(true);
    expect(canDecideOn({ held_on: '2026-10-27' }, '2026-10-26')).toBe(false);
    expect(canDecideOn({ held_on: null }, '2026-10-26')).toBe(false);
    expect(canDecideOn(null)).toBe(false);
    expect(karachiToday(new Date('2026-10-25T20:00:00Z'))).toBe('2026-10-26');
  });
});

describe('membership_approved_voucher email (lib/committee/emails.ts)', () => {
  const base = {
    to: 'a@test.local',
    name: 'Applicant',
    token: 'MCCI-2026-M-0231',
    memberNo: 'MCCI-C-1134',
    voucherNo: 'PV-2026-0001',
    amount: 17500,
    dueAt: '2026-11-02T05:00:00Z',
  };

  it('while the bank is not confirmed: number, voucher, amount, due date, and "do not pay yet" — no placeholder IBAN', () => {
    const mail = voucherEmail({ ...base, bank: placeholder }, env);
    expect(mail.subject).toContain('MCCI-C-1134');
    expect(mail.text).toContain('PV-2026-0001');
    expect(mail.text).toContain('Rs. 17,500');
    expect(mail.text).toContain('2 Nov 2026');
    expect(mail.text).toContain('do not pay until the bank details appear');
    expect(mail.text).not.toContain('PK00');
    expect(mail.text).toContain('https://app.example.test/portal/payments');
    expect(mail.html).toContain('lang="ur"');
  });

  it('with a confirmed account: the bank, title and IBAN', () => {
    const mail = voucherEmail(
      { ...base, bank: { name: 'Bank X', title: 'MCCI', iban: 'PK36 SCBL 0000 0011 2345 6702', branch: 'Multan', confirmed: true } },
      env,
    );
    expect(mail.text).toContain('PK36 SCBL 0000 0011 2345 6702');
    expect(mail.text).not.toContain('do not pay until');
  });

  it('escapes what people typed', () => {
    const mail = voucherEmail({ ...base, name: '<b>x</b>', bank: placeholder }, env);
    expect(mail.html).not.toContain('<b>x</b>');
  });
});

describe('portal messages in the reader’s language (lib/membership/notes.ts)', () => {
  const row = {
    title: 'Approved — membership No. MCCI-C-1134',
    body: 'English fallback',
    template: 'committee.approved',
    vars: { no: 'MCCI-C-1134', voucher: 'PV-2026-0001', amount: '17500' },
  };
  it('renders template rows in English and Urdu', () => {
    expect(noteText('en', row).title).toBe('Approved — membership No. MCCI-C-1134');
    expect(noteText('ur', row).title).toContain('MCCI-C-1134');
    expect(noteText('ur', row).title).toMatch(/[؀-ۿ]/);
    expect(noteText('ur', row).body).toContain('PV-2026-0001');
  });
  it('falls back to the stored text for older rows and unknown templates', () => {
    expect(noteText('ur', { title: 'Old', body: 'Row' })).toEqual({ title: 'Old', body: 'Row' });
    expect(noteText('ur', { ...row, template: 'later.feature' })).toEqual({ title: row.title, body: row.body });
  });
});
