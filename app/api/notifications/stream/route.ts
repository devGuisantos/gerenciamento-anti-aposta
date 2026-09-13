import {
  isDemoConsoleEnabled,
  subscribeToNotifications,
} from '@modules/notifications';

/** An open SSE connection must never be cached or statically rendered. */
export const dynamic = 'force-dynamic';

const KEEP_ALIVE_MS = 25_000;

export async function GET(): Promise<Response> {
  if (!isDemoConsoleEnabled()) {
    return new Response('Not found', { status: 404 });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = subscribeToNotifications((notification) => {
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
