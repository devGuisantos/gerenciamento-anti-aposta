import { Card, CardContent } from '@/components/ui/card';
import { formatBRL } from '@shared/ui/money-text';

import { summariseSavings, type SavingsGoalRow } from '../_savings-goals-view';
import { NewSavingsGoalDialog } from './new-savings-goal-dialog';
import { SavingsGoalCard } from './savings-goal-card';

/**
 * The goals the user puts money aside for.
 *
 * Kept visibly apart from the betting ceiling below it, because the two are known
 * in completely different ways: the ceiling is measured from transactions we read,
 * and everything here is what the user told us. The section says so once, plainly,
 * rather than leaving somebody to assume the app is watching their savings.
 */
export function SavingsGoalsSection({ goals }: { readonly goals: readonly SavingsGoalRow[] }) {
  const summary = summariseSavings(goals);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Metas de dinheiro</h2>
          <p className="text-sm text-muted-foreground">
            {describeSummary(summary)} Os valores são os que você registra — a plataforma não
            movimenta dinheiro nem lê a sua poupança.
          </p>
        </div>

        <NewSavingsGoalDialog />
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Você ainda não tem metas de dinheiro. Crie a primeira dizendo quanto quer juntar e para
            quê — o valor guardado você anota quando separar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <SavingsGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </section>
  );
}

/** Counts what there is and stops — no encouragement, no scoreboard. */
function describeSummary(summary: ReturnType<typeof summariseSavings>): string {
  if (summary.goalCount === 0) return 'Nenhuma meta criada ainda.';

  const goals = summary.goalCount === 1 ? '1 meta' : `${summary.goalCount} metas`;
  const reached = summary.reachedCount > 0 ? ` ${summary.reachedCount} já alcançada(s).` : '';

  return `${formatBRL(summary.savedInCents)} guardados em ${goals}, de ${formatBRL(summary.targetInCents)} no total.${reached}`;
}
