import { z } from 'zod';

import { callBackend, type BackendResult } from '@shared/infrastructure/backend-api';

/**
 * The simulated bank's own screens — the authorisation screen and the
 * ledger — served by backend-anti-aposta under `/sandbox`.
 *
 * Only those. The Open Finance surface the bank exposes to a DataRecipient
 * (`/token`, `/consents`, `/accounts`) is called by the backend's
 * `open-finance` context over HTTP, never from here: this app is the bank's
 * front end for the person, not a second DataRecipient.
 */

export const ACCOUNT_TYPES = ['CONTA_DEPOSITO_A_VISTA', 'CARTAO_CREDITO'] as const;
export type BankAccountType = (typeof ACCOUNT_TYPES)[number];

export const ENTRY_TYPES = [
  'PIX',
  'CARTAO',
  'TED',
  'BOLETO',
  'CONVENIO_ARRECADACAO',
  'FOLHA_PAGAMENTO',
  'TRANSFERENCIA_MESMA_INSTITUICAO',
] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export const PERMISSIONS = ['ACCOUNTS_READ', 'ACCOUNTS_TRANSACTIONS_READ', 'RESOURCES_READ'] as const;
export type Permission = (typeof PERMISSIONS)[number];

const bankAccountSchema = z.object({
  id: z.string(),
  type: z.enum(ACCOUNT_TYPES),
  brandName: z.string(),
  branchCode: z.string(),
  numberEnding: z.string(),
});

export type BankAccount = z.infer<typeof bankAccountSchema>;

const authorisationRequestSchema = z.object({
  client: z.object({ displayName: z.string() }),
  consent: z.object({
    id: z.string(),
    permissions: z.array(z.enum(PERMISSIONS)),
    expiresAt: z.iso.datetime({ offset: true }),
  }),
  accounts: z.array(bankAccountSchema),
});

export type AuthorisationRequest = z.infer<typeof authorisationRequestSchema>;

/** The OAuth parameters exactly as the client put them in the URL. */
export type AuthorisationQuery = Readonly<Record<string, string>>;

export type AuthorisationDecision = {
  readonly clientId: string;
  readonly redirectUri: string;
  readonly scope: string;
  readonly state: string;
  readonly codeChallenge: string;
  readonly codeChallengeMethod: string;
  readonly decision: 'APPROVE' | 'REJECT';
  readonly accountIds: readonly string[];
};

const decisionSchema = z.object({ redirectTo: z.url() });

const bankAccountsSchema = z.object({ items: z.array(bankAccountSchema) });

export type LedgerEntryRequest = {
  readonly accountId: string;
  readonly amountInCents: number;
  readonly transactionName: string;
  readonly type: EntryType;
  readonly merchantCategoryCode: number | null;
  readonly payeeDocument: string | null;
};

const ledgerEntrySchema = z.object({
  entry: z.object({
    id: z.string(),
    amount: z.object({ amountInCents: z.number().int() }),
    transactionName: z.string(),
  }),
});

export type BookedLedgerEntry = z.infer<typeof ledgerEntrySchema>['entry'];

/** `GET /open-finance/v2/authorize` — what the authorisation screen shows. */
export async function describeAuthorisationRequest(
  sessionToken: string,
  query: AuthorisationQuery,
): Promise<BackendResult<AuthorisationRequest>> {
  return callBackend({
    method: 'GET',
    surface: 'SANDBOX',
    path: `/open-finance/v2/authorize?${new URLSearchParams(query).toString()}`,
    sessionToken,
    responseSchema: authorisationRequestSchema,
  });
}

/** `POST /open-finance/v2/authorize` — the person's answer; returns where to send the browser. */
export async function decideAuthorisation(
  sessionToken: string,
  decision: AuthorisationDecision,
): Promise<BackendResult<string>> {
  const result = await callBackend({
    method: 'POST',
    surface: 'SANDBOX',
    path: '/open-finance/v2/authorize',
    body: decision,
    sessionToken,
    responseSchema: decisionSchema,
  });

  return result.ok ? { ok: true, value: result.value.redirectTo } : result;
}

function customerPath(customerId: string): string {
  return `/bank/customers/${encodeURIComponent(customerId)}/accounts`;
}

/**
 * `GET /bank/customers/{customerId}/accounts` — somebody's accounts at the bank,
 * for the demonstration console. It opens none: a customer who never reached
 * the bank has an empty list. Like the booking route, it does not exist where
 * the backend switched demo writes off (always in production), and answers 404.
 */
export async function listCustomerBankAccounts(
  sessionToken: string,
  customerId: string,
): Promise<BackendResult<readonly BankAccount[]>> {
  const result = await callBackend({
    method: 'GET',
    surface: 'SANDBOX',
    path: customerPath(customerId),
    sessionToken,
    responseSchema: bankAccountsSchema,
  });

  return result.ok ? { ok: true, value: result.value.items } : result;
}

/**
 * `POST /bank/customers/{customerId}/accounts/{id}/ledger-entries` — books a
 * movement on somebody's account. The bank then notices the platform, which
 * synchronises at once, and that person's open screens update over the
 * notification stream. Not mounted in production; answers 404 there.
 */
export async function bookLedgerEntryFor(
  sessionToken: string,
  customerId: string,
  request: LedgerEntryRequest,
): Promise<BackendResult<BookedLedgerEntry>> {
  const { accountId, ...entry } = request;
  const result = await callBackend({
    method: 'POST',
    surface: 'SANDBOX',
    path: `${customerPath(customerId)}/${encodeURIComponent(accountId)}/ledger-entries`,
    body: entry,
    sessionToken,
    responseSchema: ledgerEntrySchema,
  });

  return result.ok ? { ok: true, value: result.value.entry } : result;
}
