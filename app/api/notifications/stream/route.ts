import { readSessionToken } from '@modules/identity';
import { openNotificationStream } from '@modules/notifications';

/** An open SSE connection must never be cached or statically rendered. */
export const dynamic = 'force-dynamic';

const UNAVAILABLE = 503;

/**
 * The signed-in person's own notifications, piped from backend-anti-aposta. The
 * browser's `EventSource` cannot carry the session as a bearer token and must
 * never see it, so this route holds the cookie and opens the backend stream on
 * the browser's behalf — nothing more. The backend decides whose stream it is.
 *
 * `Last-Event-ID` is forwarded, which is what makes a reconnection resume where
 * it dropped instead of losing what arrived in between. Closing the tab aborts
 * `request.signal`, which closes the upstream stream with it.
 *
 * A session the backend refuses comes back as its `401`: `EventSource` treats
 * any non-200 as final and stops retrying, which is right for a signed-out tab.
 */
export async function GET(request: Request): Promise<Response> {
  const sessionToken = await readSessionToken();

  if (sessionToken === null) {
    return new Response(null, { status: 401 });
  }

  const upstream = await openNotificationStream({
    sessionToken,
    lastEventId: request.headers.get('last-event-id'),
    signal: request.signal,
  });

  if (upstream === null || upstream.body === null) {
    return new Response(null, { status: UNAVAILABLE });
  }

  if (!upstream.ok) {
    return new Response(null, { status: upstream.status });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
