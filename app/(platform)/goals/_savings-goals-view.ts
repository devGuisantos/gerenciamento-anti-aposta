/**
 * Presentation model for the savings goals: labels and nothing else.
 *
 * Every figure — the balance summed from the movements, the progress, what is
 * left, whether the goal is reached — arrives decided from `gamification` on
 * the backend. Dates are resolved here, on the server and in São Paulo time, for
 * the same reason the statement screen does it: the interactive parts never call
 * `new Date()` and so cannot render a different day than the server did.
 */
import type { GoalMovement, MovementDirection, SavingsGoal } from '@modules/gamification';

const DATE_AND_TIME_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
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
  /**
   * "12 de outubro de 2026": the first time the balance reached the target, as
   * the backend recorded it. `null` before that. It stays set after a
   * withdrawal, which is why the card shows it only while `isReached` holds.
   */
  readonly reachedAtLabel: string | null;
  /** Zero once the target is met, so no card ever shows a negative "faltam". */
  readonly remainingInCents: number;
  /** The history itself loads when its dialog opens; the count is on the button. */
  readonly movementCount: number;
};

export function toSavingsGoalRow(goal: SavingsGoal): SavingsGoalRow {
  return {
    id: goal.id,
    title: goal.title,
    purpose: goal.purpose,
    targetInCents: goal.target.amountInCents,
    savedInCents: goal.saved.amountInCents,
    progressPercentage: goal.progressPercent,
    isReached: goal.isReached,
    reachedAtLabel: goal.reachedAt === null ? null : DATE_FORMAT.format(new Date(goal.reachedAt)),
    remainingInCents: goal.remaining.amountInCents,
    movementCount: goal.movementCount,
  };
}

export function toSavingsGoalRows(goals: readonly SavingsGoal[]): readonly SavingsGoalRow[] {
  return goals.map(toSavingsGoalRow);
}

export function toMovementRows(movements: readonly GoalMovement[]): readonly MovementRow[] {
  return movements.map((movement) => ({
    id: movement.id,
    direction: movement.direction,
    amountInCents: movement.amount.amountInCents,
    occurredAtLabel: DATE_AND_TIME_FORMAT.format(new Date(movement.occurredAt)),
  }));
}

export type SavingsSummary = {
  readonly goalCount: number;
  readonly savedInCents: number;
  readonly targetInCents: number;
  readonly reachedCount: number;
};

/** The section's one line of totals: a count and two sums of what the backend sent. */
export function summariseSavings(rows: readonly SavingsGoalRow[]): SavingsSummary {
  return {
    goalCount: rows.length,
    savedInCents: rows.reduce((total, row) => total + row.savedInCents, 0),
    targetInCents: rows.reduce((total, row) => total + row.targetInCents, 0),
    reachedCount: rows.filter((row) => row.isReached).length,
  };
}
