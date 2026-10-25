import 'server-only';
import * as XLSX from 'xlsx';
import { MAX_UPLOAD_BYTES } from '@/lib/files/sniff';

/**
 * Reading an uploaded member register (docs/13): what the file really is, from its first bytes (the name and the
 * browser's type prove nothing), then its first sheet as rows of cells. CSV and Excel (.xlsx, and the old .xls) are
 * read deterministically by SheetJS 0.20.3 (pinned from the SheetJS CDN with its integrity hash; the npm "xlsx"
 * package is out of date). Formulas are not evaluated and no macros run: only the stored cell values are read.
 * PDF is read by AI (lib/import/ai.ts), never here.
 */
export type ImportSource = 'csv' | 'xlsx' | 'xls' | 'pdf';

export const IMPORT_MIME: Record<ImportSource, string> = {
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  pdf: 'application/pdf',
};

const starts = (b: Uint8Array, sig: number[]) => sig.every((v, i) => b[i] === v);

/** PDF, Excel 2007+ (a zip), Excel 97–2003 (an OLE file) or plain text (CSV); anything else is refused */
export function sniffImport(bytes: Uint8Array, name: string): ImportSource | null {
  if (starts(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'pdf';
  if (starts(bytes, [0x50, 0x4b, 0x03, 0x04])) return 'xlsx';
  if (starts(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return 'xls';
  // CSV: text without NUL bytes that decodes as UTF-8 (Excel's "CSV UTF-8" adds a BOM), with a .csv / .txt name
  if (/\.(csv|txt)$/i.test(name)) {
    const head = bytes.subarray(0, 64 * 1024);
    if (head.includes(0)) return null;
    // a long file is checked up to its last full line in the first 64 KB (a character may be cut at the end)
    const whole = head.length < bytes.length ? head.subarray(0, head.lastIndexOf(0x0a) + 1) : head;
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(whole);
      return 'csv';
    } catch {
      return null;
    }
  }
  return null;
}

export type ParseProblem = 'empty' | 'tooBig' | 'type' | 'unreadable' | 'encrypted';

export function checkImportFile(bytes: Uint8Array, name: string): { source: ImportSource } | { problem: ParseProblem } {
  if (bytes.length === 0) return { problem: 'empty' };
  if (bytes.length > MAX_UPLOAD_BYTES) return { problem: 'tooBig' };
  const source = sniffImport(bytes, name);
  if (!source) return { problem: 'type' };
  if (source === 'pdf' && /\/Encrypt\s/.test(new TextDecoder('latin1').decode(bytes))) return { problem: 'encrypted' };
  return { source };
}

/** the first sheet that has any value, as rows of cells (dates as Date, everything else as written) */
export function readSheet(bytes: Uint8Array, source: Exclude<ImportSource, 'pdf'>): unknown[][] | { problem: ParseProblem } {
  let wb: XLSX.WorkBook;
  try {
    wb =
      source === 'csv'
        ? // raw: CSV cells stay text exactly as written (no 0012 → 12, no "1/2" → a date)
          XLSX.read(new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, ''), { type: 'string', raw: true, dense: true })
        : XLSX.read(bytes, { type: 'array', cellDates: true, cellFormula: false, cellHTML: false, dense: true, WTF: false });
  } catch (error) {
    if (/password|encrypt/i.test(String((error as Error)?.message))) return { problem: 'encrypted' };
    return { problem: 'unreadable' };
  }
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    // formatted text for numbers (so 0012 stays 0012 when the cell is formatted that way), real dates as Date
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, rawNumbers: false, defval: '', blankrows: false, dateNF: 'yyyy-mm-dd' });
    const dates = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: '', blankrows: false });
    const merged = rows.map((r, i) => r.map((c, j) => (dates[i]?.[j] instanceof Date ? dates[i]![j] : c)));
    if (merged.some((r) => r.some((c) => String(c ?? '').trim() !== ''))) return merged;
  }
  return { problem: 'empty' };
}
