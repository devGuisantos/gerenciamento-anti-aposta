/**
 * What the money spent on betting would have bought instead, as words.
 *
 * The same System 2 reframing as the fixed-income figure, in objects a person
 * can picture — and the easiest thing on the screen to get wrong: "you could
 * have bought a car" next to R$ 2.320,00 discredits every other number here.
 * So `awareness` divides the quantities out of the real total on the backend
 * and leaves out anything the amount does not cover. This file only words them.
 *
 * Two sources, kept apart on the wire and in the copy:
 *
 * 1. `OWN_SPENDING` — months of the reader's own grocery, rent or delivery bill,
 *    averaged over complete months only. Nothing is invented, and the detail
 *    line says whose average it is and how many months it covers.
 * 2. `REFERENCE_PRICE` — a catalogue of everyday goods kept as data on the
 *    backend, with a review date. Still approximations, which the card says.
 */
import type {
  BettingSummary,
  OwnSpendingCategory,
  OwnSpendingEquivalence,
  ReferenceItemEquivalence,
} from '@modules/bet-detection';
import { formatBRL } from '@shared/ui/money-text';

export type EquivalenceSource = 'OWN_SPENDING' | 'REFERENCE_PRICE';

export type Equivalence = {
  readonly id: string;
  /** "4 meses de mercado" — the headline, already pluralised. */
  readonly text: string;
  /** Where the unit price came from, so the claim can be checked. */
  readonly detail: string;
  readonly source: EquivalenceSource;
  /**
   * What a savings goal for this would be worth, or null when the idea does not
   * apply. Months of groceries or rent are recurring bills, not something anyone
   * saves up for, so those carry no target and get no goal button.
   */
  readonly targetInCents: number | null;
};

const OWN_SPENDING_LABELS: Readonly<Record<OwnSpendingCategory, string>> = {
  GROCERIES: 'de mercado',
  HOUSING: 'de aluguel',
  DINING: 'de delivery e restaurante',
  TRANSPORT: 'de transporte',
  SUBSCRIPTIONS: 'de assinaturas',
};

function describeMonths(count: number): string {
  return `${count} ${count === 1 ? 'mês' : 'meses'}`;
}

function toMonthsEquivalence(own: OwnSpendingEquivalence): Equivalence {
  const average = formatBRL(own.monthlyAverage.amountInCents);
  const counted = own.completeMonthsCounted;

  return {
    id: own.category,
    text: `${describeMonths(own.months)} ${OWN_SPENDING_LABELS[own.category]}`,
    detail: `pela sua média de ${average} por mês, em ${describeMonths(counted)} ${counted === 1 ? 'completo' : 'completos'}`,
    source: 'OWN_SPENDING',
    targetInCents: null,
  };
}

function toItemEquivalence(item: ReferenceItemEquivalence): Equivalence {
  return {
    id: item.id,
    text: `${item.quantity} ${item.quantity === 1 ? item.singular : item.plural}`,
    detail: `a cerca de ${formatBRL(item.unitPrice.amountInCents)} cada`,
    source: 'REFERENCE_PRICE',
    targetInCents: item.target.amountInCents,
  };
}

/** Takes one from each list in turn, keeping whichever runs longer at the end. */
function interleave(
  first: readonly Equivalence[],
  second: readonly Equivalence[],
): readonly Equivalence[] {
  const longest = Math.max(first.length, second.length);
  return Array.from({ length: longest }, (_, index) => [first[index], second[index]])
    .flat()
    .filter((equivalence) => equivalence !== undefined);
}

/**
 * Objects and months alternate, starting with an object.
 *
 * Grouping them put all the months first, and months are exactly the ones that
 * carry no savings target — so the first screenful of the carousel had not a
 * single goal button on it and the feature looked missing. Alternating means one
 * is always in view. Within each list the backend's order is kept: the priciest
 * thing the amount covers first, and the reader's own bills in a fixed order.
 */
export function toEquivalences(
  equivalences: BettingSummary['equivalences'],
): readonly Equivalence[] {
  return interleave(
    equivalences.referenceItems.map(toItemEquivalence),
    equivalences.ownSpending.map(toMonthsEquivalence),
  );
}
