import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { bilingualEmail } from '@/lib/email/bilingual';
import { sendEmail } from '@/lib/email/send';
import { runEndorsementJobs } from '@/lib/endorse/admin';
import { msg } from '@/lib/nav/model';

/**
 * Hourly endorsement job (docs/04 "Jobs"): the day-N reminder (once) and expiry, then the emails. Called by the
 * server's timer with `Authorization: Bearer <CRON_SECRET>`; anything else gets 401. Returns counts only.
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
  const rows = await runEndorsementJobs();
  let sent = 0;
  for (const r of rows) {
    if (!r.email) continue;
    const role = msg('en', `endorse.roles.${r.role === 'seconder' ? 'seconder' : 'proposer'}`);
    try {
      await sendEmail(
        bilingualEmail(
          r.kind === 'expired'
            ? {
                to: r.email,
                name: r.full_name,
                subject: 'endorse.email.expiredSubject',
                vars: { role, token: r.token ?? '' },
                paragraphs: ['endorse.email.expiredBody'],
                action: { label: 'endorse.email.choose', path: '/portal/join#endorse' },
              }
            : {
                to: r.email,
                name: r.full_name,
                subject: 'endorse.email.remindSubject',
                vars: { applicant: r.business ?? '', business: r.business ?? '', role, token: r.token ?? '' },
                paragraphs: ['endorse.email.remindBody'],
                action: { label: 'endorse.email.open', path: '/portal/endorse' },
              },
        ),
      );
      sent++;
    } catch {
      // the portal message is already written; the next run does not resend (the database marked it)
    }
  }
  return NextResponse.json({ ok: true, processed: rows.length, emailed: sent });
}
