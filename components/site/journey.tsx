import { Award, Bell, Search, Signature } from 'lucide-react';
import { Ic } from '@/components/membership/ui';
import type { Locale } from '@/i18n/routing';
import { JOURNEY } from '@/lib/membership/reference';
import { msg } from '@/lib/nav/model';

/** the 8-step membership journey as shown to visitors (prototype JOURNEY: icons, temporary membership marked) */
export function PublicJourney({ locale }: { locale: Locale }) {
  return (
    <div className="steps8 big" role="list" aria-label={msg(locale, 'site.journey.title')}>
      {JOURNEY.map((s, i) => (
        <div key={s.k} role="listitem" className={i === 5 ? 'n' : ''}>
          <i aria-hidden>
            <Ic name={s.icon} size={22} />
          </i>
          <b>{msg('en', `membership.journey.${s.k}.name`)}</b>
          <span lang="ur">{msg('ur', `membership.journey.${s.k}.name`)}</span>
        </div>
      ))}
    </div>
  );
}

const ENDORSE_STEPS = [
  { k: 's1', icon: Search },
  { k: 's2', icon: Bell },
  { k: 's3', icon: Signature },
  { k: 's4', icon: Award },
] as const;

/** proposer & seconder in four steps (prototype ENDORSE), on the home and membership pages */
export function EndorseSteps({ locale }: { locale: Locale }) {
  return (
    <div className="xend xrv">
      {ENDORSE_STEPS.map((s, i) => (
        <div className="xend-s" key={s.k}>
          <span className="xend-n" aria-hidden>
            {i + 1}
          </span>
          <i aria-hidden>
            <s.icon size={26} color="#ffe7a3" />
          </i>
          <h4>{msg(locale, `site.endorse.${s.k}`)}</h4>
          <span lang="ur">{msg('ur', `site.endorse.${s.k}`)}</span>
          <p>{msg(locale, `site.endorse.${s.k}Sub`)}</p>
        </div>
      ))}
    </div>
  );
}
