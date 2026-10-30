import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { webhookSecret } from '@/lib/whatsapp/config';
import { verifyMedia } from '@/lib/whatsapp/signature';

/**
 * GET /api/whatsapp/media/{id}?exp=&sig=: the one file, for the time the link is valid, so Meta can fetch an attachment.
 * The provider has no upload endpoint: it takes a link (docs/30 §2). The bucket stays private and the link expires.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = new URL(req.url);
  if (!verifyMedia(webhookSecret(), id, u.searchParams.get('exp'), u.searchParams.get('sig'))) {
    return NextResponse.json({ error: 'not_found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  const db = createAdminClient();
  const { data: a } = await db.from('whatsapp_attachments').select('path, mime, file_name').eq('id', id).single();
  if (!a) return NextResponse.json({ error: 'not_found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  const { data: file, error } = await db.storage.from('whatsapp-media').download(a.path);
  if (error || !file) return NextResponse.json({ error: 'not_found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  return new NextResponse(await file.arrayBuffer(), {
    headers: {
      'Content-Type': a.mime,
      'Content-Disposition': `attachment; filename="${a.file_name.replace(/[^\w.-]/g, '_')}"`,
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
