'use client';

import Link from 'next/link';
import { ArrowDownToLine, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';
import { MoneyText } from '@shared/ui/money-text';

import type { ArrivalLine } from '../_arrivals-action';
import { toBetBadgeLabel } from '../transactions/_detection';

/** Enough to recognise what arrived; the statement holds the rest. */
const MAXIMUM_LINES = 3;

type TransactionsArrivedToastProps = {
  readonly toastId: string | number;
  readonly count: number;
  /** The statement's newest lines; empty when they could not be read. */
  readonly lines: readonly ArrivalLine[];
};

/**
 * The arrival announcement, larger than the default toast so it is noticed —
 * new movements are the moment the statement changes under somebody's eyes.
 *
 * Louder in **size and content only**: it is still a toast, it never blocks,
 * and it carries no colour of its own. The brand tint marks the icon as the
 * product speaking; red appears only on a betting amount, and always beside a
 * badge naming it — the same rule as every other row in the product.
 */
export function TransactionsArrivedToast({ toastId, count, lines }: TransactionsArrivedToastProps) {
  const shown = lines.slice(0, MAXIMUM_LINES);
  const remaining = count - shown.length;

  return (
    <div className="w-[min(26rem,calc(100vw-2rem))] space-y-3 rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <ArrowDownToLine className="size-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-heading text-base font-semibold">{toTitle(count)}</p>
          <p className="text-sm text-muted-foreground">
            O banco avisou e o extrato já foi atualizado.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="Fechar aviso"
          onClick={() => toast.dismiss(toastId)}
        >
          <X />
        </Button>
      </div>

      {shown.length === 0 ? null : (
        <div className="space-y-1.5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Mais recentes no extrato
          </p>
          <ul className="divide-y rounded-lg bg-muted px-3">
            {shown.map((line) => (
              <ArrivalRow key={line.id} line={line} />
            ))}
          </ul>
          {remaining > 0 ? (
            <p className="text-xs text-muted-foreground">
              {remaining === 1 ? 'E mais 1 no extrato.' : `E mais ${remaining} no extrato.`}
            </p>
          ) : null}
        </div>
      )}

      <Button asChild size="sm" className="h-9 w-full">
        <Link href="/transactions" onClick={() => toast.dismiss(toastId)}>
          Ver extrato
        </Link>
      </Button>
    </div>
  );
}

function toTitle(count: number): string {
  return count === 1 ? '1 transação nova' : `${count} transações novas`;
}

function ArrivalRow({ line }: { readonly line: ArrivalLine }) {
  const isBet = line.betConfidence !== null;

  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-medium">{line.counterparty}</span>
        {line.betConfidence === null ? null : (
          <Badge variant={line.betConfidence === 'LOW' ? 'outline' : 'destructive'}>
            {toBetBadgeLabel(line.betConfidence)}
          </Badge>
        )}
      </span>
      <MoneyText
        cents={line.amountInCents}
        signed={line.amountInCents > 0}
        tabular
        className={cn('shrink-0 text-sm font-medium', isBet && 'text-destructive')}
      />
    </li>
  );
}
