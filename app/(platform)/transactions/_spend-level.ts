/**
 * Bands the betting total is shown in. This is a **display** rule: it changes the
 * colour of one figure and says nothing about whether an amount is acceptable.
 *
 * Green is reserved for a true zero. An early draft used it for anything under
 * R$ 100, which made the screen congratulate a small bet — the wrong signal from
 * a product whose whole purpose is to make betting spend visible. Below the first
 * threshold the figure is simply neutral: reported, not praised.
 *
 * The captions name each band's own boundary rather than judging the number,
 * because the product neither praises nor scolds spending.
 *
 * TODO(awareness): if these bands ever drive a nudge or a goal, they stop being
 * presentation and belong in the module as a domain policy with its own tests.
 */

export type SpendLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

/** R$ 100,00 — below this the figure stays neutral. */
const MEDIUM_BAND_FLOOR_IN_CENTS = 10_000;

/** R$ 1.000,00 — at or above this the figure is shown in the high band. */
const HIGH_BAND_FLOOR_IN_CENTS = 100_000;

/**
 * The same thresholds, for charts that draw them as reference lines. Exported
 * from here so a drawn line can never disagree with the colour it explains.
 */
export const BAND_FLOORS_IN_CENTS: readonly number[] = [
  MEDIUM_BAND_FLOOR_IN_CENTS,
  HIGH_BAND_FLOOR_IN_CENTS,
];

export function toSpendLevel(spendInCents: number): SpendLevel {
  if (spendInCents === 0) return 'NONE';
  if (spendInCents < MEDIUM_BAND_FLOOR_IN_CENTS) return 'LOW';
  if (spendInCents < HIGH_BAND_FLOOR_IN_CENTS) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Colour never carries meaning on its own — this caption is what a colour-blind
 * reader gets instead, so it must stay in step with the bands above.
 *
 * `NONE` has none: the summary already says in full that no bets were found, and
 * repeating it beside the heading only stutters.
 */
export const SPEND_LEVEL_CAPTIONS: Readonly<Partial<Record<SpendLevel, string>>> = {
  LOW: 'abaixo de R$ 100,00',
  MEDIUM: 'entre R$ 100,00 e R$ 1.000,00',
  HIGH: 'acima de R$ 1.000,00',
};

export const SPEND_LEVEL_TEXT_CLASSES: Readonly<Record<SpendLevel, string>> = {
  NONE: 'text-spend-none',
  LOW: 'text-foreground',
  MEDIUM: 'text-spend-medium',
  HIGH: 'text-spend-high',
};
