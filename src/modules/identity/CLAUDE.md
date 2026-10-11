# `identity` — who is asking

Platform users, credentials and sessions. This is the app's own login, deliberately separate from
the bank authorisation in `open-finance`: two different trust domains, exactly as in the real Open
Finance ecosystem.

## Where the rules live

**backend-anti-aposta owns this context.** Users, Argon2id hashing, the sign-in throttle, session
issue and sliding renewal are all decided there. This module is a client of that API and holds no
business rule of its own:

```
infrastructure/
  identity-api.ts             # registerUser, signIn, fetchCurrentUser, endSession
  session-cookie.ts           # storeSession, readSessionToken, clearSession
  session-cookie-options.ts   # cookie name + options, importable by proxy.ts
  require-session.ts          # requireSession(): "who is asking", or redirect to /login
index.ts                      # the public API
```

## Sessions

- The backend returns an opaque token (`op_…`) **in the response body** and sends no `Set-Cookie`.
  A cookie on the backend's origin would be cross-site from here, need `SameSite=None`, and die
  wherever third-party cookies are blocked.
- `storeSession` sets it as `anti_aposta_session`: `httpOnly`, `sameSite=lax`, `secure` in
  production, expiring at the backend's `expiresAt`. No token in `localStorage`, ever, and no token
  in anything returned to a Client Component.
- Authenticated backend calls send it as `Authorization: Bearer <token>` from the server.

## Rules

- **Server-only.** Everything here reads `env` or `cookies()`. A Client Component imports nothing
  from this module except types; the browser never calls the backend directly.
- Sign-in failures arrive as one undifferentiated `INVALID_CREDENTIALS` and are shown as one
  form-level message; never reveal whether the e-mail exists.
- No other module reads user data except through `index.ts`.
