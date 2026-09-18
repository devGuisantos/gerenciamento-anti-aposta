'use client';

import { Flag } from 'lucide-react';

import { PendingActionButton } from '../../_components/pending-action-button';

/**
 * The false-positive correction, as an affordance only — it changes nothing yet.
 *
 * TODO(bet-detection): wire to a `ReclassifyTransaction` command that records the
 * correction and emits `BetClassificationOverridden`. Everything derived from the
 * classification has to recompute when it fires: the dashboard hero, the monthly
 * bands, the bookmaker ranking on `/bets`, and the support-offer signal. The
 * override outranks the policy chain permanently for that transaction, and the
 * corrections need counting — they are the precision measurement the paper wants.
 */
export function ReclassifyAction() {
  return (
    <PendingActionButton
      className="w-full"
      pendingMessage="Ainda não dá para corrigir por aqui. Este botão vai registrar a correção quando a integração com o Open Finance estiver ativa — por enquanto ele não altera nenhum número."
    >
      <Flag />
      Isto não é uma aposta
    </PendingActionButton>
  );
}
