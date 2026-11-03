import { RefreshCw } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { guardStaff } from '@/components/services/staff-page';
import { RunAction } from '@/components/whatsapp/controls';
import { TemplateForm } from '@/components/whatsapp/forms';
import { MasterVersionForm, StatusBadge } from '@/components/whatsapp/masters';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { syncTemplates } from '@/lib/whatsapp/actions';
import { loadMasters, loadTemplates } from '@/lib/whatsapp/load';
import { submission } from '@/lib/whatsapp/masters';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.watemplates') };
}

export const dynamic = 'force-dynamic';

/**
 * Templates are created and approved in Meta. Here: the four MCCI master templates (wording, variables, what to submit
 * in WhatsApp Manager, the status Meta reports), then any other template: sync its status, record its wording.
 */
export default async function TemplatesPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'out', 'screens.admin.watemplates');
  if (g.denied) return g.denied;
  const m = (k: string) => msg(locale, `wa.templates.${k}`);
  const [all, masters] = await Promise.all([loadTemplates(), loadMasters()]);
  const masterNames = new Set(masters.map((x) => x.name));
  const rows = all.filter((t) => !masterNames.has(t.name));
  const mm = (k: string, v?: Record<string, string>) => msg(locale, `wa.masters.${k}`, v);
  const date = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', { timeZone: 'Asia/Karachi' }) : '—';
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
        {g.level >= 2 && (
          <div className="pb">
            <RunAction
              locale={locale}
              action={syncTemplates.bind(null, locale)}
              label={m('sync')}
              dataAction="wa.templates.sync"
              primary
              icon={<RefreshCw size={15} aria-hidden />}
            />
          </div>
        )}
      </div>
      <section className="card" data-masters aria-labelledby="masters-h">
        <div className="ch">
          <h2 id="masters-h">{mm('title')}</h2>
        </div>
        <p className="muted">{mm('sub')}</p>
        <p className="banner orange">{mm('approvalNote')}</p>
      </section>
      {masters.map((x) => (
        <div className="card" key={x.key} data-master={x.key}>
          <div className="ch">
            <h3>{msg(locale, `wa.categories.${x.key}`)}</h3>
            <span className="bd" data-meta-category={x.metaCategory}>
              {mm(`metaCategory.${x.metaCategory}`)}
            </span>
          </div>
          <p className="muted">{mm(`purpose.${x.key}`)}</p>
          <div className="wa-slots">
            <small>{mm('variables')}</small>
            {x.slots.map((s) => (
              <span className="bd" key={s.n} data-slot={s.key}>
                {`{{${s.n}}}`} {mm(`fields.${s.key}`)}
                {s.source === 'recipient' ? ` · ${mm('fromRecord')}` : ''}
              </span>
            ))}
          </div>
          {x.versions.map((v) => {
            const sub = submission(x, v);
            return (
              <div className="wa-master-version" key={v.language} data-master-version={v.language}>
                <div className="ch">
                  <h4 dir="ltr">
                    {x.name} · {v.language} · v{v.version}
                  </h4>
                  <StatusBadge locale={locale} status={v.status} />
                </div>
                <p className="wa-bubble" dir={v.language === 'ur' ? 'rtl' : 'ltr'} lang={v.language}>
                  <b>{v.header}</b>
                  {'\n\n'}
                  {v.body}
                  {v.footer ? `\n\n${v.footer}` : ''}
                </p>
                <details data-submission={v.language}>
                  <summary data-action="wa.master.submission">{mm('submission')}</summary>
                  <p className="muted">{mm('submissionHow')}</p>
                  <dl className="kv">
                    <div>
                      <dt>{mm('sub_name')}</dt>
                      <dd dir="ltr">{sub.name}</dd>
                    </div>
                    <div>
                      <dt>{mm('sub_category')}</dt>
                      <dd dir="ltr">{sub.category}</dd>
                    </div>
                    <div>
                      <dt>{mm('sub_language')}</dt>
                      <dd dir="ltr">{sub.language}</dd>
                    </div>
                  </dl>
                  <ol className="wa-examples">
                    {sub.examples.map((e, i) => (
                      <li key={i} dir="auto">
                        {`{{${i + 1}}}`} {e}
                      </li>
                    ))}
                  </ol>
                </details>
                {g.level >= 3 && !v.locked ? (
                  <MasterVersionForm locale={locale} master={x} language={v.language} />
                ) : (
                  <p className="muted" data-master-locked={v.locked ? 'meta' : 'level'}>
                    {mm(v.locked ? 'lockedMeta' : 'lockedLevel')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div className="banner orange">{m('metaNote')}</div>
      {rows.length === 0 && (
        <div className="card" data-empty>
          <p className="muted">{m('empty')}</p>
        </div>
      )}
      {rows.map((t) => (
        <div className="card" key={t.id} data-template={t.name} data-language={t.language}>
          <div className="ch">
            <h3 dir="ltr">
              {t.name} · {t.language}
            </h3>
            <span className={`bd ${t.status === 'APPROVED' ? 'green' : 'orange'}`} data-template-status={t.status}>
              {t.status}
            </span>
          </div>
          <div className="kv">
            <div>
              <small>{m('category')}</small>
              <b>{t.category ?? '—'}</b>
            </div>
            <div>
              <small>{m('providerId')}</small>
              <b dir="ltr">{t.provider_id ?? '—'}</b>
            </div>
            <div>
              <small>{m('synced')}</small>
              <b>{date(t.synced_at)}</b>
            </div>
          </div>
          {!t.body && t.status === 'APPROVED' && <p className="banner orange">{m('needsWording')}</p>}
          {g.level >= 2 ? (
            <TemplateForm
              locale={locale}
              t={{
                id: t.id,
                header_type: t.header_type,
                header: t.header,
                body: t.body,
                footer: t.footer,
                buttons: Array.isArray(t.buttons) ? (t.buttons as string[]) : [],
                var_map: t.var_map as Record<string, string>,
              }}
            />
          ) : (
            t.body && (
              <p className="wa-bubble" dir="auto">
                {t.body}
              </p>
            )
          )}
        </div>
      ))}
    </div>
  );
}
