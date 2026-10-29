import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { type SettingField, SettingsCard } from '@/components/admin/settings-card';
import { guardStaff } from '@/components/services/staff-page';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'settings.title') };
}

export const dynamic = 'force-dynamic';

type Obj = Record<string, unknown>;
const o = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {});

/**
 * Platform Settings (prototype admin/settings): what MCCI may change without a release — chamber details printed on
 * the form, vouchers and certificates; fees; process time and voucher due days; proposer & seconder rules; and the
 * open membership decisions (docs/14, docs/23 §4) that live in settings. Platform ≥ 1 reads, ≥ 2 saves (migration
 * 0510, audited with the reason). The bank account is saved on Payments (its own checked form); temporary membership
 * is gone (owner, 28 Oct 2026), so its policy card is not shown.
 */
export default async function SettingsPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'plat', 'settings.title');
  if (g.denied) return g.denied;
  const m = (k: string, v?: Record<string, string>) => msg(locale, `settings.${k}`, v);
  const supabase = await createClient();
  const { data, error } = await supabase.schema('api').rpc('settings_editable');
  if (error) throw new Error(`settings: ${error.message}`);
  const s = o(data);
  const chamber = o(s.chamber);
  const fees = o(s.fees);
  const sla = o(s.sla);
  const voucher = o(s.voucher);
  const endorse = o(s.endorse);
  const membership = o(s.membership);
  const qr = o(membership.certificateQr);
  const canEdit = g.level >= 2;
  const card = (key: string, title: string, fields: SettingField[], intro?: string) => (
    <SettingsCard locale={locale} settingKey={key} title={title} intro={intro} fields={fields} canEdit={canEdit} />
  );
  const classFees = (['Corporate', 'Associate', 'Women'] as const).flatMap((c) =>
    (['admission', 'subscription', 'card'] as const).map((k): SettingField => ({
      path: `${c}.${k}`,
      label: `${msg(locale, c === 'Women' ? 'membership.fee.women' : `membership.classes.${c}`)} · ${m(`fees.${k}`)}`,
      kind: 'money',
      value: Number(o(fees[c])[k] ?? 0),
      min: 0,
      max: 10_000_000,
    })),
  );

  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      {!canEdit && (
        <div className="banner" role="status">
          {m('readOnly')}
        </div>
      )}
      <div className="st-cards">
        {card(
          'chamber',
          m('chamber.title'),
          [
            { path: 'name', label: m('chamber.name'), kind: 'text', value: String(chamber.name ?? ''), wide: true },
            { path: 'addr', label: m('chamber.addr'), kind: 'text', value: String(chamber.addr ?? ''), wide: true },
            { path: 'tel', label: m('chamber.tel'), kind: 'text', value: String(chamber.tel ?? '') },
            { path: 'fax', label: m('chamber.fax'), kind: 'text', value: String(chamber.fax ?? '') },
            { path: 'email', label: m('chamber.email'), kind: 'email', value: String(chamber.email ?? '') },
            { path: 'web', label: m('chamber.web'), kind: 'text', value: String(chamber.web ?? '') },
          ],
          m('chamber.intro'),
        )}
        <section className="card" aria-labelledby="st-bank">
          <div className="ch">
            <h3 id="st-bank">{m('bank.title')}</h3>
          </div>
          <p className="muted">{m('bank.intro')}</p>
          <Link className="btn" href="/admin/payments" data-action="nav" style={{ marginTop: 10 }}>
            {m('bank.open')}
          </Link>
        </section>
        {card(
          'fees',
          m('fees.title'),
          [
            ...classFees,
            {
              path: 'extraCard',
              label: m('fees.extraCard'),
              kind: 'money',
              value: Number(fees.extraCard ?? 0),
              min: 0,
              max: 10_000_000,
            },
          ],
          m('fees.intro'),
        )}
        {card(
          'sla',
          m('sla.title'),
          [
            {
              path: 'processDays',
              label: m('sla.processDays'),
              kind: 'int',
              value: Number(sla.processDays ?? 15),
              min: 1,
              max: 90,
            },
            { path: 'hours', label: m('sla.hours'), kind: 'int', value: Number(sla.hours ?? 24), min: 1, max: 168 },
          ],
          m('sla.intro'),
        )}
        {card('voucher', m('voucher.title'), [
          {
            path: 'dueDays',
            label: m('voucher.dueDays'),
            kind: 'int',
            value: Number(voucher.dueDays ?? 7),
            min: 1,
            max: 60,
          },
        ])}
        {card('endorse', m('endorse.title'), [
          { path: 'days', label: m('endorse.days'), kind: 'int', value: Number(endorse.days ?? 7), min: 1, max: 60 },
          {
            path: 'remindDay',
            label: m('endorse.remindDay'),
            kind: 'int',
            value: Number(endorse.remindDay ?? 3),
            min: 1,
            max: 59,
          },
          {
            path: 'maxPerYear',
            label: m('endorse.maxPerYear'),
            kind: 'int',
            value: Number(endorse.maxPerYear ?? 12),
            min: 1,
            max: 100,
          },
          {
            path: 'sameClass',
            label: m('endorse.sameClass'),
            kind: 'bool',
            value: Boolean(endorse.sameClass),
            hint: m('endorse.sameClassHint'),
          },
          {
            path: 'preferSector',
            label: m('endorse.preferSector'),
            kind: 'bool',
            value: Boolean(endorse.preferSector),
            hint: m('endorse.preferSectorHint'),
          },
          {
            path: 'needCode',
            label: m('endorse.needCode'),
            kind: 'bool',
            value: Boolean(endorse.needCode),
            hint: m('endorse.needCodeHint'),
          },
        ])}
        {card(
          'membership',
          m('membership.title'),
          [
            {
              path: 'releaseNumberOnDecline',
              label: m('membership.releaseNumberOnDecline'),
              kind: 'bool',
              value: Boolean(membership.releaseNumberOnDecline),
              hint: m('membership.releaseNumberOnDeclineHint'),
            },
            {
              path: 'stampRequiredForProprietor',
              label: m('membership.stampRequiredForProprietor'),
              kind: 'bool',
              value: Boolean(membership.stampRequiredForProprietor),
            },
            {
              path: 'certificateLowConfidence',
              label: m('membership.certificateLowConfidence'),
              kind: 'int',
              value: Number(membership.certificateLowConfidence ?? 70),
              min: 0,
              max: 100,
              hint: m('membership.certificateLowConfidenceHint'),
            },
            {
              path: 'certificateQr.right',
              label: m('membership.qrRight'),
              kind: 'decimal',
              value: Number(qr.right ?? 0.915),
              min: 0.5,
              max: 0.99,
            },
            {
              path: 'certificateQr.top',
              label: m('membership.qrTop'),
              kind: 'decimal',
              value: Number(qr.top ?? 0.128),
              min: 0.01,
              max: 0.5,
            },
            {
              path: 'certificateQr.size',
              label: m('membership.qrSize'),
              kind: 'decimal',
              value: Number(qr.size ?? 0.055),
              min: 0.02,
              max: 0.2,
              hint: m('membership.qrHint'),
            },
          ],
          m('membership.intro'),
        )}
      </div>
    </div>
  );
}
