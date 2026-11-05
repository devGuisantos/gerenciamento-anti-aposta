'use client';

import * as React from 'react';

import type { PlatformNotification } from '@modules/notifications';

import { loadNotificationsAction } from '../_notifications-actions';

/** The backend keeps this many; live arrivals must not grow the list past it. */
const INBOX_CAPACITY = 50;

export type FeedStatus = 'LOADING' | 'READY' | 'UNAVAILABLE';

type NotificationFeed = {
  readonly notifications: readonly PlatformNotification[];
  readonly status: FeedStatus;
  /** One notification from the stream. */
  readonly record: (notification: PlatformNotification) => void;
  /** Reads the backend's list and folds it into what is on screen. */
  readonly synchronise: () => Promise<void>;
  /** The backend recorded these as read. */
  readonly settleRead: (notificationIds: readonly string[]) => void;
};

const NotificationFeedContext = React.createContext<NotificationFeed | null>(null);

/**
 * By id, so a notification both the list and the stream carry appears once, and
 * a reading known to either side survives. Ids are UUID v7, so sorting them
 * descending is newest first.
 */
function merge(
  current: readonly PlatformNotification[],
  incoming: readonly PlatformNotification[],
): readonly PlatformNotification[] {
  const byId = new Map(current.map((notification) => [notification.id, notification]));

  for (const notification of incoming) {
    const known = byId.get(notification.id);

    byId.set(notification.id, {
      ...notification,
      readAt: notification.readAt ?? known?.readAt ?? null,
    });
  }

  return [...byId.values()]
    .sort((left, right) => right.id.localeCompare(left.id))
    .slice(0, INBOX_CAPACITY);
}

/**
 * The list the bell shows, shared with `NotificationListener`, which owns the
 * stream and feeds it. The two sit in different parts of the layout, and a
 * notification has to reach both the moment it arrives.
 */
export function NotificationFeedProvider({ children }: { readonly children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<readonly PlatformNotification[]>([]);
  const [status, setStatus] = React.useState<FeedStatus>('LOADING');

  const record = React.useCallback((notification: PlatformNotification) => {
    /* A replayed frame must not overwrite what the list already knows: frames carry
       no movements, so the merge would blank them. */
    setNotifications((current) =>
      current.some(({ id }) => id === notification.id) ? current : merge(current, [notification]),
    );
  }, []);

  const synchronise = React.useCallback(async () => {
    const result = await loadNotificationsAction().catch(() => ({ ok: false }) as const);

    if (!result.ok) {
      setStatus('UNAVAILABLE');

      return;
    }

    setNotifications((current) => merge(current, result.notifications));
    setStatus('READY');
  }, []);

  const settleRead = React.useCallback((notificationIds: readonly string[]) => {
    const readAt = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) =>
        notificationIds.includes(notification.id) && notification.readAt === null
          ? { ...notification, readAt }
          : notification,
      ),
    );
  }, []);

  const feed = React.useMemo(
    () => ({ notifications, status, record, synchronise, settleRead }),
    [notifications, status, record, synchronise, settleRead],
  );

  return <NotificationFeedContext value={feed}>{children}</NotificationFeedContext>;
}

export function useNotificationFeed(): NotificationFeed {
  const feed = React.useContext(NotificationFeedContext);

  if (feed === null) {
    throw new Error('useNotificationFeed needs a NotificationFeedProvider above it');
  }

  return feed;
}
