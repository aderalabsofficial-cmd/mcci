import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import en from '@/messages/en.json';
import { BOTTOM_TABS, MORE_SHEET, PAGE_TABS, SCREENS, screen, SIDEBAR, SITE_NAV, type Area } from '@/lib/nav/registry';

/** Every row of docs/catalogue/screens.md: [area, prototype page, route]. */
function catalogue(): { area: Area; key: string; href: string }[] {
  const md = readFileSync('docs/catalogue/screens.md', 'utf8');
  const area: Record<string, Area> = { site: 'site', member: 'portal', admin: 'admin' };
  return [...md.matchAll(/^\| [^|]+ \| `(site|member|admin)\/(\w+)\/` \| `([^`]+)` \|/gm)].map((m) => ({
    area: area[m[1]!]!,
    key: m[2]!,
    href: m[3]!,
  }));
}

const has = (tree: unknown, path: string) =>
  typeof path.split('.').reduce<unknown>((n, k) => (n as Record<string, unknown> | undefined)?.[k], tree) === 'string';

describe('route registry', () => {
  it('lists every catalogue screen with the catalogue route (63 screens)', () => {
    const rows = catalogue();
    expect(rows).toHaveLength(63);
    for (const row of rows) expect(screen(row.area, row.key).href, `${row.area}/${row.key}`).toBe(row.href);
    expect(SCREENS).toHaveLength(rows.length);
  });

  it('has unique routes', () => {
    const hrefs = SCREENS.map((s) => s.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('has a title in messages for every screen', () => {
    for (const s of SCREENS) expect(has(en, `screens.${s.area}.${s.key}`), `${s.area}/${s.key}`).toBe(true);
  });

  it('sidebars, page tabs, header nav and More sheets only reference real screens with labels', () => {
    for (const area of ['portal', 'admin'] as const) {
      for (const section of SIDEBAR[area]) {
        if (section.section) expect(has(en, `nav.sections.${section.section}`)).toBe(true);
        for (const item of section.items) {
          expect(() => screen(area, item.key)).not.toThrow();
          expect(has(en, `nav.${area}.${item.label}`), item.label).toBe(true);
        }
      }
      for (const key of PAGE_TABS[area].flat()) {
        expect(() => screen(area, key)).not.toThrow();
        expect(has(en, `tabs.${area}.${key}`), key).toBe(true);
      }
    }
    for (const key of SITE_NAV) expect(has(en, `nav.site.${key}`)).toBe(true);
    for (const area of ['site', 'portal', 'admin'] as const)
      for (const key of MORE_SHEET[area]) expect(() => screen(area, key)).not.toThrow();
  });

  it('bottom tabs follow docs/15-mobile-app.md §5.3: five tabs, More last', () => {
    for (const area of ['site', 'portal', 'admin'] as const) {
      const tabs = BOTTOM_TABS[area];
      expect(tabs).toHaveLength(5);
      expect(tabs.at(-1)?.kind).toBe('more');
      for (const tab of tabs) {
        expect(has(en, `bottom.${area}.${tab.id}`), `${area}.${tab.id}`).toBe(true);
        if (tab.kind === 'screen')
          for (const key of [tab.screen, ...(tab.also ?? [])]) expect(() => screen(area, key)).not.toThrow();
      }
    }
    expect(BOTTOM_TABS.portal.map((t) => t.id)).toEqual(['home', 'services', 'documents', 'messages', 'more']);
    expect(BOTTOM_TABS.admin.map((t) => t.id)).toEqual(['queue', 'search', 'notifications', 'members', 'more']);
    expect(BOTTOM_TABS.site.map((t) => t.id)).toEqual(['home', 'services', 'verify', 'directory', 'more']);
  });
});
