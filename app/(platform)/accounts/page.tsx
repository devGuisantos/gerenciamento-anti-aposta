import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { readSessionToken, requireSession } from '@modules/identity';
import {
  fetchCurrentConsent,
  listConnectedAccounts,
  listRecentTransactions,
  type ConnectedAccount,
  type Consent,
  type RecentTransaction,
} from '@modules/open-finance';
import {
  DEMO_MOVEMENTS,
  ENTRY_TYPES,
  GAMBLING_MCC,
  listBankAccounts,
  type BankAccount,
} from '@modules/sandbox-bank';

import { BankLedgerForm } from './_components/bank-ledger-form';
import { ConnectCard } from './_components/connect-card';
import { ConnectionNotice, type ConnectionOutcome } from './_components/connection-notice';
import { ConsentCard } from './_components/consent-card';
import { RecentTransactions } from './_components/recent-transactions';

export const metadata: Metadata = {
  title: 'Contas conectadas',
  description: 'Consentimentos do Open Finance: conectar, sincronizar e revogar.',
};

/** Per request: it shows one person's consent, and nothing financial is ever cached. */
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The callback's outcome arrives as codes in the query string. Only codes are
 * read; the notice picks its words from a fixed table.
 */
function toOutcome(searchParams: SearchParams): ConnectionOutcome | null {
  const connection = searchParams['conexao'];

  if (connection === 'ativa') {
    const ingested = Number(searchParams['novas']);

    return { kind: 'CONNECTED', ingestedCount: Number.isInteger(ingested) ? ingested : 0 };
  }

  if (connection === 'recusada') {
    return { kind: 'REJECTED' };
  }

  if (connection === 'erro') {
    const code = searchParams['motivo'];

    return { kind: 'FAILED', code: typeof code === 'string' ? code : '' };
  }

  return null;
}

type AccountsScreen = {
  readonly consent: Consent | null;
  readonly accounts: readonly ConnectedAccount[];
  readonly transactions: readonly RecentTransaction[];
  /** `null` when the bank's screens could not be reached. */
  readonly bankAccounts: readonly BankAccount[] | null;
};

/**
 * Four independent reads, made together. A backend failure on the consent
 * itself throws to the error boundary; the other three degrade to an empty
 * section, because a missing list is better than a broken screen.
 */
async function loadScreen(token: string): Promise<AccountsScreen> {
  const [consent, accounts, transactions, bankAccounts] = await Promise.all([
    fetchCurrentConsent(token),
    listConnectedAccounts(token),
    listRecentTransactions(token),
    listBankAccounts(token),
  ]);

  if (!consent.ok) {
    throw new Error(`Consent could not be read: ${consent.failure.code}`);
  }

  return {
    consent: consent.value,
    accounts: accounts.ok ? accounts.value : [],
    transactions: transactions.ok ? transactions.value : [],
    bankAccounts: bankAccounts.ok ? bankAccounts.value : null,
  };
}

/**
 * "Contas conectadas": the whole Open Finance flow from the person's side —
 * connect (and be sent to the bank to authorise), see what is shared,
 * synchronise, revoke — plus the simulated bank's own ledger, where a
 * demonstration books the movements the platform will then read.
 */
export default async function AccountsPage({ searchParams }: PageProps<'/accounts'>) {
  await requireSession();
  const token = await readSessionToken();

  if (token === null) {
    return null;
  }

  const screen = await loadScreen(token);
  const isAuthorised = screen.consent?.status === 'AUTHORISED';

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Contas conectadas</h1>
        <p className="text-sm text-muted-foreground">
          Você decide o que o anti-aposta pode ler, e pode revogar a qualquer momento.
        </p>
      </div>

      <ConnectionNotice outcome={toOutcome(await searchParams)} />

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        {isAuthorised && screen.consent !== null ? (
          <ConsentCard consent={screen.consent} accounts={screen.accounts} />
        ) : (
          <ConnectCard previous={screen.consent} />
        )}
        {isAuthorised ? <RecentTransactions transactions={screen.transactions} /> : null}
      </div>

      <SandboxBankSection bankAccounts={screen.bankAccounts} />
    </div>
  );
}

function SandboxBankSection({
  bankAccounts,
}: {
  readonly bankAccounts: readonly BankAccount[] | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Banco simulado: registrar um lançamento</CardTitle>
        <CardDescription>
          Ambiente de demonstração. Isto acontece do lado do Banco Andorinha, como se você tivesse
          usado a conta ou o cartão: o lançamento fica no banco e só chega ao anti-aposta quando
          você sincroniza. Nenhum valor aqui é real.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bankAccounts === null || bankAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            O banco simulado não está disponível agora.
          </p>
        ) : (
          <BankLedgerForm
            accounts={bankAccounts}
            movements={DEMO_MOVEMENTS}
            entryTypes={ENTRY_TYPES}
            gamblingMcc={GAMBLING_MCC}
          />
        )}
      </CardContent>
    </Card>
  );
}
