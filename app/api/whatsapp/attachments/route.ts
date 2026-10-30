import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkMedia } from '@/lib/whatsapp/media';

/** POST /api/whatsapp/attachments (one file): staff with Outreach ≥ 2. Type and size checked on the server; private bucket. */
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, private' };

export async function POST(req: Request) {
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin')
    return NextResponse.json({ error: 'notAllowed' }, { status: 403, headers: NO_STORE });
  let actor: string;
  try {
    actor = (await requirePermission('out', 2)).userId;
  } catch (error) {
    if (error instanceof PermissionError)
      return NextResponse.json({ error: 'notAllowed' }, { status: 403, headers: NO_STORE });
    throw error;
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'fields' }, { status: 400, headers: NO_STORE });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkMedia(file.name, file.type, bytes);
  if (!check.ok) return NextResponse.json({ error: `media_${check.reason}` }, { status: 400, headers: NO_STORE });
  const db = createAdminClient();
  const path = `${randomUUID()}.${check.ext}`;
  const up = await db.storage.from('whatsapp-media').upload(path, bytes, { contentType: check.mime });
  if (up.error) {
    console.error('whatsapp upload failed');
    return NextResponse.json({ error: 'generic' }, { status: 500, headers: NO_STORE });
  }
  const { data, error } = await db
    .from('whatsapp_attachments')
    .insert({
      path,
      file_name: file.name.slice(0, 200),
      mime: check.mime,
      bytes: bytes.length,
      kind: check.kind,
      uploaded_by: actor,
    })
    .select('id, file_name, kind')
    .single();
  if (error) return NextResponse.json({ error: 'generic' }, { status: 500, headers: NO_STORE });
  return NextResponse.json(data, { headers: NO_STORE });
}
