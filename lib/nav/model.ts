import en from '@/messages/en.json';
import ur from '@/messages/ur.json';
import type { Locale } from '@/i18n/routing';
import {
  type Area,
  BOTTOM_TABS,
  type IconName,
  isBuilt,
  MORE_SHEET,
  PAGE_TABS,
  screen,
  SIDEBAR,
  SITE_NAV,
} from './registry';

/**
 * Turns the route registry into what the shells render: labels in both languages, a link when the screen is
 * built, otherwise the reason it is disabled. Pure, so it runs on the server and in unit tests.
 */

export interface Label {
  en: string;
  ur: string;
}

export interface NavItem {
  id: string;
  label: Label;
  icon: IconName;
  /** link target when built, otherwise null */
  href: string | null;
  /** shown as the disabled control's title (orphan rule: disabled controls have a reason) */
  reason: string | null;
  /** paths that mark this item as the current one */
  match: string[];
  color?: string;
}

export interface NavSectionModel {
  title: Label | null;
  items: NavItem[];
}

type Messages = typeof en;
const DICT: Record<Locale, Messages> = { en, ur };

export function msg(locale: Locale, path: string, vars: Record<string, string> = {}): string {
  const value = path
    .split('.')
    .reduce<unknown>((node, k) => (node as Record<string, unknown> | undefined)?.[k], DICT[locale]);
  if (typeof value !== 'string') throw new Error(`Missing message ${locale}:${path}`);
  return value.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}

const both = (path: string): Label => ({ en: msg('en', path), ur: msg('ur', path) });

function screenItem(locale: Locale, area: Area, key: string, labelPath: string, extra: Partial<NavItem> = {}): NavItem {
  const sc = screen(area, key);
  const built = isBuilt(sc.milestone);
  return {
    id: key,
    label: both(labelPath),
    icon: sc.icon,
    href: built ? sc.href : null,
    reason: built ? null : msg(locale, 'common.notYet', { milestone: sc.milestone }),
    match: [sc.href],
    ...extra,
  };
}

function groupHrefs(area: 'portal' | 'admin', key: string): string[] {
  const group = PAGE_TABS[area].find((g) => g.includes(key)) ?? [key];
  return group.map((k) => screen(area, k).href);
}

export function sidebarModel(area: 'portal' | 'admin', locale: Locale): NavSectionModel[] {
  return SIDEBAR[area].map((section) => ({
    title: section.section ? both(`nav.sections.${section.section}`) : null,
    items: section.items.map((it) =>
      screenItem(locale, area, it.key, `nav.${area}.${it.label}`, { color: it.color, match: groupHrefs(area, it.key) }),
    ),
  }));
}

export function pageTabsModel(area: 'portal' | 'admin', locale: Locale): NavItem[][] {
  return PAGE_TABS[area].map((group) => group.map((key) => screenItem(locale, area, key, `tabs.${area}.${key}`)));
}

export function siteNavModel(locale: Locale): NavItem[] {
  return SITE_NAV.map((key) => screenItem(locale, 'site', key, `nav.site.${key}`));
}

export function loginModel(locale: Locale): NavItem {
  return screenItem(locale, 'site', 'login', 'common.memberLogin');
}

export function bottomTabsModel(area: Area, locale: Locale): NavItem[] {
  return BOTTOM_TABS[area].map((tab) => {
    const label = both(`bottom.${area}.${tab.id}`);
    if (tab.kind === 'more') return { id: 'more', label, icon: tab.icon, href: null, reason: null, match: [] };
    if (tab.kind === 'feature') {
      const built = isBuilt(tab.milestone);
      return {
        id: tab.id,
        label,
        icon: tab.icon,
        href: null,
        reason: built ? null : msg(locale, 'common.notYet', { milestone: tab.milestone }),
        match: [],
      };
    }
    const keys = [tab.screen, ...(tab.also ?? [])];
    return screenItem(locale, area, tab.screen, `bottom.${area}.${tab.id}`, {
      id: tab.id,
      match: keys.map((k) => screen(area, k).href),
    });
  });
}

export function moreSheetModel(area: Area, locale: Locale): NavItem[] {
  return MORE_SHEET[area].map((key) => screenItem(locale, area, key, `screens.${area}.${key}`));
}

/** Public footer columns (prototype site.js footer). The Staff portal link opens the admin. */
const FOOTER: { heading: string; links: { label: string; area: Area; key: string; query?: string }[] }[] = [
  {
    heading: 'services',
    links: [
      { label: 'ebil', area: 'site', key: 'service', query: 's=ebil' },
      { label: 'origin', area: 'site', key: 'service', query: 's=co' },
      { label: 'visa', area: 'site', key: 'service', query: 's=visa' },
      { label: 'allServices', area: 'site', key: 'services' },
    ],
  },
  {
    heading: 'chamber',
    links: [
      { label: 'aboutMcci', area: 'site', key: 'about' },
      { label: 'membership', area: 'site', key: 'membership' },
      { label: 'directory', area: 'site', key: 'directory' },
      { label: 'newsEvents', area: 'site', key: 'news' },
    ],
  },
  {
    heading: 'help',
    links: [
      { label: 'verifyDocument', area: 'site', key: 'verify' },
      { label: 'trackToken', area: 'site', key: 'track' },
      { label: 'complaintDesk', area: 'site', key: 'contact' },
      { label: 'staffPortal', area: 'admin', key: 'dashboard' },
    ],
  },
];

export function footerModel(locale: Locale): { heading: Label; links: NavItem[] }[] {
  return FOOTER.map((col) => ({
    heading: both(`footer.${col.heading}`),
    links: col.links.map((l) => {
      const item = screenItem(locale, l.area, l.key, `footer.${l.label}`, { id: l.label });
      return item.href && l.query ? { ...item, href: `${item.href}?${l.query}` } : item;
    }),
  }));
}

/** Is `pathname` (without locale prefix) the current page for an item? Exact match only: '/portal' ≠ '/portal/x'. */
export function isCurrent(item: Pick<NavItem, 'match'>, pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  return item.match.includes(p);
}
