/**
 * The shape the Metas screen renders. It mirrors what `gamification`'s `Goal`
 * aggregate will expose, so replacing the fixture is a change of source, not of
 * shape.
 *
 * A goal here is a **monthly ceiling on betting**, plus what the user said the
 * money is for. That is the whole of it, and it is deliberate:
 *
 * - It is the `Goal` the module describes — "how much to stop spending, and where
 *   it goes" — and both halves come from the user, never from us. Autonomy is the
 *   SDT mechanic this screen carries.
 * - It is **observable**. The ceiling is measured against transactions the
 *   platform already reads, so no number on this screen depends on the user
 *   telling us something we cannot verify. A savings target would: we see a bank
 *   statement, not a deposit the person meant to make, and a progress bar filled
 *   from an unverifiable figure is a progress bar that lies.
 *
 * `destination` is therefore a **statement of intent, never a balance**. The
 * platform does not move money and no copy may suggest it does.
 */

/** Months back from the current month, the same offsets `MONTHLY_HISTORY` uses. */
export type MonthsAgo = number;

export type Goal = {
  readonly id: string;
  /** The most the user chose to spend on betting in one calendar month. */
  readonly ceilingInCents: number;
  /** Where the user said the money should go. Their words, not ours. */
  readonly destination: string;
  /** The month the user set it. It governs that month and every month after. */
  readonly setMonthsAgo: MonthsAgo;
  /**
   * The month the user replaced it, which is the month the replacement was set.
   * `null` while it is the one in force.
   */
  readonly replacedMonthsAgo: MonthsAgo | null;
};
