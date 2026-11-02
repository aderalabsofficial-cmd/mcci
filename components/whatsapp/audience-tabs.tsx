import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { Facets } from '@/lib/business/load';
import { directoryQuery, type FieldKey, type Filter } from '@/lib/business/filters';
import { msg } from '@/lib/nav/model';
import { AUDIENCE_TABS, FACET_TABS, tabValue, withTab } from '@/lib/whatsapp/audience';

const FACET_LIMIT = 10;

/** Who should get this: a row of tabs per question, every choice one click and visible, with no dropdowns. */
export function AudienceTabs({ locale, filter, q, facets }: { locale: Locale; filter: Filter; q: string; facets: Facets }) {
  const m = (k: string) => msg(locale, `wa.tabs.${k}`);
  const href = (field: FieldKey, value: string | null) => {
    const query = directoryQuery({ f: withTab(filter, field, value), q });
    return `/admin/whatsapp/campaigns/new${query}`;
  };
  const row = (field: FieldKey, options: { value: string; label: string }[]) => {
    const on = tabValue(filter, field);
    return (
      <div className="wa-tabrow" key={field}>
        <span id={`wa-tab-${field}`}>{m(`q.${field}`)}</span>
        <nav className="pills" aria-labelledby={`wa-tab-${field}`}>
          <Link href={href(field, null)} className={`pill ${on === null ? 'on' : ''}`} aria-current={on === null ? 'true' : undefined} data-action="wa.tab" data-tab={field} data-value="all">
            {m('any')}
          </Link>
          {options.map((o) => (
            <Link key={o.value} href={href(field, o.value)} className={`pill ${on === o.value ? 'on' : ''}`} aria-current={on === o.value ? 'true' : undefined} data-action="wa.tab" data-tab={field} data-value={o.value}>
              {o.label}
            </Link>
          ))}
        </nav>
      </div>
    );
  };
  return (
    <section className="card" data-section="audience-tabs" aria-labelledby="wa-tabs-h">
      <div className="ch">
        <h3 id="wa-tabs-h">
          <span className="wa-step">1</span> {m('title')}
        </h3>
        <Link className="btn btn-w" href="/admin/whatsapp/campaigns/new" data-action="wa.tabs.clear">
          {m('clear')}
        </Link>
      </div>
      <p className="muted">{m('help')}</p>
      {AUDIENCE_TABS.map((t) => row(t.field, t.options.map((value) => ({ value, label: msg(locale, `biz.values.${t.field}.${value}`) }))))}
      {FACET_TABS.map((field) => {
        const on = tabValue(filter, field);
        const values = facets[field].slice(0, FACET_LIMIT);
        if (on && !values.includes(on)) values.push(on);
        return values.length ? row(field, values.map((value) => ({ value, label: value }))) : null;
      })}
    </section>
  );
}
