import { Lock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { msg } from '@/lib/nav/model';
import type { StaffModule } from '@/lib/permissions/levels';

/** Prototype access.js noAccess(): the screen is outside the person's designation limits. */
export function NoAccess({
  locale,
  designation,
  module,
}: {
  locale: Locale;
  designation: string;
  module: StaffModule;
}) {
  return (
    <section className="mx-auto my-10 max-w-[640px] rounded-[var(--card-radius)] border border-line bg-card p-[var(--card-pad)] text-center sm:shadow-card">
      <Lock className="mx-auto size-10 text-muted" aria-hidden />
      <h2 className="mt-3 text-[length:var(--section-title)] font-bold">{msg(locale, 'access.staff.noAccessTitle')}</h2>
      <p className="mt-1 text-muted">
        {msg(locale, 'access.staff.noAccessBody', { designation, module: msg(locale, `access.modules.${module}`) })}
      </p>
      <Link href="/admin" className="btn btn-primary mt-4">
        {msg(locale, 'access.staff.back')}
      </Link>
    </section>
  );
}
