# Staff guide — signing in and managing membership applications

For the MCCI Membership Desk, the Secretary General and their deputies, on `https://app.mcci.aderalabs.tech`.
(During the demonstration period the Secretary General account is `secretary-mcci@aderalabs.tech`; it moves to the
MCCI domain at go-live.)

## 1. First Secretary General (once)

1. Open `https://app.mcci.aderalabs.tech/register`, enter the name and `secretary-mcci@aderalabs.tech`, choose a
   password (at least 10 characters).
2. Open the confirmation email ("Confirm your MCCI account") in that mailbox and click **Confirm my email**.
3. Tell the developer; they run `first-secretary-general.sh secretary-mcci@aderalabs.tech` on the server. This makes
   the account Secretary General (it works only while no other staff exist; everyone else is invited, step 3).

## 2. Signing in as staff (every time)

1. `https://app.mcci.aderalabs.tech/login` → tab **Staff** → email and password → **Sign in**.
2. **2-step login** (always for staff):
   - First time: the page shows a QR code. Scan it with Google Authenticator, Microsoft Authenticator or similar
     on your phone, then type the 6-digit code.
   - After that: type the 6-digit code from the app each time you sign in.
3. The admin panel opens. Without the 2-step code nothing in the admin panel works — also not through the API.

## 3. Inviting the rest of the team (Secretary General)

**Staff & Audit → Staff & Roles → Invite staff by email**: name, official email, designation (e.g. Membership Officer).
The person gets an email link, sets a password and their own 2-step login. What each designation may do is shown in
the same screen (levels per module; the Secretary General can change them).

| Designation | Membership applications |
|---|---|
| Membership Officer | open files, accept / reject documents, correct particulars, tick the checklist, return, verify |
| Deputy Secretary — Membership, Secretary General | the same, plus reject an application and override the class |
| President and other view-only roles | read the files only |

## 4. Managing applications

**Membership → Membership Pipeline** (`/admin/requests`): counts per stage, the stage board and the table of every
submitted application (search by token, company or stage). Click a token or a card to open it.

**Application Review** (one application):

1. **Start review** — a newly submitted file becomes "In review" (the applicant's tracker moves on).
2. **Documents** — for each document: **View** (opens the file for 10 minutes), **✓** accept, **✕** reject with a
   reason the applicant will read. Replaced documents show "(re-uploaded)".
3. **Particulars** — the pencil corrects a field; a reason is required and old → new is kept in the audit log.
4. **Officer checklist** — tick the four checks once you have verified them.
5. Decide:
   - **Return for correction** — write a note. The applicant gets an email and a portal message, sees only the
     rejected documents and your note, fixes them and resubmits; the file comes back to "In review".
   - **Verify documents** — only when every document is accepted and the checklist is complete. The applicant is
     told; the file waits for proposer & seconder (that step opens in the next release).
   - **Reject** (Secretary General / Deputy) — final, with a reason sent to the applicant.
6. **History** shows every step with who and when; **Emails to the applicant** shows whether each email was sent.
   If an email could not be sent, the decision is still saved and the applicant still sees the portal message.

**Official form** shows the filled 4-page MCCI form with photo, signature and stamp.

## 5. Proposer & seconder, Members Register (Release 3)

**Members Register** (`/admin/members`): **Add member** for existing MCCI members (company, class, membership number —
empty takes the next — representative, validity, owner's name and email). The owner gets an email invitation, signs
in and can then propose or second applicants. A verified file waits until its proposer and seconder have both signed;
then it goes to the Membership Committee by itself.

## 6. Membership Committee (Release 4)

Who: the **Committee Secretary** and the **Secretary General** record decisions (others with committee access can
only read). Every decision needs the 2-step login.

**Meetings & Minutes** (`/admin/meetings`): **Schedule meeting** — name, committee, date. A Membership Committee
meeting takes every file waiting for the committee onto its agenda (oldest first); files that reach the committee
later join the next open meeting by themselves. After the meeting, **Record minutes**.

**Committee Desk** (`/admin/committee`): the agenda of a meeting (choose the meeting at the top when there are several).
Decisions can be recorded on or after the meeting date:
- **Approve** — allocates the next membership number of the class (MCCI-C-… / MCCI-A-…), creates the payment voucher
  with the fee for the class (Women rates and extra cards included) and emails it; the applicant sees the number and
  the voucher under **Payments**. This cannot be undone.
- **Defer** — write the committee's reason; the file goes on the next Membership Committee meeting (or waits until
  one is scheduled). The applicant sees the reason in the portal.
- **Reject** — write the committee's reason; final; the applicant gets an email and a portal message.
- **Approve all on agenda** — approves every open file of that meeting (deferred files are no longer on it).

The voucher shows the bank account only after MCCI confirms it in the settings; until then it says "to be confirmed
by MCCI" and asks the applicant not to pay yet.

## 7. Payments and temporary membership (Release 5)

**Bank account first** (`/admin/payments`, Secretary General): **Enter the bank account** that MCCI's Accounts provide
(bank, account title, IBAN, branch), tick "MCCI Accounts confirmed this account" and save. Until then vouchers say
"to be confirmed by MCCI — please do not pay yet" and members cannot upload receipts.

**Payments** (`/admin/payments`, Accounts): receipts waiting for verification — **View receipt**, then **Verify**
(the money is in the bank statement) or **Reject** with a reason the member reads. **Vouchers & Receipts**
(`/admin/psid`): every voucher; **Paid at counter** records a payment received at the MCCI counter (receipt or bank
reference required); **Cancel voucher**; **Issue new voucher** for an expired or cancelled one.

A verified membership fee issues the **temporary membership** at once: member with the committee's number, temporary
certificate with QR (member's My Documents), 60 days, queued for printing. **Temporary Memberships** (`/admin/temp`):
days left; the SG can **Extend** or **Revoke** (reason required). **Documents & QR** (`/admin/documents`): every issued
document, open / print it, the SG can revoke it. Anyone can check a certificate at `/verify` or by scanning its QR.

## 8. Not yet in the system (next releases)

Print batches, certificate serials, receiving printed certificates and conversion to permanent, delivery. Until then
those steps are handled outside the system.
