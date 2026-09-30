/**
 * Demo fixtures for the Metas screen. Every amount is in **integer cents**.
 *
 * TODO(gamification): replace with `container.listGoals.execute({ userId })`.
 * Nothing here may become business logic — it is display data and nothing else.
 *
 * Two goals rather than one because the user **changed their mind**: the ceiling
 * set four months ago was replaced two months later by a higher one. That is the
 * autonomy the module is built on, and a screen that only ever shows a single
 * immutable target cannot demonstrate it.
 *
 * The ceilings are chosen against `MONTHLY_HISTORY`, and between them the four
 * months cover every state the screen can show — one month inside the ceiling,
 * two past it, and the current one still open. Change a figure there and the
 * outcomes here change with it; that is the point of deriving them rather than
 * writing them down.
 */
import type { Goal } from './_goal';

export const GOALS: readonly Goal[] = [
  {
    id: 'goal-1',
    ceilingInCents: 100_000,
    destination: 'Reserva de emergência',
    setMonthsAgo: 3,
    /* Replaced in the same month the one below was set — the two numbers have to
       agree, or a month would be governed by two ceilings at once. */
    replacedMonthsAgo: 1,
  },
  {
    id: 'goal-2',
    ceilingInCents: 120_000,
    destination: 'Reserva de emergência',
    setMonthsAgo: 1,
    replacedMonthsAgo: null,
  },
];
