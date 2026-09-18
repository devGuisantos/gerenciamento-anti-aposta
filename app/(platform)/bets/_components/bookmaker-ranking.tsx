'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

import { useEntrance } from '@/hooks/use-entrance';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatBRL } from '@shared/ui/money-text';

import {
  CONFIDENCE_LABELS,
  DETECTION_EXPLANATIONS,
  DETECTION_LABELS,
  toBetBadgeLabel,
} from '../../transactions/_detection';
import type { BookmakerEntry, BookmakerSummary } from '../_bets-view';

type BookmakerRankingProps = {
  readonly bookmakers: readonly BookmakerSummary[];
};

/**
 * Where the money actually went, ranked. The statement groups by day and the
 * charts by month; neither answers "which house", which is the question this
 * screen exists for.
 *
 * One neutral fill for every bar — the ranking is magnitude, not identity, and a
 * colour per bookmaker would imply these are brands worth telling apart.
 */
export function BookmakerRanking({ bookmakers }: BookmakerRankingProps) {
  const [selected, setSelected] = useState<BookmakerSummary | null>(null);
  const hasEntered = useEntrance();

  return (
    <>
      <ul>
        {bookmakers.map((bookmaker, index) => (
          <li key={bookmaker.name}>
            {index > 0 ? <Separator /> : null}
            <button
              type="button"
              onClick={() => setSelected(bookmaker)}
              aria-label={`Detalhes de ${bookmaker.name}`}
              className="w-full space-y-2 px-(--card-spacing) py-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="truncate text-sm font-medium">{bookmaker.name}</span>
                <span className="flex shrink-0 items-center gap-1 text-sm font-medium tabular-nums">
                  {formatBRL(bookmaker.totalInCents)}
                  <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
                </span>
              </div>

              <div
                role="img"
                aria-label={`${bookmaker.name}: ${formatBRL(bookmaker.totalInCents)}`}
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-chart-2 motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
                  style={{
                    width: `${hasEntered ? bookmaker.relativeShare : 0}%`,
                    transitionDelay: `${index * 60}ms`,
                  }}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {describeCount(bookmaker.transactionCount)} · identificada por{' '}
                {DETECTION_LABELS[bookmaker.matchedBy]}
              </p>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={selected !== null} onOpenChange={(open) => (open ? undefined : setSelected(null))}>
        <DialogContent className="sm:max-w-md">
          {selected ? <BookmakerDetail bookmaker={selected} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function describeCount(count: number): string {
  return count === 1 ? '1 transação' : `${count} transações`;
}

function BookmakerDetail({ bookmaker }: { readonly bookmaker: BookmakerSummary }) {
  return (
    <>
      <DialogHeader>
        <DialogDescription>Casa de apostas</DialogDescription>
        <DialogTitle className="font-heading text-2xl tracking-tight">{bookmaker.name}</DialogTitle>
      </DialogHeader>

      <p className="font-heading text-3xl font-semibold tracking-tight text-destructive">
        {formatBRL(bookmaker.totalInCents)}
      </p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <Field label="Primeira" value={bookmaker.firstSeenLabel} />
        <Field label="Última" value={bookmaker.lastSeenLabel} />
      </dl>

      <Separator />

      <EntryList entries={bookmaker.entries} />

      <Separator />

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={bookmaker.lowestConfidence === 'LOW' ? 'outline' : 'destructive'}>
            {toBetBadgeLabel(bookmaker.lowestConfidence)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {CONFIDENCE_LABELS[bookmaker.lowestConfidence]} ·{' '}
            {DETECTION_LABELS[bookmaker.matchedBy]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {DETECTION_EXPLANATIONS[bookmaker.matchedBy]}
        </p>
      </div>
    </>
  );
}

function Field({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </>
  );
}

/**
 * The bookmaker's own statement. Clicking a row of a ranking and being told only
 * a total is a dead end — the transactions behind the number are the point, and
 * they are already in hand.
 */
function EntryList({ entries }: { readonly entries: readonly BookmakerEntry[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {entries.length === 1 ? 'A transação' : `As ${entries.length} transações`}
      </p>

      {/* Capped so a long history scrolls inside the dialog instead of pushing its
          buttons off screen on a phone. */}
      <ul className="-mx-1 max-h-56 space-y-1 overflow-y-auto px-1">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0">
              <span className="truncate">{entry.dateLabel}</span>{' '}
              <span className="text-xs text-muted-foreground">às {entry.timeLabel}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums text-destructive">
              {formatBRL(entry.amountInCents)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
