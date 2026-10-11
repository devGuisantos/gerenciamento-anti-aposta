import { findCurrentUser } from '@modules/identity';
import {
  isNotificationKind,
  publishNotification,
  type PlatformNotification,
} from '@modules/notifications';

export const dynamic = 'force-dynamic';

/**
 * Publishes one notification to the **caller's own** open streams — the demo
 * console's "send it to myself". Stand-in for the domain events that will
 * trigger this once the modules exist — see `src/modules/notifications/CLAUDE.md`.
 *
 * Signed-in only, and JSON only: a cross-site page can send `text/plain`
 * without a preflight, but not `application/json`, so requiring it keeps this
 * endpoint out of reach of a forged form even before `SameSite` is considered.
 */
export async function POST(request: Request): Promise<Response> {
  const user = await findCurrentUser();

  if (user === null) {
    return Response.json({ error: 'Entre na sua conta para continuar.' }, { status: 401 });
  }

  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return Response.json({ error: 'Envie o corpo como JSON.' }, { status: 415 });
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

  const delivered = publishNotification(user.id, notification);

  return Response.json({ delivered });
}
