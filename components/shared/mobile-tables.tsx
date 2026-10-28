'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Tables become cards on a phone (app/styles/mobile.css): each cell shows its column name as a label. This copies the
 * table head's text into every cell's data-label, on every page and whenever a table's rows change, so all tables
 * (21 of them) get labelled cards without touching each one. Renders nothing.
 */
export function MobileTables() {
  const path = usePathname();
  useEffect(() => {
    const label = () => {
      for (const table of document.querySelectorAll<HTMLTableElement>('.tw table, .mcards table')) {
        const heads = [...table.querySelectorAll('thead th')].map((th) => th.textContent?.trim() ?? '');
        if (!heads.length) continue;
        for (const row of table.querySelectorAll('tbody tr')) {
          [...row.children].forEach((cell, i) => {
            const want = (cell as HTMLTableCellElement).colSpan > 1 ? '' : (heads[i] ?? '');
            if (cell.getAttribute('data-label') !== want) cell.setAttribute('data-label', want);
          });
        }
      }
    };
    label();
    const watch = new MutationObserver(label);
    watch.observe(document.body, { childList: true, subtree: true });
    return () => watch.disconnect();
  }, [path]);
  return null;
}
