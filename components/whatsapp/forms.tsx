'use client';

import { Link2, MessageCircle, Save, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AttachmentPicker, type TemplateOption } from '@/components/whatsapp/composer';
import { ActionForm, Hidden } from '@/components/shared/action-form';
import { FormMessage } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import type { ActionResult } from '@/lib/access/result';
import { msg } from '@/lib/nav/model';
import {
  addNote,
  linkConversation,
  memberConsent,
  recordConsentByStaff,
  saveTemplate,
  saveWhatsappSettings,
  sendToBusiness,
  updateConversation,
} from '@/lib/whatsapp/actions';
import { CATEGORIES, placeholders, VARIABLES } from '@/lib/whatsapp/media';

function useNotice() {
  const router = useRouter();
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const onDone = (r: ActionResult) => {
    setNotice(r);
    if (r.ok) router.refresh();
  };
  return { notice, onDone };
}
const wait = (locale: Locale, busy: boolean) => (busy ? msg(locale, 'wa.common.working') : undefined);

/** one message to one business: profile panel and inbox reply. The server applies the rules and says why if it refuses. */
export function SendForm({
  locale,
  company,
  templates,
  windowOpen,
  submitLabel,
}: {
  locale: Locale;
  company: string;
  templates: TemplateOption[];
  windowOpen: boolean;
  submitLabel?: string;
}) {
  const m = (k: string) => msg(locale, `wa.composer.${k}`);
  const { notice, onDone } = useNotice();
  const [template, setTemplate] = useState('');
  const [attachment, setAttachment] = useState<{ id: string; file_name: string } | null>(null);
  return (
    <ActionForm action={sendToBusiness} onDone={onDone} className="biz-form" key={notice?.ok ? 'sent' : 'new'}>
      {(busy) => (
        <>
          <Hidden values={{ locale, company, attachment: attachment?.id ?? '' }} />
          <label className="form-field">
            {m('category')}
            <select name="category" defaultValue="membership" data-field="send-category">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {msg(locale, `wa.categories.${c}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            {m('template')}
            <select
              name="template"
              value={template}
              data-field="send-template"
              onChange={(e) => setTemplate(e.target.value)}
            >
              <option value="">{m(windowOpen ? 'noTemplateText' : 'noTemplateClosed')}</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.language}
                </option>
              ))}
            </select>
          </label>
          {!template && (
            <>
              <label className="form-field biz-wide">
                {m('message')}
                <textarea name="body" rows={3} maxLength={4096} dir="auto" data-field="send-body" />
              </label>
              <div className="biz-wide">
                <AttachmentPicker locale={locale} value={attachment} onChange={setAttachment} />
              </div>
            </>
          )}
          <div className="pb biz-wide">
            <button className="btn btn-primary" data-action="wa.send" disabled={busy} title={wait(locale, busy)}>
              <Send size={15} aria-hidden /> {submitLabel ?? m('send')}
            </button>
          </div>
          {notice && <FormMessage result={notice} />}
        </>
      )}
    </ActionForm>
  );
}

export function ConversationForm({
  locale,
  id,
  status,
  assigned,
  staff,
}: {
  locale: Locale;
  id: string;
  status: string;
  assigned: string | null;
  staff: { id: string; name: string }[];
}) {
  const m = (k: string) => msg(locale, `wa.inbox.${k}`);
  const { notice, onDone } = useNotice();
  return (
    <ActionForm action={updateConversation} onDone={onDone} className="biz-form">
      {(busy) => (
        <>
          <Hidden values={{ locale, id }} />
          <label className="form-field">
            {m('status')}
            <select name="status" defaultValue={status} data-field="conv-status">
              {['open', 'pending', 'resolved'].map((s) => (
                <option key={s} value={s}>
                  {m(`states.${s}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            {m('assigned')}
            <select name="assigned" defaultValue={assigned ?? ''} data-field="conv-assigned">
              <option value="">{m('nobody')}</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="pb biz-wide">
            <button className="btn btn-w" data-action="wa.conv.save" disabled={busy} title={wait(locale, busy)}>
              <Save size={15} aria-hidden /> {m('saveConv')}
            </button>
          </div>
          {notice && <FormMessage result={notice} />}
        </>
      )}
    </ActionForm>
  );
}

export function NoteForm({ locale, id }: { locale: Locale; id: string }) {
  const m = (k: string) => msg(locale, `wa.inbox.${k}`);
  const { notice, onDone } = useNotice();
  return (
    <ActionForm action={addNote} onDone={onDone} className="biz-form" key={notice?.ok ? String(Date.now()) : 'note'}>
      {(busy) => (
        <>
          <Hidden values={{ locale, id }} />
          <label className="form-field biz-wide">
            {m('note')}
            <textarea name="body" rows={2} maxLength={2000} data-field="note-body" />
          </label>
          <div className="pb biz-wide">
            <button className="btn btn-w" data-action="wa.note.add" disabled={busy} title={wait(locale, busy)}>
              {m('addNote')}
            </button>
          </div>
          {notice && <FormMessage result={notice} />}
        </>
      )}
    </ActionForm>
  );
}

export function LinkForm({ locale, id }: { locale: Locale; id: string }) {
  const m = (k: string) => msg(locale, `wa.inbox.${k}`);
  const { notice, onDone } = useNotice();
  return (
    <ActionForm action={linkConversation} onDone={onDone} className="biz-form">
      {(busy) => (
        <>
          <Hidden values={{ locale, id }} />
          <label className="form-field biz-wide">
            {m('linkNumber')}
            <input name="member_no" maxLength={40} data-field="link-member" />
          </label>
          <div className="pb biz-wide">
            <button className="btn btn-w" data-action="wa.conv.link" disabled={busy} title={wait(locale, busy)}>
              <Link2 size={15} aria-hidden /> {m('link')}
            </button>
          </div>
          {notice && <FormMessage result={notice} />}
        </>
      )}
    </ActionForm>
  );
}

/** the approved wording and which value fills each placeholder. Approval itself only ever comes from the provider. */
export function TemplateForm({
  locale,
  t,
}: {
  locale: Locale;
  t: {
    id: string;
    header_type: string;
    header: string | null;
    body: string | null;
    footer: string | null;
    var_map: Record<string, string>;
  };
}) {
  const m = (k: string) => msg(locale, `wa.templates.${k}`);
  const { notice, onDone } = useNotice();
  const [body, setBody] = useState(t.body ?? '');
  const slots = placeholders(body);
  return (
    <ActionForm action={saveTemplate} onDone={onDone} className="biz-form">
      {(busy) => (
        <>
          <Hidden values={{ locale, id: t.id }} />
          <label className="form-field">
            {m('headerType')}
            <select name="header_type" defaultValue={t.header_type} data-field="tpl-header-type">
              {['none', 'text', 'image', 'document', 'video'].map((h) => (
                <option key={h} value={h}>
                  {m(`headers.${h}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            {m('header')}
            <input name="header" defaultValue={t.header ?? ''} maxLength={200} dir="auto" data-field="tpl-header" />
          </label>
          <label className="form-field biz-wide">
            {m('body')}
            <textarea
              name="body"
              rows={3}
              maxLength={2000}
              dir="auto"
              value={body}
              data-field="tpl-body"
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <label className="form-field biz-wide">
            {m('footer')}
            <input name="footer" defaultValue={t.footer ?? ''} maxLength={200} dir="auto" data-field="tpl-footer" />
          </label>
          {slots.map((n) => (
            <label className="form-field" key={n}>
              {m('fills')} {`{{${n}}}`}
              <select name={`var_${n}`} defaultValue={t.var_map[n] ?? ''} data-field={`tpl-var-${n}`}>
                <option value="">{m('chooseValue')}</option>
                {VARIABLES.map((v) => (
                  <option key={v} value={v}>
                    {msg(locale, `wa.variables.${v}`)}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <div className="pb biz-wide">
            <button className="btn btn-w" data-action="wa.template.save" disabled={busy} title={wait(locale, busy)}>
              <Save size={15} aria-hidden /> {m('save')}
            </button>
          </div>
          {notice && <FormMessage result={notice} />}
        </>
      )}
    </ActionForm>
  );
}

export function SettingsForm({
  locale,
  s,
}: {
  locale: Locale;
  s: {
    sendingEnabled: boolean;
    ratePerMinute: number;
    maxCampaign: number;
    approvalThreshold: number;
    consentOpen: boolean;
    consentVersion: string;
  };
}) {
  const m = (k: string) => msg(locale, `wa.settings.${k}`);
  const { notice, onDone } = useNotice();
  return (
    <ActionForm action={saveWhatsappSettings} onDone={onDone} className="biz-form">
      {(busy) => (
        <>
          <Hidden values={{ locale }} />
          <label className="biz-check biz-wide">
            <input
              type="checkbox"
              name="sendingEnabled"
              defaultChecked={s.sendingEnabled}
              data-field="sending-enabled"
            />
            {m('sendingEnabled')}
          </label>
          <label className="form-field">
            {m('rate')}
            <input
              type="number"
              name="ratePerMinute"
              min={1}
              max={250}
              defaultValue={s.ratePerMinute}
              data-field="rate"
            />
          </label>
          <label className="form-field">
            {m('maxCampaign')}
            <input type="number" name="maxCampaign" min={1} defaultValue={s.maxCampaign} data-field="max-campaign" />
          </label>
          <label className="form-field">
            {m('threshold')}
            <input
              type="number"
              name="approvalThreshold"
              min={0}
              defaultValue={s.approvalThreshold}
              data-field="threshold"
            />
          </label>
          <label className="form-field">
            {m('consentVersion')}
            <input name="consentVersion" maxLength={40} defaultValue={s.consentVersion} data-field="consent-version" />
          </label>
          <label className="biz-check biz-wide">
            <input type="checkbox" name="consentOpen" defaultChecked={s.consentOpen} data-field="consent-open" />
            {m('consentOpen')}
          </label>
          <div className="pb biz-wide">
            <button
              className="btn btn-primary"
              data-action="wa.settings.save"
              disabled={busy}
              title={wait(locale, busy)}
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

/** staff record consent only with evidence, for chosen categories */
export function StaffConsentForm({ locale, company }: { locale: Locale; company: string }) {
  const m = (k: string) => msg(locale, `biz.profile.${k}`);
  const { notice, onDone } = useNotice();
  return (
    <ActionForm action={recordConsentByStaff} onDone={onDone} className="biz-form">
      {(busy) => (
        <>
          <Hidden values={{ locale, company }} />
          <label className="form-field">
            {m('consentChange')}
            <select name="status" defaultValue="granted" data-field="consent-status">
              <option value="granted">{m('consentGrant')}</option>
              <option value="withdrawn">{m('consentWithdraw')}</option>
            </select>
          </label>
          <label className="form-field">
            {m('consentMethod')}
            <select name="method" defaultValue="written" data-field="consent-method">
              {['written', 'event_form', 'email'].map((k) => (
                <option key={k} value={k}>
                  {m(`methods.${k}`)}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="biz-values">
            <legend>{msg(locale, 'wa.consent.categories')}</legend>
            {CATEGORIES.map((c) => (
              <label className="biz-check" key={c}>
                <input type="checkbox" name="categories" value={c} defaultChecked data-category={c} />
                {msg(locale, `wa.categories.${c}`)}
              </label>
            ))}
          </fieldset>
          <label className="form-field biz-wide">
            {m('consentEvidence')}
            <input name="evidence" maxLength={500} data-field="consent-evidence" />
          </label>
          <div className="pb biz-wide">
            <button
              className="btn btn-primary"
              data-action="biz.consent.save"
              disabled={busy}
              title={wait(locale, busy)}
            >
              <Save size={15} aria-hidden /> {m('consentSave')}
            </button>
          </div>
          {notice && <FormMessage result={notice} />}
        </>
      )}
    </ActionForm>
  );
}

/** the member's own choice, in the portal. Shown only once MCCI has approved the wording and opened it. */
export function MemberConsentForm({
  locale,
  company,
  current,
}: {
  locale: Locale;
  company: string;
  current: { name: string | null; phone: string | null; status: string | null; categories: string[] | null };
}) {
  const m = (k: string) => msg(locale, `wa.member.${k}`);
  const { notice, onDone } = useNotice();
  const on = current.status === 'granted';
  return (
    <ActionForm action={memberConsent} onDone={onDone} className="biz-form">
      {(busy) => (
        <>
          <Hidden values={{ locale, company }} />
          <p className="biz-wide">{m('wording')}</p>
          <label className="form-field">
            {m('name')}
            <input name="name" maxLength={120} defaultValue={current.name ?? ''} data-field="member-name" />
          </label>
          <label className="form-field">
            {m('phone')}
            <input
              name="phone"
              dir="ltr"
              maxLength={24}
              placeholder="+923001234567"
              defaultValue={current.phone ?? ''}
              data-field="member-phone"
            />
          </label>
          <fieldset className="biz-values">
            <legend>{m('categories')}</legend>
            {CATEGORIES.map((c) => (
              <label className="biz-check" key={c}>
                <input
                  type="checkbox"
                  name="categories"
                  value={c}
                  defaultChecked={!on || (current.categories ?? []).includes(c)}
                  data-category={c}
                />
                {msg(locale, `wa.categories.${c}`)}
              </label>
            ))}
          </fieldset>
          <label className="biz-check biz-wide">
            <input type="checkbox" name="grant" defaultChecked={on} data-field="member-grant" />
            {m('agree')}
          </label>
          <div className="pb biz-wide">
            <button className="btn btn-primary" data-action="wa.member.save" disabled={busy} title={wait(locale, busy)}>
              <MessageCircle size={15} aria-hidden /> {m('save')}
            </button>
          </div>
          {notice && <FormMessage result={notice} />}
        </>
      )}
    </ActionForm>
  );
}
