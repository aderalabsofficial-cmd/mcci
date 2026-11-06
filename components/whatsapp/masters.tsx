'use client';

import { Eye, Save, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { ActionForm, Hidden } from '@/components/shared/action-form';
import { ActionNotice } from '@/components/shared/action-notice';
import { FormMessage } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import type { ActionResult } from '@/lib/access/result';
import type { Filter } from '@/lib/business/filters';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';
import { audienceBreakdown, createMasterCampaign, saveMasterVersion, type Breakdown } from '@/lib/whatsapp/actions';
import {
  fieldProblem,
  fieldSlots,
  fieldValues,
  fillMaster,
  wordingProblem,
  type Master,
  type MasterLanguage,
} from '@/lib/whatsapp/masters';

const GROUPS = ['free_text', 'template_required', 'no_consent', 'opted_out', 'invalid'] as const;

/** the provider's status in plain words; only APPROVED may be sent */
export function StatusBadge({ locale, status }: { locale: Locale; status: string }) {
  const known = ['LOCAL', 'NOT_ON_PROVIDER', 'PENDING', 'IN_APPEAL', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED'];
  const tone = status === 'APPROVED' ? 'green' : status === 'REJECTED' || status === 'DISABLED' ? 'red' : 'orange';
  return (
    <span className={`bd ${tone}`} data-master-status={status}>
      {msg(locale, `wa.masters.status.${known.includes(status) ? status : 'UNKNOWN'}`)}
    </span>
  );
}

/** an administrator edits one language version; approved or pending wording is held by Meta and cannot change here */
export function MasterVersionForm({ locale, master, language }: { locale: Locale; master: Master; language: MasterLanguage }) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `wa.masters.${k}`, v);
  const v = master.versions.find((x) => x.language === language)!;
  const router = useRouter();
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const [header, setHeader] = useState(v.header);
  const [body, setBody] = useState(v.body);
  const [footer, setFooter] = useState(v.footer ?? '');
  const problem = wordingProblem(body, header, footer, master.slots.length);
  return (
    <ActionForm
      action={saveMasterVersion}
      onDone={(r) => {
        setNotice(r);
        if (r.ok) router.refresh();
      }}
      className="biz-form"
    >
      {(busy) => (
        <>
          <Hidden values={{ locale, key: master.key, language }} />
          <label className="form-field biz-wide">
            {m('header')}
            <input name="header" value={header} maxLength={60} dir="auto" data-field={`master-header-${language}`} onChange={(e) => setHeader(e.target.value)} />
          </label>
          <label className="form-field biz-wide">
            {m('body')}
            <textarea name="body" rows={9} maxLength={1024} dir="auto" value={body} data-field={`master-body-${language}`} onChange={(e) => setBody(e.target.value)} />
          </label>
          <label className="form-field biz-wide">
            {m('footer')}
            <input name="footer" value={footer} maxLength={60} dir="auto" data-field={`master-footer-${language}`} onChange={(e) => setFooter(e.target.value)} />
          </label>
          {problem && (
            <p className="banner orange biz-wide" data-wording-problem={problem}>
              {m(`wording.${problem}`, { n: String(master.slots.length) })}
            </p>
          )}
          <div className="pb biz-wide">
            <button
              className="btn btn-w"
              data-action="wa.master.save"
              disabled={busy || Boolean(problem)}
              title={busy ? msg(locale, 'wa.common.working') : problem ? m(`wording.${problem}`, { n: String(master.slots.length) }) : undefined}
            >
              <Save size={15} aria-hidden /> {m('save')}
            </button>
          </div>
          {notice && <FormMessage result={notice} />}
        </>
      )}
    </ActionForm>
  );
}

/**
 * The master-template step of the composer: pick one of the four, its language, fill in the campaign fields, see the
 * message as it will arrive, see where every business in the audience stands, then create the draft. A version Meta
 * has not approved cannot become a campaign; free text goes only to an open conversation and only when chosen.
 */
export function MasterSection({
  locale,
  masters,
  appUrl,
  audience,
  name,
  purpose,
  mode,
  segment,
  capacity,
}: {
  locale: Locale;
  masters: Master[];
  capacity: { room: number; limit: number | null; problem: string | null };
  appUrl: string;
  audience: { filter: Filter; q: string; ids: string[] | null; excluded: string[] };
  name: string;
  purpose: string;
  mode: 'campaign' | 'selective';
  segment: string | null;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `wa.masters.${k}`, v);
  const router = useRouter();
  const [key, setKey] = useState(masters[0]?.key ?? 'announcements');
  // the membership-update master may also go as a service / application / certificate update (0690)
  const [sendAs, setSendAs] = useState<'membership' | 'services'>('membership');
  const category = key === 'membership' ? sendAs : key;
  const [language, setLanguage] = useState<MasterLanguage>(locale === 'ur' ? 'ur' : 'en');
  // the link starts as MCCI's own address (a real, editable value): an example only looked filled in (DEF-008)
  const startTyped = (): Record<string, string> => (/^https:\/\/\S{4,200}$/.test(appUrl) ? { link: appUrl } : {});
  const [typed, setTyped] = useState<Record<string, string>>(startTyped);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [mixed, setMixed] = useState(false);
  const [mixedBody, setMixedBody] = useState('');
  const [note, setNote] = useState<Outcome | null>(null);
  const [pending, start] = useTransition();
  const master = masters.find((x) => x.key === key);
  const version = master?.versions.find((v) => v.language === language);
  const fields = useMemo(() => (master ? fieldValues(master, language, typed) : {}), [master, language, typed]);
  if (!master || !version) return null;
  const problem = fieldProblem(master, language, typed);
  const approved = version.status === 'APPROVED';
  const sample = breakdown?.rows.find((r) => r.group === 'free_text' || r.group === 'template_required');
  const recipient = sample?.values ?? Object.fromEntries(master.slots.filter((s) => s.source === 'recipient').map((s) => [s.key, language === 'ur' ? s.example_ur : s.example_en]));
  // a field not filled in shows as [its label] in the preview and is listed under it (DEF-008, 6 Nov 2026)
  const label = (k: string) => m(`fields.${k}`);
  const shown = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v || `[${label(k)}]`]));
  const preview = fillMaster(version.body, master.slots, { ...recipient, ...shown });
  const missing = fieldSlots(master).filter((s) => s.required !== false && !fields[s.key]).map((s) => label(s.key));
  const canMix = Boolean(breakdown && breakdown.groups.free_text > 0 && breakdown.groups.template_required > 0);
  const sendable = breakdown ? breakdown.groups.free_text + breakdown.groups.template_required : 0;
  const reset = () => (setBreakdown(null), setMixed(false));
  // the free-text version keeps the recipient's own values as {{names}} that are filled for each person
  const textDraft = () =>
    master.slots.reduce(
      (t, s) => t.replaceAll(`{{${s.n}}}`, s.source === 'field' ? fields[s.key] ?? '' : `{{${s.key}}}`),
      [version.header, '', version.body].join('\n'),
    );

  const check = () =>
    start(async () => {
      const r = await callAction(locale, () => audienceBreakdown(locale, { ...audience, category }));
      if (r.ok && 'breakdown' in r && r.breakdown) {
        setBreakdown(r.breakdown as Breakdown);
        setNote(null);
      } else setNote(r);
    });
  const create = () =>
    start(async () => {
      const r = await callAction(locale, () =>
        createMasterCampaign(locale, {
          ...audience,
          category,
          name,
          purpose,
          mode,
          master: key,
          language,
          fields: typed,
          mixed: mixed && canMix,
          body: mixed && canMix ? mixedBody : '',
          segment,
        }),
      );
      if (r.ok && 'id' in r && r.id) router.push(`${locale === 'ur' ? '/ur' : ''}/admin/whatsapp/campaigns/view?id=${r.id}`);
      else setNote(r);
    });
  const why = !approved
    ? m('notApproved')
    : problem
      ? m('fieldNeeded', { field: m(`fields.${problem}`) })
      : !breakdown
        ? m('checkFirst')
        : sendable === 0
          ? msg(locale, 'wa.composer.noneEligible')
          : name.trim().length < 2
            ? msg(locale, 'wa.composer.nameNeeded')
            : mixed && canMix && !mixedBody.trim()
              ? m('mixedBodyNeeded')
              : pending
                ? msg(locale, 'wa.common.working')
                : undefined;

  return (
    <div className="wa-master" data-master-section>
      <div className="biz-rule">
        <label className="form-field">
          {m('choose')}
          <select value={key} data-field="master" onChange={(e) => (setKey(e.target.value as typeof key), setTyped(startTyped()), reset())}>
            {masters.map((x) => (
              <option key={x.key} value={x.key}>
                {msg(locale, `wa.categories.${x.key}`)}
              </option>
            ))}
          </select>
        </label>
        {key === 'membership' && (
          <label className="form-field">
            {m('sendAs')}
            <select value={sendAs} data-field="master-send-as" onChange={(e) => (setSendAs(e.target.value as 'membership' | 'services'), reset())}>
              <option value="membership">{msg(locale, 'wa.categories.membership')}</option>
              <option value="services">{msg(locale, 'wa.categories.services')}</option>
            </select>
          </label>
        )}
        <fieldset className="biz-values">
          <legend>{m('language')}</legend>
          {(['en', 'ur'] as const).map((l) => (
            <label className="biz-check" key={l}>
              <input type="radio" name="master-language" checked={language === l} data-field={`master-language-${l}`} onChange={() => (setLanguage(l), reset())} />
              {m(`languages.${l}`)}
            </label>
          ))}
        </fieldset>
      </div>
      <p>
        <small className="muted" dir="ltr">
          {master.name} · {language} · {master.metaCategory}
        </small>{' '}
        <StatusBadge locale={locale} status={version.status} />
      </p>
      {!approved && (
        <p className="banner orange" data-master-not-approved>
          {m('notApprovedLong')}
        </p>
      )}
      <div className="biz-rule">
        {fieldSlots(master).map((s) => (
          <label className={`form-field ${s.max && s.max > 120 ? 'biz-wide' : ''}`} key={s.key}>
            {m(`fields.${s.key}`)}
            {s.required === false ? ` (${m('optional')})` : ''}
            <input
              value={typed[s.key] ?? (s.key === 'link' ? '' : '')}
              placeholder={
                (language === 'ur' ? s.default_ur : s.default_en) ??
                `${m('eg')} ${s.key === 'link' ? appUrl : language === 'ur' ? s.example_ur : s.example_en}`
              }
              maxLength={s.max}
              dir={s.key === 'link' ? 'ltr' : 'auto'}
              data-field={`master-${s.key}`}
              onChange={(e) => (setTyped({ ...typed, [s.key]: e.target.value.replace(/[\n\r\t]/g, ' ') }), reset())}
            />
          </label>
        ))}
      </div>
      <div className="wa-sample" data-master-preview>
        <small>{m('previewTitle')}</small>
        <p className="wa-bubble" dir={language === 'ur' ? 'rtl' : 'ltr'} lang={language}>
          <b>{version.header}</b>
          {'\n\n'}
          {preview}
          {version.footer ? `\n\n${version.footer}` : ''}
        </p>
        {missing.length > 0 && (
          <p className="muted" data-master-missing>
            {m('missing', { fields: missing.join(', ') })}
          </p>
        )}
      </div>
      <div className="pb">
        <button type="button" className="btn btn-w" data-action="wa.master.audience" disabled={pending} onClick={check}>
          <Users size={15} aria-hidden /> {m('checkAudience')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          data-action="wa.master.create"
          disabled={Boolean(why)}
          title={why}
          onClick={create}
        >
          <Save size={15} aria-hidden /> {msg(locale, 'wa.composer.createDraft')}
        </button>
      </div>
      <ActionNotice locale={locale} note={note} />
      {breakdown && (
        <div data-breakdown>
          <p>
            <b data-breakdown-total={breakdown.total}>{m('breakdownTotal', { n: String(breakdown.total) })}</b>
          </p>
          <ul className="wa-blocked">
            {GROUPS.map((g) => (
              <li key={g} data-group={g} data-count={breakdown.groups[g]}>
                <b>{breakdown.groups[g]}</b> {m(`groups.${g}`)}
              </li>
            ))}
          </ul>
          <p className="muted">{m(mixed && canMix ? 'planMixed' : 'planTemplate', { n: String(sendable), skip: String(breakdown.total - sendable) })}</p>
          <p className="muted" data-capacity={capacity.room}>
            {capacity.problem
              ? m('capacityUnknown')
              : m('capacityLine', { room: String(capacity.room), limit: String(capacity.limit ?? '—') })}
          </p>
          {canMix && (
            <label className="biz-check">
              <input
                type="checkbox"
                checked={mixed}
                data-field="master-mixed"
                onChange={(e) => {
                  setMixed(e.target.checked);
                  if (e.target.checked && !mixedBody) setMixedBody(textDraft());
                }}
              />
              {m('mixed', { text: String(breakdown.groups.free_text), template: String(breakdown.groups.template_required) })}
            </label>
          )}
          {mixed && canMix && (
            <label className="form-field">
              {m('mixedBody')}
              <textarea rows={8} maxLength={4096} dir="auto" value={mixedBody} data-field="master-mixed-body" onChange={(e) => setMixedBody(e.target.value)} />
            </label>
          )}
          <div className="tw" tabIndex={0} role="region" aria-label={msg(locale, 'wa.composer.recipients')}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{msg(locale, 'wa.composer.recipientsCols.business')}</th>
                  <th scope="col">{msg(locale, 'wa.composer.recipientsCols.number')}</th>
                  <th scope="col">{msg(locale, 'wa.composer.recipientsCols.result')}</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.rows.map((r) => (
                  <tr className="st" key={r.member_id} data-recipient={r.member_no} data-row-group={r.group}>
                    <td>
                      {r.name} ({r.member_no})
                    </td>
                    <td dir="ltr">{r.phone ?? '—'}</td>
                    <td>
                      <span className={`bd ${r.group === 'free_text' || r.group === 'template_required' ? 'green' : 'red'}`}>
                        {m(`groups.${r.group}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {breakdown.total > breakdown.rows.length && (
            <small className="muted">{msg(locale, 'wa.composer.firstRows', { n: String(breakdown.rows.length) })}</small>
          )}
        </div>
      )}
      <p className="muted">
        <Eye size={13} aria-hidden /> {m('draftNote')}
      </p>
    </div>
  );
}
