import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { checkDocument } from '@/lib/files/check';
import { staffLevel } from '@/lib/permissions/levels';
import { getSession } from '@/lib/permissions/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/members/docs: a tax return or a change document for one company. The company's own user with the right
 * level, or staff with Members Register ≥ 2. Stored privately under the company's folder; the database checks the folder
 * again when the request is made.
 */
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, private' };
const FOLDERS = new Set(['taxreturns', 'declarations']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const refuse = (error: string, status: number) => NextResponse.json({ error }, { status, headers: NO_STORE });

export async function POST(req: Request) {
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return refuse('notAllowed', 403);
  const session = await getSession();
  if (!session) return refuse('notAllowed', 403);
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const company = String(form?.get('company') ?? '');
  const folder = String(form?.get('folder') ?? '');
  if (!(file instanceof File) || !UUID.test(company) || !FOLDERS.has(folder)) return refuse('fields', 400);
  const mine = session.access.companies.find((c) => c.id === company);
  const allowed = staffLevel(session.access, 'reg') >= 2 || (mine && (mine.levels.mship >= 2 || mine.levels.profile >= 3));
  if (!allowed) return refuse('notAllowed', 403);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkDocument(file.name, bytes);
  if (!check.ok) return refuse(check.reason, 400);
  const path = `${company}/${folder}/${randomUUID()}.${check.ext}`;
  const up = await createAdminClient().storage.from('member-docs').upload(path, bytes, { contentType: check.mime });
  if (up.error) {
    console.error('member document upload failed');
    return refuse('generic', 500);
  }
  return NextResponse.json({ path, name: file.name.slice(0, 200) }, { headers: NO_STORE });
}
