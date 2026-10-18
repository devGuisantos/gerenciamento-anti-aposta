import { Flame } from 'lucide-react';

import type { StreakRecord } from '../../achievements/_streak';
import { describeStreakLength } from '../../achievements/_streak-view';
import { StatTile } from './stat-tile';

const LABEL = 'Dias sem apostar';

/**
 * A summary of the record `/achievements` holds, from the same backend read.
 * Complete days only — today is not over — and a stretch that runs off the
 * edge of the data we hold says "pelo menos", never an exact count.
 */
export function StreakTile({ streak }: { readonly streak: StreakRecord | null }) {
  if (streak === null) {
    return (
      <StatTile
        icon={Flame}
        label={LABEL}
        value="—"
        detail="Não conseguimos carregar a sequência agora."
      />
    );
  }

  const { current, longest } = streak;

  return (
    <StatTile
      icon={Flame}
      label={LABEL}
      value={
        <>
          {current.startsBeforeWindow ? (
            <span className="text-sm font-normal text-muted-foreground">pelo menos </span>
          ) : null}
          {current.days}
        </>
      }
      detail={
        longest === null
          ? 'Ainda não há uma sequência fechada.'
          : `Sua maior sequência foi de ${describeStreakLength(longest)}.`
      }
    />
  );
}
