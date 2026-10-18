import Link from 'next/link';
import { ArrowUpRight, TrendingDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatBRL } from '@shared/ui/money-text';
import { cn } from 'cn';

import {
  describeBookmakers,
  describeTransactions,
  type BetCostView,
} from '../../bets/_bets-view';

type BetSpendHeroProps = {
  readonly cost: BetCostView;
  readonly days: number;
};

/**
 * The one hero figure on this view. It is the betting spend rather than any
 * balance because that is the number the product exists to make visible, and
 * the 12-month yield sits beside it as the backend's estimate, rate stated.
 *
 * It is `/bets` over the same window to the cent, so "Ver detalhes" opens that
 * screen on exactly this slice.
 */
export function BetSpendHero({ cost, days }: BetSpendHeroProps) {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingDown aria-hidden className="size-4" />
          <span className="text-xs font-medium tracking-wide uppercase">
            Gasto com apostas · últimos {days} dias
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {cost.transactionCount === 0 ? (
          <NoBetsFound days={days} />
        ) : (
          <BetSpend cost={cost} days={days} />
        )}
      </CardContent>
    </Card>
  );
}

function BetSpend({ cost, days }: BetSpendHeroProps) {
  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
      <div className="space-y-2">
        {/* Refunds can net a window with bets down to zero, and zero is never red. */}
        <p
          className={cn(
            'font-heading text-5xl font-semibold tracking-tight',
            cost.totalInCents === 0 ? 'text-spend-none' : 'text-destructive',
          )}
        >
          {formatBRL(cost.totalInCents)}
        </p>
        <p className="text-sm text-muted-foreground">
          {describeTransactions(cost.transactionCount)} em{' '}
          {describeBookmakers(cost.bookmakerCount)}.
        </p>
        {/* A refund gives the money back, so the hero is net and this line says
            by how much — the same sentence `/bets` uses. */}
        {cost.refundCount > 0 ? (
          <p className="text-sm text-muted-foreground">
            Já descontados {formatBRL(cost.refundTotalInCents)} de{' '}
            {cost.refundCount === 1 ? '1 estorno' : `${cost.refundCount} estornos`}.
          </p>
        ) : null}
      </div>

      <div className="space-y-2 rounded-lg bg-muted p-4">
        <p className="text-xs text-muted-foreground">
          Esse mesmo valor, aplicado em renda fixa por 12 meses
        </p>
        <p className="font-heading text-2xl font-semibold tracking-tight">
          {formatBRL(cost.yieldEquivalentInCents)}
        </p>
        <p className="text-xs text-muted-foreground">
          Estimativa a {cost.ratePercentLabel}% ao ano — um rendimento de{' '}
          {formatBRL(cost.yieldEquivalentInCents - cost.totalInCents)}. Não é uma garantia de
          retorno.
        </p>
        <Button asChild variant="outline" size="sm" className="h-9 w-full">
          <Link href={`/bets?period=${days}`}>
            Ver detalhes
            <ArrowUpRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * A window we read and found nothing in. Stated as what was looked at, never as
 * praise, and with no reframing: the yield of zero is not a figure worth a panel.
 */
function NoBetsFound({ days }: { readonly days: number }) {
  return (
    <div className="space-y-2">
      <p className="font-heading text-5xl font-semibold tracking-tight text-spend-none">
        {formatBRL(0)}
      </p>
      <p className="text-sm text-muted-foreground">
        Nenhuma transação com casas de apostas nas contas conectadas nos últimos {days} dias.
      </p>
    </div>
  );
}
