'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** the lobby board reloads its figures on its own (a server refresh, no full page load), only while the tab is visible */
export function LiveRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
