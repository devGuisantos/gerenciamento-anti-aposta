/**
 * Evaluates the badge catalogue against what the platform actually observed.
 *
 * Every figure here is derived, never stored: one number per family, read off the
 * streak record, the goal cycles, the monthly totals and the savings ledger that
 * the other screens already show. A badge cannot therefore claim something the
 * statement contradicts, which is the only reason a badge is worth anything.
 *
 * Pure, and it takes everything it measures as arguments — the page is the only
 * file that knows where the numbers come from.
 *
 * TODO(gamification): this is `BadgeCollection`'s read model, and awarding is the
 * module's job. The arithmetic belongs there with tests, the negative cases
 * first: the month that only *ties* the ceiling, the calendar gap that must break
 * a run of months, and the truncated streak whose length is a lower bound.
 */
import { assertNever } from '@shared/domain/assert-never';

import type { GoalCycle } from '../goals/_goals-view';
import type { SavingsGoalRow } from '../goals/_savings-goals-view';
import {
  BADGE_DEFINITIONS,
  BADGE_FAMILY_DESCRIPTORS,
  BADGE_FAMILY_ORDER,
  type BadgeDefinition,
  type BadgeFamily,
  type BadgeFamilyDescriptor,
} from './_badge';
import { describeDays, describeStreakLength } from './_streak-view';
import type { StreakRecord } from './_streak';

/** A closed month with its label already resolved, as every date on this screen is. */
export type ClosedMonth = {
  readonly monthsAgo: number;
  readonly monthLabel: string;
  readonly betsInCents: number;
};

export type BadgeInputs = {
  readonly streaks: StreakRecord;
  /** Closed cycles only, newest first. The open month has no outcome yet. */
  readonly cycles: readonly GoalCycle[];
  /** Closed months only, newest first. */
  readonly months: readonly ClosedMonth[];
  readonly savings: readonly SavingsGoalRow[];
};

/**
 * The one figure a family is measured in, plus the line that says what produced
 * it. `evidence` is `null` only while the figure is zero, so an earned badge
 * always has something concrete to show instead of a congratulation.
 */
type Attainment = {
  readonly value: number;
  readonly evidence: string | null;
};

export type BadgeStatus = 'EARNED' | 'UNEARNED';

export type BadgeAward = {
  readonly definition: BadgeDefinition;
  readonly status: BadgeStatus;
  /** Uncapped: the bar caps it, the words keep the real figure. */
  readonly currentValue: number;
  readonly progressPercentage: number;
  /**
   * One factual line — what satisfied the badge, or how far it stands. Never
   * advice, never encouragement, and never a tease: a locked badge reports a
   * distance and stops, because the near-miss is the exact effect a slot machine
   * sells and this product exists to oppose it.
   */
  readonly detail: string;
};

export type BadgeFamilyGroup = {
  readonly family: BadgeFamily;
  readonly descriptor: BadgeFamilyDescriptor;
  readonly awards: readonly BadgeAward[];
};

/**
 * The longest stretch of **adjacent** qualifying months, newest first.
 *
 * Adjacency matters: months the user had no goal in simply have no cycle, and
 * treating a gap as continuous would invent a run that never happened.
 */
type RunMonth = {
  readonly monthsAgo: number;
  readonly monthLabel: string;
  readonly qualifies: boolean;
};

type MonthRun = {
  readonly length: number;
  /** The newest month of the longest run, which is the month it ran up to. */
  readonly newestMonthLabel: string | null;
};

function toLongestRun(months: readonly RunMonth[]): MonthRun {
  let best: MonthRun = { length: 0, newestMonthLabel: null };
  let length = 0;
  let newestMonthLabel: string | null = null;
  let previousMonthsAgo: number | null = null;

  for (const month of months) {
    if (!month.qualifies) {
      length = 0;
      previousMonthsAgo = null;
      continue;
    }

    const continuesRun = previousMonthsAgo === month.monthsAgo - 1;
    length = continuesRun ? length + 1 : 1;
    if (!continuesRun) newestMonthLabel = month.monthLabel;
    previousMonthsAgo = month.monthsAgo;

    if (length > best.length) best = { length, newestMonthLabel };
  }

  return best;
}

function describeMonths(months: number): string {
  return months === 1 ? '1 mês' : `${months} meses`;
}

/**
 * The longest bet-free stretch the window holds, counting the one under way.
 *
 * The open stretch has to count: somebody 40 days in has earned the 30-day badge,
 * and only the closed stretches are in the record. It is reported as "em
 * andamento" rather than as a finished figure, because it is not finished.
 */
function toStreakAttainment(record: StreakRecord): Attainment {
  const { current, longest } = record;
  const isCurrentTheLongest = longest === null || current.days > longest.lengthInDays;

  if (isCurrentTheLongest) {
    if (current.days === 0) return { value: 0, evidence: null };
    return {
      value: current.days,
      evidence: `${describeDays(current.days)} na sequência em andamento.`,
    };
  }

  return {
    value: longest.lengthInDays,
    evidence: longest.startsBeforeWindow
      ? `${describeStreakLength(longest)}, até ${longest.endedOnLabel}.`
      : `${describeStreakLength(longest)}, de ${longest.startedOnLabel} a ${longest.endedOnLabel}.`,
  };
}

function toCeilingAttainment(cycles: readonly GoalCycle[]): Attainment {
  const run = toLongestRun(
    cycles.map((cycle) => ({
      monthsAgo: cycle.monthsAgo,
      monthLabel: cycle.monthLabel,
      qualifies: cycle.status === 'REACHED',
    })),
  );

  if (run.length === 0) return { value: 0, evidence: null };

  return {
    value: run.length,
    evidence:
      run.length === 1
        ? `1 mês fechado dentro do teto: ${run.newestMonthLabel}.`
        : `${describeMonths(run.length)} seguidos dentro do teto, até ${run.newestMonthLabel}.`,
  };
}

/**
 * Closed months only, and compared with the month immediately before them. The
 * month under way is half a month: counting it would report a fall that the last
 * ten days could undo.
 */
function toReductionAttainment(months: readonly ClosedMonth[]): Attainment {
  const run = toLongestRun(
    months.map((month, index) => {
      const previousMonth = months[index + 1];
      return {
        monthsAgo: month.monthsAgo,
        monthLabel: month.monthLabel,
        qualifies:
          previousMonth !== undefined &&
          previousMonth.monthsAgo === month.monthsAgo + 1 &&
          month.betsInCents < previousMonth.betsInCents,
      };
    }),
  );

  if (run.length === 0) return { value: 0, evidence: null };

  return {
    value: run.length,
    evidence:
      run.length === 1
        ? `1 mês fechado com queda: ${run.newestMonthLabel}.`
        : `${describeMonths(run.length)} seguidos de queda, até ${run.newestMonthLabel}.`,
  };
}

/**
 * Self-reported, and the card says so. The evidence names the goals themselves
 * rather than a count, so the reader can check it against their own record.
 */
function toSavingsAttainment(savings: readonly SavingsGoalRow[]): Attainment {
  const reached = savings.filter((goal) => goal.isReached);
  if (reached.length === 0) return { value: 0, evidence: null };

  const titles = reached.map((goal) => goal.title).join(', ');
  return {
    value: reached.length,
    evidence: reached.length === 1 ? `Concluída: ${titles}.` : `Concluídas: ${titles}.`,
  };
}

function toAttainment(family: BadgeFamily, inputs: BadgeInputs): Attainment {
  switch (family) {
    case 'STREAK':
      return toStreakAttainment(inputs.streaks);
    case 'CEILING':
      return toCeilingAttainment(inputs.cycles);
    case 'REDUCTION':
      return toReductionAttainment(inputs.months);
    case 'SAVINGS':
      return toSavingsAttainment(inputs.savings);
    default:
      return assertNever(family);
  }
}

function describeRemaining(definition: BadgeDefinition, currentValue: number): string {
  const remaining = definition.threshold - currentValue;
  const { unit } = BADGE_FAMILY_DESCRIPTORS[definition.family];
  const counted = remaining === 1 ? `1 ${unit.one}` : `${remaining} ${unit.many}`;
  return remaining === 1 ? `Falta ${counted}.` : `Faltam ${counted}.`;
}

function toAward(definition: BadgeDefinition, attainment: Attainment): BadgeAward {
  const isEarned = attainment.value >= definition.threshold;

  return {
    definition,
    status: isEarned ? 'EARNED' : 'UNEARNED',
    currentValue: attainment.value,
    progressPercentage: Math.min(
      100,
      Math.round((attainment.value / definition.threshold) * 100),
    ),
    /* Every threshold is at least one, so an earned badge always has evidence.
       The criterion stands in rather than an empty line if that ever changes. */
    detail: isEarned
      ? (attainment.evidence ?? definition.criterion)
      : describeRemaining(definition, attainment.value),
  };
}

export function toBadgeAwards(inputs: BadgeInputs): readonly BadgeAward[] {
  const attainments: Readonly<Record<BadgeFamily, Attainment>> = {
    STREAK: toAttainment('STREAK', inputs),
    CEILING: toAttainment('CEILING', inputs),
    REDUCTION: toAttainment('REDUCTION', inputs),
    SAVINGS: toAttainment('SAVINGS', inputs),
  };

  return BADGE_DEFINITIONS.map((definition) =>
    toAward(definition, attainments[definition.family]),
  );
}

export function toBadgeFamilyGroups(
  awards: readonly BadgeAward[],
): readonly BadgeFamilyGroup[] {
  return BADGE_FAMILY_ORDER.map((family) => ({
    family,
    descriptor: BADGE_FAMILY_DESCRIPTORS[family],
    awards: awards.filter((award) => award.definition.family === family),
  }));
}

export function countEarnedBadges(awards: readonly BadgeAward[]): number {
  return awards.filter((award) => award.status === 'EARNED').length;
}

/**
 * The unearned badge standing closest, by progress and then by the smaller
 * threshold. It is a destination, not a tease — whatever renders it states the
 * distance and adds nothing.
 */
export function selectNextMilestone(
  awards: readonly BadgeAward[],
): BadgeAward | null {
  const unearned = awards.filter((award) => award.status === 'UNEARNED');

  return (
    unearned.toSorted(
      (left, right) =>
        right.progressPercentage - left.progressPercentage ||
        left.definition.threshold - right.definition.threshold,
    )[0] ?? null
  );
}
