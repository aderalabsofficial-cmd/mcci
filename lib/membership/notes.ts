import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';

export interface PortalNote {
  title: string;
  body: string;
  template?: string | null;
  vars?: unknown;
}

/**
 * A portal message in the reader's language: rows written with a template key (migration 0330 on) are rendered
 * from messages/*.json `notify.<template>.t / .b` with their vars; older rows show their stored English text.
 */
export function noteText(locale: Locale, n: PortalNote): { title: string; body: string } {
  if (n.template) {
    const vars = Object.fromEntries(
      Object.entries((n.vars ?? {}) as Record<string, unknown>).map(([k, v]) => [k, String(v ?? '')]),
    );
    try {
      return { title: msg(locale, `notify.${n.template}.t`, vars), body: msg(locale, `notify.${n.template}.b`, vars) };
    } catch {
      // a template this version does not know yet: the stored text
    }
  }
  return { title: n.title, body: n.body };
}
