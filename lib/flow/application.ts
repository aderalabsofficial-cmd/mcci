import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { BIZ_TYPES, type BizType, isBodyCorporate, REQUIRED_FIELDS, SECTORS, sector } from '@/lib/membership/reference';

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
  /** main category: true = Manufacturing, false = Non-manufacturing, unset = not chosen yet */
  manufacturing?: boolean;
  /** Partnership / AOP only: registered with the Registrar of Firms (Form C) */
  aopRegistered?: boolean;
  /** sales tax registration "with effect from" date (YYYY-MM-DD), when salesTax */
  stWef?: string;
  salesTax?: boolean;
  turnover50?: boolean;
  nature?: NatureChoice;
  addrMatch?: boolean;
  step?: number;
  /** which document the AI read each field from (written by the server only) */
  src?: Record<string, string>;
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
  repEmail?: string;
  repAddress?: string;
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
  /** a listed partner / director without email or address (0440) */
  partnerContactsMissing?: boolean;
  /** a listed partner / director without their own photo (0480) */
  partnerPhotosMissing?: boolean;
}

export interface MembershipRules {
  stampRequiredForProprietor?: boolean;
}

/** partners / directors rows on the form (page 2 table) */
export const MAX_PARTNERS = 6;

export const isBiz = (v: unknown): v is BizType =>
  typeof v === 'string' && (BIZ_TYPES as readonly string[]).includes(v);

export type MemberClass = 'Corporate' | 'Associate';

/**
 * Corporate vs Associate (private.class_of; docs/21 point 8): a body corporate registered with SECP is Corporate;
 * a proprietorship / AOP is Corporate when sales-tax registered and either manufacturing or (non-manufacturing with)
 * turnover of Rs 50 million or more; everything else is Associate.
 */
export function classOf(f: AppForm): MemberClass {
  return classWhy(f) === 'whyAssociate' ? 'Associate' : 'Corporate';
}

/** messages key (membership.fee.*) explaining the class */
export function classWhy(f: AppForm): 'whyCorporateBody' | 'whyMfg' | 'whyTurnover' | 'whyAssociate' {
  if (isBodyCorporate(f.biz)) return 'whyCorporateBody';
  if (f.salesTax && f.manufacturing) return 'whyMfg';
  if (f.salesTax && !f.manufacturing && f.turnover50) return 'whyTurnover';
  return 'whyAssociate';
}

/**
 * Why an Associate is not Corporate, in the applicant's terms (owner's question of 29 Oct 2026: "a manufacturing AOP
 * registered with the Registrar of Firms — why not Corporate?"). Registration with the Registrar of Firms (Form C) makes
 * a partnership a registered FIRM, not a body corporate (only companies and LLPs registered with SECP are, docs/21 §8),
 * so a proprietorship / AOP is Corporate only through sales tax: manufacturing + GST, or GST + Rs 50 million turnover.
 */
export function classHints(f: AppForm): ('hintFirm' | 'hintGst' | 'hintGstTurnover')[] {
  if (classOf(f) === 'Corporate' || !askClass(f)) return [];
  const out: ('hintFirm' | 'hintGst' | 'hintGstTurnover')[] = [];
  if (f.biz === 'aop' && f.aopRegistered === true) out.push('hintFirm');
  if (f.salesTax !== true) out.push(f.manufacturing === false ? 'hintGstTurnover' : 'hintGst');
  return out;
}

/** the class questions are shown only to a proprietorship / AOP, and turnover only where it changes the class */
export const askClass = (f: AppForm) => Boolean(f.biz) && !isBodyCorporate(f.biz);
export const askTurnover = (f: AppForm) => askClass(f) && f.manufacturing === false && f.salesTax === true;

/**
 * The documents this applicant is asked for, from the checklist of their business type: the sales tax registration
 * certificate only when sales-tax registered (then required), Form C only for a registered AOP (then required).
 * private.app_docs applies the same rule in the database.
 */
export function applicableDocs<R extends DocRequirement>(requirements: R[], f: AppForm): R[] {
  return requirements
    .filter((r) => (r.key === 'st' ? f.salesTax === true : r.key === 'formc' ? f.aopRegistered === true : true))
    .map((r) => (r.key === 'st' || r.key === 'formc' ? { ...r, required: true } : r))
    .sort((a, b) => a.sort - b.sort);
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
  if (typeof f.manufacturing !== 'boolean') out.push('category');
  if (biz === 'aop' && typeof f.aopRegistered !== 'boolean') out.push('aopReg');
  const n = f.nature ?? {};
  if (!filled(n.sector) || (!(n.items ?? []).length && !filled(n.other))) out.push('nature');
  if (app.jurisdiction_ok !== true) out.push('juris');
  if (f.addrMatch !== true) out.push('addr');
  for (const k of REQUIRED_FIELDS) {
    const v = f[k];
    if (!filled(v) || (k === 'est' && !DATE.test(String(v)))) out.push(`field:${k}`);
  }
  if (f.salesTax === true && !DATE.test(String(f.stWef ?? ''))) out.push('field:stWef');
  const have = new Set(app.docs.filter((d) => d.status !== 'rejected').map((d) => d.key));
  for (const r of applicableDocs(requirements, f)) {
    if (r.required && !have.has(r.key)) out.push(`doc:${r.key}`);
  }
  if (biz !== 'prop' && app.partners < 2) out.push('partners');
  if (app.partnerContactsMissing) out.push('partnerContacts');
  if (app.partnerPhotosMissing) out.push('partnerPhotos');
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
