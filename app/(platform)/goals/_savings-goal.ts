/**
 * What the savings-goal forms share between the browser and the Server Actions.
 *
 * **These figures are self-reported, and that changes what the UI may claim.**
 * Open Finance shows us a statement; it does not show us that a transfer was
 * meant as savings, and it never sees cash in a drawer. So the user records the
 * movements themselves, every screen says the record is theirs, and nothing here
 * is ever presented as something the platform detected. `gamification` on the
 * backend keeps the ledger and decides every figure; this file holds only what a
 * form needs before it gets there.
 *
 * The ceiling is the opposite case: fully observable, and measured rather than
 * declared. The two live side by side on purpose, and the screen keeps them
 * visibly apart.
 */
import type { GoalPurpose } from '@modules/gamification';

export type { GoalPurpose, MovementDirection } from '@modules/gamification';

/**
 * The backend's enum, as a value the browser may hold — the modules are
 * server-only, so a Client Component cannot import theirs. `GOAL_PURPOSE_DESCRIPTORS`
 * is keyed by the module's type, which is what catches a purpose added there and
 * not here.
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
] as const satisfies readonly GoalPurpose[];

/** Bounds the form enforces and the backend re-checks, since an action is a public endpoint. */
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
