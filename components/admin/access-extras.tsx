'use client';

import { useState, type ReactNode } from 'react';
import { PasswordField } from '@/components/shared/password-field';
import { SimpleForm } from '@/components/shared/simple-form';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { STAFF_MODULES } from '@/lib/permissions/levels';
import { addDesignation, setPersonLimit, setServiceOfficers } from '@/lib/staff/actions';

/**
 * Staff & Roles, the rest of access: add a designation, set one person's limit for one section, and name the officers of
 * each service. Each change asks for the person's own password first (the "master password" step of the owner's list):
 * it is tied to a named person in the audit log, which a shared password could not be.
 */
export function AccessExtras({
  locale,
  designations,
  people,
  overrides,
  services,
  assignees,
}: {
  locale: Locale;
  designations: string[];
  people: { id: string; name: string; designation: string }[];
  overrides: { user_id: string; module: string; level: number; reason: string }[];
  services: { key: string; name: string }[];
  assignees: { service_key: string; user_id: string }[];
}) {
  const t = (k: string, v?: Record<string, string>) => msg(locale, `access.extras.${k}`, v);
  const card = (key: string, title: string, help: string, children: ReactNode) => (
    <section className="card mb-4" data-section={key}>
      <h2 className="font-bold">{title}</h2>
      <p className="mb-3 text-[14px] text-muted">{help}</p>
      {children}
    </section>
  );
  const password = <PasswordField locale={locale} label={t('password')} name="password" autoComplete="current-password" required />;
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? '—';
  const [service, setService] = useState(services[0]?.key ?? '');
  return (
    <div className="proto access-extras">
      {card(
        'add-designation',
        t('designationTitle'),
        t('designationHelp'),
        <SimpleForm locale={locale} action={(fd) => addDesignation(null, fd)} className="biz-form">
          {(busy) => (
            <>
              <label className="form-field">
                {t('designationName')}
                <input name="name" required minLength={2} maxLength={80} data-field="designation-name" />
              </label>
              <label className="form-field">
                {t('seniority')}
                <select name="seniority" defaultValue="2" data-field="designation-seniority">
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      L{n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                {t('copyFrom')}
                <select name="copyFrom" defaultValue="" data-field="designation-copy">
                  <option value="">{t('copyNone')}</option>
                  {designations
                    .filter((d) => d !== 'Secretary General')
                    .map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                </select>
              </label>
              {password}
              <div className="pb biz-wide">
                <button className="btn btn-primary" disabled={busy} data-action="perm.designation">
                  {t('designationSave')}
                </button>
              </div>
            </>
          )}
        </SimpleForm>,
      )}
      {card(
        'person-limit',
        t('personTitle'),
        t('personHelp'),
        <>
          <SimpleForm locale={locale} action={(fd) => setPersonLimit(null, fd)} className="biz-form">
            {(busy) => (
              <>
                  <label className="form-field">
                  {t('person')}
                  <select name="user" required data-field="person-user">
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.designation}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  {t('section')}
                  <select name="module" required data-field="person-module">
                    {STAFF_MODULES.map((m) => (
                      <option key={m} value={m}>
                        {msg(locale, `access.modules.${m}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  {t('level')}
                  <select name="level" defaultValue="default" data-field="person-level">
                    <option value="default">{t('asDesignation')}</option>
                    {[0, 1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {msg(locale, `access.levels.${n}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  {t('reason')}
                  <input name="reason" required minLength={3} maxLength={300} data-field="person-reason" />
                </label>
                {password}
                <div className="pb biz-wide">
                  <button className="btn btn-primary" disabled={busy} data-action="perm.person">
                    {t('personSave')}
                  </button>
                </div>
              </>
            )}
          </SimpleForm>
          {overrides.length > 0 && (
            <ul className="mt-3" data-overrides>
              {overrides.map((o) => (
                <li key={`${o.user_id}-${o.module}`} className="text-[14px]">
                  <b>{nameOf(o.user_id)}</b> · {msg(locale, `access.modules.${o.module}`)}: {msg(locale, `access.levels.${o.level}`)} · {o.reason}
                </li>
              ))}
            </ul>
          )}
        </>,
      )}
      {card(
        'service-officers',
        t('officersTitle'),
        t('officersHelp'),
        <SimpleForm locale={locale} action={(fd) => setServiceOfficers(null, fd)} className="biz-form" resetOnDone={false} key={service}>
          {(busy) => (
            <>
              <input type="hidden" name="service" value={service} />
              <nav className="pills biz-wide" aria-label={t('service')}>
                {services.map((v) => {
                  const n = assignees.filter((a) => a.service_key === v.key).length;
                  return (
                    <button
                      key={v.key}
                      type="button"
                      className={`pill ${service === v.key ? 'on' : ''}`}
                      aria-pressed={service === v.key}
                      data-action="perm.service.pick"
                      data-service={v.key}
                      onClick={() => setService(v.key)}
                    >
                      {v.name}
                      {n > 0 ? ` (${n})` : ''}
                    </button>
                  );
                })}
              </nav>
              <fieldset className="biz-values biz-wide">
                <legend>{t('officers')}</legend>
                {people.map((p) => (
                  <label className="biz-check" key={p.id}>
                    <input
                      type="checkbox"
                      name="officers"
                      value={p.id}
                      defaultChecked={assignees.some((a) => a.service_key === service && a.user_id === p.id)}
                      data-officer={p.name}
                    />
                    {p.name} · {p.designation}
                  </label>
                ))}
              </fieldset>
              {password}
              <div className="pb biz-wide">
                <button className="btn btn-primary" disabled={busy} data-action="perm.service">
                  {t('officersSave')}
                </button>
              </div>
            </>
          )}
        </SimpleForm>,
      )}
    </div>
  );
}
