import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RecentTransaction } from '@modules/open-finance';

import { RecentTransactionLine } from '../../_components/recent-transaction-line';

/**
 * The newest rows the platform actually read from the bank — the proof that a
 * synchronisation arrived and how each row was classified. Read from the real
 * statement endpoint, not from a fixture.
 */
export function RecentTransactions({
  transactions,
}: {
  readonly transactions: readonly RecentTransaction[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas transações recebidas</CardTitle>
        <CardDescription>As mais recentes lidas do banco, já classificadas.</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            O banco ainda não enviou transações. Registre um lançamento no banco simulado abaixo e
            sincronize.
          </p>
        ) : (
          <ul className="divide-y">
            {transactions.map((transaction) => (
              <RecentTransactionLine key={transaction.id} transaction={transaction} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
