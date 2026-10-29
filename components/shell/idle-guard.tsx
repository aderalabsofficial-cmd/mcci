'use client';

import { Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/shared/modal';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { endIdle, keepAlive } from '@/lib/session/actions';

const KEY = 'mcci.lastActive';
const WARN_MS = 60_000; // the warning shows in the last minute
const PING_MS = 4 * 60_000; // while the person is busy on one page, tell the server at most every 4 minutes

const shared = () => {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
};

/**
 * Sign-out after 15 minutes without activity in the browser (owner's request, 26 Oct 2026). Typing, clicking, scrolling
 * and touching count, in any open tab of MCCI Digital (shared through localStorage). While someone works on one page,
 * the server hears about it every few minutes (keepAlive), so its own 15-minute rule (middleware) agrees. In the last
 * minute a dialog offers "Stay signed in"; at the limit the session is signed out and the sign-in page says why.
 */
export function IdleGuard({
  locale,
  idleMs,
  loginPath = '/login',
}: {
  locale: Locale;
  idleMs: number;
  /** where the person signs in again: the members' page, or the staff sign-in page in the admin panel */
  loginPath?: string;
}) {
  const last = useRef(Date.now());
  const pinged = useRef(Date.now());
  const [left, setLeft] = useState<number | null>(null);
  const ending = useRef(false);

  useEffect(() => {
    const mark = () => {
      const now = Date.now();
      if (now - last.current < 5_000) return;
      last.current = now;
      try {
        localStorage.setItem(KEY, String(now));
      } catch {}
    };
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;
    events.forEach((e) => window.addEventListener(e, mark, { passive: true, capture: true }));
    mark();
    const tick = setInterval(async () => {
      if (ending.current) return;
      const active = Math.max(last.current, shared());
      const now = Date.now();
      const idle = now - active;
      if (idle >= idleMs) {
        ending.current = true;
        try {
          await endIdle();
        } catch {}
        const here = window.location.pathname.replace(/^\/ur(?=\/|$)/, '') || '/';
        window.location.assign(
          `${locale === 'ur' ? '/ur' : ''}${loginPath}?expired=1&next=${encodeURIComponent(here)}`,
        );
        return;
      }
      setLeft(idle >= idleMs - WARN_MS ? Math.ceil((idleMs - idle) / 1000) : null);
      // activity since the server last heard from this page: tell it
      if (active > pinged.current && now - pinged.current >= PING_MS) {
        pinged.current = now;
        try {
          await keepAlive();
        } catch {}
      }
    }, 1_000);
    return () => {
      clearInterval(tick);
      events.forEach((e) => window.removeEventListener(e, mark, { capture: true }));
    };
  }, [idleMs, locale, loginPath]);

  const stay = async () => {
    last.current = Date.now();
    pinged.current = Date.now();
    try {
      localStorage.setItem(KEY, String(last.current));
    } catch {}
    setLeft(null);
    try {
      await keepAlive();
    } catch {}
  };

  return (
    <Modal
      open={left !== null}
      onOpenChange={(o) => !o && void stay()}
      title={msg(locale, 'auth.idle.warn', { s: String(left ?? 0) })}
      intro={msg(locale, 'auth.idle.help')}
      closeLabel={msg(locale, 'common.close')}
    >
      <div className="flex justify-end" data-idle-warning>
        <button type="button" className="btn btn-primary" data-action="session.stay" onClick={() => void stay()}>
          <Clock size={16} aria-hidden /> {msg(locale, 'auth.idle.stay')}
        </button>
      </div>
    </Modal>
  );
}
