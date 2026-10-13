# `notifications` — delivery, as the browser receives it

**The module itself lives in backend-anti-aposta** (`src/modules/notifications`): the inbox, the
`Notification` aggregate, the per-user fan-out and the SSE endpoint
`GET /api/v1/notifications/stream`. Read that module's CLAUDE.md for the model and the rules. This
module is the frontend's client of it — nothing is decided here.

## Transport

**Server-Sent Events.** The TCC text specifies WebSocket; SSE is used because the traffic is
strictly server-to-client, it needs no second runtime, and it survives deployment targets that will
not hold a socket open. Describe it in the paper as "unidirectional realtime push (SSE),
WebSocket-compatible through the transport port" — the backend's `NotificationChannel`.

```
browser EventSource ──> app/api/notifications/stream (Next route, holds the session cookie)
                          └─ openNotificationStream(): GET backend /api/v1/notifications/stream
                             with the session as a bearer token; body piped through untouched
```

- **The browser never sees the token.** `EventSource` cannot set headers, so the Next route opens the
  backend stream on its behalf and pipes the body. It does not parse, re-encode or filter frames:
  `id:`, `event:`, `retry:` and the heartbeat are the backend's.
- **`Last-Event-ID` is forwarded.** `EventSource` sends it on its own when it reconnects, and the
  backend replays what came after it. A fresh page load has none and replays nothing — opening the
  app must not re-open nudges somebody already dismissed.
- **Closing the tab closes the upstream stream**: the route passes `request.signal` to the fetch.
- A refused session comes back as the backend's `401`, which `EventSource` treats as final.

## What this module holds

```
domain/notification.ts               # PlatformNotification: the wire shape, kinds mirroring the
                                     # backend enum (AWARENESS_NUDGE, BADGE_AWARDED, STREAK_BROKEN,
                                     # GOAL_REACHED, TRANSACTIONS_INGESTED); DemoNotificationDraft
infrastructure/notifications-api.ts  # openNotificationStream, sendDemoNotification
index.ts
```

Server-only, like every module: a Client Component imports **types only**. The browser's parse of
each frame lives next to the listener, in `app/(platform)/_components/notification-wire.ts` — the
frame is a boundary, so it is parsed with Zod and a frame that does not parse is dropped.

## Rendering — `NotificationListener`, mounted once in the platform layout

Each kind is a named event, so the listener subscribes to each by name (`onmessage` only hears
unnamed events).

| Kind | Renders as | Why |
| --- | --- | --- |
| `AWARENESS_NUDGE` | modal | §4.1 of the TCC is built on it interrupting |
| `BADGE_AWARDED` | modal, `BadgeAwardedDialog` with confetti | a badge is rare; the celebration is the competence half of the SDT mapping |
| `STREAK_BROKEN` | quiet toast | celebrating in a modal while reporting a setback in passing is the no-shaming rule as layout |
| `GOAL_REACHED` | toast | good news that does not need to interrupt |
| `TRANSACTIONS_INGESTED` | one toast + `router.refresh()` | the statement changed; Server Components re-read it in place |

- **Never invert the modal/toast split.** A modal announcing a lost streak would make the product
  punish.
- **One toast per sync.** "Sincronizar" answers with the same toast id
  (`TRANSACTIONS_INGESTED_TOAST_ID`), so a sync the stream also announces shows a single toast.
- **A nudge's yield comes from the backend**, reframed by its `awareness` context. The modal shows
  the gain over `|amountInCents|`: a bet arrives as a debit.
- A `BADGE_AWARDED` payload carries `badgeId` and the dialog reads the mark and criterion from the
  catalogue in `app/(platform)/achievements/_badge.ts`. An unknown id still renders from the
  payload's `title` and `description` — a notification must never blank a dialog.

## Rules

- The stream is per-user and authenticated on connect; the backend decides whose it is. A user never
  receives another user's notification.
- Payloads carry ids, cents and already-worded display text — never a raw transaction description,
  never a token.
- Nothing here sends to "everybody". The demo console sends to one person by id, through the backend
  (`sendDemoNotification`), and the backend mounts that route only where demo writes are on.
