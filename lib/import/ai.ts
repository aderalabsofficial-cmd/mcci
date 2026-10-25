import 'server-only';
import OpenAI from 'openai';
import { aiModel } from '@/lib/ai/extract';
import { FIELDS, type Field } from '@/lib/import/normalize';

/**
 * Reading a PDF member directory (typed or scanned) with AI, for the import preview (docs/13; docs/08 AI rules).
 * Used only when AI reading is on (AI_EXTRACTION, docs/14 D-M13) and the admin ticked, for this upload, that the file
 * may be sent to OpenAI. One call per file with Structured Outputs; every value comes back with a certainty, which
 * the preview shows. Nothing is written from here: the rows go to the same preview and checks as a spreadsheet's,
 * and low-certainty rows are not selected for import. Neither the file nor the answer is logged or stored by OpenAI
 * (store: false).
 */

// one answer must arrive within the time limit below: about 40 members (a few pages) per PDF
export const PDF_MAX_MEMBERS = 40;
/** the app's nginx gives a request 60 s (deploy/web/nginx): the reading must answer before that, or it is reported */
export const PDF_TIMEOUT_MS = 50_000;

const field = {
  type: 'object',
  additionalProperties: false,
  required: ['value', 'confidence'],
  properties: { value: { type: ['string', 'null'] }, confidence: { type: 'integer', minimum: 0, maximum: 100 } },
};
const member = {
  type: 'object',
  additionalProperties: false,
  required: [...FIELDS],
  properties: Object.fromEntries(FIELDS.map((f) => [f, field])),
};
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['members', 'more_than_limit'],
  properties: {
    members: { type: 'array', maxItems: PDF_MAX_MEMBERS, items: member },
    more_than_limit: { type: 'boolean' },
  },
};

const SYSTEM = `You read a member directory of the Multan Chamber of Commerce & Industry (a list or table of existing members, possibly scanned). Return one entry per member, in the order printed, with exactly what is printed: never guess, never fill in a value that is not on the page, use null with confidence 0 for anything missing or unreadable. Confidence (0-100) is your certainty that the value is exactly what is printed. Fields: membership_no (e.g. MCCI-C-1134, or the number as printed), class (Corporate or Associate, as printed), women (Y if marked as a women member, else null), company_name, business_type (as printed: proprietorship, partnership/AOP, private limited, public limited, MNC), sector (nature of business), address, ntn, gst (sales tax number), representative_name, mobile, email, member_since and valid_to (dates as printed), status (as printed), certificate_serial. If the directory has more than ${PDF_MAX_MEMBERS} members, return the first ${PDF_MAX_MEMBERS} and set more_than_limit to true.`;

interface Read {
  value: string | null;
  confidence: number;
}

export interface PdfReading {
  rows: { cells: Partial<Record<Field, string>>; confidence: Partial<Record<Field, number>> }[];
  truncated: boolean;
}

export async function readPdfDirectory(bytes: Uint8Array, opts: { client?: OpenAI; model?: string } = {}): Promise<PdfReading> {
  const client = opts.client ?? new OpenAI({ timeout: PDF_TIMEOUT_MS, maxRetries: 0 });
  const res = await client.responses.create({
    model: opts.model ?? aiModel(),
    input: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: [
          { type: 'input_text', text: 'Read every member in this directory.' },
          { type: 'input_file', filename: 'directory.pdf', file_data: `data:application/pdf;base64,${Buffer.from(bytes).toString('base64')}` },
        ],
      },
    ],
    text: { format: { type: 'json_schema', name: 'mcci_member_directory', schema: SCHEMA, strict: true } },
    max_output_tokens: 16_000,
    store: false,
  });
  // an answer cut off by the length limit is not valid JSON: the caller reports "too long, split the PDF"
  const out = JSON.parse(res.output_text) as { members: Record<Field, Read>[]; more_than_limit: boolean };
  return {
    truncated: out.more_than_limit,
    rows: out.members.map((m) => {
      const cells: Partial<Record<Field, string>> = {};
      const confidence: Partial<Record<Field, number>> = {};
      for (const f of FIELDS) {
        const v = m[f]?.value?.trim();
        if (!v) continue;
        cells[f] = v;
        confidence[f] = Math.max(0, Math.min(100, Math.round(m[f]!.confidence))) / 100;
      }
      return { cells, confidence };
    }),
  };
}
