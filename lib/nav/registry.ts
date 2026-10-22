/**
 * Route registry — every screen in docs/catalogue/screens.md, in prototype order, plus the sidebar, page-tab and
 * bottom-tab structure of the prototype (member.js / admin.js / site.js) and docs/15-mobile-app.md §5.3.
 *
 * `milestone` says where the screen is built (docs/11-milestones.md). A screen is a live link only once
 * `BUILT` contains its milestone; until then the shells show it disabled with the reason (orphan rule,
 * docs/10-testing.md). Labels live in messages/*.json under `screens.<area>.<key>`.
 */

export type Area = 'site' | 'portal' | 'admin';
export type Milestone = 'M0' | 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'M7' | 'M8' | 'M9' | 'MA';

/** Milestones whose screens exist. Add a milestone here when its pages ship. */
export const BUILT: ReadonlySet<Milestone> = new Set<Milestone>(['M0']);

export type IconName =
  | 'home'
  | 'award'
  | 'sign'
  | 'filePlus'
  | 'folder'
  | 'card'
  | 'help'
  | 'calendar'
  | 'building'
  | 'clock'
  | 'file'
  | 'list'
  | 'sparkles'
  | 'bell'
  | 'globe'
  | 'userPlus'
  | 'shield'
  | 'hourglass'
  | 'printer'
  | 'database'
  | 'users'
  | 'idCard'
  | 'upload'
  | 'pen'
  | 'qr'
  | 'receipt'
  | 'mic'
  | 'mail'
  | 'chart'
  | 'team'
  | 'gear'
  | 'plug'
  | 'search'
  | 'scan'
  | 'menu'
  | 'inbox'
  | 'info'
  | 'route'
  | 'radio'
  | 'newspaper'
  | 'book'
  | 'phone'
  | 'login'
  | 'logout';

export interface Screen {
  area: Area;
  key: string;
  href: string;
  milestone: Milestone;
  icon: IconName;
}

const s = (area: Area, key: string, href: string, milestone: Milestone, icon: IconName): Screen => ({
  area,
  key,
  href,
  milestone,
  icon,
});

/* ---------- screens (docs/catalogue/screens.md) ---------- */

export const SCREENS: readonly Screen[] = [
  // Public website (13)
  s('site', 'home', '/', 'M0', 'home'),
  s('site', 'about', '/about', 'M2', 'info'),
  s('site', 'membership', '/membership', 'M2', 'award'),
  s('site', 'services', '/services', 'M2', 'list'),
  s('site', 'service', '/service', 'M2', 'file'),
  s('site', 'directory', '/directory', 'M2', 'building'),
  s('site', 'verify', '/verify', 'M2', 'scan'),
  s('site', 'track', '/track', 'M2', 'route'),
  s('site', 'live', '/live', 'M2', 'radio'),
  s('site', 'news', '/news', 'M2', 'newspaper'),
  s('site', 'resources', '/resources', 'M2', 'book'),
  s('site', 'contact', '/contact', 'M2', 'phone'),
  s('site', 'login', '/login', 'M1', 'login'),

  // Member portal (17)
  s('portal', 'dashboard', '/portal', 'M0', 'home'),
  s('portal', 'membership', '/portal/membership', 'M3', 'award'),
  s('portal', 'join', '/portal/join', 'M3', 'filePlus'),
  s('portal', 'mtrack', '/portal/mtrack', 'M3', 'clock'),
  s('portal', 'form', '/portal/form', 'M3', 'file'),
  s('portal', 'apply', '/portal/apply', 'M7', 'filePlus'),
  s('portal', 'applications', '/portal/applications', 'M7', 'list'),
  s('portal', 'application', '/portal/application', 'M7', 'file'),
  s('portal', 'documents', '/portal/documents', 'M6', 'folder'),
  s('portal', 'payments', '/portal/payments', 'M6', 'card'),
  s('portal', 'support', '/portal/support', 'M8', 'help'),
  s('portal', 'assistant', '/portal/assistant', 'M8', 'sparkles'),
  s('portal', 'notifications', '/portal/notifications', 'M8', 'bell'),
  s('portal', 'events', '/portal/events', 'M8', 'calendar'),
  s('portal', 'opportunities', '/portal/opportunities', 'M8', 'globe'),
  s('portal', 'profile', '/portal/profile', 'M8', 'building'),
  s('portal', 'endorse', '/portal/endorse', 'M4', 'sign'),

  // Admin panel (29)
  s('admin', 'dashboard', '/admin', 'M0', 'home'),
  s('admin', 'requests', '/admin/requests', 'M5', 'userPlus'),
  s('admin', 'mreview', '/admin/mreview', 'M5', 'shield'),
  s('admin', 'committee', '/admin/committee', 'M5', 'award'),
  s('admin', 'temp', '/admin/temp', 'M6', 'hourglass'),
  s('admin', 'certs', '/admin/certs', 'M6', 'printer'),
  s('admin', 'serials', '/admin/serials', 'M6', 'database'),
  s('admin', 'members', '/admin/members', 'M8', 'users'),
  s('admin', 'member', '/admin/member', 'M8', 'idCard'),
  s('admin', 'import', '/admin/import', 'M8', 'upload'),
  s('admin', 'applications', '/admin/applications', 'M7', 'file'),
  s('admin', 'review', '/admin/review', 'M7', 'shield'),
  s('admin', 'sla', '/admin/sla', 'M7', 'clock'),
  s('admin', 'approvals', '/admin/approvals', 'M7', 'pen'),
  s('admin', 'documents', '/admin/documents', 'M6', 'qr'),
  s('admin', 'payments', '/admin/payments', 'M6', 'card'),
  s('admin', 'psid', '/admin/psid', 'M6', 'receipt'),
  s('admin', 'events', '/admin/events', 'M8', 'calendar'),
  s('admin', 'meetings', '/admin/meetings', 'M5', 'mic'),
  s('admin', 'complaints', '/admin/complaints', 'M8', 'help'),
  s('admin', 'content', '/admin/content', 'M8', 'globe'),
  s('admin', 'notify', '/admin/notify', 'M8', 'mail'),
  s('admin', 'reports', '/admin/reports', 'M9', 'chart'),
  s('admin', 'ai', '/admin/ai', 'M9', 'sparkles'),
  s('admin', 'staff', '/admin/staff', 'M1', 'team'),
  s('admin', 'audit', '/admin/audit', 'M9', 'clock'),
  s('admin', 'services', '/admin/services', 'M7', 'gear'),
  s('admin', 'integrations', '/admin/integrations', 'M9', 'plug'),
  s('admin', 'settings', '/admin/settings', 'M9', 'gear'),
];

export function screen(area: Area, key: string): Screen {
  const found = SCREENS.find((x) => x.area === area && x.key === key);
  if (!found) throw new Error(`Unknown screen ${area}/${key}`);
  return found;
}

export const isBuilt = (m: Milestone) => BUILT.has(m);

/* ---------- sidebars (prototype M.NAV) ---------- */

export interface NavSection {
  /** messages key under `nav.sections`, or null for the ungrouped first item */
  section: string | null;
  /** screen keys; each item opens that screen and is "on" for every screen in its page-tab group */
  items: { label: string; key: string; color: string }[];
}

export const SIDEBAR: Record<'portal' | 'admin', NavSection[]> = {
  portal: [
    { section: null, items: [{ label: 'dashboard', key: 'dashboard', color: '#9fd0ff' }] },
    {
      section: 'membership',
      items: [
        { label: 'membership', key: 'membership', color: '#f0c46a' },
        { label: 'endorse', key: 'endorse', color: '#ffd27a' },
      ],
    },
    {
      section: 'services',
      items: [
        { label: 'apply', key: 'apply', color: '#7ee0d8' },
        { label: 'documents', key: 'documents', color: '#ffb27a' },
        { label: 'payments', key: 'payments', color: '#8be3a5' },
      ],
    },
    { section: 'help', items: [{ label: 'support', key: 'support', color: '#9fd0ff' }] },
    {
      section: 'more',
      items: [
        { label: 'events', key: 'events', color: '#ff9ec4' },
        { label: 'profile', key: 'profile', color: '#cbd5e1' },
      ],
    },
  ],
  admin: [
    { section: null, items: [{ label: 'dashboard', key: 'dashboard', color: '#9fd0ff' }] },
    {
      section: 'membership',
      items: [
        { label: 'pipeline', key: 'requests', color: '#f0c46a' },
        { label: 'tempCerts', key: 'temp', color: '#7ee0d8' },
        { label: 'membersRegister', key: 'members', color: '#9fd0ff' },
      ],
    },
    {
      section: 'servicesDesk',
      items: [
        { label: 'serviceRequests', key: 'applications', color: '#7ee0d8' },
        { label: 'documentsQr', key: 'documents', color: '#9fd0ff' },
      ],
    },
    { section: 'finance', items: [{ label: 'payments', key: 'payments', color: '#8be3a5' }] },
    {
      section: 'engagement',
      items: [
        { label: 'eventsMeetings', key: 'events', color: '#ff9ec4' },
        { label: 'complaints', key: 'complaints', color: '#7ee0d8' },
        { label: 'contentMessaging', key: 'content', color: '#f0c46a' },
      ],
    },
    {
      section: 'insights',
      items: [
        { label: 'reportsAi', key: 'reports', color: '#c9a8ff' },
        { label: 'staffAudit', key: 'staff', color: '#7ee0d8' },
        { label: 'servicesIntegrations', key: 'services', color: '#ffb27a' },
        { label: 'settings', key: 'settings', color: '#cbd5e1' },
      ],
    },
  ],
};

/* ---------- page tabs (prototype M.GROUPS): screens shown together under one sidebar item ---------- */

export const PAGE_TABS: Record<'portal' | 'admin', string[][]> = {
  portal: [
    ['membership', 'join', 'mtrack', 'form'],
    ['apply', 'applications', 'application'],
    ['support', 'assistant', 'notifications'],
    ['events', 'opportunities'],
  ],
  admin: [
    ['requests', 'mreview', 'committee'],
    ['temp', 'certs', 'serials'],
    ['members', 'member', 'import'],
    ['applications', 'review', 'sla', 'approvals'],
    ['payments', 'psid'],
    ['events', 'meetings'],
    ['content', 'notify'],
    ['reports', 'ai'],
    ['staff', 'audit'],
    ['services', 'integrations'],
  ],
};

/** The page-tab group a screen belongs to, or null. */
export function tabGroupOf(area: 'portal' | 'admin', key: string): string[] | null {
  return PAGE_TABS[area].find((g) => g.includes(key)) ?? null;
}

/* ---------- public header nav (prototype site.js PNAV) ---------- */

export const SITE_NAV = [
  'home',
  'about',
  'membership',
  'services',
  'directory',
  'verify',
  'track',
  'news',
  'resources',
  'contact',
] as const;

/* ---------- compact mobile bottom tabs (docs/15-mobile-app.md §5.3) ---------- */

/**
 * A tab either opens a screen or is the "More" sheet. `screens` lists every screen that marks the tab active.
 * Tabs that point to a feature without a catalogue screen yet carry their own milestone.
 */
export type BottomTab =
  | { id: string; icon: IconName; kind: 'screen'; screen: string; also?: string[] }
  | { id: string; icon: IconName; kind: 'feature'; milestone: Milestone }
  | { id: 'more'; icon: 'menu'; kind: 'more' };

export const BOTTOM_TABS: Record<Area, BottomTab[]> = {
  site: [
    { id: 'home', icon: 'home', kind: 'screen', screen: 'home' },
    { id: 'services', icon: 'list', kind: 'screen', screen: 'services', also: ['service'] },
    { id: 'verify', icon: 'scan', kind: 'screen', screen: 'verify' },
    { id: 'directory', icon: 'building', kind: 'screen', screen: 'directory' },
    { id: 'more', icon: 'menu', kind: 'more' },
  ],
  portal: [
    { id: 'home', icon: 'home', kind: 'screen', screen: 'dashboard' },
    { id: 'services', icon: 'filePlus', kind: 'screen', screen: 'apply', also: ['applications', 'application'] },
    { id: 'documents', icon: 'folder', kind: 'screen', screen: 'documents' },
    { id: 'messages', icon: 'bell', kind: 'screen', screen: 'notifications' },
    { id: 'more', icon: 'menu', kind: 'more' },
  ],
  admin: [
    // "My queue" is built with the Android work (MA); the dashboard stays reachable from More.
    { id: 'queue', icon: 'inbox', kind: 'feature', milestone: 'MA' },
    // Global search (action search.open) needs the data from M1+; built with reports & hardening.
    { id: 'search', icon: 'search', kind: 'feature', milestone: 'M9' },
    { id: 'notifications', icon: 'bell', kind: 'feature', milestone: 'M8' },
    { id: 'members', icon: 'users', kind: 'screen', screen: 'members', also: ['member', 'import'] },
    { id: 'more', icon: 'menu', kind: 'more' },
  ],
};

/** Items of the "More" sheet, in the order of docs/15-mobile-app.md §5.3. */
export const MORE_SHEET: Record<Area, string[]> = {
  site: ['membership', 'track', 'news', 'resources', 'about', 'contact', 'live', 'login'],
  portal: ['membership', 'mtrack', 'payments', 'endorse', 'events', 'opportunities', 'profile', 'support', 'assistant'],
  admin: SCREENS.filter((x) => x.area === 'admin' && x.key !== 'members').map((x) => x.key),
};
