import { describe, expect, it } from 'vitest';
import {
  bottomTabsModel,
  footerModel,
  isCurrent,
  loginModel,
  moreSheetModel,
  msg,
  sidebarModel,
  siteNavModel,
} from '@/lib/nav/model';

describe('nav model', () => {
  it('links built screens and disables the rest with a reason naming the milestone', () => {
    const nav = siteNavModel('en');
    expect(nav[0]).toMatchObject({ id: 'home', href: '/', reason: null });
    // M2 (public website) is built: every public page is a link
    expect(nav.find((i) => i.id === 'membership')).toMatchObject({
      id: 'membership',
      href: '/membership',
      reason: null,
    });
    expect(nav.every((i) => i.href !== null)).toBe(true);
    const reports = sidebarModel('admin', 'en')
      .flatMap((s) => s.items)
      .find((i) => i.id === 'reports')!;
    expect(reports).toMatchObject({ href: null, reason: 'Being built — milestone M9' });
    expect(loginModel('ur')).toMatchObject({ href: '/login', reason: null }); // M1 is built
    const portal = sidebarModel('portal', 'ur').flatMap((s) => s.items);
    // engagement part 1 (M8a) is built; the AI assistant (M8) is not yet
    expect(portal.find((i) => i.id === 'events')).toMatchObject({ href: '/portal/events', reason: null });
    const assistant = portal.find((i) => i.id === 'assistant');
    if (assistant) expect(assistant).toMatchObject({ href: null, reason: 'تیاری میں — مرحلہ M8' });
  });

  it('gives every item both languages', () => {
    const first = sidebarModel('portal', 'en')[0]!.items[0]!;
    expect(first.label).toEqual({ en: 'Home', ur: 'ہوم' });
  });

  it('marks a sidebar item current on every screen of its page-tab group', () => {
    const membership = sidebarModel('portal', 'en')
      .flatMap((s) => s.items)
      .find((i) => i.id === 'membership')!;
    expect(isCurrent(membership, '/portal/mtrack')).toBe(true);
    expect(isCurrent(membership, '/portal/form/')).toBe(true);
    expect(isCurrent(membership, '/portal')).toBe(false);
  });

  it('matches paths exactly so Home is not current on inner pages', () => {
    const home = bottomTabsModel('portal', 'en')[0]!;
    expect(isCurrent(home, '/portal')).toBe(true);
    expect(isCurrent(home, '/portal/documents')).toBe(false);
  });

  it('keeps unbuilt feature tabs disabled (staff My queue is built with the app)', () => {
    const queue = bottomTabsModel('admin', 'en')[0]!;
    expect(queue).toMatchObject({ id: 'queue', href: null, reason: 'Being built — milestone MA' });
    expect(bottomTabsModel('admin', 'en').at(-1)).toMatchObject({ id: 'more', href: null, reason: null });
  });

  it('puts the admin dashboard in the staff More sheet', () => {
    expect(moreSheetModel('admin', 'en')[0]).toMatchObject({ id: 'dashboard', href: '/admin' });
  });

  it('links the footer Staff portal to the admin', () => {
    const help = footerModel('en').find((c) => c.heading.en === 'Help')!;
    expect(help.links.at(-1)).toMatchObject({ id: 'staffPortal', href: '/admin' });
  });

  it('reads messages with placeholders and fails loudly on a missing key', () => {
    expect(msg('en', 'footer.copyright', { year: '2026' })).toBe('© 2026 Multan Chamber of Commerce & Industry');
    expect(() => msg('en', 'nope.missing')).toThrow(/Missing message/);
  });
});
