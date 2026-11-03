import { describe, expect, it } from 'vitest';
import { fieldProblem, fieldValues, fillMaster, submission, wordingProblem, type Master } from '@/lib/whatsapp/masters';

const master: Master = {
  key: 'membership',
  name: 'mcci_membership_update',
  metaCategory: 'UTILITY',
  slots: [
    { n: 1, key: 'contact_person', source: 'recipient', example_en: 'Ahmed', example_ur: 'احمد' },
    { n: 2, key: 'subject', source: 'field', max: 80, required: true, example_en: 'Renewal', example_ur: 'تجدید' },
    {
      n: 3,
      key: 'deadline',
      source: 'field',
      max: 40,
      required: false,
      default_en: 'None',
      default_ur: 'کوئی نہیں',
      example_en: 'By 31 Dec',
      example_ur: '31 دسمبر',
    },
    {
      n: 4,
      key: 'link',
      source: 'field',
      max: 200,
      required: true,
      example_en: 'https://x.org',
      example_ur: 'https://x.org',
    },
  ],
  versions: [
    {
      language: 'ur',
      version: 1,
      header: 'رکنیت',
      body: 'محترم {{1}}، موضوع: {{2}}، کارروائی: {{3}}، دیکھیں {{4}} شکریہ',
      footer: null,
      updatedAt: '',
      templateId: null,
      status: 'LOCAL',
      providerCategory: null,
      syncedAt: null,
      locked: false,
    },
  ],
};

describe('master template fields (same rules as private.wa_master_fields)', () => {
  it('an optional field takes its default in the chosen language', () => {
    expect(fieldValues(master, 'en', { subject: 'S' }).deadline).toBe('None');
    expect(fieldValues(master, 'ur', { subject: 'S' }).deadline).toBe('کوئی نہیں');
  });
  it('names the first field that is missing, multi-line, too long or not an https link', () => {
    expect(fieldProblem(master, 'en', { link: 'https://x.org' })).toBe('subject');
    expect(fieldProblem(master, 'en', { subject: 'a\nb', link: 'https://x.org' })).toBe('subject');
    expect(fieldProblem(master, 'en', { subject: 'x'.repeat(81), link: 'https://x.org' })).toBe('subject');
    expect(fieldProblem(master, 'en', { subject: 'ok', link: 'http://x.org' })).toBe('link');
    expect(fieldProblem(master, 'en', { subject: 'a      b', link: 'https://x.org' })).toBe('subject');
    expect(fieldProblem(master, 'en', { subject: 'ok', link: 'https://x.org' })).toBeNull();
  });
});

describe('master wording (same rules as api.wa_master_save)', () => {
  it('accepts every slot once, inside fixed text', () => {
    expect(wordingProblem('Dear {{1}}, {{2}} by {{3}} at {{4}} thanks', 'H', '', 4)).toBeNull();
  });
  it('refuses a missing, repeated or extra variable', () => {
    expect(wordingProblem('Dear {{1}}, {{2}} by {{3}} thanks', 'H', '', 4)).toBe('variables');
    expect(wordingProblem('Dear {{1}}, {{1}} {{2}} by {{3}} at {{4}} thanks', 'H', '', 4)).toBe('variables');
    expect(wordingProblem('Dear {{1}}, {{2}} {{3}} {{4}} {{5}} thanks', 'H', '', 4)).toBe('variables');
  });
  it('refuses a variable first, last or right next to another', () => {
    expect(wordingProblem('{{1}}, {{2}} by {{3}} at {{4}} thanks', 'H', '', 4)).toBe('placement');
    expect(wordingProblem('Dear {{1}}, {{2}} by {{3}} at {{4}}', 'H', '', 4)).toBe('placement');
    expect(wordingProblem('Dear {{1}}, {{2}} {{3}} at {{4}} thanks', 'H', '', 4)).toBe('placement');
  });
  it('keeps variables out of the header and footer, within 60 characters', () => {
    expect(wordingProblem('Dear {{1}}, {{2}} by {{3}} at {{4}} thanks', 'Hi {{1}}', '', 4)).toBe('header');
    expect(wordingProblem('Dear {{1}}, {{2}} by {{3}} at {{4}} thanks', 'H', 'x'.repeat(61), 4)).toBe('footer');
  });
});

describe('preview and submission', () => {
  it('fills from recipient values and fields; a missing value shows by name, never blank', () => {
    const text = fillMaster(master.versions[0]!.body, master.slots, {
      subject: 'تجدید',
      deadline: 'کوئی نہیں',
      link: 'https://x.org',
    });
    expect(text).toContain('[contact_person]');
    expect(text).toContain('تجدید');
    expect(text).not.toMatch(/\{\{\d+\}\}/);
  });
  it('gives Meta the exact name, category, language and one sample per variable in that language', () => {
    const s = submission(master, master.versions[0]!);
    expect(s).toMatchObject({ name: 'mcci_membership_update', category: 'UTILITY', language: 'ur' });
    expect(s.examples).toEqual(['احمد', 'تجدید', '31 دسمبر', 'https://x.org']);
  });
});
