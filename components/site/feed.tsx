import { Unavailable } from '@/components/site/blocks';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import type { FeedRow } from '@/lib/site/admin';
import type { ServiceType } from '@/lib/site/load';

const TONE: Record<string, string> = {
  temp: 'blue',
  permanent: 'green',
  Issued: 'green',
  rejected: 'red',
  Rejected: 'red',
  returned: 'orange',
  Returned: 'orange',
};

/** how long ago, in the reader's language */
export function ago(iso: string | null, locale: Locale): string {
  if (!iso) return '';
  const s = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale === 'ur' ? 'ur' : 'en', { numeric: 'auto' });
  const abs = Math.abs(s);
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  return rtf.format(Math.round(s / 86400), 'day');
}

const DESIGN_NAMES = ['co', 'ebil', 'visa', 'guar', 'sample', 'other', 'att'];

/**
 * The anonymised activity list (prototype live()): what, token, when, status — never a name. rows null: the feed could
 * not be read; services null: the seven services keep the home page's names.
 */
export function Feed({
  locale,
  rows,
  services,
}: {
  locale: Locale;
  rows: FeedRow[] | null;
  services: ServiceType[] | null;
}) {
  if (!rows) return <Unavailable locale={locale} />;
  if (!rows.length) return <p className="em">{msg(locale, 'site.live.none')}</p>;
  const name = (kind: string) => {
    if (kind === 'membership') return msg(locale, 'site.live.membership');
    const s = services?.find((x) => x.key === kind);
    if (s) return locale === 'ur' ? s.name_ur || s.name_en : s.name_en;
    return DESIGN_NAMES.includes(kind) ? msg(locale, `landing.svc_${kind}`) : kind;
  };
  return (
    <div className="feed" role="list">
      {rows.map((r) => (
        <div key={r.token} role="listitem">
          <span>
            <b>{name(r.kind)}</b>
            <small>
              {r.token} · {ago(r.at, locale)}
            </small>
          </span>
          <span className={`bd ${TONE[r.status] ?? 'gray'}`}>{msg(locale, `site.stage.${r.status}`)}</span>
        </div>
      ))}
    </div>
  );
}
