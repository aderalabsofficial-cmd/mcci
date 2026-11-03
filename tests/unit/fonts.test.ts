import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** The Latin fonts ship with the app: a build never asks Google (release failures of 3 Nov 2026). */
const layout = readFileSync('app/[locale]/layout.tsx', 'utf8');
const fonts = [...layout.matchAll(/localFont\(\{([\s\S]*?)\n\}\);/g)].map((m) => ({
  src: /src: '\.\.\/fonts\/([^']+)'/.exec(m[1]!)?.[1] ?? '',
  family: /'font-family', value: "'([^']+)'"/.exec(m[1]!)?.[1] ?? '',
  range: /'unicode-range', value: '([^']+)'/.exec(m[1]!)?.[1] ?? '',
}));

describe('Latin fonts (app/fonts)', () => {
  it('come from the repo, not from Google', () => {
    expect(layout).not.toContain('next/font/google');
    expect(fonts.map((f) => f.src)).toEqual([
      'plus-jakarta-sans-latin.woff2',
      'plus-jakarta-sans-latin-ext.woff2',
      'manrope-latin.woff2',
      'manrope-latin-ext.woff2',
    ]);
  });

  it('are real woff2 files, with the SIL Open Font License beside them', () => {
    for (const f of fonts) expect(readFileSync(`app/fonts/${f.src}`).subarray(0, 4).toString('latin1')).toBe('wOF2');
    for (const name of ['plus-jakarta-sans', 'manrope'])
      expect(readFileSync(`app/fonts/${name}-OFL.txt`, 'utf8')).toContain('SIL Open Font License, Version 1.1');
  });

  it('pair Latin with Latin Extended under one family, with the same ranges for both families', () => {
    const [jakarta, jakartaExt, manrope, manropeExt] = fonts;
    // the real names: certificate styles (proto.css) and the home page canvas (landing-fx) ask for them by name
    expect(jakarta!.family).toBe('Plus Jakarta Sans');
    expect(manrope!.family).toBe('Manrope');
    expect(jakartaExt!.family).toBe(jakarta!.family);
    expect(manropeExt!.family).toBe(manrope!.family);
    expect(manrope!.range).toBe(jakarta!.range);
    expect(manropeExt!.range).toBe(jakartaExt!.range);
    expect(jakarta!.range).toMatch(/^U\+0000-00FF, /);
    expect(jakartaExt!.range).toMatch(/^U\+0100-02BA, /);
  });
});
