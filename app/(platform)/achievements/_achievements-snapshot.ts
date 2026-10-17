/**
 * Everything `/achievements` and `/achievements/[family]` show, derived once per
 * request from the same fixtures.
 *
 * Both screens read it so a badge cannot be earned on one and missing on the
 * other: the family page is the same record, opened further, never a second
 * evaluation that could disagree with the summary that linked to it.
 *
 * TODO(gamification): retires with the fixtures, when both screens read the
 * module's `BadgeCollection` and `Streak` from the backend.
 */
import { selectCycles, toMonthLabel, type MonthlyBetTotal } from '../goals/_goals-view';
import { GOALS } from '../goals/_mock-goals';
import { listSavingsGoals } from '../goals/_savings-goals-store';
import { toSavingsGoalRows } from '../goals/_savings-goals-view';
import { toLedgerRows } from '../transactions/_ledger-view';
import { buildLedgerEntries } from '../transactions/_mock-ledger';
import { toSupportSignal } from '../transactions/_support-signal';
import { MONTHLY_HISTORY } from '../transactions/insights/_mock-monthly-history';
import { toBadgeAwards, type BadgeAward, type ClosedMonth } from './_badges-view';
import type { StreakDay, StreakRecord } from './_streak';
import { toBetDays, toDataWindow, toStreakDays, toStreakRecord } from './_streak-view';

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
 * these are the gamification screens: the offer goes above everything, and the
 * nudge toward the next milestone is withheld while it stands.
 */
export const SUPPORT_SIGNAL = toSupportSignal(MONTHLY_HISTORY.map((month) => month.bets));

export type AchievementsSnapshot = {
  readonly streaks: StreakRecord;
  readonly calendarDays: readonly StreakDay[];
  readonly awards: readonly BadgeAward[];
};

/**
 * Closed months only, everywhere it matters: the open month is half a month, and
 * a badge awarded on it could be undone by its last ten days.
 */
function toClosedMonths(reference: Date): readonly ClosedMonth[] {
  return MONTHLY_HISTORY.filter((month) => month.monthsAgo > 0).map((month) => ({
    monthsAgo: month.monthsAgo,
    monthLabel: toMonthLabel(month.monthsAgo, reference),
    betsInCents: month.bets,
  }));
}

export function readAchievementsSnapshot(reference: Date): AchievementsSnapshot {
  /* Streaks are derived from the statement, never stored. The ledger is the same
     one `/transactions` renders, so a day marked bet-free here is a day with no
     betting row there. */
  const rows = toLedgerRows(buildLedgerEntries(reference), reference);
  const betDays = toBetDays(rows, reference);
  const dataWindow = toDataWindow(OLDEST_MONTHS_AGO, reference);
  const streaks = toStreakRecord(betDays, dataWindow, reference);

  const awards = toBadgeAwards({
    streaks,
    cycles: selectCycles(GOALS, MONTHS, reference).filter((cycle) => cycle.monthsAgo > 0),
    months: toClosedMonths(reference),
    savings: toSavingsGoalRows(listSavingsGoals()),
  });

  return {
    streaks,
    calendarDays: toStreakDays(betDays, CALENDAR_DAY_COUNT, dataWindow, reference),
    awards,
  };
}
