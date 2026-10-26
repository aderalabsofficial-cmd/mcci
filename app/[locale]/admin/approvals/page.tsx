import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SigningQueue } from '@/components/services/staff';
import { guardStaff } from '@/components/services/staff-page';
import { asLocale } from '@/i18n/locale';
import { msg } from '@/lib/nav/model';
import { requireUser } from '@/lib/permissions/server';
import { loadRequests } from '@/lib/services/load';
import { loadServices } from '@/lib/site/load';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: msg(asLocale((await params).locale), 'svc.sign.title') };
}

export const dynamic = 'force-dynamic';

/**
 * Approvals & Signing (prototype admin/approvals): the signatory queue. The President and the Secretary General
 * (svc 3) sign one request or all whose fee is paid; each signature issues the QR letter. Others see the queue only.
 */
export default async function ApprovalsPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await requireUser();
  const g = guardStaff(session, locale, 'svc', 'svc.sign.title');
  if (g.denied) return g.denied;
  const m = (k: string) => msg(locale, `svc.sign.${k}`);
  const [rows, services] = await Promise.all([loadRequests(), loadServices()]);
  const ready = rows.filter((r) => r.status === 'Ready to sign');
  const supabase = await createClient();
  const { data: vouchers } = ready.length
    ? await supabase.from('payment_vouchers').select('ref_id, status').eq('ref_type', 'service').in('ref_id', ready.map((r) => r.id))
    : { data: [] as { ref_id: string; status: string }[] };
  const feeOk = (id: string) => {
    const v = (vouchers ?? []).filter((x) => x.ref_id === id);
    return v.length === 0 || v.some((x) => x.status === 'Paid');
  };
  const name = (k: string) => services.find((s) => s.key === k)?.name_en ?? k;
  const canSign = g.level >= 3;
  return (
    <div className="proto">
      <div className="ph">
        <div>
          <h1>{m('title')}</h1>
          {!canSign && <p>{m('notAllowed')}</p>}
        </div>
      </div>
      <SigningQueue
        locale={locale}
        canSign={canSign}
        rows={ready.map((r) => ({ id: r.id, token: r.token, title: `${name(r.service_key)} · ${r.company}`, feeOk: feeOk(r.id) }))}
      />
    </div>
  );
}
