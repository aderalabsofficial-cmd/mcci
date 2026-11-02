import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { checkContentMedia } from '@/lib/content/media';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createAdminClient } from '@/lib/supabase/admin';

/** POST /api/content/media: a photo, video or file on a post or an event. Content ≥ 2. Published in a public bucket. */
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, private' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const refuse = (error: string, status: number) => NextResponse.json({ error }, { status, headers: NO_STORE });

export async function POST(req: Request) {
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return refuse('notAllowed', 403);
  let actor: string;
  try {
    actor = (await requirePermission('eng', 2)).userId;
  } catch (error) {
    if (error instanceof PermissionError) return refuse('notAllowed', 403);
    throw error;
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const post = String(form?.get('post') ?? '');
  const event = String(form?.get('event') ?? '');
  if (!(file instanceof File) || UUID.test(post) === UUID.test(event)) return refuse('fields', 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkContentMedia(file.name, bytes);
  if (!check.ok) return refuse(check.reason, 400);
  const db = createAdminClient();
  const path = `${post || event}/${randomUUID()}.${check.ext}`;
  const up = await db.storage.from('site-media').upload(path, bytes, { contentType: check.mime });
  if (up.error) {
    console.error('content media upload failed');
    return refuse('generic', 500);
  }
  const { data, error } = await db
    .from('content_media')
    .insert({
      post_id: post || null,
      event_id: event || null,
      kind: check.kind,
      path,
      file_name: file.name.slice(0, 200),
      mime: check.mime,
      bytes: bytes.length,
      uploaded_by: actor,
    })
    .select('id, kind, path, file_name, caption')
    .single();
  if (error) {
    await db.storage.from('site-media').remove([path]);
    return refuse('generic', 500);
  }
  return NextResponse.json(data, { headers: NO_STORE });
}
