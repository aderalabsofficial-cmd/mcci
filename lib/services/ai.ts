import 'server-only';
import OpenAI from 'openai';
import { aiModel } from '@/lib/ai/extract';
import type { FileKind } from '@/lib/files/sniff';

/**
 * svc.ai: AI reads the member's uploaded documents for one service request and fills the service's details (docs/08
 * rules: Structured Outputs, value + certainty per field, never guessed, nothing stored by OpenAI). The member checks
 * every field before submitting; nothing is sent to MCCI by this call.
 */

const field = {
  type: 'object',
  additionalProperties: false,
  required: ['value', 'confidence'],
  properties: { value: { type: ['string', 'null'] }, confidence: { type: 'integer', minimum: 0, maximum: 100 } },
};

export interface ServiceReading {
  values: Record<string, string>;
  confidence: Record<string, number>;
}

export async function readServiceDocuments(
  service: string,
  fields: string[],
  files: { bytes: Uint8Array; kind: FileKind; name: string }[],
  opts: { client?: OpenAI; model?: string } = {},
): Promise<ServiceReading> {
  const keys = fields.map((_, i) => `f${i}`);
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: keys,
    properties: Object.fromEntries(keys.map((k) => [k, field])),
  };
  const client = opts.client ?? new OpenAI({ timeout: 50_000, maxRetries: 0 });
  const content = files.slice(0, 4).map((f) => {
    const b64 = Buffer.from(f.bytes).toString('base64');
    return f.kind === 'pdf'
      ? { type: 'input_file' as const, filename: `${f.name || 'document'}.pdf`, file_data: `data:application/pdf;base64,${b64}` }
      : { type: 'input_image' as const, image_url: `data:${f.kind === 'png' ? 'image/png' : 'image/jpeg'};base64,${b64}`, detail: 'high' as const };
  });
  const res = await client.responses.create({
    model: opts.model ?? aiModel(),
    input: [
      {
        role: 'system',
        content:
          'You read documents a member of the Multan Chamber of Commerce & Industry uploaded for a service request. Return only what is printed. Use null with confidence 0 for anything not present or unreadable; never guess. Confidence (0-100) is your certainty that the value is exactly what is printed.',
      },
      {
        role: 'user',
        content: [
          { type: 'input_text', text: `Service: ${service}. Fields: ${fields.map((f, i) => `f${i} = ${f}`).join('; ')}.` },
          ...content,
        ],
      },
    ],
    text: { format: { type: 'json_schema', name: 'mcci_service_request', schema, strict: true } },
    store: false,
  });
  const out = JSON.parse(res.output_text) as Record<string, { value: string | null; confidence: number }>;
  const values: Record<string, string> = {};
  const confidence: Record<string, number> = {};
  fields.forEach((f, i) => {
    const v = out[`f${i}`];
    if (v?.value?.trim()) {
      values[f] = v.value.trim().slice(0, 500);
      confidence[f] = Math.max(0, Math.min(100, Math.round(v.confidence)));
    }
  });
  return { values, confidence };
}
