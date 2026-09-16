'use client';

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatBRL } from '@shared/ui/money-text';

import {
  BAND_FLOORS_IN_CENTS,
  SPEND_LEVEL_CAPTIONS,
  toSpendLevel,
} from '../../_spend-level';
import type { MonthPoint } from '../_insights-view';

/** One series only, so no legend: the card title already names what is plotted. */
const CHART_CONFIG = {
  valueInCents: { label: 'Valor' },
} satisfies ChartConfig;

type MonthlyBarChartProps = {
  readonly points: readonly MonthPoint[];
  readonly metricLabel: string;
  /** Betting is the one series that gets the threshold bands; everything else is neutral. */
  readonly isBanded: boolean;
  readonly animate: boolean;
};

export function MonthlyBarChart({
  points,
  metricLabel,
  isBanded,
  animate,
}: MonthlyBarChartProps) {
  const rows = points.map((point) => ({ ...point, value: point.valueInCents / 100 }));

  return (
    <ChartContainer config={CHART_CONFIG} className="h-70 w-full">
      <BarChart data={rows} margin={{ top: 16, right: 8, bottom: 0, left: 8 }}>
        {/* Hairline, solid, recessive — the data is the only loud thing here. */}
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="shortLabel"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-xs"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickMargin={4}
          className="text-xs"
          tickFormatter={(value: number) => toCompactBRL(value)}
        />

        {isBanded ? <BandThresholds /> : null}

        <ChartTooltip cursor={false} content={<MonthTooltip isBanded={isBanded} />} />

        <Bar
          dataKey="value"
          name={metricLabel}
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
          isAnimationActive={animate}
          animationDuration={700}
          animationEasing="ease-out"
        >
          {rows.map((row) => (
            <Cell key={row.monthsAgo} fill={toBarFill(row.valueInCents, isBanded)} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/**
 * The bands' colours are not distinguishable to every reader — amber and red are
 * near-identical under protanopia — so the thresholds are drawn. Position, not
 * hue, is what actually tells you which band a month landed in.
 */
function BandThresholds() {
  return (
    <>
      {BAND_FLOORS_IN_CENTS.map((floorInCents) => (
        <ReferenceLine
          key={floorInCents}
          y={floorInCents / 100}
          stroke="var(--muted-foreground)"
          strokeWidth={1}
          label={{
            value: formatBRL(floorInCents),
            position: 'insideTopLeft',
            className: 'fill-muted-foreground text-[10px]',
          }}
        />
      ))}
    </>
  );
}

function toBarFill(valueInCents: number, isBanded: boolean): string {
  if (!isBanded) return 'var(--chart-2)';
  const level = toSpendLevel(valueInCents);
  if (level === 'NONE') return 'var(--spend-none)';
  if (level === 'LOW') return 'var(--foreground)';
  if (level === 'MEDIUM') return 'var(--spend-medium)';
  return 'var(--spend-high)';
}

/** Compact ticks keep the axis to clean, readable numbers. */
function toCompactBRL(value: number): string {
  if (Math.abs(value) >= 1000) return `R$ ${Math.round(value / 1000)}k`;
  return `R$ ${Math.round(value)}`;
}

type TooltipPayload = {
  readonly payload?: readonly { readonly payload: MonthPoint }[];
  readonly active?: boolean;
  readonly isBanded: boolean;
};

function MonthTooltip({ active, payload, isBanded }: TooltipPayload) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  const caption = SPEND_LEVEL_CAPTIONS[toSpendLevel(point.valueInCents)];

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-xs text-muted-foreground">{point.longLabel}</p>
      <p className="font-heading text-base font-semibold tabular-nums">
        {formatBRL(point.valueInCents)}
      </p>
      {/* Names the band in words, because its colour cannot be relied on. */}
      {isBanded && caption ? (
        <p className="text-xs text-muted-foreground">{caption}</p>
      ) : null}
    </div>
  );
}
