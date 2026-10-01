/**
 * The shapes the Conquistas screen renders. They mirror what `gamification`'s
 * `Streak` aggregate will expose, so replacing the fixture is a change of source,
 * not of shape.
 *
 * A streak here is a stretch of **whole days with no detected bet**, and every
 * figure on this screen is derived from transactions the platform already read.
 * Nothing is declared by the user, which is what separates this half of the
 * gamification screen from the savings goals on `/goals`: a streak is measured.
 *
 * Two consequences the types carry on purpose:
 *
 * - **A streak can only be counted inside the period we have consent to read.**
 *   The oldest stretch runs off the edge of that window, so its length is a lower
 *   bound rather than a fact. `startsBeforeWindow` says which, and no copy may
 *   state a truncated length as exact.
 * - **A bet-free day is a day we looked at and found nothing**, never a day we
 *   have no data for. That only holds inside the window, which is why the window
 *   is part of the record instead of an implementation detail.
 */
import type { DetectionReason } from '../transactions/_ledger-entry';

/** The bet that ended a stretch, named so the record stays auditable. */
export type StreakBreak = {
  readonly counterparty: string;
  readonly matchedBy: DetectionReason;
  readonly onLabel: string;
  readonly daysAgo: number;
};

export type BetFreeStreak = {
  /** Whole days in the stretch. A lower bound when `startsBeforeWindow`. */
  readonly lengthInDays: number;
  /** Its oldest day, counted back from today. */
  readonly startedDaysAgo: number;
  /** Its newest day, counted back from today. */
  readonly endedDaysAgo: number;
  readonly startedOnLabel: string;
  readonly endedOnLabel: string;
  /** True when the stretch reaches the edge of the data we hold. */
  readonly startsBeforeWindow: boolean;
  /** What ended it. Every closed stretch has one; the window edge is not a break. */
  readonly endedBy: StreakBreak;
};

/**
 * The stretch under way.
 *
 * It counts **complete** bet-free days and excludes today, because today is not
 * over — and because the module extends a streak on the daily clock tick, which
 * only fires once a day has ended. So a bet yesterday and a quiet today still
 * read as zero, and the copy says the day is in progress rather than claiming it.
 */
export type CurrentStreak = {
  readonly days: number;
  /** Why the count reads zero, where it does: a bet was detected today. */
  readonly hasBetToday: boolean;
  /** The most recent bet in the window, or `null` when it holds none. */
  readonly lastBreak: StreakBreak | null;
};

export type StreakRecord = {
  readonly current: CurrentStreak;
  /** The longest stretch in the window, `null` when every day in it had a bet. */
  readonly longest: BetFreeStreak | null;
  /** Closed stretches, longest first. The one under way is not among them. */
  readonly closedStreaks: readonly BetFreeStreak[];
  readonly betFreeDayCount: number;
  readonly betDayCount: number;
  /** Days of statement data this record was counted over. */
  readonly windowDayCount: number;
  readonly windowStartLabel: string;
};

/** One day in the calendar strip. */
export type StreakDay = {
  readonly daysAgo: number;
  readonly dateLabel: string;
  readonly hasBet: boolean;
  /** Today is drawn apart from the rest: it is still in progress. */
  readonly isToday: boolean;
};
