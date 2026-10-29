/**
 * The emails the platform sends (Notification Center, prototype admin/notify): the `email_log.template_key` each one
 * is recorded under, what triggers it, its wording (messages/*.json keys — English and Urdu in every email) and sample
 * values for "Send test". Every one is also shown in the member portal. Wording changes ship with a release
 * (TODO(MCCI): MCCI's own wording, docs/14).
 */
export interface EmailTemplate {
  key: string;
  event: string; // messages key under eng.notify.events
  subject: string;
  paragraphs: string[];
  path: string;
  sample: Record<string, string>;
}

const svc = {
  token: 'MCCI-2026-10482',
  service: 'Certificate of Origin',
  voucher: 'PV-2026-0001',
  code: 'MCCI-QR-ABCDE-23456',
};
const pay = {
  voucher: 'PV-2026-0001',
  amount: 'PKR 17,500',
  no: 'MCCI-C-1134',
  code: 'MCCI-QR-ABCDE-23456',
  until: '25 Dec 2026',
};

export const TEMPLATES: EmailTemplate[] = [
  {
    key: 'payment_receipt_received',
    event: 'receiptReceived',
    subject: 'pay.email.receivedSubject',
    paragraphs: ['pay.email.receivedBody'],
    path: '/portal/payments',
    sample: pay,
  },
  {
    key: 'payment_verified',
    event: 'paymentVerified',
    subject: 'pay.email.verifiedSubject',
    paragraphs: ['pay.email.verifiedBody'],
    path: '/portal/payments',
    sample: pay,
  },
  {
    key: 'payment_rejected',
    event: 'paymentRejected',
    subject: 'pay.email.rejectedSubject',
    paragraphs: ['pay.email.rejectedBody'],
    path: '/portal/payments',
    sample: pay,
  },
  {
    key: 'temp_issued',
    event: 'tempIssued',
    subject: 'pay.email.tempSubject',
    paragraphs: ['pay.email.verifiedBody', 'pay.email.tempBody'],
    path: '/portal/documents',
    sample: pay,
  },
  {
    key: 'temp_extended',
    event: 'tempExtended',
    subject: 'temp.email.extendedSubject',
    paragraphs: ['temp.email.extendedBody'],
    path: '/portal/membership',
    sample: pay,
  },
  {
    key: 'service_received',
    event: 'serviceReceived',
    subject: 'svc.email.receivedSubject',
    paragraphs: ['svc.email.receivedBody', 'svc.email.feeBody'],
    path: '/portal/applications',
    sample: svc,
  },
  {
    key: 'service_returned',
    event: 'serviceReturned',
    subject: 'svc.email.returnedSubject',
    paragraphs: ['svc.email.returnedBody'],
    path: '/portal/applications',
    sample: svc,
  },
  {
    key: 'service_rejected',
    event: 'serviceRejected',
    subject: 'svc.email.rejectedSubject',
    paragraphs: ['svc.email.rejectedBody'],
    path: '/portal/applications',
    sample: svc,
  },
  {
    key: 'service_issued',
    event: 'serviceIssued',
    subject: 'svc.email.issuedSubject',
    paragraphs: ['svc.email.issuedBody'],
    path: '/portal/applications',
    sample: svc,
  },
  {
    key: 'event_registered',
    event: 'eventRegistered',
    subject: 'eng.email.eventSubject',
    paragraphs: ['eng.email.eventBody'],
    path: '/portal/events',
    sample: { title: 'Export Seminar', when: '5 Nov 2026, 11:00', venue: 'MCCI Hall' },
  },
  {
    key: 'ticket_reply',
    event: 'ticketReply',
    subject: 'eng.email.replySubject',
    paragraphs: ['eng.email.replyBody'],
    path: '/portal/support',
    sample: { ticket: 'TK-2026-0001' },
  },
  {
    key: 'ticket_resolved',
    event: 'ticketResolved',
    subject: 'eng.email.resolvedSubject',
    paragraphs: ['eng.email.resolvedBody'],
    path: '/portal/support',
    sample: { ticket: 'TK-2026-0001' },
  },
];

/** other emails the platform sends, listed with their counts (their wording is built where they are sent) */
export const OTHER_TEMPLATES = [
  'membership_submitted',
  'membership_returned',
  'membership_verified',
  'membership_rejected',
  'membership_approved_voucher',
  'endorse_request',
  'endorse_code',
  'temp_expired',
] as const;
