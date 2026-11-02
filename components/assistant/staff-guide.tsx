'use client';

import { ArrowRight, Send, Sparkles } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { askStaffGuide, type GuideAnswer } from '@/lib/assistant/staff-actions';
import { callAction } from '@/lib/client/call-action';
import { msg } from '@/lib/nav/model';

const SUGGESTIONS = ['voter', 'expense', 'restore', 'permission', 'whatsapp', 'post'] as const;

/** Type a question or tap a common one; the answer links straight to the screen. */
export function StaffGuide({ locale }: { locale: Locale }) {
  const t = (k: string) => msg(locale, `staffHelp.${k}`);
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<GuideAnswer | null>(null);
  const [pending, start] = useTransition();
  const ask = (text: string) =>
    start(async () => {
      const r = await callAction(locale, async () => {
        const res = await askStaffGuide(locale, text);
        return { ...res, message: res.message ?? '' };
      });
      setAnswer(r as GuideAnswer);
    });
  return (
    <div className="proto" data-section="staff-guide">
      <div className="ph">
        <div>
          <h1>{t('title')}</h1>
          <p>{t('sub')}</p>
        </div>
      </div>
      <section className="card">
        <form
          className="guide-ask"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim().length >= 2) ask(q);
          }}
        >
          <label className="form-field">
            {t('ask')}
            <input value={q} maxLength={600} dir="auto" placeholder={t('hint')} data-field="guide-question" onChange={(e) => setQ(e.target.value)} />
          </label>
          <button className="btn btn-primary" disabled={pending || q.trim().length < 2} title={pending ? t('working') : q.trim().length < 2 ? t('hint') : undefined} data-action="guide.ask">
            <Send size={15} aria-hidden /> {t('send')}
          </button>
        </form>
        <div className="pb guide-suggest">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="btn btn-w"
              disabled={pending}
              data-action="guide.suggest"
              data-suggest={s}
              onClick={() => {
                const text = t(`items.${s}.question`);
                setQ(text);
                ask(text);
              }}
            >
              {t(`items.${s}.question`)}
            </button>
          ))}
        </div>
      </section>
      {answer && (
        <section className="card" aria-live="polite" data-guide-answer data-ai={answer.ai ?? false}>
          {answer.ok ? (
            <>
              <p dir="auto">
                {answer.ai && <Sparkles size={15} aria-hidden />} {answer.answer}
              </p>
              {(answer.links ?? []).map((l) => (
                <div className="li st guide-link" key={l.href} data-guide-link={l.href}>
                  <div style={{ flex: 1 }}>
                    <b>{l.title}</b>
                    <small>{l.how}</small>
                  </div>
                  <Link className="btn btn-primary" href={l.href} data-action="guide.open">
                    {t('open')} <ArrowRight size={15} aria-hidden />
                  </Link>
                </div>
              ))}
            </>
          ) : (
            <p className="banner red" role="alert">
              {answer.message}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
