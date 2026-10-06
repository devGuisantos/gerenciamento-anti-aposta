import type { PlatformNotification } from '../domain/notification';

type Subscriber = (notification: PlatformNotification) => void;

/**
 * In-process fan-out standing in for the real event bus until the modules exist.
 *
 * Deliberate limitations, because they matter if this is ever deployed:
 * state lives in one Node process, so it does not survive a restart and does not
 * cross instances, and it broadcasts to every listener rather than to one user.
 * The real implementation delivers per-user through the `NotificationChannel`
 * port and persists an inbox.
 */
const subscribers = new Set<Subscriber>();

export function subscribeToNotifications(subscriber: Subscriber): () => void {
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
}

export function publishNotification(notification: PlatformNotification): number {
  for (const subscriber of subscribers) {
    subscriber(notification);
  }
  return subscribers.size;
}
