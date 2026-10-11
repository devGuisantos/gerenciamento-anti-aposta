import type { PlatformNotification } from '../domain/notification';

type Subscriber = (notification: PlatformNotification) => void;

/**
 * In-process fan-out standing in for the real event bus until the modules exist.
 *
 * **Per user, never a broadcast.** A notification renders as an awareness-nudge
 * modal, so a channel that reached everybody would let anyone put words of their
 * choosing in front of every user — a phishing page with the product's own
 * chrome. Keyed by the signed-in user's id, a caller can only ever reach their
 * own open tabs.
 *
 * Deliberate limitations, because they matter if this is ever deployed: state
 * lives in one Node process, so it does not survive a restart and does not cross
 * instances. The real implementation delivers through the `NotificationChannel`
 * port and persists an inbox.
 */
const subscribersByUser = new Map<string, Set<Subscriber>>();

export function subscribeToNotifications(userId: string, subscriber: Subscriber): () => void {
  const subscribers = subscribersByUser.get(userId) ?? new Set<Subscriber>();

  subscribers.add(subscriber);
  subscribersByUser.set(userId, subscribers);

  return () => {
    subscribers.delete(subscriber);

    if (subscribers.size === 0) {
      subscribersByUser.delete(userId);
    }
  };
}

/** Returns how many of that user's open connections received it. */
export function publishNotification(userId: string, notification: PlatformNotification): number {
  const subscribers = subscribersByUser.get(userId) ?? new Set<Subscriber>();

  for (const subscriber of subscribers) {
    subscriber(notification);
  }

  return subscribers.size;
}
