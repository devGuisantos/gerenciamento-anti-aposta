'use client';

import { ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from 'cn';
import { MoneyText } from '@shared/ui/money-text';

import { toAccountShortLabel } from '../_accounts';
import { DETECTION_LABELS, toBetBadgeLabel } from '../_detection';
import type { LedgerRow } from '../_ledger-view';
import { EntryAvatar } from './entry-avatar';

type TransactionRowProps = {
  readonly row: LedgerRow;
  readonly onSelect: (row: LedgerRow) => void;
};

/**
 * The whole row is the control, as in every bank app: a 4px chevron is not a
 * tap target. Opens the detail sheet, which is where the full explanation lives.
 */
export function TransactionRow({ row, onSelect }: TransactionRowProps) {
  const isCredit = row.amountInCents > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(row)}
      aria-label={`Detalhes de ${row.counterparty}, ${toAccountShortLabel(row.account)}`}
      className="flex w-full items-center gap-3 px-(--card-spacing) py-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
    >
      <EntryAvatar category={row.category} account={row.account} />

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-sm font-medium">{row.counterparty}</span>
          {row.bet ? (
            /* Red never carries meaning alone — the badge names what it is. */
            <Badge variant={row.bet.confidence === 'LOW' ? 'outline' : 'destructive'}>
              {toBetBadgeLabel(row.bet.confidence)}
            </Badge>
          ) : null}
          {row.status === 'PENDING' ? <Badge variant="outline">Pendente</Badge> : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {row.timeLabel} · {row.bet ? DETECTION_LABELS[row.bet.matchedBy] : row.category} ·{' '}
          {toAccountShortLabel(row.account)}
        </p>
      </div>

      <MoneyText
        cents={row.amountInCents}
        signed={isCredit}
        tabular
        className={cn(
          'shrink-0 text-sm font-medium',
          row.bet && 'text-destructive',
          row.status === 'PENDING' && 'text-muted-foreground',
        )}
      />

      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
