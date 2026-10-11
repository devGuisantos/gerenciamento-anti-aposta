import { NextResponse, type NextRequest } from 'next/server';

import {
  SESSION_COOKIE_MAX_AGE_IN_SECONDS,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '@modules/identity';

const SIGN_IN_PATH = '/login';

/**
 * The optimistic half of the gate: no session cookie, no app screen. It reads
 * the cookie and nothing else — Proxy runs on every navigation and prefetch, so
 * asking the backend here would cost a round trip per link hovered.
 * `requireSession` is the real check; this only spares a render.
 *
 * On a page load (GET) a present cookie is re-issued with a fresh max-age,
 * mirroring the backend's sliding session (see `SESSION_COOKIE_MAX_AGE_IN_SECONDS`).
 * Never on a POST: a Server Action — "Sair" above all — may be writing the same
 * cookie in the same response, and the two `Set-Cookie` headers would then race.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token === undefined) {
    return NextResponse.redirect(new URL(SIGN_IN_PATH, request.url));
  }

  const response = NextResponse.next();

  if (request.method !== 'GET') {
    return response;
  }

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    ...sessionCookieOptions(),
    maxAge: SESSION_COOKIE_MAX_AGE_IN_SECONDS,
  });

  return response;
}

/** Every route in `app/(platform)/`. A new screen there is added here too. */
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/transactions/:path*',
    '/bets/:path*',
    '/goals/:path*',
    '/achievements/:path*',
    '/accounts/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
};
