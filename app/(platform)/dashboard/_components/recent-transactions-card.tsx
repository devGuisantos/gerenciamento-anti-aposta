import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { RecentTransaction } from '@modules/open-finance';

import { RecentTransactionLine } from '../../_components/recent-transaction-line';

/**
 * The newest rows of the real statement. `null` is a failed read, said in place
 * so the rest of the dashboard still stands.
 */
export function RecentTransactionsCard({
  transactions,
}: {
  readonly transactions: readonly RecentTransaction[] | null;
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="border-b pb-4">
        <CardTitle>Últimas transações</CardTitle>
        <CardDescription>
          Identificamos automaticamente o que veio de casas de apostas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TransactionList transactions={transactions} />
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="h-9 w-full sm:w-auto">
          <Link href="/transactions">
            Ver extrato completo
            <ArrowUpRight />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function TransactionList({
  transactions,
}: {
  readonly transactions: readonly RecentTransaction[] | null;
}) {
  if (transactions === null) {
    return <p className="text-sm text-muted-foreground">Não conseguimos carregar as transações agora.</p>;
  }
  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground">O banco ainda não enviou transações.</p>;
  }

  return (
    <ul className="divide-y">
      {transactions.map((transaction) => (
        <RecentTransactionLine key={transaction.id} transaction={transaction} />
      ))}
    </ul>
  );
}
