import { Mail, MapPin, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PageHero, Section, SitePage } from '@/components/site/blocks';
import { ContactForms } from '@/components/site/contact-forms';
import { asLocale } from '@/i18n/locale';
import { loadPublicSettings } from '@/lib/membership/load';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.contact.title') };
}

/** Contact & Complaint Desk (prototype site/contact): the two forms and the Secretariat's details from settings.chamber */
export default async function ContactPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const m = (k: string, v?: Record<string, string>) => msg(locale, `site.contact.${k}`, v);
  const { chamber } = await loadPublicSettings();
  const tel = chamber.tel.split(',')[0]!.replace(/[^\d+]/g, '');
  return (
    <SitePage locale={locale}>
      <PageHero locale={locale} title="site.contact.title" sub="site.contact.sub" />
      <Section n={1} title={m('touch')} sub={m('touchSub')} id="touch">
        <div className="g2">
          <ContactForms locale={locale} />
          <div className="card">
            <b>{chamber.addr}</b>
            <p className="muted" style={{ marginTop: 6 }}>
              {m('tel', { tel: chamber.tel })} · {chamber.email}
              <br />
              {m('hours')}
            </p>
            <div className="pb" style={{ marginTop: 14 }}>
              <a className="btn" href={`tel:+${tel.replace(/^\+/, '')}`} data-action="help.call">
                <Phone size={16} aria-hidden /> {m('call')}
              </a>
              <a className="btn" href={`mailto:${chamber.email}`} data-action="help.email">
                <Mail size={16} aria-hidden /> {m('mailLabel')}
              </a>
              <a
                className="btn"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${chamber.name}, ${chamber.addr}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                data-action="help.visit"
              >
                <MapPin size={16} aria-hidden /> {m('map')}
              </a>
            </div>
          </div>
        </div>
      </Section>
    </SitePage>
  );
}
