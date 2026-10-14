import { ArrowDownLeft, ArrowUpRight, TrendingDown } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import type { LedgerTotals } from '@modules/open-finance';
import { cn } from 'cn';
import { formatBRL } from '@shared/ui/money-text';

import {
  SPEND_LEVEL_CAPTIONS,
  SPEND_LEVEL_TEXT_CLASSES,
  toSpendLevel,
} from '../_spend-level';

const RATE_FORMAT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

type LedgerSummaryProps = {
  /** The backend's figures for the **whole** filtered set, never for the loaded page. */
  readonly totals: LedgerTotals;
  readonly scopeLabel: string;
};

/**
 * The one hero figure on this screen, and it moves with the filters: what the
 * slice on screen actually cost in bets, net of refunds. Entradas and saídas
 * sit beside it at a smaller size, which is the hierarchy a statement wants.
 */
export function LedgerSummary({ totals, scopeLabel }: LedgerSummaryProps) {
  const betSpendInCents = totals.betSpend.amountInCents;
  const level = toSpendLevel(betSpendInCents);
  const levelClass = SPEND_LEVEL_TEXT_CLASSES[level];
  const levelCaption = SPEND_LEVEL_CAPTIONS[level];

  return (
    <Card>
      <CardContent className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div className="space-y-2">
          {/* The label stays muted: the band colours sit at the 3:1 large-text floor,
              which is not enough for type this small. The figure below carries them. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
            <TrendingDown aria-hidden className={cn('size-4', levelClass)} />
            <span className="text-xs font-medium tracking-wide uppercase">
              Apostas · {scopeLabel}
            </span>
            {/* The colour band in words, for anyone who cannot read the colour. */}
            {levelCaption ? (
              <span className="text-xs text-muted-foreground">({levelCaption})</span>
            ) : null}
          </div>
          <p className={cn('font-heading text-5xl font-semibold tracking-tight', levelClass)}>
            {formatBRL(betSpendInCents)}
          </p>
          {totals.betCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma aposta identificada neste recorte.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {toTransactionCount(totals.betCount)}. Em renda fixa a{' '}
              {RATE_FORMAT.format(totals.annualRatePercent)}% ao ano, esse valor seria{' '}
              {formatBRL(totals.betYieldEquivalent.amountInCents)} em 12 meses — estimativa, não é
              garantia de retorno.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DirectionFigure
            icon={ArrowDownLeft}
            label="Entradas"
            amountInCents={totals.credits.amountInCents}
          />
          <DirectionFigure
            icon={ArrowUpRight}
            label="Saídas"
            amountInCents={totals.debits.amountInCents}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function toTransactionCount(count: number): string {
  return count === 1 ? 'Em 1 transação' : `Em ${count} transações`;
}

function DirectionFigure({
  icon: Icon,
  label,
  amountInCents,
}: {
  readonly icon: typeof ArrowDownLeft;
  readonly label: string;
  readonly amountInCents: number;
}) {
  return (
    <div className="space-y-1 rounded-lg bg-muted p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon aria-hidden className="size-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="font-heading text-xl font-semibold tracking-tight tabular-nums">
        {formatBRL(amountInCents)}
      </p>
    </div>
  );
}
