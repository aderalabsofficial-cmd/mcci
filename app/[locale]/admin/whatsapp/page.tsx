import { Inbox, Layers, Megaphone, Settings, ShieldCheck, FileText } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Kpi } from '@/components/review/kpi';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { isConfigured } from '@/lib/whatsapp/config';
import { loadDashboard, loadHealth, loadSettings } from '@/lib/whatsapp/load';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.wadash') };
}

export const dynamic = 'force-dynamic';

/** WhatsApp overview: aggregate figures only. All counts come from provider and Meta answers, never assumptions. */
export default async function WhatsappDashboardPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'out', 'screens.admin.wadash');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `wa.dash.${k}`, v);
  const [d, health, settings] = await Promise.all([loadDashboard(), loadHealth(), loadSettings()]);
  const status = isConfigured() ? (health?.status ?? 'not_configured') : 'not_configured';
  const pct = (n: number) => (d.submitted ? `${Math.round((n / d.submitted) * 100)}%` : '—');
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <div className={`banner ${status === 'connected' ? 'green' : 'orange'}`} data-wa-status={status}>
        {msg(locale, `wa.status.${status}`)}
      </div>
      {!settings.sendingEnabled && (
        <div className="banner orange" data-sending-off>
          {m('sendingOff')}
        </div>
      )}
      <div className="kg">
        <Kpi label={m('withNumber')} value={d.withNumber} icon="users" color="#14b8a6" />
        <Kpi label={m('consented')} value={d.consented} icon="check" color="#1fa34a" />
        <Kpi label={m('suppressed')} value={d.suppressed} icon="flag" color="#ef4444" />
        <Kpi label={m('activeCampaigns')} value={d.activeCampaigns} icon="clock" color="#7c3aed" />
      </div>
      <div className="kg">
        <Kpi label={m('submitted')} value={d.submitted} sub={m('submittedSub')} icon="check" color="#0ea5e9" />
        <Kpi label={m('delivered')} value={d.delivered} sub={pct(d.delivered)} icon="check" color="#1fa34a" />
        <Kpi label={m('read')} value={d.read} sub={pct(d.read)} icon="check" color="#14b8a6" />
        <Kpi
          label={m('failed')}
          value={d.failed}
          sub={d.unknown ? m('unknown', { n: String(d.unknown) }) : undefined}
          icon="flag"
          color="#ef4444"
        />
      </div>
      <div className="card">
        <div className="pb">
          <Link className="btn" href="/admin/whatsapp/inbox" data-action="wa.open.inbox">
            <Inbox size={16} aria-hidden /> {m('inbox', { n: String(d.inbound) })}
          </Link>
          <Link className="btn" href="/admin/whatsapp/campaigns" data-action="wa.open.campaigns">
            <Megaphone size={16} aria-hidden /> {m('campaigns')}
          </Link>
          <Link className="btn" href="/admin/whatsapp/templates" data-action="wa.open.templates">
            <FileText size={16} aria-hidden /> {m('templates')}
          </Link>
          <Link className="btn" href="/admin/whatsapp/consent" data-action="wa.open.consent">
            <ShieldCheck size={16} aria-hidden /> {m('consent')}
          </Link>
          <Link className="btn" href="/admin/whatsapp/settings" data-action="wa.open.settings">
            <Settings size={16} aria-hidden /> {m('settings')}
          </Link>
          <Link className="btn" href="/admin/business-directory/segments" data-action="wa.open.segments">
            <Layers size={16} aria-hidden /> {m('segments')}
          </Link>
        </div>
      </div>
    </div>
  );
}
