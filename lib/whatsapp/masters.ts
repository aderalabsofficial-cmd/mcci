/**
 * The four MCCI master templates (migration 0630, docs/30 §10): shared by the composer, the Templates screen and the
 * tests. The database holds the wording and checks every field again; this mirrors those checks so staff see the
 * problem before anything is submitted.
 */
export const MASTER_KEYS = ['announcements', 'membership', 'events', 'opportunities'] as const;
export type MasterKey = (typeof MASTER_KEYS)[number];
export type MasterLanguage = 'en' | 'ur';

export interface MasterSlot {
  n: number;
  key: string;
  source: 'recipient' | 'field';
  max?: number;
  required?: boolean;
  default_en?: string;
  default_ur?: string;
  example_en: string;
  example_ur: string;
}

export interface MasterVersion {
  language: MasterLanguage;
  version: number;
  header: string;
  body: string;
  footer: string | null;
  updatedAt: string;
  templateId: string | null;
  /** the provider's status; LOCAL = not on the provider yet, NOT_ON_PROVIDER = was listed before, is no longer */
  status: string;
  providerCategory: string | null;
  syncedAt: string | null;
  /** approved or under review on Meta: the wording cannot change here */
  locked: boolean;
}

export interface Master {
  key: MasterKey;
  name: string;
  metaCategory: 'MARKETING' | 'UTILITY';
  slots: MasterSlot[];
  versions: MasterVersion[];
}

export const fieldSlots = (m: Master) => m.slots.filter((s) => s.source === 'field');

/** what each field turns into for this language: typed value, else the slot's default, else empty */
export function fieldValues(m: Master, language: MasterLanguage, typed: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of fieldSlots(m)) out[s.key] = typed[s.key]?.trim() || (language === 'ur' ? s.default_ur : s.default_en) || '';
  return out;
}

/** the first problem with a field (its key), or null; the same rules as private.wa_master_fields */
export function fieldProblem(m: Master, language: MasterLanguage, typed: Record<string, string>): string | null {
  const values = fieldValues(m, language, typed);
  for (const s of fieldSlots(m)) {
    const v = values[s.key] ?? '';
    if (!v && s.required !== false) return s.key;
    if (v.length > (s.max ?? 0) || /[\n\r\t]/.test(v) || / {5}/.test(v) || v.includes('{{')) return s.key;
    if (s.key === 'link' && !/^https:\/\/\S{4,200}$/.test(v)) return s.key;
  }
  return null;
}

/** {{n}} filled from recipient values and fields; a value that is missing shows as its own name, so it is seen */
export function fillMaster(body: string, slots: MasterSlot[], values: Record<string, string | null | undefined>): string {
  return slots.reduce((text, s) => text.replaceAll(`{{${s.n}}}`, values[s.key] || `[${s.key}]`), body);
}

/** the wording rules of api.wa_master_save: each slot once, nothing else, never a variable first or last */
export function wordingProblem(body: string, header: string, footer: string, slotCount: number): string | null {
  const found = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((x) => Number(x[1]));
  const want = Array.from({ length: slotCount }, (_, i) => i + 1);
  if (!header.trim() || header.length > 60 || header.includes('{{')) return 'header';
  if (footer.length > 60 || footer.includes('{{')) return 'footer';
  if (!body.trim() || body.length > 1024) return 'body';
  if (found.length !== slotCount || [...new Set(found)].sort((a, b) => a - b).join() !== want.join()) return 'variables';
  if (/^\{\{/.test(body.trim()) || /\}\}$/.test(body.trim()) || /\}\}\s*\{\{/.test(body)) return 'placement';
  return null;
}

/** Meta's template-creation fields, for the person submitting the version in WhatsApp Manager */
export function submission(m: Master, v: MasterVersion) {
  return {
    name: m.name,
    category: m.metaCategory,
    language: v.language,
    header: v.header,
    body: v.body,
    footer: v.footer ?? '',
    examples: m.slots.map((s) => (v.language === 'ur' ? s.example_ur : s.example_en)),
  };
}
