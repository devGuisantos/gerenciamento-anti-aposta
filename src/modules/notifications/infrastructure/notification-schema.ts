import { z } from 'zod';

const delivered = {
  id: z.string(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
};
const cents = z.number().int();

const movementSchema = z.object({
  transactionId: z.string(),
  occurredAt: z.string(),
  counterparty: z.string(),
  amountInCents: cents,
  bet: z
    .object({
      matchedBy: z.enum(['GAMBLING_MCC', 'LICENSED_CNPJ', 'DESCRIPTION_KEYWORD']),
      confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    })
    .nullable(),
});

/**
 * One notification on the wire, the same on the stream and in the list. Parsed,
 * never cast: what does not parse is dropped rather than rendered half-empty.
 *
 * The one file of this module the browser may load, because the listener parses
 * each stream frame there. It imports nothing but Zod, and must stay that way:
 * the rest of the module is server-only.
 */
export const notificationSchema = z.discriminatedUnion('kind', [
  z.object({
    ...delivered,
    kind: z.literal('AWARENESS_NUDGE'),
    merchant: z.string(),
    amountInCents: cents,
    yieldInCents: cents,
    annualRatePercent: z.number(),
    monthlyTotalInCents: cents,
    matchedBy: z.string(),
  }),
  z.object({
    ...delivered,
    kind: z.literal('BADGE_AWARDED'),
    badgeId: z.string(),
    title: z.string(),
    description: z.string(),
  }),
  z.object({ ...delivered, kind: z.literal('STREAK_BROKEN'), previousDays: z.number().int() }),
  z.object({ ...delivered, kind: z.literal('GOAL_REACHED'), label: z.string(), amountInCents: cents }),
  z.object({
    ...delivered,
    kind: z.literal('TRANSACTIONS_INGESTED'),
    ingestedCount: z.number().int(),
    movements: z.array(movementSchema),
  }),
]);
