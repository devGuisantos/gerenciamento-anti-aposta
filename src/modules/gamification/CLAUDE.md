# `gamification` — sustaining the change

Mechanics grounded in Self-Determination Theory (Deci & Ryan). The point is intrinsic motivation,
not points for their own sake.

## Model

Aggregates: `Streak`, `Goal`, `BadgeCollection`.

The SDT mapping is explicit, and code comments should say _why_ a mechanic exists:

- **Autonomy** — the user defines their own `Goal`: how much to stop spending, and where it goes.
- **Competence** — visible progress and `Badge` milestones for real reductions.
- **Relatedness** — shareable achievements (later, and always opt-in).

## Rules

- **No mechanic may imitate a gambling loop.** No random rewards, no variable-ratio schedules, no
  near-miss animations, no loot-box framing, no "spin to reveal". This is non-negotiable: the
  product exists to oppose exactly that psychology.
- A broken streak is stated neutrally and the counter restarts. No shaming copy, no sad mascot, no
  guilt-tripping notification.
- Badges mark genuine milestones, never participation. An achievement the user did not earn makes
  every other one worthless.
- Consumes `BetTransactionDetected` (breaks streaks) and the daily clock tick (extends them) —
  through events, never by reading another module's tables.
- Streak arithmetic uses the injected `Clock` and `America/Sao_Paulo` day boundaries, not UTC
  midnight, or users lose a day for no reason.

Emits `BadgeAwarded`, `StreakBroken`, `GoalReached`.
