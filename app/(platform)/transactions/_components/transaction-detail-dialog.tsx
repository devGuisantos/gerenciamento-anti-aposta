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
import type { ConnectedAccount, TransactionBet } from '@modules/open-finance';
import { cn } from 'cn';
import { formatBRL } from '@shared/ui/money-text';

import {
  CONFIDENCE_LABELS,
  DETECTION_EXPLANATIONS,
  DETECTION_LABELS,
  toBetBadgeLabel,
} from '../_detection';
import type { StatementRow } from '../_statement-view';
import { ReclassifyAction, UndoReclassifyAction, type CorrectionListener } from './reclassify-action';

const STATUS_LABELS = {
  SETTLED: 'Concluída',
  PENDING: 'Em processamento',
} as const;

const RATE_FORMAT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

type TransactionDetailDialogProps = {
  readonly row: StatementRow | null;
  readonly account: ConnectedAccount | null;
  /** The rate the backend reframed with; the UI states it, never a rate of its own. */
  readonly annualRatePercent: number;
  readonly onClose: () => void;
  readonly onCorrected: CorrectionListener;
};

/**
 * Progressive disclosure: the list stays scannable and the full story — which
 * policy matched, how sure it is, what the money would have earned — lives one
 * tap away instead of crowding every row.
 */
export function TransactionDetailDialog({
  row,
  onClose,
  ...details
}: TransactionDetailDialogProps) {
  return (
    <Dialog open={row !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        {row ? <DetailBody row={row} {...details} /> : null}
      </DialogContent>
    </Dialog>
  );
}

type DetailBodyProps = Omit<TransactionDetailDialogProps, 'row' | 'onClose'> & {
  readonly row: StatementRow;
};

function DetailBody({ row, account, annualRatePercent, onCorrected }: DetailBodyProps) {
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
        {account === null ? null : (
          <>
            <DetailField label="Instituição" value={account.institution} />
            <DetailField label="Conta" value={`${account.product} ${account.maskedNumber}`} />
          </>
        )}
        <DetailField label="Categoria" value={row.categoryLabel} />
        <DetailField label="Forma de pagamento" value={row.methodLabel} />
        <DetailField label="Situação" value={STATUS_LABELS[row.status]} />
      </dl>

      {row.bet ? (
        <>
          <Separator />
          <BetExplanation
            bet={row.bet}
            amountInCents={row.amountInCents}
            yieldInCents={row.yieldEquivalentInCents}
            annualRatePercent={annualRatePercent}
          />
          <ReclassifyAction transactionId={row.id} onCorrected={onCorrected} />
        </>
      ) : null}

      {row.override ? (
        <>
          <Separator />
          <CorrectionRecord row={row} onCorrected={onCorrected} />
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
  yieldInCents,
  annualRatePercent,
}: {
  readonly bet: TransactionBet;
  readonly amountInCents: number;
  readonly yieldInCents: number | null;
  readonly annualRatePercent: number;
}) {
  const spendInCents = Math.abs(amountInCents);

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

      {yieldInCents === null ? null : (
        <div className="space-y-1 rounded-lg bg-muted p-4">
          <p className="text-xs text-muted-foreground">
            Esse mesmo valor, aplicado em renda fixa por 12 meses
          </p>
          <p className="font-heading text-xl font-semibold tracking-tight">
            {formatBRL(yieldInCents)}
          </p>
          <p className="text-xs text-muted-foreground">
            Estimativa a {RATE_FORMAT.format(annualRatePercent)}% ao ano — um rendimento de{' '}
            {formatBRL(yieldInCents - spendInCents)}. Não é uma garantia de retorno.
          </p>
        </div>
      )}

      <p className="flex gap-2 text-xs text-muted-foreground">
        <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        Identificamos esta transação depois que ela aconteceu. A plataforma lê os dados
        compartilhados por você; ela não interrompe nem bloqueia pagamentos.
      </p>
    </div>
  );
}

function CorrectionRecord({
  row,
  onCorrected,
}: {
  readonly row: StatementRow;
  readonly onCorrected: CorrectionListener;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Badge variant="outline">Corrigida por você</Badge>
        <p className="text-sm text-muted-foreground">
          {row.overrideDateLabel === null
            ? 'Você indicou que esta transação não foi uma aposta.'
            : `Em ${row.overrideDateLabel}, você indicou que esta transação não foi uma aposta.`}{' '}
          Ela não entra em nenhum total de apostas.
        </p>
      </div>
      {row.override?.isReversible ? (
        <UndoReclassifyAction transactionId={row.id} onCorrected={onCorrected} />
      ) : null}
    </div>
  );
}
