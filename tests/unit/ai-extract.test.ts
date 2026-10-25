import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { aiEnabled, mergeExtraction, SCHEMAS } = await import('@/lib/ai/extract');

const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;
const f = (value: string | null, confidence: number) => ({ value, confidence });

describe('AI document reading (docs/08)', () => {
  it('is off unless the owner switched it on AND a key is configured', () => {
    expect(aiEnabled(env({}))).toBe(false);
    expect(aiEnabled(env({ OPENAI_API_KEY: 'sk-x' }))).toBe(false);
    expect(aiEnabled(env({ AI_EXTRACTION: 'on' }))).toBe(false);
    expect(aiEnabled(env({ AI_EXTRACTION: 'yes', OPENAI_API_KEY: 'sk-x' }))).toBe(false);
    expect(aiEnabled(env({ AI_EXTRACTION: 'on', OPENAI_API_KEY: 'sk-x' }))).toBe(true);
  });

  it('every schema is strict: all properties required, no extra keys (OpenAI structured outputs)', () => {
    const strict = (s: Record<string, unknown>): boolean => {
      if (s.type === 'object') {
        const props = s.properties as Record<string, Record<string, unknown>>;
        return (
          s.additionalProperties === false &&
          JSON.stringify(s.required) === JSON.stringify(Object.keys(props)) &&
          Object.values(props).every(strict)
        );
      }
      if (s.type === 'array') return strict(s.items as Record<string, unknown>);
      return true;
    };
    for (const k of Object.keys(SCHEMAS)) expect(strict(SCHEMAS[k]!.schema), k).toBe(true);
  });

  it('merges readings: NTN wins name and address, CNIC the representative, user-checked fields stay', () => {
    const r = mergeExtraction(
      {
        ntn: {
          name: f('Fresh Traders', 80),
          address: f('22 Abdali Road', 75),
          ntn: f('1234567-8', 97),
          regDate: f(null, 0),
        },
        bank: { accountTitle: f('Fresh Traders Pvt', 99), bank: f('HBL', 90), iban: f('PK00', 90) },
        cnic: { rep: f('Amir Khan', 95), cnic: f('36302-1234567-1', 93), dob: f(null, 0), address: f(null, 0) },
        addr: { address: f('Plot 9, Multan', 99) },
      },
      { desig: 'Proprietor', tel: '061-1' },
      { tel: 100 },
    );
    expect(r.form).toEqual({
      name: 'Fresh Traders',
      address: '22 Abdali Road',
      ntn: '1234567-8',
      rep: 'Amir Khan',
      cnic: '36302-1234567-1',
    });
    expect(r.source).toMatchObject({ name: 'ntn', address: 'ntn', rep: 'cnic' });
    expect(r.confidence.address).toBe(75);
    const kept = mergeExtraction({ ntn: { name: f('AI Name', 90) } }, { name: 'Typed by me' }, {});
    expect(kept.form).toEqual({});
    const checked = mergeExtraction({ ntn: { name: f('AI Name', 90) } }, { name: 'Old AI' }, { name: 100 });
    expect(checked.form).toEqual({});
  });
});
