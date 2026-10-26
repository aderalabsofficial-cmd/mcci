'use client';

import { FileText } from 'lucide-react';
import { useState } from 'react';

export interface DocRow {
  key: string;
  label: string;
  ur: string;
  required: boolean;
}

/** pub.biz: the document list for the chosen business type (prototype tabs + .doclist) */
export function DocsByType({
  types,
  lists,
  ifApplicable,
  note,
  label,
}: {
  types: { k: string; name: string }[];
  lists: Record<string, DocRow[]>;
  ifApplicable: string;
  note: string;
  label: string;
}) {
  const [cur, setCur] = useState(types[0]?.k ?? 'prop');
  return (
    <>
      <div className="tabs" role="tablist" aria-label={label} style={{ justifyContent: 'center' }}>
        {types.map((t) => (
          <button
            key={t.k}
            type="button"
            role="tab"
            aria-selected={cur === t.k}
            className={cur === t.k ? 'on' : ''}
            data-action="pub.biz"
            onClick={() => setCur(t.k)}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="card" role="tabpanel" style={{ maxWidth: 820, margin: 'auto' }} data-biz={cur}>
        <ol className="doclist">
          {(lists[cur] ?? []).map((d) => (
            <li key={d.key}>
              <FileText size={18} color="#3b82f6" aria-hidden />
              <span>
                {d.label}
                {d.ur ? (
                  <small lang="ur" className="muted" style={{ marginInlineStart: 8 }}>
                    {d.ur}
                  </small>
                ) : null}
                {d.required ? '' : <small className="opt"> · {ifApplicable}</small>}
              </span>
            </li>
          ))}
        </ol>
        <p className="muted" style={{ marginTop: 12 }}>
          {note}
        </p>
      </div>
    </>
  );
}

/** faq.toggle: questions that open their answer (prototype M.faq) */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div style={{ maxWidth: 760, margin: 'auto' }}>
      {items.map((f, i) => (
        <button
          key={f.q}
          type="button"
          className="fq"
          aria-expanded={open === i}
          data-action="faq.toggle"
          onClick={() => setOpen(open === i ? null : i)}
        >
          <b>{f.q}</b>
          <p>{f.a}</p>
        </button>
      ))}
    </div>
  );
}
