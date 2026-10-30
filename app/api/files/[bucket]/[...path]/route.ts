import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getSession } from '@/lib/permissions/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/files/{bucket}/{path}[?download=1]: a confidential file for staff (migration 0460, docs/22 §4).
 * api.file_access decides and logs every request under the staff member's own session: viewing is allowed where the
 * work needs it (application documents, receipts, service documents); the original file (download=1) only to the
 * IT Convener. Images are shown watermarked with the viewer's name and the time; a PDF is shown inline. The file is
 * read with the service role only after that decision — staff can no longer read these buckets from storage.
 */
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff' };
const BUCKETS = new Set(['application-docs', 'receipts', 'service-docs', 'form-snapshots']);

const TYPE: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export async function GET(req: Request, { params }: { params: Promise<{ bucket: string; path: string[] }> }) {
  const { bucket, path: parts } = await params;
  const path = parts.map(decodeURIComponent).join('/');
  const download = new URL(req.url).searchParams.get('download') === '1';
  const session = await getSession();
  if (!session || !BUCKETS.has(bucket))
    return NextResponse.json({ error: 'not_allowed' }, { status: 403, headers: NO_STORE });
  const supabase = await createClient();
  const { data: ok, error } = await supabase
    .schema('api')
    .rpc('file_access', { p_bucket: bucket, p_path: path, p_mode: download ? 'download' : 'view' });
  if (error || ok !== true) return NextResponse.json({ error: 'not_allowed' }, { status: 403, headers: NO_STORE });
  const { data: file } = await createAdminClient().storage.from(bucket).download(path);
  if (!file) return NextResponse.json({ error: 'not_found' }, { status: 404, headers: NO_STORE });
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const type = TYPE[ext] ?? 'application/octet-stream';
  const name = path.split('/').pop() ?? 'file';
  const marked = !download && (type === 'image/jpeg' || type === 'image/png');
  const raw = Buffer.from(await file.arrayBuffer());
  const who = session.access.full_name ?? session.access.email ?? 'MCCI staff';
  const role = session.access.staff?.designation ?? session.access.companies[0]?.role ?? '';
  const body = marked ? await watermark(raw, role ? `${who} (${role})` : who) : raw;
  return new NextResponse(new Uint8Array(body), {
    headers: {
      ...NO_STORE,
      'Content-Type': marked ? 'image/jpeg' : type,
      'Content-Disposition': download ? `attachment; filename="${name.replace(/[^A-Za-z0-9._-]/g, '_')}"` : 'inline',
    },
  });
}

/** the viewer's name and the time across the image, so a saved or photographed copy shows who viewed it */
async function watermark(bytes: Buffer, who: string): Promise<Buffer> {
  const img = sharp(bytes).rotate();
  const { width = 1000, height = 1400 } = await img.metadata();
  const when = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi' });
  const text = `${who} · ${when} · Confidential — MCCI`.replace(/[<>&"]/g, '');
  const size = Math.max(14, Math.round(width / 40));
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<g fill="#c0392b" fill-opacity="0.28" font-family="Arial, sans-serif" font-size="${size}" font-weight="700">` +
      [0.2, 0.5, 0.8]
        .map(
          (y) =>
            `<text x="50%" y="${Math.round(height * y)}" text-anchor="middle" transform="rotate(-20 ${width / 2} ${Math.round(height * y)})">${text}</text>`,
        )
        .join('') +
      `</g></svg>`,
  );
  return img
    .composite([{ input: svg, left: 0, top: 0 }])
    .jpeg({ quality: 80 })
    .toBuffer();
}
