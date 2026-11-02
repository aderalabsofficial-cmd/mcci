import type { Filter, FieldKey, Rule } from '@/lib/business/filters';

/**
 * The audience as tabs: one choice per question, instead of building rules. Each tab maps to one rule of the directory's
 * own filter, so the preview, the campaign and the server rules work exactly the same way.
 */
export const AUDIENCE_TABS: { field: FieldKey; options: string[] }[] = [
  { field: 'member_class', options: ['Corporate', 'Associate'] },
  { field: 'renewal', options: ['current', 'due', 'lapsed'] },
  { field: 'business_category', options: ['manufacturing', 'non_manufacturing'] },
  { field: 'consent', options: ['granted', 'not_recorded'] },
];
/** fields whose values come from the register: shown as tabs too, the commonest first */
export const FACET_TABS = ['city', 'sector'] as const;
const TAB_FIELDS = new Set<string>([...AUDIENCE_TABS.map((t) => t.field), ...FACET_TABS]);

const rulesOf = (f: Filter): Rule[] => f.groups.flatMap((g) => g.rules);

/** the chosen value of a tab, when the filter is a plain "is one of" on that field */
export function tabValue(f: Filter, field: FieldKey): string | null {
  const r = rulesOf(f).find((x) => x.field === field && x.op === 'in');
  return Array.isArray(r?.value) && r.value.length === 1 ? (r.value[0] ?? null) : null;
}

/** sets or clears one tab, keeping the others */
export function withTab(f: Filter, field: FieldKey, value: string | null): Filter {
  const rules = rulesOf(f).filter((r) => r.field !== field);
  if (value) rules.push({ field, op: 'in', value: [value] });
  return rules.length ? { groups: [{ match: 'all', exclude: false, rules }] } : { groups: [] };
}

/** a filter the tabs can show completely; anything else opens the detailed builder */
export function isTabFilter(f: Filter): boolean {
  if (f.groups.length > 1 || f.groups.some((g) => g.exclude)) return false;
  return rulesOf(f).every((r) => TAB_FIELDS.has(r.field) && r.op === 'in' && Array.isArray(r.value) && r.value.length === 1);
}
