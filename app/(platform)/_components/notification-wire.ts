import { z } from 'zod';

import type { NotificationKind, PlatformNotification } from '@modules/notifications';

/**
 * The stream's named events, one per kind. `EventSource.onmessage` only hears
 * unnamed events, so the listener subscribes to each of these by name.
 */
export const NOTIFICATION_EVENTS = [
  'AWARENESS_NUDGE',
  'BADGE_AWARDED',
  'STREAK_BROKEN',
  'GOAL_REACHED',
  'TRANSACTIONS_INGESTED',
] as const satisfies readonly NotificationKind[];

const delivered = { id: z.string(), createdAt: z.string() };
const cents = z.number().int();

/**
 * The frame's `data` is a boundary like any response body: parsed, never cast.
 * A frame that does not parse is dropped rather than rendered half-empty.
 */
const notificationSchema = z.discriminatedUnion('kind', [
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
  }),
]);

export function parseNotification(raw: string): PlatformNotification | null {
  try {
    const parsed = notificationSchema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : null;
  } catch {
    // Not JSON at all: the same answer as JSON of the wrong shape.
    return null;
  }
}

/** Shared with "Sincronizar", so a sync that the stream also announces shows one toast. */
export const TRANSACTIONS_INGESTED_TOAST_ID = 'transactions-ingested';
