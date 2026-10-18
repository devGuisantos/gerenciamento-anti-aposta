import { Percent } from 'lucide-react';

import { formatBRL } from '@shared/ui/money-text';

import type { IncomeShare } from '../../bets/_bets-view';
import { StatTile } from './stat-tile';

const LABEL = 'Parte da renda em apostas';

type IncomeShareTileProps = {
  readonly incomeShare: IncomeShare | null;
  readonly days: number;
};

/**
 * The hero's figure at the scale a person lives at: a share of what actually
 * came in over the same window, as the backend computed it. Not capped — above
 * 100% is a fact about the window — and stated without comment.
 *
 * It replaced an "available balance" tile, which no endpoint serves: Open
 * Finance shares a statement here, not balances, and detection does not need one.
 */
export function IncomeShareTile({ incomeShare, days }: IncomeShareTileProps) {
  if (incomeShare === null) {
    return (
      <StatTile
        icon={Percent}
        label={LABEL}
        value="—"
        detail={`Nada entrou como renda nas contas conectadas nos últimos ${days} dias, então não há com o que comparar.`}
      />
    );
  }

  return (
    <StatTile
      icon={Percent}
      label={LABEL}
      value={`${incomeShare.percentage}%`}
      detail={`Do que entrou como renda nos últimos ${days} dias (${formatBRL(incomeShare.incomeInCents)}).`}
    />
  );
}
