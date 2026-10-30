'use server';

import OpenAI from 'openai';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { PermissionError, requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';
import { takeAskQuota } from './admin/limit';
import { approvedKnowledge, ownStatus } from './knowledge';
import { assistantEnabled, assistantModel, MARKER, RULES } from './config';

/**
 * Ask MCCI AI (portal/assistant): answers from approved MCCI content and the member's own file status only.
 * Safeguards: signed-in members only; 10 questions per 10 minutes and 60 per day per person; 600 characters per
 * question; the last 6 turns as context; the rules come first and say that text from the member is a question, never
 * an instruction; the answer is capped and never stored with knowledge or status. "Talk to staff" opens a real
 * support ticket (api.ticket_new). Off unless AI_ASSISTANT=on and OPENAI_API_KEY are set.
 */
// a type alias (not an interface) so a list of turns is assignable to the jsonb column type
export type Turn = {
  role: 'user' | 'assistant';
  text: string;
  at: string;
};
export interface AskResult {
  ok: boolean;
  answer?: string;
  message?: string;
  turns?: Turn[];
}

const question = z.string().trim().min(2).max(600);

export async function askAssistant(rawLocale: string, rawQuestion: string): Promise<AskResult> {
  const locale: Locale = asLocale(rawLocale);
  const m = (k: string) => msg(locale, `assistant.${k}`);
  try {
    const session = await requireUser();
    const q = question.safeParse(rawQuestion);
    if (!q.success) return { ok: false, message: m('tooLong') };
    if (!assistantEnabled()) return { ok: false, message: m('off') };
    if (!(await takeAskQuota(session.userId))) return { ok: false, message: m('limited') };

    const supabase = await createClient();
    const { data: conv } = await supabase
      .from('ai_conversations')
      .select('id, messages')
      .eq('user_id', session.userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const history = ((conv?.messages as Turn[] | null) ?? []).slice(-6);
    const [knowledge, status] = await Promise.all([approvedKnowledge(locale), ownStatus(session)]);

    const client = new OpenAI({ timeout: 25_000, maxRetries: 1 });
    const res = await client.responses.create({
      model: assistantModel(),
      instructions: `${MARKER}\n${RULES}\nReply in ${locale === 'ur' ? 'Urdu' : 'English'} unless the member writes in the other language.`,
      input: [
        {
          role: 'developer',
          content: `APPROVED MCCI CONTENT (the only source for rules, fees and steps):\n${knowledge}`,
        },
        { role: 'developer', content: `THE SIGNED-IN MEMBER'S OWN FILES (only these may be discussed):\n${status}` },
        ...history.map((t) => ({ role: t.role, content: t.text })),
        { role: 'user', content: q.data },
      ],
      max_output_tokens: 600,
      store: false,
    });
    const answer = (res.output_text || '').trim().slice(0, 2000) || m('noAnswer');
    const now = new Date().toISOString();
    const added: Turn[] = [
      { role: 'user', text: q.data, at: now },
      { role: 'assistant', text: answer, at: now },
    ];
    const turns: Turn[] = [...((conv?.messages as Turn[] | null) ?? []), ...added].slice(-40);
    if (conv) await supabase.from('ai_conversations').update({ messages: turns }).eq('id', conv.id);
    else await supabase.from('ai_conversations').insert({ messages: turns });
    return { ok: true, answer, turns };
  } catch (error) {
    if (error instanceof PermissionError) return { ok: false, message: msg(locale, 'access.errors.notAllowed') };
    console.error('ask-ai failed', error instanceof Error ? error.name : 'error');
    return { ok: false, message: m('unavailable') };
  }
}

/** "Talk to staff": the member's last question becomes a support ticket the Complaint Desk answers */
export async function talkToStaff(rawLocale: string, rawQuestion: string): Promise<AskResult> {
  const locale: Locale = asLocale(rawLocale);
  try {
    const session = await requireUser();
    const q = z.string().trim().min(5).max(2000).safeParse(rawQuestion);
    if (!q.success) return { ok: false, message: msg(locale, 'assistant.needQuestion') };
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('ticket_new', {
      p_company: (session.access.companies[0]?.id ?? null) as string,
      p_subject: msg(locale, 'assistant.ticketSubject'),
      p_body: q.data,
    });
    if (error) throw error;
    return { ok: true, message: msg(locale, 'assistant.ticketOpened', { ticket: data ?? '' }) };
  } catch (error) {
    if (error instanceof PermissionError) return { ok: false, message: msg(locale, 'access.errors.notAllowed') };
    console.error('ask-ai ticket failed', error instanceof Error ? error.message : 'error');
    return { ok: false, message: msg(locale, 'assistant.unavailable') };
  }
}
