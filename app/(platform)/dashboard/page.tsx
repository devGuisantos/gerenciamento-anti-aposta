import type { Metadata } from 'next';

import { readSessionToken, requireSession } from '@modules/identity';

import { StatementUnavailable } from '../transactions/_components/statement-unavailable';
import { BetSpendHero } from './_components/bet-spend-hero';
import { CeilingCard } from './_components/ceiling-card';
import { ConnectedAccountsCard } from './_components/connected-accounts-card';
import { IncomeShareTile } from './_components/income-share-tile';
import { RecentTransactionsCard } from './_components/recent-transactions-card';
import { StreakTile } from './_components/streak-tile';
import {
  DASHBOARD_WINDOW_IN_DAYS,
  readDashboardSnapshot,
  type DashboardSnapshot,
} from './_dashboard-snapshot';

export const metadata: Metadata = {
  title: 'Início',
  description: 'Seu panorama financeiro e o custo real das apostas.',
};

/** One person's data, and the goal card reads the month under way. */
export const dynamic = 'force-dynamic';

/** "Olá, Maria" rather than "Olá, Maria Aparecida dos Santos". */
function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export default async function DashboardPage() {
  const user = await requireSession();
  const token = await readSessionToken();

  if (token === null) {
    return null;
  }

  const snapshot = await readDashboardSnapshot(token);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Olá, {firstNameOf(user.name)}
        </h1>
        <p className="text-sm text-muted-foreground">
          Este é o retrato das contas que você conectou. Os números são retrospectivos: eles
          mostram o que já aconteceu, não bloqueiam nada.
        </p>
      </div>

      {snapshot.kind === 'UNAVAILABLE' ? (
        <StatementUnavailable reason={snapshot.reason} />
      ) : (
        <DashboardOverview snapshot={snapshot} />
      )}
    </div>
  );
}

function DashboardOverview({
  snapshot,
}: {
  readonly snapshot: Extract<DashboardSnapshot, { kind: 'READ' }>;
}) {
  return (
    <>
      <BetSpendHero cost={snapshot.cost} days={DASHBOARD_WINDOW_IN_DAYS} />

      <div className="grid gap-4 sm:grid-cols-2">
        <StreakTile streak={snapshot.streak} />
        <IncomeShareTile incomeShare={snapshot.cost.incomeShare} days={DASHBOARD_WINDOW_IN_DAYS} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RecentTransactionsCard transactions={snapshot.recentTransactions} />

        <div className="space-y-4">
          <CeilingCard section={snapshot.ceiling} />
          <ConnectedAccountsCard accounts={snapshot.accounts} />
        </div>
      </div>
    </>
  );
}
