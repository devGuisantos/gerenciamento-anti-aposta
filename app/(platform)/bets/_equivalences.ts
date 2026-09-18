/**
 * What the money spent on betting would have bought instead.
 *
 * This is the same System 2 reframing as the fixed-income figure, in objects a
 * person can picture. It is also the easiest thing on the screen to get wrong:
 * "you could have bought a car" next to R$ 2.320,00 discredits every other number
 * here. So **nothing is hard-coded as a conclusion** — quantities are divided out
 * of the real total, and an item that the amount does not actually cover is not
 * shown at all.
 *
 * Two sources, deliberately kept apart:
 *
 * 1. `OWN_SPENDING` — months of the reader's own grocery, rent or delivery bill.
 *    Nothing is invented: the unit price is their own average, and the detail line
 *    says so. These are the honest ones and they come first.
 * 2. `REFERENCE_PRICE` — a small catalogue of everyday goods. These prices are
 *    **rounded estimates chosen for the demo**, not researched figures, which is
 *    why the UI labels them as approximate.
 *
 * TODO(awareness): the catalogue belongs in configuration, not in code — prices
 * move, and a stale one makes the whole card look careless. When `Reframing`
 * lands, seed it as data with a source and a review date.
 */
import { MONTHLY_HISTORY } from '../transactions/insights/_mock-monthly-history';

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

type ReferenceItem = {
  readonly id: string;
  readonly singular: string;
  readonly plural: string;
  readonly unitPriceInCents: number;
};

/** Rounded reference prices in BRL. Spread across magnitudes so the list still
 *  says something whether the total is R$ 300 or R$ 30.000. */
const REFERENCE_ITEMS: readonly ReferenceItem[] = [
  { id: 'cesta', singular: 'cesta básica', plural: 'cestas básicas', unitPriceInCents: 80_000 },
  { id: 'passagem', singular: 'passagem aérea', plural: 'passagens aéreas', unitPriceInCents: 90_000 },
  { id: 'bicicleta', singular: 'bicicleta', plural: 'bicicletas', unitPriceInCents: 120_000 },
  { id: 'lavadora', singular: 'máquina de lavar', plural: 'máquinas de lavar', unitPriceInCents: 200_000 },
  { id: 'celular', singular: 'celular', plural: 'celulares', unitPriceInCents: 180_000 },
  { id: 'notebook', singular: 'notebook', plural: 'notebooks', unitPriceInCents: 250_000 },
  { id: 'semestre', singular: 'semestre de faculdade', plural: 'semestres de faculdade', unitPriceInCents: 450_000 },
  { id: 'moto', singular: 'moto 0 km', plural: 'motos 0 km', unitPriceInCents: 1_800_000 },
  { id: 'carro', singular: 'carro popular usado', plural: 'carros populares usados', unitPriceInCents: 3_500_000 },
];

type OwnSpendingCategory = {
  readonly id: string;
  readonly label: string;
  readonly read: (month: (typeof MONTHLY_HISTORY)[number]) => number;
};

const OWN_SPENDING_CATEGORIES: readonly OwnSpendingCategory[] = [
  { id: 'mercado', label: 'de mercado', read: (month) => month.groceries },
  { id: 'aluguel', label: 'de aluguel', read: (month) => month.housing },
  { id: 'delivery', label: 'de delivery e restaurante', read: (month) => month.dining },
  { id: 'transporte', label: 'de transporte', read: (month) => month.transport },
  { id: 'assinaturas', label: 'de assinaturas', read: (month) => month.subscriptions },
];

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function averageInCents(read: (month: (typeof MONTHLY_HISTORY)[number]) => number): number {
  if (MONTHLY_HISTORY.length === 0) return 0;
  const total = MONTHLY_HISTORY.reduce((sum, month) => sum + read(month), 0);
  return Math.round(total / MONTHLY_HISTORY.length);
}

function toMonthsEquivalence(
  category: OwnSpendingCategory,
  totalInCents: number,
): Equivalence | null {
  const average = averageInCents(category.read);
  const months = average === 0 ? 0 : Math.floor(totalInCents / average);
  if (months < 1) return null;

  return {
    id: category.id,
    text: `${months} ${months === 1 ? 'mês' : 'meses'} ${category.label}`,
    detail: `pela sua média de ${BRL.format(average / 100)} por mês`,
    source: 'OWN_SPENDING',
    targetInCents: null,
  };
}

function toItemEquivalence(item: ReferenceItem, totalInCents: number): Equivalence | null {
  const quantity = Math.floor(totalInCents / item.unitPriceInCents);
  if (quantity < 1) return null;

  return {
    id: item.id,
    text: `${quantity} ${quantity === 1 ? item.singular : item.plural}`,
    detail: `a cerca de ${BRL.format(item.unitPriceInCents / 100)} cada`,
    source: 'REFERENCE_PRICE',
    targetInCents: quantity * item.unitPriceInCents,
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
 * Grouping them put all five months first, and months are exactly the ones that
 * carry no savings target — so the first screenful of the carousel had not a
 * single goal button on it and the feature looked missing. Alternating means one
 * is always in view.
 *
 * Within each list the order is deliberate: the priciest thing the amount
 * actually covers first, and the reader's own bills in the order declared above.
 */
export function selectEquivalences(totalInCents: number): readonly Equivalence[] {
  const fromOwnSpending = OWN_SPENDING_CATEGORIES.map((category) =>
    toMonthsEquivalence(category, totalInCents),
  ).filter((equivalence) => equivalence !== null);

  const fromCatalogue = REFERENCE_ITEMS.toSorted(
    (left, right) => right.unitPriceInCents - left.unitPriceInCents,
  )
    .map((item) => toItemEquivalence(item, totalInCents))
    .filter((equivalence) => equivalence !== null);

  return interleave(fromCatalogue, fromOwnSpending);
}
