/**
 * In-process store standing in for the savings-goal repository until
 * `gamification` exists.
 *
 * TODO(gamification): replace with `container.listGoals` / `container.setGoal` /
 * `container.recordGoalMovement`. The balance check below is an **aggregate
 * invariant**, not a storage detail — it moves into `Goal` with its negative case
 * tested first, and this file disappears.
 *
 * Deliberate limitations, because they matter if this is ever deployed — the same
 * ones `notifications/infrastructure/demo-broker.ts` carries:
 *
 * - State lives in one Node process. It does not survive a restart, it does not
 *   cross instances, and editing this file in `next dev` resets it.
 * - There is **one set of goals, not one per user**, because there is no identity
 *   module yet to key them by. Fine for a demo on a laptop; unacceptable the
 *   moment two people can reach it. The Server Actions say the same.
 */
import { toSavedInCents } from './_savings-goals-view';
import type { GoalMovement, GoalPurpose, MovementDirection, SavingsGoal } from './_savings-goal';

const MILLISECONDS_PER_DAY = 86_400_000;

/** Seeded relative to start-up so the history reads as recent whenever it is opened. */
function daysAgo(days: number): string {
  return new Date(Date.now() - days * MILLISECONDS_PER_DAY).toISOString();
}

function seedMovement(
  id: string,
  direction: MovementDirection,
  amountInCents: number,
  days: number,
): GoalMovement {
  return { id, direction, amountInCents, occurredAt: daysAgo(days) };
}

/* Three goals covering what the screen has to render: one in progress that has
   had money taken out of it, one just started, and one already reached. */
const SEEDED_GOALS: readonly SavingsGoal[] = [
  {
    id: 'savings-emergency',
    title: 'Reserva para imprevistos',
    purpose: 'EMERGENCY_FUND',
    targetInCents: 300_000,
    createdAt: daysAgo(52),
    movements: [
      seedMovement('movement-4', 'WITHDRAWAL', 20_000, 7),
      seedMovement('movement-3', 'DEPOSIT', 30_000, 15),
      seedMovement('movement-2', 'DEPOSIT', 50_000, 30),
      seedMovement('movement-1', 'DEPOSIT', 50_000, 45),
    ],
  },
  {
    id: 'savings-fridge',
    title: 'Trocar a geladeira',
    purpose: 'HOME',
    targetInCents: 220_000,
    createdAt: daysAgo(24),
    movements: [
      seedMovement('movement-6', 'DEPOSIT', 35_000, 5),
      seedMovement('movement-5', 'DEPOSIT', 40_000, 20),
    ],
  },
  {
    id: 'savings-course',
    title: 'Curso técnico',
    purpose: 'EDUCATION',
    targetInCents: 120_000,
    createdAt: daysAgo(70),
    movements: [
      seedMovement('movement-8', 'DEPOSIT', 60_000, 25),
      seedMovement('movement-7', 'DEPOSIT', 60_000, 60),
    ],
  },
];

/** Newest first, so a goal the user just created is the first one they see. */
let goals: readonly SavingsGoal[] = SEEDED_GOALS;

export function listSavingsGoals(): readonly SavingsGoal[] {
  return goals;
}

export type NewSavingsGoal = {
  readonly title: string;
  readonly purpose: GoalPurpose;
  readonly targetInCents: number;
};

export function createSavingsGoal(input: NewSavingsGoal): SavingsGoal {
  const goal: SavingsGoal = {
    id: crypto.randomUUID(),
    title: input.title,
    purpose: input.purpose,
    targetInCents: input.targetInCents,
    createdAt: new Date().toISOString(),
    movements: [],
  };

  goals = [goal, ...goals];
  return goal;
}

export type RecordedMovement = {
  readonly goalId: string;
  readonly direction: MovementDirection;
  readonly amountInCents: number;
};

/**
 * A `Result` rather than a throw: an over-withdrawal is an expected outcome the
 * form has to explain, not a programmer error.
 */
export type MovementOutcome =
  | {
      readonly status: 'RECORDED';
      readonly goal: SavingsGoal;
      /**
       * True only on the movement that **crossed** the target, never on one that
       * merely lands on an already-finished goal. Whatever celebrates this has to
       * fire once, for a milestone that was actually reached — see
       * `MilestoneConfetti`.
       *
       * TODO(gamification): this is where the `Goal` aggregate records
       * `GoalReached`. The crossing is the event; the boolean is a stand-in for it.
       */
      readonly reachedNow: boolean;
    }
  | { readonly status: 'GOAL_NOT_FOUND' }
  | { readonly status: 'INSUFFICIENT_BALANCE'; readonly savedInCents: number };

export function recordMovement(input: RecordedMovement): MovementOutcome {
  const goal = goals.find((candidate) => candidate.id === input.goalId);
  if (!goal) return { status: 'GOAL_NOT_FOUND' };

  const savedInCents = toSavedInCents(goal.movements);
  /* A goal cannot hold less than nothing. Silently clamping would leave the user
     with a balance they never agreed to; the form says what happened instead. */
  if (input.direction === 'WITHDRAWAL' && input.amountInCents > savedInCents) {
    return { status: 'INSUFFICIENT_BALANCE', savedInCents };
  }

  const movement: GoalMovement = {
    id: crypto.randomUUID(),
    direction: input.direction,
    amountInCents: input.amountInCents,
    occurredAt: new Date().toISOString(),
  };

  const updated: SavingsGoal = { ...goal, movements: [movement, ...goal.movements] };
  goals = goals.map((candidate) => (candidate.id === goal.id ? updated : candidate));

  return {
    status: 'RECORDED',
    goal: updated,
    reachedNow: crossedTarget(savedInCents, toSavedInCents(updated.movements), goal.targetInCents),
  };
}

/** Below the target before, at or above it after. A goal is reached exactly once. */
function crossedTarget(beforeInCents: number, afterInCents: number, targetInCents: number): boolean {
  return beforeInCents < targetInCents && afterInCents >= targetInCents;
}
