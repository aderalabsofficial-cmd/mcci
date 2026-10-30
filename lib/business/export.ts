import 'server-only';
import { Document, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer';
import { createElement as h } from 'react';
import * as XLSX from 'xlsx';

/** Export file builders (api/business-directory/export). The rows were already permission-checked and logged. */
export type Row = Record<string, unknown>;
export interface Sheet {
  title: string;
  fields: string[];
  headers: string[];
  rows: Row[];
}

const cellText = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

/** a spreadsheet would run a cell starting with one of these as a formula; the apostrophe makes it plain text */
export function neutralise(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function toCsv(s: Sheet): string {
  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [s.headers.map((x) => cell(neutralise(x))).join(',')];
  for (const r of s.rows) lines.push(s.fields.map((f) => cell(neutralise(cellText(r[f])))).join(','));
  return `﻿${lines.join('\r\n')}\r\n`;
}

export function toXlsx(s: Sheet): Buffer {
  // every cell is typed as a string, so nothing in it can act as a formula
  const sheet = XLSX.utils.aoa_to_sheet([s.headers, ...s.rows.map((r) => s.fields.map((f) => cellText(r[f])))]);
  sheet['!cols'] = s.fields.map(() => ({ wch: 24 }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Directory');
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx', compression: true }) as Buffer;
}

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: 'Helvetica' },
  title: { fontSize: 13, marginBottom: 2, fontFamily: 'Helvetica-Bold' },
  sub: { fontSize: 8, marginBottom: 10, color: '#555555' },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#cccccc', paddingVertical: 3 },
  head: { fontFamily: 'Helvetica-Bold', backgroundColor: '#eef1f6' },
  cell: { flex: 1, paddingRight: 4 },
});

/** the built-in PDF font has Latin letters only: other scripts are marked instead of printing as broken shapes */
const latin = (v: string) => v.replace(/[^ -ɏ‐-―]/g, '?');

export const PDF_MAX_FIELDS = 8;

export async function toPdf(s: Sheet, subtitle: string): Promise<Buffer> {
  const row = (cells: string[], key: string, head = false) =>
    h(
      View,
      { key, style: head ? [styles.row, styles.head] : styles.row, wrap: false, fixed: head },
      cells.map((c, i) => h(Text, { key: i, style: styles.cell }, latin(c))),
    );
  const doc = h(
    Document,
    { title: s.title },
    h(
      Page,
      { size: 'A4', orientation: 'landscape', style: styles.page },
      h(Text, { style: styles.title }, latin(s.title)),
      h(Text, { style: styles.sub }, latin(subtitle)),
      row(s.headers, 'head', true),
      s.rows.map((r, i) =>
        row(
          s.fields.map((f) => cellText(r[f])),
          String(i),
        ),
      ),
    ),
  );
  return renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
}
