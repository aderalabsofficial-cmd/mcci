import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PageHero, Section, SitePage } from '@/components/site/blocks';
import { DirectoryTable, type DirRow } from '@/components/site/directory-table';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.directory.title') };
}

export const dynamic = 'force-dynamic';

/**
 * Business Directory (prototype site/directory): only the public_directory view — members who chose to be listed,
 * Permanent or Temporary (labelled), never demo companies (0370); company, sector, class, number, status, validity.
 */
export default async function DirectoryPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const m = (k: string, v?: Record<string, string>) => msg(locale, `site.directory.${k}`, v);
  const supabase = await createClient();
  const { data } = await supabase.from('public_directory').select('member_no, company, class, sector, status, valid_to').order('company');
  const rows: DirRow[] = (data ?? []).map((r) => ({
    member_no: r.member_no ?? '',
    company: r.company ?? '',
    cls: r.class ?? '',
    clsLabel: r.class ? msg(locale, `membership.classes.${r.class}`) : '—',
    sector: r.sector ?? '',
    status: r.status ?? '',
    statusLabel: r.status === 'Temporary' ? m('status.Temporary') : m('status.Permanent'),
    valid_to: r.valid_to ?? '',
  }));
  return (
    <SitePage locale={locale}>
      <PageHero locale={locale} title="site.directory.title" sub="site.directory.sub" />
      <Section n={1} title={m('table')} sub={m('listed', { n: String(rows.length) })} id="members">
        <DirectoryTable
          rows={rows}
          t={{
            table: m('table'),
            search: m('search'),
            allClasses: m('allClasses'),
            cols: { company: m('cols.company'), sector: m('cols.sector'), cls: m('cols.cls'), no: m('cols.no'), status: m('cols.status') },
            none: m('none'),
            noMatch: m('noMatch'),
            view: m('view'),
            validTo: m('validTo'),
            publicOnly: m('publicOnly'),
            close: msg(locale, 'common.close'),
            classes: { Corporate: msg(locale, 'membership.classes.Corporate'), Associate: msg(locale, 'membership.classes.Associate') },
          }}
        />
      </Section>
    </SitePage>
  );
}
