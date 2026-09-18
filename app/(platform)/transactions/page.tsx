import type { Metadata } from 'next';

import { SectionTabs } from './_components/section-tabs';
import { TransactionLedger } from './_components/transaction-ledger';
import { toLedgerRows, type LedgerFilter, type LedgerPeriod } from './_ledger-view';
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

/* Only the views another screen links into. An unknown value falls back to the
   default rather than erroring: a bad query string is not worth a broken page. */
const FILTERS: Readonly<Record<string, LedgerFilter>> = {
  bets: 'BETS',
  credits: 'CREDITS',
  debits: 'DEBITS',
};

const PERIODS: Readonly<Record<string, LedgerPeriod>> = {
  '30d': 'LAST_30_DAYS',
  '90d': 'LAST_90_DAYS',
  all: 'ALL_TIME',
};

function readParam<Value>(
  raw: string | readonly string[] | undefined,
  allowed: Readonly<Record<string, Value>>,
): Value | undefined {
  const key = Array.isArray(raw) ? raw[0] : raw;
  return typeof key === 'string' ? allowed[key] : undefined;
}

export default async function TransactionsPage({ searchParams }: PageProps<'/transactions'>) {
  const { filter, period } = await searchParams;
  const reference = new Date();
  const rows = toLedgerRows(buildLedgerEntries(reference), reference);

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

      <TransactionLedger
        rows={rows}
        initialFilter={readParam(filter, FILTERS)}
        initialPeriod={readParam(period, PERIODS)}
      />
    </div>
  );
}
