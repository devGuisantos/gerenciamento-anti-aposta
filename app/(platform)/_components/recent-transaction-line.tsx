import { Badge } from '@/components/ui/badge';
import type { RecentTransaction } from '@modules/open-finance';
import { MoneyText } from '@shared/ui/money-text';
import { cn } from 'cn';

import { formatDateTime } from '../accounts/_consent-copy';
import { DETECTION_LABELS, toBetBadgeLabel } from '../transactions/_detection';

/**
 * One row the platform actually read from the bank, as `/accounts` and the
 * dashboard both list them.
 *
 * A bet is red **and** named: the badge says "Aposta" or "Possível aposta" and
 * the line says which signal caught it, so the colour never carries the meaning
 * alone and a weak match is never shown as a certainty.
 */
export function RecentTransactionLine({
  transaction,
}: {
  readonly transaction: RecentTransaction;
}) {
  const { bet } = transaction;

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <span className="grid min-w-0 gap-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">{transaction.counterparty}</span>
          {bet === null ? null : (
            <Badge variant={bet.confidence === 'LOW' ? 'outline' : 'destructive'}>
              {toBetBadgeLabel(bet.confidence)}
            </Badge>
          )}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDateTime(transaction.occurredAt)}
          {bet === null ? null : ` · ${DETECTION_LABELS[bet.matchedBy]}`}
        </span>
      </span>
      <MoneyText
        cents={transaction.amount.amountInCents}
        signed
        tabular
        className={cn('shrink-0 text-sm font-medium', bet !== null && 'text-destructive')}
      />
    </li>
  );
}
