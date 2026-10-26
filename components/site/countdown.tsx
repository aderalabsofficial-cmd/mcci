'use client';

import { useEffect, useState } from 'react';

const parts = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
};

/** the Urdu launch countdown (prototype launch()): days, hours, minutes, seconds to settings.site.launchAt */
export function Countdown({ at, labels }: { at: string; labels: { d: string; h: string; m: string; s: string } }) {
  const target = Date.parse(at);
  const [left, setLeft] = useState<ReturnType<typeof parts> | null>(null);
  useEffect(() => {
    const tick = () => setLeft(parts(target - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [target]);
  return (
    <div className="lch" role="timer" aria-live="off">
      {(['d', 'h', 'm', 's'] as const).map((u) => (
        <div key={u}>
          <b>{left ? String(left[u]).padStart(2, '0') : '--'}</b>
          <small>{labels[u]}</small>
        </div>
      ))}
    </div>
  );
}
