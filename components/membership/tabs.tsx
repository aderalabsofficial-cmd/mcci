'use client';

import { type ReactNode, useId, useState } from 'react';

/** Page tabs inside a card (prototype M.tabs: .tabs buttons + .tp panels, action "tab"). */
export function ProtoTabs({ labels, panels }: { labels: ReactNode[]; panels: ReactNode[] }) {
  const [on, setOn] = useState(0);
  const id = useId();
  return (
    <>
      <div className="tabs" role="tablist">
        {labels.map((l, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            id={`${id}-t${i}`}
            aria-selected={i === on}
            aria-controls={`${id}-p${i}`}
            className={i === on ? 'on' : ''}
            data-action="tab"
            onClick={() => setOn(i)}
          >
            {l}
          </button>
        ))}
      </div>
      {panels.map((p, i) => (
        <div
          key={i}
          id={`${id}-p${i}`}
          role="tabpanel"
          aria-labelledby={`${id}-t${i}`}
          className={`tp ${i === on ? 'on' : ''}`}
          hidden={i !== on}
        >
          {p}
        </div>
      ))}
    </>
  );
}
