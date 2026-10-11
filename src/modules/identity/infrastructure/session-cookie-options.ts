/**
 * Kept apart from `session-cookie.ts` because `proxy.ts` needs these and nothing
 * else: no `next/headers`, no `env`, no backend client.
 */
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * `__Host-` makes the browser refuse the cookie unless it is `Secure`, has
 * `Path=/` and no `Domain` — so a sibling subdomain cannot plant a session of
 * its choosing here. It needs `Secure`, which plain-HTTP development cannot set,
 * hence the unprefixed name outside production.
 */
export const SESSION_COOKIE_NAME = IS_PRODUCTION
  ? '__Host-anti_aposta_session'
  : 'anti_aposta_session';

/**
 * Mirrors the backend's `SESSION_TTL_IN_DAYS`. The backend slides a session it
 * resolves, so `proxy.ts` slides the cookie by the same amount on every page
 * load — otherwise somebody using the app daily would be signed out on day 14
 * while their session was still valid. The backend stays the authority: a
 * cookie that outlives its session is rejected by `requireSession`.
 */
export const SESSION_COOKIE_MAX_AGE_IN_SECONDS = 14 * 24 * 60 * 60;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
  } as const;
}
