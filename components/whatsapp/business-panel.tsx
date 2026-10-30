import type { TemplateOption } from '@/components/whatsapp/composer';
import { SendForm } from '@/components/whatsapp/forms';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { BusinessProfile } from '@/lib/business/load';
import { msg } from '@/lib/nav/model';
import { loadCompanyHistory, loadSettings, loadTemplates } from '@/lib/whatsapp/load';

/** The WhatsApp panel on a business profile (staff with Outreach ≥ 2): state, send, history. */
export async function BusinessWhatsappPanel({ locale, p }: { locale: Locale; p: BusinessProfile }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `wa.panel.${k}`, v);
  const [{ messages, conversation }, settings, templates] = await Promise.all([
    loadCompanyHistory(p.company_id),
    loadSettings(),
    loadTemplates(),
  ]);
  const when = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
          timeZone: 'Asia/Karachi',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';
  const end = conversation?.last_inbound_at
    ? new Date(conversation.last_inbound_at).getTime() + (settings.windowHours ?? 24) * 3_600_000
    : 0;
  const windowOpen = end > Date.now();
  const last = messages.find((x) => x.direction === 'outbound');
  const approved = templates.filter((t) => t.status === 'APPROVED') as unknown as TemplateOption[];
  return (
    <div className="card" data-section="whatsapp">
      <div className="ch">
        <h3>{m('title')}</h3>
        <span className={`bd ${windowOpen ? 'green' : 'orange'}`} data-window={windowOpen ? 'open' : 'closed'}>
          {windowOpen ? m('windowOpen', { at: when(new Date(end).toISOString()) }) : m('windowClosed')}
        </span>
      </div>
      <div className="kv">
        <div>
          <small>{m('lastMessage')}</small>
          <b>{when(conversation?.last_outbound_at)}</b>
        </div>
        <div>
          <small>{m('lastReply')}</small>
          <b>{when(conversation?.last_inbound_at)}</b>
        </div>
        <div>
          <small>{m('lastStatus')}</small>
          <b data-last-state={last?.state ?? ''}>{last ? msg(locale, `wa.states.${last.state}`) : '—'}</b>
        </div>
      </div>
      <SendForm locale={locale} company={p.company_id} templates={approved} windowOpen={windowOpen} />
      {conversation && (
        <p>
          <Link href={`/admin/whatsapp/inbox?c=${conversation.id}`} data-action="wa.inbox.open">
            {m('openInbox')}
          </Link>
        </p>
      )}
      {messages.length > 0 && (
        <div className="tw" tabIndex={0} role="region" aria-label={m('history')}>
          <table data-wa-history>
            <thead>
              <tr>
                {(['date', 'direction', 'message', 'campaign', 'status'] as const).map((c) => (
                  <th key={c} scope="col">
                    {m(`cols.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {messages.map((x) => (
                <tr className="st" key={x.id}>
                  <td>{when(x.created_at)}</td>
                  <td>{m(x.direction)}</td>
                  <td dir="auto">
                    {(x.whatsapp_templates as unknown as { name: string } | null)?.name ?? x.body ?? `[${x.kind}]`}
                  </td>
                  <td>{(x.whatsapp_campaigns as unknown as { name: string } | null)?.name ?? '—'}</td>
                  <td>
                    {msg(locale, `wa.states.${x.state}`)}
                    {x.failure_code ? ` · ${x.failure_code}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
