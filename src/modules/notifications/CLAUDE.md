# `notifications` — delivery

Subscribes to `AwarenessNudgeGenerated` and `BadgeAwarded`, delivers them to the browser, and
persists an inbox so nothing is lost while the user is offline.

## Transport

**Server-Sent Events** at `app/api/events/route.ts`. The TCC text specifies WebSocket; SSE is used
because the traffic is strictly server-to-client, it needs no second runtime, and it survives
deployment targets that will not hold a socket open. Describe it in the paper as "unidirectional
realtime push (SSE), WebSocket-compatible through the transport port".

Delivery sits behind a `NotificationChannel` port, so swapping in WebSocket later is an
infrastructure change and nothing else moves.

## Current state — demo transport

The SSE half is real and working; the domain half is not. What exists today:

- `domain/notification.ts` — `PlatformNotification`, a discriminated union of the four things the
  platform pushes. Amounts are integer cents, like everywhere else.
- `infrastructure/demo-broker.ts` — an in-process `Set` of subscribers. It does **not** survive a
  restart, does **not** cross instances, and fans out to *every* listener rather than to one user.
  The real implementation delivers per-user through `NotificationChannel` and persists an inbox.
- `app/api/notifications/stream` (GET, SSE) and `app/api/notifications` (POST, publish).
- `/admin`, a hidden console that publishes manually — see `app/(platform)/CLAUDE.md`.

Both routes and the page are gated by `isDemoConsoleEnabled()`: on outside production, off inside
unless `ENABLE_DEMO_CONSOLE=true`. The POST endpoint has no authentication, so that gate is the
only thing standing between a stranger and every connected browser. Keep it.

When the real module lands, the events that today arrive from a button should arrive from
`BetTransactionDetected` and `BadgeAwarded` instead — the client side does not need to change.

## Rules

- The stream is per-user and authenticated on connect. A user never receives another user's nudge.
- Payloads carry IDs and already-formatted display values — never a raw transaction description
  (PII) and never a token.
- Notifications are never sent at a frequency that becomes harassment. One nudge per detected
  transaction; aggregate rather than repeat.
- The inbox is the source of truth. The stream is an optimisation, so a missed connection must
  never mean a missed nudge.
