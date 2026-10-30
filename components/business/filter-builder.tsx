'use client';

import { Filter as FilterIcon, Plus, Save, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { ActionNotice } from '@/components/shared/action-notice';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import { countAudience, saveSegment, type Counts } from '@/lib/business/actions';
import {
  completeFilter,
  directoryQuery,
  FIELD_KEYS,
  FIELDS,
  MULTI,
  NO_VALUE,
  OPS,
  type FieldKey,
  type FieldType,
  type Filter,
  type Group,
  type Op,
  type Rule,
} from '@/lib/business/filters';
import type { Facets } from '@/lib/business/load';
import { callAction, type Outcome } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';

const emptyRule = (field: FieldKey = 'business_category'): Rule => {
  const type = FIELDS[field].type as FieldType;
  const op = OPS[type][0]!;
  return { field, op, value: valueFor(op) };
};
function valueFor(op: Op): Rule['value'] {
  if (MULTI.has(op)) return [];
  if (op === 'is') return true;
  if (op === 'between') return ['', ''];
  return NO_VALUE.has(op) ? undefined : '';
}

/**
 * The segment builder: groups of conditions, a live audience count, chips for what is applied, and saving as a
 * reusable segment. Applying puts the filter in the address, so it survives paging and can be shared with a colleague
 * who has the same access.
 */
export function FilterBuilder({
  locale,
  basePath,
  facets,
  initial,
  q,
  segment,
  canSave,
}: {
  locale: Locale;
  basePath: string;
  facets: Facets;
  initial: Filter;
  q: string;
  segment: { id: string; name: string; description: string | null } | null;
  canSave: boolean;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `biz.filter.${k}`, v);
  const router = useRouter();
  const base = locale === 'ur' ? `/ur${basePath}` : basePath;
  const [groups, setGroups] = useState<Group[]>(initial.groups);
  const [search, setSearch] = useState(q);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [countFailed, setCountFailed] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState(segment?.name ?? '');
  const [description, setDescription] = useState(segment?.description ?? '');
  const [note, setNote] = useState<Outcome | null>(null);
  const [pending, start] = useTransition();
  const ready = useMemo(() => completeFilter({ groups }), [groups]);
  const readyKey = JSON.stringify(ready) + search;
  const latest = useRef(readyKey);

  // the live audience count, a moment after the last change; an older answer never replaces a newer one
  useEffect(() => {
    latest.current = readyKey;
    const t = setTimeout(async () => {
      const r = await callAction(locale, () => countAudience(locale, ready, search.trim()));
      if (latest.current !== readyKey) return;
      if (r.ok && 'counts' in r && r.counts) {
        setCounts(r.counts as Counts);
        setCountFailed(false);
      } else setCountFailed(true);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- readyKey stands for ready and search
  }, [readyKey, locale]);

  const setGroup = (i: number, g: Partial<Group>) =>
    setGroups((all) => all.map((x, n) => (n === i ? { ...x, ...g } : x)));
  const setRule = (i: number, j: number, r: Rule) =>
    setGroups((all) => all.map((x, n) => (n === i ? { ...x, rules: x.rules.map((y, k) => (k === j ? r : y)) } : x)));
  const removeRule = (i: number, j: number) =>
    setGroups((all) =>
      all
        .map((x, n) => (n === i ? { ...x, rules: x.rules.filter((_, k) => k !== j) } : x))
        .filter((x) => x.rules.length > 0),
    );
  const apply = (next: Filter = ready) =>
    router.push(`${base}${directoryQuery({ f: next, q: search.trim(), segment: segment?.id })}`);
  const clear = () => {
    setGroups([]);
    setSearch('');
    router.push(base);
  };
  const save = () =>
    start(async () => {
      const r = await callAction(locale, () =>
        saveSegment(locale, { id: segment?.id ?? null, name, description, filter: ready }),
      );
      setNote(r);
      if (r.ok) {
        setSaveOpen(false);
        router.refresh();
      }
    });

  const optionLabel = (f: FieldKey, v: string) => {
    if (f === 'tags') return facets.tags.find((t) => t.id === v)?.name ?? v;
    return (FIELDS[f] as { options?: readonly string[] }).options ? msg(locale, `biz.values.${f}.${v}`) : v;
  };
  const chip = (r: Rule) => {
    const value = Array.isArray(r.value)
      ? r.op === 'between'
        ? r.value.join(' – ')
        : r.value.map((v) => optionLabel(r.field, v)).join(', ')
      : r.op === 'is'
        ? m(r.value ? 'yes' : 'no')
        : (r.value ?? '');
    return `${msg(locale, `biz.fields.${r.field}`)} ${m(`ops.${r.op}`)} ${value}`.trim();
  };

  return (
    <div className="card biz-filter" data-filter>
      <div className="ch">
        <h3>
          <FilterIcon size={16} aria-hidden /> {m('title')}
        </h3>
        {segment && (
          <span className="bd blue" data-segment-open>
            {m('segmentOpen', { name: segment.name })}
          </span>
        )}
      </div>
      <label className="form-field">
        {m('search')}
        <input
          type="search"
          value={search}
          maxLength={100}
          data-field="q"
          placeholder={m('searchHint')}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              apply();
            }
          }}
        />
      </label>

      {groups.map((g, i) => (
        <fieldset className="biz-group" key={i} data-group={i}>
          <legend>{m('group', { n: String(i + 1) })}</legend>
          <div className="biz-group-head">
            <label className="form-field">
              {m('match')}
              <select
                value={g.match}
                data-field="match"
                onChange={(e) => setGroup(i, { match: e.target.value as Group['match'] })}
              >
                <option value="all">{m('matchAll')}</option>
                <option value="any">{m('matchAny')}</option>
              </select>
            </label>
            <label className="biz-check">
              <input
                type="checkbox"
                checked={g.exclude}
                data-field="exclude"
                onChange={(e) => setGroup(i, { exclude: e.target.checked })}
              />
              {m('exclude')}
            </label>
          </div>
          {g.rules.map((r, j) => {
            const type = FIELDS[r.field].type as FieldType;
            return (
              <div className="biz-rule" key={j} data-rule={j}>
                <label className="form-field">
                  {m('field')}
                  <select
                    value={r.field}
                    data-field="rule-field"
                    onChange={(e) => setRule(i, j, emptyRule(e.target.value as FieldKey))}
                  >
                    {FIELD_KEYS.map((f) => (
                      <option key={f} value={f}>
                        {msg(locale, `biz.fields.${f}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  {m('condition')}
                  <select
                    value={r.op}
                    data-field="rule-op"
                    onChange={(e) => {
                      const op = e.target.value as Op;
                      setRule(i, j, { ...r, op, value: valueFor(op) });
                    }}
                  >
                    {OPS[type].map((o) => (
                      <option key={o} value={o}>
                        {m(`ops.${o}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <RuleValue
                  locale={locale}
                  rule={r}
                  facets={facets}
                  optionLabel={optionLabel}
                  onChange={(value) => setRule(i, j, { ...r, value })}
                />
                <button
                  type="button"
                  className="btn btn-w biz-remove"
                  data-action="biz.rule.remove"
                  aria-label={m('removeRule')}
                  onClick={() => removeRule(i, j)}
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            className="btn btn-w"
            data-action="biz.rule.add"
            onClick={() => setGroup(i, { rules: [...g.rules, emptyRule()] })}
          >
            <Plus size={15} aria-hidden /> {m('addRule')}
          </button>
        </fieldset>
      ))}

      <div className="pb">
        <button
          type="button"
          className="btn btn-w"
          data-action="biz.group.add"
          disabled={groups.length >= 10}
          title={groups.length >= 10 ? m('maxGroups') : undefined}
          onClick={() => setGroups((all) => [...all, { match: 'all', exclude: false, rules: [emptyRule()] }])}
        >
          <Plus size={15} aria-hidden /> {m('addGroup')}
        </button>
      </div>

      {ready.groups.length > 0 && (
        <ul className="biz-chips" aria-label={m('applied')}>
          {ready.groups.flatMap((g, i) =>
            g.rules.map((r, j) => (
              <li className={`chip ${g.exclude ? 'biz-chip-ex' : ''}`} key={`${i}-${j}`} data-chip>
                {g.exclude ? `${m('excludeShort')}: ` : ''}
                {chip(r)}
              </li>
            )),
          )}
        </ul>
      )}

      <div className="biz-count" aria-live="polite" data-counts={counts ? 'ready' : 'loading'}>
        {countFailed ? (
          <span className="muted">{m('countFailed')}</span>
        ) : counts ? (
          <>
            <b data-count="total">{m('matching', { n: String(counts.total) })}</b>
            <span>{m('countWhatsapp', { n: String(counts.whatsapp) })}</span>
            <span>{m('countConsent', { n: String(counts.consented) })}</span>
            <span>{m('countOpted', { n: String(counts.optedOut) })}</span>
            <span data-count="eligible">{m('countEligible', { n: String(counts.eligible) })}</span>
          </>
        ) : (
          <span className="muted">{m('counting')}</span>
        )}
      </div>

      <div className="pb">
        <button type="button" className="btn btn-primary" data-action="biz.filter.apply" onClick={() => apply()}>
          <FilterIcon size={15} aria-hidden /> {m('apply')}
        </button>
        <button type="button" className="btn btn-w" data-action="biz.filter.clear" onClick={clear}>
          <X size={15} aria-hidden /> {m('clear')}
        </button>
        {canSave && (
          <button
            type="button"
            className="btn btn-w"
            data-action="biz.segment.save"
            disabled={ready.groups.length === 0}
            title={ready.groups.length === 0 ? m('saveNeedsRule') : undefined}
            onClick={() => setSaveOpen(true)}
          >
            <Save size={15} aria-hidden /> {m(segment ? 'saveChanges' : 'saveSegment')}
          </button>
        )}
      </div>
      <ActionNotice locale={locale} note={note} />

      <Modal
        open={saveOpen}
        onOpenChange={setSaveOpen}
        title={m(segment ? 'saveChanges' : 'saveSegment')}
        intro={m('dynamicNote')}
        closeLabel={msg(locale, 'common.close')}
        footer={
          <button
            type="button"
            className="btn btn-primary"
            data-action="biz.segment.confirm"
            disabled={pending || name.trim().length < 2}
            title={name.trim().length < 2 ? m('nameNeeded') : undefined}
            onClick={save}
          >
            <Save size={15} aria-hidden /> {m('saveConfirm')}
          </button>
        }
      >
        <label className="form-field">
          {m('segmentName')}
          <input value={name} maxLength={80} data-field="segment-name" onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="form-field">
          {m('segmentDescription')}
          <input
            value={description}
            maxLength={300}
            data-field="segment-description"
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </Modal>
    </div>
  );
}

function RuleValue({
  locale,
  rule,
  facets,
  optionLabel,
  onChange,
}: {
  locale: Locale;
  rule: Rule;
  facets: Facets;
  optionLabel: (f: FieldKey, v: string) => string;
  onChange: (v: Rule['value']) => void;
}) {
  const m = (k: string) => msg(locale, `biz.filter.${k}`);
  const def = FIELDS[rule.field] as { type: FieldType; options?: readonly string[]; facet?: keyof Facets };
  if (NO_VALUE.has(rule.op)) return null;
  if (MULTI.has(rule.op)) {
    const options =
      rule.field === 'tags'
        ? facets.tags.map((t) => t.id)
        : (def.options ?? (def.facet ? (facets[def.facet] as string[]) : []));
    const chosen = (rule.value as string[]) ?? [];
    if (options.length === 0) return <p className="muted biz-values">{m('noValues')}</p>;
    return (
      <fieldset className="biz-values" data-values>
        <legend>{m('values')}</legend>
        {options.map((o) => (
          <label className="biz-check" key={o}>
            <input
              type="checkbox"
              checked={chosen.includes(o)}
              onChange={(e) => onChange(e.target.checked ? [...chosen, o] : chosen.filter((x) => x !== o))}
            />
            {optionLabel(rule.field, o)}
          </label>
        ))}
      </fieldset>
    );
  }
  if (rule.op === 'is') {
    return (
      <label className="form-field">
        {m('value')}
        <select
          value={rule.value ? 'yes' : 'no'}
          data-field="rule-value"
          onChange={(e) => onChange(e.target.value === 'yes')}
        >
          <option value="yes">{m('yes')}</option>
          <option value="no">{m('no')}</option>
        </select>
      </label>
    );
  }
  const inputType = def.type === 'date' ? 'date' : def.type === 'number' ? 'number' : 'text';
  if (rule.op === 'between') {
    const [a, b] = (rule.value as string[]) ?? ['', ''];
    return (
      <>
        <label className="form-field">
          {m('from')}
          <input
            type={inputType}
            value={a ?? ''}
            data-field="rule-from"
            onChange={(e) => onChange([e.target.value, b ?? ''])}
          />
        </label>
        <label className="form-field">
          {m('to')}
          <input
            type={inputType}
            value={b ?? ''}
            data-field="rule-to"
            onChange={(e) => onChange([a ?? '', e.target.value])}
          />
        </label>
      </>
    );
  }
  return (
    <label className="form-field">
      {m('value')}
      <input
        type={inputType}
        value={(rule.value as string) ?? ''}
        maxLength={100}
        data-field="rule-value"
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
