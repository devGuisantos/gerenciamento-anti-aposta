import { ArrowDownLeft, ArrowUpRight, TrendingDown } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from 'cn';
import { formatBRL } from '@shared/ui/money-text';

import { FIXED_INCOME_ANNUAL_RATE } from '../../dashboard/_mock-snapshot';
import { toYieldEquivalentInCents, type LedgerTotals } from '../_ledger-view';
import {
  SPEND_LEVEL_CAPTIONS,
  SPEND_LEVEL_TEXT_CLASSES,
  toSpendLevel,
} from '../_spend-level';

const ratePercent = (FIXED_INCOME_ANNUAL_RATE * 100).toFixed(1).replace('.', ',');

type LedgerSummaryProps = {
  readonly totals: LedgerTotals;
  readonly scopeLabel: string;
};

/**
 * The one hero figure on this screen, and it moves with the filters: what the
 * period on screen actually cost in bets. Entradas and saídas sit beside it at a
 * smaller size, which is the hierarchy a statement wants.
 */
export function LedgerSummary({ totals, scopeLabel }: LedgerSummaryProps) {
  const yieldInCents = toYieldEquivalentInCents(totals.betSpendInCents, FIXED_INCOME_ANNUAL_RATE);
  const level = toSpendLevel(totals.betSpendInCents);
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
          <p
            className={cn(
              'font-heading text-5xl font-semibold tracking-tight',
              levelClass,
            )}
          >
            {formatBRL(totals.betSpendInCents)}
          </p>
          {totals.betCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma aposta identificada neste recorte.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {toTransactionCount(totals.betCount)}. Em renda fixa a {ratePercent}% ao ano, esse
              valor seria {formatBRL(yieldInCents)} em 12 meses — estimativa, não é garantia de
              retorno.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DirectionFigure
            icon={ArrowDownLeft}
            label="Entradas"
            amountInCents={totals.creditsInCents}
          />
          <DirectionFigure icon={ArrowUpRight} label="Saídas" amountInCents={totals.debitsInCents} />
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
