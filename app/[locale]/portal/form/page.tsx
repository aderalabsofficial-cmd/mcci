import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { OfficialForm } from '@/components/membership/official-form';
import { PrintButton } from '@/components/membership/print-button';
import { both, L } from '@/components/membership/ui';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { loadDocLists, loadMyApplication, loadPublicSettings } from '@/lib/membership/load';
import { officialFormProps, wizardApp } from '@/lib/membership/view';
import { msg } from '@/lib/nav/model';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ blank?: string; print?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'screens.portal.form') };
}

/** Official form (prototype member/form): the filled 4-page MCCI form, or a blank copy with ?blank=1; print / save PDF. */
export default async function FormPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const [sp, app, settings, docLists] = await Promise.all([
    searchParams,
    loadMyApplication(),
    loadPublicSettings(),
    loadDocLists(),
  ]);
  const blank = sp.blank === '1' || !app || app.stage === 'withdrawn';
  const w = !blank && app ? await wizardApp(app) : null;
  const m = (k: string) => msg(locale, `membership.form.${k}`);

  return (
    <>
      <div className="ph no-print">
        <div>
          <h1>
            <L {...both('membership.form.title')} />
          </h1>
          <p>{blank ? m('blank') : `${app!.token} · ${m('filled')}`}</p>
        </div>
        <div className="pb">
          {app && app.stage !== 'withdrawn' && (
            <Link className="btn" href={blank ? '/portal/form' : '/portal/form?blank=1'} data-action="nav">
              {blank ? m('filled') : m('blank')}
            </Link>
          )}
          <PrintButton label={m('print')} auto={sp.print === '1'} />
        </div>
      </div>
      {!app && <p className="muted no-print">{m('noApp')}</p>}
      <div className="formv">
        <OfficialForm {...officialFormProps(blank ? null : app, w, settings, docLists)} />
      </div>
    </>
  );
}
