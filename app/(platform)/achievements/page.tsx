import type { Metadata } from 'next';

import { selectCycles, toMonthLabel, type MonthlyBetTotal } from '../goals/_goals-view';
import { GOALS } from '../goals/_mock-goals';
import { listSavingsGoals } from '../goals/_savings-goals-store';
import { toSavingsGoalRows } from '../goals/_savings-goals-view';
import { SupportCard } from '../transactions/_components/support-card';
import { toLedgerRows } from '../transactions/_ledger-view';
import { buildLedgerEntries } from '../transactions/_mock-ledger';
import { toSupportSignal } from '../transactions/_support-signal';
import { selectAllBetTotalsNewestFirst } from '../transactions/insights/_insights-view';
import { MONTHLY_HISTORY } from '../transactions/insights/_mock-monthly-history';
import { selectNextMilestone, toBadgeAwards, type ClosedMonth } from './_badges-view';
import { BadgeCollection } from './_components/badge-collection';
import { NextMilestoneCard } from './_components/next-milestone-card';
import { StreakCalendar } from './_components/streak-calendar';
import { StreakHero } from './_components/streak-hero';
import { StreakRecordList } from './_components/streak-record-list';
import { toBetDays, toDataWindow, toStreakDays, toStreakRecord } from './_streak-view';
import { requireSession } from '@modules/identity';

export const metadata: Metadata = {
  title: 'Conquistas',
  description: 'Dias sem apostas e marcos alcançados, contados no extrato que você compartilhou.',
};

/**
 * Rendered per request. Every figure on this screen is relative to today — which
 * day the streak is counted to, which month closed last — and a static render
 * would freeze all of it at build time.
 */
export const dynamic = 'force-dynamic';

/** Two months of squares: long enough to show a pattern, short enough to read on a phone. */
const CALENDAR_DAY_COUNT = 60;

/* The same monthly totals the charts and the goal screen read, so a month that is
   inside the ceiling here cannot be a different figure there. */
const MONTHS: readonly MonthlyBetTotal[] = MONTHLY_HISTORY.map((month) => ({
  monthsAgo: month.monthsAgo,
  betsInCents: month.bets,
}));

/** How far back the statement data goes, which bounds every streak on the screen. */
const OLDEST_MONTHS_AGO = Math.max(...MONTHLY_HISTORY.map((month) => month.monthsAgo));

/**
 * The same signal `/transactions/insights` renders, from the same totals and under
 * the same dismissal — one offer, dismissed once.
 *
 * It matters more here than anywhere else in the app. The product rule is that
 * sustained betting surfaces support resources *instead of* more gamification, and
 * this is the gamification screen: the offer goes above everything, and the nudge
 * toward the next milestone is withheld while it stands.
 */
const SUPPORT_SIGNAL = toSupportSignal(selectAllBetTotalsNewestFirst());

export default async function AchievementsPage() {
  await requireSession();
  const reference = new Date();

  /* Streaks are derived from the statement, never stored. The ledger is the same
     one `/transactions` renders, so a day marked bet-free here is a day with no
     betting row there. */
  const rows = toLedgerRows(buildLedgerEntries(reference), reference);
  const betDays = toBetDays(rows, reference);
  const dataWindow = toDataWindow(OLDEST_MONTHS_AGO, reference);
  const streaks = toStreakRecord(betDays, dataWindow, reference);
  const days = toStreakDays(betDays, CALENDAR_DAY_COUNT, dataWindow, reference);

  /* Closed months only, everywhere it matters: the open month is half a month, and
     a badge awarded on it could be undone by its last ten days. */
  const closedCycles = selectCycles(GOALS, MONTHS, reference).filter(
    (cycle) => cycle.monthsAgo > 0,
  );
  const closedMonths: readonly ClosedMonth[] = MONTHLY_HISTORY.filter(
    (month) => month.monthsAgo > 0,
  ).map((month) => ({
    monthsAgo: month.monthsAgo,
    monthLabel: toMonthLabel(month.monthsAgo, reference),
    betsInCents: month.bets,
  }));

  const awards = toBadgeAwards({
    streaks,
    cycles: closedCycles,
    months: closedMonths,
    savings: toSavingsGoalRows(listSavingsGoals()),
  });

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Conquistas</h1>
        <p className="text-sm text-muted-foreground">
          Os dias que você passou sem apostas e os marcos que já alcançou. Tudo é contado no
          extrato que você compartilhou — nada é sorteado, nada aparece por surpresa, e nada aqui
          movimenta dinheiro.
        </p>
      </div>

      {/* Before the streak, before the badges. Somebody who needs a phone number
          should not have to scroll past a progress bar to find it. */}
      <SupportCard signal={SUPPORT_SIGNAL} />

      <StreakHero record={streaks} />

      <StreakCalendar days={days} />

      <div className={`grid gap-4 ${SUPPORT_SIGNAL.shouldOffer ? '' : 'lg:grid-cols-2'}`}>
        <StreakRecordList record={streaks} />
        {SUPPORT_SIGNAL.shouldOffer ? null : (
          <NextMilestoneCard award={selectNextMilestone(awards)} />
        )}
      </div>

      <BadgeCollection awards={awards} />
    </div>
  );
}
