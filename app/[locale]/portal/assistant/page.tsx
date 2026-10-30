import { Award, Clock, FilePlus, QrCode } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { both, L } from '@/components/membership/ui';
import { AssistantChat } from '@/components/portal/assistant-chat';
import { asLocale } from '@/i18n/locale';
import type { Turn } from '@/lib/assistant/actions';
import { assistantEnabled } from '@/lib/assistant/config';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.assistant') };
}

export const dynamic = 'force-dynamic';

/** Ask MCCI AI (prototype member/assistant): chat from approved MCCI content and the member's own files. */
export default async function AssistantPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const m = (k: string) => msg(locale, `assistant.${k}`);
  const supabase = await createClient();
  const { data: conv } = await supabase
    .from('ai_conversations')
    .select('messages')
    .eq('user_id', session.userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const help = [
    [Award, 'help1', 'help1s'],
    [FilePlus, 'help2', 'help2s'],
    [Clock, 'help3', 'help3s'],
    [QrCode, 'help4', 'help4s'],
  ] as const;
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>
            <L {...both('assistant.title')} />
          </h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <div className="gr ai-grid">
        <section className="card" aria-labelledby="ai-h">
          <div className="ch">
            <h3 id="ai-h">{m('chat')}</h3>
          </div>
          <AssistantChat
            locale={locale}
            enabled={assistantEnabled()}
            initial={((conv?.messages as Turn[] | null) ?? []).slice(-20)}
            t={{
              placeholder: m('placeholder'),
              send: m('send'),
              working: m('working'),
              talk: m('talk'),
              you: m('you'),
              ai: m('ai'),
              empty: m('empty'),
              off: m('off'),
              disclaimer: m('disclaimer'),
            }}
          />
        </section>
        <section className="card" aria-labelledby="ai-can">
          <div className="ch">
            <h3 id="ai-can">{m('canHelp')}</h3>
          </div>
          <ul className="ai-help">
            {help.map(([Icon, k, s]) => (
              <li key={k}>
                <Icon size={20} aria-hidden />
                <span>
                  <b>{m(k)}</b>
                  <small>{m(s)}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
