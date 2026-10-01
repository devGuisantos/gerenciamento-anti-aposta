import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { DETECTION_LABELS } from '../../transactions/_detection';
import type { BetFreeStreak, StreakRecord } from '../_streak';
import { describeStreakLength } from '../_streak-view';

/** Longest first, and only as many as a phone can read without becoming a wall. */
const VISIBLE_STREAKS = 6;

/**
 * The stretches the user already went through, longest first.
 *
 * Competence in SDT terms is progress you can see, and a single number has no
 * progress in it. The record is also what makes a broken streak bearable: a
 * stretch that ended last week sits beside the one that ran for a month, and the
 * screen says so without adding an opinion about either.
 *
 * Each row names the bet that ended it and the policy that caught it, for the same
 * reason every betting row on the statement does: the classification is the
 * platform's claim, and a claim the user cannot check is a claim they have to take
 * on faith.
 */
export function StreakRecordList({ record }: { readonly record: StreakRecord }) {
  const visible = record.closedStreaks.slice(0, VISIBLE_STREAKS);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suas maiores sequências</CardTitle>
        <CardDescription>
          Períodos fechados sem nenhuma aposta identificada, do maior para o menor.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há uma sequência fechada no período que lemos. A primeira aparece aqui
            quando ela terminar.
          </p>
        ) : (
          <div className="space-y-4">
            <ol className="space-y-4">
              {visible.map((streak, index) => (
                <li key={streak.endedDaysAgo} className="space-y-3">
                  {index > 0 ? <Separator /> : null}
                  <StreakRow streak={streak} />
                </li>
              ))}
            </ol>

            <p className="text-xs text-muted-foreground">{describeRecord(record)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StreakRow({ streak }: { readonly streak: BetFreeStreak }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <div className="min-w-0 space-y-1">
        <h3 className="text-sm font-medium">{describeStreakLength(streak)}</h3>
        <p className="text-xs text-muted-foreground">
          {streak.startsBeforeWindow
            ? `Até ${streak.endedOnLabel}. Começou antes do período que lemos.`
            : `De ${streak.startedOnLabel} a ${streak.endedOnLabel}.`}
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Encerrada por {streak.endedBy.counterparty} · {DETECTION_LABELS[streak.endedBy.matchedBy]}
      </p>
    </div>
  );
}

/**
 * Counts, and stops. "21 sequências em 335 dias" is a fact the reader can do what
 * they like with; anything warmer or colder would be the product having an opinion
 * about their year.
 */
function describeRecord(record: StreakRecord): string {
  const streaks =
    record.closedStreaks.length === 1
      ? '1 sequência fechada'
      : `${record.closedStreaks.length} sequências fechadas`;

  return `${streaks} em ${record.windowDayCount} dias de extrato, desde ${record.windowStartLabel}.`;
}
