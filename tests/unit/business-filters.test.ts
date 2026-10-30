import { describe, expect, it } from 'vitest';
import { neutralise, toCsv, toXlsx } from '@/lib/business/export';
import {
  completeFilter,
  decodeFilter,
  directoryQuery,
  encodeFilter,
  EMPTY_FILTER,
  filterSchema,
  type Filter,
} from '@/lib/business/filters';

const good: Filter = {
  groups: [
    {
      match: 'all',
      exclude: false,
      rules: [
        { field: 'business_category', op: 'in', value: ['manufacturing'] },
        { field: 'nature', op: 'contains', value: 'Textile' },
        { field: 'valid_to', op: 'between', value: ['2026-01-01', '2026-12-31'] },
        { field: 'valid_year', op: 'gte', value: '2026' },
        { field: 'whatsapp_available', op: 'is', value: true },
        { field: 'city', op: 'empty' },
      ],
    },
  ],
};

describe('segment filter', () => {
  it('accepts every kind of condition and round-trips through the address', () => {
    expect(filterSchema.safeParse(good).success).toBe(true);
    expect(decodeFilter(encodeFilter(good))).toEqual(good);
  });

  it('refuses unknown fields, wrong operators and bad values', () => {
    const rule = (r: object) => ({ groups: [{ match: 'all', exclude: false, rules: [r] }] });
    expect(filterSchema.safeParse(rule({ field: 'c.ntn', op: 'in', value: ['1'] })).success).toBe(false);
    expect(filterSchema.safeParse(rule({ field: 'city', op: 'gte', value: '1' })).success).toBe(false);
    expect(filterSchema.safeParse(rule({ field: 'valid_to', op: 'gte', value: 'soon' })).success).toBe(false);
    expect(
      filterSchema.safeParse(rule({ field: 'valid_to', op: 'between', value: ['2026-12-31', '2026-01-01'] })).success,
    ).toBe(false);
    expect(filterSchema.safeParse(rule({ field: 'member_class', op: 'in', value: [] })).success).toBe(false);
  });

  it('leaves half-made conditions out, so they never change the result', () => {
    const half: Filter = {
      groups: [{ match: 'all', exclude: false, rules: [{ field: 'member_class', op: 'in', value: [] }] }],
    };
    expect(completeFilter(half)).toEqual(EMPTY_FILTER);
    expect(directoryQuery({ f: half })).toBe('');
  });

  it('treats an unreadable address as no filter', () => {
    expect(decodeFilter('{not json')).toEqual(EMPTY_FILTER);
    expect(decodeFilter('{"groups":"x"}')).toEqual(EMPTY_FILTER);
  });

  it('keeps filter, search and sort in the link; first page has no page number', () => {
    const q = directoryQuery({ f: good, q: 'abc', sort: 'city', dir: 'desc', page: 1 });
    expect(q).toContain('q=abc');
    expect(q).toContain('sort=city');
    expect(q).not.toContain('page=');
    expect(directoryQuery({ page: 3 })).toBe('?page=3');
  });
});

describe('export files', () => {
  const sheet = {
    title: 'T',
    fields: ['a', 'b'],
    headers: ['A', 'B'],
    rows: [
      { a: '=SUM(A1)', b: 'He said "hi"' },
      { a: null, b: 5 },
    ],
  };

  it('neutralises anything a spreadsheet would run as a formula', () => {
    for (const v of ['=1+1', '+92300', '-1', '@x', '\tx', '\rx']) expect(neutralise(v)).toBe(`'${v}`);
    expect(neutralise('Textile')).toBe('Textile');
  });

  it('writes a quoted CSV with a BOM for Urdu', () => {
    const csv = toCsv(sheet);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain(`"'=SUM(A1)","He said ""hi"""`);
    expect(csv).toContain(`"","5"`);
  });

  it('writes XLSX cells as plain strings', () => {
    expect(toXlsx(sheet).subarray(0, 2).toString()).toBe('PK');
  });
});
