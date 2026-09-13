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

## Rules

- The stream is per-user and authenticated on connect. A user never receives another user's nudge.
- Payloads carry IDs and already-formatted display values — never a raw transaction description
  (PII) and never a token.
- Notifications are never sent at a frequency that becomes harassment. One nudge per detected
  transaction; aggregate rather than repeat.
- The inbox is the source of truth. The stream is an optimisation, so a missed connection must
  never mean a missed nudge.
