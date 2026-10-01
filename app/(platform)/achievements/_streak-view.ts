/**
 * Presentation model for the bet-free streaks.
 *
 * The streaks are **derived from the statement every time**, never written down.
 * A stored counter and a list of transactions are two things that can disagree,
 * and the one the user would believe is the counter — which is the one that would
 * be wrong. An earlier fixture held `betFreeStreakDays: 3` by hand while the
 * statement showed a bet on that same day; deriving it is what makes that
 * impossible.
 *
 * Every function is pure and takes its days and its reference date as arguments,
 * so the page is the only file that knows where the numbers come from.
 *
 * TODO(gamification): this is the `Streak` aggregate's read model. `toStreakRecord`
 * is the arithmetic the module owns and it belongs there with tests — the single
 * bet-free day, the stretch that touches the window edge, and the window with no
 * bets at all, none of which is covered anywhere today.
 *
 * TODO(gamification): day boundaries here are the server's local midnight, the
 * same ones the statement groups by. The module resolves them in
 * `America/Sao_Paulo` through the injected `Clock`, or somebody betting near
 * midnight loses a day for no reason.
 */
import { countDaysAgo, type LedgerRow } from '../transactions/_ledger-view';
import type {
  BetFreeStreak,
  CurrentStreak,
  StreakBreak,
  StreakDay,
  StreakRecord,
} from './_streak';

const FULL_DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

/** Unambiguous inside a window of at most twelve months, and far shorter to read. */
const DAY_AND_MONTH_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
});

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

/**
 * The period the streaks are counted over: the statement data we actually hold.
 *
 * It is part of the record rather than a detail, because a bet-free day is a day
 * we looked at and found nothing. Outside this window we found nothing because we
 * were not looking, and the two must never be presented as the same thing.
 */
export type DataWindow = {
  readonly dayCount: number;
  readonly startLabel: string;
};

export function toDataWindow(oldestMonthsAgo: number, reference: Date): DataWindow {
  const start = new Date(reference.getFullYear(), reference.getMonth() - oldestMonthsAgo, 1);
  return {
    dayCount: countDaysAgo(start, reference) + 1,
    startLabel: FULL_DATE_FORMAT.format(start),
  };
}

function toDate(daysAgo: number, reference: Date): Date {
  return new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - daysAgo);
}

/**
 * The days a bet was detected on, keyed by how many days ago they were.
 *
 * Rows arrive newest first, so overwriting keeps the **earliest** bet of a day —
 * the one that actually ended the stretch running into it.
 */
export function toBetDays(
  rows: readonly LedgerRow[],
  reference: Date,
): ReadonlyMap<number, StreakBreak> {
  const betDays = new Map<number, StreakBreak>();

  for (const row of rows) {
    if (row.bet === undefined) continue;
    betDays.set(row.daysAgo, {
      counterparty: row.counterparty,
      matchedBy: row.bet.matchedBy,
      onLabel: FULL_DATE_FORMAT.format(toDate(row.daysAgo, reference)),
      daysAgo: row.daysAgo,
    });
  }

  return betDays;
}

/** A stretch of bet-free days while it is still being walked. */
type OpenRun = { readonly newestDaysAgo: number; oldestDaysAgo: number };

function toStreak(
  run: OpenRun,
  endedBy: StreakBreak,
  startsBeforeWindow: boolean,
  reference: Date,
): BetFreeStreak {
  return {
    lengthInDays: run.oldestDaysAgo - run.newestDaysAgo + 1,
    startedDaysAgo: run.oldestDaysAgo,
    endedDaysAgo: run.newestDaysAgo,
    startedOnLabel: DAY_AND_MONTH_FORMAT.format(toDate(run.oldestDaysAgo, reference)),
    endedOnLabel: DAY_AND_MONTH_FORMAT.format(toDate(run.newestDaysAgo, reference)),
    startsBeforeWindow,
    endedBy,
  };
}

/**
 * The complete bet-free days immediately before today.
 *
 * Today is excluded because it is not over. The module extends a streak on the
 * daily clock tick, which only fires once a day has ended, so a quiet morning has
 * not earned a day yet — and a screen that counted it would drop back to zero the
 * moment a bet arrived that evening.
 */
function toCurrentStreak(betDays: ReadonlyMap<number, StreakBreak>): CurrentStreak {
  if (betDays.size === 0) return { days: 0, hasBetToday: false, lastBreak: null };

  const lastBetDaysAgo = Math.min(...betDays.keys());

  return {
    days: Math.max(0, lastBetDaysAgo - 1),
    hasBetToday: lastBetDaysAgo === 0,
    lastBreak: betDays.get(lastBetDaysAgo) ?? null,
  };
}

/**
 * Walks the window from today backwards and cuts it into bet-free stretches.
 *
 * The bet that **ended** a stretch is the one on the day just after its newest
 * day, never the one the walk runs into — that older bet is what ended the
 * stretch before this one. Getting this backwards reads perfectly plausibly and
 * is wrong by one bet.
 *
 * A stretch reaching the far edge of the window is kept with its length marked as
 * a lower bound: we know it ran at least that long, and we have no right to say
 * it started there.
 */
export function toStreakRecord(
  betDays: ReadonlyMap<number, StreakBreak>,
  dataWindow: DataWindow,
  reference: Date,
): StreakRecord {
  const closed: BetFreeStreak[] = [];
  let run: OpenRun | null = null;

  for (let daysAgo = 0; daysAgo < dataWindow.dayCount; daysAgo += 1) {
    if (betDays.has(daysAgo)) {
      if (run !== null) closed.push(...toClosedStreak(run, betDays, false, reference));
      run = null;
      continue;
    }
    if (run === null) run = { newestDaysAgo: daysAgo, oldestDaysAgo: daysAgo };
    else run.oldestDaysAgo = daysAgo;
  }

  if (run !== null) closed.push(...toClosedStreak(run, betDays, true, reference));

  const byLengthDescending = closed.toSorted(
    (left, right) => right.lengthInDays - left.lengthInDays,
  );

  return {
    current: toCurrentStreak(betDays),
    longest: byLengthDescending.at(0) ?? null,
    closedStreaks: byLengthDescending,
    betFreeDayCount: dataWindow.dayCount - betDays.size,
    betDayCount: betDays.size,
    windowDayCount: dataWindow.dayCount,
    windowStartLabel: dataWindow.startLabel,
  };
}

/**
 * A stretch touching today is the one under way: nothing ended it, so it is not
 * part of the record. Returning none or one keeps the caller free of a null check
 * it would otherwise repeat at both call sites.
 */
function toClosedStreak(
  run: OpenRun,
  betDays: ReadonlyMap<number, StreakBreak>,
  startsBeforeWindow: boolean,
  reference: Date,
): readonly BetFreeStreak[] {
  const endedBy = betDays.get(run.newestDaysAgo - 1);
  return endedBy ? [toStreak(run, endedBy, startsBeforeWindow, reference)] : [];
}

/**
 * The most recent days, newest first, for the calendar strip.
 *
 * Capped at the window, because a cell for a day we hold no data on would read as
 * a bet-free day — which is the one thing it is not.
 */
export function toStreakDays(
  betDays: ReadonlyMap<number, StreakBreak>,
  dayCount: number,
  dataWindow: DataWindow,
  reference: Date,
): readonly StreakDay[] {
  return Array.from({ length: Math.min(dayCount, dataWindow.dayCount) }, (_, daysAgo) => ({
    daysAgo,
    dateLabel: WEEKDAY_FORMAT.format(toDate(daysAgo, reference)),
    hasBet: betDays.has(daysAgo),
    isToday: daysAgo === 0,
  }));
}

/**
 * How long a stretch was, in words, with the lower bound said out loud wherever
 * the window cut it off. Shared so no two cards word the same fact differently.
 */
export function describeStreakLength(streak: BetFreeStreak): string {
  return streak.startsBeforeWindow
    ? `pelo menos ${describeDays(streak.lengthInDays)}`
    : describeDays(streak.lengthInDays);
}

export function describeDays(days: number): string {
  return days === 1 ? '1 dia' : `${days} dias`;
}
