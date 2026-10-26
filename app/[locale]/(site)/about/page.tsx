import { Globe, ShieldCheck, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { C, Card, PageHero, Section, SitePage } from '@/components/site/blocks';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.about.title') };
}

/**
 * About MCCI (prototype site/about): mission and leadership. The President's name is as printed in the prototype;
 * the other office-bearers show their offices only. TODO(MCCI): names of the office-bearers (docs/14).
 */
const LEADERS = [
  { name: 'Dr. Shafique Pitafi', initials: 'SP', role: 'president', group: 'executive' },
  { name: null, initials: 'SV', role: 'svp', group: 'executive' },
  { name: null, initials: 'VP', role: 'vp', group: 'executive' },
  { name: null, initials: 'SG', role: 'sg', group: 'secretariat' },
] as const;

export default async function AboutPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const m = (k: string) => msg(locale, `site.about.${k}`);
  return (
    <SitePage locale={locale}>
      <PageHero locale={locale} title="site.about.title" sub="site.about.sub" />
      <Section n={1} title={m('mission')} sub={m('missionSub')} id="mission">
        <div className="g3">
          <Card icon={Globe} color={C.CB} title={m('m1')} body={m('m1Sub')} href="/services" />
          <Card icon={ShieldCheck} color={C.TL} title={m('m2')} body={m('m2Sub')} href="/services" />
          <Card icon={Sparkles} color={C.GD} title={m('m3')} body={m('m3Sub')} href="/services" />
        </div>
      </Section>
      <Section n={2} title={m('leadership')} sub={m('leadershipSub')} alt id="leadership">
        <div className="cg">
          {LEADERS.map((l) => (
            <div className="card pc" key={l.role}>
              <div className="av" aria-hidden>
                {l.initials}
              </div>
              <h3>{l.name ?? m(l.role)}</h3>
              <p>{l.name ? m(l.role) : m(l.group)}</p>
            </div>
          ))}
        </div>
      </Section>
    </SitePage>
  );
}
