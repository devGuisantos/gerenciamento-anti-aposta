/**
 * A goal the user puts money aside for, and the movements they record against it.
 *
 * Mirrors what `gamification`'s `Goal` aggregate will expose, so replacing the
 * store is a change of source, not of shape.
 *
 * **These figures are self-reported, and that changes what the UI may claim.**
 * Open Finance shows us a statement; it does not show us that a transfer was
 * meant as savings, and it never sees cash in a drawer. So the user records the
 * movements themselves, every screen says the record is theirs, and nothing here
 * is ever presented as something the platform detected. The honest version of a
 * savings goal is a ledger the person keeps — not a number we infer.
 *
 * The ceiling goal in `_goal.ts` is the opposite case: fully observable, and
 * measured rather than declared. The two live side by side on purpose, and the
 * screen keeps them visibly apart.
 */

/** What the money is for. The icon and wording for each live in `_goal-purposes.ts`. */
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

/** A union rather than a boolean: `recordMovement({ isDeposit: false })` reads like nothing. */
export type MovementDirection = 'DEPOSIT' | 'WITHDRAWAL';

export type GoalMovement = {
  readonly id: string;
  readonly direction: MovementDirection;
  /** Always a positive magnitude. The direction carries the sign. */
  readonly amountInCents: number;
  /** ISO 8601. Resolved into a label on the server, never in the browser. */
  readonly occurredAt: string;
};

export type SavingsGoal = {
  readonly id: string;
  /** The user's own words, and the only title the screen ever shows. */
  readonly title: string;
  readonly purpose: GoalPurpose;
  readonly targetInCents: number;
  readonly createdAt: string;
  /** Newest first. The balance is the sum of these, never a stored total. */
  readonly movements: readonly GoalMovement[];
};

/** Bounds the form enforces and the action re-checks, since an action is a public endpoint. */
export const GOAL_TITLE_MINIMUM_LENGTH = 3;
export const GOAL_TITLE_MAXIMUM_LENGTH = 60;

/**
 * Digits with at most two decimals, comma or dot; thousands separators refused.
 *
 * Shared so the input's `pattern` attribute and the action's schema cannot drift
 * apart — a field that accepts what the server rejects is a form that fails for
 * reasons the user cannot see.
 *
 * A regex **literal**, with both consumers reading `.source`, rather than a string
 * both of them compile. Written as a string this needs doubled backslashes, and a
 * single one turns `\d` into the letter `d` — a pattern that still compiles, still
 * looks right, and silently matches "ddd" instead of "250". Unanchored because
 * HTML anchors `pattern` itself; the action anchors it explicitly.
 */
export const AMOUNT_PATTERN = /\d{1,9}([,.]\d{1,2})?/;
