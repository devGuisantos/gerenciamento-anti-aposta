import type { Metadata } from 'next';

import { SectionTabs } from './_components/section-tabs';
import { TransactionLedger } from './_components/transaction-ledger';
import { toLedgerRows } from './_ledger-view';
import { buildLedgerEntries } from './_mock-ledger';

export const metadata: Metadata = {
  title: 'Transações',
  description: 'O extrato das suas contas conectadas, com as apostas identificadas.',
};

/**
 * Rendered per request: the list labels days as "Hoje" and "Ontem", and a static
 * render would freeze those at build time. It is also the right default here —
 * nothing derived from a user's financial data is ever cached.
 */
export const dynamic = 'force-dynamic';

export default function TransactionsPage() {
  const rows = toLedgerRows(buildLedgerEntries(new Date()), new Date());

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

      <TransactionLedger rows={rows} />
    </div>
  );
}
