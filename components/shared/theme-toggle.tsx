'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/** Light / dark switch (action theme.toggle). Saved in a cookie so the server renders the right theme. */
export function ThemeToggle({ variant = 'bar', className }: { variant?: 'bar' | 'glass'; className?: string }) {
  const t = useTranslations('common');

  function toggle() {
    const dark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', dark);
    document.cookie = `theme=${dark ? 'dark' : 'light'}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <button
      type="button"
      data-action="theme.toggle"
      aria-label={t('theme')}
      title={t('theme')}
      onClick={toggle}
      className={cn(
        'grid size-11 place-items-center rounded-xl transition-colors',
        variant === 'bar' && 'hover:bg-hover',
        variant === 'glass' && 'border border-white/35 bg-white/8 text-white hover:bg-white/18',
        className,
      )}
    >
      <Moon className="size-5 dark:hidden" aria-hidden />
      <Sun className="hidden size-5 dark:block" aria-hidden />
    </button>
  );
}
