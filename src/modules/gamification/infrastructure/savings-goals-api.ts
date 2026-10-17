import { z } from 'zod';

import { callBackend, type BackendResult } from '@shared/infrastructure/backend-api';

/**
 * The savings goals, as backend-anti-aposta keeps them. The balance is summed
 * from the movements there, the over-withdrawal is refused there, and whether a
 * movement reached the goal is decided there — this file only parses what
 * arrives. Every figure here is self-reported by the person, and the screen
 * says so.
 */
export const GOAL_PURPOSES = [
  'EMERGENCY_FUND',
  'DEBT_PAYOFF',
  'HOME',
  'EDUCATION',
  'TRAVEL',
  'VEHICLE',
  'HEALTH',
  'OTHER',
] as const;

export type GoalPurpose = (typeof GOAL_PURPOSES)[number];

/** A union rather than a boolean: the direction has to survive into the copy and the icon. */
export type MovementDirection = 'DEPOSIT' | 'WITHDRAWAL';

const moneySchema = z.object({
  amountInCents: z.number().int(),
  currency: z.literal('BRL'),
});

const savingsGoalSchema = z.object({
  id: z.string(),
  title: z.string(),
  purpose: z.enum(GOAL_PURPOSES),
  target: moneySchema,
  saved: moneySchema,
  /** Floored at zero. */
  remaining: moneySchema,
  /** Uncapped. */
  progressPercent: z.number().int(),
  /** Now — a withdrawal can undo it. */
  isReached: z.boolean(),
  /** The first time it was reached; never cleared. */
  reachedAt: z.iso.datetime({ offset: true }).nullable(),
  movementCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime({ offset: true }),
});

const movementSchema = z.object({
  id: z.string(),
  direction: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  amount: moneySchema,
  occurredAt: z.iso.datetime({ offset: true }),
  reachedTarget: z.boolean(),
});

const savingsGoalPageSchema = z.object({
  items: z.array(savingsGoalSchema),
  nextCursor: z.string().nullable(),
});

const movementPageSchema = z.object({
  items: z.array(movementSchema),
  nextCursor: z.string().nullable(),
});

const recordedMovementSchema = z.object({
  goal: savingsGoalSchema,
  movement: movementSchema,
  /** True only on the movement that first crossed the target. The celebration hangs off this. */
  reachedNow: z.boolean(),
});

export type SavingsGoal = z.infer<typeof savingsGoalSchema>;
export type GoalMovement = z.infer<typeof movementSchema>;
export type GoalMovementPage = z.infer<typeof movementPageSchema>;
export type RecordedMovement = z.infer<typeof recordedMovementSchema>;

/** The backend's maximum page; nobody keeps a hundred savings goals at once. */
const GOALS_PAGE_LIMIT = 100;

const MOVEMENTS_PAGE_LIMIT = 20;

function brl(amountInCents: number): z.infer<typeof moneySchema> {
  return { amountInCents, currency: 'BRL' };
}

function goalPath(goalId: string): string {
  return `/savings-goals/${encodeURIComponent(goalId)}/movements`;
}

/** `GET /savings-goals` — newest first, the balance summed from the movements. */
export async function listSavingsGoals(
  sessionToken: string,
): Promise<BackendResult<z.infer<typeof savingsGoalPageSchema>>> {
  return callBackend({
    method: 'GET',
    path: `/savings-goals?limit=${GOALS_PAGE_LIMIT}`,
    sessionToken,
    responseSchema: savingsGoalPageSchema,
  });
}

export type NewSavingsGoal = {
  readonly title: string;
  readonly purpose: GoalPurpose;
  readonly targetInCents: number;
};

/** `POST /savings-goals` — starts empty; nothing is reached by creating one. */
export async function createSavingsGoal(
  sessionToken: string,
  goal: NewSavingsGoal,
): Promise<BackendResult<SavingsGoal>> {
  return callBackend({
    method: 'POST',
    path: '/savings-goals',
    body: { title: goal.title, purpose: goal.purpose, target: brl(goal.targetInCents) },
    sessionToken,
    responseSchema: savingsGoalSchema,
  });
}

/** `GET /savings-goals/{id}/movements` — newest first, one page at a time. */
export async function listGoalMovements(
  sessionToken: string,
  goalId: string,
  cursor: string | null,
): Promise<BackendResult<GoalMovementPage>> {
  const query = new URLSearchParams({ limit: String(MOVEMENTS_PAGE_LIMIT) });
  if (cursor !== null) query.set('cursor', cursor);

  return callBackend({
    method: 'GET',
    path: `${goalPath(goalId)}?${query.toString()}`,
    sessionToken,
    responseSchema: movementPageSchema,
  });
}

export type MovementToRecord = {
  readonly goalId: string;
  readonly direction: MovementDirection;
  readonly amountInCents: number;
  /** Generated once per dialog opening, so a retried submit books the amount once. */
  readonly idempotencyKey: string;
};

/**
 * `POST /savings-goals/{id}/movements`. Refusals arrive as `INSUFFICIENT_BALANCE`
 * (with `details.savedInCents`), `GOAL_NOT_FOUND` and `GOAL_MODIFIED_CONCURRENTLY`.
 */
export async function recordGoalMovement(
  sessionToken: string,
  movement: MovementToRecord,
): Promise<BackendResult<RecordedMovement>> {
  return callBackend({
    method: 'POST',
    path: goalPath(movement.goalId),
    body: { direction: movement.direction, amount: brl(movement.amountInCents) },
    headers: { 'Idempotency-Key': movement.idempotencyKey },
    sessionToken,
    responseSchema: recordedMovementSchema,
  });
}
