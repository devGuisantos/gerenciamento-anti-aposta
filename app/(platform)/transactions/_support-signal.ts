/**
 * When the screen offers support resources instead of more numbers.
 *
 * `CLAUDE.md` requires an escalation path: where usage suggests compulsive
 * behaviour, surface support rather than more gamification. The backend decides
 * when, as `awareness.SupportOffer` (`GET /awareness/support-offer`), and both
 * `/transactions/insights` and `/achievements` render its answer — one offer,
 * dismissed once. This is the shape `SupportCard` renders it in.
 *
 * The rule is deliberately **conservative**. A missed offer costs one screen that
 * could have been more useful; a false one tells somebody they may have a problem
 * they do not have, from an app that only sees their bank statement. So it needs
 * a sustained pattern across whole months, never a single bad week, and it
 * reports only what it counted — it does not diagnose, and the copy must not
 * either.
 */
export type SupportSignal = {
  readonly shouldOffer: boolean;
  /** Consecutive recent months whose betting total sat in the high band. */
  readonly sustainedMonths: number;
  /** Whether every one of those months was larger than the month before it. */
  readonly isRising: boolean;
  /** The monthly figure counted as high, so the copy names the same number the rule used. */
  readonly thresholdInCents: number;
};
