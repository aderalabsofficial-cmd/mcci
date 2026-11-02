import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { findHeader, normalizeRow, normalizeSheet, registerYearEnd, renewalYearEnd } from '@/lib/import/normalize';
import { readSheet } from '@/lib/import/parse';

/** MCCI's register layout with invented people: the title, the two-row header, the blanks and the "N/A"s as they come */
const TOP = ['Sr. #', 'Membership Enrolment #', 'Enrolment  Date', 'Name of Business', 'Business Address', 'Mailing Address', 'Business Particulars', '', '', 'Business Sector', 'Business Type', 'Detail of Owners', 'NTN #', 'STRN', 'Date of Business Establishment', 'Business Contact ', '', '', '', '', 'Authorized Representative', '', '', '', '', '', '', 'Business Contact Person', '', '', '', '', 'Approval Status ', 'Status', '', 'Status', 'Payment Detail (2026-2027)'];
const SUB = ['', '', '', '', '', '', '1', '2', '3', '', '', '', '', '', '', 'Phone / Mobile', 'Fax', 'Email', 'Website', 'Women Entrepreneurs', 'Name', 'H/F/Name', 'CNIC', 'H. Address', 'Mobile', 'Email', 'Designation', 'Name', 'Designation', 'CNIC', 'Mobile', 'Email', '', '', '', 'Renewal', 'Fee Date'];
const member = (over: Partial<Record<'no' | 'status' | 'biz' | 'women' | 'repMobile' | 'repEmail' | 'bizEmail' | 'bizPhone' | 'strn', string>> = {}) => {
  const o = { no: 'A-1001', status: 'Renewal 2026-27', biz: 'Individual', women: '', repMobile: '03001112222', repEmail: 'rep@test.local', bizEmail: 'shop@test.local', bizPhone: '0300000000', strn: 'N/A', ...over };
  return ['1', o.no, '2024-05-01', 'TEST Traders', 'TEST Road, Multan', 'TEST Road, Multan', 'Rice', '', '', 'Trader', o.biz, 'TEST Owner', '1234567', o.strn, '01012020', o.bizPhone, 'N/A', o.bizEmail, 'N/A', o.women, 'TEST Owner', 'TEST Father', '3630212345671', 'TEST Home', o.repMobile, o.repEmail, 'Owner', 'TEST Owner', 'Owner', '3630212345671', '03009998888', 'person@test.local', 'Approvel Confirm by Membership - Committee', o.status, '', 'Renewal', '01072026'];
};
const sheet = (...rows: unknown[][]) => [['Multan Chamber of Commerce & Industry'], ['Membership Register Associate Class 2026-27'], TOP, SUB, ...rows];
const read = (rows: unknown[][]) => {
  const out = normalizeSheet(rows);
  if ('problem' in out) throw new Error(out.problem);
  return out;
};
const errors = (r: { issues: { level: string; field: string; code: string }[] }) => r.issues.filter((i) => i.level === 'error').map((i) => `${i.field}:${i.code}`);

describe('MCCI membership registers', () => {
  it('a register row has no errors and lands in the right fields', () => {
    const out = read(sheet(member()));
    expect(out.rows).toHaveLength(1); // the sub-header is not a member
    const row = out.rows[0]!;
    expect(errors(row)).toEqual([]);
    expect(row.data).toMatchObject({
      membership_no: 'MCCI-A-1001',
      class: 'Associate',
      company_name: 'TEST Traders',
      business_type: 'prop',
      sector: 'Trader',
      address: 'TEST Road, Multan',
      ntn: '1234567',
      representative_name: 'TEST Owner',
      mobile: '03001112222',
      email: 'rep@test.local',
      member_since: '2024-05-01',
      valid_to: '2027-03-31',
      status: 'Permanent',
      women: false,
    });
  });

  it('both classes: the class comes from the number, and Corporate says "Business Name"', () => {
    const corporate = sheet(member({ no: 'C-123', biz: '(Pvt.) Ltd.' }));
    corporate[2] = TOP.map((c) => (c === 'Name of Business' ? 'Business Name' : c));
    const row = read(corporate).rows[0]!;
    expect(errors(row)).toEqual([]);
    expect(row.data).toMatchObject({ membership_no: 'MCCI-C-123', class: 'Corporate', business_type: 'pvt', company_name: 'TEST Traders' });
  });

  it('the representative\'s contact comes first; the business fills in where it is blank or "N/A"', () => {
    expect(read(sheet(member({ repEmail: 'N/A', repMobile: '' }))).rows[0]!.data).toMatchObject({ email: 'shop@test.local', mobile: '0300000000' });
    expect(read(sheet(member({ repEmail: 'N/A', bizEmail: 'n/a', repMobile: 'NIL', bizPhone: '-' }))).rows[0]!.data).toMatchObject({ email: 'person@test.local', mobile: '03009998888' });
  });

  it('"N/A" is never stored as a value', () => {
    expect(read(sheet(member({ strn: 'N/A' }))).rows[0]!.data.gst).toBe('');
    expect(read(sheet(member({ strn: '1234567890123' }))).rows[0]!.data.gst).toBe('1234567890123');
  });

  it('the women column marks a Women Entrepreneur when it is filled in', () => {
    expect(read(sheet(member({ women: 'Women Entrepreneurs' }))).rows[0]!.data.women).toBe(true);
  });

  it.each(['Renewal 2026-27', 'Restoration', 'New Membership'])('%s is a member in good standing until the end of the year', (status) => {
    const row = read(sheet(member({ status }))).rows[0]!;
    expect(errors(row)).toEqual([]);
    expect(row.data).toMatchObject({ status: 'Permanent', valid_to: '2027-03-31' });
  });

  it('a renewal for a year that has ended is Expired, with the date of that year', () => {
    const row = read(sheet(member({ status: 'Renewal 2020-21' }))).rows[0]!;
    expect(row.data).toMatchObject({ status: 'Expired', valid_to: '2021-03-31' });
  });

  it('where the date came from is a warning in the preview, and raw stays what the file said', () => {
    const fromStatus = read(sheet(member())).rows[0]!;
    expect(fromStatus.issues).toContainEqual({ field: 'valid_to', level: 'warning', code: 'valid_to_from_status' });
    expect(fromStatus.raw.valid_to).toBeUndefined();
    const fromTitle = read(sheet(member({ status: 'Restoration' }))).rows[0]!;
    expect(fromTitle.issues).toContainEqual({ field: 'valid_to', level: 'warning', code: 'valid_to_from_register' });
  });

  it('no CNIC reaches the data, from any column', () => {
    const out = read(sheet(member()));
    expect(JSON.stringify(out.rows[0])).not.toContain('3630212345671');
    expect(JSON.stringify(out.ignored)).not.toContain('CNIC');
  });

  it('says which columns are not kept', () => {
    const { ignored } = read(sheet(member()));
    expect(ignored).toContain('Mailing Address');
    expect(ignored).toContain('Authorized Representative: H. Address');
  });

  it('survives the Excel round trip, with the empty rows of a sheet that runs on', () => {
    const ws = XLSX.utils.aoa_to_sheet([...sheet(member(), member({ no: 'A-1002' })), ...Array.from({ length: 6000 }, () => [''])]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Associate Class 2026-27');
    const rows = readSheet(new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' })), 'xlsx');
    if ('problem' in rows) throw new Error(rows.problem);
    expect(read(rows).rows.map((r) => r.data.membership_no)).toEqual(['MCCI-A-1001', 'MCCI-A-1002']);
  });
});

describe('the year rules are strict', () => {
  it('renewalYearEnd', () => {
    expect(renewalYearEnd('Renewal 2026-27')).toBe('2027-03-31');
    expect(renewalYearEnd('renewal 2026-2027')).toBe('2027-03-31');
    expect(renewalYearEnd('Renewal 2026-29')).toBeNull();
    expect(renewalYearEnd('Renewal')).toBeNull();
  });
  it('registerYearEnd looks at the title and headers only, and wants consecutive years', () => {
    expect(registerYearEnd([['Associate Class 2026-27'], ['x']], 1)).toBe('2027-03-31');
    expect(registerYearEnd([['member list 2026'], ['2026-29']], 1)).toBeNull();
    expect(registerYearEnd([['no year'], ['header'], ['2026-27']], 1)).toBeNull();
  });
  it('a file that gives neither a date nor a year still has to fix the row', () => {
    const row = normalizeRow({ membership_no: 'A-1', company_name: 'x', representative_name: 'y', status: 'Restoration' });
    expect(errors(row)).toContain('valid_to:required');
  });
  it('a date in the file always wins', () => {
    const row = normalizeRow({ membership_no: 'A-1', company_name: 'x', representative_name: 'y', status: 'Renewal 2026-27', valid_to: '2028-03-31' });
    expect(row.data.valid_to).toBe('2028-03-31');
    expect(row.raw.valid_to).toBe('2028-03-31');
  });
  it('a one-row header without a sub-header still reads as before', () => {
    expect(findHeader([['Membership No.', 'Name of Firm', 'Valid Upto'], ['MCCI-C-1', 'Alpha', '2027-03-31']])?.subRow).toBeUndefined();
  });
});
