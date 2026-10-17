'use client';

import { useState, useTransition } from 'react';
import { History, PiggyBank, HandCoins } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { FormError } from '@shared/ui/form-error';
import { formatBRL } from '@shared/ui/money-text';

import { loadMovementsAction } from '../_actions';
import type { MovementDirection } from '../_savings-goal';
import type { MovementRow } from '../_savings-goals-view';

const DIRECTION_LABELS: Readonly<Record<MovementDirection, string>> = {
  DEPOSIT: 'Guardado',
  WITHDRAWAL: 'Retirado',
};

const DIRECTION_ICONS: Readonly<Record<MovementDirection, typeof PiggyBank>> = {
  DEPOSIT: PiggyBank,
  WITHDRAWAL: HandCoins,
};

type MovementHistoryDialogProps = {
  readonly goalId: string;
  readonly goalTitle: string;
  readonly savedInCents: number;
  readonly movementCount: number;
};

type LoadedHistory = {
  readonly rows: readonly MovementRow[];
  readonly nextCursor: string | null;
};

/**
 * Every movement the user recorded, newest first.
 *
 * It exists because a balance without its history is an assertion. Somebody who
 * recorded the wrong amount, or does not remember a deposit, has nothing to check
 * against — and this is a number they are trusting the app to keep for them.
 *
 * Behind a dialog rather than on the card: the list grows without limit and the
 * cards have to stay scannable on a phone. Same progressive disclosure the
 * statement rows use — and the same paging: the history is read when the dialog
 * opens, one backend page at a time, with every date already a label.
 */
export function MovementHistoryDialog({
  goalId,
  goalTitle,
  savedInCents,
  movementCount,
}: MovementHistoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<LoadedHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();

  function load(cursor: string | null) {
    startLoading(async () => {
      const page = await loadMovementsAction({ goalId, cursor });
      if (!page.ok) {
        setError(page.message);
        return;
      }
      setError(null);
      setHistory((loaded) => ({
        rows: cursor === null ? page.rows : [...(loaded?.rows ?? []), ...page.rows],
        nextCursor: page.nextCursor,
      }));
    });
  }

  /* Read afresh on every opening: a movement recorded since the last one has to be
     in the list the balance above it is summed from. */
  function changeOpen(open: boolean) {
    setIsOpen(open);
    if (!open) return;
    setHistory(null);
    load(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-full justify-start px-2 text-muted-foreground"
          aria-label={`Histórico de ${goalTitle}`}
        >
          <History />
          Histórico ({movementCount})
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogDescription>{goalTitle}</DialogDescription>
          <DialogTitle>Histórico</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Tudo que você registrou nesta meta, do mais recente para o mais antigo. O total guardado
          é a soma destes lançamentos — {formatBRL(savedInCents)}.
        </p>

        <FormError message={error} />

        <HistoryBody
          history={history}
          isLoading={isLoading}
          onLoadMore={(cursor) => load(cursor)}
        />
      </DialogContent>
    </Dialog>
  );
}

type HistoryBodyProps = {
  readonly history: LoadedHistory | null;
  readonly isLoading: boolean;
  readonly onLoadMore: (cursor: string) => void;
};

function HistoryBody({ history, isLoading, onLoadMore }: HistoryBodyProps) {
  if (history === null) {
    return isLoading ? <p className="text-sm text-muted-foreground">Carregando o histórico…</p> : null;
  }

  if (history.rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nada registrado ainda. Use <strong>Guardar</strong> para anotar o primeiro valor.
      </p>
    );
  }

  const { nextCursor } = history;

  return (
    <div className="space-y-3">
      <ul className="max-h-80 overflow-y-auto">
        {history.rows.map((movement, index) => (
          <li key={movement.id}>
            {index > 0 ? <Separator /> : null}
            <MovementLine movement={movement} />
          </li>
        ))}
      </ul>

      {nextCursor === null ? null : (
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-full"
          disabled={isLoading}
          onClick={() => onLoadMore(nextCursor)}
        >
          {isLoading ? 'Carregando…' : 'Carregar mais'}
        </Button>
      )}
    </div>
  );
}

function MovementLine({ movement }: { readonly movement: MovementRow }) {
  const Icon = DIRECTION_ICONS[movement.direction];
  const isWithdrawal = movement.direction === 'WITHDRAWAL';

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <Icon aria-hidden className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          {/* The word, not the sign, is what says which way the money went — and it
              is the only thing a screen reader has to go on. */}
          <p className="text-sm font-medium">{DIRECTION_LABELS[movement.direction]}</p>
          <p className="text-xs text-muted-foreground">{movement.occurredAtLabel}</p>
        </div>
      </div>

      <span className="shrink-0 text-sm font-medium tabular-nums">
        {isWithdrawal ? '−' : '+'}
        {formatBRL(movement.amountInCents)}
      </span>
    </div>
  );
}
