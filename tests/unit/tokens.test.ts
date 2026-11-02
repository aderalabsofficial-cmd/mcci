import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('app/globals.css', 'utf8');
const block = (selector: string) => css.slice(css.indexOf(selector)).split('}')[0] ?? '';

describe('design tokens (docs/12-design-i18n.md, docs/15-mobile-app.md §5.1)', () => {
  it('carries the green identity in light and dark (owner, Nov 2026)', () => {
    expect(block(':root {')).toContain('--brand: #007845');
    expect(block('.dark {')).toContain('--bg: #06120d');
    expect(css).toContain('--color-navy-800: #005c35');
    expect(css).toContain('--color-gold-500: #e9b949');
  });

  it('meets WCAG AA: text on page and cards, white on green, input borders', () => {
    const token = (selector: string, name: string) =>
      (new RegExp(`--${name}: (#[0-9a-f]{3,6})`).exec(block(selector))?.[1] ?? '').replace(
        /^#(.)(.)(.)$/,
        '#$1$1$2$2$3$3',
      );
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    };
    const ratio = (x: string, y: string) => {
      const [hi, lo] = [lum(x), lum(y)].sort((p, q) => q - p);
      return (hi! + 0.05) / (lo! + 0.05);
    };
    for (const theme of [':root {', '.dark {']) {
      const t = (n: string) => token(theme, n);
      for (const surface of ['bg', 'card', 'card2', 'th']) {
        expect(ratio(t('t'), t(surface)), `${theme} text on ${surface}`).toBeGreaterThanOrEqual(4.5);
        expect(ratio(t('m'), t(surface)), `${theme} muted on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
      expect(ratio('#ffffff', t('brand')), `${theme} white on the buttons and selected tabs`).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(ratio(t('gt'), t('card')), `${theme} link on a card`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t('input-b'), t('card')), `${theme} input border`).toBeGreaterThanOrEqual(3);
    }
    // the sidebar and the darker end of the button gradient
    expect(ratio('#ffffff', '#005c35')).toBeGreaterThanOrEqual(4.5);
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
