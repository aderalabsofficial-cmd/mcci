import { RefreshCw } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { guardStaff } from '@/components/services/staff-page';
import { RunAction } from '@/components/whatsapp/controls';
import { TemplateForm } from '@/components/whatsapp/forms';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { syncTemplates } from '@/lib/whatsapp/actions';
import { loadTemplates } from '@/lib/whatsapp/load';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.watemplates') };
}

export const dynamic = 'force-dynamic';

/** Templates are created and approved in Meta. Here: sync their status, and record the wording the provider does not return. */
export default async function TemplatesPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'out', 'screens.admin.watemplates');
  if (g.denied) return g.denied;
  const m = (k: string) => msg(locale, `wa.templates.${k}`);
  const rows = await loadTemplates();
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
