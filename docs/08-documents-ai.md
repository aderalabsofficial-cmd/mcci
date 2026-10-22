# 08 · Documents, AI extraction, official form, QR

## Upload pipeline
1. Client: accept pdf/jpg/png/heic ≤ 10 MB; phone camera allowed; show thumbnail.
2. Server action uploads to `application-docs/{company}/{application}/{key}/{uuid}`; HEIC → JPEG; PDF page 1 → PNG preview.
3. Virus/type check (magic bytes). Reject executables and encrypted PDFs with a friendly message.

## AI extraction (`lib/ai/extract.ts`)
- Model: OpenAI with **Structured Outputs** (`response_format: json_schema`, `strict: true`), one call per document
  type with its own schema; images sent as base64 (pages 1–2 only).
- Schemas (fields map to `applications.form` keys):
  - `cnic` → `{ rep, cnic, dob?, address? }` · `ntn` → `{ name, ntn, address, regDate? }`
  - `st` (sales tax) → `{ gst, name }` · `inc`/`forma` (SECP) → `{ name, incNo, incDate, directors[] }`
  - `bank` → `{ accountTitle, bank, iban }` · `addr` (utility/lease) → `{ address }`
- Each field returns `{ value, confidence 0–100, sourceDoc }`. Merge rule: highest confidence wins; NTN certificate
  wins for business name + address; CNIC wins for representative.
- Business rules after extraction: address on form vs NTN address → `addressMatchesNtn`; class rule; partners list
  from Form A/29 or deed.
- Never send documents of one applicant in the same prompt as another's. Do not store prompts with document
  content in logs. Retry once on schema failure; otherwise leave fields empty for manual entry.
- Cost guard: max 15 extraction calls per application per day.

## Passport photo
Client crop UI (35 × 45 mm ratio) with zoom/drag; server stores 350 × 450 JPEG (quality 0.9). Optional face
detection (browser `FaceDetector` when available) to auto-centre; otherwise centre crop.

## Signature & stamp
Signature pad → trimmed transparent PNG. Stamp upload → background removed (threshold on near-white) → PNG.
Endorser signatures stored in `application-docs/.../endorsements/{id}.png`.

## Official form PDF (`lib/pdf/official-form.tsx`)
Reproduce the prototype's 4-page Letter-size form (`docs.js` → `M.officialForm`) exactly:
page 1 letter + photo + rep/firm signature + stamp + "For official use" box (approval date, membership no., fee
received, class, year); page 2 particulars, business-type ticks, partners table (6 rows), proposer & seconder table
with digital signatures, declaration; pages 3–4 instructions, document lists per type and fee schedule from settings.
Also: blank form (Resources), payment voucher, temporary certificate, permanent certificate, service letters.

## QR & verification
- `documents.code` like `MCCI-QR-T7K2-0231` (random, unguessable 4-char block + sequence).
- QR encodes `${VERIFY_BASE_URL}/${code}`. `/api/verify/[code]` returns only: title, holder company, member no.,
  status (Valid/Temporary/Superseded/Expired/Revoked), valid to, superseded-by serial; increments `scans`.
- Endorsement refs are verifiable the same way.
