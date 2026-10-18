import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, TrendingDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { summariseBetting, type BettingSummary } from '@modules/bet-detection';
import { readSessionToken, requireSession } from '@modules/identity';
import { formatBRL } from '@shared/ui/money-text';
import { cn } from 'cn';

import { StatementUnavailable } from '../transactions/_components/statement-unavailable';
import {
  describeBookmakers,
  describeBusiestBand,
  describeTransactions,
  toBetCostView,
  toBookmakerViews,
  toDetectionTallyViews,
  toHourBucketViews,
  type BetCostView,
} from './_bets-view';
import { toEquivalences, type Equivalence } from './_equivalences';
import { toBetPeriod, type BetPeriodDays } from './_period';
import { BookmakerRanking } from './_components/bookmaker-ranking';
import { DetectionAudit } from './_components/detection-audit';
import { HourPattern } from './_components/hour-pattern';
import { PeriodSelector } from './_components/period-selector';
import { SpendingEquivalences } from './_components/spending-equivalences';

export const metadata: Metadata = {
  title: 'Apostas',
  description: 'As transações identificadas como casas de apostas e o custo acumulado delas.',
};

/** One person's data, and the labels are relative to today. */
export const dynamic = 'force-dynamic';

export default async function BetsPage({ searchParams }: PageProps<'/bets'>) {
  await requireSession();
  const token = await readSessionToken();
  const period = toBetPeriod((await searchParams).period);

  if (token === null) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Apostas</h1>
        <p className="text-sm text-muted-foreground">
          As transações identificadas como casas de apostas, para onde elas foram e como cada uma
          foi identificada.
        </p>
      </div>

      <PeriodSelector current={period} />

      <BetsBody token={token} period={period} />
    </div>
  );
}

/**
 * One backend call drives every section, so the ranking, the tallies and the
 * hours can never describe a different stretch of time than the headline.
 * No consent is not zero: it renders a sentence, never a R$ 0,00 hero.
 */
async function BetsBody({
  token,
  period,
}: {
  readonly token: string;
  readonly period: BetPeriodDays;
}) {
  const summary = await summariseBetting(token, period);

  if (!summary.ok) {
    return <StatementUnavailable reason={{ kind: 'FAILED', message: summary.failure.message }} />;
  }
  if (summary.value.syncStatus !== 'READY') {
    return <StatementUnavailable reason={{ kind: summary.value.syncStatus }} />;
  }

  return <BetsOverview summary={summary.value} period={period} />;
}

function BetsOverview({
  summary,
  period,
}: {
  readonly summary: BettingSummary;
  readonly period: BetPeriodDays;
}) {
  const cost = toBetCostView(summary, period);

  if (cost.transactionCount === 0) {
    return <NoBetsFound period={period} />;
  }

  const hours = toHourBucketViews(summary.hourBuckets);

  return (
    <>
      <AccumulatedCost
        cost={cost}
        equivalences={toEquivalences(summary.equivalences)}
        period={period}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b pb-4">
            <CardTitle>Para onde foi</CardTitle>
            <CardDescription>
              Cada casa de apostas, da maior para a menor, nos últimos {period} dias. Toque para
              ver os detalhes.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <BookmakerRanking bookmakers={toBookmakerViews(summary.bookmakers, period)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como identificamos</CardTitle>
            <CardDescription>
              A regra que reconheceu cada transação, e o quanto ela é confiável.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DetectionAudit tallies={toDetectionTallyViews(summary.detectionTallies)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em que horários</CardTitle>
          <CardDescription>
            As apostas distribuídas pelo dia, em faixas de três horas (horário de Brasília).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HourPattern
            buckets={hours}
            summary={describeBusiestBand(hours, cost.transactionCount)}
          />
        </CardContent>
      </Card>
    </>
  );
}

/**
 * A window we read and found nothing in. Stated as what was looked at, never
 * as praise, and with no claim beyond the accounts the reader shared.
 */
function NoBetsFound({ period }: { readonly period: BetPeriodDays }) {
  return (
    <Card>
      <CardContent className="space-y-2 py-10 text-center">
        <p className="font-heading text-4xl font-semibold tracking-tight text-spend-none">
          {formatBRL(0)}
        </p>
        <p className="text-sm text-muted-foreground">
          Nenhuma transação com casas de apostas nas contas conectadas nos últimos {period} dias.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * The one hero figure here, and the reason the screen exists: not the month, but
 * everything the bookmakers have taken, net of what they gave back.
 *
 * It carries two reframings of the same number, because they answer different
 * questions. Fixed income answers "what would it have become"; the carousel
 * answers "what would it have bought". The second is the one people picture, so
 * it gets the width — but it sits below the figure, never instead of it. Both
 * are the backend's (`awareness`), never computed here.
 */
function AccumulatedCost({
  cost,
  equivalences,
  period,
}: {
  readonly cost: BetCostView;
  readonly equivalences: readonly Equivalence[];
  readonly period: BetPeriodDays;
}) {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingDown aria-hidden className="size-4" />
          <span className="text-xs font-medium tracking-wide uppercase">
            Custo com apostas · últimos {period} dias
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 py-2">
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-2">
            <p
              className={cn(
                'font-heading text-5xl font-semibold tracking-tight sm:text-6xl',
                cost.totalInCents === 0 ? 'text-spend-none' : 'text-destructive',
              )}
            >
              {formatBRL(cost.totalInCents)}
            </p>
            <p className="text-sm text-muted-foreground">
              {describeTransactions(cost.transactionCount)} em{' '}
              {describeBookmakers(cost.bookmakerCount)}
              {cost.sinceLabel === null ? '' : `, desde ${cost.sinceLabel}`}.
            </p>
            {/* A refund gives the money back, so it was never foregone: the hero
                is net, and this line says by how much. */}
            {cost.refundCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                Já descontados {formatBRL(cost.refundTotalInCents)} de{' '}
                {cost.refundCount === 1 ? '1 estorno' : `${cost.refundCount} estornos`}.
              </p>
            ) : null}
            {/* The same figure against what actually came in, over the same days.
                An absolute number is abstract; a share of income is the scale a
                person lives at. Not capped: above 100% is a fact about the window. */}
            {cost.incomeShare ? (
              <p className="text-sm text-muted-foreground">
                Equivale a{' '}
                <span className="font-medium text-foreground">{cost.incomeShare.percentage}%</span>{' '}
                do que entrou como renda no período ({formatBRL(cost.incomeShare.incomeInCents)}).
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-lg bg-muted p-4">
            <p className="text-xs text-muted-foreground">
              Esse mesmo valor, aplicado em renda fixa por 12 meses
            </p>
            <p className="font-heading text-2xl font-semibold tracking-tight">
              {formatBRL(cost.yieldEquivalentInCents)}
            </p>
            <p className="text-xs text-muted-foreground">
              Estimativa a {cost.ratePercentLabel}% ao ano — um rendimento de{' '}
              {formatBRL(cost.yieldEquivalentInCents - cost.totalInCents)}. Não é uma garantia de
              retorno.
            </p>
            <Button asChild variant="outline" size="sm" className="h-9 w-full">
              <Link href={cost.statementHref}>
                Ver no extrato
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </div>

        <SpendingEquivalences equivalences={equivalences} />
      </CardContent>
    </Card>
  );
}
