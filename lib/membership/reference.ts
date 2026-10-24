/**
 * Reference data of the MCCI New Membership form (20-08-2026), as in the prototype (core.js M.BIZ, M.MFG, M.NATURE,
 * M.STEPS, actions.js M.FIELDS). Only keys, icons and colours live here; every label (EN + UR) is in
 * messages/*.json under `membership.*`. The document checklist per business type is in the database
 * (public.document_requirements, migration 0140) so MCCI can change it without a deploy.
 */

export const BIZ_TYPES = ['prop', 'aop', 'pvt', 'mnc', 'public'] as const;
export type BizType = (typeof BIZ_TYPES)[number];
export const BIZ_ICON: Record<BizType, string> = {
  prop: 'user',
  aop: 'users',
  pvt: 'building',
  mnc: 'globe',
  public: 'landmark',
};

/** nature of business: 12 sectors, then up to 3 activities (slugs; labels in messages membership.nature.*) */
export const SECTORS = [
  {
    k: 'mfg',
    icon: 'factory',
    c: '#14b8a6',
    items: [
      'textile-spinning-and-weaving',
      'garments-and-home-textiles',
      'cotton-ginning',
      'food-processing',
      'flour-rice-and-oil-mills',
      'sugar-mill',
      'pharmaceuticals',
      'chemicals-and-fertilizer',
      'plastics-and-packaging',
      'engineering-and-steel',
      'furniture-and-woodwork',
      'leather-and-footwear',
    ],
  },
  {
    k: 'trade',
    icon: 'truck',
    c: '#c8963e',
    items: [
      'wholesaler',
      'distributor',
      'dealer-stockist',
      'commission-agent-arhti',
      'retail-shop-chain',
      'super-store',
    ],
  },
  {
    k: 'impex',
    icon: 'globe',
    c: '#3b82f6',
    items: [
      'exporter',
      'importer',
      'importer-and-exporter',
      'indenting-agent',
      'customs-clearing-agent',
      'freight-forwarder',
    ],
  },
  {
    k: 'it',
    icon: 'database',
    c: '#7c3aed',
    items: [
      'software-house',
      'it-services-and-support',
      'call-centre-bpo',
      'e-commerce',
      'digital-marketing-agency',
      'telecom-and-internet-services',
    ],
  },
  {
    k: 'agri',
    icon: 'sun',
    c: '#1fa34a',
    items: [
      'agri-inputs-seed-pesticide-fertilizer',
      'cotton-and-grain-trading',
      'mango-and-fruit-vegetables',
      'dairy-and-livestock',
      'poultry-and-feed',
      'cold-storage',
    ],
  },
  {
    k: 'build',
    icon: 'building',
    c: '#f59e0b',
    items: [
      'builder-and-developer',
      'construction-contractor',
      'building-materials',
      'real-estate-agency',
      'architects-and-engineers',
    ],
  },
  {
    k: 'health',
    icon: 'plus',
    c: '#ef4444',
    items: [
      'hospital-clinic',
      'pharmacy-medical-store',
      'pharma-distribution',
      'diagnostic-laboratory',
      'medical-equipment',
    ],
  },
  {
    k: 'logi',
    icon: 'map',
    c: '#0ea5e9',
    items: ['goods-transport', 'courier-and-delivery', 'warehousing', 'travel-and-tour-agency', 'passenger-transport'],
  },
  {
    k: 'fin',
    icon: 'landmark',
    c: '#1b4f9c',
    items: [
      'bank-financial-institution',
      'insurance',
      'chartered-accountants',
      'legal-and-tax-consultants',
      'management-consultancy',
    ],
  },
  {
    k: 'energy',
    icon: 'plug',
    c: '#ea580c',
    items: [
      'petroleum-cng-station',
      'solar-and-renewable-energy',
      'electrical-goods',
      'auto-dealer',
      'auto-parts-and-workshop',
    ],
  },
  {
    k: 'hosp',
    icon: 'star',
    c: '#db2777',
    items: ['hotel', 'restaurant-and-catering', 'school-college', 'training-institute', 'events-and-marriage-hall'],
  },
  {
    k: 'svc',
    icon: 'mic',
    c: '#64748b',
    items: [
      'printing-and-publishing',
      'advertising-and-media',
      'security-services',
      'cleaning-and-facility-services',
      'other-services',
    ],
  },
] as const;
export type SectorKey = (typeof SECTORS)[number]['k'];
export const sector = (k: string | undefined | null) => SECTORS.find((s) => s.k === k) ?? null;
export const MAX_NATURE_ITEMS = 3;

/** page-2 particulars, in the order of the form (prototype M.FIELDS) */
export const BUSINESS_FIELDS = [
  'name',
  'address',
  'ntn',
  'gst',
  'tel',
  'fax',
  'email',
  'web',
  'particulars',
  'est',
] as const;
export const REP_FIELDS = ['rep', 'desig', 'cnic', 'mobile'] as const;
export const FORM_FIELDS = [...BUSINESS_FIELDS, ...REP_FIELDS] as const;
export type FormField = (typeof FORM_FIELDS)[number];
/** fields the form requires (prototype F.validateApp, private.app_missing) */
export const REQUIRED_FIELDS: readonly FormField[] = [
  'name',
  'address',
  'ntn',
  'tel',
  'email',
  'particulars',
  'est',
  'rep',
  'desig',
  'cnic',
  'mobile',
];

/** the six wizard steps (prototype WS) */
export const WIZARD_STEPS = [
  { k: 'type', icon: 'building' },
  { k: 'docs', icon: 'upload' },
  { k: 'details', icon: 'sparkles' },
  { k: 'endorse', icon: 'users' },
  { k: 'sign', icon: 'signature' },
  { k: 'review', icon: 'send' },
] as const;

/** the member's 8-step journey (prototype M.STEPS) */
export const JOURNEY = [
  { k: 'submitted', icon: 'filePlus' },
  { k: 'review', icon: 'shield' },
  { k: 'proposer', icon: 'users' },
  { k: 'committee', icon: 'award' },
  { k: 'payment', icon: 'card' },
  { k: 'temp', icon: 'hourglass' },
  { k: 'printing', icon: 'printer' },
  { k: 'permanent', icon: 'check' },
] as const;

export type AppStage =
  | 'draft'
  | 'submitted'
  | 'review'
  | 'returned'
  | 'proposer'
  | 'committee'
  | 'payment'
  | 'temp'
  | 'permanent'
  | 'rejected'
  | 'withdrawn';

/** position on the 8-step journey (prototype M.stepIndex); -1 before submission */
export function journeyIndex(stage: AppStage, printing = false): number {
  if (stage === 'draft' || stage === 'withdrawn') return -1;
  const at: Partial<Record<AppStage, number>> = {
    submitted: 0,
    review: 1,
    returned: 1,
    proposer: 2,
    committee: 3,
    payment: 4,
    temp: 5,
    permanent: 7,
    rejected: 1,
  };
  const i = at[stage] ?? 0;
  return stage === 'temp' && printing ? 6 : i;
}
