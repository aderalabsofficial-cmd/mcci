import { NextResponse } from 'next/server';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import { PDF_MAX_FIELDS, toCsv, toPdf, toXlsx, type Row } from '@/lib/business/export';
import { EXPORT_FIELDS, filterSchema, SELECTION_LIMIT } from '@/lib/business/filters';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';

/**
 * POST /api/business-directory/export: the chosen rows and fields as CSV, XLSX or PDF. The permission is checked here
 * and again in api.biz_export, which also writes the export log before the rows leave. Never cached.
 */
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff' };
const TYPES = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
} as const;

const fieldKeys = EXPORT_FIELDS.map((f) => f.key) as [string, ...string[]];
const body = z.object({
  locale: z.string().optional(),
  filter: filterSchema,
  q: z.string().trim().max(100).default(''),
  ids: z.array(z.string().uuid()).max(SELECTION_LIMIT).nullable().default(null),
  excluded: z.array(z.string().uuid()).max(SELECTION_LIMIT).default([]),
  fields: z.array(z.enum(fieldKeys)).min(1).max(20),
  format: z.enum(['csv', 'xlsx', 'pdf']),
  reason: z.string().trim().max(300).default(''),
});

export async function POST(req: Request) {
  // a page on another site cannot start a download with this person's session
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin')
    return NextResponse.json({ error: 'not_allowed' }, { status: 403, headers: NO_STORE });
  try {
    await requirePermission('biz', 2);
  } catch (error) {
    if (error instanceof PermissionError)
      return NextResponse.json({ error: 'not_allowed' }, { status: 403, headers: NO_STORE });
    throw error;
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'fields' }, { status: 400, headers: NO_STORE });
  const v = parsed.data;
  if (v.format === 'pdf' && v.fields.length > PDF_MAX_FIELDS)
    return NextResponse.json({ error: 'pdffields' }, { status: 400, headers: NO_STORE });

  const supabase = await createClient();
  const { data, error } = await supabase.schema('api').rpc('biz_export', {
    p_def: v.filter as unknown as Json,
    p_q: v.q,
    p_ids: v.ids as string[],
    p_excluded: v.excluded,
    p_fields: v.fields,
    p_format: v.format,
    p_reason: v.reason,
    p_log: true,
  });
  if (error) {
    if (error.code === '42501') return NextResponse.json({ error: 'not_allowed' }, { status: 403, headers: NO_STORE });
    if (error.code === 'P0001')
      return NextResponse.json({ error: error.hint ?? 'fields' }, { status: 400, headers: NO_STORE });
    console.error('business export failed', error.code, error.message);
    return NextResponse.json({ error: 'generic' }, { status: 500, headers: NO_STORE });
  }
  const rows = (data as unknown as { rows: Row[] }).rows;
  // PDFs print in English: the built-in PDF font has no Urdu
  const locale = v.format === 'pdf' ? 'en' : asLocale(v.locale ?? 'en');
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  const sheet = {
    title: msg(locale, 'biz.exports.fileTitle'),
    fields: v.fields,
    headers: v.fields.map((f) => msg(locale, `biz.columns.${f}`)),
    rows,
  };
  const file =
    v.format === 'csv'
      ? toCsv(sheet)
      : v.format === 'xlsx'
        ? toXlsx(sheet)
        : await toPdf(sheet, `${today} · ${rows.length}`);
  return new NextResponse(typeof file === 'string' ? file : new Uint8Array(file), {
    headers: {
      ...NO_STORE,
      'Content-Type': TYPES[v.format],
      'Content-Disposition': `attachment; filename="mcci-business-directory-${today}.${v.format}"`,
    },
  });
}
