/**
 * The ceiling cycles over the **fixtures**, for the dashboard card and
 * `/achievements` only. **`/goals` no longer reads this file** — it reads
 * `gamification` on the backend through `_ceiling-view.ts`, where the cycles
 * and the simulator are computed and tested.
 *
 * TODO(gamification): retires with the dashboard's and `/achievements`' other
 * fixtures, when both read `GET /betting-ceiling`. Nothing new belongs here.
 */
import { formatBRL } from '@shared/ui/money-text';

import type { Goal } from './_goal';

/** One month's betting total, newest first. `monthsAgo` 0 is the current month. */
export type MonthlyBetTotal = {
  readonly monthsAgo: number;
  readonly betsInCents: number;
};

/** The current month is still open, so it has no outcome yet — only a state. */
export type CycleStatus = 'ACTIVE' | 'REACHED' | 'MISSED';

export type GoalCycle = {
  readonly monthsAgo: number;
  readonly monthLabel: string;
  readonly ceilingInCents: number;
  readonly destination: string;
  readonly spentInCents: number;
  readonly status: CycleStatus;
  /** Positive while spending stayed under the ceiling, negative once it passed. */
  readonly marginInCents: number;
  /** Uncapped on purpose — the bar caps it, the words keep the real number. */
  readonly usedPercentage: number;
};

const MONTH_AND_YEAR_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
});

function toFirstOfMonth(reference: Date, monthsAgo: number): Date {
  return new Date(reference.getFullYear(), reference.getMonth() - monthsAgo, 1);
}

export function toMonthLabel(monthsAgo: number, reference: Date): string {
  return MONTH_AND_YEAR_FORMAT.format(toFirstOfMonth(reference, monthsAgo));
}

/**
 * A goal governs every month from the one it was set in down to the one that
 * replaced it — exclusive, because the replacement governs that month itself.
 */
function coversMonth(goal: Goal, monthsAgo: number): boolean {
  const lastCoveredMonth = goal.replacedMonthsAgo === null ? 0 : goal.replacedMonthsAgo + 1;
  return monthsAgo <= goal.setMonthsAgo && monthsAgo >= lastCoveredMonth;
}

/**
 * A ceiling of zero is a real goal — "não apostar nada" — so it needs an answer
 * rather than a division by zero. Any spending against it is the bar's full width.
 */
function toUsedPercentage(spentInCents: number, ceilingInCents: number): number {
  if (ceilingInCents === 0) return spentInCents === 0 ? 0 : 100;
  return Math.round((spentInCents / ceilingInCents) * 100);
}

function toCycleStatus(monthsAgo: number, marginInCents: number): CycleStatus {
  if (monthsAgo === 0) return 'ACTIVE';
  return marginInCents >= 0 ? 'REACHED' : 'MISSED';
}

function toCycle(goal: Goal, month: MonthlyBetTotal, reference: Date): GoalCycle {
  const marginInCents = goal.ceilingInCents - month.betsInCents;

  return {
    monthsAgo: month.monthsAgo,
    monthLabel: toMonthLabel(month.monthsAgo, reference),
    ceilingInCents: goal.ceilingInCents,
    destination: goal.destination,
    spentInCents: month.betsInCents,
    status: toCycleStatus(month.monthsAgo, marginInCents),
    marginInCents,
    usedPercentage: toUsedPercentage(month.betsInCents, goal.ceilingInCents),
  };
}

/**
 * Months before the first goal simply have no cycle. Measuring them against a
 * ceiling the user had not chosen yet would invent a failure they never agreed to.
 */
export function selectCycles(
  goals: readonly Goal[],
  months: readonly MonthlyBetTotal[],
  reference: Date,
): readonly GoalCycle[] {
  return months
    .map((month) => {
      const goal = goals.find((candidate) => coversMonth(candidate, month.monthsAgo));
      return goal ? toCycle(goal, month, reference) : null;
    })
    .filter((cycle) => cycle !== null);
}

/**
 * How far a month sat from its ceiling, in one phrase. Shared so the goal screen
 * and the dashboard card cannot word the same fact two different ways.
 *
 * It reports a distance and nothing more. "R$ 640,00 acima do teto" is something
 * the reader can do what they like with; anything warmer or colder would be the
 * product having an opinion about their month.
 */
export function describeCycleMargin(cycle: Pick<GoalCycle, 'marginInCents'>): string {
  const distance = formatBRL(Math.abs(cycle.marginInCents));
  return cycle.marginInCents < 0 ? `${distance} acima do teto` : `${distance} abaixo do teto`;
}
