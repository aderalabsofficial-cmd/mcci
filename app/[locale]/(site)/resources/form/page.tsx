import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { OfficialForm } from '@/components/membership/official-form';
import { PrintButton } from '@/components/membership/print-button';
import { SitePage } from '@/components/site/blocks';
import { asLocale } from '@/i18n/locale';
import { loadDocLists, loadPublicSettings } from '@/lib/membership/load';
import { officialFormProps } from '@/lib/membership/view';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'site.resources.formTitle') };
}

/** the blank 4-page MCCI New Membership form for anyone (res.download): print it or save it as PDF */
export default async function BlankFormPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const [settings, docLists] = await Promise.all([loadPublicSettings(), loadDocLists()]);
  const m = (k: string) => msg(locale, `site.resources.${k}`);
  return (
    <SitePage locale={locale}>
      <div className="wr no-print" style={{ paddingTop: 'calc(var(--xh) + 28px)', paddingBottom: 16 }}>
        <div className="ph">
          <div>
            <h1>{m('formTitle')}</h1>
            <p>{m('formSub')}</p>
          </div>
          <div className="pb">
            <PrintButton label={m('print')} />
          </div>
        </div>
      </div>
      <div className="formv">
        <OfficialForm {...officialFormProps(null, null, settings, docLists)} />
      </div>
    </SitePage>
  );
}
