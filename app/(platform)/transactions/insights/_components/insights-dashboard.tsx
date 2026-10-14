'use client';

import { useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { cn } from 'cn';
import { formatBRL } from '@shared/ui/money-text';

import { SupportCard } from '../../_components/support-card';
import { SPEND_LEVEL_CAPTIONS, SPEND_LEVEL_TEXT_CLASSES, toSpendLevel } from '../../_spend-level';
import type { SupportSignal } from '../../_support-signal';
import {
  METRICS,
  MONTH_WINDOWS,
  selectCategoryBreakdown,
  selectMonthlySeries,
  sumSeries,
  toMonthlyAverage,
  type ChartMonth,
  type MetricId,
  type MonthWindow,
} from '../_insights-view';
import { CategoryBreakdown } from './category-breakdown';
import { MonthlyBarChart } from './monthly-bar-chart';

const DEFAULT_METRIC: MetricId = 'BETS';
const DEFAULT_WINDOW: MonthWindow = 6;

type InsightsDashboardProps = {
  /** Newest first, labelled on the server. Only months the backend has data for. */
  readonly months: readonly ChartMonth[];
  /** `null` when the backend could not say: the card then stays away, never alarms. */
  readonly supportSignal: SupportSignal | null;
};

export function InsightsDashboard({ months, supportSignal }: InsightsDashboardProps) {
  const [metricId, setMetricId] = useState<MetricId>(DEFAULT_METRIC);
  const [window, setWindow] = useState<MonthWindow>(DEFAULT_WINDOW);

  const points = useMemo(
    () => selectMonthlySeries(months, metricId, window),
    [months, metricId, window],
  );
  const slices = useMemo(() => selectCategoryBreakdown(months, window), [months, window]);

  const metric = METRICS.find((candidate) => candidate.id === metricId) ?? METRICS[0];
  const isBanded = metricId === 'BETS';
  const total = sumSeries(points);
  const average = toMonthlyAverage(points);

  const animate = useChartEntrance();

  return (
    <div className="space-y-6">
      <SummaryHero
        metricLabel={metric.label}
        window={window}
        totalInCents={total}
        averageInCents={average}
        monthCount={points.length}
        isBanded={isBanded}
      />

      {supportSignal === null ? null : <SupportCard signal={supportSignal} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MetricPicker metricId={metricId} onMetricChange={setMetricId} />
        <WindowPicker window={window} onWindowChange={setWindow} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {metric.label} · últimos {window} meses
          </CardTitle>
          <CardDescription>{metric.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {points.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma transação lida nos últimos {window} meses.
            </p>
          ) : animate === null ? (
            <Skeleton className="h-70 w-full" />
          ) : (
            <MonthlyBarChart
              points={points}
              metricLabel={metric.label}
              isBanded={isBanded}
              animate={animate}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Para onde foi o dinheiro</CardTitle>
          <CardDescription>
            Somando os últimos {window} meses, da maior para a menor categoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryBreakdown slices={slices} />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * `null` until the browser has taken over, then whether to animate.
 *
 * The chart holds a placeholder until hydration finishes: an entrance animation
 * attached to a hydration frequently never plays, and the reduced-motion answer
 * does not exist on the server.
 */
function useChartEntrance(): boolean | null {
  const isHydrated = useIsHydrated();
  const prefersReducedMotion = usePrefersReducedMotion();

  return isHydrated ? !prefersReducedMotion : null;
}

function SummaryHero({
  metricLabel,
  window,
  totalInCents,
  averageInCents,
  monthCount,
  isBanded,
}: {
  readonly metricLabel: string;
  readonly window: MonthWindow;
  readonly totalInCents: number;
  readonly averageInCents: number | null;
  readonly monthCount: number;
  readonly isBanded: boolean;
}) {
  /* Banded on the monthly average, as before; with no whole month yet, on the
     open month itself, which is the only figure there is. */
  const level = toSpendLevel(averageInCents ?? totalInCents);
  const caption = SPEND_LEVEL_CAPTIONS[level];

  return (
    <Card>
      <CardContent className="space-y-2">
        {/* Muted on purpose: the band colours sit at the 3:1 large-text floor, which
            is not enough for type this small. The figure below carries them. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
          <span className="text-xs font-medium tracking-wide uppercase">
            {metricLabel} · últimos {window} meses
          </span>
          {isBanded && caption ? (
            <span className="text-xs text-muted-foreground">
              ({averageInCents === null ? caption : `média mensal ${caption}`})
            </span>
          ) : null}
        </div>

        <p
          className={cn(
            'font-heading text-5xl font-semibold tracking-tight',
            isBanded && SPEND_LEVEL_TEXT_CLASSES[level],
          )}
        >
          {formatBRL(totalInCents)}
        </p>
        <p className="text-sm text-muted-foreground">
          {describeCoverage({ averageInCents, monthCount, window })}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Says what the figure covers. Months with no transactions read are left out
 * by the backend rather than shown as zero, so a window can hold fewer months
 * than it names — and the average is over whole months, never the open one.
 */
function describeCoverage({
  averageInCents,
  monthCount,
  window,
}: {
  readonly averageInCents: number | null;
  readonly monthCount: number;
  readonly window: MonthWindow;
}): string {
  if (monthCount === 0) return `Nenhuma transação lida nos últimos ${window} meses.`;
  const coverage =
    monthCount < window ? ` Há dados de ${monthCount} dos ${window} meses.` : '';
  if (averageInCents === null) return `Só o mês em andamento até agora.${coverage}`;
  return `Média de ${formatBRL(averageInCents)} por mês fechado.${coverage}`;
}

function MetricPicker({
  metricId,
  onMetricChange,
}: {
  readonly metricId: MetricId;
  readonly onMetricChange: (metricId: MetricId) => void;
}) {
  return (
    <Select
      value={metricId}
      onValueChange={(value) => {
        const next = METRICS.find((metric) => metric.id === value)?.id;
        if (next) onMetricChange(next);
      }}
    >
      <SelectTrigger className="h-9 w-full sm:w-56 md:h-8" aria-label="O que mostrar">
        {/* Radix fills SelectValue only after its items register, so name it here. */}
        <SelectValue>{METRICS.find((metric) => metric.id === metricId)?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {METRICS.map((metric) => (
          <SelectItem key={metric.id} value={metric.id}>
            {metric.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function WindowPicker({
  window,
  onWindowChange,
}: {
  readonly window: MonthWindow;
  readonly onWindowChange: (window: MonthWindow) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ToggleGroup
        type="single"
        value={`${window}`}
        onValueChange={(value) => {
          const next = MONTH_WINDOWS.find((candidate) => `${candidate}` === value);
          if (next) onWindowChange(next);
        }}
        aria-label="Período em meses"
        className="w-max"
      >
        {MONTH_WINDOWS.map((candidate) => (
          <ToggleGroupItem key={candidate} value={`${candidate}`} className="h-9 px-3 md:h-8">
            {candidate} meses
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
