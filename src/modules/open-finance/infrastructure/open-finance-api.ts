import { z } from 'zod';

import { callBackend, type BackendResult } from '@shared/infrastructure/backend-api';

/**
 * The backend's consent lifecycle, as the screens read it. The backend is the
 * system of record: every status, every rule and every count is decided there,
 * and this file only parses what arrives.
 */
export const CONSENT_STATUSES = [
  'AWAITING_AUTHORISATION',
  'AUTHORISED',
  'REJECTED',
  'REVOKED',
  'EXPIRED',
] as const;

const consentSchema = z.object({
  id: z.string(),
  status: z.enum(CONSENT_STATUSES),
  syncStatus: z.enum(['NO_CONSENT', 'SYNCING', 'READY']),
  createdAt: z.iso.datetime({ offset: true }),
  expiresAt: z.iso.datetime({ offset: true }),
  lastSyncedAt: z.iso.datetime({ offset: true }).nullable(),
});

export type Consent = z.infer<typeof consentSchema>;
export type ConsentStatus = Consent['status'];

const currentConsentSchema = z.object({ consent: consentSchema.nullable() });

const requestedConsentSchema = z.object({
  consent: consentSchema,
  authorisationUrl: z.url(),
});

export type RequestedConsent = z.infer<typeof requestedConsentSchema>;

const synchronisationSchema = z.object({
  consent: consentSchema,
  ingestedCount: z.number().int().nonnegative(),
});

export type Synchronisation = z.infer<typeof synchronisationSchema>;

const connectedAccountSchema = z.object({
  id: z.string(),
  institution: z.string(),
  shortName: z.string(),
  product: z.string(),
  maskedNumber: z.string(),
  kind: z.enum(['CHECKING', 'CREDIT_CARD']),
});

export type ConnectedAccount = z.infer<typeof connectedAccountSchema>;

const connectedAccountsSchema = z.object({ items: z.array(connectedAccountSchema) });

/** Only what the accounts screen shows of the statement: proof that a sync arrived. */
const recentTransactionSchema = z.object({
  id: z.string(),
  occurredAt: z.iso.datetime({ offset: true }),
  counterparty: z.string(),
  amount: z.object({ amountInCents: z.number().int() }),
  accountId: z.string(),
  bet: z
    .object({
      matchedBy: z.enum(['GAMBLING_MCC', 'LICENSED_CNPJ', 'DESCRIPTION_KEYWORD']),
      confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    })
    .nullable(),
});

export type RecentTransaction = z.infer<typeof recentTransactionSchema>;

const recentTransactionsSchema = z.object({ items: z.array(recentTransactionSchema) });

/** `204` arrives with no body. */
const noContentSchema = z.null();

/** What the bank sent back to the callback: a code on a yes, an error on a no. */
export type AuthorisationCallback =
  | { readonly state: string; readonly code: string }
  | { readonly state: string; readonly error: string };

/** `GET /consents/current` — the latest consent, or `null` for "never connected". */
export async function fetchCurrentConsent(
  sessionToken: string,
): Promise<BackendResult<Consent | null>> {
  const result = await callBackend({
    method: 'GET',
    path: '/consents/current',
    sessionToken,
    responseSchema: currentConsentSchema,
  });

  return result.ok ? { ok: true, value: result.value.consent } : result;
}

/** `POST /consents` — registers the consent at the bank; answers where to send the browser. */
export async function requestConsent(
  sessionToken: string,
): Promise<BackendResult<RequestedConsent>> {
  return callBackend({
    method: 'POST',
    path: '/consents',
    sessionToken,
    responseSchema: requestedConsentSchema,
  });
}

/** `POST /consents/{id}/authorisation` — relays the callback; runs the first sync. */
export async function completeAuthorisation(
  sessionToken: string,
  consentId: string,
  callback: AuthorisationCallback,
): Promise<BackendResult<Synchronisation>> {
  return callBackend({
    method: 'POST',
    path: `/consents/${encodeURIComponent(consentId)}/authorisation`,
    body: callback,
    sessionToken,
    responseSchema: synchronisationSchema,
  });
}

/** `POST /consents/{id}/synchronisation` — pulls what is new at the bank. */
export async function synchroniseConsent(
  sessionToken: string,
  consentId: string,
): Promise<BackendResult<Synchronisation>> {
  return callBackend({
    method: 'POST',
    path: `/consents/${encodeURIComponent(consentId)}/synchronisation`,
    sessionToken,
    responseSchema: synchronisationSchema,
  });
}

/** `POST /consents/{id}/revocation` — the backend deletes every derived row. */
export async function revokeConsent(
  sessionToken: string,
  consentId: string,
): Promise<BackendResult<null>> {
  return callBackend({
    method: 'POST',
    path: `/consents/${encodeURIComponent(consentId)}/revocation`,
    sessionToken,
    responseSchema: noContentSchema,
  });
}

/** `GET /accounts` — only what the authorised consent shares. */
export async function listConnectedAccounts(
  sessionToken: string,
): Promise<BackendResult<readonly ConnectedAccount[]>> {
  const result = await callBackend({
    method: 'GET',
    path: '/accounts',
    sessionToken,
    responseSchema: connectedAccountsSchema,
  });

  return result.ok ? { ok: true, value: result.value.items } : result;
}

const RECENT_TRANSACTIONS_LIMIT = 5;

/** The newest few rows of the real statement, across the whole history. */
export async function listRecentTransactions(
  sessionToken: string,
): Promise<BackendResult<readonly RecentTransaction[]>> {
  const result = await callBackend({
    method: 'GET',
    path: `/transactions?period=ALL_TIME&limit=${RECENT_TRANSACTIONS_LIMIT}`,
    sessionToken,
    responseSchema: recentTransactionsSchema,
  });

  return result.ok ? { ok: true, value: result.value.items } : result;
}
