'use client';

import { createContext, type ReactNode, useContext, useState } from 'react';

export interface FlashMessage {
  ok: boolean;
  message: string;
}

const Ctx = createContext<(m: FlashMessage | null) => void>(() => {});

/**
 * Page-level result banner for staff actions. It sits above the page content and stays mounted when the page refreshes,
 * so a confirmation stays visible even when the row it came from leaves the list.
 */
export function FlashProvider({ children }: { children: ReactNode }) {
  const [note, setNote] = useState<FlashMessage | null>(null);
  return (
    <Ctx.Provider value={setNote}>
      {note && (
        <div
          className={`banner ${note.ok ? 'green' : 'red'}`}
          role={note.ok ? 'status' : 'alert'}
          style={{ marginBottom: 14 }}
          data-flash
        >
          <span>{note.message}</span>
        </div>
      )}
      {children}
    </Ctx.Provider>
  );
}

export const useFlash = () => useContext(Ctx);
