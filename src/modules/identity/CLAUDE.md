# `identity` — who is asking

Owns platform users, credentials, and sessions. This is the app's own login, deliberately separate
from the bank authorisation in `open-finance`: two different trust domains, exactly as in the real
Open Finance ecosystem.

## Model

- Aggregate: `User`. Value objects: `Email`, `PasswordHash`.
- Passwords are hashed with Argon2id in `infrastructure/`, never in the domain and never with a
  hand-rolled algorithm.
- A session is an opaque, httpOnly, `sameSite=lax`, `secure` cookie. No JWT in `localStorage`.

## Rules

- **No other module reads the users table.** They hold a `UserId` and nothing else. If another
  context needs a name or e-mail, it receives it in an event payload or asks through `index.ts`.
- Sign-in failures return one undifferentiated error; never reveal whether the e-mail exists.
- `requireSession()` is the single entry point the delivery layer uses to answer "who is asking".
  It lives in `infrastructure/` because it reads cookies.
- Social login (Google/OIDC) is **not** planned. If it is ever added, it goes behind an
  `AuthenticationProvider` port so Auth.js stays in `infrastructure/`.

Emits `UserRegistered`, `UserSignedIn`.
