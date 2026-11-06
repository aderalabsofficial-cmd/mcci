'use client';

import { Plus, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ActionForm, Hidden } from '@/components/shared/action-form';
import { FormMessage } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import type { ActionResult } from '@/lib/access/result';
import {
  addTag,
  removeTag,
  saveOutreachDetails,
} from '@/lib/business/actions';
import type { BusinessProfile, Facets } from '@/lib/business/load';
import { msg } from '@/lib/nav/model';

type Done = (r: ActionResult) => void;

function useNotice() {
  const router = useRouter();
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const onDone: Done = (r) => {
    setNotice(r);
    if (r.ok) router.refresh();
  };
  return { notice, onDone };
}

/** outreach details: MCCI's own working data, kept apart from the official record */
export function OutreachDetails({ locale, p, canEdit }: { locale: Locale; p: BusinessProfile; canEdit: boolean }) {
  const m = (k: string) => msg(locale, `biz.profile.${k}`);
  const { notice, onDone } = useNotice();
  if (!canEdit) {
    return (
      <div className="kv">
        <div>
          <small>{msg(locale, 'biz.columns.city')}</small>
          <b>{p.outreach?.city ?? '—'}</b>
        </div>
        <div>
          <small>{msg(locale, 'biz.columns.district')}</small>
          <b>{p.outreach?.district ?? '—'}</b>
        </div>
      </div>
    );
  }
  return (
    <ActionForm action={saveOutreachDetails} onDone={onDone} className="biz-form">
      {(busy) => (
        <>
          <Hidden values={{ locale, company: p.company_id }} />
          <label className="form-field">
            {msg(locale, 'biz.columns.city')}
            <input name="city" defaultValue={p.outreach?.city ?? ''} maxLength={80} data-field="city" />
          </label>
          <label className="form-field">
            {msg(locale, 'biz.columns.district')}
            <input name="district" defaultValue={p.outreach?.district ?? ''} maxLength={80} data-field="district" />
          </label>
          <label className="form-field biz-wide">
            {m('notes')}
            <textarea
              name="notes"
              defaultValue={p.outreach?.notes ?? ''}
              maxLength={1000}
              rows={2}
              data-field="notes"
            />
          </label>
          <div className="pb biz-wide">
            <button
              className="btn btn-primary"
              data-action="biz.details.save"
              disabled={busy}
              title={busy ? m('working') : undefined}
            >
              <Save size={15} aria-hidden /> {m('saveDetails')}
            </button>
          </div>
          {notice && <FormMessage result={notice} />}
        </>
      )}
    </ActionForm>
  );
}

export function TagPanel({
  locale,
  p,
  facets,
  canEdit,
}: {
  locale: Locale;
  p: BusinessProfile;
  facets: Facets;
  canEdit: boolean;
}) {
  const m = (k: string) => msg(locale, `biz.profile.${k}`);
  const { notice, onDone } = useNotice();
  const have = new Set(p.tags.map((t) => t.id));
  const free = facets.tags.filter((t) => !have.has(t.id));
  return (
    <>
      {p.tags.length === 0 && <p className="muted">{m('noTags')}</p>}
      <ul className="biz-chips" data-tags>
        {p.tags.map((t) => (
          <li className="chip" key={t.id} data-tag={t.name}>
            {t.name}
            {canEdit && (
              <ActionForm action={removeTag} onDone={onDone} className="biz-inline">
                {(busy) => (
                  <>
                    <Hidden values={{ locale, company: p.company_id, tag: t.id }} />
                    <button
                      className="biz-x"
                      aria-label={`${m('removeTag')}: ${t.name}`}
                      data-action="biz.tag.remove"
                      disabled={busy}
                      title={busy ? m('working') : m('removeTag')}
                    >
                      <X size={13} aria-hidden />
                    </button>
                  </>
                )}
              </ActionForm>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <ActionForm action={addTag} onDone={onDone} className="biz-form">
          {(busy) => (
            <>
              <Hidden values={{ locale, company: p.company_id }} />
              {free.length > 0 && (
                <label className="form-field">
                  {m('existingTag')}
                  <select name="tag" defaultValue="" data-field="tag">
                    <option value="">{m('newTagOption')}</option>
                    {free.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="form-field">
                {m('newTag')}
                <input name="name" maxLength={40} data-field="tag-name" />
              </label>
              <div className="pb biz-wide">
                <button
                  className="btn btn-w"
                  data-action="biz.tag.add"
                  disabled={busy}
                  title={busy ? m('working') : undefined}
                >
                  <Plus size={15} aria-hidden /> {m('addTag')}
                </button>
              </div>
            </>
          )}
        </ActionForm>
      )}
      {notice && <FormMessage result={notice} />}
    </>
  );
}

