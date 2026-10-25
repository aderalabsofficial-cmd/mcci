import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { voucherDate } from '@/lib/committee/voucher';
import { bilingualEmail } from '@/lib/email/bilingual';
import { sendEmail } from '@/lib/email/send';
import { runTempJobs, runVoucherJobs } from '@/lib/temp/admin';

/**
 * Membership jobs (docs/07): temporary-membership alerts (alert1 / alert2 days, once each) and expiry, and past-due
 * vouchers → Expired. Called by the server's timer with `Authorization: Bearer <CRON_SECRET>` (the timer is a separate,
 * approval-gated step); anything else gets 401. Returns counts only.
 */
export const dynamic = 'force-dynamic';

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!secret || secret.length < 32 || got.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(secret));
}

export async function POST(req: Request) {
  if (!authorised(req)) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const rows = await runTempJobs();
  let emailed = 0;
  for (const r of rows) {
    if (!r.email) continue;
    const expired = r.kind === 'expired';
    try {
      await sendEmail(
        bilingualEmail({
          to: r.email,
          name: r.full_name,
          subject: expired ? 'temp.email.expiredSubject' : 'temp.email.alertSubject',
          paragraphs: [expired ? 'temp.email.expiredBody' : 'temp.email.alertBody'],
          vars: { no: r.member_no, until: voucherDate(r.expires_at, 'en') },
          action: { label: 'temp.email.openMembership', path: '/portal/membership' },
        }),
      );
      emailed++;
    } catch {
      // the portal message is written; the job does not resend (alerts_sent / status already changed)
    }
  }
  const vouchersExpired = await runVoucherJobs();
  return NextResponse.json({ ok: true, temp: rows.length, emailed, vouchersExpired });
}
