import { FileText } from 'lucide-react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { C, PageHero, Section, SitePage } from '@/components/site/blocks';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.resources.title') };
}

/**
 * Resources (prototype site/resources, action res.download): the blank official form (printable / PDF from the browser)
 * and the guides, which are the live pages that hold the same information (never a copy that can go out of date).
 */
const ITEMS = [
  { k: 'r1', href: '/resources/form', action: 'res.download', label: 'download' },
  { k: 'r2', href: '/membership#journey', action: 'nav', label: 'open' },
  { k: 'r3', href: '/membership#documents', action: 'nav', label: 'open' },
  { k: 'r4', href: '/services', action: 'nav', label: 'open' },
] as const;

export default async function ResourcesPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const m = (k: string) => msg(locale, `site.resources.${k}`);
  return (
    <SitePage locale={locale}>
      <PageHero locale={locale} title="site.resources.title" sub="site.resources.sub" />
      <Section n={1} title={m('downloads')} id="downloads">
        <div className="card" style={{ maxWidth: 860, margin: 'auto' }}>
          {ITEMS.map((r) => (
            <div className="li st" key={r.k} data-resource={r.k}>
              <i style={{ background: `${C.CB}22` }} aria-hidden>
                <FileText size={18} color={C.CB} />
              </i>
              <div style={{ flex: 1 }}>
                <b>{m(r.k)}</b>
                <small>{m(`${r.k}Sub`)}</small>
              </div>
              <Link className="btn btn-w" href={r.href} data-action={r.action}>
                {m(r.label)}
              </Link>
            </div>
          ))}
        </div>
      </Section>
    </SitePage>
  );
}
