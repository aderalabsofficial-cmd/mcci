'use client';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Flag,
  Plus,
  Printer,
  Search,
  Send,
  Signature,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import {
  type AppForm,
  classOf,
  classWhy,
  type DocRequirement,
  fee,
  type FeeSchedule,
  MAX_PARTNERS,
  type MembershipRules,
  missing,
  missingLabel,
  particularsFromNature,
  activityLabel,
} from '@/lib/flow/application';
import {
  addPartner,
  type DraftPatch,
  readWithAI,
  removePartner,
  saveDraft,
  saveInk,
  submitApplication,
  updatePartner,
} from '@/lib/membership/actions';
import {
  BIZ_TYPES,
  BUSINESS_FIELDS,
  type FormField,
  MAX_NATURE_ITEMS,
  REP_FIELDS,
  REQUIRED_FIELDS,
  SECTORS,
  WIZARD_STEPS,
} from '@/lib/membership/reference';
import { msg } from '@/lib/nav/model';
import { DocSlots, type SlotDoc } from './doc-slots';
import { type PadText, SignaturePad } from './signature-pad';
import { Ic } from './ui';

/**
 * The six-step application wizard (prototype member/join, docs/05 M3). Every change is saved automatically
 * (debounced 600 ms) so the applicant can continue on any device; the server re-validates every patch.
 */

export interface WizardApp {
  id: string;
  token: string;
  form: AppForm;
  field_confidence: Record<string, number>;
  jurisdiction_ok: boolean | null;
  women: boolean;
  decl1: boolean;
  decl2: boolean;
  photoUrl: string | null;
  signUrl: string | null;
  stampUrl: string | null;
  sign: boolean;
  stamp: boolean;
  docs: SlotDoc[];
  partners: {
    id: string;
    position: number;
    name: string;
    cnic: string | null;
    mobile: string | null;
    extra_card: boolean;
  }[];
  requirements: DocRequirement[];
}

type State = {
  form: AppForm;
  jurisdiction_ok: boolean | null;
  women: boolean;
  decl1: boolean;
  decl2: boolean;
  conf: Record<string, number>;
};

const fromApp = (a: WizardApp): State => ({
  form: a.form,
  jurisdiction_ok: a.jurisdiction_ok,
  women: a.women,
  decl1: a.decl1,
  decl2: a.decl2,
  conf: a.field_confidence,
});

const LOW = 85; // docs/05 M3: fields under 85 % are highlighted "please check"

export function Wizard({
  locale,
  app,
  fees,
  rules,
  aiOn,
  preview,
}: {
  locale: Locale;
  app: WizardApp;
  fees: FeeSchedule;
  rules: MembershipRules;
  aiOn: boolean;
  preview: ReactNode;
}) {
  const m = useCallback((k: string, v?: Record<string, string>) => msg(locale, `membership.${k}`, v), [locale]);
  const both = (k: string, v?: Record<string, string>) => ({
    en: msg('en', `membership.${k}`, v),
    ur: msg('ur', `membership.${k}`, v),
  });
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [s, setS] = useState<State>(() => fromApp(app));
  const [step, setStep] = useState(Math.min(5, Math.max(0, app.form.step ?? 0)));
  const [save, setSave] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [missingCodes, setMissingCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pad, setPad] = useState(false);
  const [natQ, setNatQ] = useState('');
  const pending = useRef<DraftPatch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const partAuto = useRef(!app.form.particulars || app.form.particulars === particularsFromNature(app.form.nature));
  const inkInput = useRef<HTMLInputElement>(null);
  const inkWhat = useRef<'sign' | 'stamp'>('sign');

  // the server's copy changed (AI reading, upload, refresh): take it over unless the applicant is typing
  const appVersion = JSON.stringify([
    app.form,
    app.field_confidence,
    app.jurisdiction_ok,
    app.women,
    app.decl1,
    app.decl2,
  ]);
  useEffect(() => {
    if (!timer.current) setS(fromApp(app));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- appVersion is the dependency
  }, [appVersion]);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const p = pending.current;
    if (!Object.keys(p).length) return true;
    pending.current = {};
    setSave('saving');
    const r = await saveDraft(locale, app.id, p);
    setSave(r.ok ? 'saved' : 'error');
    if (!r.ok && r.message) setNote({ ok: false, text: r.message });
    return r.ok;
  }, [app.id, locale]);

  const queue = useCallback(
    (patch: DraftPatch) => {
      const p = pending.current;
      pending.current = {
        ...p,
        ...patch,
        form: { ...(p.form ?? {}), ...(patch.form ?? {}) },
        checked: [...new Set([...(p.checked ?? []), ...(patch.checked ?? [])])],
      };
      if (!pending.current.form || !Object.keys(pending.current.form).length) delete pending.current.form;
      if (!pending.current.checked?.length) delete pending.current.checked;
      setSave('saving');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 600);
    },
    [flush],
  );

  const setForm = (patch: Partial<AppForm>, checked: FormField[] = []) => {
    setS((prev) => {
      const conf = { ...prev.conf };
      for (const k of checked) if (conf[k] !== undefined && conf[k] < 100) conf[k] = 100;
      return { ...prev, form: { ...prev.form, ...patch }, conf };
    });
    queue({ form: patch as DraftPatch['form'], ...(checked.length ? { checked } : {}) });
  };

  // flush before leaving the page
  useEffect(() => {
    const h = () => void flush();
    window.addEventListener('pagehide', h);
    return () => window.removeEventListener('pagehide', h);
  }, [flush]);

  const go = async (n: number) => {
    const to = Math.min(5, Math.max(0, n));
    setStep(to);
    setNote(null);
    setForm({ step: to });
    if (to === 5) {
      await flush();
      startTransition(() => router.refresh());
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const f = s.form;
  const extraCards = app.partners.filter((p) => p.extra_card).length;
  const cls = classOf(f);
  const docs = app.docs;
  const state = useMemo(
    () => ({
      form: f,
      jurisdiction_ok: s.jurisdiction_ok,
      women: s.women,
      decl1: s.decl1,
      decl2: s.decl2,
      sign_path: app.sign ? 'x' : null,
      stamp_path: app.stamp ? 'x' : null,
      docs: docs.map((d) => ({ key: d.key, status: d.status })),
      partners: app.partners.length,
    }),
    [f, s.jurisdiction_ok, s.women, s.decl1, s.decl2, app.sign, app.stamp, docs, app.partners.length],
  );
  const missingNow = missing(state, app.requirements, rules);

  // ───────── pieces ─────────

  const feeBox = f.biz ? (
    <div className="feebox">
      <div>
        <small>{m('fee.cls')}</small>
        <b>
          {m(`classes.${cls}`)}
          {s.women ? ` · ${m('fee.women')}` : ''}
        </b>
        <p className="muted">{m(`fee.${classWhy(f)}`)}</p>
      </div>
      <table className="fee-t">
        <tbody>
          {(() => {
            const x = fee(f, s.women, extraCards, fees);
            const pk = (n: number) => `Rs. ${n.toLocaleString('en-PK')}`;
            return (
              <>
                <tr>
                  <td>{m('fee.admission')}</td>
                  <td>{pk(x.admission)}</td>
                </tr>
                <tr>
                  <td>{m('fee.subscription')}</td>
                  <td>{pk(x.subscription)}</td>
                </tr>
                <tr>
                  <td>{m('fee.card')}</td>
                  <td>{pk(x.card)}</td>
                </tr>
                {x.extraCards > 0 && (
                  <tr>
                    <td>{m('fee.extra', { n: String(x.extraCards) })}</td>
                    <td>{pk(x.extra)}</td>
                  </tr>
                )}
                <tr className="t">
                  <td>{m('fee.total')}</td>
                  <td>{pk(x.total)}</td>
                </tr>
              </>
            );
          })()}
        </tbody>
      </table>
    </div>
  ) : null;

  const yn = (k: 'salesTax' | 'turnover50' | 'women', q: string) => {
    const on = k === 'women' ? s.women : Boolean(f[k]);
    return (
      <button
        type="button"
        className={`yn ${on ? 'on' : ''}`}
        aria-pressed={on}
        data-action="wiz.flag"
        onClick={() => {
          if (k === 'women') {
            setS((p) => ({ ...p, women: !on }));
            queue({ women: !on });
          } else setForm({ [k]: !on });
        }}
      >
        <span>
          {msg('en', `membership.wiz.cls.${q}`)}
          <small lang="ur">{msg('ur', `membership.wiz.cls.${q}`)}</small>
        </span>
        <b>
          {on
            ? `${msg('en', 'membership.wiz.yes')} · ${msg('ur', 'membership.wiz.yes')}`
            : `${msg('en', 'membership.wiz.no')} · ${msg('ur', 'membership.wiz.no')}`}
        </b>
      </button>
    );
  };

  const setNature = (n: NonNullable<AppForm['nature']>) => {
    const patch: Partial<AppForm> = { nature: n };
    if (partAuto.current) patch.particulars = particularsFromNature(n);
    setForm(patch);
  };
  const nature = f.nature ?? { sector: '', items: [], other: '' };
  const chip = (sk: string, slug: string) => {
    const label = activityLabel(sk, slug);
    const on = nature.sector === sk && (nature.items ?? []).includes(label);
    const color = SECTORS.find((x) => x.k === sk)!.c;
    return (
      <button
        key={`${sk}-${slug}`}
        type="button"
        className={`nchip ${on ? 'on' : ''}`}
        style={{ '--c': color } as React.CSSProperties}
        aria-pressed={on}
        data-action="wiz.nat.item"
        onClick={() => {
          const same = nature.sector === sk;
          const items = same ? [...(nature.items ?? [])] : [];
          if (on) items.splice(items.indexOf(label), 1);
          else if (items.length >= MAX_NATURE_ITEMS) return setNote({ ok: false, text: m('wiz.nature.max') });
          else items.push(label);
          setNature({ sector: sk, items, other: same ? (nature.other ?? '') : '' });
        }}
      >
        {on ? '✓ ' : ''}
        {msg(locale, `membership.nature.${sk}.items.${slug}`)}
      </button>
    );
  };
  const q = natQ.trim().toLowerCase();
  const results = q
    ? SECTORS.flatMap((sec) =>
        sec.items
          .filter((slug) => {
            const hay =
              `${activityLabel(sec.k, slug)} ${msg('ur', `membership.nature.${sec.k}.items.${slug}`)}`.toLowerCase();
            return q.split(/\s+/).every((w) => hay.includes(w));
          })
          .map((slug) => chip(sec.k, slug)),
      )
    : [];
  const sec = SECTORS.find((x) => x.k === nature.sector);

  const field = (k: FormField, full = false) => {
    const c = s.conf[k];
    const warn = c !== undefined && c < LOW;
    const required = REQUIRED_FIELDS.includes(k);
    const src = f.src?.[k];
    return (
      <label key={k} className={`jf ${warn ? 'w' : ''} ${full ? 'full' : ''}`}>
        {m(`fields.${k}`)}
        {required && <em className="rq"> *</em>}
        <input
          type={
            k === 'est'
              ? 'date'
              : k === 'email'
                ? 'email'
                : k === 'tel' || k === 'mobile' || k === 'fax'
                  ? 'tel'
                  : 'text'
          }
          value={(f[k] as string | undefined) ?? ''}
          placeholder={k === 'cnic' ? '36302-1234567-1' : k === 'mobile' ? '03xx-xxxxxxx' : ''}
          autoComplete={k === 'email' ? 'email' : k === 'mobile' ? 'tel' : 'off'}
          required={required}
          onChange={(e) => {
            if (k === 'particulars') partAuto.current = false;
            setForm({ [k]: e.target.value }, [k]);
          }}
        />
        {c !== undefined && (
          <em>
            {c >= 100
              ? m('wiz.details.checkedByYou')
              : c > 0
                ? m('wiz.details.conf', { n: String(c), src: src ? msg(locale, `membership.docs.${src}`) : 'AI' })
                : m('wiz.details.pleaseEnter')}
          </em>
        )}
      </label>
    );
  };

  const run = async <T extends { ok: boolean; message?: string }>(
    key: string,
    fn: () => Promise<T>,
    refresh = true,
  ): Promise<T> => {
    setBusy(key);
    setNote(null);
    try {
      const r = await fn();
      if (r.message) setNote({ ok: r.ok, text: r.message });
      if (r.ok && refresh) startTransition(() => router.refresh());
      return r;
    } finally {
      setBusy(null);
    }
  };

  const sendInk = async (file: Blob, what: 'sign' | 'stamp', drawn: boolean) => {
    const fd = new FormData();
    fd.set('locale', locale);
    fd.set('app', app.id);
    fd.set('what', what);
    fd.set('drawn', drawn ? '1' : '0');
    fd.set('file', new File([file], `${what}.png`, { type: file.type || 'image/png' }));
    const r = await run(`ink-${what}`, () => saveInk(fd));
    if (r.ok) setPad(false);
  };

  const padText: PadText = {
    title: m('wiz.sign.pad'),
    intro: m('wiz.sign.padIntro'),
    clear: m('wiz.sign.clear'),
    upload: m('wiz.sign.uploadInstead'),
    use: m('wiz.sign.use'),
    empty: m('wiz.sign.empty'),
    close: msg(locale, 'common.close'),
    working: m('wiz.working'),
  };

  // ───────── steps ─────────

  let body: ReactNode = null;
  if (step === 0) {
    body = (
      <>
        <p className="wz-k">{m('wiz.type.kicker')}</p>
        <h2 className="wz-h">
          <Bi {...both('wiz.type.title')} />
        </h2>
        <p className="muted">{m('wiz.type.help')}</p>
        <div className="biz six">
          {BIZ_TYPES.map((b) => (
            <button
              key={b}
              type="button"
              className={f.biz === b ? 'on' : ''}
              aria-pressed={f.biz === b}
              data-action="wiz.biz"
              onClick={async () => {
                setForm({ biz: b });
                await flush();
                startTransition(() => router.refresh());
              }}
            >
              <em className="tk">{f.biz === b ? '✓' : ''}</em>
              <i>
                <Ic
                  name={
                    b === 'prop'
                      ? 'user'
                      : b === 'aop'
                        ? 'users'
                        : b === 'pvt'
                          ? 'building'
                          : b === 'mnc'
                            ? 'globe'
                            : 'landmark'
                  }
                  size={30}
                />
              </i>
              <b>{msg('en', `membership.biz.${b}.name`)}</b>
              <span lang="ur">{msg('ur', `membership.biz.${b}.name`)}</span>
              <small>{m(`biz.${b}.hint`)}</small>
            </button>
          ))}
          <button
            type="button"
            className={`mfg ${f.manufacturing ? 'on' : ''}`}
            aria-pressed={Boolean(f.manufacturing)}
            data-action="wiz.flag"
            onClick={() => setForm({ manufacturing: !f.manufacturing })}
          >
            <em className="tk">{f.manufacturing ? '✓' : ''}</em>
            <i>
              <Ic name="factory" size={30} />
            </i>
            <b>{msg('en', 'membership.biz.mfg.name')}</b>
            <span lang="ur">{msg('ur', 'membership.biz.mfg.name')}</span>
            <small>{m('biz.mfg.hint')}</small>
          </button>
        </div>

        <h3 className="wz-h2">
          <Bi {...both('wiz.nature.title')} />
        </h3>
        <p className="muted">{m('wiz.nature.help')}</p>
        <div className="nat-search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            value={natQ}
            onChange={(e) => setNatQ(e.target.value)}
            placeholder={m('wiz.nature.search')}
            aria-label={m('wiz.nature.searchLabel')}
            autoComplete="off"
          />
        </div>
        {q && (
          <div className="nat-res">
            {results}
            {!results.length && <p className="muted nat-none">{m('wiz.nature.none')}</p>}
          </div>
        )}
        <div className="nat">
          {SECTORS.map((x) => (
            <button
              key={x.k}
              type="button"
              className={nature.sector === x.k ? 'on' : ''}
              style={{ '--c': x.c } as React.CSSProperties}
              aria-pressed={nature.sector === x.k}
              data-action="wiz.nat.sector"
              onClick={() => nature.sector !== x.k && setNature({ sector: x.k, items: [], other: '' })}
            >
              <i>
                <Ic name={x.icon} size={22} />
              </i>
              <b>{msg('en', `membership.nature.${x.k}.name`)}</b>
              <span lang="ur">{msg('ur', `membership.nature.${x.k}.name`)}</span>
              {nature.sector === x.k && (nature.items ?? []).length > 0 && <em>{(nature.items ?? []).length}</em>}
            </button>
          ))}
        </div>
        {sec && (
          <div className="nat-pick" style={{ '--c': sec.c } as React.CSSProperties}>
            <div className="nat-ph">
              <b>{msg(locale, `membership.nature.${sec.k}.name`)}</b>
              <small>{m('wiz.nature.pick', { n: String((nature.items ?? []).length) })}</small>
            </div>
            <div className="nchips">{sec.items.map((slug) => chip(sec.k, slug))}</div>
            <label className="jf nat-other">
              {m('wiz.nature.other')}
              <input
                value={nature.other ?? ''}
                placeholder={m('wiz.nature.otherPh')}
                onChange={(e) => setNature({ ...nature, other: e.target.value })}
              />
            </label>
          </div>
        )}

        <h3 className="wz-h2">
          <Bi {...both('wiz.cls.title')} />
        </h3>
        <p className="muted">{m('wiz.cls.help')}</p>
        <div className="yns">
          {yn('salesTax', 'salesTax')}
          {yn('turnover50', 'turnover50')}
          {yn('women', 'women')}
        </div>

        <h3 className="wz-h2">
          <Bi {...both('wiz.juris.title')} />
        </h3>
        <div className="juris">
          <span>
            {msg('en', 'membership.wiz.juris.q')}
            <small lang="ur">{msg('ur', 'membership.wiz.juris.q')}</small>
          </span>
          <div className="seg" role="group" aria-label={m('wiz.juris.title')}>
            {[true, false].map((val) => (
              <button
                key={String(val)}
                type="button"
                className={s.jurisdiction_ok === val ? (val ? 'on' : 'on no') : ''}
                aria-pressed={s.jurisdiction_ok === val}
                data-action="wiz.juris"
                onClick={() => {
                  setS((p) => ({ ...p, jurisdiction_ok: val }));
                  queue({ jurisdiction_ok: val });
                }}
              >
                {val
                  ? `${msg('en', 'membership.wiz.yes')} · ${msg('ur', 'membership.wiz.yes')}`
                  : `${msg('en', 'membership.wiz.no')} · ${msg('ur', 'membership.wiz.no')}`}
              </button>
            ))}
          </div>
        </div>
        {s.jurisdiction_ok === false && (
          <div className="banner orange" style={{ marginTop: 10 }} role="status">
            <Flag size={18} color="#2a1d05" aria-hidden />
            <span>{m('wiz.juris.blocked')}</span>
          </div>
        )}
        {feeBox}
      </>
    );
  }

  if (step === 1) {
    const done = app.requirements.filter((r) => docs.some((d) => d.key === r.key)).length;
    const total = app.requirements.length;
    body = (
      <>
        <p className="wz-k">{m('wiz.docs.kicker')}</p>
        <h2 className="wz-h">
          <Bi {...both('wiz.docs.title')} />
        </h2>
        <p className="muted">
          {f.biz ? m('wiz.docs.help', { biz: msg(locale, `membership.biz.${f.biz}.name`) }) : m('wiz.docs.chooseType')}
          {f.manufacturing ? ` ${m('wiz.docs.mfg')}` : ''} <small>({m('wiz.docs.fileHint')})</small>
        </p>
        <div className="prog">
          <u>
            <i style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </u>
          <span>{m('wiz.docs.progress', { done: String(done), total: String(total) })}</span>
        </div>
        <DocSlots
          locale={locale}
          appId={app.id}
          requirements={app.requirements}
          docs={docs}
          photoUrl={app.photoUrl}
          editable
          onMessage={setNote}
        />
        <div className="ai-cta">
          <Sparkles size={28} color="#c8963e" aria-hidden />
          <div>
            <b>
              <Bi {...both('wiz.ai.title')} />
            </b>
            <small>{aiOn ? m('wiz.ai.help') : m('wiz.ai.off')}</small>
          </div>
          <button
            type="button"
            className="btn btn-gold btn-big"
            data-action="wiz.ai"
            disabled={!aiOn || busy === 'ai'}
            aria-disabled={!aiOn}
            title={aiOn ? undefined : m('wiz.ai.off')}
            onClick={async () => {
              await flush();
              const r = await run('ai', () => readWithAI(locale, app.id));
              if (r.ok && r.form) {
                const filled = r.form;
                const conf = r.confidence ?? {};
                setS((prev) => ({ ...prev, form: { ...prev.form, ...filled }, conf: { ...prev.conf, ...conf } }));
              }
              if (r.ok) void go(2);
            }}
          >
            <Sparkles size={18} aria-hidden /> {busy === 'ai' ? m('wiz.ai.working') : <Bi {...both('wiz.ai.button')} />}
          </button>
        </div>
      </>
    );
  }

  if (step === 2) {
    const aiFields = Object.entries(s.conf).filter(([, c]) => c > 0 && c < 100);
    body = (
      <>
        <p className="wz-k">{m('wiz.details.kicker')}</p>
        <h2 className="wz-h">
          <Bi {...both('wiz.details.title')} />
        </h2>
        {Object.keys(s.conf).length ? (
          <div className="jsum">
            <b>{m('wiz.details.aiFilled', { n: String(Object.values(s.conf).filter((c) => c > 0).length) })}</b>
            <span>{m('wiz.details.aiCheck', { n: String(aiFields.filter(([, c]) => c < LOW).length) })}</span>
          </div>
        ) : (
          <p className="muted">{m('wiz.details.typeHint')}</p>
        )}
        <h4 className="jg">
          {msg('en', 'membership.wiz.details.business')} · {msg('ur', 'membership.wiz.details.business')}
        </h4>
        <div className="fg">{BUSINESS_FIELDS.map((k) => field(k, k === 'address' || k === 'particulars'))}</div>
        <button
          type="button"
          className={`decl sm ${f.addrMatch ? 'on' : ''}`}
          aria-pressed={Boolean(f.addrMatch)}
          data-action="wiz.addr"
          onClick={() => setForm({ addrMatch: !f.addrMatch })}
        >
          <i>{f.addrMatch ? '✓' : ''}</i>
          <span>
            {m('wiz.details.addrMatch')} <small className="muted">{m('wiz.details.required')}</small>
          </span>
        </button>
        <h4 className="jg">
          {msg('en', 'membership.wiz.details.rep')} · {msg('ur', 'membership.wiz.details.rep')}
        </h4>
        <div className="fg">{REP_FIELDS.map((k) => field(k))}</div>
        <h4 className="jg">
          {msg('en', 'membership.wiz.details.partners')} · {msg('ur', 'membership.wiz.details.partners')}{' '}
          {f.biz === 'prop' && <small className="opt">{m('wiz.details.partnersOptional')}</small>}
        </h4>
        {app.partners.map((p, i) => (
          <PartnerRow
            key={p.id}
            locale={locale}
            n={i + 1}
            p={p}
            fee={fees.extraCard}
            onChange={(patch) =>
              void updatePartner(locale, app.id, p.id, patch).then((r) =>
                r.ok
                  ? patch.extra_card !== undefined && startTransition(() => router.refresh())
                  : setNote({ ok: false, text: r.message ?? '' }),
              )
            }
            onRemove={() => void run(`p-${p.id}`, () => removePartner(locale, app.id, p.id))}
          />
        ))}
        {app.partners.length < MAX_PARTNERS && (
          <button
            type="button"
            className="btn btn-w"
            data-action="wiz.partner.add"
            disabled={busy === 'padd'}
            onClick={() => void run('padd', () => addPartner(locale, app.id))}
          >
            <Plus size={16} aria-hidden /> {m('wiz.details.addPartner')}
          </button>
        )}
      </>
    );
  }

  if (step === 3) {
    body = (
      <>
        <p className="wz-k">{m('wiz.endorse.kicker')}</p>
        <h2 className="wz-h">
          <Bi {...both('wiz.endorse.title')} />
        </h2>
        <div className="m1" style={{ margin: '10px 0 16px' }}>
          <Users size={18} color="#1f6feb" aria-hidden /> {m('wiz.endorse.help', { cls: m(`classes.${cls}`) })}
        </div>
        <div className="banner blue" role="status">
          <Ic name="clock" size={18} color="#fff" />
          <span>{m('wiz.endorse.later')}</span>
        </div>
      </>
    );
  }

  if (step === 4) {
    body = (
      <>
        <p className="wz-k">{m('wiz.sign.kicker')}</p>
        <h2 className="wz-h">
          <Bi {...both('wiz.sign.title')} />
        </h2>
        <div className="kvline">
          <div>
            <small>{m('wiz.sign.repName')}</small>
            <b>{f.rep || '—'}</b>
          </div>
          <div>
            <small>{m('wiz.sign.firmName')}</small>
            <b>{f.name || '—'}</b>
          </div>
        </div>
        <div className="g2c">
          <div className="card">
            <div className="ch">
              <h3>
                <Bi {...both('wiz.sign.signTitle')} />
              </h3>
            </div>
            <div className="sigbox">
              {app.signUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed URL of a private file
                <img src={app.signUrl} alt={m('wiz.sign.signTitle')} />
              ) : (
                <span className="muted">{m('wiz.sign.none')}</span>
              )}
            </div>
            <div className="pb">
              <button
                type="button"
                className="btn btn-primary btn-w"
                data-action="wiz.sign"
                onClick={() => setPad(true)}
              >
                <Signature size={16} aria-hidden />{' '}
                {app.signUrl ? m('wiz.sign.again') : <Bi {...both('wiz.sign.onScreen')} />}
              </button>
              <button
                type="button"
                className="btn btn-w"
                data-action="wiz.sign.upload"
                disabled={busy === 'ink-sign'}
                onClick={() => {
                  inkWhat.current = 'sign';
                  inkInput.current?.click();
                }}
              >
                <Upload size={16} aria-hidden /> {busy === 'ink-sign' ? m('wiz.working') : m('wiz.sign.upload')}
              </button>
            </div>
          </div>
          <div className="card">
            <div className="ch">
              <h3>
                <Bi {...both('wiz.sign.stampTitle')} />
              </h3>
            </div>
            <div className="sigbox">
              {app.stampUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed URL of a private file
                <img src={app.stampUrl} alt={m('wiz.sign.stampTitle')} />
              ) : (
                <span className="muted">
                  {f.biz === 'prop' ? m('wiz.sign.stampOptional') : m('wiz.sign.stampHelp')}
                </span>
              )}
            </div>
            <div className="pb">
              <button
                type="button"
                className="btn btn-primary btn-w"
                data-action="wiz.stamp.upload"
                disabled={busy === 'ink-stamp'}
                onClick={() => {
                  inkWhat.current = 'stamp';
                  inkInput.current?.click();
                }}
              >
                <Upload size={16} aria-hidden /> {busy === 'ink-stamp' ? m('wiz.working') : m('wiz.sign.stampUpload')}
              </button>
            </div>
          </div>
        </div>
        <input
          ref={inkInput}
          type="file"
          accept="image/jpeg,image/png"
          hidden
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void sendInk(file, inkWhat.current, false);
          }}
        />
        <h3 className="wz-h2">
          <Bi {...both('wiz.sign.declTitle')} />
        </h3>
        {(['decl1', 'decl2'] as const).map((k) => (
          <button
            key={k}
            type="button"
            className={`decl ${s[k] ? 'on' : ''}`}
            aria-pressed={s[k]}
            data-action="wiz.declare"
            onClick={() => {
              setS((p) => ({ ...p, [k]: !p[k] }));
              queue({ [k]: !s[k] });
            }}
          >
            <i>{s[k] ? '✓' : ''}</i>
            <span lang={locale}>{m(`wiz.sign.${k}`)}</span>
          </button>
        ))}
        {feeBox}
      </>
    );
  }

  if (step === 5) {
    const codes = missingCodes ?? missingNow;
    body = (
      <>
        <p className="wz-k">{m('wiz.review.kicker')}</p>
        <h2 className="wz-h">
          <Bi {...both('wiz.review.title')} />
        </h2>
        <p className="muted">{m('wiz.review.help')}</p>
        {codes.length ? (
          <div className="banner orange" style={{ margin: '12px 0' }} role="status" data-testid="missing">
            <Flag size={18} color="#2a1d05" aria-hidden />
            <span>
              <b>{m('wiz.review.stillNeeded')}</b> {codes.map((c) => missingLabel(c, locale)).join(' · ')}
            </span>
          </div>
        ) : (
          <div className="banner green" style={{ margin: '12px 0' }} role="status">
            <Check size={18} color="#fff" aria-hidden />
            <span>
              <b>{m('wiz.review.complete')}</b>
            </span>
          </div>
        )}
        <div className="formv embed">{preview}</div>
        <div className="pb" style={{ marginTop: 12 }}>
          <Link className="btn" href="/portal/form" data-action="wiz.form">
            <Eye size={16} aria-hidden /> {m('wiz.review.openFull')}
          </Link>
          <a
            className="btn"
            href={`/${locale === 'ur' ? 'ur/' : ''}portal/form?print=1`}
            target="_blank"
            rel="noreferrer"
            data-action="doc.print"
          >
            <Printer size={16} aria-hidden /> {m('wiz.review.print')}
          </a>
        </div>
      </>
    );
  }

  return (
    <div className="wz">
      <div className="wz-steps" role="tablist" aria-label={m('wiz.pageTitle')}>
        {WIZARD_STEPS.map((w, i) => (
          <button
            key={w.k}
            type="button"
            role="tab"
            aria-selected={i === step}
            className={i < step ? 'd' : i === step ? 'n' : ''}
            data-action="wiz.step"
            onClick={() => void go(i)}
          >
            <i>{i < step ? '✓' : <Ic name={w.icon} size={18} />}</i>
            <b>
              {i + 1}. {msg('en', `membership.wiz.steps.${w.k}`)}
            </b>
            <span lang="ur">{msg('ur', `membership.wiz.steps.${w.k}`)}</span>
          </button>
        ))}
      </div>
      <div className="card wz-body">
        {note && (
          <div
            className={`banner ${note.ok ? 'green' : 'red'}`}
            role={note.ok ? 'status' : 'alert'}
            style={{ marginBottom: 12 }}
          >
            <span>{note.text}</span>
          </div>
        )}
        {body}
      </div>
      <p className="wz-save" role="status" aria-live="polite" data-state={save}>
        {save === 'saving'
          ? m('wiz.saving')
          : save === 'saved'
            ? m('wiz.saved')
            : save === 'error'
              ? m('wiz.saveFailed')
              : ''}
      </p>
      <div className="wz-nav">
        {step > 0 ? (
          <button type="button" className="btn btn-big" data-action="wiz.back" onClick={() => void go(step - 1)}>
            <ArrowLeft size={18} aria-hidden /> <Bi {...both('wiz.back')} />
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="btn btn-big"
          data-action="wiz.save"
          onClick={async () => {
            pending.current = { ...pending.current, form: { ...(pending.current.form ?? {}), step } };
            await flush();
          }}
        >
          <Bi {...both('wiz.save')} />
        </button>
        {step < 5 ? (
          <button
            type="button"
            className="btn btn-primary btn-big"
            data-action="wiz.next"
            onClick={() => void go(step + 1)}
          >
            <Bi {...both('wiz.next')} /> <ArrowRight size={18} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-gold btn-big"
            data-action="wiz.submit"
            disabled={busy === 'submit'}
            onClick={async () => {
              await flush();
              setBusy('submit');
              const r = await submitApplication(locale, app.id);
              setBusy(null);
              if (r && !r.ok) {
                setNote({ ok: false, text: r.message ?? '' });
                if (r.missing) setMissingCodes(r.missing);
              }
            }}
          >
            <Send size={18} aria-hidden /> {busy === 'submit' ? m('wiz.working') : <Bi {...both('wiz.submit')} />}
          </button>
        )}
      </div>
      <SignaturePad
        open={pad}
        text={padText}
        busy={busy === 'ink-sign'}
        onClose={() => setPad(false)}
        onUpload={() => {
          setPad(false);
          inkWhat.current = 'sign';
          inkInput.current?.click();
        }}
        onSave={(b) => void sendInk(b, 'sign', true)}
      />
    </div>
  );
}

function Bi({ en, ur }: { en: string; ur: string }) {
  return (
    <span className="bi">
      <span className="bi-en">{en}</span>
      <span className="bi-ur" lang="ur">
        {ur}
      </span>
    </span>
  );
}

function PartnerRow({
  locale,
  n,
  p,
  fee: cardFee,
  onChange,
  onRemove,
}: {
  locale: Locale;
  n: number;
  p: { name: string; cnic: string | null; mobile: string | null; extra_card: boolean };
  fee: number;
  onChange: (patch: { name?: string; cnic?: string; mobile?: string; extra_card?: boolean }) => void;
  onRemove: () => void;
}) {
  const [v, setV] = useState({ name: p.name, cnic: p.cnic ?? '', mobile: p.mobile ?? '' });
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const m = (k: string, vars?: Record<string, string>) => msg(locale, `membership.wiz.details.${k}`, vars);
  const edit = (k: 'name' | 'cnic' | 'mobile', value: string) => {
    setV((x) => ({ ...x, [k]: value }));
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => onChange({ [k]: value }), 600);
  };
  return (
    <div className="prow">
      <span className="pn">{n}</span>
      <input
        value={v.name}
        placeholder={m('partnerName')}
        aria-label={`${m('partnerName')} ${n}`}
        onChange={(e) => edit('name', e.target.value)}
      />
      <input
        value={v.cnic}
        placeholder={m('partnerCnic')}
        aria-label={`${m('partnerCnic')} ${n}`}
        onChange={(e) => edit('cnic', e.target.value)}
      />
      <input
        value={v.mobile}
        placeholder={m('partnerMobile')}
        aria-label={`${m('partnerMobile')} ${n}`}
        onChange={(e) => edit('mobile', e.target.value)}
      />
      <button
        type="button"
        className={`chip ${p.extra_card ? 'on' : ''}`}
        aria-pressed={p.extra_card}
        title={m('cardTitle', { fee: cardFee.toLocaleString('en-PK') })}
        data-action="wiz.partner.card"
        onClick={() => onChange({ extra_card: !p.extra_card })}
      >
        <Ic name="card" size={14} /> {m('card')}
      </button>
      <button
        type="button"
        className="ib"
        aria-label={m('removePartner', { n: String(n) })}
        data-action="wiz.partner.del"
        onClick={onRemove}
      >
        <Trash2 size={18} color="#ef4444" aria-hidden />
      </button>
    </div>
  );
}
