'use client';

import { Check, Clock, Mail, Search, Send, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import {
  type Candidate,
  listCandidates,
  remindEndorser,
  requestEndorsement,
  withdrawEndorsement,
} from '@/lib/endorse/actions';
import { msg } from '@/lib/nav/model';

/**
 * Proposer & seconder slots for the applicant (prototype M.endorseSlots; wizard step 4 and the application page),
 * with the member picker (end.pick → end.compose), reminder and withdraw. Eligibility is decided by the database;
 * ineligible members are shown greyed with the reason.
 */

export interface SlotEndorsement {
  id: string;
  role: 'proposer' | 'seconder';
  status: 'Pending' | 'Approved' | 'Declined' | 'Expired' | 'Withdrawn';
  member_no: string;
  company: string;
  rep: string;
  requested_at: string;
  expires_at: string;
  decided_at: string | null;
  decline_reason: string | null;
  ref: string | null;
  reminders: number;
  signatureUrl: string | null;
}

const ROLES = ['proposer', 'seconder'] as const;

export function EndorseSlots({
  locale,
  appId,
  items,
  editable,
  cls,
  business,
  applicant,
  days,
  maxPerYear,
}: {
  locale: Locale;
  appId: string;
  items: SlotEndorsement[];
  editable: boolean;
  cls: string;
  business: string;
  applicant: string;
  days: number;
  maxPerYear: number;
}) {
  const m = (k: string, v?: Record<string, string>) => msg(locale, `endorse.${k}`, v);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pick, setPick] = useState<(typeof ROLES)[number] | null>(null);
  const [q, setQ] = useState('');
  const [list, setList] = useState<Candidate[] | null>(null);
  const [chosen, setChosen] = useState<Candidate | null>(null);
  const [text, setText] = useState('');
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
    });

  useEffect(() => {
    if (!pick) return;
    setList(null);
    const t = setTimeout(() => void listCandidates(locale, appId, pick, q).then(setList), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [pick, q, appId, locale]);

  const run = async (key: string, fn: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(key);
    const r = await fn();
    setBusy(null);
    setNote(r);
    if (r.ok) startTransition(() => router.refresh());
    return r;
  };

  const open = (role: (typeof ROLES)[number]) => {
    setNote(null);
    setChosen(null);
    setQ('');
    setPick(role);
  };

  // latest request per role: a live one if any, else the most recent
  const current = (role: string) =>
    items.find((e) => e.role === role && (e.status === 'Pending' || e.status === 'Approved')) ??
    items.find((e) => e.role === role) ??
    null;

  return (
    <>
      {note && (
        <div
          className={`banner ${note.ok ? 'green' : 'red'}`}
          role={note.ok ? 'status' : 'alert'}
          style={{ marginBottom: 12 }}
        >
          <span>{note.message}</span>
        </div>
      )}
      <div className="g2c">
        {ROLES.map((role) => {
          const x = current(role);
          const s = x?.status ?? 'Empty';
          const head = (
            <h3>
              <span className="bi">
                <span className="bi-en">{msg('en', `endorse.slots.${role}`)}</span>
                <span className="bi-ur" lang="ur">
                  {msg('ur', `endorse.slots.${role}`)}
                </span>
              </span>
            </h3>
          );
          const chooseBtn = (label: string) =>
            editable ? (
              <div className="pb" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-big"
                  data-action="end.pick"
                  onClick={() => open(role)}
                >
                  <Search size={18} aria-hidden /> {label}
                </button>
              </div>
            ) : null;
          if (!x || s === 'Withdrawn') {
            return (
              <div className="pcard" key={role} data-role={role}>
                {head}
                <p className="muted">{m('slots.empty')}</p>
                {chooseBtn(m('slots.choose'))}
              </div>
            );
          }
          const who = (
            <div className={`found ${s === 'Approved' ? '' : 'pend'}`}>
              {s === 'Approved' ? (
                <Check size={22} color="#1fa34a" aria-hidden />
              ) : s === 'Pending' ? (
                <Clock size={22} color="#f59e0b" aria-hidden />
              ) : (
                <X size={22} color="#ef4444" aria-hidden />
              )}
              <div>
                <b>{x.rep}</b>
                <small>
                  {x.company} · {x.member_no}
                </small>
              </div>
              <span className={`bd ${s === 'Approved' ? 'green' : s === 'Pending' ? 'orange' : 'red'}`}>
                {m(`slots.status.${s}`)}
              </span>
            </div>
          );
          const daysLeft = Math.max(0, Math.ceil((new Date(x.expires_at).getTime() - Date.now()) / 86_400_000));
          return (
            <div
              className={`pcard ${s === 'Approved' ? 'ok' : s === 'Pending' ? '' : 'bad'}`}
              key={role}
              data-role={role}
            >
              {head}
              {who}
              {s === 'Approved' && (
                <div className="esig">
                  {x.signatureUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- signed URL of a private file
                    <img src={x.signatureUrl} alt={m('inbox.yourSignature')} />
                  )}
                  <small>{m('slots.signed', { date: x.decided_at ? date(x.decided_at) : '', ref: x.ref ?? '' })}</small>
                </div>
              )}
              {s === 'Pending' && (
                <>
                  <p className="muted">
                    {m('slots.sent', { date: date(x.requested_at), days: String(daysLeft) })}
                    {x.reminders ? ` · ${m('slots.reminders', { n: String(x.reminders) })}` : ''}
                  </p>
                  <div className="pb" style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="btn btn-w"
                      data-action="end.remind"
                      disabled={busy === `r-${x.id}`}
                      onClick={() => void run(`r-${x.id}`, () => remindEndorser(locale, x.id))}
                    >
                      <Mail size={16} aria-hidden /> {m('slots.remind')}
                    </button>
                    {editable && (
                      <button
                        type="button"
                        className="btn btn-w"
                        data-action="end.withdraw"
                        disabled={busy === `w-${x.id}`}
                        onClick={() => void run(`w-${x.id}`, () => withdrawEndorsement(locale, x.id))}
                      >
                        {m('slots.withdraw')}
                      </button>
                    )}
                  </div>
                </>
              )}
              {(s === 'Declined' || s === 'Expired') && (
                <>
                  <p className="err">
                    {s === 'Declined' ? m('slots.declined', { reason: x.decline_reason ?? '' }) : m('slots.expired')}
                  </p>
                  {chooseBtn(m('slots.chooseAnother'))}
                </>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        open={Boolean(pick)}
        onOpenChange={(o) => !o && setPick(null)}
        wide
        title={
          chosen
            ? m('picker.compose', { name: chosen.rep })
            : m('picker.title', { role: pick ? m(`roles.${pick}`).toLowerCase() : '' })
        }
        closeLabel={msg(locale, 'common.close')}
        footer={
          chosen && pick ? (
            <>
              <button type="button" className="btn" data-action="end.pick" onClick={() => setChosen(null)}>
                {m('picker.back')}
              </button>
              <button
                type="button"
                className="btn btn-gold"
                data-action="end.compose"
                disabled={busy === 'send'}
                onClick={async () => {
                  const r = await run('send', () => requestEndorsement(locale, appId, pick, chosen.member_id, text));
                  if (r.ok) setPick(null);
                }}
              >
                <Send size={16} aria-hidden /> {m('picker.send')}
              </button>
            </>
          ) : undefined
        }
      >
        <div className="proto">
          {chosen && pick ? (
            <>
              <div className="kv">
                <div>
                  <small>{m('picker.member')}</small>
                  <b>{chosen.rep}</b>
                </div>
                <div>
                  <small>{m('picker.business')}</small>
                  <b>{chosen.company}</b>
                </div>
                <div>
                  <small>{m('picker.no')}</small>
                  <b>{chosen.member_no}</b>
                </div>
                <div>
                  <small>{m('picker.asYour')}</small>
                  <b>{m(`roles.${pick}`)}</b>
                </div>
              </div>
              <label className="jf full" style={{ marginTop: 14, display: 'block' }}>
                {m('picker.note')}
                <textarea
                  rows={3}
                  style={{ width: '100%' }}
                  value={text}
                  maxLength={1000}
                  onChange={(e) => setText(e.target.value)}
                />
              </label>
              <p className="muted" style={{ marginTop: 10 }}>
                {m('picker.after', { days: String(days) })}
              </p>
              {note && !note.ok && (
                <p role="alert" className="err">
                  {note.message}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="muted">{m('picker.intro', { cls })}</p>
              <div className="nat-search" style={{ margin: '12px 0' }}>
                <Search size={18} aria-hidden />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={m('picker.search')}
                  aria-label={m('picker.search')}
                  autoComplete="off"
                />
              </div>
              <div className="elist">
                {list === null && <p className="muted">{m('picker.loading')}</p>}
                {list?.length === 0 && <p className="muted">{m('picker.none')}</p>}
                {list?.map((c) => (
                  <div className={`ecard ${c.why ? 'off' : ''}`} key={c.member_id} data-member={c.member_no}>
                    <div className="eav">
                      {c.rep
                        .split(/\s+/)
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="ebx">
                      <b>{c.rep}</b>
                      <small>
                        {c.company} · {c.member_no}
                      </small>
                      <small>
                        {msg(locale, `membership.classes.${c.class}`)}
                        {c.sector ? ` · ${c.sector}` : ''} ·{' '}
                        {m('picker.count', { n: String(c.year_count), max: String(maxPerYear) })}
                      </small>
                      {c.why ? (
                        <em>{c.why}</em>
                      ) : c.same_sector ? (
                        <i className="same">{m('picker.sameSector')}</i>
                      ) : null}
                    </div>
                    {c.why ? (
                      <button type="button" className="btn btn-w" disabled title={c.why}>
                        {m('picker.notEligible')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-w"
                        data-action="end.compose"
                        onClick={() => {
                          setChosen(c);
                          setText(
                            m('picker.noteDefault', {
                              business: business || '—',
                              role: m(`roles.${pick}`).toLowerCase(),
                              name: applicant,
                            }),
                          );
                        }}
                      >
                        {m('picker.select')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
