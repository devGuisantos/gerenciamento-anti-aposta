import type { Metadata } from 'next';

import { readSessionToken, requireSession } from '@modules/identity';
import { listConnectedAccounts, listTransactions } from '@modules/open-finance';

import { SectionTabs } from './_components/section-tabs';
import { StatementUnavailable } from './_components/statement-unavailable';
import { TransactionLedger } from './_components/transaction-ledger';
import { readStatementFilters } from './_statement-params';
import { toStatementRows } from './_statement-view';

export const metadata: Metadata = {
  title: 'Transações',
  description: 'O extrato das suas contas conectadas, com as apostas identificadas.',
};

/**
 * Rendered per request: it is one person's statement, and the list labels days
 * as "Hoje" and "Ontem", which a static render would freeze at build time.
 * Nothing derived from a user's financial data is ever cached.
 */
export const dynamic = 'force-dynamic';

/**
 * The accounts are read first so a stale `account` in the URL is dropped
 * before it reaches the backend, where it would answer 404 for the whole page.
 */
async function StatementBody({
  token,
  searchParams,
}: {
  readonly token: string;
  readonly searchParams: Awaited<PageProps<'/transactions'>['searchParams']>;
}) {
  const accounts = await listConnectedAccounts(token);
  const knownAccounts = accounts.ok ? accounts.value : [];
  const filters = readStatementFilters(
    searchParams,
    knownAccounts.map((account) => account.id),
  );
  const ledger = await listTransactions(token, { ...filters, cursor: null });

  if (!ledger.ok) {
    return <StatementUnavailable reason={{ kind: 'FAILED', message: ledger.failure.message }} />;
  }
  if (ledger.value.syncStatus !== 'READY') {
    return <StatementUnavailable reason={{ kind: ledger.value.syncStatus }} />;
  }

  return (
    <TransactionLedger
      filters={filters}
      accounts={knownAccounts}
      totals={ledger.value.totals}
      rows={toStatementRows(ledger.value.items, new Date())}
      nextCursor={ledger.value.nextCursor}
    />
  );
}

export default async function TransactionsPage({ searchParams }: PageProps<'/transactions'>) {
  await requireSession();
  const token = await readSessionToken();

  if (token === null) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Transações</h1>
        <p className="text-sm text-muted-foreground">
          Todo o histórico compartilhado pelas suas contas conectadas. Marcamos o que veio de casas
          de apostas e mostramos como cada uma foi identificada.
        </p>
      </div>

      <SectionTabs />

      <StatementBody token={token} searchParams={await searchParams} />
    </div>
  );
}
