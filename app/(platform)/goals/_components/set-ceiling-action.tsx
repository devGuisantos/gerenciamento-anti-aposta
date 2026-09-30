'use client';

import { Target } from 'lucide-react';

import { formatBRL } from '@shared/ui/money-text';

import { PendingActionButton } from '../../_components/pending-action-button';

/**
 * Adopting a simulated ceiling, as an affordance only — it changes nothing yet.
 *
 * TODO(gamification): wire to a `SetGoal` command that replaces the goal in force
 * and emits `GoalChanged`, carrying the month it starts governing. The month
 * already under way keeps the old ceiling: moving a ceiling mid-month would
 * rewrite an outcome the user is living through, and every cycle on this screen
 * would become unreadable. `GoalReached` then fires from the month-close tick,
 * never from this command.
 */
export function SetCeilingAction({ ceilingInCents }: { readonly ceilingInCents: number }) {
  return (
    <PendingActionButton
      className="w-full"
      pendingMessage={`Ainda não dá para salvar a meta por aqui. Este botão vai definir o teto de ${formatBRL(ceilingInCents)} quando o módulo de metas estiver ativo — por enquanto ele não altera nada.`}
    >
      <Target />
      Usar {formatBRL(ceilingInCents)} como minha meta
    </PendingActionButton>
  );
}
