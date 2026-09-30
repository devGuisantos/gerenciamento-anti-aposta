import { CircleCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatBRL } from '@shared/ui/money-text';

import { GOAL_PURPOSE_DESCRIPTORS } from '../_goal-purposes';
import type { SavingsGoalRow } from '../_savings-goals-view';
import { MovementHistoryDialog } from './movement-history-dialog';
import { RecordMovementDialog } from './record-movement-dialog';

const FULL_BAR = 100;

/**
 * One savings goal. A Server Component: only the three controls are client leaves.
 *
 * There is no red anywhere on this card, even when a goal loses money. Red in this
 * product means a gambling amount, and a withdrawal from the user's own savings is
 * not one of those — dressing it as a negative signal would be the app passing
 * judgement on a decision it knows nothing about.
 */
export function SavingsGoalCard({ goal }: { readonly goal: SavingsGoalRow }) {
  const { label: purposeLabel, icon: PurposeIcon } = GOAL_PURPOSE_DESCRIPTORS[goal.purpose];

  return (
    <Card className="justify-between">
      <CardHeader>
        {/* `min-w-0` is load-bearing on every level down to the text. `CardHeader` is
            a grid and this is a grid item, so it defaults to `min-width: auto` and
            refuses to shrink below its own content — the row then grows past the
            card and `Card`'s `overflow-hidden` cuts the badge in half instead of
            the title giving way. The title is what yields; the badge never does. */}
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <PurposeIcon aria-hidden className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0 space-y-0.5">
              {/* The full name is one tap away in both dialogs, which take it whole. */}
              <CardTitle className="truncate" title={goal.title}>
                {goal.title}
              </CardTitle>
              <p className="truncate text-xs text-muted-foreground">{purposeLabel}</p>
            </div>
          </div>

          {/* Marks a real milestone and nothing else — the badge appears only when
              the total the user set has actually been reached. */}
          {goal.isReached ? (
            <Badge variant="secondary" className="shrink-0">
              <CircleCheck aria-hidden />
              Alcançada
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-heading text-2xl font-semibold tracking-tight">
            {formatBRL(goal.savedInCents)}
          </span>
          <span className="text-xs text-muted-foreground">de {formatBRL(goal.targetInCents)}</span>
        </div>

        <Progress
          value={Math.min(goal.progressPercentage, FULL_BAR)}
          aria-label={`Progresso de ${goal.title}`}
        />

        <p className="text-xs text-muted-foreground">
          {goal.isReached
            ? `${goal.progressPercentage}% do total. Você chegou onde queria.`
            : `${goal.progressPercentage}% do total — faltam ${formatBRL(goal.remainingInCents)}.`}
        </p>

        <div className="flex gap-2">
          <RecordMovementDialog
            goalId={goal.id}
            goalTitle={goal.title}
            direction="DEPOSIT"
            savedInCents={goal.savedInCents}
          />
          <RecordMovementDialog
            goalId={goal.id}
            goalTitle={goal.title}
            direction="WITHDRAWAL"
            savedInCents={goal.savedInCents}
          />
        </div>

        <MovementHistoryDialog
          goalTitle={goal.title}
          savedInCents={goal.savedInCents}
          movements={goal.movements}
        />
      </CardContent>
    </Card>
  );
}
