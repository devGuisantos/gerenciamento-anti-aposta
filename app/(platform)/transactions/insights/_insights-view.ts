/**
 * Presentation model for the charts, built from the backend's monthly summary.
 *
 * Every figure arrives as a non-negative magnitude per category, already
 * bucketed by São Paulo calendar month, with betting following the
 * classification rather than the category. What this file adds is the reader's
 * choices — which metric, how many months — and labels resolved **once on the
 * server**, so the interactive charts never call `new Date()`.
 */
/* Types only: this file reaches the browser, and the module is server-only. */
import type { MonthlyTotals, TransactionCategory } from '@modules/open-finance';

import { CATEGORY_LABELS } from '../_statement-labels';

/** Month keys are calendar months, not instants; noon UTC on the 1st formats as that month anywhere. */
const MONTH_FORMAT = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'short' });
const LONG_MONTH_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
});

/**
 * Which single series the main chart is plotting. One at a time, never two.
 * `TOTAL_SPENT` is the one figure computed here, because the backend sends
 * only its parts — a sum it sent could disagree with them.
 */
export type MetricId = 'TOTAL_SPENT' | TransactionCategory;

export type Metric = {
  readonly id: MetricId;
  readonly label: string;
  /** Read by the charts' accessible description, so it must read as a sentence. */
  readonly description: string;
};

/**
 * Exhaustive by type, and its key order is the picker's order: betting first
 * after the total, since it is the series this product exists to show.
 */
const CATEGORY_DESCRIPTIONS: Readonly<Record<TransactionCategory, string>> = {
  BETS: 'O que foi para casas de apostas no mês, já descontados os reembolsos.',
  INCOME: 'Tudo que entrou na conta no mês.',
  GROCERIES: 'Compras de supermercado no mês.',
  DINING: 'Restaurantes e delivery no mês.',
  TRANSPORT: 'Transporte e combustível no mês.',
  HOUSING: 'Aluguel e contas da casa no mês.',
  HEALTH: 'Farmácia, academia e saúde no mês.',
  SUBSCRIPTIONS: 'Serviços recorrentes no mês.',
  SHOPPING: 'Compras avulsas no mês.',
  TRANSFER: 'Pix e transferências enviados no mês.',
  OTHER: 'Saídas que não se encaixam em outra categoria.',
};

function isCategory(key: string): key is TransactionCategory {
  return key in CATEGORY_DESCRIPTIONS;
}

const CATEGORIES: readonly TransactionCategory[] = Object.keys(CATEGORY_DESCRIPTIONS).filter(isCategory);

export const METRICS: readonly Metric[] = [
  {
    id: 'TOTAL_SPENT',
    label: 'Tudo que saiu',
    description: 'A soma de todas as saídas do mês, apostas incluídas.',
  },
  ...CATEGORIES.map((id) => ({
    id,
    label: id === 'INCOME' ? 'Entradas' : CATEGORY_LABELS[id],
    description: CATEGORY_DESCRIPTIONS[id],
  })),
];

/** Every outgoing category — what "tudo que saiu" sums and the breakdown ranks. */
const EXPENSE_CATEGORIES: readonly TransactionCategory[] = CATEGORIES.filter(
  (category) => category !== 'INCOME',
);

export type MonthWindow = 3 | 4 | 5 | 6 | 12;

export const MONTH_WINDOWS: readonly MonthWindow[] = [3, 4, 5, 6, 12];

/** One month the backend has data for, labelled. */
export type ChartMonth = {
  readonly monthsAgo: number;
  /** The current month is incomplete by definition. */
  readonly isPartial: boolean;
  /** "set" — the x-axis tick. */
  readonly shortLabel: string;
  /** "setembro de 2026" — the tooltip heading. */
  readonly longLabel: string;
  readonly totals: Readonly<Record<TransactionCategory, number>>;
};

export type MonthPoint = {
  readonly monthsAgo: number;
  readonly isPartial: boolean;
  readonly shortLabel: string;
  readonly longLabel: string;
  readonly valueInCents: number;
};

export type CategorySlice = {
  readonly id: TransactionCategory;
  readonly label: string;
  readonly totalInCents: number;
  /** 0–100, against the largest category in the same window. */
  readonly relativeShare: number;
};

function firstDayOf(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1, 12));
}

/** Strips the trailing dot pt-BR puts on abbreviated months ("set." → "set"). */
function toShortMonthLabel(date: Date): string {
  return MONTH_FORMAT.format(date).replace('.', '');
}

/** Newest first, as the backend sends them. */
export function toChartMonths(items: readonly MonthlyTotals[]): readonly ChartMonth[] {
  return items.map((item) => {
    const date = firstDayOf(item.monthKey);
    return {
      monthsAgo: item.monthsAgo,
      isPartial: item.isPartial,
      shortLabel: toShortMonthLabel(date),
      longLabel: LONG_MONTH_FORMAT.format(date),
      totals: item.totals,
    };
  });
}

function readMetric(month: ChartMonth, metric: MetricId): number {
  if (metric !== 'TOTAL_SPENT') return month.totals[metric];
  return EXPENSE_CATEGORIES.reduce((sum, category) => sum + month.totals[category], 0);
}

function inWindow(months: readonly ChartMonth[], window: MonthWindow): readonly ChartMonth[] {
  return months.filter((month) => month.monthsAgo < window);
}

/** Oldest first, for the x-axis. Months the backend omitted stay omitted. */
export function selectMonthlySeries(
  months: readonly ChartMonth[],
  metric: MetricId,
  window: MonthWindow,
): readonly MonthPoint[] {
  return inWindow(months, window)
    .map((month) => ({
      monthsAgo: month.monthsAgo,
      isPartial: month.isPartial,
      shortLabel: month.shortLabel,
      longLabel: month.longLabel,
      valueInCents: readMetric(month, metric),
    }))
    .toReversed();
}

export function selectCategoryBreakdown(
  months: readonly ChartMonth[],
  window: MonthWindow,
): readonly CategorySlice[] {
  const windowMonths = inWindow(months, window);

  const totals = EXPENSE_CATEGORIES.map((id) => ({
    id,
    label: CATEGORY_LABELS[id],
    totalInCents: windowMonths.reduce((sum, month) => sum + month.totals[id], 0),
  }))
    .filter((slice) => slice.totalInCents > 0 || slice.id === 'BETS')
    .toSorted((left, right) => right.totalInCents - left.totalInCents);

  const largest = totals[0]?.totalInCents ?? 0;

  return totals.map((slice) => ({
    ...slice,
    relativeShare: largest === 0 ? 0 : Math.round((slice.totalInCents / largest) * 100),
  }));
}

export function sumSeries(points: readonly MonthPoint[]): number {
  return points.reduce((total, point) => total + point.valueInCents, 0);
}

/**
 * Over whole months only. The open month is half a month, and averaging it in
 * would understate every month around it. `null` when no whole month is shown.
 */
export function toMonthlyAverage(points: readonly MonthPoint[]): number | null {
  const whole = points.filter((point) => !point.isPartial);
  if (whole.length === 0) return null;
  return Math.round(sumSeries(whole) / whole.length);
}
