import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowUpRight,
  Flame,
  Landmark,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { MoneyText, formatBRL } from '@shared/ui/money-text';

import {
  describeCycleMargin,
  selectCycles,
  type GoalCycle,
  type MonthlyBetTotal,
} from '../goals/_goals-view';
import { GOALS } from '../goals/_mock-goals';
import { MONTHLY_HISTORY } from '../transactions/insights/_mock-monthly-history';
import {
  FIXED_INCOME_ANNUAL_RATE,
  RECENT_TRANSACTIONS,
  SNAPSHOT,
  type TransactionRow,
} from './_mock-snapshot';

export const metadata: Metadata = {
  title: 'Início',
  description: 'Seu panorama financeiro e o custo real das apostas.',
};

/** The goal card reads the month under way, and which month that is changes daily. */
export const dynamic = 'force-dynamic';

const ratePercent = (FIXED_INCOME_ANNUAL_RATE * 100)
  .toFixed(1)
  .replace('.', ',');

const MONTHS: readonly MonthlyBetTotal[] = MONTHLY_HISTORY.map((month) => ({
  monthsAgo: month.monthsAgo,
  betsInCents: month.bets,
}));

export default function DashboardPage() {
  const currentCycle = selectCycles(GOALS, MONTHS, new Date()).find(
    (cycle) => cycle.monthsAgo === 0,
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Olá, Guilherme
        </h1>
        <p className="text-sm text-muted-foreground">
          Este é o retrato do seu mês. Os números abaixo são retrospectivos: eles
          mostram o que já aconteceu, não bloqueiam nada.
        </p>
      </div>

      <BetSpendHero />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          icon={Landmark}
          label="Saldo disponível"
          value={formatBRL(SNAPSHOT.availableBalanceInCents)}
          detail={`${SNAPSHOT.connectedAccounts} contas conectadas`}
        />
        <StatTile
          icon={TrendingUp}
          label="Renderia em 12 meses"
          value={formatBRL(SNAPSHOT.twelveMonthYieldInCents)}
          detail={`O gasto do mês a ${ratePercent}% ao ano em renda fixa`}
        />
        <StatTile
          icon={Flame}
          label="Dias sem apostar"
          value={`${SNAPSHOT.betFreeStreakDays}`}
          detail={`Sua melhor sequência foi de ${SNAPSHOT.bestStreakDays} dias`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b pb-4">
            <CardTitle>Últimas transações</CardTitle>
            <CardDescription>
              Identificamos automaticamente o que veio de casas de apostas.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <ul>
              {RECENT_TRANSACTIONS.map((transaction, index) => (
                <li key={transaction.id}>
                  {index > 0 ? <Separator /> : null}
                  <TransactionLine transaction={transaction} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <GoalCard cycle={currentCycle} />

          <Card>
            <CardHeader>
              <CardTitle>Contas conectadas</CardTitle>
              <CardDescription>
                Compartilhamento via Open Finance, revogável a qualquer momento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm" className="h-9 w-full">
                <Link href="/accounts">
                  Gerenciar consentimento
                  <ArrowUpRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * The one hero figure on this view. It is the betting spend rather than the
 * balance because that is the number the product exists to make visible.
 */
function BetSpendHero() {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2 text-destructive">
          <TrendingDown className="size-4" />
          <span className="text-xs font-medium tracking-wide uppercase">
            Gasto com apostas neste mês
          </span>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="space-y-2">
          <p className="font-heading text-5xl font-semibold tracking-tight text-destructive">
            {formatBRL(SNAPSHOT.monthlyBetSpendInCents)}
          </p>
          <p className="text-sm text-muted-foreground">
            Em {SNAPSHOT.monthlyBetTransactions} transações.{' '}
            <span className="text-destructive">
              <MoneyText cents={SNAPSHOT.betSpendDeltaInCents} signed /> em
              relação ao mês passado
            </span>
            .
          </p>
        </div>

        <div className="space-y-2 rounded-lg bg-muted p-4">
          <p className="text-xs text-muted-foreground">
            Esse mesmo valor, aplicado em renda fixa por 12 meses
          </p>
          <p className="font-heading text-2xl font-semibold tracking-tight">
            {formatBRL(SNAPSHOT.twelveMonthYieldInCents)}
          </p>
          <p className="text-xs text-muted-foreground">
            Estimativa a {ratePercent}% ao ano — um rendimento de{' '}
            {formatBRL(
              SNAPSHOT.twelveMonthYieldInCents -
                SNAPSHOT.monthlyBetSpendInCents,
            )}
            . Não é uma garantia de retorno.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * The goal in one card: the month's betting against the ceiling the user set.
 *
 * Progress is measured, never reported — the figure comes from the same monthly
 * totals `/goals` reads, so the two screens cannot show different progress on the
 * same goal.
 */
function GoalCard({ cycle }: { readonly cycle: GoalCycle | undefined }) {
  if (!cycle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sua meta</CardTitle>
          <CardDescription>
            Você ainda não definiu um teto de gastos com apostas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm" className="h-9 w-full">
            <Link href="/goals">Definir uma meta</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isOverCeiling = cycle.marginInCents < 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sua meta</CardTitle>
        <CardDescription>
          No máximo {formatBRL(cycle.ceilingInCents)} por mês · {cycle.destination}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          {/* A betting amount, so it takes red here for the same reason it does in
              the hero above — and the line under it names what it is. */}
          <span className="font-heading text-xl font-semibold tracking-tight text-destructive">
            {formatBRL(cycle.spentInCents)}
          </span>
          <span className="text-xs text-muted-foreground">
            de {formatBRL(cycle.ceilingInCents)}
          </span>
        </div>
        <Progress
          value={Math.min(cycle.usedPercentage, 100)}
          aria-label={`Gasto com apostas neste mês, contra o teto de ${formatBRL(cycle.ceilingInCents)}`}
          className={isOverCeiling ? '*:data-[slot=progress-indicator]:bg-destructive' : undefined}
        />
        <p className="text-xs text-muted-foreground">
          {describeCycleMargin(cycle)} neste mês. Você definiu este teto — pode
          mudá-lo quando quiser.
        </p>
        <Button asChild variant="outline" size="sm" className="h-9 w-full">
          <Link href="/goals">Ver metas</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function TransactionLine({ transaction }: { readonly transaction: TransactionRow }) {
  const isCredit = transaction.amountInCents > 0;

  return (
    <div className="flex items-center justify-between gap-4 px-(--card-spacing) py-3">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {transaction.merchant}
          </span>
          {/* Red never carries meaning alone — the badge names what it is. */}
          {transaction.isBet ? (
            <Badge variant="destructive" className="shrink-0">
              Aposta
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {transaction.when}
          {transaction.matchedBy ? ` · identificada por ${transaction.matchedBy}` : ''}
        </p>
      </div>

      <MoneyText
        cents={transaction.amountInCents}
        signed={isCredit}
        tabular
        className={`shrink-0 text-sm font-medium ${
          transaction.isBet ? 'text-destructive' : ''
        }`}
      />
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  readonly icon: typeof Landmark;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="size-4" />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="font-heading text-2xl font-semibold tracking-tight">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
