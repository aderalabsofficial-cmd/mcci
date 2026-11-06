import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import en from '@/messages/en.json';
import ur from '@/messages/ur.json';
import { FIELDS } from '@/lib/business/filters';
import {
  CONSENT_CATEGORIES,
  formatWhatsapp,
  joinLink,
  matchesRegisterFilter,
  normalizeWhatsapp,
  REGISTER_FILTERS,
  STAFF_METHODS,
  STATUS_TONE,
  WA_STATUSES,
} from '@/lib/whatsapp/consent';
import { CATEGORIES } from '@/lib/whatsapp/media';

const get = (tree: unknown, path: string) =>
  path.split('.').reduce<unknown>((n, k) => (n as Record<string, unknown> | undefined)?.[k], tree);

describe('WhatsApp numbers (mirror of private.wa_phone)', () => {
  it.each([
    ['0300-1234567', '+923001234567'],
    ['0300 123 4567', '+923001234567'],
    ['+92 300 1234567', '+923001234567'],
    ['92 300 1234567', '+923001234567'],
    ['0092 300 1234567', '+923001234567'],
    ['3001234567', '+923001234567'],
    ['(0300) 123-4567', '+923001234567'],
    ['+44 7700 900123', '+447700900123'],
  ])('%s → %s', (raw, want) => expect(normalizeWhatsapp(raw)).toBe(want));

  it.each(['061-4512345', '+92 61 4512345', '0300-12', 'hello', '', '+0123456789'])('refuses %s', (raw) =>
    expect(normalizeWhatsapp(raw)).toBeNull(),
  );

  it('formats Pakistani mobiles for reading only', () => {
    expect(formatWhatsapp('+923001234567')).toBe('+92 300 1234567');
    expect(formatWhatsapp('+447700900123')).toBe('+447700900123');
    expect(formatWhatsapp(null)).toBe('—');
  });

  it('the database uses the same rule (migration 0690)', () => {
    const sql = readFileSync('supabase/migrations/20261117000690_wa_consent_centre.sql', 'utf8');
    expect(sql).toContain("if d ~ '^\\+92' and d !~ '^\\+923[0-9]{9}$' then return null; end if;");
  });
});

describe('JOIN link', () => {
  it('opens a chat with MCCI and the code typed in', () =>
    expect(joinLink('+92 312 7322224', 'AB2C3D')).toBe('https://wa.me/923127322224?text=JOIN%20AB2C3D'));
  it('has no link when MCCI’s number is unknown on this server', () => {
    expect(joinLink(null, 'AB2C3D')).toBeNull();
    expect(joinLink('', 'AB2C3D')).toBeNull();
  });
});

describe('categories and statuses', () => {
  it('five categories, the same for consent and campaigns', () => {
    expect(CONSENT_CATEGORIES).toEqual(['announcements', 'membership', 'events', 'opportunities', 'services']);
    expect(CATEGORIES).toBe(CONSENT_CATEGORIES);
    expect(FIELDS.wa_categories.options).toEqual([...CONSENT_CATEGORIES]);
    expect(FIELDS.wa_status.options).toEqual([...WA_STATUSES]);
  });

  it('every category, status, method and filter has English and Urdu wording', () => {
    for (const tree of [en, ur]) {
      for (const c of CONSENT_CATEGORIES) {
        expect(typeof get(tree, `wa.categories.${c}`)).toBe('string');
        expect(typeof get(tree, `wa.prefs.catHelp.${c}`)).toBe('string');
      }
      for (const s of WA_STATUSES) {
        expect(typeof get(tree, `wa.wstatus.${s}`)).toBe('string');
        expect(typeof get(tree, `wa.prefs.state.${s}`)).toBe('string');
        expect(STATUS_TONE[s]).toBeTruthy();
      }
      for (const m of STAFF_METHODS) expect(typeof get(tree, `wa.prefs.methods.${m}`)).toBe('string');
      for (const f of REGISTER_FILTERS) expect(typeof get(tree, `wa.staff.register.filters.${f}`)).toBe('string');
    }
  });

  it('the Urdu consent wording is in Urdu, not a copy of the English', () => {
    expect(get(ur, 'wa.prefs.step2.agree')).not.toBe(get(en, 'wa.prefs.step2.agree'));
    expect(String(get(ur, 'wa.prefs.step2.agree'))).toMatch(/[؀-ۿ]/);
  });
});

describe('Members Register WhatsApp filters', () => {
  const row = (status: (typeof WA_STATUSES)[number], verified = false) => ({ status, verified });
  it('a status filter matches that status', () => {
    expect(matchesRegisterFilter('full', row('full'), true)).toBe(true);
    expect(matchesRegisterFilter('full', row('partial'), true)).toBe(false);
  });
  it('opted out includes a block by MCCI', () => {
    expect(matchesRegisterFilter('opted_out', row('opted_out'), true)).toBe(true);
    expect(matchesRegisterFilter('opted_out', row('blocked'), true)).toBe(true);
  });
  it('not confirmed means a number that has not been confirmed on WhatsApp', () => {
    expect(matchesRegisterFilter('not_verified', row('full'), true)).toBe(true);
    expect(matchesRegisterFilter('not_verified', row('full', true), true)).toBe(false);
    expect(matchesRegisterFilter('not_verified', row('no_number'), true)).toBe(false);
  });
  it('active members without consent leaves out lapsed members and those with consent', () => {
    expect(matchesRegisterFilter('active_no_consent', row('not_collected'), true)).toBe(true);
    expect(matchesRegisterFilter('active_no_consent', row('no_number'), true)).toBe(true);
    expect(matchesRegisterFilter('active_no_consent', row('opted_out'), true)).toBe(true);
    expect(matchesRegisterFilter('active_no_consent', row('not_collected'), false)).toBe(false);
    expect(matchesRegisterFilter('active_no_consent', row('partial'), true)).toBe(false);
  });
});
