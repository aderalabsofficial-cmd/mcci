import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { BIZ_TYPES, type BizType, REQUIRED_FIELDS, SECTORS, sector } from '@/lib/membership/reference';

/**
 * Membership application rules (docs/03 §1, prototype F.classOf / F.fee / F.validateApp). Pure functions shared by
 * the wizard (live hints) and the server actions. The database applies the same missing-items rule again at submit
 * (private.app_missing, migration 0300) and is the authority; keep both in step.
 */

export interface NatureChoice {
  sector?: string;
  /** English activity labels from the form (stored as on the form: they print on the official form) */
  items?: string[];
  other?: string;
}

/** applications.form (keys: migration 0300 header) */
export interface AppForm {
  biz?: BizType;
  manufacturing?: boolean;
  salesTax?: boolean;
  turnover50?: boolean;
  nature?: NatureChoice;
  addrMatch?: boolean;
  step?: number;
  name?: string;
  address?: string;
  ntn?: string;
  gst?: string;
  tel?: string;
  fax?: string;
  email?: string;
  web?: string;
  particulars?: string;
  est?: string;
  rep?: string;
  desig?: string;
  cnic?: string;
  mobile?: string;
}

export interface DocRequirement {
  key: string;
  label_en: string;
  required: boolean;
  sort: number;
}

export interface AppState {
  form: AppForm;
  jurisdiction_ok: boolean | null;
  women: boolean;
  decl1: boolean;
  decl2: boolean;
  sign_path: string | null;
  stamp_path: string | null;
  docs: { key: string; status: 'pending' | 'ok' | 'rejected' }[];
  partners: number;
}

export interface MembershipRules {
  stampRequiredForProprietor?: boolean;
}

export const isBiz = (v: unknown): v is BizType =>
  typeof v === 'string' && (BIZ_TYPES as readonly string[]).includes(v);

export type MemberClass = 'Corporate' | 'Associate';

/** Corporate vs Associate, the rule printed on the form (private.class_of) */
export function classOf(f: AppForm): MemberClass {
  if (f.biz === 'pvt' || f.biz === 'public' || f.biz === 'mnc') return 'Corporate';
  if (f.manufacturing && f.salesTax) return 'Corporate';
  if (f.salesTax && f.turnover50) return 'Corporate';
  return 'Associate';
}

/** messages key (membership.fee.*) explaining the class */
export function classWhy(f: AppForm): 'whyCorporateBody' | 'whyMfg' | 'whyTurnover' | 'whyAssociate' {
  if (f.biz === 'pvt' || f.biz === 'public' || f.biz === 'mnc') return 'whyCorporateBody';
  if (f.manufacturing && f.salesTax) return 'whyMfg';
  if (f.salesTax && f.turnover50) return 'whyTurnover';
  return 'whyAssociate';
}

export interface FeeSchedule {
  Corporate: { admission: number; subscription: number; card: number };
  Associate: { admission: number; subscription: number; card: number };
  Women: { admission: number; subscription: number; card: number };
  extraCard: number;
}

export interface FeeBreakdown {
  admission: number;
  subscription: number;
  card: number;
  extraCards: number;
  extra: number;
  total: number;
}

/** fee in integer PKR (prototype F.fee); Women Entrepreneurs pay the women schedule */
export function fee(
  f: AppForm,
  women: boolean,
  extraCards: number,
  fees: FeeSchedule,
  kind: 'new' | 'renewal' = 'new',
): FeeBreakdown {
  const s = women ? fees.Women : fees[classOf(f)];
  const admission = kind === 'renewal' ? 0 : s.admission;
  const card = kind === 'renewal' ? 0 : s.card;
  const extra = extraCards * fees.extraCard;
  return {
    admission,
    subscription: s.subscription,
    card,
    extraCards,
    extra,
    total: admission + s.subscription + card + extra,
  };
}

const filled = (v: unknown) => typeof v === 'string' && v.trim() !== '';
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** what blocks submission, as the codes of private.app_missing (same order) */
export function missing(app: AppState, requirements: DocRequirement[], rules: MembershipRules = {}): string[] {
  const f = app.form;
  const out: string[] = [];
  const biz: BizType = isBiz(f.biz) ? f.biz : 'prop';
  if (!isBiz(f.biz)) out.push('biz');
  const n = f.nature ?? {};
  if (!filled(n.sector) || (!(n.items ?? []).length && !filled(n.other))) out.push('nature');
  if (app.jurisdiction_ok !== true) out.push('juris');
  if (f.addrMatch !== true) out.push('addr');
  for (const k of REQUIRED_FIELDS) {
    const v = f[k];
    if (!filled(v) || (k === 'est' && !DATE.test(String(v)))) out.push(`field:${k}`);
  }
  const have = new Set(app.docs.filter((d) => d.status !== 'rejected').map((d) => d.key));
  for (const r of [...requirements].sort((a, b) => a.sort - b.sort)) {
    if ((r.required || (r.key === 'st' && f.salesTax)) && !have.has(r.key)) out.push(`doc:${r.key}`);
  }
  if (biz !== 'prop' && app.partners < 2) out.push('partners');
  if (!app.sign_path) out.push('sign');
  if (!app.stamp_path && (biz !== 'prop' || rules.stampRequiredForProprietor)) out.push('stamp');
  if (!(app.decl1 && app.decl2)) out.push('decl');
  return out;
}

/** a missing-item code in plain words */
export function missingLabel(code: string, locale: Locale): string {
  if (code.startsWith('field:')) return msg(locale, `membership.fields.${code.slice(6)}`);
  if (code.startsWith('doc:')) return msg(locale, `membership.docs.${code.slice(4)}`);
  if (code === 'not_found') return msg(locale, 'membership.missing.notFound');
  return msg(locale, `membership.missing.${code}`);
}

/** the English label of an activity slug (what the form stores and prints) */
export const activityLabel = (sectorKey: string, slug: string) =>
  msg('en', `membership.nature.${sectorKey}.items.${slug}`);

/** the slug of a stored English activity label, for showing it in Urdu */
export function activitySlug(sectorKey: string, label: string): string | null {
  const s = sector(sectorKey);
  return s?.items.find((slug) => activityLabel(s.k, slug) === label) ?? null;
}

/** "Particulars of Business" filled from the nature of business (prototype natSync), in English as on the form */
export function particularsFromNature(n: NatureChoice | undefined): string {
  const s = sector(n?.sector);
  if (!s) return '';
  const parts = [...(n?.items ?? []), n?.other?.trim()].filter(Boolean);
  const name = msg('en', `membership.nature.${s.k}.name`);
  return parts.length ? `${name}: ${parts.join(', ')}` : name;
}

export const SECTOR_KEYS = SECTORS.map((s) => s.k);
