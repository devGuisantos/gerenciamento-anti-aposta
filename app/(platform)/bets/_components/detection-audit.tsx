import { Separator } from '@/components/ui/separator';

import { DETECTION_EXPLANATIONS, DETECTION_LABELS } from '../../transactions/_detection';
import type { DetectionTally } from '../_bets-view';

/**
 * How each bet was caught, and by which policy.
 *
 * This is the screen `bet-detection` needs in order to be arguable: the module
 * says the paper has to discuss precision, and precision is not discussable
 * without somewhere that shows what the classifier actually did. It is also the
 * honest place to say the keyword policy is the weak one.
 */
export function DetectionAudit({ tallies }: { readonly tallies: readonly DetectionTally[] }) {
  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {tallies.map((tally, index) => (
          <li key={tally.reason} className="space-y-2">
            {index > 0 ? <Separator className="mb-4" /> : null}
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-medium">{DETECTION_LABELS[tally.reason]}</span>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {tally.count} {tally.count === 1 ? 'transação' : 'transações'} · {tally.share}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {DETECTION_EXPLANATIONS[tally.reason]}
            </p>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        Errar para mais custa mais caro do que errar para menos: dizer que alguém apostou quando
        não apostou estraga a confiança em todos os outros números. Por isso, quando as regras
        discordam, mostramos a mais fraca das duas.
      </p>
    </div>
  );
}
