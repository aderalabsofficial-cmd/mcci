import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrintButton } from '@/components/membership/print-button';
import { ServiceLetter } from '@/components/services/letter';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { loadPublicSettings } from '@/lib/membership/load';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadLetter } from '@/lib/services/letter';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'svc.letter.title') };
}

export const dynamic = 'force-dynamic';

/** the member's issued letter (doc.view / doc.print): print it or save it as PDF; the QR verifies it publicly */
export default async function LetterPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const token = (await searchParams).t ?? '';
  const [letter, settings] = await Promise.all([token ? loadLetter(token, session.userId) : Promise.resolve(null), loadPublicSettings()]);
  const m = (k: string) => msg(locale, `svc.letter.${k}`);
  return (
    <div className="proto">
      <div className="ph no-print">
        <div>
          <h1>{m('title')}</h1>
          <p>{token}</p>
        </div>
        <div className="pb">
          <Link className="btn" href={`/portal/application?t=${token}`} data-action="nav">
            {msg(locale, 'svc.apply.back')}
          </Link>
          {letter && <PrintButton label={m('print')} />}
        </div>
      </div>
      {letter ? <ServiceLetter data={letter} chamber={settings.chamber} /> : <p className="em">{m('notIssued')}</p>}
    </div>
  );
}
