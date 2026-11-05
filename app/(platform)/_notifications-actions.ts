'use server';

import { z } from 'zod';

import { readSessionToken, requireSession } from '@modules/identity';
import {
  listNotifications,
  markNotificationsRead,
  type PlatformNotification,
} from '@modules/notifications';

export type NotificationListState =
  | { readonly ok: true; readonly notifications: readonly PlatformNotification[] }
  | { readonly ok: false };

/** As many as a person keeps. The backend re-checks it and scopes every id by the caller. */
const READ_RECEIPT_MAXIMUM = 50;

const readReceiptSchema = z.array(z.uuid()).min(1).max(READ_RECEIPT_MAXIMUM);

async function callerToken(): Promise<string | null> {
  await requireSession();

  return readSessionToken();
}

/** What the signed-in person keeps, newest first. */
export async function loadNotificationsAction(): Promise<NotificationListState> {
  const token = await callerToken();
  if (token === null) return { ok: false };

  const result = await listNotifications(token);

  return result.ok ? { ok: true, notifications: result.value } : { ok: false };
}

/** Whether the backend recorded it: a receipt that failed leaves them unread, to retry. */
export async function markNotificationsReadAction(notificationIds: unknown): Promise<boolean> {
  const token = await callerToken();
  const parsed = readReceiptSchema.safeParse(notificationIds);

  if (token === null || !parsed.success) return false;

  const result = await markNotificationsRead(token, parsed.data);

  return result.ok;
}
