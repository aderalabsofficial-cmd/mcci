'use client';

import { Printer } from 'lucide-react';
import { useEffect } from 'react';

/** "Print / save PDF" (action doc.print for the form): the browser prints the 4-page form with its print styles. */
export function PrintButton({ label, auto = false }: { label: string; auto?: boolean }) {
  useEffect(() => {
    if (auto) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [auto]);
  return (
    <button type="button" className="btn btn-primary" data-action="doc.print" onClick={() => window.print()}>
      <Printer size={16} aria-hidden /> {label}
    </button>
  );
}
