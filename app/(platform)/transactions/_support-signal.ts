/**
 * When the screen offers support resources instead of more numbers.
 *
 * `CLAUDE.md` requires an escalation path: where usage suggests compulsive
 * behaviour, surface support rather than more gamification. This decides when.
 *
 * It is deliberately **conservative**. A missed offer costs one screen that could
 * have been more useful; a false one tells somebody they may have a problem they
 * do not have, from an app that only sees their bank statement. So it needs a
 * sustained pattern across whole months, never a single bad week, and it reports
 * only what it counted — it does not diagnose, and the copy must not either.
 *
 * TODO(awareness): this is the shape of a domain policy, not presentation. When
 * the module lands it belongs there as `SupportOffer`, with its own tests —
 * including the negative cases, which matter more than the positive ones here.
 */
import { toSpendLevel } from './_spend-level';

/** Whole months in the high band before support is offered at all. */
const SUSTAINED_MONTHS_REQUIRED = 3;

export type SupportSignal = {
  readonly shouldOffer: boolean;
  /** Consecutive recent months whose betting total sat in the high band. */
  readonly sustainedMonths: number;
  /** Whether every one of those months was larger than the month before it. */
  readonly isRising: boolean;
};

function countSustainedHighMonths(betTotalsNewestFirst: readonly number[]): number {
  const firstBelowBand = betTotalsNewestFirst.findIndex(
    (total) => toSpendLevel(total) !== 'HIGH',
  );
  return firstBelowBand === -1 ? betTotalsNewestFirst.length : firstBelowBand;
}

/** Newest first, so "rising" means each entry is larger than the one after it. */
function isStrictlyRising(betTotalsNewestFirst: readonly number[]): boolean {
  return betTotalsNewestFirst.every(
    (total, index) => index === 0 || total < betTotalsNewestFirst[index - 1],
  );
}

export function toSupportSignal(betTotalsNewestFirst: readonly number[]): SupportSignal {
  const sustainedMonths = countSustainedHighMonths(betTotalsNewestFirst);
  const sustained = betTotalsNewestFirst.slice(0, sustainedMonths);

  return {
    shouldOffer: sustainedMonths >= SUSTAINED_MONTHS_REQUIRED,
    sustainedMonths,
    isRising: sustainedMonths > 1 && isStrictlyRising(sustained),
  };
}
