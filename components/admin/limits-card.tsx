'use client';

import { RefreshCw } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { ActionForm, Hidden } from '@/components/shared/action-form';
import { FormMessage, Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import type { ActionResult } from '@/lib/access/result';
import { msg } from '@/lib/nav/model';
import { STAFF_MODULES, type Level } from '@/lib/permissions/levels';
import { resetRoleLimits, saveRoleLimits } from '@/lib/staff/actions';
import { cn } from '@/lib/utils';

const SG = 'Secretary General';

/**
 * Limits by designation (prototype admin/staff): clicking a cell changes it on screen only (— → View → Edit →
 * Approve); each designation is then saved with its own Save, after the person re-enters their password (owner's
 * request, migration 0400). Undo puts the row back. "Reset to defaults" asks for the password too.
 */
export function LimitsCard({
  locale,
  canManage,
  designations,
  limits,
  onDone,
  card,
}: {
  locale: Locale;
  canManage: boolean;
  designations: { name: string; seniority: number }[];
  limits: Record<string, Record<string, Level>>;
  onDone: (r: ActionResult) => void;
  card: (title: ReactNode, action: ReactNode, children: ReactNode) => ReactNode;
}) {
  const t = (k: string, vars?: Record<string, string>) => msg(locale, `access.staff.${k}`, vars);
  const [draft, setDraft] = useState<Record<string, Record<string, Level>>>({});
  const [confirm, setConfirm] = useState<{ kind: 'save'; designation: string } | { kind: 'reset' } | null>(null);
  const [failure, setFailure] = useState<ActionResult | null>(null);
  const saved = (d: string, m: string): Level => limits[d]?.[m] ?? 0;
  const level = (d: string, m: string): Level => draft[d]?.[m] ?? saved(d, m);
  const changes = (d: string) => STAFF_MODULES.filter((m) => draft[d]?.[m] !== undefined && draft[d]![m] !== saved(d, m));
  const cycle = (d: string, m: string) => setDraft((x) => ({ ...x, [d]: { ...x[d], [m]: ((level(d, m) + 1) % 4) as Level } }));
  const undo = (d: string) =>
    setDraft((x) => {
      const next = { ...x };
      delete next[d];
      return next;
    });
  const row = confirm?.kind === 'save' ? confirm.designation : null;
  const lv = (n: Level) => msg(locale, `access.levels.${n}`);
  const open = (c: NonNullable<typeof confirm>) => {
    setFailure(null);
    setConfirm(c);
  };

  const reset = canManage ? (
    <button type="button" className="btn" data-action="perm.reset" onClick={() => open({ kind: 'reset' })}>
      <RefreshCw className="size-4" aria-hidden />
      {t('resetDefaults')}
    </button>
  ) : null;

  const table = (
    <>
      <p className="mb-3 text-[14px] text-muted">{t('limitsHelpSave')}</p>
      {/* relative: the screen-reader-only header stays inside this scroll area (it widened the page on phones) */}
      <div className="mcards mgrid relative -mx-[var(--card-pad)] overflow-x-auto px-[var(--card-pad)]">
        <table className="w-full min-w-[1200px] border-collapse">
          <thead>
            <tr className="border-b border-line text-[12px] text-muted">
              <th scope="col" className="min-w-[190px] px-1.5 py-2 text-start font-bold">
                {msg(locale, 'access.staff.colDesignation')}
              </th>
              <th scope="col" className="px-1.5 py-2 font-bold">
                {t('colLevel')}
              </th>
              {STAFF_MODULES.map((m) => (
                <th key={m} scope="col" className="px-1.5 py-2 text-center font-bold">
                  {msg(locale, `access.modules.${m}`)}
                </th>
              ))}
              {canManage && (
                <th scope="col" className="px-1.5 py-2 font-bold">
                  <span className="sr-only">{t('save')}</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {designations.map((d) => {
              const fixed = d.name === SG;
              const n = changes(d.name).length;
              return (
                <tr
                  key={d.name}
                  className={cn('border-b border-line last:border-0', n > 0 && 'bg-[rgba(200,150,62,.08)]')}
                  data-designation={d.name}
                  data-unsaved={n || undefined}
                >
                  <th scope="row" className="px-1.5 py-2 text-start align-top text-[13px]">
                    <b>{d.name}</b>
                    <small className="block font-normal text-muted">{msg(locale, `access.designations.${d.name}`)}</small>
                    {n > 0 && <small className="block font-bold text-[#8a5f12]">{t('unsaved', { n: String(n) })}</small>}
                  </th>
                  <td className="px-1.5 py-2 text-center text-[12px]">L{d.seniority}</td>
                  {STAFF_MODULES.map((m) => {
                    const v = level(d.name, m);
                    const isChanged = draft[d.name]?.[m] !== undefined && draft[d.name]![m] !== saved(d.name, m);
                    return (
                      <td key={m} className="px-1.5 py-2 text-center">
                        <button
                          type="button"
                          className={cn('lvl max-sm:min-h-11 max-sm:min-w-11', `l${v}`, isChanged && 'outline outline-2 outline-offset-1 outline-[#c8963e]')}
                          data-action="perm.cycle"
                          data-module={m}
                          disabled={fixed || !canManage}
                          title={
                            fixed
                              ? msg(locale, 'access.staff.sgFixed')
                              : canManage
                                ? t('cellTitle', { designation: d.name, module: msg(locale, `access.modules.${m}`), level: lv(v) })
                                : msg(locale, 'access.staff.readOnly')
                          }
                          aria-label={`${d.name} · ${msg(locale, `access.modules.${m}`)}: ${lv(v)}${
                            isChanged ? ` (${t('changedFrom', { level: lv(saved(d.name, m)) })})` : ''
                          }`}
                          onClick={() => cycle(d.name, m)}
                        >
                          {v === 0 ? '—' : lv(v)}
                        </button>
                      </td>
                    );
                  })}
                  {canManage && (
                    <td className="px-1.5 py-2 text-center whitespace-nowrap">
                      {!fixed && (
                        <span className="inline-flex gap-1.5">
                          <button
                            type="button"
                            className="btn btn-primary"
                            data-action="perm.save"
                            disabled={n === 0}
                            title={n === 0 ? t('nothingToSave') : undefined}
                            onClick={() => open({ kind: 'save', designation: d.name })}
                          >
                            {t('save')}
                          </button>
                          <button
                            type="button"
                            className="btn"
                            data-action="perm.undo"
                            disabled={n === 0}
                            title={n === 0 ? t('nothingToSave') : undefined}
                            onClick={() => undo(d.name)}
                          >
                            {t('undo')}
                          </button>
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.kind === 'reset' ? t('confirmResetTitle') : t('confirmSaveTitle', { designation: row ?? '' })}
        intro={t('confirmHelp')}
        closeLabel={msg(locale, 'common.close')}
      >
        {row && (
          <ul className="mb-3 list-disc ps-5 text-[14px]" data-changes={row}>
            {changes(row).map((m) => (
              <li key={m}>
                {msg(locale, `access.modules.${m}`)}: {lv(saved(row, m))} → <b>{lv(level(row, m))}</b>
              </li>
            ))}
          </ul>
        )}
        <ActionForm
          action={confirm?.kind === 'reset' ? resetRoleLimits : saveRoleLimits}
          onDone={(r) => {
            if (!r.ok) return setFailure(r);
            onDone(r);
            if (row) undo(row);
            else setDraft({});
            setConfirm(null);
          }}
          className="grid gap-3"
        >
          {(pending) => (
            <>
              <Hidden
                values={{
                  locale,
                  ...(row
                    ? { designation: row, levels: JSON.stringify(Object.fromEntries(changes(row).map((m) => [m, level(row, m)]))) }
                    : {}),
                }}
              />
              <label className="form-field">
                {t('yourPassword')}
                <input name="password" type="password" autoComplete="current-password" required />
              </label>
              {failure && <FormMessage result={failure} />}
              <div className="flex justify-end gap-2.5">
                <button type="button" className="btn" data-action="modal.close" onClick={() => setConfirm(null)}>
                  {msg(locale, 'staffActions.cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  data-action={confirm?.kind === 'reset' ? 'perm.reset.confirm' : 'perm.save.confirm'}
                  disabled={pending}
                >
                  {confirm?.kind === 'reset' ? t('resetDefaults') : t('confirmSave')}
                </button>
              </div>
            </>
          )}
        </ActionForm>
      </Modal>
    </>
  );
  return card(t('limitsTitle'), reset, table);
}
