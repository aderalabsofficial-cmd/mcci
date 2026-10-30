'use client';

import { LifeBuoy, Send, Sparkles } from 'lucide-react';
import { useState, useTransition } from 'react';
import { askAssistant, talkToStaff, type Turn } from '@/lib/assistant/actions';

/** Ask MCCI AI chat (prototype M.chatUI): question box, answers, and "Talk to staff" for a person to take over. */
export function AssistantChat({
  locale,
  initial,
  enabled,
  t,
}: {
  locale: string;
  initial: Turn[];
  enabled: boolean;
  t: Record<'placeholder' | 'send' | 'working' | 'talk' | 'you' | 'ai' | 'empty' | 'off' | 'disclaimer', string>;
}) {
  const [turns, setTurns] = useState<Turn[]>(initial);
  const [q, setQ] = useState('');
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const last = [...turns].reverse().find((x) => x.role === 'user')?.text ?? '';
  const forStaff = q.trim() || last;

  const ask = () =>
    start(async () => {
      setNote(null);
      const r = await askAssistant(locale, q);
      if (r.ok && r.turns) {
        setTurns(r.turns);
        setQ('');
      } else setNote({ ok: false, text: r.message ?? '' });
    });
  const escalate = () =>
    start(async () => {
      const r = await talkToStaff(locale, forStaff);
      setNote({ ok: r.ok, text: r.message ?? '' });
    });

  return (
    <div className="ai-chat">
      {!enabled && (
        <p className="ai-note" role="status">
          {t.off}
        </p>
      )}
      <ol className="ai-log" aria-live="polite">
        {turns.length === 0 && <li className="muted">{t.empty}</li>}
        {turns.map((x, i) => (
          <li key={i} className={x.role === 'user' ? 'ai-me' : 'ai-bot'} data-role={x.role}>
            <small>{x.role === 'user' ? t.you : t.ai}</small>
            <p dir="auto">{x.text}</p>
          </li>
        ))}
      </ol>
      <form
        className="ai-ask"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim().length > 1) ask();
        }}
      >
        <label className="sr-only" htmlFor="ai-q">
          {t.placeholder}
        </label>
        <textarea
          id="ai-q"
          dir="auto"
          value={q}
          maxLength={600}
          rows={2}
          placeholder={t.placeholder}
          onChange={(e) => setQ(e.target.value)}
          disabled={pending}
        />
        <button
          type="submit"
          className="btn p"
          data-action="ai.ask"
          disabled={!enabled || pending || q.trim().length < 2}
          title={!enabled ? t.off : q.trim().length < 2 ? t.placeholder : undefined}
        >
          {pending ? t.working : t.send} <Send size={16} aria-hidden />
        </button>
      </form>
      <div className="ai-foot">
        <small className="muted">
          <Sparkles size={13} aria-hidden /> {t.disclaimer}
        </small>
        <button
          type="button"
          className="btn"
          data-action="ai.staff"
          disabled={pending || forStaff.length < 5}
          title={forStaff.length < 5 ? t.placeholder : undefined}
          onClick={escalate}
        >
          <LifeBuoy size={16} aria-hidden /> {t.talk}
        </button>
      </div>
      {note && (
        <p role={note.ok ? 'status' : 'alert'} className={note.ok ? 'ai-ok' : 'ai-err'}>
          {note.text}
        </p>
      )}
    </div>
  );
}
