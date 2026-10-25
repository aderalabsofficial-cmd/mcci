import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import en from '@/messages/en.json';
import ur from '@/messages/ur.json';
import { findHeader, normalizeRow, normalizeSheet, parseDate, parseMemberNo, TEMPLATE_HEADERS } from '@/lib/import/normalize';
import { checkImportFile, readSheet, sniffImport } from '@/lib/import/parse';

const codes = (r: { issues: { code: string; level: string }[] }, level?: string) =>
  r.issues.filter((i) => !level || i.level === level).map((i) => i.code);

const good = {
  membership_no: 'MCCI-C-1134',
  class: 'Corporate',
  company_name: 'Alpha Textiles (Pvt) Ltd',
  business_type: 'pvt',
  representative_name: 'Ahmed Khan',
  email: 'info@alpha.pk',
  valid_to: '2027-03-31',
  status: 'Permanent',
};

describe('member numbers: kept exactly, only written the standard way', () => {
  it.each([
    ['MCCI-C-1134', '', 'MCCI-C-1134', false],
    ['mcci/c/1134', '', 'MCCI-C-1134', true],
    ['MCCI A 0205', '', 'MCCI-A-0205', true],
    ['C-1134', '', 'MCCI-C-1134', true],
    ['1134', 'Associate', 'MCCI-A-1134', true],
  ] as const)('%s', (input, cls, value, built) => {
    expect(parseMemberNo(input, cls)).toEqual({ value, built });
  });
  it('leading zeros are never dropped', () => {
    expect(parseMemberNo('MCCI-A-0012', '').value).toBe('MCCI-A-0012');
  });
  it('digits without a class are not turned into a number', () => {
    expect(normalizeRow({ ...good, membership_no: '1134', class: '' }).issues.some((i) => i.field === 'membership_no' && i.level === 'error')).toBe(true);
  });
});

describe('dates as registers write them (day before month)', () => {
  it.each([
    ['2027-03-31', '2027-03-31'],
    ['31/03/2027', '2027-03-31'],
    ['31-03-27', '2027-03-31'],
    ['31.3.2027', '2027-03-31'],
    ['31 Mar 2027', '2027-03-31'],
    ['31st March, 2027', '2027-03-31'],
    ['March 31, 2027', '2027-03-31'],
    ['5 Sept 2026', '2026-09-05'],
  ])('%s', (input, out) => expect(parseDate(input)).toBe(out));
  it('refuses impossible dates and text', () => {
    expect(parseDate('31/06/2027')).toBeNull();
    expect(parseDate('soon')).toBeNull();
  });
  it('reads Excel dates', () => expect(parseDate(new Date(2027, 2, 31))).toBe('2027-03-31'));
});

describe('row checks', () => {
  it('a complete row has no issues', () => {
    const r = normalizeRow(good);
    expect(r.issues).toEqual([]);
    expect(r.data).toMatchObject({ membership_no: 'MCCI-C-1134', class: 'Corporate', business_type: 'pvt', status: 'Permanent', valid_to: '2027-03-31' });
  });
  it('missing required values are errors', () => {
    const r = normalizeRow({ membership_no: 'MCCI-C-1', class: 'Corporate' });
    expect(codes(r, 'error')).toEqual(expect.arrayContaining(['required']));
    expect(r.issues.filter((i) => i.code === 'required').map((i) => i.field).sort()).toEqual(['company_name', 'representative_name', 'status', 'valid_to']);
  });
  it('class that disagrees with the number is an error', () => {
    expect(codes(normalizeRow({ ...good, class: 'Associate' }), 'error')).toContain('class_mismatch');
  });
  it('class taken from the number is a visible warning', () => {
    const r = normalizeRow({ ...good, class: '' });
    expect(r.data.class).toBe('Corporate');
    expect(codes(r, 'warning')).toContain('class_from_number');
  });
  it('an unknown status is an error; a missing one is worked out from the date and flagged', () => {
    expect(codes(normalizeRow({ ...good, status: 'Maybe' }), 'error')).toContain('status');
    const r = normalizeRow({ ...good, status: '', valid_to: '2020-03-31' });
    expect(r.data.status).toBe('Expired');
    expect(codes(r, 'warning')).toContain('status_inferred');
  });
  it('flags a Permanent member whose date has passed, a missing email and a bad email', () => {
    expect(codes(normalizeRow({ ...good, valid_to: '2020-03-31' }), 'warning')).toContain('expired_but_permanent');
    expect(codes(normalizeRow({ ...good, email: '' }), 'warning')).toContain('no_email');
    expect(codes(normalizeRow({ ...good, email: 'nope' }), 'error')).toContain('email');
  });
  it('business type from words, or from the company name with a warning', () => {
    expect(normalizeRow({ ...good, business_type: 'Sole Proprietorship' }).data.business_type).toBe('prop');
    expect(normalizeRow({ ...good, business_type: 'Partnership' }).data.business_type).toBe('aop');
    const r = normalizeRow({ ...good, business_type: '' });
    expect(r.data.business_type).toBe('pvt');
    expect(codes(r, 'warning')).toContain('business_type_inferred');
  });
  it('women Y/N', () => {
    expect(normalizeRow({ ...good, women: 'Y' }).data.women).toBe(true);
    expect(normalizeRow({ ...good, women: 'N' }).data.women).toBe(false);
  });
  it('AI readings carry the least certain value and flag uncertain fields', () => {
    const conf = Object.fromEntries(Object.keys(good).map((k) => [k, 0.95]));
    const r = normalizeRow(good, { ...conf, valid_to: 0.6 });
    expect(r.confidence).toBe(0.6);
    expect(r.issues).toContainEqual({ field: 'valid_to', level: 'warning', code: 'low_confidence' });
  });
  it('control characters and long cells are cleaned', () => {
    const r = normalizeRow({ ...good, company_name: 'Alpha\u0000\tTextiles   Ltd', address: 'x'.repeat(900) });
    expect(r.data.company_name).toBe('Alpha Textiles Ltd');
    expect(r.data.address.length).toBe(500);
  });
});

describe('sheets', () => {
  it('finds the header below a title, by many spellings, and ignores other columns', () => {
    const rows = [
      ['Multan Chamber — member list 2026'],
      ['Membership No.', 'Name of Firm', 'Authorised Representative', 'Category', 'Valid Upto', 'Status', 'Remarks', 'CNIC'],
      ['MCCI-C-1134', 'Alpha', 'Ahmed', 'Corporate', '31/03/2027', 'Active', 'ok', '36302-1234567-1'],
      ['', '', '', '', '', '', '', ''],
    ];
    expect(findHeader(rows)?.row).toBe(1);
    const out = normalizeSheet(rows);
    if ('problem' in out) throw new Error(out.problem);
    expect(out.rows).toHaveLength(1);
    expect(out.ignored).toEqual(['Remarks']);
    expect(out.rows[0]!.data).toMatchObject({ membership_no: 'MCCI-C-1134', company_name: 'Alpha', status: 'Permanent', valid_to: '2027-03-31' });
    // the representative's CNIC is never kept
    expect(JSON.stringify(out.rows[0])).not.toContain('36302');
  });
  it('reports a file without a header or rows', () => {
    expect(normalizeSheet([['a', 'b'], ['1', '2']])).toEqual({ problem: 'no_header' });
    expect(normalizeSheet([TEMPLATE_HEADERS])).toEqual({ problem: 'empty' });
  });
  it('the template header row maps every column', () => {
    const h = findHeader([TEMPLATE_HEADERS]);
    expect(h?.columns.filter(Boolean)).toHaveLength(TEMPLATE_HEADERS.length);
  });
});

describe('file types come from the bytes, not the name', () => {
  const csv = new TextEncoder().encode(`﻿${TEMPLATE_HEADERS.join(',')}\r\nMCCI-A-0012,Associate,N,Beta,prop,,,,,Sara,,,,,2027-03-31,Permanent,\r\n`);
  it('CSV keeps cells as written', () => {
    expect(sniffImport(csv, 'list.csv')).toBe('csv');
    const rows = readSheet(csv, 'csv');
    if ('problem' in rows) throw new Error(rows.problem);
    const out = normalizeSheet(rows);
    if ('problem' in out) throw new Error(out.problem);
    expect(out.rows[0]!.data.membership_no).toBe('MCCI-A-0012');
  });
  it('xlsx and xls are read the same way', () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ['MCCI-C-1134', 'Corporate', 'Y', 'Alpha', 'pvt', '', '', '', '', 'Ahmed', '', '', '', '', new Date(2027, 2, 31), 'Permanent', '']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    for (const type of ['xlsx', 'xls'] as const) {
      const bytes = new Uint8Array(XLSX.write(wb, { type: 'array', bookType: type === 'xls' ? 'biff8' : 'xlsx' }));
      expect(sniffImport(bytes, `m.${type}`)).toBe(type);
      const rows = readSheet(bytes, type);
      if ('problem' in rows) throw new Error(rows.problem);
      const out = normalizeSheet(rows);
      if ('problem' in out) throw new Error(out.problem);
      expect(out.rows[0]!.data).toMatchObject({ membership_no: 'MCCI-C-1134', women: true, valid_to: '2027-03-31' });
    }
  });
  it('refuses other files whatever their name, empty files and oversized files', () => {
    expect(checkImportFile(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0]), 'list.csv')).toEqual({ problem: 'type' });
    expect(checkImportFile(new TextEncoder().encode('MZ…'), 'list.exe')).toEqual({ problem: 'type' });
    expect(checkImportFile(new Uint8Array(), 'a.csv')).toEqual({ problem: 'empty' });
    expect(checkImportFile(new Uint8Array(11 * 1024 * 1024), 'a.csv')).toEqual({ problem: 'tooBig' });
    expect(checkImportFile(new TextEncoder().encode('%PDF-1.7 trailer << /Encrypt 5 0 R >>'), 'a.pdf')).toEqual({ problem: 'encrypted' });
  });
  it('a broken spreadsheet is reported, not thrown', () => {
    expect(readSheet(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]), 'xlsx')).toEqual({ problem: 'unreadable' });
  });
});

describe('messages', () => {
  it('every check code has English and Urdu text', () => {
    const all = ['required', 'membership_no', 'membership_no_written', 'duplicate_in_file', 'class', 'class_from_number', 'class_mismatch', 'status',
      'status_inferred', 'expired_but_permanent', 'date', 'since_after_valid', 'business_type', 'business_type_inferred', 'email', 'no_email', 'ntn', 'low_confidence'];
    for (const c of all) {
      expect((en.imp.issues as Record<string, string>)[c]).toBeTruthy();
      expect((ur.imp.issues as Record<string, string>)[c]).toBeTruthy();
    }
  });
});
