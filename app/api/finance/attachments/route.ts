import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { checkDocument } from '@/lib/files/check';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { createAdminClient } from '@/lib/supabase/admin';

/** POST /api/finance/attachments: the bill or receipt behind an entry. Accounts ≥ 2; private bucket; type checked here. */
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, private' };

export async function POST(req: Request) {
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return NextResponse.json({ error: 'notAllowed' }, { status: 403, headers: NO_STORE });
  try {
    await requirePermission('fin', 2);
  } catch (error) {
    if (error instanceof PermissionError) return NextResponse.json({ error: 'notAllowed' }, { status: 403, headers: NO_STORE });
    throw error;
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'fields' }, { status: 400, headers: NO_STORE });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkDocument(file.name, bytes);
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400, headers: NO_STORE });
  const path = `${randomUUID()}/entries/${randomUUID()}.${check.ext}`;
  const up = await createAdminClient().storage.from('finance-docs').upload(path, bytes, { contentType: check.mime });
  if (up.error) {
    console.error('finance upload failed');
    return NextResponse.json({ error: 'generic' }, { status: 500, headers: NO_STORE });
  }
  return NextResponse.json({ path, name: file.name.slice(0, 200) }, { headers: NO_STORE });
}
