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

Neither the routes nor the page is gated by an environment flag — they answer wherever the app runs.
The POST endpoint has no authentication, so nothing stands between a stranger and every connected
browser. Close that with the per-user authenticated stream in the rules below before this reaches
real users.

When the real module lands, the events that today arrive from a button should arrive from
`BetTransactionDetected` and `BadgeAwarded` instead — the client side does not need to change.

## Rules

- The stream is per-user and authenticated on connect. A user never receives another user's nudge.
- Payloads carry IDs and already-formatted display values — never a raw transaction description
  (PII) and never a token.
- Notifications are never sent at a frequency that becomes harassment. One nudge per detected
  transaction; aggregate rather than repeat.
- **Two kinds interrupt and two do not, and which is which is a product decision.** An awareness
  nudge opens a modal because §4.1 is built on it interrupting. An awarded badge opens one too —
  `BadgeAwardedDialog`, with the milestone confetti — because a badge is rare (eleven exist) and the
  celebration is the competence half of the SDT mapping, which a toast that fades in four seconds
  cannot carry. A **broken streak is never a modal**: it is a quiet toast and the counter restarts.
  Celebrating in a modal while reporting a setback in passing is the no-shaming rule expressed as a
  layout decision, and inverting it would make the product punish.
- A `badge-awarded` payload carries `badgeId` and lets the client read the mark and the criterion
  from the catalogue in `app/(platform)/achievements/_badge.ts`. An id the catalogue does not know
  still renders, from the payload’s own `title` and `description` — a notification must never be
  able to blank a dialog.
- The inbox is the source of truth. The stream is an optimisation, so a missed connection must
  never mean a missed nudge.
