/**
 * Everything the dashboard shows, read once per request from the backend.
 *
 * The dashboard owns no figure. Each card is another screen's answer, read from
 * the same endpoint that screen reads, so the two cannot disagree: the hero is
 * `/bets` over 30 days, the streak is `/achievements`, the goal is `/goals`, the
 * rows are the statement.
 */
import {
  BET_WINDOWS_IN_DAYS,
  summariseBetting,
  type BetWindowInDays,
} from '@modules/bet-detection';
import {
  describeAchievements,
  describeBettingCeiling,
  type AchievementsOverview,
  type BettingCeilingOverview,
} from '@modules/gamification';
import {
  listConnectedAccounts,
  listRecentTransactions,
  type ConnectedAccount,
  type RecentTransaction,
} from '@modules/open-finance';
import type { BackendResult } from '@shared/infrastructure/backend-api';

import { toStreakRecord } from '../achievements/_achievements-view';
import type { StreakRecord } from '../achievements/_streak';
import { toBetCostView, type BetCostView } from '../bets/_bets-view';
import { toCurrentCycleRow, type CurrentCycleRow } from '../goals/_ceiling-view';
import type { StatementUnavailableReason } from '../transactions/_components/statement-unavailable';

/**
 * The shortest window `/bets` offers. Thirty days rather than the calendar month
 * so the figure does not drop to zero on the first of the month, and so "Ver
 * detalhes" opens the very slice the hero describes.
 */
export const DASHBOARD_WINDOW_IN_DAYS: BetWindowInDays = BET_WINDOWS_IN_DAYS[0];

/**
 * The goal card, or why there is none. A ceiling the user never set and a
 * ceiling we could not read are different sentences.
 */
export type CeilingSection =
  | { readonly kind: 'SET'; readonly cycle: CurrentCycleRow }
  | { readonly kind: 'NOT_SET' }
  | { readonly kind: 'FAILED' };

/**
 * `null` on the secondary cards means the read failed: the card says so in
 * place, and the rest of the dashboard still renders.
 */
export type DashboardSnapshot =
  | { readonly kind: 'UNAVAILABLE'; readonly reason: StatementUnavailableReason }
  | {
      readonly kind: 'READ';
      readonly cost: BetCostView;
      readonly streak: StreakRecord | null;
      readonly ceiling: CeilingSection;
      readonly recentTransactions: readonly RecentTransaction[] | null;
      readonly accounts: readonly ConnectedAccount[] | null;
    };

function toStreak(result: BackendResult<AchievementsOverview>): StreakRecord | null {
  if (!result.ok || result.value.streak === null) return null;
  return toStreakRecord(result.value.streak, result.value.todayKey);
}

function toCeilingSection(result: BackendResult<BettingCeilingOverview>): CeilingSection {
  if (!result.ok) return { kind: 'FAILED' };
  const { current } = result.value;
  return current === null ? { kind: 'NOT_SET' } : { kind: 'SET', cycle: toCurrentCycleRow(current) };
}

function orNull<T>(result: BackendResult<T>): T | null {
  return result.ok ? result.value : null;
}

/**
 * The reads run together; the betting summary decides whether there is a
 * dashboard at all. No consent is not zero: without a ready statement the
 * screen says why in one place, rather than five cards each reading R$ 0,00.
 *
 * Reading the achievements awards whatever fell due since the last look, as it
 * does on `/achievements`; the celebration arrives over the notification stream.
 */
export async function readDashboardSnapshot(sessionToken: string): Promise<DashboardSnapshot> {
  const [summary, achievements, ceiling, recentTransactions, accounts] = await Promise.all([
    summariseBetting(sessionToken, DASHBOARD_WINDOW_IN_DAYS),
    describeAchievements(sessionToken),
    describeBettingCeiling(sessionToken),
    listRecentTransactions(sessionToken),
    listConnectedAccounts(sessionToken),
  ]);

  if (!summary.ok) {
    return { kind: 'UNAVAILABLE', reason: { kind: 'FAILED', message: summary.failure.message } };
  }
  if (summary.value.syncStatus !== 'READY') {
    return { kind: 'UNAVAILABLE', reason: { kind: summary.value.syncStatus } };
  }

  return {
    kind: 'READ',
    cost: toBetCostView(summary.value, DASHBOARD_WINDOW_IN_DAYS),
    streak: toStreak(achievements),
    ceiling: toCeilingSection(ceiling),
    recentTransactions: orNull(recentTransactions),
    accounts: orNull(accounts),
  };
}
