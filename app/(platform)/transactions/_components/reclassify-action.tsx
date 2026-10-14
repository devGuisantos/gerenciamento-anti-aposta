'use client';

import { useTransition } from 'react';
import { Flag, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { markNotABetAction, undoNotABetAction, type CorrectionState } from '../_actions';
import type { ClassificationPatch } from '../_statement-view';

/** Hands the backend's answer to whoever holds the rows, so the open dialog updates in place. */
export type CorrectionListener = (transactionId: string, patch: ClassificationPatch) => void;

type CorrectionProps = {
  readonly transactionId: string;
  readonly onCorrected: CorrectionListener;
};

/**
 * Module-level rather than inside a component: the toast's "Desfazer" may be
 * pressed after the dialog that raised it has closed.
 */
async function applyCorrection(
  command: (transactionId: string) => Promise<CorrectionState>,
  { transactionId, onCorrected }: CorrectionProps,
): Promise<CorrectionState> {
  const result = await command(transactionId);

  if (!result.ok) {
    toast.error(result.message);
    return result;
  }

  onCorrected(transactionId, result.patch);
  return result;
}

async function undoCorrection(props: CorrectionProps): Promise<void> {
  const result = await applyCorrection(undoNotABetAction, props);
  if (result.ok) toast(result.message);
}

/**
 * The false-positive correction. It records an override on the backend that
 * outranks the classifier for this transaction for good — the hero, the
 * charts, the streak, the ceiling and the support offer all recompute there.
 *
 * No "tem certeza?": the toast carries the undo, and the dialog keeps offering
 * it. Nothing here argues with the person; they know their statement.
 */
export function ReclassifyAction(props: CorrectionProps) {
  const [isPending, startTransition] = useTransition();

  function correct() {
    startTransition(async () => {
      const result = await applyCorrection(markNotABetAction, props);
      if (!result.ok) return;

      toast(result.message, {
        action: { label: 'Desfazer', onClick: () => void undoCorrection(props) },
      });
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 w-full"
        disabled={isPending}
        onClick={correct}
      >
        <Flag />
        {isPending ? 'Registrando…' : 'Isto não é uma aposta'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Reconhece esta transação e ela não foi uma aposta? A correção vale para todos os totais e
        pode ser desfeita depois.
      </p>
    </div>
  );
}

/** Shown on a row the person already corrected. */
export function UndoReclassifyAction(props: CorrectionProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 w-full"
      disabled={isPending}
      onClick={() => startTransition(() => undoCorrection(props))}
    >
      <Undo2 />
      {isPending ? 'Desfazendo…' : 'Desfazer correção'}
    </Button>
  );
}
