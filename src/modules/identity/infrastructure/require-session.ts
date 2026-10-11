import { cache } from 'react';
import { redirect } from 'next/navigation';

import { fetchCurrentUser, type CurrentUser } from './identity-api';
import { readSessionToken } from './session-cookie';

const SIGN_IN_PATH = '/login';

/** The backend's answers for a token that is unknown, revoked or expired. */
const REJECTED_SESSION_CODES: ReadonlySet<string> = new Set(['SESSION_INVALID', 'SESSION_EXPIRED']);

/**
 * Who is asking, or `null` when nobody is signed in — no cookie, or a session
 * the backend rejects. A backend that is down is a different thing and throws,
 * so it reaches an error boundary instead of masquerading as "signed out".
 *
 * `cache` makes it one backend call per request however many components ask,
 * so a page and its layout share the answer.
 */
export const findCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = await readSessionToken();

  if (token === null) {
    return null;
  }

  const result = await fetchCurrentUser(token);

  if (result.ok) {
    return result.value;
  }

  if (REJECTED_SESSION_CODES.has(result.failure.code)) {
    return null;
  }

  throw new Error(`Session could not be resolved: ${result.failure.code}`);
});

/**
 * The gate for every page and Server Action behind the sidebar: the signed-in
 * user, or a redirect to the sign-in screen. A `401` is never shown as an error,
 * because the person did nothing wrong. Route Handlers use `findCurrentUser` and
 * answer `401` instead, since a redirect means nothing to `fetch` or `EventSource`.
 */
export async function requireSession(): Promise<CurrentUser> {
  const user = await findCurrentUser();

  if (user === null) {
    redirect(SIGN_IN_PATH);
  }

  return user;
}
