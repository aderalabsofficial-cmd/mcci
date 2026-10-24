import { describe, expect, it } from 'vitest';
import {
  type AppState,
  activitySlug,
  classOf,
  classWhy,
  type DocRequirement,
  fee,
  type FeeSchedule,
  missing,
  missingLabel,
  particularsFromNature,
} from '@/lib/flow/application';
import { journeyIndex } from '@/lib/membership/reference';

const FEES: FeeSchedule = {
  Corporate: { admission: 5000, subscription: 12000, card: 500 },
  Associate: { admission: 4000, subscription: 7000, card: 500 },
  Women: { admission: 2000, subscription: 5000, card: 500 },
  extraCard: 1000,
};
// public.document_requirements (migration 0140): proprietorship 7 slots, Pvt Ltd 11
const req = (keys: [string, boolean][]): DocRequirement[] =>
  keys.map(([key, required], i) => ({ key, label_en: key, required, sort: i + 1 }));
const PROP = req([
  ['cnic', true],
  ['ntn', true],
  ['itr', false],
  ['st', false],
  ['addr', true],
  ['bank', true],
  ['photo', true],
]);
const PVT = req([
  ['cnic', true],
  ['ntn', true],
  ['itr', false],
  ['st', false],
  ['moa', true],
  ['inc', true],
  ['addr', true],
  ['bank', true],
  ['board', true],
  ['photo', true],
  ['forma', true],
]);

const complete: AppState = {
  form: {
    biz: 'prop',
    nature: { sector: 'trade', items: ['Wholesaler'] },
    addrMatch: true,
    name: 'Fresh Traders',
    address: '12 Hussain Agahi, Multan',
    ntn: '1234567-8',
    tel: '061-4500000',
    email: 'info@fresh.test',
    particulars: 'Wholesale & Distribution: Wholesaler',
    est: '2019-03-01',
    rep: 'Fresh',
    desig: 'Proprietor',
    cnic: '36302-1234567-1',
    mobile: '0300-1234567',
  },
  jurisdiction_ok: true,
  women: false,
  decl1: true,
  decl2: true,
  sign_path: 'x/sign.png',
  stamp_path: null,
  docs: ['cnic', 'ntn', 'addr', 'bank', 'photo'].map((key) => ({ key, status: 'pending' as const })),
  partners: 0,
};

describe('membership class and fee (rule printed on the form)', () => {
  it('Corporate for companies, sales-tax manufacturers and Rs. 50m sales-tax businesses; otherwise Associate', () => {
    expect(classOf({ biz: 'pvt' })).toBe('Corporate');
    expect(classOf({ biz: 'mnc' })).toBe('Corporate');
    expect(classOf({ biz: 'prop', manufacturing: true, salesTax: true })).toBe('Corporate');
    expect(classOf({ biz: 'aop', salesTax: true, turnover50: true })).toBe('Corporate');
    expect(classOf({ biz: 'prop', salesTax: true })).toBe('Associate');
    expect(classOf({ biz: 'prop', manufacturing: true })).toBe('Associate');
    expect(classWhy({ biz: 'prop', manufacturing: true, salesTax: true })).toBe('whyMfg');
    expect(classWhy({ biz: 'prop' })).toBe('whyAssociate');
  });

  it('adds up admission, subscription, card and extra cards in integer PKR', () => {
    expect(fee({ biz: 'pvt' }, false, 2, FEES)).toEqual({
      admission: 5000,
      subscription: 12000,
      card: 500,
      extraCards: 2,
      extra: 2000,
      total: 19500,
    });
    expect(fee({ biz: 'prop' }, true, 0, FEES).total).toBe(7500);
    expect(fee({ biz: 'prop' }, false, 0, FEES, 'renewal').total).toBe(7000);
  });
});

describe('missing items (same codes as private.app_missing)', () => {
  it('a complete proprietorship has nothing missing; the stamp is optional for proprietors', () => {
    expect(missing(complete, PROP)).toEqual([]);
    expect(missing(complete, PROP, { stampRequiredForProprietor: true })).toEqual(['stamp']);
  });

  it('lists everything a new draft still needs, in form order', () => {
    const empty: AppState = {
      ...complete,
      form: {},
      jurisdiction_ok: null,
      decl1: false,
      decl2: false,
      sign_path: null,
      docs: [],
    };
    const m = missing(empty, PROP);
    expect(m.slice(0, 4)).toEqual(['biz', 'nature', 'juris', 'addr']);
    expect(m).toContain('field:name');
    expect(m.filter((c) => c.startsWith('doc:'))).toEqual(['doc:cnic', 'doc:ntn', 'doc:addr', 'doc:bank', 'doc:photo']);
    expect(m.slice(-2)).toEqual(['sign', 'decl']);
  });

  it('Pvt Ltd needs its 9 required documents, two directors and the stamp', () => {
    const pvt: AppState = { ...complete, form: { ...complete.form, biz: 'pvt' } };
    const m = missing(pvt, PVT);
    expect(m).toEqual(['doc:moa', 'doc:inc', 'doc:board', 'doc:forma', 'partners', 'stamp']);
    expect(PVT).toHaveLength(11);
    expect(PROP).toHaveLength(7);
  });

  it('a sales-tax registered business must add the sales tax certificate; rejected files do not count', () => {
    expect(missing({ ...complete, form: { ...complete.form, salesTax: true } }, PROP)).toEqual(['doc:st']);
    const rejected = {
      ...complete,
      docs: complete.docs.map((d) => (d.key === 'ntn' ? { ...d, status: 'rejected' as const } : d)),
    };
    expect(missing(rejected, PROP)).toEqual(['doc:ntn']);
    expect(missing({ ...complete, form: { ...complete.form, est: '01/03/2019' } }, PROP)).toEqual(['field:est']);
  });

  it('says each missing item in plain English and Urdu', () => {
    expect(missingLabel('doc:ntn', 'en')).toBe('NTN certificate');
    expect(missingLabel('field:cnic', 'en')).toBe('CNIC No.');
    expect(missingLabel('juris', 'en')).toBe('Business within Multan Chamber jurisdiction');
    expect(missingLabel('decl', 'ur')).toBe('دونوں اقرارات');
  });
});

describe('nature of business and journey', () => {
  it('fills Particulars of Business in English as on the form and maps labels back for Urdu', () => {
    expect(particularsFromNature({ sector: 'trade', items: ['Wholesaler', 'Distributor'], other: '' })).toBe(
      'Wholesale & Distribution: Wholesaler, Distributor',
    );
    expect(particularsFromNature({ sector: 'it', items: [], other: 'Cloud hosting' })).toBe(
      'IT & Digital: Cloud hosting',
    );
    expect(activitySlug('trade', 'Commission agent (Arhti)')).toBe('commission-agent-arhti');
  });

  it('places each stage on the 8-step journey', () => {
    expect(journeyIndex('draft')).toBe(-1);
    expect(journeyIndex('submitted')).toBe(0);
    expect(journeyIndex('returned')).toBe(1);
    expect(journeyIndex('committee')).toBe(3);
    expect(journeyIndex('temp', true)).toBe(6);
    expect(journeyIndex('permanent')).toBe(7);
  });
});
