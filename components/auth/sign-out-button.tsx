import { LogOut } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import { signOut } from '@/lib/auth/actions';
import { cn } from '@/lib/utils';

/** Posts to the signOut server action (works without JavaScript). */
export function SignOutButton({ locale, label, className }: { locale: Locale; label: string; className?: string }) {
  return (
    <form action={signOut}>
      <input type="hidden" name="locale" value={locale} />
      <button className={cn('btn', className)} data-action="logout">
        <LogOut className="size-4" aria-hidden />
        {label}
      </button>
    </form>
  );
}
