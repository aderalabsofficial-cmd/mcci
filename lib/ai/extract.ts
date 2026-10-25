import 'server-only';
import OpenAI from 'openai';
import type { FileKind } from '@/lib/files/sniff';
import type { AppForm } from '@/lib/flow/application';

/**
 * AI reading of application documents (docs/08 "AI extraction", action wiz.ai). One OpenAI call per document with
 * Structured Outputs (strict JSON schema per document type); every field comes back as { value, confidence 0–100 }.
 * Runs on the server only (OPENAI_API_KEY never reaches a browser). Documents of one applicant are never combined with
 * another's, and nothing here logs document content or the model's answer. On a schema failure the call is retried
 * once; after that the fields stay empty for the applicant to type.
 *
 *   AI_EXTRACTION         must be "on" (the owner's explicit approval, docs/14 D-M13); anything else = off
 *   OPENAI_API_KEY        required as well; without it AI reading is switched off and the button says why
 *   OPENAI_MODEL_EXTRACT  model with vision + structured outputs (default below)
 *   OPENAI_BASE_URL       optional (tests point it at a local fake)
 */

export const DEFAULT_MODEL = 'gpt-4.1-mini';
export const aiEnabled = (env: NodeJS.ProcessEnv = process.env) =>
  env.AI_EXTRACTION === 'on' && Boolean(env.OPENAI_API_KEY?.trim());
export const aiModel = (env: NodeJS.ProcessEnv = process.env) => env.OPENAI_MODEL_EXTRACT?.trim() || DEFAULT_MODEL;

interface Field {
  value: string | null;
  confidence: number;
}
export type Extracted = Record<string, Field | Field[] | { name: Field; cnic: Field }[]>;

const field = {
  type: 'object',
  additionalProperties: false,
  required: ['value', 'confidence'],
  properties: { value: { type: ['string', 'null'] }, confidence: { type: 'integer', minimum: 0, maximum: 100 } },
};
const obj = (props: Record<string, unknown>) => ({
  type: 'object',
  additionalProperties: false,
  required: Object.keys(props),
  properties: props,
});

/** what to read from each document type (docs/08 schemas; keys map to applications.form in mergeExtraction) */
export const SCHEMAS: Record<string, { schema: Record<string, unknown>; instructions: string }> = {
  cnic: {
    schema: obj({ rep: field, cnic: field, dob: field, address: field }),
    instructions:
      'Pakistani CNIC (computerised national identity card) or passport. rep = the holder name in English; cnic = the 13-digit number formatted 12345-1234567-1; dob = date of birth as YYYY-MM-DD; address = the address printed on the card.',
  },
  ntn: {
    schema: obj({ name: field, ntn: field, address: field, regDate: field }),
    instructions:
      'FBR National Tax Number certificate. name = the registered business / taxpayer name; ntn = the NTN as printed (e.g. 1234567-8); address = the business address; regDate = registration date as YYYY-MM-DD.',
  },
  st: {
    schema: obj({ gst: field, name: field }),
    instructions:
      'Sales tax registration certificate. gst = the sales tax registration number (STRN); name = the registered name.',
  },
  inc: {
    schema: obj({
      name: field,
      incNo: field,
      incDate: field,
      directors: { type: 'array', maxItems: 6, items: obj({ name: field, cnic: field }) },
    }),
    instructions:
      'SECP certificate of incorporation. name = company name; incNo = incorporation number; incDate = date of incorporation as YYYY-MM-DD; directors = directors named on the document, if any.',
  },
  forma: {
    schema: obj({
      name: field,
      incNo: field,
      incDate: field,
      directors: { type: 'array', maxItems: 6, items: obj({ name: field, cnic: field }) },
    }),
    instructions:
      'SECP Form A / Form 9 (annual return / particulars of directors). name = company name; incNo = incorporation number; incDate = incorporation date as YYYY-MM-DD; directors = each director with name and CNIC formatted 12345-1234567-1.',
  },
  bank: {
    schema: obj({ accountTitle: field, bank: field, iban: field }),
    instructions:
      'Bank account maintenance certificate. accountTitle = the account title; bank = bank and branch; iban = the IBAN.',
  },
  addr: {
    schema: obj({ address: field }),
    instructions:
      'Lease deed, allotment letter or utility bill used as proof of business address. address = the full business address.',
  },
};
export const READABLE = Object.keys(SCHEMAS);

const SYSTEM =
  'You read one Pakistani business document for the Multan Chamber of Commerce & Industry membership form. Return only what is printed on the document. Use null with confidence 0 for anything not present or unreadable; never guess. Confidence is your certainty (0-100) that the value is exactly what is printed. Write names and addresses in English as printed.';

export async function extractDocument(
  key: string,
  file: { bytes: Uint8Array; kind: FileKind },
  opts: { client?: OpenAI; model?: string } = {},
): Promise<Extracted> {
  const spec = SCHEMAS[key];
  if (!spec) throw new Error(`no schema for document ${key}`);
  const client = opts.client ?? new OpenAI();
  const b64 = Buffer.from(file.bytes).toString('base64');
  const content =
    file.kind === 'pdf'
      ? { type: 'input_file' as const, filename: `${key}.pdf`, file_data: `data:application/pdf;base64,${b64}` }
      : {
          type: 'input_image' as const,
          image_url: `data:${file.kind === 'png' ? 'image/png' : 'image/jpeg'};base64,${b64}`,
          detail: 'high' as const,
        };
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await client.responses.create({
        model: opts.model ?? aiModel(),
        input: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: [{ type: 'input_text', text: spec.instructions }, content] },
        ],
        text: { format: { type: 'json_schema', name: `mcci_${key}`, schema: spec.schema, strict: true } },
        store: false,
      });
      return JSON.parse(res.output_text) as Extracted;
    } catch (error) {
      lastError = error;
      // retry once only for a malformed answer; API errors (auth, quota, network) are not retried
      if (!(error instanceof SyntaxError)) break;
    }
  }
  throw lastError;
}

const val = (f: unknown): Field | null =>
  f && typeof f === 'object' && 'value' in f && typeof (f as Field).value === 'string' && (f as Field).value!.trim()
    ? { value: (f as Field).value!.trim(), confidence: Math.max(0, Math.min(100, Math.round((f as Field).confidence))) }
    : null;

/** document field → form field, with priority (higher wins on equal footing; docs/08 merge rule) */
const MAP: { doc: string; from: string; to: keyof AppForm; priority: number }[] = [
  { doc: 'ntn', from: 'name', to: 'name', priority: 3 },
  { doc: 'ntn', from: 'address', to: 'address', priority: 3 },
  { doc: 'ntn', from: 'ntn', to: 'ntn', priority: 3 },
  { doc: 'cnic', from: 'rep', to: 'rep', priority: 3 },
  { doc: 'cnic', from: 'cnic', to: 'cnic', priority: 3 },
  { doc: 'st', from: 'gst', to: 'gst', priority: 3 },
  { doc: 'inc', from: 'incDate', to: 'est', priority: 3 },
  { doc: 'forma', from: 'incDate', to: 'est', priority: 2 },
  { doc: 'ntn', from: 'regDate', to: 'est', priority: 1 },
  { doc: 'inc', from: 'name', to: 'name', priority: 2 },
  { doc: 'forma', from: 'name', to: 'name', priority: 2 },
  { doc: 'st', from: 'name', to: 'name', priority: 1 },
  { doc: 'bank', from: 'accountTitle', to: 'name', priority: 1 },
  { doc: 'addr', from: 'address', to: 'address', priority: 2 },
];

export interface MergeResult {
  form: Partial<AppForm>;
  confidence: Record<string, number>;
  source: Record<string, string>;
  directors: { name: string; cnic: string | null }[];
  filled: number;
}

/**
 * Combines the readings into form values. The NTN certificate wins the business name and address, the CNIC the
 * representative; otherwise the higher priority, then the higher confidence wins. A field the applicant has already
 * checked or typed (confidence 100, or a value without an AI confidence) is never overwritten.
 */
export function mergeExtraction(
  readings: Record<string, Extracted>,
  current: AppForm,
  currentConfidence: Record<string, number>,
): MergeResult {
  const best = new Map<string, { value: string; confidence: number; priority: number; doc: string }>();
  for (const m of MAP) {
    const f = val(readings[m.doc]?.[m.from]);
    if (!f) continue;
    const prev = best.get(m.to);
    if (!prev || m.priority > prev.priority || (m.priority === prev.priority && f.confidence > prev.confidence)) {
      best.set(m.to, { value: f.value!, confidence: f.confidence, priority: m.priority, doc: m.doc });
    }
  }
  const out: MergeResult = { form: {}, confidence: {}, source: {}, directors: [], filled: 0 };
  for (const [to, f] of best) {
    const had = String((current as Record<string, unknown>)[to] ?? '').trim();
    const conf = currentConfidence[to];
    const userOwned = conf === 100 || (had !== '' && conf === undefined);
    if (userOwned) continue;
    (out.form as Record<string, string>)[to] = f.value;
    out.confidence[to] = f.confidence;
    out.source[to] = f.doc;
    out.filled++;
  }
  const dirs = (readings.forma?.directors ?? readings.inc?.directors ?? []) as { name: Field; cnic: Field }[];
  for (const d of dirs.slice(0, 6)) {
    const name = val(d.name);
    if (name) out.directors.push({ name: name.value!, cnic: val(d.cnic)?.value ?? null });
  }
  return out;
}
