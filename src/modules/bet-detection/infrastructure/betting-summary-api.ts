import { z } from 'zod';

import { callBackend, type BackendResult } from '@shared/infrastructure/backend-api';

/**
 * Everything the Apostas screen shows, for one window, as backend-anti-aposta
 * computes it. The grouping by house, the tallies, the hour bands, the net
 * total, the reframing and the equivalences are all decided there; this file
 * only parses what arrives. The CNPJ never crosses the wire.
 */
export const BET_WINDOWS_IN_DAYS = [30, 90, 180, 360] as const;

export type BetWindowInDays = (typeof BET_WINDOWS_IN_DAYS)[number];

const moneySchema = z.object({
  amountInCents: z.number().int(),
  currency: z.literal('BRL'),
});

const detectionReasonSchema = z.enum(['GAMBLING_MCC', 'LICENSED_CNPJ', 'DESCRIPTION_KEYWORD']);
const detectionConfidenceSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);

export const OWN_SPENDING_CATEGORIES = [
  'GROCERIES',
  'HOUSING',
  'DINING',
  'TRANSPORT',
  'SUBSCRIPTIONS',
] as const;

export type OwnSpendingCategory = (typeof OWN_SPENDING_CATEGORIES)[number];

const bookmakerSchema = z.object({
  /** Opaque. The statement filters by it: `GET /transactions?bookmakerId=`. */
  bookmakerId: z.string(),
  name: z.string(),
  registryStatus: z.enum(['REGISTERED', 'UNREGISTERED']),
  total: moneySchema,
  transactionCount: z.number().int().nonnegative(),
  firstSeenAt: z.iso.datetime({ offset: true }),
  lastSeenAt: z.iso.datetime({ offset: true }),
  /** The lowest confidence together with the reason that actually earned it. */
  weakest: z.object({ matchedBy: detectionReasonSchema, confidence: detectionConfidenceSchema }),
  detections: z.array(
    z.object({
      matchedBy: detectionReasonSchema,
      count: z.number().int().nonnegative(),
      lowestConfidence: detectionConfidenceSchema,
    }),
  ),
});

const bettingSummarySchema = z.object({
  syncStatus: z.enum(['NO_CONSENT', 'SYNCING', 'READY']),
  window: z.object({
    days: z.number().int(),
    fromDayKey: z.string(),
    toDayKey: z.string(),
  }),
  cost: z.object({
    /** Net of refunds, floored at zero — the statement's `betSpend` for the same window. */
    total: moneySchema,
    /** Bets placed. A refund is not one. */
    transactionCount: z.number().int().nonnegative(),
    bookmakerCount: z.number().int().nonnegative(),
    firstBetAt: z.iso.datetime({ offset: true }).nullable(),
    refunds: z.object({ total: moneySchema, count: z.number().int().nonnegative() }),
  }),
  yield: z.object({
    betYieldEquivalent: moneySchema,
    annualRatePercent: z.number(),
  }),
  /** `null` when nothing came in as income in the window. Not capped at 100. */
  incomeShare: z.object({ income: moneySchema, percentage: z.number().int() }).nullable(),
  equivalences: z.object({
    ownSpending: z.array(
      z.object({
        category: z.enum(OWN_SPENDING_CATEGORIES),
        months: z.number().int().positive(),
        monthlyAverage: moneySchema,
        completeMonthsCounted: z.number().int().positive(),
      }),
    ),
    /** Priciest first; only items the total buys at least one of. */
    referenceItems: z.array(
      z.object({
        id: z.string(),
        singular: z.string(),
        plural: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: moneySchema,
        target: moneySchema,
        reviewedAt: z.string(),
      }),
    ),
  }),
  /** Largest first. */
  bookmakers: z.array(bookmakerSchema),
  /** Shares are rounded independently, so they may sum to 99 or 101. */
  detectionTallies: z.array(
    z.object({
      matchedBy: detectionReasonSchema,
      count: z.number().int().nonnegative(),
      sharePercent: z.number().int(),
    }),
  ),
  /** Always eight São Paulo bands, `startHour` 0 to 21, zeros included. */
  hourBuckets: z.array(
    z.object({ startHour: z.number().int(), count: z.number().int().nonnegative() }),
  ),
});

export type BettingSummary = z.infer<typeof bettingSummarySchema>;
export type BookmakerSummary = z.infer<typeof bookmakerSchema>;
export type DetectionTally = BettingSummary['detectionTallies'][number];
export type HourBucket = BettingSummary['hourBuckets'][number];
export type OwnSpendingEquivalence = BettingSummary['equivalences']['ownSpending'][number];
export type ReferenceItemEquivalence = BettingSummary['equivalences']['referenceItems'][number];

/** `GET /bets/summary` — no consent and no bets are both successful answers. */
export async function summariseBetting(
  sessionToken: string,
  days: BetWindowInDays,
): Promise<BackendResult<BettingSummary>> {
  return callBackend({
    method: 'GET',
    path: `/bets/summary?days=${days}`,
    sessionToken,
    responseSchema: bettingSummarySchema,
  });
}
