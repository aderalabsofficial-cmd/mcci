import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import {
  type Browser,
  type BrowserContext,
  type ConsoleMessage,
  expect,
  type Page,
  type Response,
  test,
} from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalEnv } from '../integration/local-env';
import { totp } from '../support/totp';
import { readAccounts, STAFF, STATE } from './accounts';

/**
 * Phase 1 acceptance crawl (docs/acceptance, 6 Nov 2026). Opt-in: ACCEPTANCE=1, desktop project, local stack only.
 *
 * For every persona — visitor, applicant, Corporate and Associate member, a company Viewer, and one staff member per
 * designation in role_permissions — it opens every page under app/[locale] (English, and Urdu for one persona per
 * area), and records for each page: HTTP status, where it ended up (shown / "outside your limits" / redirected / not
 * found / error), browser errors, failed same-origin requests, horizontal overflow, raw message keys, and every
 * interactive element (kind, accessible name, data-action, href, disabled reason, orphan rule of docs/10). Each
 * internal link found is then requested with that persona's session to check it resolves.
 *
 * It only reads: it opens pages and follows links, never submits a form or clicks an action. The personas it creates
 * (e2e-acc-<run>-…@test.local) are removed at the end of each persona's test. Results go to
 * acceptance-results/*.json (git-ignored); screenshots to docs/acceptance/evidence/crawl/ (synthetic data only).
 * The functional outcome of actions is verified by the workflow specs, not here.
 */

const ON = process.env.ACCEPTANCE === '1';
/** ACCEPTANCE_TARGET=production (playwright.acceptance-prod.config.ts): visitor only, read-only, no accounts made */
const PROD = process.env.ACCEPTANCE_TARGET === 'production';
const OUT = 'acceptance-results'; // git-ignored; Playwright empties test-results/ at the start of a run
const SHOTS = join('docs', 'acceptance', 'evidence', PROD ? 'crawl-production' : 'crawl');
const NAMESPACES = Object.keys(JSON.parse(readFileSync('messages/en.json', 'utf8')) as Record<string, unknown>);

/** Every page.tsx under app/[locale], as a URL path; dynamic segments get a placeholder that cannot exist. */
function discoverRoutes(): { route: string; dynamic: boolean }[] {
  const root = join('app', '[locale]');
  const found: { route: string; dynamic: boolean }[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name === 'page.tsx') {
        const parts = relative(root, dir)
          .split(sep)
          .filter((s) => s && !/^\(.*\)$/.test(s));
        const dynamic = parts.some((s) => s.startsWith('['));
        const route =
          '/' +
          parts.map((s) => (s.startsWith('[') ? `acceptance-${s.replace(/[[\].]/g, '')}-does-not-exist` : s)).join('/');
        found.push({ route: route === '/' ? '/' : route.replace(/\/$/, ''), dynamic });
      }
    }
  };
  walk(root);
  return found.sort((a, b) => a.route.localeCompare(b.route));
}

const ROUTES = discoverRoutes();
const area = (r: string) => (r.startsWith('/admin') ? 'admin' : r.startsWith('/portal') ? 'portal' : 'public');
const localized = (r: string, l: 'en' | 'ur') => (l === 'en' ? r : `/ur${r === '/' ? '' : r}`);
const slug = (s: string) =>
  s
    .replace(/^\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '') || 'home';

type Persona = {
  key: string;
  label: string;
  kind: 'anon' | 'member' | 'staff';
  designation?: string;
  companyRole?: string;
  memberClass?: string;
  /** areas crawled in English; areas also crawled in Urdu */
  en: ('public' | 'portal' | 'admin')[];
  ur: ('public' | 'portal' | 'admin')[];
};

const ALL = ['public', 'portal', 'admin'] as const;
const BASE_PERSONAS: Persona[] = [
  { key: 'visitor', label: 'Visitor (not signed in)', kind: 'anon', en: [...ALL], ur: ['public'] },
  {
    key: 'member-corporate-owner',
    label: 'Corporate member — Owner',
    kind: 'member',
    companyRole: 'Owner',
    memberClass: 'Corporate',
    en: [...ALL],
    ur: ['portal'],
  },
  {
    key: 'member-associate-owner',
    label: 'Associate member — Owner',
    kind: 'member',
    companyRole: 'Owner',
    memberClass: 'Associate',
    en: ['portal'],
    ur: [],
  },
  {
    key: 'member-viewer',
    label: 'Corporate member — Viewer (company user)',
    kind: 'member',
    companyRole: 'Viewer',
    memberClass: 'Corporate',
    en: ['portal'],
    ur: [],
  },
  {
    key: 'applicant',
    label: 'Applicant (registered, no membership)',
    kind: 'member',
    companyRole: 'Owner',
    en: ['portal', 'admin'],
    ur: [],
  },
];

/** the synthetic personas auth.setup.ts already signed in, reused as they are */
const SETUP_STAFF: Record<string, keyof typeof STATE> = Object.fromEntries(
  Object.entries(STAFF).map(([k, d]) => [d, k as keyof typeof STATE]),
);

type ElementRecord = {
  kind: string;
  name: string;
  action: string | null;
  href: string | null;
  disabled: boolean;
  disabledReason: string | null;
  orphan: boolean;
  hit: string;
};
type PageRecord = {
  persona: string;
  route: string;
  locale: 'en' | 'ur';
  url: string;
  status: number | null;
  finalPath: string;
  outcome: 'shown' | 'denied' | 'redirected' | 'not-found' | 'error';
  title: string;
  heading: string;
  dir: string | null;
  consoleErrors: string[];
  failedRequests: string[];
  overflow: number;
  rawKeys: string[];
  elements: ElementRecord[];
  shot: string | null;
  ms: number;
};
type LinkRecord = { persona: string; href: string; status: number; from: string };

async function collect(page: Page): Promise<Omit<ElementRecord, never>[]> {
  return page.evaluate(() => {
    const visible = (el: Element) => {
      // content of a collapsed <details> keeps a box in Chrome but is not shown (a false "unnamed control" otherwise)
      if (el.closest('details:not([open])') && !el.closest('summary')) return false;
      const r = (el as HTMLElement).getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const nameOf = (el: Element) => {
      const h = el as HTMLElement;
      const labelled = h.getAttribute('aria-labelledby');
      const byId = labelled
        ? labelled
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.textContent ?? '')
            .join(' ')
        : '';
      const label =
        (h as HTMLInputElement).labels && (h as HTMLInputElement).labels!.length
          ? [...(h as HTMLInputElement).labels!].map((l) => l.textContent ?? '').join(' ')
          : '';
      return (
        h.getAttribute('aria-label') ||
        byId ||
        label ||
        h.innerText ||
        h.getAttribute('title') ||
        h.getAttribute('placeholder') ||
        h.getAttribute('name') ||
        ''
      )
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 90);
    };
    const sel =
      'a, button, [role=tab], [role=button], [role=menuitem], [role=switch], [role=checkbox], [role=radio], [role=combobox], input:not([type=hidden]), select, textarea, summary';
    return [...document.querySelectorAll(sel)].filter(visible).map((el) => {
      const h = el as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute('type') || '').toLowerCase();
      const role = el.getAttribute('role');
      const kind =
        tag === 'a'
          ? 'link'
          : tag === 'button'
            ? role === 'tab'
              ? 'tab'
              : type === 'submit'
                ? 'submit'
                : 'button'
            : role === 'tab'
              ? 'tab'
              : tag === 'input'
                ? `input:${type || 'text'}`
                : tag === 'select'
                  ? 'select'
                  : tag === 'textarea'
                    ? 'textarea'
                    : tag === 'summary'
                      ? 'disclosure'
                      : role || tag;
      const disabled = (el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true';
      // docs/10-testing.md orphan rule, as tests/e2e/helpers.ts expectNoOrphans
      const orphan = el.matches('a')
        ? !el.getAttribute('href') || el.getAttribute('href') === '#'
        : el.matches('button:disabled')
          ? !el.getAttribute('title')
          : el.matches('button,[role=tab]')
            ? !el.hasAttribute('data-action') && !el.closest('form') && !el.getAttribute('aria-controls')
            : false;
      const r = h.getBoundingClientRect();
      return {
        kind,
        name: nameOf(el),
        action: el.getAttribute('data-action'),
        href: tag === 'a' ? el.getAttribute('href') : null,
        disabled,
        disabledReason: disabled ? el.getAttribute('title') : null,
        orphan,
        hit: `${Math.round(r.width)}x${Math.round(r.height)}`,
      };
    });
  });
}

async function crawlPage(
  page: Page,
  persona: Persona,
  route: string,
  locale: 'en' | 'ur',
  shotTaken: Set<string>,
): Promise<PageRecord> {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const onConsole = (m: ConsoleMessage) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
  };
  const onError = (e: Error) => consoleErrors.push(`pageerror: ${e.message.slice(0, 300)}`);
  const origin = new URL(page.url() === 'about:blank' ? 'http://x' : page.url()).origin;
  const onResponse = (r: Response) => {
    if (r.status() >= 500) failedRequests.push(`${r.status()} ${r.request().method()} ${r.url().replace(origin, '')}`);
  };
  page.on('console', onConsole);
  page.on('pageerror', onError);
  page.on('response', onResponse);
  const url = localized(route, locale);
  const started = Date.now();
  let status: number | null = null;
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    status = res?.status() ?? null;
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
  } catch (e) {
    consoleErrors.push(`navigation: ${(e as Error).message.slice(0, 200)}`);
  }
  const finalPath = new URL(page.url()).pathname;
  const info = await page
    .evaluate((ns) => {
      const text = document.body?.innerText ?? '';
      const keyRe = new RegExp(`^(${ns.join('|')})\\.[A-Za-z0-9_.]+$`);
      const rawKeys = [...document.querySelectorAll('body *')]
        .filter((el) => el.children.length === 0)
        .map((el) => (el.textContent ?? '').trim())
        .filter((t) => t.length < 80 && keyRe.test(t));
      return {
        title: document.title,
        heading: (document.querySelector('h1')?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120),
        dir: document.documentElement.getAttribute('dir'),
        denied: /This screen is outside your limits|یہ صفحہ آپ کی حدود سے باہر ہے/.test(text),
        errorBoundary: /Something went wrong|Application error/i.test(text),
        overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        rawKeys: [...new Set(rawKeys)].slice(0, 10),
      };
    }, NAMESPACES)
    .catch(() => ({ title: '', heading: '', dir: null, denied: false, errorBoundary: true, overflow: 0, rawKeys: [] }));
  const elements = await collect(page).catch(() => []);
  page.off('console', onConsole);
  page.off('pageerror', onError);
  page.off('response', onResponse);
  const wanted = localized(route, locale).replace(/\/$/, '') || '/';
  const outcome: PageRecord['outcome'] =
    status !== null && status >= 500
      ? 'error'
      : info.errorBoundary
        ? 'error'
        : status === 404
          ? 'not-found'
          : info.denied
            ? 'denied'
            : finalPath.replace(/\/$/, '') !== wanted && (finalPath || '/') !== wanted
              ? 'redirected'
              : 'shown';
  // one screenshot per route (first persona that sees it), and every page with a problem
  const problem =
    outcome === 'error' ||
    consoleErrors.length > 0 ||
    failedRequests.length > 0 ||
    info.overflow > 0 ||
    info.rawKeys.length > 0 ||
    elements.some((e) => e.orphan);
  const key = `${locale}${route}`;
  let shot: string | null = null;
  if ((outcome === 'shown' && !shotTaken.has(key)) || problem) {
    shotTaken.add(key);
    mkdirSync(join(SHOTS, persona.key), { recursive: true });
    shot = join(SHOTS, persona.key, `${locale}-${slug(route)}${problem ? '-PROBLEM' : ''}.jpg`);
    await page.screenshot({ path: shot, type: 'jpeg', quality: 55 }).catch(() => (shot = null));
  }
  return {
    persona: persona.key,
    route,
    locale,
    url,
    status,
    finalPath,
    outcome,
    title: info.title,
    heading: info.heading,
    dir: info.dir,
    consoleErrors: [...new Set(consoleErrors)].slice(0, 10),
    failedRequests: [...new Set(failedRequests)].slice(0, 10),
    overflow: info.overflow,
    rawKeys: info.rawKeys,
    elements,
    shot: shot ? shot.split(sep).join('/') : null,
    ms: Date.now() - started,
  };
}

/** creates the persona's account(s) on the LOCAL stack, signs in through the real pages, returns a context */
async function signIn(
  browser: Browser,
  admin: SupabaseClient,
  env: NonNullable<ReturnType<typeof readLocalEnv>>,
  persona: Persona,
  cleanup: (() => PromiseLike<unknown>)[],
): Promise<BrowserContext> {
  if (persona.kind === 'anon') return browser.newContext();
  // reuse the setup project's signed-in personas where they exist
  const reuse =
    persona.kind === 'member' && persona.key === 'member-corporate-owner'
      ? 'member'
      : persona.kind === 'staff'
        ? SETUP_STAFF[persona.designation!]
        : undefined;
  if (reuse) {
    const ctx = await browser.newContext();
    const state = JSON.parse(readFileSync(STATE[reuse], 'utf8')) as {
      cookies: Parameters<BrowserContext['addCookies']>[0];
    };
    await ctx.addCookies(state.cookies.filter((c) => c.name !== 'mcci_seen'));
    return ctx;
  }
  const run = randomUUID().slice(0, 8);
  const email = `e2e-acc-${run}-${persona.key.replace(/[^a-z0-9]+/g, '-')}@test.local`.slice(0, 64);
  const password = randomBytes(18).toString('base64url');
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `Acceptance ${persona.label}` },
  });
  expect(created.error?.message ?? null).toBeNull();
  const userId = created.data.user!.id;
  cleanup.push(() => admin.auth.admin.deleteUser(userId));
  const ok = (r: { error: { message: string } | null }) => expect(r.error?.message ?? null).toBeNull();
  if (persona.kind === 'member') {
    let companyId: string;
    if (persona.companyRole === 'Viewer') {
      companyId = readAccounts().companyId!;
    } else {
      companyId = randomUUID();
      ok(await admin.from('companies').insert({ id: companyId, name: `Acceptance ${run} Co`, biz_type: 'pvt' }));
      cleanup.unshift(() => admin.from('companies').delete().eq('id', companyId));
    }
    ok(
      await admin.from('company_users').insert({ company_id: companyId, user_id: userId, role: persona.companyRole! }),
    );
    cleanup.unshift(() => admin.from('company_users').delete().eq('user_id', userId));
    if (persona.memberClass && persona.companyRole !== 'Viewer') {
      const memberId = randomUUID();
      ok(
        await admin.from('members').insert({
          id: memberId,
          member_no: `MCCI-${persona.memberClass[0]}-8${String(Math.floor(Math.random() * 90000) + 10000)}`,
          company_id: companyId,
          class: persona.memberClass,
          status: 'Permanent',
          rep_name: `Acceptance ${persona.label}`,
          since: '2021-04-01',
          valid_to: '2099-03-31',
        }),
      );
      cleanup.unshift(() => admin.from('members').delete().eq('id', memberId));
    }
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/login');
    await p.getByLabel('Mobile, email or member ID').fill(email);
    await p.getByRole('tabpanel', { name: 'Member login' }).getByLabel('Password', { exact: true }).fill(password);
    await p.locator('[data-action="login.member"]').click();
    await p.waitForURL(/\/(portal|register)/, { timeout: 30_000 });
    await p.close();
    return ctx;
  }
  // staff: staff row + verified authenticator, then the staff sign-in page with the 6-digit code
  ok(await admin.from('staff').insert({ user_id: userId, designation: persona.designation! }));
  cleanup.unshift(() => admin.from('staff').delete().eq('user_id', userId));
  const person = createClient(env.url, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  ok(await person.auth.signInWithPassword({ email, password }));
  const enrolled = await person.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'acceptance' });
  ok(enrolled);
  const factor = enrolled.data as { id: string; totp: { secret: string } };
  const challenge = await person.auth.mfa.challenge({ factorId: factor.id });
  ok(
    await person.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.data!.id,
      code: totp(factor.totp.secret),
    }),
  );
  const ctx = await browser.newContext();
  const sp = await ctx.newPage();
  await sp.goto('/staff/login');
  await sp.getByLabel('Staff email').fill(email);
  await sp.getByLabel('Password', { exact: true }).fill(password);
  await sp.locator('[data-action="login.staff"]').click();
  await sp.waitForURL(/\/login\/verify$/);
  // a code from the same 30 s window as the enrolment may be refused as replayed: wait for the next window
  await sp.waitForTimeout(31_000 - (Date.now() % 30_000));
  await sp.getByLabel('6-digit code').fill(totp(factor.totp.secret));
  await sp.locator('[data-action="login.staff"]').click();
  await sp.waitForURL(/\/admin$/, { timeout: 30_000 });
  await sp.close();
  return ctx;
}

function designations(): string[] {
  const file = join(OUT, 'designations.json');
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as string[];
  } catch {
    return [];
  }
}

test.describe('Phase 1 acceptance crawl', () => {
  test.skip(!ON, 'opt-in: ACCEPTANCE=1');
  test.describe.configure({ mode: 'parallel' });

  test.beforeAll(async () => {
    if (!ON) return;
    const env = readLocalEnv();
    mkdirSync(OUT, { recursive: true });
    if (!env) return;
    const admin = createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.from('role_permissions').select('designation');
    expect(error?.message ?? null).toBeNull();
    const list = [...new Set((data ?? []).map((r) => r.designation as string))].sort();
    writeFileSync(join(OUT, 'designations.json'), JSON.stringify(list));
    writeFileSync(join(OUT, 'routes.json'), JSON.stringify(ROUTES, null, 1));
  });

  // the staff list is read when the file is loaded: one test per designation that exists in this database
  const staffPersonas: Persona[] = (designations().length ? designations() : Object.values(STAFF)).map((d) => ({
    key: `staff-${d
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-$/, '')}`,
    label: `Staff — ${d}`,
    kind: 'staff',
    designation: d,
    en: ['admin', 'portal'],
    ur: d === 'Secretary General' ? ['admin'] : [],
  }));

  for (const persona of PROD ? BASE_PERSONAS.filter((p) => p.kind === 'anon') : [...BASE_PERSONAS, ...staffPersonas]) {
    test(`crawl as ${persona.label}`, async ({ browser }, info) => {
      test.skip(info.project.name !== 'desktop', 'desktop project only');
      const env = PROD ? null : readLocalEnv();
      test.skip(!PROD && !env, 'needs the local Supabase stack');
      test.setTimeout(40 * 60_000);
      const admin = env
        ? createClient(env.url, env.secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
        : (null as unknown as SupabaseClient);
      const cleanup: (() => PromiseLike<unknown>)[] = [];
      const pages: PageRecord[] = [];
      const links: LinkRecord[] = [];
      try {
        const ctx = PROD ? await browser.newContext() : await signIn(browser, admin, env!, persona, cleanup);
        const page = await ctx.newPage();
        const shotTaken = new Set<string>();
        for (const locale of ['en', 'ur'] as const) {
          const areas = locale === 'en' ? persona.en : persona.ur;
          for (const { route } of ROUTES.filter((r) => areas.includes(area(r.route) as never))) {
            pages.push(await crawlPage(page, persona, route, locale, shotTaken));
          }
        }
        // every internal link this persona was shown, requested with the persona's session
        const seen = new Set(pages.map((p) => p.url));
        const hrefs = new Map<string, string>();
        for (const p of pages)
          for (const e of p.elements)
            if (e.href && e.href.startsWith('/') && !e.href.startsWith('//') && !seen.has(e.href) && !hrefs.has(e.href))
              hrefs.set(e.href, p.url);
        for (const [href, from] of hrefs) {
          // sign-out and file downloads are not requested (sign-out would end the session)
          if (/logout|sign-?out|\/api\/(files|finance|register|audit|reports|business-directory|whatsapp)/i.test(href))
            continue;
          const r = await ctx.request.get(href, { maxRedirects: 5, timeout: 30_000 }).catch(() => null);
          links.push({ persona: persona.key, href, status: r?.status() ?? 0, from });
        }
        await ctx.close();
      } finally {
        mkdirSync(OUT, { recursive: true });
        writeFileSync(
          join(OUT, `${PROD ? 'prod-' : ''}crawl-${persona.key}.json`),
          JSON.stringify({ target: PROD ? 'production' : 'local', persona, pages, links }, null, 1),
        );
        for (const step of cleanup) await Promise.resolve(step()).catch(() => undefined);
      }
      expect(pages.length).toBeGreaterThan(0);
    });
  }
});
