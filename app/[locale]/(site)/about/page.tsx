import { BookOpen, Building2, FileSearch, Globe, Handshake, Landmark, Megaphone, Scale, ShieldCheck, Sparkles } from 'lucide-react';
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
 * About MCCI (prototype site/about): mission and leadership, then what MCCI's earlier website (mcci.org.pk, Nov 2026)
 * published and this one lacked: the chamber's history, its objectives from the Memorandum, the Secretariat and the
 * facilities at the chamber. The office-bearers' names are the home page's (landing.*_name), one place to change them.
 */
const LEADERS = [
  { name: 'landing.pres_name', initials: 'SP', role: 'president' },
  { name: 'landing.svp_name', initials: 'AT', role: 'svp' },
  { name: 'landing.vp_name', initials: 'AW', role: 'vp' },
] as const;

const SECRETARIAT = [
  { k: 'sg', initials: 'MS' },
  { k: 'asst', initials: 'SA' },
  { k: 'accounts', initials: 'MA' },
  { k: 'membershipOfficer', initials: 'MS' },
] as const;

const HISTORY = ['h1', 'h2', 'h3', 'h4', 'h5'] as const;

const OBJECTIVES = [
  { k: 'o1', icon: ShieldCheck, color: C.CB },
  { k: 'o2', icon: Megaphone, color: C.GD },
  { k: 'o3', icon: Handshake, color: C.TL },
  { k: 'o4', icon: Scale, color: C.PU },
  { k: 'o5', icon: FileSearch, color: C.BL },
  { k: 'o6', icon: Globe, color: C.GR },
] as const;

const DESKS = ['fbr', 'sbp', 'smeda', 'tevta', 'ip'] as const;

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
        <div className="cg" data-group="bearers">
          {LEADERS.map((l) => (
            <div className="card pc" key={l.role}>
              <div className="av" aria-hidden>
                {l.initials}
              </div>
              <h3>{msg(locale, l.name)}</h3>
              <p>{m(l.role)}</p>
            </div>
          ))}
        </div>
        <h3 className="about-sub" id="secretariat">
          {m('secretariat')}
        </h3>
        <div className="cg" data-group="secretariat">
          {SECRETARIAT.map((s) => (
            <div className="card pc" key={s.k}>
              <div className="av" aria-hidden>
                {s.initials}
              </div>
              <h3>{m(`${s.k}Name`)}</h3>
              <p>{m(s.k)}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section n={3} title={m('history')} sub={m('historySub')} id="history">
        <div className="card" style={{ maxWidth: 860, margin: 'auto' }}>
          <ul className="tl">
            {HISTORY.map((k) => (
              <li key={k} className="d">
                <i aria-hidden>
                  <Landmark size={13} />
                </i>
                <div>
                  <b>{m(k)}</b>
                  <small>{m(`${k}Sub`)}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>
      <Section n={4} title={m('objectives')} sub={m('objectivesSub')} alt id="objectives">
        <div className="g3">
          {OBJECTIVES.map((o) => (
            <Card key={o.k} icon={o.icon} color={o.color} title={m(o.k)} body={m(`${o.k}Sub`)} />
          ))}
        </div>
      </Section>
      <Section n={5} title={m('facilities')} sub={m('facilitiesSub')} id="facilities">
        <div className="g2 about-stack">
          <Card icon={BookOpen} color={C.CB} title={m('library')} body={m('librarySub')}>
            <ul className="about-list">
              {['l1', 'l2', 'l3', 'l4'].map((k) => (
                <li key={k}>{m(k)}</li>
              ))}
            </ul>
          </Card>
          <Card icon={Building2} color={C.TL} title={m('desks')} body={m('desksSub')}>
            <ul className="about-list">
              {DESKS.map((k) => (
                <li key={k}>{m(`desk_${k}`)}</li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>
    </SitePage>
  );
}
