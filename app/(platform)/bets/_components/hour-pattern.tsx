'use client';

import { useEntrance } from '@/hooks/use-entrance';
import { cn } from 'cn';

import type { HourBucket } from '../_bets-view';

type HourPatternProps = {
  readonly buckets: readonly HourBucket[];
  readonly summary: string | null;
};

/**
 * When the bets happen, in three-hour bands.
 *
 * Stated as a count and nothing else. The hour a person bets is the kind of fact
 * that invites a conclusion about them, and the app is not in a position to draw
 * one — so the sentence reports the cluster and stops.
 *
 * Columns grow from the baseline, which is also the only animation here: the
 * shape of the day is the point, not the motion.
 */
export function HourPattern({ buckets, summary }: HourPatternProps) {
  const hasEntered = useEntrance();

  return (
    <div className="space-y-4">
      <div className="flex h-32 items-end gap-1.5 sm:gap-2">
        {buckets.map((bucket, index) => (
          <div key={bucket.startHour} className="flex h-full flex-1 flex-col justify-end gap-1.5">
            <span
              className={cn(
                'text-center text-xs tabular-nums',
                bucket.count === 0 ? 'text-muted-foreground/50' : 'text-muted-foreground',
              )}
            >
              {bucket.count}
            </span>
            <div
              role="img"
              aria-label={`${bucket.label}: ${bucket.count} ${bucket.count === 1 ? 'aposta' : 'apostas'}`}
              /* A 2px floor keeps an empty band visible as a band rather than a gap. */
              className="w-full rounded-t-[4px] bg-chart-2 motion-safe:transition-[height] motion-safe:duration-700 motion-safe:ease-out"
              style={{
                height: hasEntered ? `max(2px, ${bucket.relativeShare}%)` : '2px',
                transitionDelay: `${index * 50}ms`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 sm:gap-2">
        {buckets.map((bucket) => (
          <span
            key={bucket.startHour}
            className="flex-1 text-center text-[10px] tabular-nums text-muted-foreground"
          >
            {`${bucket.startHour}`.padStart(2, '0')}h
          </span>
        ))}
      </div>

      {summary ? <p className="text-sm text-muted-foreground">{summary}</p> : null}
    </div>
  );
}
