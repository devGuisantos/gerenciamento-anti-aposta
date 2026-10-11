import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { MONTHLY_HISTORY } from '../transactions/insights/_mock-monthly-history';
import { CeilingSimulator } from './_components/ceiling-simulator';
import { CurrentCycleCard } from './_components/current-cycle-card';
import { GoalCycleList } from './_components/goal-cycle-list';
import { SavingsGoalsSection } from './_components/savings-goals-section';
import { listSavingsGoals } from './_savings-goals-store';
import { toSavingsGoalRows } from './_savings-goals-view';
import {
  countDaysRemainingInMonth,
  selectActiveGoal,
  selectCycles,
  toCeilingCap,
  toNextMonthLabel,
  type MonthlyBetTotal,
} from './_goals-view';
import { GOALS } from './_mock-goals';
import { requireSession } from '@modules/identity';

export const metadata: Metadata = {
  title: 'Metas',
  description: 'O teto que você definiu para gastos com apostas, e como cada mês ficou nele.',
};

/** Every label here is relative to today: which month is open, and how much of it is left. */
export const dynamic = 'force-dynamic';

/* The same monthly totals the charts read, so a month inside the ceiling here is
   the same figure on every other screen. */
const MONTHS: readonly MonthlyBetTotal[] = MONTHLY_HISTORY.map((month) => ({
  monthsAgo: month.monthsAgo,
  betsInCents: month.bets,
}));

/** The open month is half a month; counting it would understate every ceiling tried. */
const CLOSED_MONTHS = MONTHS.filter((month) => month.monthsAgo > 0);

const CEILING_CAP_IN_CENTS = toCeilingCap(MONTHS);

export default async function GoalsPage() {
  await requireSession();
  const reference = new Date();
  const cycles = selectCycles(GOALS, MONTHS, reference);
  const currentCycle = cycles.find((cycle) => cycle.monthsAgo === 0);
  const closedCycles = cycles.filter((cycle) => cycle.monthsAgo > 0);
  const activeGoal = selectActiveGoal(GOALS);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Metas</h1>
        <p className="text-sm text-muted-foreground">
          Duas coisas diferentes com o mesmo nome: o dinheiro que você está juntando, que você
          registra, e o teto de gastos com apostas, que a gente mede no seu extrato. Quem escolhe
          os valores é você.
        </p>
      </div>

      <SavingsGoalsSection goals={toSavingsGoalRows(listSavingsGoals())} />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Teto de gastos com apostas
          </h2>
          <p className="text-sm text-muted-foreground">
            Quanto você decidiu, no máximo, deixar ir para apostas em um mês. Este é medido
            automaticamente nas transações que já chegaram.
          </p>
        </div>

        {currentCycle ? (
          <CurrentCycleCard
            cycle={currentCycle}
            daysRemaining={countDaysRemainingInMonth(reference)}
            nextMonthLabel={toNextMonthLabel(reference)}
          />
        ) : (
          <NoGoalCard />
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Meses anteriores</CardTitle>
              <CardDescription>
                Como cada mês fechado ficou em relação ao teto que valia nele.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoalCycleList cycles={closedCycles} />
            </CardContent>
          </Card>

          <CeilingSimulator
            months={CLOSED_MONTHS}
            capInCents={CEILING_CAP_IN_CENTS}
            initialCeilingInCents={activeGoal?.ceilingInCents ?? CEILING_CAP_IN_CENTS / 2}
          />
        </div>
      </section>
    </div>
  );
}

function NoGoalCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Você ainda não definiu um teto</CardTitle>
        <CardDescription>
          Um teto é o máximo que você decide deixar ir para apostas em um mês. Use o simulador
          abaixo para ver o que cada valor teria significado nos seus últimos meses.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
