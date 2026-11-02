import { PlugZap } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { guardStaff } from '@/components/services/staff-page';
import { RunAction } from '@/components/whatsapp/controls';
import { SettingsForm } from '@/components/whatsapp/forms';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { runConnectionTest } from '@/lib/whatsapp/actions';
import { isConfigured, publicConfig } from '@/lib/whatsapp/config';
import { refreshHealthIfStale } from '@/lib/whatsapp/admin/health';
import { loadDashboard, loadHealth, loadReadiness, loadSettings } from '@/lib/whatsapp/load';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.wasettings') };
}

export const dynamic = 'force-dynamic';

/** Integration settings: status and limits. Secret values live only on the server and are never shown here. */
export default async function WhatsappSettingsPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'plat', 'screens.admin.wasettings');
  if (g.denied) return g.denied;
  const m = (k: string) => msg(locale, `wa.settings.${k}`);
  await refreshHealthIfStale();
  const [health, settings, readiness, dash] = await Promise.all([
    loadHealth(),
    loadSettings(),
    loadReadiness(),
    session.access.staff?.levels.out ? loadDashboard() : Promise.resolve(null),
  ]);
  const cfg = publicConfig();
  const status = !isConfigured()
    ? cfg.missing.length >= 5
      ? 'not_configured'
      : 'incomplete'
    : (health?.status ?? 'not_configured');
  const when = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleString(locale === 'ur' ? 'ur-PK' : 'en-GB', { timeZone: 'Asia/Karachi' }) : '—';
  const steps = (health?.steps ?? []) as unknown as { key: string; ok: boolean; detail?: string }[];
  const yes = (b: boolean) => m(b ? 'set' : 'notSet');
  const sender = steps.find((x) => x.key === 'sender')?.ok === true && steps.find((x) => x.key === 'isolation')?.ok === true;
  const ready: [string, boolean][] = [
    ['provider', steps.find((x) => x.key === 'auth')?.ok === true && steps.find((x) => x.key === 'account')?.ok === true],
    ['sender', sender],
    ['templates', (health?.templates_approved ?? 0) > 0],
    ['consent', readiness.consented > 0],
    ['sendingOn', settings.sendingEnabled],
  ];
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
              action={runConnectionTest.bind(null, locale)}
              label={m('test')}
              dataAction="wa.test"
              primary
              icon={<PlugZap size={15} aria-hidden />}
            />
          </div>
        )}
      </div>
      <div className={`banner ${status === 'connected' ? 'green' : 'orange'}`} data-wa-status={status}>
        {msg(locale, `wa.status.${status}`)}
      </div>
      <div className="card" data-section="readiness">
        <div className="ch">
          <h3>{m('readiness.title')}</h3>
        </div>
        <ul className="wa-ready">
          {ready.map(([key, ok]) => (
            <li key={key} data-ready={key} data-ok={ok}>
              <span className={`bd ${ok ? 'green' : 'orange'}`}>{m(ok ? 'readiness.yes' : 'readiness.no')}</span>
              <span>
                <b>{m(`readiness.${key}`)}</b>
                {!ok && <small>{m(`readiness.${key}Why`)}</small>}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="card" data-section="provider">
        <div className="ch">
          <h3>{m('provider')}</h3>
        </div>
        <div className="kv">
          <div>
            <small>{m('providerName')}</small>
            <b>IQPigeon WhatsApp API</b>
          </div>
          <div>
            <small>{m('baseUrl')}</small>
            <b dir="ltr">{cfg.baseUrl ?? '—'}</b>
          </div>
          <div>
            <small>{m('lastOk')}</small>
            <b>{when(health?.last_ok_at)}</b>
          </div>
          <div>
            <small>{m('lastChecked')}</small>
            <b>{when(health?.checked_at)}</b>
          </div>
          <div>
            <small>{m('sender')}</small>
            <b dir="ltr">{cfg.connectionId ?? '—'}</b>
          </div>
          <div>
            <small>{m('phoneNumberId')}</small>
            <b dir="ltr">{cfg.phoneNumberId ?? '—'}</b>
          </div>
          <div>
            <small>{m('accountName')}</small>
            <b data-account-name>{health?.account_name ?? '—'}</b>
          </div>
          <div>
            <small>{m('accountId')}</small>
            <b dir="ltr">{health?.account_id ?? '—'}</b>
          </div>
          <div>
            <small>{m('officialNumber')}</small>
            <b dir="ltr" data-official-number>{health?.display_phone ?? '—'}</b>
          </div>
          <div>
            <small>{m('waba')}</small>
            <b dir="ltr">{health?.waba_id ?? '—'}</b>
          </div>
          {health?.last_error && (
            <div>
              <small>{m('lastError')}</small>
              <b dir="auto">{health.last_error}</b>
            </div>
          )}
        </div>
        {cfg.missing.length > 0 && (
          <p className="banner orange" data-missing={cfg.missing.length}>
            {m('missing')} <span dir="ltr">{cfg.missing.join(', ')}</span>
          </p>
        )}
        {steps.length > 0 && (
          <ul className="wa-blocked" data-steps>
            {steps.map((s) => (
              <li key={s.key} data-step={s.key} data-ok={s.ok}>
                <b>{s.ok ? '✓' : '✗'}</b> {m(`steps.${s.key}`)}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card" data-section="security">
        <div className="ch">
          <h3>{m('security')}</h3>
        </div>
        <div className="kv">
          <div>
            <small>{m('apiKey')}</small>
            <b data-secret-state={cfg.apiKeySet}>{yes(cfg.apiKeySet)}</b>
          </div>
          <div>
            <small>{m('webhookSecret')}</small>
            <b>{yes(cfg.webhookSecretSet)}</b>
          </div>
          <div>
            <small>{m('lastAuthFailure')}</small>
            <b>{when(health?.last_auth_failure_at)}</b>
          </div>
        </div>
      </div>
      <div className="card" data-section="webhook">
        <div className="ch">
          <h3>{m('webhook')}</h3>
        </div>
        <div className="kv">
          <div>
            <small>{m('webhookUrl')}</small>
            <b dir="ltr">{cfg.webhookUrl}</b>
          </div>
          {dash && (
            <>
              <div>
                <small>{m('webhookLast')}</small>
                <b>{when(dash.webhookLast)}</b>
              </div>
              <div>
                <small>{m('webhookRejected')}</small>
                <b data-webhook-rejected={dash.webhookRejected}>{dash.webhookRejected}</b>
              </div>
              <div>
                <small>{m('webhookTest')}</small>
                <b data-webhook-test={health?.webhook_test_at ? 'done' : 'none'}>
                  {health?.webhook_test_at ? when(health.webhook_test_at) : m('webhookTestNone')}
                </b>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="card" data-section="queue">
        <div className="ch">
          <h3>{m('queue')}</h3>
        </div>
        <div className="kv">
          <div>
            <small>{m('queueWaiting')}</small>
            <b>{readiness.submitting}</b>
          </div>
          <div>
            <small>{m('queueUnknown')}</small>
            <b>{readiness.unknown}</b>
          </div>
          <div>
            <small>{m('queueFailed')}</small>
            <b>{readiness.failed}</b>
          </div>
          <div>
            <small>{m('queueActive')}</small>
            <b>{readiness.campaignsActive}</b>
          </div>
          <div>
            <small>{m('dailyUsed')}</small>
            <b>
              {readiness.sent24h} / {settings.dailyLimit}
            </b>
          </div>
          <div>
            <small>{m('templatesOnProvider')}</small>
            <b data-templates-total={health?.templates_total ?? 0}>
              {health?.templates_approved ?? 0} / {health?.templates_total ?? 0}
            </b>
          </div>
        </div>
      </div>
      <div className="card" data-section="sending">
        <div className="ch">
          <h3>{m('sending')}</h3>
        </div>
        {g.level >= 3 ? (
          <SettingsForm locale={locale} s={settings} />
        ) : (
          <div className="kv">
            <div>
              <small>{m('sendingEnabled')}</small>
              <b>{yes(settings.sendingEnabled)}</b>
            </div>
            <div>
              <small>{m('rate')}</small>
              <b>{settings.ratePerMinute}</b>
            </div>
            <div>
              <small>{m('maxCampaign')}</small>
              <b>{settings.maxCampaign}</b>
            </div>
            <div>
              <small>{m('threshold')}</small>
              <b>{settings.approvalThreshold}</b>
            </div>
          </div>
        )}
        <p className="muted">{m('retryPolicy')}</p>
        <p className="muted" data-scheduling-note>
          {m('schedulingNote')}
        </p>
      </div>
    </div>
  );
}
