/**
 * Presentation model for the Metas screen.
 *
 * It reads the **same monthly totals the charts read**, so a month that is inside
 * the ceiling here cannot be a different figure on `/transactions/insights`.
 * Nothing here decides what a bet is: `bet-detection` already did, and this only
 * measures what it found against a ceiling the user chose.
 *
 * Every function is pure and takes its months as an argument rather than
 * importing the fixture, so the page is the only file that knows where the
 * numbers come from.
 *
 * TODO(gamification): `GoalCycle` is the `Goal` aggregate's monthly outcome seen
 * from outside, and `simulateCeiling` is a domain service — both belong in the
 * module with tests, the simulation especially: it is the figure a user will pick
 * a goal from.
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

/** R$ 50,00 — fine enough to land on a number that means something, coarse enough to drag. */
export const CEILING_STEP_IN_CENTS = 5_000;

/** R$ 100,00 — the track ends on a round figure rather than on a month's total. */
const CEILING_CAP_UNIT_IN_CENTS = 10_000;

const MONTH_AND_YEAR_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
});

const MONTH_FORMAT = new Intl.DateTimeFormat('pt-BR', { month: 'long' });

function toFirstOfMonth(reference: Date, monthsAgo: number): Date {
  return new Date(reference.getFullYear(), reference.getMonth() - monthsAgo, 1);
}

export function toMonthLabel(monthsAgo: number, reference: Date): string {
  return MONTH_AND_YEAR_FORMAT.format(toFirstOfMonth(reference, monthsAgo));
}

/** The month the ceiling starts over in, for the copy that says a cycle is not a verdict. */
export function toNextMonthLabel(reference: Date): string {
  return MONTH_FORMAT.format(toFirstOfMonth(reference, -1));
}

export function countDaysRemainingInMonth(reference: Date): number {
  const lastDayOfMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  return lastDayOfMonth.getDate() - reference.getDate();
}

export function selectActiveGoal(goals: readonly Goal[]): Goal | null {
  return goals.find((goal) => goal.replacedMonthsAgo === null) ?? null;
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

export type CeilingSimulation = {
  readonly ceilingInCents: number;
  readonly monthsCounted: number;
  readonly monthsWithin: number;
  /** Mean overshoot across the months that passed the ceiling. Zero when none did. */
  readonly averageExcessInCents: number;
  readonly totalExcessInCents: number;
};

/**
 * What a ceiling would have meant against the months the user actually had.
 *
 * It answers with counts and differences and stops there. It says nothing about
 * what would have happened instead — the person may well have spent the money on
 * something else, and a screen that pretends otherwise is selling a regret rather
 * than reporting a number.
 */
export function simulateCeiling(
  months: readonly MonthlyBetTotal[],
  ceilingInCents: number,
): CeilingSimulation {
  const excesses = months.map((month) => Math.max(0, month.betsInCents - ceilingInCents));
  const monthsAbove = excesses.filter((excess) => excess > 0).length;
  const totalExcessInCents = excesses.reduce((total, excess) => total + excess, 0);

  return {
    ceilingInCents,
    monthsCounted: months.length,
    monthsWithin: months.length - monthsAbove,
    averageExcessInCents: monthsAbove === 0 ? 0 : Math.round(totalExcessInCents / monthsAbove),
    totalExcessInCents,
  };
}

/** The top of the simulator's range: past the worst month, on a round figure. */
export function toCeilingCap(months: readonly MonthlyBetTotal[]): number {
  const largest = Math.max(...months.map((month) => month.betsInCents), 0);
  return Math.ceil(largest / CEILING_CAP_UNIT_IN_CENTS) * CEILING_CAP_UNIT_IN_CENTS;
}

/**
 * How far a month sat from its ceiling, in one phrase. Shared so the goal screen
 * and the dashboard card cannot word the same fact two different ways.
 *
 * It reports a distance and nothing more. "R$ 640,00 acima do teto" is something
 * the reader can do what they like with; anything warmer or colder would be the
 * product having an opinion about their month.
 */
export function describeCycleMargin(cycle: GoalCycle): string {
  const distance = formatBRL(Math.abs(cycle.marginInCents));
  return cycle.marginInCents < 0 ? `${distance} acima do teto` : `${distance} abaixo do teto`;
}
