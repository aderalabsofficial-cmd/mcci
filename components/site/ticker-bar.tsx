'use client';

import { Megaphone, Pause, Play } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { Link } from '@/i18n/navigation';

export type TickerItem = { id: string; title: string; category: string | null };

/** seconds per character of text, so a long list runs at the same reading speed as a short one */
const SPEED = 0.2;

/**
 * The moving bar: two copies of the list run end to end so the loop has no gap; only the first is read out and
 * reachable by keyboard. Hover, keyboard focus or the pause button stops it (WCAG 2.2.2); with reduced motion it
 * does not move at all and scrolls by hand instead (site.css).
 */
export function TickerBar({
  items,
  text,
}: {
  items: TickerItem[];
  text: { label: string; latest: string; all: string; pause: string; play: string };
}) {
  const [paused, setPaused] = useState(false);
  const chars = items.reduce((n, i) => n + i.title.length + (i.category?.length ?? 0), 0);
  const duration = Math.max(24, Math.round(chars * SPEED));
  const list = (copy: boolean) => (
    <ul className="tk-list" aria-hidden={copy || undefined}>
      {items.map((i) => (
        <li key={i.id}>
          <Link
            href={`/news?post=${i.id}#post`}
            tabIndex={copy ? -1 : undefined}
            data-action="ticker.post"
            data-post={i.id}
          >
            {i.category && <b>{i.category}</b>}
            <span>{i.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <section className="news-ticker" aria-label={text.label} data-ticker data-paused={paused || undefined}>
      <Link href="/news#latest" className="tk-label" data-action="ticker.all" aria-label={text.all}>
        <Megaphone size={15} aria-hidden />
        <span>{text.latest}</span>
      </Link>
      <div className="tk-track">
        <div className="tk-run" style={{ '--tk-dur': `${duration}s` } as CSSProperties}>
          {list(false)}
          {list(true)}
        </div>
      </div>
      <button
        type="button"
        className="tk-btn"
        aria-pressed={paused}
        aria-label={paused ? text.play : text.pause}
        title={paused ? text.play : text.pause}
        data-action="ticker.pause"
        onClick={() => setPaused((p) => !p)}
      >
        {paused ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
      </button>
    </section>
  );
}
