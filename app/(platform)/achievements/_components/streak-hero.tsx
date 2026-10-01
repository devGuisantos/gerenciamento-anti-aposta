import Link from 'next/link';
import { ArrowUpRight, Flame } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { DETECTION_LABELS } from '../../transactions/_detection';
import type { StreakRecord } from '../_streak';
import { describeDays, describeStreakLength } from '../_streak-view';

/**
 * The one hero figure on this screen: whole days without a detected bet.
 *
 * It is a count of days, not an amount, which is why it is the only hero in the
 * product that is **not** red. Red here means a gambling amount; a bet-free day
 * is not one, and spending the colour on it would cost the product the one signal
 * that carries meaning. The figure is also not green: `--spend-none` is reserved
 * for a betting total of exactly zero, and a streak is a different claim.
 *
 * A zero reads as a zero. The module requires a broken streak to be stated
 * neutrally and the counter to restart, so there is no sad copy, no warning
 * colour, no "você perdeu sua sequência" — the number, what ended it, and when
 * the count resumes.
 */
export function StreakHero({ record }: { readonly record: StreakRecord }) {
  const { current, longest } = record;
  const isCurrentTheLongest =
    current.days > 0 && (longest === null || current.days > longest.lengthInDays);

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Flame aria-hidden className="size-4" />
          <span className="text-xs font-medium tracking-wide uppercase">
            Dias sem apostas
          </span>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 py-2 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="space-y-3">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-heading text-5xl font-semibold tracking-tight sm:text-6xl">
              {current.days}
            </span>
            <span className="text-lg text-muted-foreground">
              {current.days === 1 ? 'dia inteiro' : 'dias inteiros'}
            </span>
          </p>

          <p className="text-sm text-muted-foreground">{describeStanding(record)}</p>

          {isCurrentTheLongest ? (
            <p className="text-sm">
              É a sua maior sequência em todo o período que lemos.
            </p>
          ) : null}

          {/* The count is only as complete as the detection behind it, and the
              reader is owed that: a bet the classifier missed leaves a streak
              standing that should have broken. The same uncertainty the statement
              shows with "Possível aposta", said once here. */}
          <p className="text-xs text-muted-foreground">
            Contado em {describeDays(record.windowDayCount)} de extrato, desde{' '}
            {record.windowStartLabel}. A sequência quebra quando uma aposta é identificada — se
            alguma passar sem ser identificada, a contagem não vai saber.
          </p>
        </div>

        <StreakRecordPanel record={record} />
      </CardContent>
    </Card>
  );
}

/** The record beside the current count, which is what makes one day mean something. */
function StreakRecordPanel({ record }: { readonly record: StreakRecord }) {
  const { longest, closedStreaks, betFreeDayCount, windowDayCount } = record;

  return (
    <div className="space-y-2 rounded-lg bg-muted p-4">
      <p className="text-xs text-muted-foreground">Sua maior sequência</p>

      {longest === null ? (
        <p className="text-sm text-muted-foreground">
          Ainda não há uma sequência fechada no período que lemos.
        </p>
      ) : (
        <>
          <p className="font-heading text-2xl font-semibold tracking-tight">
            {describeStreakLength(longest)}
          </p>
          <p className="text-xs text-muted-foreground">
            {longest.startsBeforeWindow
              ? `Terminou em ${longest.endedOnLabel}. Começou antes do período que lemos, então o número é o mínimo que podemos afirmar.`
              : `De ${longest.startedOnLabel} a ${longest.endedOnLabel}.`}
          </p>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        {closedStreaks.length === 1
          ? '1 sequência registrada'
          : `${closedStreaks.length} sequências registradas`}{' '}
        · {betFreeDayCount} de {windowDayCount} dias sem apostas
      </p>

      <Button asChild variant="outline" size="sm" className="h-9 w-full">
        <Link href="/transactions?filter=bets&period=all">
          Ver as apostas identificadas
          <ArrowUpRight />
        </Link>
      </Button>
    </div>
  );
}

/**
 * Where the count stands, said once and without a verdict.
 *
 * Four cases, and none of them is phrased as a loss. A bet today is reported with
 * the policy that caught it, so the reader can go and check it, and then the copy
 * says when the count resumes — the restart is the point, the same way it is for a
 * month that passed its ceiling.
 */
function describeStanding(record: StreakRecord): string {
  const { current } = record;

  if (current.lastBreak === null) {
    return `Nenhuma aposta foi identificada em todo o período que lemos. O dia de hoje entra na conta quando terminar.`;
  }

  if (current.hasBetToday) {
    return `Hoje houve uma aposta, identificada por ${DETECTION_LABELS[current.lastBreak.matchedBy]}. A contagem volta a somar no primeiro dia inteiro sem apostas.`;
  }

  if (current.days === 0) {
    return `A última aposta identificada foi em ${current.lastBreak.onLabel}. O dia de hoje entra na conta quando terminar.`;
  }

  return `Desde a aposta de ${current.lastBreak.onLabel}. O dia de hoje entra na conta quando terminar.`;
}
