import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('app/globals.css', 'utf8');
const block = (selector: string) => css.slice(css.indexOf(selector)).split('}')[0] ?? '';

describe('design tokens (docs/12-design-i18n.md, docs/15-mobile-app.md §5.1)', () => {
  it('ports the prototype palette for light and dark', () => {
    expect(block(':root {')).toContain('--bg: #fbf6ec');
    expect(block(':root {')).toContain('--em: #1b4f9c');
    expect(block('.dark {')).toContain('--bg: #07162f');
    expect(css).toContain('--color-navy-800: #0b2a5b');
    expect(css).toContain('--color-gold-500: #e9b949');
  });

  it('limits Jameel Noori Nastaleeq to Arabic script', () => {
    const face = block('@font-face');
    // content-hashed name (served with a one-year immutable cache, next.config.ts) that exists in public/
    const file = face.match(/url\('(\/fonts\/jameel-noori\.[0-9a-f]{10}\.woff2)'\)/)?.[1];
    expect(file).toBeDefined();
    expect(existsSync(`public${file}`)).toBe(true);
    expect(face).toContain('unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF');
  });

  it('switches to compact density at ≤ 640 px', () => {
    const compact = css.slice(css.indexOf('@media (max-width: 640px)'));
    for (const token of [
      '--gutter: 16px',
      '--card-radius: 14px',
      '--title: 20px',
      '--section-title: 16px',
      '--tap: 48px',
    ])
      expect(compact).toContain(token);
    expect(css).toContain('--appbar-h: 56px');
    expect(css).toContain('--bottomnav-h: 64px');
    expect(css).toContain('--breakpoint-sm: 40.0625rem');
  });

  it('turns motion off for reduced-motion users and inside the app', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain("[data-shell='app'] .hero-bg");
  });
});
