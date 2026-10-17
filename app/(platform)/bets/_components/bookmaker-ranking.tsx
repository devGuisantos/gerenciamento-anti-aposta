'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronRight } from 'lucide-react';

import { useEntrance } from '@/hooks/use-entrance';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import type { BookmakerDetectionView, BookmakerView } from '../_bets-view';

type BookmakerRankingProps = {
  readonly bookmakers: readonly BookmakerView[];
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
  const [selected, setSelected] = useState<BookmakerView | null>(null);
  const hasEntered = useEntrance();

  return (
    <>
      <ul>
        {bookmakers.map((bookmaker, index) => (
          <li key={bookmaker.id}>
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
                {describeReasons(bookmaker.detections)}
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

/** Every policy that matched, so a house caught once by keyword never reads as all-MCC. */
function describeReasons(detections: readonly BookmakerDetectionView[]): string {
  return detections.map((detection) => DETECTION_LABELS[detection.reason]).join(' e ');
}

function BookmakerDetail({ bookmaker }: { readonly bookmaker: BookmakerView }) {
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

      <DetectionList detections={bookmaker.detections} />

      <Separator />

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={bookmaker.lowestConfidence === 'LOW' ? 'outline' : 'destructive'}>
            {toBetBadgeLabel(bookmaker.lowestConfidence)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {CONFIDENCE_LABELS[bookmaker.lowestConfidence]} ·{' '}
            {DETECTION_LABELS[bookmaker.weakestReason]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {DETECTION_EXPLANATIONS[bookmaker.weakestReason]}
        </p>
      </div>

      <Button asChild variant="outline" size="sm" className="h-9 w-full">
        <Link href={bookmaker.statementHref}>
          Ver as transações no extrato
          <ArrowUpRight />
        </Link>
      </Button>
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
 * How this house's bets were caught, policy by policy. The rows themselves are
 * the statement's to show — it pages, and a dialog holding a whole history
 * would not — so the button below opens exactly this house and this window.
 */
function DetectionList({ detections }: { readonly detections: readonly BookmakerDetectionView[] }) {
  return (
    <ul className="space-y-1">
      {detections.map((detection) => (
        <li key={detection.reason} className="flex items-baseline justify-between gap-4 text-sm">
          <span>{DETECTION_LABELS[detection.reason]}</span>
          <span className="shrink-0 tabular-nums text-muted-foreground">
            {describeCount(detection.count)}
          </span>
        </li>
      ))}
    </ul>
  );
}
