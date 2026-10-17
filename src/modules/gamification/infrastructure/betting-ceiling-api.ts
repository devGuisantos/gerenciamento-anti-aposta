import { z } from 'zod';

import { callBackend, type BackendResult } from '@shared/infrastructure/backend-api';

/**
 * The monthly ceiling on betting spend, as backend-anti-aposta measures it.
 * Every month's outcome, the open month's reframing and every stop of the
 * simulator are computed there, against the same monthly figures the charts
 * read; this file only parses what arrives.
 */
const moneySchema = z.object({
  amountInCents: z.number().int(),
  currency: z.literal('BRL'),
});

const termSchema = z.object({
  amount: moneySchema,
  destination: z.string().nullable(),
  /** São Paulo `YYYY-MM`. */
  effectiveFromMonthKey: z.string(),
  setAt: z.iso.datetime({ offset: true }),
});

export const CYCLE_STATUSES = ['ACTIVE', 'REACHED', 'MISSED'] as const;

export type CycleStatus = (typeof CYCLE_STATUSES)[number];

const cycleSchema = z.object({
  monthKey: z.string(),
  ceiling: moneySchema,
  destination: z.string().nullable(),
  spent: moneySchema,
  status: z.enum(CYCLE_STATUSES),
  /** Signed: positive under the ceiling. */
  margin: moneySchema,
  /** Uncapped. */
  usedPercent: z.number().int(),
});

const overviewSchema = z.object({
  syncStatus: z.enum(['NO_CONSENT', 'SYNCING', 'READY']),
  month: z.object({
    monthKey: z.string(),
    nextMonthKey: z.string(),
    daysRemaining: z.number().int().nonnegative(),
  }),
  /** In force this month; `null` before the first. */
  ceiling: termSchema.nullable(),
  /** Takes over next month; `null` when nothing is waiting. */
  scheduled: termSchema.nullable(),
  current: cycleSchema.extend({ marginYieldEquivalent: moneySchema }).nullable(),
  /** Closed months only, newest first. */
  cycles: z.array(cycleSchema),
  simulation: z.object({
    monthsCounted: z.number().int().nonnegative(),
    stepInCents: z.number().int().positive(),
    cap: moneySchema,
    steps: z.array(
      z.object({
        ceiling: moneySchema,
        monthsWithin: z.number().int().nonnegative(),
        averageExcess: moneySchema,
        totalExcess: moneySchema,
        averageExcessYieldEquivalent: moneySchema,
      }),
    ),
  }),
  annualRatePercent: z.number(),
});

const choiceSchema = z.object({
  ceiling: termSchema.nullable(),
  scheduled: termSchema.nullable(),
  /** When the value just sent governs: this month for a first ceiling, next month for a change. */
  effectiveFromMonthKey: z.string(),
});

export type BettingCeilingOverview = z.infer<typeof overviewSchema>;
export type CeilingCycle = z.infer<typeof cycleSchema>;
export type CurrentCeilingCycle = NonNullable<BettingCeilingOverview['current']>;
export type CeilingTerm = z.infer<typeof termSchema>;
export type SimulationStep = BettingCeilingOverview['simulation']['steps'][number];
export type CeilingChoice = z.infer<typeof choiceSchema>;

/** `GET /betting-ceiling` — no consent is a successful answer with nothing measured. */
export async function describeBettingCeiling(
  sessionToken: string,
): Promise<BackendResult<BettingCeilingOverview>> {
  return callBackend({
    method: 'GET',
    path: '/betting-ceiling',
    sessionToken,
    responseSchema: overviewSchema,
  });
}

/** `PUT /betting-ceiling` — the month under way keeps its ceiling; a change waits for the next. */
export async function setBettingCeiling(
  sessionToken: string,
  ceilingInCents: number,
): Promise<BackendResult<CeilingChoice>> {
  return callBackend({
    method: 'PUT',
    path: '/betting-ceiling',
    body: { amount: { amountInCents: ceilingInCents, currency: 'BRL' } },
    sessionToken,
    responseSchema: choiceSchema,
  });
}
