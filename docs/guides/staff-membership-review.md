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

## 5. Not yet in the system (next releases)

Proposer & seconder requests and signatures, the committee agenda and decision with membership numbers, payment
vouchers and receipt verification, temporary membership and certificates with QR, printing and permanent
certificates. Until then those steps are handled outside the system.
