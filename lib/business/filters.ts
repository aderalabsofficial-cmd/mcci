import { z } from 'zod';

/**
 * The segment filter (docs/29): groups joined with AND; inside a group "all" or "any" of its conditions; a group can
 * exclude what it matches. Pure, used on both sides. This schema gives friendly errors; the database
 * (private.biz_where, migration 0570) is the authority and refuses anything outside its own fixed lists.
 */
export type FieldType = 'enum' | 'text' | 'free' | 'date' | 'number' | 'bool' | 'tags';
export type Op =
  'in' | 'not_in' | 'contains' | 'empty' | 'not_empty' | 'eq' | 'gte' | 'lte' | 'between' | 'is' | 'any' | 'none';

export const FIELDS = {
  business_category: { type: 'enum', options: ['manufacturing', 'non_manufacturing'] },
  nature: { type: 'text', facet: 'nature' },
  sector: { type: 'text', facet: 'sector' },
  member_class: { type: 'enum', options: ['Corporate', 'Associate'] },
  member_status: { type: 'enum', options: ['Active', 'Temporary', 'Expired', 'Suspended', 'Revoked'] },
  renewal: { type: 'enum', options: ['current', 'due', 'lapsed'] },
  member_since: { type: 'date' },
  valid_to: { type: 'date' },
  valid_year: { type: 'number' },
  city: { type: 'text', facet: 'city' },
  district: { type: 'text', facet: 'district' },
  registration: { type: 'enum', options: ['prop', 'aop', 'pvt', 'mnc', 'public'] },
  whatsapp_available: { type: 'bool' },
  consent: { type: 'enum', options: ['granted', 'withdrawn', 'not_recorded', 'no_contact'] },
  opted_out: { type: 'bool' },
  incomplete: { type: 'bool' },
  tags: { type: 'tags' },
  previously_contacted: { type: 'bool' },
  campaigns: { type: 'tags' },
  rep_name: { type: 'free' },
} as const satisfies Record<string, { type: FieldType; options?: readonly string[]; facet?: string }>;
export type FieldKey = keyof typeof FIELDS;
export const FIELD_KEYS = Object.keys(FIELDS) as FieldKey[];

export const OPS: Record<FieldType, Op[]> = {
  enum: ['in', 'not_in'],
  text: ['in', 'not_in', 'contains', 'empty', 'not_empty'],
  free: ['contains', 'empty', 'not_empty'],
  date: ['gte', 'lte', 'between'],
  number: ['eq', 'gte', 'lte', 'between'],
  bool: ['is'],
  tags: ['any', 'none', 'empty', 'not_empty'],
};

/** operators that need no value */
export const NO_VALUE: ReadonlySet<Op> = new Set<Op>(['empty', 'not_empty']);
/** operators whose value is a list of chosen options */
export const MULTI: ReadonlySet<Op> = new Set<Op>(['in', 'not_in', 'any', 'none']);

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const NUM = /^[0-9]{1,6}$/;

export interface Rule {
  field: FieldKey;
  op: Op;
  value?: string | boolean | string[];
}
export interface Group {
  match: 'all' | 'any';
  exclude: boolean;
  rules: Rule[];
}
export interface Filter {
  groups: Group[];
}

export const EMPTY_FILTER: Filter = { groups: [] };

function ruleProblem(r: Rule): boolean {
  const type = FIELDS[r.field].type as FieldType;
  if (!OPS[type].includes(r.op)) return true;
  if (NO_VALUE.has(r.op)) return false;
  const v = r.value;
  if (MULTI.has(r.op)) return !Array.isArray(v) || v.length < 1 || v.length > 100 || v.some((x) => x.length > 200);
  if (r.op === 'contains') return typeof v !== 'string' || v.trim().length < 1 || v.length > 100;
  if (r.op === 'is') return typeof v !== 'boolean';
  const pat = type === 'date' ? DAY : NUM;
  if (r.op === 'between')
    return (
      !Array.isArray(v) ||
      v.length !== 2 ||
      !pat.test(v[0] ?? '') ||
      !pat.test(v[1] ?? '') ||
      (v[0] ?? '') > (v[1] ?? '')
    );
  return typeof v !== 'string' || !pat.test(v);
}

const ruleSchema = z
  .object({
    field: z.enum(FIELD_KEYS as [FieldKey, ...FieldKey[]]),
    op: z.enum(['in', 'not_in', 'contains', 'empty', 'not_empty', 'eq', 'gte', 'lte', 'between', 'is', 'any', 'none']),
    value: z.union([z.string().max(200), z.boolean(), z.array(z.string().max(200)).max(100)]).optional(),
  })
  .refine((r) => !ruleProblem(r as Rule));

export const filterSchema = z.object({
  groups: z
    .array(
      z.object({
        match: z.enum(['all', 'any']),
        exclude: z.boolean().default(false),
        rules: z.array(ruleSchema).max(20),
      }),
    )
    .max(10),
});

/** conditions still being filled in are left out, so a half-made condition never changes the result */
export function completeFilter(f: Filter): Filter {
  return {
    groups: f.groups
      .map((g) => ({ ...g, rules: g.rules.filter((r) => !ruleProblem(r)) }))
      .filter((g) => g.rules.length > 0),
  };
}

export const isEmptyFilter = (f: Filter) => completeFilter(f).groups.length === 0;

export const encodeFilter = (f: Filter): string => JSON.stringify(completeFilter(f));

/** from a URL or a saved row; anything unreadable means no filter, never an error page */
export function decodeFilter(raw: unknown): Filter {
  try {
    const value = typeof raw === 'string' ? (raw ? JSON.parse(raw) : EMPTY_FILTER) : raw;
    const parsed = filterSchema.safeParse(value);
    return parsed.success ? (parsed.data as Filter) : EMPTY_FILTER;
  } catch {
    return EMPTY_FILTER;
  }
}

export function directoryQuery(p: {
  f?: Filter;
  q?: string;
  sort?: string;
  dir?: string;
  page?: number;
  segment?: string;
}): string {
  const s = new URLSearchParams();
  if (p.f && !isEmptyFilter(p.f)) s.set('f', encodeFilter(p.f));
  if (p.q) s.set('q', p.q);
  if (p.sort) s.set('sort', p.sort);
  if (p.dir) s.set('dir', p.dir);
  if (p.page && p.page > 1) s.set('page', String(p.page));
  if (p.segment) s.set('segment', p.segment);
  const out = s.toString();
  return out ? `?${out}` : '';
}

/** fields that can be exported; `sensitive` needs Approve level and a reason (enforced in api.biz_export) */
export const EXPORT_FIELDS = [
  { key: 'business_name', sensitive: false },
  { key: 'member_no', sensitive: false },
  { key: 'member_class', sensitive: false },
  { key: 'member_status', sensitive: false },
  { key: 'business_category', sensitive: false },
  { key: 'nature', sensitive: false },
  { key: 'sector', sensitive: false },
  { key: 'registration', sensitive: false },
  { key: 'city', sensitive: false },
  { key: 'district', sensitive: false },
  { key: 'rep_name', sensitive: false },
  { key: 'member_since', sensitive: false },
  { key: 'valid_to', sensitive: false },
  { key: 'consent', sensitive: false },
  { key: 'tags', sensitive: false },
  { key: 'tel', sensitive: true },
  { key: 'email', sensitive: true },
  { key: 'whatsapp', sensitive: true },
  { key: 'address', sensitive: true },
  { key: 'ntn', sensitive: true },
] as const;
export type ExportField = (typeof EXPORT_FIELDS)[number]['key'];
export const EXPORT_DEFAULT: ExportField[] = [
  'business_name',
  'member_no',
  'member_class',
  'member_status',
  'business_category',
  'nature',
  'city',
];

/** the browser's selection: chosen rows, or everything matching the filter minus some */
export interface Selection {
  mode: 'none' | 'ids' | 'matching';
  ids: string[];
  excluded: string[];
  key: string;
}
export const SELECTION_LIMIT = 500;
