import { cookies } from 'next/headers';

import type { IssuedSession } from './identity-api';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from './session-cookie-options';

/**
 * Stores the backend's opaque token as a first-party cookie on this origin.
 *
 * The backend sends no `Set-Cookie` by design: a cookie on its own origin would
 * be cross-site from here, need `SameSite=None`, and die wherever third-party
 * cookies are blocked. `httpOnly` keeps the token out of reach of any script.
 */
export async function storeSession(session: IssuedSession): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, session.token, {
    ...sessionCookieOptions(),
    expires: new Date(session.expiresAt),
  });
}

export async function readSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/** Only callable from a Server Action or Route Handler, like any cookie write. */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();

  // With the same attributes it was set with: a `__Host-` cookie is only
  // overwritten — and so only deleted — by a write that is itself `Secure`.
  cookieStore.set(SESSION_COOKIE_NAME, '', { ...sessionCookieOptions(), maxAge: 0 });
}
