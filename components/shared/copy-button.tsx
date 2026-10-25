'use client';

import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';

/** cert.share: copies the public verification link (or uses the phone's share sheet) */
export function CopyButton({ text, label, copied }: { text: string; label: string; copied: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-w"
      data-action="cert.share"
      onClick={async () => {
        try {
          if (navigator.share) await navigator.share({ url: text });
          else await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2500);
        } catch {
          // the person closed the share sheet
        }
      }}
    >
      {done ? <Check size={16} aria-hidden /> : <Share2 size={16} aria-hidden />} {done ? copied : label}
    </button>
  );
}
