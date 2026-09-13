import {
  isDemoConsoleEnabled,
  isNotificationKind,
  publishNotification,
  type PlatformNotification,
} from '@modules/notifications';

export const dynamic = 'force-dynamic';

/**
 * Publishes one notification to every open stream. Stand-in for the domain
 * events that will trigger this once the modules exist — see
 * `src/modules/notifications/CLAUDE.md`.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isDemoConsoleEnabled()) {
    return new Response('Not found', { status: 404 });
  }

  const payload: unknown = await request.json().catch(() => null);

  if (
    payload === null ||
    typeof payload !== 'object' ||
    !isNotificationKind((payload as { kind?: unknown }).kind)
  ) {
    return Response.json(
      { error: 'Payload inválido: informe um "kind" conhecido.' },
      { status: 400 },
    );
  }

  const notification = {
    ...(payload as PlatformNotification),
    id: crypto.randomUUID(),
  } as PlatformNotification;

  const delivered = publishNotification(notification);

  return Response.json({ delivered });
}
