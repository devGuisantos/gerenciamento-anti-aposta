import { z } from 'zod';

import { callBackend, type BackendResult } from '@shared/infrastructure/backend-api';

/**
 * The statement and the charts, as backend-anti-aposta serves them. Every
 * figure — the totals, the net betting spend, the yield equivalents, the
 * monthly buckets — is computed there; this file only parses what arrives.
 */
export const TRANSACTION_CATEGORIES = [
  'BETS',
  'GROCERIES',
  'DINING',
  'TRANSPORT',
  'HOUSING',
  'HEALTH',
  'SUBSCRIPTIONS',
  'SHOPPING',
  'INCOME',
  'TRANSFER',
  'OTHER',
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const PAYMENT_METHODS = [
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'DIRECT_DEBIT',
  'TRANSFER',
  'BOLETO',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const LEDGER_TYPES = ['ALL', 'BETS', 'CREDITS', 'DEBITS'] as const;
export type LedgerType = (typeof LEDGER_TYPES)[number];

export const LEDGER_PERIODS = ['LAST_30_DAYS', 'LAST_90_DAYS', 'ALL_TIME'] as const;
export type LedgerPeriod = (typeof LEDGER_PERIODS)[number];

const moneySchema = z.object({
  amountInCents: z.number().int(),
  currency: z.literal('BRL'),
});

const syncStatusSchema = z.enum(['NO_CONSENT', 'SYNCING', 'READY']);

export type SyncStatus = z.infer<typeof syncStatusSchema>;

const betSchema = z.object({
  matchedBy: z.enum(['GAMBLING_MCC', 'LICENSED_CNPJ', 'DESCRIPTION_KEYWORD']),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  source: z.enum(['POLICY', 'USER_OVERRIDE']),
});

export type TransactionBet = z.infer<typeof betSchema>;

const overrideSchema = z.object({
  verdict: z.literal('NOT_A_BET'),
  overriddenAt: z.iso.datetime({ offset: true }),
  isReversible: z.boolean(),
});

export type ClassificationOverride = z.infer<typeof overrideSchema>;

const ledgerTransactionSchema = z.object({
  id: z.string(),
  occurredAt: z.iso.datetime({ offset: true }),
  /** São Paulo calendar keys, decided by the backend. Never re-derived here. */
  dayKey: z.string(),
  monthKey: z.string(),
  counterparty: z.string(),
  category: z.enum(TRANSACTION_CATEGORIES),
  method: z.enum(PAYMENT_METHODS),
  status: z.enum(['SETTLED', 'PENDING']),
  amount: moneySchema,
  accountId: z.string(),
  bet: betSchema.nullable(),
  yieldEquivalent: moneySchema.nullable(),
  override: overrideSchema.nullable(),
});

export type LedgerTransaction = z.infer<typeof ledgerTransactionSchema>;

const ledgerSchema = z.object({
  syncStatus: syncStatusSchema,
  lastSyncedAt: z.iso.datetime({ offset: true }).nullable(),
  /** For the whole matching set, never for the page beside it. */
  totals: z.object({
    credits: moneySchema,
    debits: moneySchema,
    betSpend: moneySchema,
    betCount: z.number().int().nonnegative(),
    betYieldEquivalent: moneySchema,
    annualRatePercent: z.number(),
  }),
  items: z.array(ledgerTransactionSchema),
  nextCursor: z.string().nullable(),
});

export type Ledger = z.infer<typeof ledgerSchema>;
export type LedgerTotals = Ledger['totals'];

export type LedgerQuery = {
  readonly type: LedgerType;
  readonly period: LedgerPeriod;
  readonly accountId: string | null;
  readonly search: string;
  /** Opaque, as the backend issued it. */
  readonly cursor: string | null;
};

const PAGE_SIZE = 50;

function toLedgerSearchParams(query: LedgerQuery): string {
  const params = new URLSearchParams({
    type: query.type,
    period: query.period,
    limit: `${PAGE_SIZE}`,
  });

  if (query.accountId !== null) params.set('accountId', query.accountId);
  if (query.search.trim() !== '') params.set('q', query.search.trim());
  if (query.cursor !== null) params.set('cursor', query.cursor);

  return params.toString();
}

/** `GET /transactions` — one page of the filtered statement, plus totals for all of it. */
export async function listTransactions(
  sessionToken: string,
  query: LedgerQuery,
): Promise<BackendResult<Ledger>> {
  return callBackend({
    method: 'GET',
    path: `/transactions?${toLedgerSearchParams(query)}`,
    sessionToken,
    responseSchema: ledgerSchema,
  });
}

const monthlySummarySchema = z.object({
  syncStatus: syncStatusSchema,
  currency: z.literal('BRL'),
  /** Newest first. Months with no data are omitted by the backend, never zero-filled. */
  items: z.array(
    z.object({
      monthKey: z.string().regex(/^\d{4}-\d{2}$/),
      monthsAgo: z.number().int().nonnegative(),
      isPartial: z.boolean(),
      totals: z.record(z.enum(TRANSACTION_CATEGORIES), z.number().int().nonnegative()),
    }),
  ),
});

export type MonthlySummary = z.infer<typeof monthlySummarySchema>;
export type MonthlyTotals = MonthlySummary['items'][number];

const SUMMARY_MONTHS = 12;

/** `GET /transactions/monthly-summary` — per-month category magnitudes, newest first. */
export async function summariseSpendByMonth(
  sessionToken: string,
): Promise<BackendResult<MonthlySummary>> {
  return callBackend({
    method: 'GET',
    path: `/transactions/monthly-summary?months=${SUMMARY_MONTHS}`,
    sessionToken,
    responseSchema: monthlySummarySchema,
  });
}
