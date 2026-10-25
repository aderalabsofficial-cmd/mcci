import 'server-only';
import { bilingualEmail } from '@/lib/email/bilingual';
import type { OutgoingEmail } from '@/lib/email/send';
import { bankDetails, pkr, voucherDate } from '@/lib/committee/voucher';

/**
 * membership_approved_voucher (docs/07): the committee's approval, the membership number and the payment voucher —
 * amount and due date as created in the database. The bank account is shown only once MCCI has confirmed it
 * (settings.bank.confirmed, docs/14 item 4); until then the applicant is asked to wait for it.
 */
export function voucherEmail(
  v: {
    to: string;
    name: string | null;
    token: string;
    memberNo: string;
    voucherNo: string;
    amount: number;
    dueAt: string;
    bank: Record<string, unknown>;
  },
  env: NodeJS.ProcessEnv = process.env,
): OutgoingEmail {
  const bank = bankDetails(v.bank);
  return bilingualEmail(
    {
      to: v.to,
      name: v.name,
      subject: 'committee.email.approvedSubject',
      vars: {
        token: v.token,
        no: v.memberNo,
        voucher: v.voucherNo,
        amount: pkr(v.amount),
        due: voucherDate(v.dueAt, 'en'),
        ...(bank ?? {}),
      },
      paragraphs: [
        'committee.email.approvedBody',
        'committee.email.voucherBody',
        bank ? 'committee.email.bankBody' : 'committee.email.bankPending',
      ],
      action: { label: 'committee.email.open', path: '/portal/payments' },
    },
    env,
  );
}
