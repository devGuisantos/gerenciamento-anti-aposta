import Link from 'next/link';

import { cn } from 'cn';

import { BET_PERIODS, type BetPeriodDays } from '../_period';

/**
 * Plain links, not a client-side toggle.
 *
 * The whole screen is server-rendered from the chosen window, so the period is
 * part of the address rather than a piece of state: it survives a reload, it can
 * be shared or bookmarked, and it needs no JavaScript to work.
 */
export function PeriodSelector({ current }: { readonly current: BetPeriodDays }) {
  return (
    <nav
      aria-label="Período"
      className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      {BET_PERIODS.map((period) => {
        const isCurrent = period === current;

        return (
          <Link
            key={period}
            href={`/bets?period=${period}`}
            aria-current={isCurrent ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 shrink-0 items-center rounded-lg px-3 text-sm transition-colors md:h-8',
              isCurrent
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {period} dias
          </Link>
        );
      })}
    </nav>
  );
}
