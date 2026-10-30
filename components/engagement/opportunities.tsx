'use client';

import { Check, Globe, Plus, Send, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import type { Locale } from '@/i18n/routing';
import {
  closeOpportunity,
  decidePost,
  expressInterest,
  postRequirement,
  shareInquiry,
  withdrawInterest,
  withdrawPost,
  type OppResult,
} from '@/lib/opportunities/actions';

export interface Opp {
  id: string;
  kind: 'inquiry' | 'requirement';
  title: string;
  body: string;
  sector: string | null;
  market: string | null;
  status: string;
  expires: string;
  company?: string | null;
  interests?: number;
  mine?: boolean;
  reason?: string | null;
}

type T = (k: string) => string;

function Note({ r }: { r: OppResult | null }) {
  if (!r) return null;
  return (
    <p role={r.ok ? 'status' : 'alert'} className={r.ok ? 'ai-ok' : 'ai-err'} style={{ marginTop: 8 }}>
      {r.message}
    </p>
  );
}

function PostFields({ t, days }: { t: T; days: number }) {
  return (
    <>
      <label className="form-field">
        {t('title')}
        <input name="title" required minLength={5} maxLength={160} />
      </label>
      <label className="form-field">
        {t('details')}
        <textarea name="body" required minLength={10} maxLength={4000} rows={3} />
      </label>
      <div className="gr" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <label className="form-field">
          {t('sector')}
          <input name="sector" maxLength={80} />
        </label>
        <label className="form-field">
          {t('market')}
          <input name="market" maxLength={80} />
        </label>
        <label className="form-field">
          {t('days')}
          <input name="days" type="number" min={1} max={days} defaultValue={30} required />
        </label>
      </div>
    </>
  );
}

function Item({ o, t, children }: { o: Opp; t: T; children?: React.ReactNode }) {
  return (
    <li className="opp" data-opp={o.id} data-status={o.status}>
      <Globe size={20} aria-hidden />
      <div style={{ minWidth: 0, flex: 1 }}>
        <b>{o.title}</b>
        <p className="muted" style={{ margin: '2px 0', whiteSpace: 'pre-wrap' }}>
          {o.body}
        </p>
        <small className="muted">
          {[o.company, o.sector, o.market, `${t('until')} ${o.expires}`].filter(Boolean).join(' · ')}
          {o.interests !== undefined ? ` · ${t('interested')}: ${o.interests}` : ''}
        </small>
        {o.reason && (
          <small className="ai-err" style={{ display: 'block' }}>
            {o.reason}
          </small>
        )}
        {children}
      </div>
    </li>
  );
}

/** Member side (prototype member/opportunities): MCCI inquiries, members' requirements, my posts */
export function MemberOpportunities({
  locale,
  company,
  canAct,
  inquiries,
  requirements,
  mine,
  myInterest,
  t,
}: {
  locale: Locale;
  company: string | null;
  canAct: boolean;
  inquiries: Opp[];
  requirements: Opp[];
  mine: Opp[];
  myInterest: string[];
  t: Record<string, string>;
}) {
  const tr: T = (k) => t[k] ?? k;
  const [note, setNote] = useState<OppResult | null>(null);
  const [posting, setPosting] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [pending, start] = useTransition();
  const run = (f: () => Promise<OppResult>) =>
    start(async () => {
      const r = await f();
      setNote(r);
      if (r.ok) {
        setPosting(false);
        setReply(null);
        setText('');
      }
    });
  const why = !company ? tr('noCompany') : tr('noRight');

  const answer = (o: Opp) =>
    myInterest.includes(o.id) ? (
      <button
        type="button"
        className="btn"
        data-action="opp.unreply"
        disabled={pending || !canAct}
        title={canAct ? undefined : why}
        onClick={() => run(() => withdrawInterest(locale, o.id, company!))}
      >
        <X size={15} aria-hidden /> {tr('withdrawInterest')}
      </button>
    ) : reply === o.id ? (
      <form
        className="opp-reply"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => expressInterest(locale, o.id, company!, text));
        }}
      >
        <label className="sr-only" htmlFor={`r-${o.id}`}>
          {tr('message')}
        </label>
        <textarea
          id={`r-${o.id}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tr('message')}
          rows={2}
          required
          maxLength={4000}
        />
        <button type="submit" className="btn p" data-action="opp.reply.send" disabled={pending || !text.trim()}>
          <Send size={15} aria-hidden /> {tr('send')}
        </button>
      </form>
    ) : (
      <button
        type="button"
        className="btn w"
        data-action="opp.reply"
        disabled={!canAct}
        title={canAct ? undefined : why}
        onClick={() => setReply(o.id)}
      >
        <Check size={15} aria-hidden /> {tr('interestedBtn')}
      </button>
    );

  return (
    <>
      <div className="pb" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className="btn p"
          data-action="opp.post"
          disabled={!canAct}
          title={canAct ? undefined : why}
          onClick={() => setPosting((v) => !v)}
        >
          <Plus size={16} aria-hidden /> {tr('post')}
        </button>
      </div>
      {posting && company && (
        <form
          className="card"
          style={{ display: 'grid', gap: 10, marginBottom: 16 }}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(() => postRequirement(fd));
          }}
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="company" value={company} />
          <p className="muted">{tr('postHelp')}</p>
          <PostFields t={tr} days={90} />
          <div>
            <button type="submit" className="btn p" data-action="opp.post.send" disabled={pending}>
              {tr('submit')}
            </button>
          </div>
        </form>
      )}
      <Note r={note} />
      <div className="gr opp-grid">
        <section className="card" aria-labelledby="op-inq">
          <div className="ch">
            <h3 id="op-inq">{tr('inquiries')}</h3>
          </div>
          <ul className="opp-list">
            {inquiries.length === 0 && <li className="muted">{tr('noneOpen')}</li>}
            {inquiries.map((o) => (
              <Item key={o.id} o={o} t={tr}>
                {answer(o)}
              </Item>
            ))}
          </ul>
          <div className="ch" style={{ marginTop: 18 }}>
            <h3>{tr('requirements')}</h3>
          </div>
          <ul className="opp-list">
            {requirements.length === 0 && <li className="muted">{tr('noneOpen')}</li>}
            {requirements.map((o) => (
              <Item key={o.id} o={o} t={tr}>
                {answer(o)}
              </Item>
            ))}
          </ul>
        </section>
        <section className="card" aria-labelledby="op-mine">
          <div className="ch">
            <h3 id="op-mine">{tr('mine')}</h3>
          </div>
          <ul className="opp-list">
            {mine.length === 0 && <li className="muted">{tr('noneMine')}</li>}
            {mine.map((o) => (
              <Item key={o.id} o={{ ...o, body: o.body }} t={tr}>
                <span className="bd">{tr(`status${o.status}`)}</span>{' '}
                {(o.status === 'Pending' || o.status === 'Published') && (
                  <button
                    type="button"
                    className="btn"
                    data-action="opp.withdraw"
                    disabled={pending || !canAct}
                    title={canAct ? undefined : why}
                    onClick={() => run(() => withdrawPost(locale, o.id))}
                  >
                    {tr('withdraw')}
                  </button>
                )}
              </Item>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

/** Staff side (Website Content): approve or reject members' posts, share MCCI buyer inquiries, close posts */
export function OpportunityDesk({
  locale,
  canEdit,
  pending: waiting,
  open,
  t,
}: {
  locale: Locale;
  canEdit: boolean;
  pending: Opp[];
  open: Opp[];
  t: Record<string, string>;
}) {
  const tr: T = (k) => t[k] ?? k;
  const [note, setNote] = useState<OppResult | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [sharing, setSharing] = useState(false);
  const [busy, start] = useTransition();
  const run = (f: () => Promise<OppResult>) =>
    start(async () => {
      const r = await f();
      setNote(r);
      if (r.ok) setSharing(false);
    });
  const lock = canEdit ? undefined : tr('noRight');
  return (
    <section className="card" aria-labelledby="od-h" style={{ marginTop: 18 }}>
      <div className="ch">
        <h3 id="od-h">{tr('desk')}</h3>
        <button
          type="button"
          className="btn p"
          data-action="opp.share"
          disabled={!canEdit}
          title={lock}
          onClick={() => setSharing((v) => !v)}
        >
          <Plus size={16} aria-hidden /> {tr('share')}
        </button>
      </div>
      {sharing && (
        <form
          style={{ display: 'grid', gap: 10, marginBottom: 14 }}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(() => shareInquiry(fd));
          }}
        >
          <input type="hidden" name="locale" value={locale} />
          <PostFields t={tr} days={180} />
          <div>
            <button type="submit" className="btn p" data-action="opp.share.send" disabled={busy}>
              {tr('submit')}
            </button>
          </div>
        </form>
      )}
      <Note r={note} />
      <h4 style={{ margin: '10px 0' }}>{tr('waiting')}</h4>
      <ul className="opp-list">
        {waiting.length === 0 && <li className="muted">{tr('noneWaiting')}</li>}
        {waiting.map((o) => (
          <Item key={o.id} o={o} t={tr}>
            <div className="pb" style={{ marginTop: 6 }}>
              <button
                type="button"
                className="btn p"
                data-action="opp.publish"
                disabled={busy || !canEdit}
                title={lock}
                onClick={() => run(() => decidePost(locale, o.id, true, ''))}
              >
                {tr('publish')}
              </button>
              <label className="sr-only" htmlFor={`rr-${o.id}`}>
                {tr('reason')}
              </label>
              <input
                id={`rr-${o.id}`}
                placeholder={tr('reason')}
                value={reason[o.id] ?? ''}
                onChange={(e) => setReason({ ...reason, [o.id]: e.target.value })}
                disabled={!canEdit}
              />
              <button
                type="button"
                className="btn"
                data-action="opp.reject"
                disabled={busy || !canEdit || (reason[o.id] ?? '').trim().length < 3}
                title={lock ?? tr('reasonNeeded')}
                onClick={() => run(() => decidePost(locale, o.id, false, reason[o.id] ?? ''))}
              >
                {tr('reject')}
              </button>
            </div>
          </Item>
        ))}
      </ul>
      <h4 style={{ margin: '14px 0 10px' }}>{tr('published')}</h4>
      <ul className="opp-list">
        {open.length === 0 && <li className="muted">{tr('noneOpen')}</li>}
        {open.map((o) => (
          <Item key={o.id} o={o} t={tr}>
            <button
              type="button"
              className="btn"
              data-action="opp.close"
              disabled={busy || !canEdit}
              title={lock}
              onClick={() => run(() => closeOpportunity(locale, o.id))}
            >
              {tr('close')}
            </button>
          </Item>
        ))}
      </ul>
    </section>
  );
}
