/**
 * Presentation model for the savings goals.
 *
 * The balance is **derived from the movements every time**, never stored. A kept
 * total and a list of movements are two things that can disagree, and the one the
 * user would believe is the total — which is the one that would be wrong. Summing
 * eleven entries costs nothing and cannot drift.
 *
 * Dates are resolved here, on the server, for the same reason the statement screen
 * does it: the interactive parts never call `new Date()` and so cannot render a
 * different day than the server did.
 *
 * TODO(gamification): this is `Goal`'s read model. `savedInCents` becomes the
 * aggregate's own invariant — a withdrawal larger than the balance has to be
 * refused in the domain, with the negative case tested first.
 */
import { assertNever } from '@shared/domain/assert-never';

import type { GoalMovement, MovementDirection, SavingsGoal } from './_savings-goal';

const DATE_AND_TIME_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export type MovementRow = {
  readonly id: string;
  readonly direction: MovementDirection;
  readonly amountInCents: number;
  readonly occurredAtLabel: string;
};

export type SavingsGoalRow = {
  readonly id: string;
  readonly title: string;
  readonly purpose: SavingsGoal['purpose'];
  readonly targetInCents: number;
  readonly savedInCents: number;
  /** Uncapped: somebody who saved more than they planned deserves to see it. */
  readonly progressPercentage: number;
  readonly isReached: boolean;
  /** Zero once the target is met, so no card ever shows a negative "faltam". */
  readonly remainingInCents: number;
  /** Newest first, the order the history reads in. */
  readonly movements: readonly MovementRow[];
};

function toSignedAmount(movement: GoalMovement): number {
  switch (movement.direction) {
    case 'DEPOSIT':
      return movement.amountInCents;
    case 'WITHDRAWAL':
      return -movement.amountInCents;
    default:
      return assertNever(movement.direction);
  }
}

export function toSavedInCents(movements: readonly GoalMovement[]): number {
  return movements.reduce((balance, movement) => balance + toSignedAmount(movement), 0);
}

function toProgressPercentage(savedInCents: number, targetInCents: number): number {
  if (targetInCents <= 0) return 0;
  return Math.round((savedInCents / targetInCents) * 100);
}

function toMovementRow(movement: GoalMovement): MovementRow {
  return {
    id: movement.id,
    direction: movement.direction,
    amountInCents: movement.amountInCents,
    occurredAtLabel: DATE_AND_TIME_FORMAT.format(new Date(movement.occurredAt)),
  };
}

export function toSavingsGoalRow(goal: SavingsGoal): SavingsGoalRow {
  const savedInCents = toSavedInCents(goal.movements);

  return {
    id: goal.id,
    title: goal.title,
    purpose: goal.purpose,
    targetInCents: goal.targetInCents,
    savedInCents,
    progressPercentage: toProgressPercentage(savedInCents, goal.targetInCents),
    isReached: savedInCents >= goal.targetInCents,
    remainingInCents: Math.max(0, goal.targetInCents - savedInCents),
    movements: goal.movements.map(toMovementRow),
  };
}

export function toSavingsGoalRows(goals: readonly SavingsGoal[]): readonly SavingsGoalRow[] {
  return goals.map(toSavingsGoalRow);
}

export type SavingsSummary = {
  readonly goalCount: number;
  readonly savedInCents: number;
  readonly targetInCents: number;
  readonly reachedCount: number;
};

export function summariseSavings(rows: readonly SavingsGoalRow[]): SavingsSummary {
  return {
    goalCount: rows.length,
    savedInCents: rows.reduce((total, row) => total + row.savedInCents, 0),
    targetInCents: rows.reduce((total, row) => total + row.targetInCents, 0),
    reachedCount: rows.filter((row) => row.isReached).length,
  };
}
