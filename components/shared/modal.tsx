'use client';

import { XIcon } from 'lucide-react';
import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The prototype's modal (`.md`): title, optional intro, body, a footer row of buttons. Radix Dialog gives focus
 * trapping, Escape to close and the dialog role; on phones it becomes a bottom sheet (docs/15-mobile-app.md §5).
 */
export function Modal({
  open,
  onOpenChange,
  title,
  intro,
  closeLabel,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  intro?: string;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(7,26,58,.55)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed z-50 grid max-h-[92svh] w-full gap-4 overflow-y-auto border border-line bg-card p-[var(--card-pad)] text-ink shadow-[var(--sh)] outline-none',
            'max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-[18px] max-sm:pb-[calc(var(--card-pad)+env(safe-area-inset-bottom))]',
            'sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[var(--card-radius)]',
            wide ? 'sm:max-w-[640px]' : 'sm:max-w-[520px]',
          )}
          {...(intro ? {} : { 'aria-describedby': undefined })}
        >
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-[length:var(--section-title)] leading-snug font-bold">{title}</Dialog.Title>
            <Dialog.Close
              className="-m-2 grid size-[var(--tap)] shrink-0 place-items-center rounded-[10px] text-muted hover:bg-hover"
              aria-label={closeLabel}
            >
              <XIcon className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          {intro && <Dialog.Description className="-mt-2 text-[14px] text-muted">{intro}</Dialog.Description>}
          {children}
          {footer && <div className="flex flex-wrap justify-end gap-2.5 pt-1">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Small status line under a form (`role=alert` for errors, `status` for success). */
export function FormMessage({ result }: { result: { ok: boolean; message: string } | null }) {
  if (!result) return null;
  return (
    <p
      role={result.ok ? 'status' : 'alert'}
      className={cn(
        'rounded-[10px] border px-3 py-2 text-[14px]',
        result.ok ? 'border-[#bfe8d6] bg-[#e9f8f1] text-[#0f5b3c]' : 'border-[#f3c7c7] bg-[#fdecec] text-[#9b1c1c]',
      )}
    >
      {result.message}
    </p>
  );
}
