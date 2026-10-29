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

describe('message keys used in the code exist', () => {
  // msg() throws on a missing key, and a throw while rendering takes the whole page down (found 29 Oct 2026: the
  // partner role labels of the application form were missing, so "Add partner" crashed the page on production).
  it('every literal dotted message key in app/, components/ and lib/ is in en.json', async () => {
    const { readFileSync, readdirSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(name)) files.push(p);
      }
    };
    ['app', 'components', 'lib'].forEach(walk);
    const roots = new Set(Object.keys(en));
    const keys = Object.keys(EN);
    const missing: string[] = [];
    for (const file of files) {
      for (const [, key] of readFileSync(file, 'utf8').matchAll(/'([a-zA-Z]+(?:\.[a-zA-Z0-9]+){2,})'/g)) {
        if (!roots.has(key!.split('.')[0]!)) continue;
        // a full key, or a group handed to a helper that adds the rest
        if (!(key! in EN) && !keys.some((k) => k.startsWith(`${key}.`))) missing.push(`${file}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
