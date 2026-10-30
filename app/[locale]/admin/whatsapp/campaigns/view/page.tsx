import { Download, Pause, Play, RefreshCw, Send, X } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { guardStaff } from '@/components/services/staff-page';
import { DecideCampaign, RunAction, StartCampaign } from '@/components/whatsapp/controls';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { staffLevel } from '@/lib/permissions/levels';
import { requireUser } from '@/lib/permissions/server';
import { controlCampaign, runBatch, submitCampaign } from '@/lib/whatsapp/actions';
import { loadCampaign, loadCampaignStats, loadRecipients, loadSettings } from '@/lib/whatsapp/load';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ id?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.wacampaign') };
}

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f-]{36}$/i;
const STATS = [
  'pending',
  'queued',
  'submitted',
  'sent',
  'delivered',
  'read',
  'failed',
  'skipped',
  'cancelled',
] as const;

/** One campaign: the fixed audience, the message, what happened to each recipient. Only confirmed states are shown. */
export default async function CampaignPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'out', 'screens.admin.wacampaign');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `wa.campaign.${k}`, v);
  const id = (await searchParams).id ?? '';
  const c = UUID.test(id) ? await loadCampaign(id) : null;
  if (!c) {
    return (
      <div className="proto">
        <div className="ph">
          <div>
            <h1>{msg(locale, 'screens.admin.wacampaign')}</h1>
            <p>{m(id ? 'notFound' : 'pickOne')}</p>
          </div>
          <div className="pb">
            <Link className="btn" href="/admin/whatsapp/campaigns" data-action="wa.back">
              {m('back')}
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const [stats, recipients, settings] = await Promise.all([
    loadCampaignStats(c.id),
    g.level >= 2 ? loadRecipients(c.id) : Promise.resolve([]),
    loadSettings(),
  ]);
  const out = g.level;
  const n = (k: string) => stats.status[k] ?? 0;
  const pending = n('pending');
  const total = STATS.reduce((s, k) => s + n(k), 0);
  const template = c.whatsapp_templates as unknown as { name: string; language: string; body: string | null } | null;
  const preview = c.message_kind === 'template' ? (template?.body ?? template?.name ?? '') : (c.body ?? '');
  const running = ['queued', 'sending', 'scheduled'].includes(c.status);
  const dispatched = n('submitted') + n('sent') + n('delivered') + n('read');
  const rate = (v: number) => (dispatched ? `${Math.round((v / dispatched) * 100)}%` : '—');
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1 data-campaign-name>{c.name}</h1>
          <p>{c.purpose ?? ''}</p>
        </div>
        <div className="pb">
          <Link className="btn" href="/admin/whatsapp/campaigns" data-action="wa.back">
            {m('back')}
          </Link>
          {staffLevel(session.access, 'biz') >= 2 && out >= 2 && (
            <a
              className="btn"
              href={`/api/whatsapp/campaigns/${c.id}/export?locale=${locale}`}
              data-action="wa.campaign.export"
              download
            >
              <Download size={16} aria-hidden /> {m('export')}
            </a>
          )}
        </div>
      </div>
      <div className="card" data-section="state">
        <div className="ch">
          <h3>{m('stateTitle')}</h3>
          <span className="bd blue" data-campaign-status={c.status}>
            {msg(locale, `wa.campaignStates.${c.status}`)}
          </span>
        </div>
        {c.reject_reason && c.status === 'draft' && (
          <p className="banner orange">{m('returned', { reason: c.reject_reason })}</p>
        )}
        <div className="kv">
          <div>
            <small>{m('category')}</small>
            <b>{msg(locale, `wa.categories.${c.category}`)}</b>
          </div>
          <div>
            <small>{m('createdBy')}</small>
            <b>{(c.profiles as unknown as { full_name: string | null } | null)?.full_name ?? '—'}</b>
          </div>
          <div>
            <small>{m('template')}</small>
            <b>{template ? `${template.name} · ${template.language}` : m('freeText')}</b>
          </div>
          <div>
            <small>{m('attachment')}</small>
            <b>{(c.whatsapp_attachments as unknown as { file_name: string } | null)?.file_name ?? '—'}</b>
          </div>
          {c.scheduled_at && (
            <div>
              <small>{m('scheduled')}</small>
              <b>
                {new Date(c.scheduled_at).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
                  timeZone: 'Asia/Karachi',
                })}
              </b>
            </div>
          )}
        </div>
        <p className="wa-bubble" dir="auto" data-campaign-message>
          {preview}
        </p>
        {!settings.sendingEnabled && <p className="banner orange">{m('sendingOff')}</p>}
        <div className="pb">
          {c.status === 'draft' && out >= 2 && (
            <RunAction
              locale={locale}
              action={submitCampaign.bind(null, locale, c.id)}
              label={m('submit')}
              dataAction="wa.campaign.submit"
              primary
              icon={<Send size={15} aria-hidden />}
            />
          )}
          {c.status === 'approved' && out >= 2 && (
            <StartCampaign locale={locale} id={c.id} count={pending} preview={preview} />
          )}
          {['queued', 'sending', 'scheduled'].includes(c.status) && out >= 3 && (
            <RunAction
              locale={locale}
              action={controlCampaign.bind(null, locale, c.id, 'pause')}
              label={m('pause')}
              dataAction="wa.campaign.pause"
              icon={<Pause size={15} aria-hidden />}
            />
          )}
          {c.status === 'paused' && out >= 3 && (
            <RunAction
              locale={locale}
              action={controlCampaign.bind(null, locale, c.id, 'resume')}
              label={m('resume')}
              dataAction="wa.campaign.resume"
              icon={<Play size={15} aria-hidden />}
            />
          )}
          {running && out >= 3 && (
            <RunAction
              locale={locale}
              action={runBatch.bind(null, locale)}
              label={m('runBatch')}
              dataAction="wa.campaign.batch"
              icon={<RefreshCw size={15} aria-hidden />}
            />
          )}
          {['draft', 'pending_approval', 'approved', 'scheduled', 'queued', 'sending', 'paused'].includes(c.status) &&
            out >= 3 && (
              <RunAction
                locale={locale}
                action={controlCampaign.bind(null, locale, c.id, 'cancel')}
                label={m('cancel')}
                dataAction="wa.campaign.cancel"
                confirm={m('cancelNote')}
                icon={<X size={15} aria-hidden />}
              />
            )}
        </div>
        {c.status === 'pending_approval' && out >= 3 && c.created_by !== session.userId && (
          <DecideCampaign locale={locale} id={c.id} />
        )}
        {c.status === 'pending_approval' && (out < 3 || c.created_by === session.userId) && (
          <p className="muted">{m('waitingApproval')}</p>
        )}
      </div>
      <div className="card" data-section="stats">
        <div className="ch">
          <h3>{m('resultsTitle')}</h3>
          <small>{m('total', { n: String(total) })}</small>
        </div>
        <div className="kv">
          {STATS.map((k) => (
            <div key={k} data-stat={k} data-value={n(k)}>
              <small>{msg(locale, `wa.recipientStates.${k}`)}</small>
              <b>{n(k)}</b>
            </div>
          ))}
          <div data-stat="replies" data-value={stats.replies}>
            <small>{m('replies')}</small>
            <b>{stats.replies}</b>
          </div>
          <div data-stat="optouts" data-value={stats.optOuts}>
            <small>{m('optOuts')}</small>
            <b>{stats.optOuts}</b>
          </div>
          <div>
            <small>{m('deliveryRate')}</small>
            <b>{rate(n('delivered') + n('read'))}</b>
          </div>
        </div>
        <p className="muted">{m('truthNote')}</p>
        {Object.keys(stats.reasons).length > 0 && (
          <ul className="wa-blocked" data-reasons>
            {Object.entries(stats.reasons).map(([k, v]) => (
              <li key={k} data-reason={k}>
                <b>{v}</b> {reasonLabel(locale, k)}
              </li>
            ))}
          </ul>
        )}
      </div>
      {out >= 2 && (
        <div className="card" data-section="recipients">
          <div className="ch">
            <h3>{m('recipients')}</h3>
            <span className="bd blue">{m('snapshot')}</span>
          </div>
          <div className="tw" tabIndex={0} role="region" aria-label={m('recipients')}>
            <table>
              <thead>
                <tr>
                  {(['business', 'member', 'number', 'status', 'reason'] as const).map((k) => (
                    <th key={k} scope="col">
                      {m(`cols.${k}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr className="st" key={r.id} data-recipient={r.member_no} data-status={r.status}>
                    <td>{r.business_name}</td>
                    <td>{r.member_no}</td>
                    <td dir="ltr">{r.phone ?? '—'}</td>
                    <td>{msg(locale, `wa.recipientStates.${r.status}`)}</td>
                    <td>{r.reason ? reasonLabel(locale, r.reason) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/** a sending-rule reason has its own wording; provider failure codes are shown as they came */
function reasonLabel(locale: 'en' | 'ur', reason: string): string {
  const known = [
    'no_number',
    'invalid_number',
    'inactive',
    'suppressed',
    'no_consent',
    'category',
    'template',
    'window_closed',
    'missing_value',
    'number_changed',
    'cancelled',
  ];
  return known.includes(reason) ? msg(locale, `wa.block.${reason}`) : reason;
}
