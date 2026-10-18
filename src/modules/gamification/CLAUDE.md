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
- The streak is derived from the bet days on every read, never kept as a counter — a counter beside
  the transactions it counts can disagree with them. Day boundaries are `America/Sao_Paulo`, not
  UTC midnight, or users lose a day for no reason.

- **The celebration belongs to the event, never to a screen.** `BadgeAwarded` is what the confetti
  and the modal hang off, so they fire once, when it happened. A screen that celebrated on open
  would be applauding a visit — see `/achievements` in `app/(platform)/CLAUDE.md`.

Emits `BadgesAwarded` (one per evaluation) and `SavingsGoalReached`. `StreakBroken` is not emitted
yet.

## In this repository

The rules run on **backend-anti-aposta** (contracts: `docs/features/goals.md` and
`docs/features/achievements.md` there); this module is a
client of its API and holds no rule. Server-only, like the others: a Client Component imports types
from here, never values — which is why the purpose list the `<select>` needs lives in
`app/(platform)/goals/_savings-goal.ts`, typed against `GoalPurpose` from here.

- `infrastructure/savings-goals-api.ts` — `listSavingsGoals`, `createSavingsGoal`,
  `listGoalMovements` (paged, newest first) and `recordGoalMovement`, which sends an
  `Idempotency-Key`. The balance, the over-withdrawal refusal and `reachedNow` are the backend's.
- `infrastructure/betting-ceiling-api.ts` — `describeBettingCeiling` (cycles, the open month's
  reframing and every simulator stop, computed there) and `setBettingCeiling` (`PUT`; the month under
  way keeps its ceiling, so the answer says from which month the value governs).
- `infrastructure/achievements-api.ts` — `describeAchievements`: the streak record (São Paulo day
  keys, lower bounds marked) and all eleven badges with their status, figure and evidence. The read
  also awards what fell due; the celebration arrives as `BADGE_AWARDED` on the stream, never here.
