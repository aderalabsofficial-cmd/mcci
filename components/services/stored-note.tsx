'use client';

import { useEffect, useState } from 'react';

/** the outcome of the step that brought the person here (e.g. "Request … submitted"), carried across the navigation */
export function StoredNote() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('mcci.svc.note');
      if (saved) {
        sessionStorage.removeItem('mcci.svc.note');
        setText(saved);
      }
    } catch {}
  }, []);
  if (!text) return null;
  return (
    <div className="banner green" role="status" data-outcome="ok" style={{ marginBottom: 12 }}>
      {text}
    </div>
  );
}
