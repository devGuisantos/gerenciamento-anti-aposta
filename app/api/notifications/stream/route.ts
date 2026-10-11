import { findCurrentUser } from '@modules/identity';
import { subscribeToNotifications } from '@modules/notifications';

/** An open SSE connection must never be cached or statically rendered. */
export const dynamic = 'force-dynamic';

const KEEP_ALIVE_MS = 25_000;

/**
 * The signed-in user's own notifications, and nobody else's. Checked once when
 * the stream opens; a session revoked afterwards keeps this connection until the
 * tab closes or reconnects, which is the accepted cost of a long-lived stream.
 */
export async function GET(): Promise<Response> {
  const user = await findCurrentUser();

  if (user === null) {
    return new Response(null, { status: 401 });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = subscribeToNotifications(user.id, (notification) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(notification)}\n\n`),
        );
      });

      // Proxies drop an idle connection; a comment frame keeps it warm.
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, KEEP_ALIVE_MS);

      cleanup = () => {
        clearInterval(keepAlive);
        unsubscribe();
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
