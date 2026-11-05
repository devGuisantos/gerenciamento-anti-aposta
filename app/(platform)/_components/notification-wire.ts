import type { NotificationKind, PlatformNotification } from '@modules/notifications';
import { notificationSchema } from '@modules/notifications/infrastructure/notification-schema';

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
