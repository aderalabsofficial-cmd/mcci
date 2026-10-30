'use client';

import { Eye, Paperclip, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { readSelection } from '@/components/business/directory-table';
import { ActionNotice } from '@/components/shared/action-notice';
import type { Locale } from '@/i18n/routing';
import { directoryQuery, type Filter, type Selection } from '@/lib/business/filters';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';
import { createCampaign, previewAudience, type AudiencePreview } from '@/lib/whatsapp/actions';
import { CATEGORIES, MEDIA_ACCEPT, placeholders, renderPreview, renderTemplate, VARIABLES } from '@/lib/whatsapp/media';

export interface TemplateOption {
  id: string;
  name: string;
  language: string;
  category: string | null;
  body: string | null;
  var_map: Record<string, string>;
  header_type: string;
}

/** Upload one file for a message; the server checks its type and size. */
export function AttachmentPicker({
  locale,
  value,
  onChange,
}: {
  locale: Locale;
  value: { id: string; file_name: string } | null;
  onChange: (v: { id: string; file_name: string } | null) => void;
}) {
  const m = (k: string) => msg(locale, `wa.composer.${k}`);
  const [note, setNote] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    setBusy(true);
    setNote(null);
    try {
      const form = new FormData();
      form.set('file', file);
      const res = await fetch('/api/whatsapp/attachments', { method: 'POST', body: form });
      const json = (await res.json().catch(() => ({}))) as { id?: string; file_name?: string; error?: string };
      if (res.ok && json.id) onChange({ id: json.id, file_name: json.file_name ?? file.name });
      else setNote({ ok: false, message: msg(locale, `wa.errors.${json.error ?? 'generic'}`) });
    } catch {
      setNote({ ok: false, message: msg(locale, 'common.actionUnconfirmed') });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="wa-attach">
      {value ? (
        <p data-attachment={value.file_name}>
          <Paperclip size={14} aria-hidden /> {value.file_name}{' '}
          <button type="button" className="btn btn-w" data-action="wa.attach.remove" onClick={() => onChange(null)}>
            <X size={14} aria-hidden /> {m('removeFile')}
          </button>
        </p>
      ) : (
        <label className="form-field">
          {m('attach')}
          <input
            type="file"
            accept={MEDIA_ACCEPT}
            disabled={busy}
            title={busy ? msg(locale, 'wa.common.working') : undefined}
            data-field="attachment"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
        </label>
      )}
      <small className="muted">{m('attachHint')}</small>
      <ActionNotice locale={locale} note={note} />
    </div>
  );
}

/**
 * Selective messages and campaigns are the same guided path: audience, message, preview with reasons, then a draft.
 * Creating the draft fixes the audience and sends nothing.
 */
export function CampaignComposer({
  locale,
  filter,
  q,
  templates,
  segment,
}: {
  locale: Locale;
  filter: Filter;
  q: string;
  templates: TemplateOption[];
  segment: string | null;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `wa.composer.${k}`, v);
  const router = useRouter();
  const [sel, setSel] = useState<Selection | null>(null);
  const [scope, setScope] = useState<'filter' | 'selected'>('filter');
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [category, setCategory] = useState<string>('announcements');
  const [kind, setKind] = useState<'template' | 'text'>('template');
  const [template, setTemplate] = useState<string>(templates[0]?.id ?? '');
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState<{ id: string; file_name: string } | null>(null);
  const [manual, setManual] = useState<string[]>([]);
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [note, setNote] = useState<Outcome | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => setSel(readSelection(directoryQuery({ f: filter, q }))), [filter, q]);
  const chosen = sel && sel.mode !== 'none' ? sel : null;
  useEffect(() => {
    if (chosen) setScope('selected');
  }, [chosen]);
  const useSel = scope === 'selected' && chosen;
  const ids = useSel && chosen.mode === 'ids' ? chosen.ids : null;
  const excluded = [...(useSel && chosen.mode === 'matching' ? chosen.excluded : []), ...manual].slice(0, 500);
  const tpl = templates.find((t) => t.id === template);
  const canPreview = kind === 'template' ? Boolean(template) : body.trim().length > 0;
  const blockedWhy = !canPreview
    ? m(kind === 'template' ? 'pickTemplate' : 'typeMessage')
    : pending
      ? msg(locale, 'wa.common.working')
      : undefined;
  const touch = () => setPreview(null);

  const load = (nextManual = manual) =>
    start(async () => {
      const ex = [...(useSel && chosen.mode === 'matching' ? chosen.excluded : []), ...nextManual].slice(0, 500);
      const r = await callAction(locale, () =>
        previewAudience(locale, {
          filter,
          q,
          ids,
          excluded: ex,
          category,
          kind,
          template: kind === 'template' ? template : null,
        }),
      );
      if (r.ok && 'preview' in r && r.preview) {
        setPreview(r.preview as AudiencePreview);
        setNote(null);
      } else setNote(r);
    });
  const create = () =>
    start(async () => {
      const r = await callAction(locale, () =>
        createCampaign(locale, {
          name,
          purpose,
          mode: useSel ? 'selective' : 'campaign',
          category: category as (typeof CATEGORIES)[number],
          kind,
          template: kind === 'template' ? template : null,
          body,
          attachment: attachment?.id ?? null,
          segment,
          filter,
          q,
          ids,
          excluded,
        }),
      );
      if (r.ok && 'id' in r && r.id)
        router.push(`${locale === 'ur' ? '/ur' : ''}/admin/whatsapp/campaigns/view?id=${r.id}`);
      else setNote(r);
    });
  const render = (values: Record<string, string | null>) =>
    kind === 'template' ? renderTemplate(tpl?.body ?? '', tpl?.var_map ?? {}, values) : renderPreview(body, values);
  const missingBody = kind === 'template' && tpl && !tpl.body;
  const unmapped = kind === 'template' && tpl ? placeholders(tpl.body).filter((n) => !tpl.var_map[n]) : [];

  return (
    <div className="card wa-composer" data-composer>
      <div className="ch">
        <h3>{m('title')}</h3>
      </div>
      <div className="biz-rule">
        <label className="form-field">
          {m('name')}
          <input value={name} maxLength={120} data-field="campaign-name" onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="form-field">
          {m('purpose')}
          <input
            value={purpose}
            maxLength={500}
            data-field="campaign-purpose"
            onChange={(e) => setPurpose(e.target.value)}
          />
        </label>
        <label className="form-field">
          {m('category')}
          <select
            value={category}
            data-field="campaign-category"
            onChange={(e) => {
              setCategory(e.target.value);
              touch();
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {msg(locale, `wa.categories.${c}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="biz-values">
        <legend>{m('who')}</legend>
        <label className="biz-check">
          <input
            type="radio"
            name="who"
            checked={scope === 'filter'}
            data-field="who-filter"
            onChange={() => (setScope('filter'), touch())}
          />
          {m('whoFilter')}
        </label>
        <label className="biz-check">
          <input
            type="radio"
            name="who"
            checked={scope === 'selected'}
            disabled={!chosen}
            title={chosen ? undefined : m('noSelection')}
            data-field="who-selected"
            onChange={() => (setScope('selected'), touch())}
          />
          {chosen
            ? m('whoSelected', { n: chosen.mode === 'ids' ? String(chosen.ids.length) : m('allMatching') })
            : m('noSelection')}
        </label>
      </fieldset>
      <fieldset className="biz-values">
        <legend>{m('kind')}</legend>
        <label className="biz-check">
          <input
            type="radio"
            name="kind"
            checked={kind === 'template'}
            data-field="kind-template"
            onChange={() => (setKind('template'), touch())}
          />
          {m('kindTemplate')}
        </label>
        <label className="biz-check">
          <input
            type="radio"
            name="kind"
            checked={kind === 'text'}
            data-field="kind-text"
            onChange={() => (setKind('text'), touch())}
          />
          {m('kindText')}
        </label>
      </fieldset>
      {kind === 'template' ? (
        templates.length === 0 ? (
          <p className="banner orange" data-no-templates>
            {m('noTemplates')}
          </p>
        ) : (
          <label className="form-field">
            {m('template')}
            <select
              value={template}
              data-field="campaign-template"
              onChange={(e) => {
                setTemplate(e.target.value);
                touch();
              }}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.language} · {t.category ?? '—'}
                </option>
              ))}
            </select>
          </label>
        )
      ) : (
        <>
          <label className="form-field">
            {m('message')}
            <textarea
              rows={4}
              maxLength={4096}
              dir="auto"
              value={body}
              data-field="campaign-body"
              onChange={(e) => (setBody(e.target.value), touch())}
            />
          </label>
          <small className="muted">
            {m('variablesHint')} {VARIABLES.map((v) => `{{${v}}}`).join(' ')}
          </small>
          <p className="banner orange">{m('textWindowNote')}</p>
        </>
      )}
      {missingBody && <p className="banner orange">{m('templateNoWording')}</p>}
      {unmapped.length > 0 && <p className="banner orange">{m('templateUnmapped', { n: unmapped.join(', ') })}</p>}
      {(kind === 'text' || (tpl && tpl.header_type !== 'none' && tpl.header_type !== 'text')) && (
        <AttachmentPicker locale={locale} value={attachment} onChange={setAttachment} />
      )}

      <div className="pb">
        <button
          type="button"
          className="btn btn-w"
          data-action="wa.audience.preview"
          disabled={!canPreview || pending}
          title={blockedWhy}
          onClick={() => load()}
        >
          <Eye size={15} aria-hidden /> {m('preview')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          data-action="wa.campaign.create"
          disabled={!preview || preview.eligible === 0 || pending || name.trim().length < 2}
          title={
            !preview
              ? m('previewFirst')
              : preview.eligible === 0
                ? m('noneEligible')
                : name.trim().length < 2
                  ? m('nameNeeded')
                  : undefined
          }
          onClick={create}
        >
          <Save size={15} aria-hidden /> {m('createDraft')}
        </button>
      </div>
      <small className="muted">{m('draftNote')}</small>
      <ActionNotice locale={locale} note={note} />

      {preview && (
        <div data-audience>
          <p>
            <b data-audience-eligible={preview.eligible}>
              {m('eligible', { n: String(preview.eligible), total: String(preview.total) })}
            </b>
          </p>
          {Object.keys(preview.blocked).length > 0 && (
            <ul className="wa-blocked" data-blocked>
              {Object.entries(preview.blocked).map(([k, n]) => (
                <li key={k} data-block={k}>
                  <b>{n}</b> {msg(locale, `wa.block.${k}`)}
                </li>
              ))}
            </ul>
          )}
          {preview.rows
            .filter((r) => !r.block)
            .slice(0, 3)
            .map((r) => (
              <div className="wa-sample" key={r.member_id} data-sample={r.member_no}>
                <small>{r.name}</small>
                <p className="wa-bubble" dir="auto">
                  {render(r.values)}
                </p>
              </div>
            ))}
          <div className="tw" tabIndex={0} role="region" aria-label={m('recipients')}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{m('recipientsCols.include')}</th>
                  <th scope="col">{m('recipientsCols.business')}</th>
                  <th scope="col">{m('recipientsCols.number')}</th>
                  <th scope="col">{m('recipientsCols.result')}</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr className="st" key={r.member_id} data-recipient={r.member_no}>
                    <td className="biz-pick">
                      <input
                        type="checkbox"
                        checked
                        aria-label={m('excludeRow', { name: r.name })}
                        data-action="wa.audience.exclude"
                        onChange={() => {
                          const next = [...manual, r.member_id];
                          setManual(next);
                          load(next);
                        }}
                      />
                    </td>
                    <td>
                      {r.name} ({r.member_no})
                    </td>
                    <td dir="ltr">{r.phone ?? '—'}</td>
                    <td>
                      {r.block ? (
                        <span className="bd red">{msg(locale, `wa.block.${r.block}`)}</span>
                      ) : (
                        <span className="bd green">{m('willSend')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.total > preview.rows.length && (
            <small className="muted">{m('firstRows', { n: String(preview.rows.length) })}</small>
          )}
        </div>
      )}
    </div>
  );
}
