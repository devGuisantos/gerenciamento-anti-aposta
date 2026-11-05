import { z } from 'zod';

import { callBackend, type BackendResult } from '@shared/infrastructure/backend-api';
import { env } from '@shared/infrastructure/env';

import type { DemoNotificationDraft, PlatformNotification } from '../domain/notification';
import { notificationSchema } from './notification-schema';

const STREAM_PATH = '/api/v1/notifications/stream';

/** The console needs to know it landed, not to read the notification back. */
const deliveredSchema = z.object({ id: z.string() });

const notificationListSchema = z.object({ items: z.array(notificationSchema) });

/** `204` arrives with no body. */
const noContentSchema = z.null();

/**
 * `GET /api/v1/notifications/stream` — the caller's own stream, opened with the
 * session as a bearer token so the token never reaches the browser. The body is
 * handed back untouched: `id:`, `event:`, `retry:` and the heartbeat are the
 * backend's to write, and re-encoding them here would only be a chance to get
 * one wrong.
 *
 * `null` when the backend cannot be reached at all; any other answer, including
 * a `401`, is returned for the route to pass on.
 */
export async function openNotificationStream(input: {
  readonly sessionToken: string;
  readonly lastEventId: string | null;
  /** Aborted when the browser goes away, which closes the upstream stream too. */
  readonly signal: AbortSignal;
}): Promise<Response | null> {
  return fetch(`${env.BACKEND_API_URL}${STREAM_PATH}`, {
    headers: {
      Authorization: `Bearer ${input.sessionToken}`,
      Accept: 'text/event-stream',
      ...(input.lastEventId === null ? {} : { 'Last-Event-ID': input.lastEventId }),
    },
    cache: 'no-store',
    signal: input.signal,
  }).catch(() => null);
}

/** `GET /api/v1/notifications` — what the caller keeps, newest first. It fits in one answer. */
export async function listNotifications(
  sessionToken: string,
): Promise<BackendResult<readonly PlatformNotification[]>> {
  const result = await callBackend({
    method: 'GET',
    path: '/notifications',
    sessionToken,
    responseSchema: notificationListSchema,
  });

  return result.ok ? { ok: true, value: result.value.items } : result;
}

/** `POST /api/v1/notifications/read-receipts` — the caller has seen these. */
export async function markNotificationsRead(
  sessionToken: string,
  notificationIds: readonly string[],
): Promise<BackendResult<null>> {
  return callBackend({
    method: 'POST',
    path: '/notifications/read-receipts',
    body: { notificationIds },
    sessionToken,
    responseSchema: noContentSchema,
  });
}

/**
 * `POST /api/v1/users/{userId}/notifications` — the demonstration console,
 * sending to one person by id. The backend mounts it only where demo writes
 * are on, and otherwise answers 404.
 */
export async function sendDemoNotification(
  sessionToken: string,
  recipientId: string,
  draft: DemoNotificationDraft,
): Promise<BackendResult<{ readonly id: string }>> {
  return callBackend({
    method: 'POST',
    path: `/users/${encodeURIComponent(recipientId)}/notifications`,
    body: draft,
    sessionToken,
    responseSchema: deliveredSchema,
  });
}
