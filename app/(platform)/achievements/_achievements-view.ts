/**
 * Presentation model for the streak: the backend's São Paulo day keys into
 * labels and distances from today, and nothing decided.
 *
 * Every figure arrives computed from `gamification`'s `StreakRecord` — which
 * day ended which stretch, which length is a lower bound, what the window is.
 * Days are labelled here in the same timezone the backend bucketed them in, so
 * a bet at 23:30 stays on the day it was placed.
 */
import type { BetDay, BetFreeStretch, StreakOverview } from '@modules/gamification';

import type { BetFreeStreak, StreakBreak, StreakDay, StreakRecord } from './_streak';

const TIME_ZONE = 'America/Sao_Paulo';
const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;

const FULL_DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

/** Unambiguous inside a window of at most twelve months, and far shorter to read. */
const DAY_AND_MONTH_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: 'long',
});

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

/** Midday UTC: the same calendar day in São Paulo whatever the offset. */
function middayOf(dayKey: string): Date {
  return new Date(`${dayKey}T12:00:00.000Z`);
}

/** "17 de outubro de 2026". */
export function toFullDateLabel(dayKey: string): string {
  return FULL_DATE_FORMAT.format(middayOf(dayKey));
}

/** "03 de dezembro". */
export function toDayAndMonthLabel(dayKey: string): string {
  return DAY_AND_MONTH_FORMAT.format(middayOf(dayKey));
}

/** Calendar days between two keys — arithmetic on the dates, so no daylight-saving hour moves it. */
function daysBetween(earlierKey: string, laterKey: string): number {
  return Math.round((middayOf(laterKey).getTime() - middayOf(earlierKey).getTime()) / MILLISECONDS_IN_A_DAY);
}

function toStreakBreak(bet: BetDay, todayKey: string): StreakBreak {
  return {
    counterparty: bet.counterparty,
    matchedBy: bet.matchedBy,
    onLabel: toFullDateLabel(bet.dayKey),
    daysAgo: daysBetween(bet.dayKey, todayKey),
  };
}

function toBetFreeStreak(stretch: BetFreeStretch, todayKey: string): BetFreeStreak {
  return {
    lengthInDays: stretch.lengthInDays,
    startedDaysAgo: daysBetween(stretch.firstDayKey, todayKey),
    endedDaysAgo: daysBetween(stretch.lastDayKey, todayKey),
    startedOnLabel: toDayAndMonthLabel(stretch.firstDayKey),
    endedOnLabel: toDayAndMonthLabel(stretch.lastDayKey),
    startsBeforeWindow: stretch.startsBeforeWindow,
    endedBy: toStreakBreak(stretch.endedBy, todayKey),
  };
}

export function toStreakRecord(streak: StreakOverview, todayKey: string): StreakRecord {
  const { current } = streak;

  return {
    current: {
      days: current.days,
      startsBeforeWindow: current.startsBeforeWindow,
      hasBetToday: current.hasBetToday,
      lastBreak: current.lastBet === null ? null : toStreakBreak(current.lastBet, todayKey),
    },
    longest: streak.longest === null ? null : toBetFreeStreak(streak.longest, todayKey),
    closedStreaks: streak.closedStreaks.map((stretch) => toBetFreeStreak(stretch, todayKey)),
    closedStreakCount: streak.closedStreakCount,
    betFreeDayCount: streak.betFreeDayCount,
    betDayCount: streak.betDayCount,
    windowDayCount: streak.window.dayCount,
    windowStartLabel: toFullDateLabel(streak.window.firstDayKey),
  };
}

/** Newest first, as the backend sends them and as the calendar strip expects. */
export function toStreakDays(streak: StreakOverview, todayKey: string): readonly StreakDay[] {
  return streak.recentDays.map((day) => ({
    daysAgo: daysBetween(day.dayKey, todayKey),
    dateLabel: WEEKDAY_FORMAT.format(middayOf(day.dayKey)),
    hasBet: day.hasBet,
    isToday: day.dayKey === todayKey,
  }));
}
