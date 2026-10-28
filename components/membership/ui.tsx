import {
  Award,
  BadgeCheck,
  Ban,
  Briefcase,
  Building2,
  Check,
  Clock,
  CreditCard,
  Database,
  Eye,
  Factory,
  FilePlus,
  FileText,
  Flag,
  Folder,
  Globe,
  Hourglass,
  Landmark,
  type LucideIcon,
  Map,
  Mic,
  QrCode,
  RefreshCw,
  Phone,
  Plug,
  Plus,
  Printer,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Signature,
  Sparkles,
  Star,
  Sun,
  Truck,
  Upload,
  User,
  Users,
  X,
  CalendarDays,
  CircleHelp,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/routing';
import { JOURNEY, journeyIndex, type AppStage } from '@/lib/membership/reference';
import { msg } from '@/lib/nav/model';

/**
 * Building blocks of the prototype's member screens, rendered with the prototype's own markup and classes
 * (app/styles/proto.css): .steps8 journey, .next "what to do now" card, .bt tiles, .card, .kv, .tl.
 */

const ICONS: Record<string, LucideIcon> = {
  award: Award,
  ban: Ban,
  qr: QrCode,
  refresh: RefreshCw,
  badge: BadgeCheck,
  building: Building2,
  calendar: CalendarDays,
  card: CreditCard,
  check: Check,
  clock: Clock,
  database: Database,
  eye: Eye,
  factory: Factory,
  file: FileText,
  filePlus: FilePlus,
  flag: Flag,
  folder: Folder,
  globe: Globe,
  help: CircleHelp,
  hourglass: Hourglass,
  landmark: Landmark,
  map: Map,
  mic: Mic,
  phone: Phone,
  plug: Plug,
  plus: Plus,
  printer: Printer,
  send: Send,
  shield: ShieldCheck,
  signature: Signature,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  briefcase: Briefcase,
  settings: Settings,
  shoppingBag: ShoppingBag,
  truck: Truck,
  upload: Upload,
  user: User,
  users: Users,
  x: X,
};

export function Ic({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  const C = ICONS[name] ?? FileText;
  return <C size={size} color={color ?? 'currentColor'} aria-hidden="true" />;
}

/** English + Urdu label (prototype M.L) */
export function L({ en, ur }: { en: string; ur: string }) {
  return (
    <span className="bi">
      <span className="bi-en">{en}</span>
      <span className="bi-ur" lang="ur">
        {ur}
      </span>
    </span>
  );
}

export const both = (path: string, vars?: Record<string, string>) => ({
  en: msg('en', path, vars),
  ur: msg('ur', path, vars),
});

/** the member's journey (prototype steps(a, big)) */
export function Journey({ stage, big = false }: { stage: AppStage; big?: boolean }) {
  const cur = journeyIndex(stage);
  return (
    <div className={`steps8 ${big ? 'big' : ''}`} role="list" aria-label={msg('en', 'membership.home.journey')}>
      {JOURNEY.map((s, i) => {
        const done = i < cur || stage === 'permanent';
        return (
          <div
            key={s.k}
            role="listitem"
            className={done ? 'd' : i === cur ? 'n' : ''}
            aria-current={i === cur ? 'step' : undefined}
          >
            <i>{done ? '✓' : <Ic name={s.icon} size={big ? 22 : 18} />}</i>
            <b>{msg('en', `membership.journey.${s.k}.name`)}</b>
            <span lang="ur">{msg('ur', `membership.journey.${s.k}.name`)}</span>
          </div>
        );
      })}
    </div>
  );
}

export type Tone = 'gold' | 'blue' | 'red' | 'teal' | 'green';

/** "What to do now" (prototype nextCard): one step, English heading + Urdu line, at most two buttons */
export function NextCard({
  tone,
  icon,
  title,
  body,
  children,
  aside,
}: {
  tone: Tone;
  icon: string;
  title: { en: string; ur: string };
  body: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className={`next ${tone}`} aria-labelledby="next-title">
      <div className="next-i">
        <Ic name={icon} size={34} color="#fff" />
      </div>
      <div className="next-b">
        <small>
          <L {...both('membership.home.whatNow')} />
        </small>
        <h2 id="next-title">{title.en}</h2>
        <p className="ur-line" lang="ur">
          {title.ur}
        </p>
        <p>{body}</p>
        {children && <div className="pb">{children}</div>}
      </div>
      {aside}
    </section>
  );
}

/** big home tile (prototype bt): a link when the screen is built, otherwise disabled with the reason */
export function Tile({
  icon,
  color,
  label,
  sub,
  href,
  reason,
  Link,
}: {
  icon: string;
  color: string;
  label: { en: string; ur: string };
  sub?: string;
  href: string | null;
  reason?: string | null;
  Link: (p: { href: string; className: string; style: React.CSSProperties; children: ReactNode }) => ReactNode;
}) {
  const inner = (
    <>
      <i>
        <Ic name={icon} size={30} color="#fff" />
      </i>
      <b>{label.en}</b>
      <span lang="ur">{label.ur}</span>
      {sub && <small>{sub}</small>}
    </>
  );
  const style = { '--c': color } as React.CSSProperties;
  if (href) return Link({ href, className: 'bt', style, children: inner });
  return (
    <button type="button" className="bt" style={style} aria-disabled="true" title={reason ?? undefined} disabled>
      {inner}
    </button>
  );
}

export function Card({
  title,
  right,
  children,
  id,
}: {
  title: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="card" aria-labelledby={id}>
      <div className="ch">
        <h3 id={id}>{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

export function KV({ pairs }: { pairs: [ReactNode, ReactNode][] }) {
  return (
    <div className="kv">
      {pairs.map(([k, v], i) => (
        <div key={i}>
          <small>{k}</small>
          <b>{v === null || v === undefined || v === '' ? '—' : v}</b>
        </div>
      ))}
    </div>
  );
}

/** timeline (prototype M.tl): d = done, n = now, t = to come */
export function Timeline({ items }: { items: { title: ReactNode; sub?: ReactNode; state: 'd' | 'n' | 't' }[] }) {
  return (
    <ul className="tl">
      {items.map((x, i) => (
        <li key={i} className={x.state}>
          <i>{x.state === 'd' ? '✓' : ''}</i>
          <div>
            <b>{x.title}</b>
            {x.sub && <small>{x.sub}</small>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export const pkr = (n: number, locale: Locale = 'en') => `Rs. ${n.toLocaleString(locale === 'ur' ? 'en-PK' : 'en-PK')}`;
