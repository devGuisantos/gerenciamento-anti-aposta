/**
 * How the bet-free streaks are worded, shared by `/achievements` and the
 * dashboard so no two cards word the same fact differently.
 *
 * The streaks themselves are `gamification`'s `StreakRecord`, derived on the
 * backend from the statement on every read and shaped by `_achievements-view.ts`.
 * An earlier version of this file derived them here from a fixture ledger; a
 * counter computed in two places is a counter that can disagree with itself.
 */
import type { BetFreeStreak } from './_streak';

/**
 * How long a stretch was, in words, with the lower bound said out loud wherever
 * the window cut it off.
 */
export function describeStreakLength(streak: BetFreeStreak): string {
  return streak.startsBeforeWindow
    ? `pelo menos ${describeDays(streak.lengthInDays)}`
    : describeDays(streak.lengthInDays);
}

export function describeDays(days: number): string {
  return days === 1 ? '1 dia' : `${days} dias`;
}
