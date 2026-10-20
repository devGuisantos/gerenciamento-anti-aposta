import { z } from 'zod';

import { callBackend, type BackendResult } from '@shared/infrastructure/backend-api';
import { env } from '@shared/infrastructure/env';

import type { DemoNotificationDraft } from '../domain/notification';

const STREAM_PATH = '/api/v1/notifications/stream';

/** The console needs to know it landed, not to read the notification back. */
const deliveredSchema = z.object({ id: z.string() });

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
