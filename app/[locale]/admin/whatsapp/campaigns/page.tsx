import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadCampaigns } from '@/lib/whatsapp/load';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.wacampaigns') };
}

export const dynamic = 'force-dynamic';

export default async function CampaignsPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'out', 'screens.admin.wacampaigns');
  if (g.denied) return g.denied;
  const m = (k: string) => msg(locale, `wa.campaigns.${k}`);
  const rows = await loadCampaigns();
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
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
        {g.level >= 2 && (
          <div className="pb">
            <Link className="btn btn-primary" href="/admin/whatsapp/campaigns/new" data-action="wa.campaign.new">
              <Plus size={16} aria-hidden /> {m('new')}
            </Link>
          </div>
        )}
      </div>
      <div className="card" data-campaigns={rows.length}>
        {rows.length === 0 ? (
          <p className="muted">{m('empty')}</p>
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
                      <Link
                        className="rowlink"
                        href={`/admin/whatsapp/campaigns/view?id=${c.id}`}
                        data-action="wa.campaign.open"
                      >
                        <b>{c.name}</b>
                      </Link>
                    </td>
                    <td>
                      <span className="bd blue">{msg(locale, `wa.campaignStates.${c.status}`)}</span>
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
