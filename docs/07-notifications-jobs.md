# 07 · Notifications, emails and scheduled jobs

Channels this phase: **email + portal + Android app push** (no WhatsApp, no SMS). Push rules (no personal data in the
push text, categories, device tokens) are in `15-mobile-app.md` §6. Every notification is one call:
`notify({ to: user|company|staffRole, template, data, link })` → inserts `notifications` (Realtime pushes it) and
sends the email in the recipient's language (`profiles.lang`), with the English copy when `settings.lang.emailCopy`.

## Email templates (seed `email_templates`; editable in admin → Notifications)

| key | Trigger | To |
|---|---|---|
| `account_verify` | registration | applicant |
| `staff_invite` / `user_invite` | invitation | invitee |
| `membership_received` | submit | applicant |
| `endorse_request` | request sent | endorser company Owner/Manager |
| `endorse_reminder` | day 3 / manual | endorser |
| `endorse_signed` | endorser signed | applicant |
| `endorse_declined` | endorser declined | applicant |
| `endorse_expired` | 7 days passed | applicant + endorser |
| `endorse_otp` | signing code | endorser |
| `membership_returned` | return | applicant |
| `membership_verified` | verify | applicant |
| `membership_approved_voucher` | committee approve (PDF voucher attached) | applicant |
| `membership_rejected` | reject | applicant |
| `payment_receipt_received` | receipt uploaded | applicant + Accounts queue |
| `payment_verified` / `payment_rejected` | Accounts | applicant |
| `temp_issued` (certificate attached) | temp issue | member |
| `temp_alert_15` / `temp_alert_7` | job | member + Membership desk |
| `temp_expired` / `temp_extended` | job / SG | member |
| `permanent_issued` | convert | member |
| `dispatch_update` | courier/tracking entered | member |
| `service_received` / `service_returned` / `service_issued` | service flow | member |
| `ticket_reply` | complaint reply | member / visitor |
| `renewal_reminder` | 1 March job | member |

## Scheduled jobs (`pg_cron` → `POST /api/cron/<job>` with `Authorization: Bearer $CRON_SECRET`)

| Job | Schedule (PKT) | Does |
|---|---|---|
| `temp-alerts` | daily 09:00 | send 15/7-day alerts once (track in `temp_memberships.alerts_sent`) |
| `temp-expire` | hourly | active & expires_at < now → expired; member TempExpired; QR Expired |
| `endorsements` | hourly | day-3 reminder; expiry → Expired + notify |
| `vouchers` | daily 00:30 | Unpaid & due < now → Expired |
| `sla` | every 15 min | flag service requests due in < 4 h and breached |
| `invites` | daily | Invited & expires < now → Expired |
| `renewals` | 1 March 09:00 | renewal vouchers (subscription only) + email |
| `digest` | weekdays 08:30 | staff morning digest per role (counts in their queues) |
| `backup-check` | daily | verify last backup exists; alert SG if not |

Every job is idempotent (safe to run twice) and logs a summary row in `audit_log` (`user_name='System'`).
