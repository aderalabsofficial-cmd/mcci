import { NextResponse } from 'next/server';
import { toCsv } from '@/lib/business/export';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

/** GET: one campaign's recipients as CSV, for staff with Outreach ≥ 2 and Business directory ≥ 2. Numbers are not included. */
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('out', 2);
    await requirePermission('biz', 2);
  } catch (error) {
    if (error instanceof PermissionError) return NextResponse.json({ error: 'not_allowed' }, { status: 403 });
    throw error;
  }
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const locale = asLocale(new URL(req.url).searchParams.get('locale') ?? 'en');
  const db = await createClient();
  const { data, error } = await db
    .from('whatsapp_campaign_recipients')
    .select('business_name, member_no, status, reason')
    .eq('campaign_id', id)
    .order('business_name')
    .limit(100000);
  if (error) return NextResponse.json({ error: 'failed' }, { status: 500 });
  const m = (k: string) => msg(locale, `wa.campaign.cols.${k}`);
  const csv = toCsv({
    title: 'campaign',
    fields: ['business_name', 'member_no', 'status', 'reason'],
    headers: [m('business'), m('member'), m('status'), m('reason')],
    rows: data ?? [],
  });
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mcci-campaign-${id.slice(0, 8)}.csv"`,
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
