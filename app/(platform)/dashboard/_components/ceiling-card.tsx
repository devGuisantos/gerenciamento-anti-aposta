import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { assertNever } from '@shared/domain/assert-never';
import { formatBRL } from '@shared/ui/money-text';
import { cn } from 'cn';

import { describeCycleMargin, type CurrentCycleRow } from '../../goals/_ceiling-view';
import type { CeilingSection } from '../_dashboard-snapshot';

const FULL_BAR = 100;
const TITLE = 'Sua meta';

/**
 * The month under way against the ceiling the user set, from the same read
 * `/goals` makes. It is a **calendar month**, unlike the hero's 30 days, because
 * that is what a ceiling governs — so the copy names the month.
 */
export function CeilingCard({ section }: { readonly section: CeilingSection }) {
  switch (section.kind) {
    case 'SET':
      return <MeasuredCeiling cycle={section.cycle} />;
    case 'NOT_SET':
      return (
        <CeilingNotice
          description="Você ainda não definiu um teto de gastos com apostas."
          action="Definir uma meta"
        />
      );
    case 'FAILED':
      return <CeilingNotice description="Não conseguimos carregar sua meta agora." action="Ver metas" />;
    default:
      return assertNever(section);
  }
}

function CeilingNotice({ description, action }: { readonly description: string; readonly action: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{TITLE}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm" className="h-9 w-full">
          <Link href="/goals">{action}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function MeasuredCeiling({ cycle }: { readonly cycle: CurrentCycleRow }) {
  const isOverCeiling = cycle.marginInCents < 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{TITLE}</CardTitle>
        <CardDescription>
          No máximo {formatBRL(cycle.ceilingInCents)} por mês
          {cycle.destination === null ? '' : ` · ${cycle.destination}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          {/* A betting amount, so it takes red for the same reason the hero does —
              unless it is zero, which is never red. */}
          <span
            className={cn(
              'font-heading text-xl font-semibold tracking-tight',
              cycle.spentInCents === 0 ? 'text-spend-none' : 'text-destructive',
            )}
          >
            {formatBRL(cycle.spentInCents)}
          </span>
          <span className="text-xs text-muted-foreground">
            de {formatBRL(cycle.ceilingInCents)}
          </span>
        </div>
        <Progress
          value={Math.min(cycle.usedPercentage, FULL_BAR)}
          aria-label={`Gasto com apostas em ${cycle.monthLabel}, contra o teto de ${formatBRL(cycle.ceilingInCents)}`}
          className={isOverCeiling ? '*:data-[slot=progress-indicator]:bg-destructive' : undefined}
        />
        <p className="text-xs text-muted-foreground">
          {describeCycleMargin(cycle)} em {cycle.monthLabel}. Você definiu este teto — pode
          mudá-lo quando quiser.
        </p>
        <Button asChild variant="outline" size="sm" className="h-9 w-full">
          <Link href="/goals">Ver metas</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
