'use client';

import { useEntrance } from '@/hooks/use-entrance';
import { cn } from 'cn';
import { formatBRL } from '@shared/ui/money-text';

import type { CategorySlice } from '../_insights-view';

/**
 * Ranked magnitude, so it is one series with a neutral fill rather than a colour
 * per category — nine hues here would bury the one row that matters. Betting is
 * that row, and it is the only one that takes a colour.
 *
 * Plain divs rather than a chart library: the marks are rectangles and the labels
 * sit in the row, so an SVG would add weight without adding anything to read.
 */
export function CategoryBreakdown({ slices }: { readonly slices: readonly CategorySlice[] }) {
  const hasEntered = useEntrance();

  return (
    <ul className="space-y-3">
      {slices.map((slice, index) => (
        <li key={slice.id} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className={cn('truncate', slice.id === 'BETS' && 'font-medium')}>
              {slice.label}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatBRL(slice.totalInCents)}
            </span>
          </div>

          <div
            role="img"
            aria-label={`${slice.label}: ${formatBRL(slice.totalInCents)}`}
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn(
                'h-full rounded-full',
                slice.id === 'BETS' ? 'bg-spend-high' : 'bg-chart-2',
                'motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out',
              )}
              style={{
                width: `${hasEntered ? slice.relativeShare : 0}%`,
                transitionDelay: `${index * 60}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
