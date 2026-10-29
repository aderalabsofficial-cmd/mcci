import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { NoAccess } from '@/components/admin/no-access';
import { PageHeader } from '@/components/shared/page-header';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'integrations.title') };
}

export const dynamic = 'force-dynamic';

type Row = { key: string; on: boolean; state: 'on' | 'off' | 'included' | 'awaitBank' | 'awaitApi'; link?: string };

/**
 * Connections (prototype admin/integrations; Services & Integrations): what this build connects — email, the AI
 * document reading, in-portal messages — and what waits on MCCI's bank or courier (out of scope in this phase,
 * docs/00-scope.md), with the manual process used meanwhile. Status only: connection settings live on the server
 * (/etc/mcci-web/env) and no secret is ever shown. Platform or Services ≥ 1, as the Services Setup screen.
 */
export default async function IntegrationsPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const m = (k: string, v?: Record<string, string>) => msg(locale, `integrations.${k}`, v);
  if (staffLevel(session.access, 'plat') < 1 && staffLevel(session.access, 'svc') < 1) {
    return (
      <>
        <PageHeader
          locale={locale}
          title={{ en: msg('en', 'integrations.title'), ur: msg('ur', 'integrations.title') }}
          bilingual={false}
        />
        <NoAccess locale={locale} designation={session.access.staff?.designation ?? ''} module="plat" />
      </>
    );
  }
  const email = Boolean(process.env.EMAIL_FROM && (process.env.SMTP_HOST || process.env.EMAIL_TRANSPORT));
  const ai = process.env.AI_EXTRACTION === 'on' && Boolean(process.env.OPENAI_API_KEY);
  const canTest = staffLevel(session.access, 'eng') >= 2;
  const included: Row[] = [
    { key: 'email', on: email, state: email ? 'on' : 'off', link: canTest ? '/admin/notify' : undefined },
    { key: 'ai', on: ai, state: ai ? 'on' : 'off' },
    { key: 'portal', on: true, state: 'included' },
  ];
  const waiting: Row[] = [
    { key: 'bank', on: false, state: 'awaitBank' },
    { key: 'courier', on: false, state: 'awaitApi' },
  ];
  const row = (r: Row) => (
    <div className="li st" key={r.key} data-integration={r.key} data-state={r.state}>
      <div style={{ flex: 1 }}>
        <b>{m(`items.${r.key}.name`)}</b>
        <small>{m(`items.${r.key}.what`)}</small>
      </div>
      <span
        className={`bd ${r.state === 'on' || r.state === 'included' ? 'green' : r.state === 'off' ? 'red' : 'orange'}`}
      >
        {m(`state.${r.state}`)}
      </span>
      {r.link && (
        <Link className="btn btn-sm" href={r.link} data-action="nav">
          {m('test')}
        </Link>
      )}
    </div>
  );
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <section className="card" aria-labelledby="in-h">
        <div className="ch">
          <h3 id="in-h">{m('included')}</h3>
        </div>
        {included.map(row)}
        <p className="muted" style={{ marginTop: 10 }}>
          {m('onServer')}
        </p>
      </section>
      <section className="card" aria-labelledby="wt-h" style={{ marginTop: 16 }}>
        <div className="ch">
          <h3 id="wt-h">{m('waiting')}</h3>
        </div>
        {waiting.map(row)}
      </section>
    </div>
  );
}
