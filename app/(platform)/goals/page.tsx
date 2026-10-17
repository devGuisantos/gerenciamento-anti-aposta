import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { describeBettingCeiling, listSavingsGoals, type BettingCeilingOverview } from '@modules/gamification';
import { readSessionToken, requireSession } from '@modules/identity';
import { assertNever } from '@shared/domain/assert-never';
import type { BackendResult } from '@shared/infrastructure/backend-api';

import {
  StatementUnavailable,
  type StatementUnavailableReason,
} from '../transactions/_components/statement-unavailable';
import {
  toCurrentCycleRow,
  toCycleRow,
  toMonthName,
  toRateLabel,
  toScheduledCeiling,
  toSimulatorModel,
} from './_ceiling-view';
import { CeilingSimulator } from './_components/ceiling-simulator';
import { CurrentCycleCard } from './_components/current-cycle-card';
import { GoalCycleList } from './_components/goal-cycle-list';
import { SavingsGoalsSection } from './_components/savings-goals-section';
import { toSavingsGoalRows } from './_savings-goals-view';

export const metadata: Metadata = {
  title: 'Metas',
  description: 'O teto que você definiu para gastos com apostas, e como cada mês ficou nele.',
};

/** One person's data, and every label is relative to today: which month is open, and how much is left. */
export const dynamic = 'force-dynamic';

export default async function GoalsPage() {
  await requireSession();
  const token = await readSessionToken();

  if (token === null) {
    return null;
  }

  const [savings, ceiling] = await Promise.all([
    listSavingsGoals(token),
    describeBettingCeiling(token),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* No visible header: each section names itself. The `h1` stays for anyone
          navigating by headings, who would otherwise land on a page with none. */}
      <h1 className="sr-only">Metas</h1>

      {savings.ok ? (
        <SavingsGoalsSection goals={toSavingsGoalRows(savings.value.items)} />
      ) : (
        <StatementUnavailable reason={{ kind: 'FAILED', message: savings.failure.message }} />
      )}

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

        <CeilingBody result={ceiling} />
      </section>
    </div>
  );
}

/**
 * No consent is not zero. Without a statement that is ready, the measured half
 * renders a sentence — never a R$ 0,00 hero that would read as "you did not
 * bet this month", a claim nothing here can support.
 */
function unavailableReason(
  syncStatus: BettingCeilingOverview['syncStatus'],
): StatementUnavailableReason | null {
  switch (syncStatus) {
    case 'NO_CONSENT':
      return { kind: 'NO_CONSENT' };
    case 'SYNCING':
      return { kind: 'SYNCING' };
    case 'READY':
      return null;
    default:
      return assertNever(syncStatus);
  }
}

function CeilingBody({ result }: { readonly result: BackendResult<BettingCeilingOverview> }) {
  if (!result.ok) {
    return <StatementUnavailable reason={{ kind: 'FAILED', message: result.failure.message }} />;
  }

  const overview = result.value;
  const reason = unavailableReason(overview.syncStatus);

  if (reason !== null) {
    return <StatementUnavailable reason={reason} />;
  }

  const rateLabel = toRateLabel(overview.annualRatePercent);

  return (
    <>
      {overview.current === null ? (
        <NoGoalCard />
      ) : (
        <CurrentCycleCard
          cycle={toCurrentCycleRow(overview.current)}
          daysRemaining={overview.month.daysRemaining}
          nextMonthLabel={toMonthName(overview.month.nextMonthKey)}
          rateLabel={rateLabel}
          scheduled={toScheduledCeiling(overview.scheduled)}
        />
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
            <GoalCycleList cycles={overview.cycles.map(toCycleRow)} />
          </CardContent>
        </Card>

        <CeilingSimulator model={toSimulatorModel(overview)} rateLabel={rateLabel} />
      </div>
    </>
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
