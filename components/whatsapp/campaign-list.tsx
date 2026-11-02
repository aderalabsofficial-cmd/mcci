import { Plus } from 'lucide-react';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import type { Session } from '@/lib/permissions/server';
import { loadCampaigns } from '@/lib/whatsapp/load';

const FINISHED = new Set(['completed', 'partially_completed', 'failed', 'cancelled']);
const TONE: Record<string, string> = {
  completed: 'green',
  partially_completed: 'orange',
  failed: 'red',
  cancelled: 'gray',
  paused: 'orange',
  sending: 'blue',
  queued: 'blue',
};

/** Campaigns in hand on one tab, finished ones on Campaign History: the same table and the same permission. */
export async function CampaignList({ locale, session, view }: { locale: Locale; session: Session; view: 'active' | 'history' }) {
  const titleKey = view === 'history' ? 'screens.admin.wahistory' : 'screens.admin.wacampaigns';
  const g = guardStaff(session, locale, 'out', titleKey);
  if (g.denied) return g.denied;
  const m = (k: string) => msg(locale, `wa.campaigns.${k}`);
  const rows = (await loadCampaigns()).filter((c) => FINISHED.has(c.status) === (view === 'history'));
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{view === 'history' ? m('historyTitle') : m('title')}</h1>
          <p>{view === 'history' ? m('historySub') : m('sub')}</p>
        </div>
        {g.level >= 2 && view === 'active' && (
          <div className="pb">
            <Link className="btn btn-primary" href="/admin/whatsapp/campaigns/new" data-action="wa.campaign.new">
              <Plus size={16} aria-hidden /> {m('new')}
            </Link>
          </div>
        )}
      </div>
      <div className="card" data-campaigns={rows.length}>
        {rows.length === 0 ? (
          <p className="muted">{view === 'history' ? m('historyEmpty') : m('empty')}</p>
        ) : (
          <div className="tw" tabIndex={0} role="region" aria-label={m('title')}>
            <table>
              <thead>
                <tr>
                  {(['name', 'status', 'category', 'by', 'created'] as const).map((c) => (
                    <th key={c} scope="col">
                      {m(`cols.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr className="st" key={c.id} data-campaign={c.name}>
                    <td>
                      <Link className="rowlink" href={`/admin/whatsapp/campaigns/view?id=${c.id}`} data-action="wa.campaign.open">
                        <b>{c.name}</b>
                      </Link>
                    </td>
                    <td>
                      <span className={`bd ${TONE[c.status] ?? 'gray'}`}>{msg(locale, `wa.campaignStates.${c.status}`)}</span>
                    </td>
                    <td>{msg(locale, `wa.categories.${c.category}`)}</td>
                    <td>{(c.profiles as unknown as { full_name: string | null } | null)?.full_name ?? '—'}</td>
                    <td>{date(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
