import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type { StreakDay } from '../_streak';

/**
 * One square per day, oldest on the left, today on the right.
 *
 * This is the "don't break the chain" habit view, and it is kept strictly
 * retrospective: it shows days that already happened and nothing else. No target
 * row to fill, no counter ticking toward a reward, nothing that moves. A habit
 * grid is not a gambling loop — there is no randomness and no payout — but it is
 * close enough to the forbidden list that the limits are worth writing down.
 *
 * Colour never carries the meaning alone. The legend names both states in words,
 * each square carries its date and state in its `title`, and the same facts are
 * in the sr-only summary and in the streak list below. The two fills are also
 * separated by **lightness** rather than by hue, so they stay distinguishable
 * under every form of colour blindness and in both themes.
 *
 * Red is correct for a bet day: it marks betting, which is the one thing red means
 * in this product.
 */

const BET_DAY_CLASS = 'bg-destructive';
/** A neutral derived from the text colour, so it reads at the same strength in both themes. */
const BET_FREE_DAY_CLASS = 'bg-foreground/15';

type StreakCalendarProps = {
  /** Newest first, as the view produces them. Rendered oldest first. */
  readonly days: readonly StreakDay[];
};

export function StreakCalendar({ days }: StreakCalendarProps) {
  const betDayCount = days.filter((day) => day.hasBet).length;
  const oldestFirst = days.toReversed();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Os últimos {days.length} dias</CardTitle>
        <CardDescription>
          Cada quadrado é um dia do seu extrato. O último, à direita, é hoje.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="sr-only">
          Nos últimos {days.length} dias, {betDayCount} tiveram apostas identificadas e{' '}
          {days.length - betDayCount} não tiveram. A lista de sequências detalha cada período.
        </p>

        {/* Decorative: every fact in it is also in the summary above, the legend
            below and the list of streaks. That is what lets it be skipped by a
            screen reader instead of read out as sixty list items. */}
        <ul
          aria-hidden
          className="grid grid-cols-10 gap-1 sm:grid-cols-[repeat(15,minmax(0,1fr))] lg:grid-cols-[repeat(20,minmax(0,1fr))]"
        >
          {oldestFirst.map((day) => (
            <li
              key={day.daysAgo}
              title={`${day.dateLabel} — ${day.hasBet ? 'aposta identificada' : 'sem apostas'}`}
              className={`aspect-square rounded-sm ${day.hasBet ? BET_DAY_CLASS : BET_FREE_DAY_CLASS} ${
                day.isToday ? 'ring-1 ring-foreground ring-offset-1 ring-offset-card' : ''
              }`}
            />
          ))}
        </ul>

        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <LegendItem swatchClassName={BET_DAY_CLASS} label="Dia com aposta identificada" />
          <LegendItem swatchClassName={BET_FREE_DAY_CLASS} label="Dia sem apostas" />
          {/* The outline alone, with no fill: the ring marks today whichever state
              today turns out to be in, and a filled swatch here would read as a
              claim about which. */}
          <LegendItem swatchClassName="ring-1 ring-foreground" label="Hoje, ainda em andamento" />
        </ul>
      </CardContent>
    </Card>
  );
}

function LegendItem({
  swatchClassName,
  label,
}: {
  readonly swatchClassName: string;
  readonly label: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden className={`size-3 shrink-0 rounded-sm ${swatchClassName}`} />
      {label}
    </li>
  );
}
