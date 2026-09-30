import Link from 'next/link';
import { ArrowUpRight, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatBRL } from '@shared/ui/money-text';

import { FIXED_INCOME_ANNUAL_RATE } from '../../dashboard/_mock-snapshot';
import { toYieldEquivalentInCents } from '../../transactions/_ledger-view';
import type { GoalCycle } from '../_goals-view';
import { CycleStatusBadge } from './cycle-status-badge';

const FULL_BAR = 100;

const ratePercent = (FIXED_INCOME_ANNUAL_RATE * 100).toFixed(1).replace('.', ',');

type CurrentCycleCardProps = {
  readonly cycle: GoalCycle;
  readonly daysRemaining: number;
  readonly nextMonthLabel: string;
};

/**
 * The month under way, and the one hero figure on this screen.
 *
 * The figure is the betting spend rather than the ceiling, for the same reason it
 * is the hero on the dashboard: it is the number the product exists to make
 * visible, and a goal screen that leads with the target instead of the spend is a
 * goal screen that lets you look away from it.
 */
export function CurrentCycleCard({
  cycle,
  daysRemaining,
  nextMonthLabel,
}: CurrentCycleCardProps) {
  const isOverCeiling = cycle.marginInCents < 0;

  return (
    <Card>
      <CardHeader className="items-center border-b pb-4">
        {/* Same grid-item rule as the savings cards: without `min-w-0` this column
            will not shrink below its own text, and "Meta de setembro de 2026" at
            360px comes within a few pixels of pushing the badge out of the card. */}
        <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
          <Target aria-hidden className="size-4" />
          <span className="truncate text-xs font-medium tracking-wide uppercase">
            Meta de {cycle.monthLabel}
          </span>
        </div>
        <CardAction className="self-center">
          <CycleStatusBadge status={isOverCeiling ? 'MISSED' : 'ACTIVE'} />
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-6 py-2 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="font-heading text-5xl font-semibold tracking-tight text-destructive sm:text-6xl">
              {formatBRL(cycle.spentInCents)}
            </p>
            <p className="text-sm text-muted-foreground">
              de um teto de {formatBRL(cycle.ceilingInCents)} que você definiu para este mês.
            </p>
          </div>

          <Progress
            value={Math.min(cycle.usedPercentage, FULL_BAR)}
            aria-label={`Gasto com apostas neste mês, contra o teto de ${formatBRL(cycle.ceilingInCents)}`}
            className={`h-2 ${isOverCeiling ? '*:data-[slot=progress-indicator]:bg-destructive' : ''}`}
          />

          <p className="text-sm text-muted-foreground">
            {describeStanding(cycle, daysRemaining, nextMonthLabel)}
          </p>

          {/* The destination is the user's own words and the other half of the goal
              the module describes. It is a statement of intent, never a balance:
              the platform reads transactions, it does not move money, and no line
              here may leave somebody thinking it did. */}
          <p className="text-xs text-muted-foreground">
            Você definiu esta meta para{' '}
            <span className="text-foreground">{cycle.destination}</span>. Guardar o valor é com
            você — a plataforma só mostra o que já aconteceu.
          </p>
        </div>

        <CeilingReframing cycle={cycle} />
      </CardContent>
    </Card>
  );
}

/**
 * The same amount seen as what it could become, which is the reframing the whole
 * product is built on. Which amount depends on where the month stands: what has
 * already passed the ceiling, or what is still inside it.
 */
function CeilingReframing({ cycle }: { readonly cycle: GoalCycle }) {
  const isOverCeiling = cycle.marginInCents < 0;
  const amountInCents = Math.abs(cycle.marginInCents);
  const yieldInCents = toYieldEquivalentInCents(amountInCents, FIXED_INCOME_ANNUAL_RATE);

  return (
    <div className="space-y-2 rounded-lg bg-muted p-4">
      <p className="text-xs text-muted-foreground">
        {isOverCeiling
          ? 'O que passou do teto, aplicado em renda fixa por 12 meses'
          : 'O que ainda cabe no teto, se ficar aplicado em renda fixa por 12 meses'}
      </p>
      <p className="font-heading text-2xl font-semibold tracking-tight">
        {formatBRL(yieldInCents)}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatBRL(amountInCents)} a {ratePercent}% ao ano — um rendimento de{' '}
        {formatBRL(yieldInCents - amountInCents)}. Não é uma garantia de retorno.
      </p>
      <Button asChild variant="outline" size="sm" className="h-9 w-full">
        <Link href="/transactions?filter=bets&period=30d">
          Ver as apostas do mês
          <ArrowUpRight />
        </Link>
      </Button>
    </div>
  );
}

/**
 * Where the month stands, said once and without a verdict. A month past its
 * ceiling is reported and then pointed at the next one: the counter restarts, the
 * same way a broken streak does, and nothing here scolds the reader for it.
 */
function describeStanding(
  cycle: GoalCycle,
  daysRemaining: number,
  nextMonthLabel: string,
): string {
  if (cycle.marginInCents < 0) {
    return `Você passou o teto em ${formatBRL(-cycle.marginInCents)}. O teto recomeça em ${nextMonthLabel}, e os meses anteriores continuam valendo.`;
  }
  return `Faltam ${formatBRL(cycle.marginInCents)} para chegar ao teto. ${describeDaysRemaining(daysRemaining)}`;
}

function describeDaysRemaining(daysRemaining: number): string {
  if (daysRemaining === 0) return 'Hoje é o último dia do mês.';
  if (daysRemaining === 1) return 'Falta 1 dia para o mês fechar.';
  return `Faltam ${daysRemaining} dias para o mês fechar.`;
}
