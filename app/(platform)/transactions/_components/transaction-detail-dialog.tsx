'use client';

import { Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from 'cn';
import { formatBRL } from '@shared/ui/money-text';

import { FIXED_INCOME_ANNUAL_RATE } from '../../dashboard/_mock-snapshot';
import {
  CONFIDENCE_LABELS,
  DETECTION_EXPLANATIONS,
  DETECTION_LABELS,
  toBetBadgeLabel,
} from '../_detection';
import type { BetClassification } from '../_ledger-entry';
import { toYieldEquivalentInCents, type LedgerRow } from '../_ledger-view';

const STATUS_LABELS = {
  SETTLED: 'Concluída',
  PENDING: 'Em processamento',
} as const;

const ratePercent = (FIXED_INCOME_ANNUAL_RATE * 100).toFixed(1).replace('.', ',');

type TransactionDetailDialogProps = {
  readonly row: LedgerRow | null;
  readonly onClose: () => void;
};

/**
 * Progressive disclosure: the list stays scannable and the full story — which
 * policy matched, how sure it is, what the money would have earned — lives one
 * tap away instead of crowding every row.
 */
export function TransactionDetailDialog({ row, onClose }: TransactionDetailDialogProps) {
  return (
    <Dialog open={row !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        {row ? <DetailBody row={row} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailBody({ row }: { readonly row: LedgerRow }) {
  return (
    <>
      <DialogHeader>
        <DialogDescription>{row.fullDateLabel}</DialogDescription>
        <DialogTitle className="font-heading text-2xl tracking-tight">
          {row.counterparty}
        </DialogTitle>
      </DialogHeader>

      <p
        className={cn(
          'font-heading text-3xl font-semibold tracking-tight',
          row.bet && 'text-destructive',
        )}
      >
        {formatBRL(row.amountInCents)}
      </p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <DetailField label="Instituição" value={row.account.institution} />
        <DetailField
          label="Conta"
          value={`${row.account.product} ${row.account.maskedNumber}`}
        />
        <DetailField label="Categoria" value={row.category} />
        <DetailField label="Forma de pagamento" value={row.methodLabel} />
        <DetailField label="Situação" value={STATUS_LABELS[row.status]} />
      </dl>

      {row.bet ? (
        <>
          <Separator />
          <BetExplanation bet={row.bet} amountInCents={row.amountInCents} />
        </>
      ) : null}
    </>
  );
}

function DetailField({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </>
  );
}

function BetExplanation({
  bet,
  amountInCents,
}: {
  readonly bet: BetClassification;
  readonly amountInCents: number;
}) {
  const spendInCents = Math.abs(amountInCents);
  const yieldInCents = toYieldEquivalentInCents(spendInCents, FIXED_INCOME_ANNUAL_RATE);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={bet.confidence === 'LOW' ? 'outline' : 'destructive'}>
            {toBetBadgeLabel(bet.confidence)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {CONFIDENCE_LABELS[bet.confidence]} · {DETECTION_LABELS[bet.matchedBy]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{DETECTION_EXPLANATIONS[bet.matchedBy]}</p>
      </div>

      <div className="space-y-1 rounded-lg bg-muted p-4">
        <p className="text-xs text-muted-foreground">
          Esse mesmo valor, aplicado em renda fixa por 12 meses
        </p>
        <p className="font-heading text-xl font-semibold tracking-tight">
          {formatBRL(yieldInCents)}
        </p>
        <p className="text-xs text-muted-foreground">
          Estimativa a {ratePercent}% ao ano — um rendimento de{' '}
          {formatBRL(yieldInCents - spendInCents)}. Não é uma garantia de retorno.
        </p>
      </div>

      <p className="flex gap-2 text-xs text-muted-foreground">
        <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        Identificamos esta transação depois que ela aconteceu. A plataforma lê os dados
        compartilhados por você; ela não interrompe nem bloqueia pagamentos.
      </p>
    </div>
  );
}
