import { MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import { isConsented, STATUS_TONE, type MyWhatsapp } from '@/lib/whatsapp/consent';

/**
 * Member home: the WhatsApp card (owner's brief, 6 Nov 2026). Never blocks anything; it says where the member stands
 * and opens WhatsApp Preferences. Shown to every company user, whether or not MCCI has opened consent (decision A).
 */
export function WhatsappCard({ locale, data }: { locale: Locale; data: MyWhatsapp }) {
  const t = (k: string, v?: Record<string, string>) => msg(locale, `wa.prefs.${k}`, v);
  const key = isConsented(data.status)
    ? 'active'
    : data.status === 'not_collected' && !data.open
      ? 'not_collected_closed'
      : data.status;
  const list = data.categories.map((c) => msg(locale, `wa.categories.${c}`)).join(', ');
  return (
    <section className="card wa-card" data-section="wa-card" data-wa-status={data.status} aria-labelledby="wa-card-h">
      <i aria-hidden>
        <MessageCircle size={22} />
      </i>
      <div>
        <div className="wa-card-top">
          <h3 id="wa-card-h">{t('card.title')}</h3>
          <span className={`bd ${STATUS_TONE[data.status]}`}>{t(`state.${data.status}`)}</span>
        </div>
        <p className="muted">{t(`card.body.${key}`, { list })}</p>
      </div>
      <Link
        href="/portal/whatsapp"
        className={`btn ${data.status === 'no_number' ? 'btn-primary' : 'btn-w'}`}
        data-action="wa.card.open"
      >
        {data.status === 'no_number' ? t('card.setup') : t('card.manage')}
      </Link>
    </section>
  );
}
