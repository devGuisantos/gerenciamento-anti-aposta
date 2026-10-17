/**
 * Savings-goal fixtures for `/achievements` only. **`/goals` no longer reads
 * this file** — it reads `gamification` on the backend.
 *
 * TODO(gamification): retires with `/achievements`' other fixtures, when its
 * savings family reads `GET /savings-goals` like `/goals` does.
 *
 * Display data and nothing else: every figure is written down, already
 * consistent (the balance is what the movements the old store held summed to),
 * so nothing here is computed.
 */
import type { SavingsGoalRow } from './_savings-goals-view';

export const SAVINGS_GOAL_FIXTURE_ROWS: readonly SavingsGoalRow[] = [
  {
    id: 'savings-emergency',
    title: 'Reserva para imprevistos',
    purpose: 'EMERGENCY_FUND',
    targetInCents: 300_000,
    savedInCents: 110_000,
    progressPercentage: 37,
    isReached: false,
    reachedAtLabel: null,
    remainingInCents: 190_000,
    movementCount: 4,
  },
  {
    id: 'savings-fridge',
    title: 'Trocar a geladeira',
    purpose: 'HOME',
    targetInCents: 220_000,
    savedInCents: 75_000,
    progressPercentage: 34,
    isReached: false,
    reachedAtLabel: null,
    remainingInCents: 145_000,
    movementCount: 2,
  },
  {
    id: 'savings-course',
    title: 'Curso técnico',
    purpose: 'EDUCATION',
    targetInCents: 120_000,
    savedInCents: 120_000,
    progressPercentage: 100,
    isReached: true,
    reachedAtLabel: null,
    remainingInCents: 0,
    movementCount: 2,
  },
];
