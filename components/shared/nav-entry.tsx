'use client';

import type { ReactNode } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { isCurrent, type NavItem } from '@/lib/nav/model';
import { cn } from '@/lib/utils';

/**
 * One navigation control: a link when the screen is built, otherwise a disabled button whose title says why
 * (orphan audit, docs/10-testing.md). State classes are plain strings so server components can pass them.
 */
export function NavEntry({
  item,
  className,
  enabledClassName,
  currentClassName,
  disabledClassName,
  children,
  onNavigate,
}: {
  item: NavItem;
  className?: string;
  enabledClassName?: string;
  currentClassName?: string;
  disabledClassName?: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  if (!item.href) {
    return (
      <button type="button" disabled title={item.reason ?? undefined} className={cn(className, disabledClassName)}>
        {children}
      </button>
    );
  }
  const current = isCurrent(item, pathname);
  return (
    <Link
      href={item.href}
      aria-current={current ? 'page' : undefined}
      className={cn(className, enabledClassName, current && currentClassName)}
      onClick={onNavigate}
    >
      {children}
    </Link>
  );
}
