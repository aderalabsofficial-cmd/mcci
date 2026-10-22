import { describe, expect, it } from 'vitest';
import en from '@/messages/en.json';
import ur from '@/messages/ur.json';

type Tree = { [k: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'string' ? { ...acc, [key]: v } : { ...acc, ...flatten(v, key) };
  }, {});
}

const EN = flatten(en);
const UR = flatten(ur);
const ARABIC = /[؀-ۿ]/;
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('messages (EN/UR completeness, docs/10-testing.md flow 8)', () => {
  it('both locales have exactly the same keys', () => {
    expect(Object.keys(UR).sort()).toEqual(Object.keys(EN).sort());
  });

  it('no message is empty', () => {
    for (const [k, v] of Object.entries({ ...EN, ...UR })) expect(v.trim(), k).not.toBe('');
  });

  it('placeholders match between locales', () => {
    for (const k of Object.keys(EN)) expect(placeholders(UR[k]!), k).toEqual(placeholders(EN[k]!));
  });

  it('Urdu strings are written in Urdu (except brand names and language labels)', () => {
    const latinAllowed = new Set(['common.langEn', 'common.otherLanguage']);
    const untranslated = Object.entries(UR).filter(([k, v]) => !latinAllowed.has(k) && !ARABIC.test(v));
    expect(untranslated).toEqual([]);
  });
});
