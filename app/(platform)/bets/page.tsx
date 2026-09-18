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
import { formatBRL } from '@shared/ui/money-text';

import { FIXED_INCOME_ANNUAL_RATE } from '../dashboard/_mock-snapshot';
import { toLedgerRows, toYieldEquivalentInCents } from '../transactions/_ledger-view';
import { buildLedgerEntries } from '../transactions/_mock-ledger';
import {
  describeBusiestBand,
  selectBetRows,
  selectBookmakers,
  summariseBetCost,
  summariseHours,
  summariseIncomeShare,
  tallyDetections,
  type IncomeShare,
} from './_bets-view';
import { selectEquivalences } from './_equivalences';
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

/** Same reason as the statement: the labels are relative to today. */
export const dynamic = 'force-dynamic';

const ratePercent = (FIXED_INCOME_ANNUAL_RATE * 100).toFixed(1).replace('.', ',');

export default async function BetsPage({ searchParams }: PageProps<'/bets'>) {
  const period = toBetPeriod((await searchParams).period);
  const reference = new Date();
  /* The same entries the statement reads, so the two screens cannot disagree
     about how much went to betting. */
  /* One window drives every section, so the ranking, the tallies and the hours can
     never describe a different stretch of time than the headline figure. */
  const allRows = toLedgerRows(buildLedgerEntries(reference), reference).filter(
    (row) => row.daysAgo < period,
  );
  const betRows = selectBetRows(allRows);

  const cost = summariseBetCost(betRows);
  const bookmakers = selectBookmakers(betRows);
  const tallies = tallyDetections(betRows);
  const hours = summariseHours(betRows);
  const busiestBand = describeBusiestBand(hours, betRows.length);
  const incomeShare = summariseIncomeShare(allRows, cost.totalInCents);

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

      <AccumulatedCost
        totalInCents={cost.totalInCents}
        transactionCount={cost.transactionCount}
        bookmakerCount={cost.bookmakerCount}
        sinceLabel={cost.sinceLabel}
        incomeShare={incomeShare}
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
            <BookmakerRanking bookmakers={bookmakers} />
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
            <DetectionAudit tallies={tallies} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em que horários</CardTitle>
          <CardDescription>
            As apostas distribuídas pelo dia, em faixas de três horas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HourPattern buckets={hours} summary={busiestBand} />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * The one hero figure here, and the reason the screen exists: not the month, but
 * everything the bookmakers have taken.
 *
 * It carries two reframings of the same number, because they answer different
 * questions. Fixed income answers "what would it have become"; the carousel
 * answers "what would it have bought". The second is the one people picture, so
 * it gets the width — but it sits below the figure, never instead of it.
 */
function AccumulatedCost({
  totalInCents,
  transactionCount,
  bookmakerCount,
  sinceLabel,
  incomeShare,
  period,
}: {
  readonly totalInCents: number;
  readonly transactionCount: number;
  readonly bookmakerCount: number;
  readonly sinceLabel: string;
  readonly incomeShare: IncomeShare | null;
  readonly period: BetPeriodDays;
}) {
  const yieldInCents = toYieldEquivalentInCents(totalInCents, FIXED_INCOME_ANNUAL_RATE);
  const equivalences = selectEquivalences(totalInCents);

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
            <p className="font-heading text-5xl font-semibold tracking-tight text-destructive sm:text-6xl">
              {formatBRL(totalInCents)}
            </p>
            <p className="text-sm text-muted-foreground">
              {transactionCount} transações em {bookmakerCount} casas de apostas, desde{' '}
              {sinceLabel}.
            </p>
            {/* The same figure against what actually came in. An absolute number is
                abstract; a share of income is the scale a person lives at. Both sides
                are counted over the same days — see `summariseIncomeShare`. */}
            {incomeShare ? (
              <p className="text-sm text-muted-foreground">
                Equivale a{' '}
                <span className="font-medium text-foreground">{incomeShare.percentage}%</span> de
                tudo que entrou na conta no período ({formatBRL(incomeShare.incomeInCents)}).
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-lg bg-muted p-4">
            <p className="text-xs text-muted-foreground">
              Esse mesmo valor, aplicado em renda fixa por 12 meses
            </p>
            <p className="font-heading text-2xl font-semibold tracking-tight">
              {formatBRL(yieldInCents)}
            </p>
            <p className="text-xs text-muted-foreground">
              Estimativa a {ratePercent}% ao ano — um rendimento de{' '}
              {formatBRL(yieldInCents - totalInCents)}. Não é uma garantia de retorno.
            </p>
            <Button asChild variant="outline" size="sm" className="h-9 w-full">
              <Link href="/transactions?filter=bets&period=all">
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
