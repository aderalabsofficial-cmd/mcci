import 'server-only';
import OpenAI from 'openai';
import { aiModel } from '@/lib/ai/extract';

/**
 * Reading one scanned membership certificate printed by the State Bank security printing press (docs/21 point 30,
 * migration 0450). Structured Outputs: every field comes back with a certainty; the database matches the member and
 * lists the conflicts, and a person confirms before anything is saved. Nothing here changes a record; neither the
 * file nor the answer is stored by OpenAI (store: false) or logged.
 */

/** what MCCI's security-press certificate prints (sample of 28 Oct 2026) */
export const CERT_FIELDS = [
  'membership_no',
  'company_name',
  'class',
  'membership_year',
  'valid_to',
  'issued_on',
  'ntn',
  'book_no',
  'serial_no',
] as const;
export type CertField = (typeof CERT_FIELDS)[number];
export type CertReading = Record<CertField, { value: string | null; confidence: number }>;

const field = {
  type: 'object',
  additionalProperties: false,
  required: ['value', 'confidence'],
  properties: { value: { type: ['string', 'null'] }, confidence: { type: 'integer', minimum: 0, maximum: 100 } },
};
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [...CERT_FIELDS],
  properties: Object.fromEntries(CERT_FIELDS.map((f) => [f, field])),
};

const SYSTEM =
  'You read one scanned membership certificate of the Multan Chamber of Commerce & Industry, printed on security paper. Return exactly what is printed, never guess; use null with confidence 0 for anything missing or unreadable. Confidence (0-100) is your certainty that the value is exactly what is printed. Fields: membership_no (as printed at the top and after "Membership No.", e.g. C-869), company_name (the member firm / company certified, not the Chamber), class (Corporate or Associate), membership_year (e.g. 2026-2027), valid_to (the "valid upto" date as printed), issued_on (the "Given on this … day of …" date as printed), ntn (the N.T.N. No. of the member), book_no and serial_no (the security paper numbers printed at the top, e.g. "Book No.B 19346" and "Serial No.B 1934589" — give the numbers with their letter, e.g. B 19346).';

/** null when the reading failed (the scan is then marked unreadable and reviewed by hand) */
export async function readCertificate(
  bytes: Uint8Array,
  kind: 'png' | 'jpeg',
  opts: { client?: OpenAI; model?: string } = {},
): Promise<CertReading | null> {
  const client = opts.client ?? new OpenAI();
  try {
    const res = await client.responses.create({
      model: opts.model ?? aiModel(),
      input: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'input_text', text: 'Read this certificate.' },
            {
              type: 'input_image',
              image_url: `data:${kind === 'png' ? 'image/png' : 'image/jpeg'};base64,${Buffer.from(bytes).toString('base64')}`,
              detail: 'high',
            },
          ],
        },
      ],
      text: { format: { type: 'json_schema', name: 'mcci_certificate', schema: SCHEMA, strict: true } },
      store: false,
    });
    const raw = JSON.parse(res.output_text) as Partial<CertReading>;
    const out = {} as CertReading;
    for (const k of CERT_FIELDS) {
      const f = raw[k];
      const value = typeof f?.value === 'string' && f.value.trim() ? f.value.trim().slice(0, 200) : null;
      out[k] = { value, confidence: value ? Math.max(0, Math.min(100, Math.round(Number(f?.confidence) || 0))) : 0 };
    }
    return out;
  } catch (error) {
    console.error('certificate reading failed', (error as Error)?.name);
    return null;
  }
}
