import { Award, BadgeCheck, Hourglass, Printer } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { C, Card, PageHero, Section, SitePage } from '@/components/site/blocks';
import { EndorseSteps, PublicJourney } from '@/components/site/journey';
import { DocsByType, Faq, type DocRow } from '@/components/site/membership-parts';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { BIZ_TYPES } from '@/lib/membership/reference';
import { loadPublicSettings } from '@/lib/membership/load';
import { msg } from '@/lib/nav/model';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.membership.title') };
}

const pkr = (n: number) => n.toLocaleString('en-US');

/**
 * Membership (prototype site/membership): classes and the class rule, the fee schedule from settings (as printed on
 * the form), documents by business type (document_requirements), proposer & seconder, the journey, FAQ.
 */
export default async function MembershipPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const m = (k: string, v?: Record<string, string>) => msg(locale, `site.membership.${k}`, v);
  const supabase = await createClient();
  const [settings, { data: reqs }] = await Promise.all([
    loadPublicSettings(),
    supabase.from('document_requirements').select('biz_type, key, label_en, required, sort').order('sort'),
  ]);
  const f = settings.fees;
  const total = (c: 'Corporate' | 'Associate' | 'Women') => f[c].admission + f[c].subscription + f[c].card;
  const lists: Record<string, DocRow[]> = {};
  for (const r of reqs ?? []) {
    (lists[r.biz_type] ??= []).push({
      key: r.key,
      label: r.label_en,
      ur: locale === 'en' ? '' : msg('ur', `membership.docs.${r.key}`),
      required: r.required,
    });
  }
  const classes = [
    { k: 'Corporate', title: 'corporate', sub: m('corporateSub', { turnover: '50 million' }), color: C.CB },
    { k: 'Associate', title: 'associate', sub: m('associateSub'), color: C.TL },
    { k: 'Women', title: 'women', sub: m('womenSub'), color: C.PK },
  ] as const;
  const other = locale === 'en' ? 'ur' : 'en';
  return (
    <SitePage locale={locale}>
      <PageHero locale={locale} title="site.membership.title" sub="site.membership.sub" />
      <Section n={1} title={m('fee')} sub={m('feeSub')} id="fees">
        <div className="g3">
          {classes.map((c) => (
            <div className="sc st" key={c.k} data-class={c.k}>
              <i style={{ background: `${c.color}22` }} aria-hidden>
                <Award size={28} color={c.color} />
              </i>
              <h4>{m(c.title)}</h4>
              <p>{c.sub}</p>
              <table className="fee-t">
                <tbody>
                  <tr>
                    <td>{m('admission')}</td>
                    <td>PKR {pkr(f[c.k].admission)}</td>
                  </tr>
                  <tr>
                    <td>{m('subscription')}</td>
                    <td>PKR {pkr(f[c.k].subscription)}</td>
                  </tr>
                  <tr>
                    <td>{m('card')}</td>
                    <td>PKR {pkr(f[c.k].card)}</td>
                  </tr>
                  <tr>
                    <td>
                      <b>{m('total')}</b>
                    </td>
                    <td>PKR {pkr(total(c.k))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="muted" style={{ textAlign: 'center', marginTop: 14 }}>
          {m('extraCard', { fee: pkr(f.extraCard) })}
        </p>
      </Section>
      <Section n={2} title={m('docs')} sub={m('docsSub')} alt id="documents">
        <DocsByType
          types={BIZ_TYPES.map((k) => ({ k, name: msg(locale, `membership.biz.${k}.name`) }))}
          lists={lists}
          ifApplicable={m('ifApplicable')}
          note={m('docsNote')}
          label={m('docs')}
        />
      </Section>
      <Section n={3} title={m('endorse')} sub={m('endorseSub')} id="endorse">
        <EndorseSteps locale={locale} />
      </Section>
      <Section n={4} title={m('journey')} sub={m('journeySub')} alt id="journey">
        <PublicJourney locale={locale} />
        <div className="g3" style={{ marginTop: 26 }}>
          <Card icon={Hourglass} color={C.TL} title={m('t1')} body={m('t1Sub')} href="/verify" />
          <Card icon={Printer} color={C.CB} title={m('t2')} body={m('t2Sub')} href="/verify" />
          <Card icon={BadgeCheck} color={C.GR} title={m('t3')} body={m('t3Sub')} href="/verify" />
        </div>
        <div className="pb" style={{ justifyContent: 'center', marginTop: 26 }}>
          <Link className="btn btn-gold" href="/register" data-action="register.start">
            {msg(locale, 'site.endorse.start')} →
          </Link>
          <Link className="btn" href="/resources/form" data-action="res.download">
            {m('blankForm')}
          </Link>
        </div>
      </Section>
      <Section n={5} title={m('faq')} sub={m('faqSub')} id="faq">
        <Faq
          items={[1, 2, 3, 4, 5].map((i) => ({
            q: `${m(`q${i}`)} · ${msg(other, `site.membership.q${i}`)}`,
            a: m(`a${i}`, {
              corporate: pkr(total('Corporate')),
              associate: pkr(total('Associate')),
              women: pkr(total('Women')),
              extra: pkr(f.extraCard),
            }),
          }))}
        />
      </Section>
    </SitePage>
  );
}
