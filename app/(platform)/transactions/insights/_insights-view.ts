/**
 * Presentation model for the charts.
 *
 * As on the statement screen, month labels are resolved **once on the server** so
 * the interactive charts never call `new Date()` and cannot drift from the server
 * render.
 */
import { assertNever } from '@shared/domain/assert-never';

import { MONTHLY_HISTORY, type MonthlyTotals } from './_mock-monthly-history';

const MONTH_FORMAT = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
const LONG_MONTH_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
});

/** Which single series the main chart is plotting. One at a time, never two. */
export type MetricId =
  | 'TOTAL_SPENT'
  | 'INCOME'
  | 'BETS'
  | 'GROCERIES'
  | 'DINING'
  | 'TRANSPORT'
  | 'HOUSING'
  | 'HEALTH'
  | 'SUBSCRIPTIONS'
  | 'SHOPPING';

export type Metric = {
  readonly id: MetricId;
  readonly label: string;
  /** Read by the charts' accessible description, so it must read as a sentence. */
  readonly description: string;
};

export const METRICS: readonly Metric[] = [
  {
    id: 'TOTAL_SPENT',
    label: 'Tudo que saiu',
    description: 'A soma de todas as saídas do mês, apostas incluídas.',
  },
  { id: 'INCOME', label: 'Entradas', description: 'Tudo que entrou na conta no mês.' },
  { id: 'BETS', label: 'Apostas', description: 'O que foi para casas de apostas no mês.' },
  { id: 'GROCERIES', label: 'Mercado', description: 'Compras de supermercado no mês.' },
  { id: 'DINING', label: 'Alimentação', description: 'Restaurantes e delivery no mês.' },
  { id: 'TRANSPORT', label: 'Transporte', description: 'Transporte e combustível no mês.' },
  { id: 'HOUSING', label: 'Moradia', description: 'Aluguel e contas da casa no mês.' },
  { id: 'HEALTH', label: 'Saúde', description: 'Farmácia, academia e saúde no mês.' },
  { id: 'SUBSCRIPTIONS', label: 'Assinaturas', description: 'Serviços recorrentes no mês.' },
  { id: 'SHOPPING', label: 'Compras', description: 'Compras avulsas no mês.' },
];

/** Every metric except the two aggregates — what the breakdown chart ranks. */
export const CATEGORY_METRIC_IDS: readonly MetricId[] = METRICS.map((metric) => metric.id).filter(
  (id) => id !== 'TOTAL_SPENT' && id !== 'INCOME',
);

export type MonthWindow = 3 | 4 | 5 | 6 | 12;

export const MONTH_WINDOWS: readonly MonthWindow[] = [3, 4, 5, 6, 12];

export type MonthPoint = {
  readonly monthsAgo: number;
  /** "set" — the x-axis tick. */
  readonly shortLabel: string;
  /** "setembro de 2026" — the tooltip heading and the table view. */
  readonly longLabel: string;
  readonly valueInCents: number;
};

export type CategorySlice = {
  readonly id: MetricId;
  readonly label: string;
  readonly totalInCents: number;
  /** 0–100, against the largest category in the same window. */
  readonly relativeShare: number;
};

function sumExpenses(month: MonthlyTotals): number {
  return (
    month.bets +
    month.groceries +
    month.dining +
    month.transport +
    month.housing +
    month.health +
    month.subscriptions +
    month.shopping
  );
}

function readMetric(month: MonthlyTotals, metric: MetricId): number {
  switch (metric) {
    case 'TOTAL_SPENT':
      return sumExpenses(month);
    case 'INCOME':
      return month.income;
    case 'BETS':
      return month.bets;
    case 'GROCERIES':
      return month.groceries;
    case 'DINING':
      return month.dining;
    case 'TRANSPORT':
      return month.transport;
    case 'HOUSING':
      return month.housing;
    case 'HEALTH':
      return month.health;
    case 'SUBSCRIPTIONS':
      return month.subscriptions;
    case 'SHOPPING':
      return month.shopping;
    default:
      return assertNever(metric);
  }
}

function toMonthDate(reference: Date, monthsAgo: number): Date {
  /* Day 1 avoids the 31st-of-January problem when stepping back a month. */
  return new Date(reference.getFullYear(), reference.getMonth() - monthsAgo, 1);
}

/** Strips the trailing dot pt-BR puts on abbreviated months ("set." → "set"). */
function toShortMonthLabel(date: Date): string {
  return MONTH_FORMAT.format(date).replace('.', '');
}

export function selectMonthlySeries(
  metric: MetricId,
  window: MonthWindow,
  reference: Date,
): readonly MonthPoint[] {
  return MONTHLY_HISTORY.filter((month) => month.monthsAgo < window)
    .map((month) => {
      const date = toMonthDate(reference, month.monthsAgo);
      return {
        monthsAgo: month.monthsAgo,
        shortLabel: toShortMonthLabel(date),
        longLabel: LONG_MONTH_FORMAT.format(date),
        valueInCents: readMetric(month, metric),
      };
    })
    .toReversed();
}

export function selectCategoryBreakdown(window: MonthWindow): readonly CategorySlice[] {
  const months = MONTHLY_HISTORY.filter((month) => month.monthsAgo < window);

  const totals = CATEGORY_METRIC_IDS.map((id) => ({
    id,
    label: METRICS.find((metric) => metric.id === id)?.label ?? id,
    totalInCents: months.reduce((sum, month) => sum + readMetric(month, id), 0),
  })).toSorted((left, right) => right.totalInCents - left.totalInCents);

  const largest = totals[0]?.totalInCents ?? 0;

  return totals.map((slice) => ({
    ...slice,
    relativeShare: largest === 0 ? 0 : Math.round((slice.totalInCents / largest) * 100),
  }));
}

export function sumSeries(points: readonly MonthPoint[]): number {
  return points.reduce((total, point) => total + point.valueInCents, 0);
}

export function toMonthlyAverage(points: readonly MonthPoint[]): number {
  if (points.length === 0) return 0;
  return Math.round(sumSeries(points) / points.length);
}
