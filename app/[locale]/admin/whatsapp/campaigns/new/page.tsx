import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { FilterBuilder } from '@/components/business/filter-builder';
import { guardStaff } from '@/components/services/staff-page';
import { CampaignComposer, type TemplateOption } from '@/components/whatsapp/composer';
import { asLocale } from '@/i18n/locale';
import { decodeFilter } from '@/lib/business/filters';
import { loadFacets, loadSegments } from '@/lib/business/load';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadTemplates } from '@/lib/whatsapp/load';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ f?: string; q?: string; segment?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.admin.wanew') };
}

export const dynamic = 'force-dynamic';

/** New message or campaign: the directory's own filter builder, then the guided composer. Nothing here sends. */
export default async function NewCampaignPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'out', 'screens.admin.wanew', 2);
  if (g.denied) return g.denied;
  const m = (k: string) => msg(locale, `wa.composer.${k}`);
  const sp = await searchParams;
  const [facets, segments, templates] = await Promise.all([loadFacets(), loadSegments(), loadTemplates()]);
  const open = sp.segment ? segments.find((s) => s.id === sp.segment) : undefined;
  const filter = decodeFilter(sp.f ?? (open ? open.definition : ''));
  const q = (sp.q ?? '').slice(0, 100);
  const approved = templates.filter((t) => t.status === 'APPROVED') as unknown as TemplateOption[];
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('pageTitle')}</h1>
          <p>{m('sub')}</p>
        </div>
      </div>
      <FilterBuilder
        key={sp.segment ?? 'filter'}
        locale={locale}
        basePath="/admin/whatsapp/campaigns/new"
        facets={facets}
        initial={filter}
        q={q}
        segment={open ? { id: open.id, name: open.name, description: open.description } : null}
        canSave={staffCanSave(session.access.staff?.levels.biz)}
      />
      <CampaignComposer locale={locale} filter={filter} q={q} templates={approved} segment={open?.id ?? null} />
    </div>
  );
}

const staffCanSave = (level: number | undefined) => (level ?? 0) >= 2;
