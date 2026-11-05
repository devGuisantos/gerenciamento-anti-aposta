'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { createSavingsGoalAction } from '@/app/(platform)/goals/_actions';
import { PurposeField } from '@/app/(platform)/goals/_components/purpose-field';
import {
  GOAL_TITLE_MAXIMUM_LENGTH,
  GOAL_TITLE_MINIMUM_LENGTH,
  toAmountFieldValue,
  type GoalPurpose,
} from '@/app/(platform)/goals/_savings-goal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@shared/ui/form-error';
import { formatBRL } from '@shared/ui/money-text';

/** Not one of the named purposes: the card says what the money could buy, not what it is for. */
const DEFAULT_PURPOSE: GoalPurpose = 'OTHER';

export type EquivalenceGoal = {
  readonly title: string;
  readonly targetInCents: number;
};

type EquivalenceGoalDialogProps = {
  readonly goal: EquivalenceGoal;
  readonly onClose: () => void;
};

/**
 * A savings goal started from an equivalence card: the same write as `/goals`,
 * with the name and the amount already taken from the card.
 *
 * It asks rather than saving on the click, because a goal the reader did not
 * confirm is a goal the product set for them — they rename it, say what it is for
 * and decide. The amount stays fixed: a goal for a different number than the one
 * the reader just looked at is its own kind of lie.
 *
 * The title is controlled because React resets an uncontrolled form once its
 * action settles, and a refused save must not throw away what they typed.
 */
export function EquivalenceGoalDialog({ goal, onClose }: EquivalenceGoalDialogProps) {
  const router = useRouter();
  const titleId = useId();
  const [title, setTitle] = useState(goal.title);
  const [purpose, setPurpose] = useState<GoalPurpose>(DEFAULT_PURPOSE);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function submit(formData: FormData) {
    startSaving(async () => {
      const result = await createSavingsGoalAction(formData);
      if (result.status === 'FAILED') {
        setError(result.error);
        return;
      }
      toast.success('Meta criada.', {
        action: { label: 'Ver metas', onClick: () => router.push('/goals') },
      });
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova meta</DialogTitle>
          <DialogDescription>
            Você anota aqui quanto quer juntar e para quê. O valor guardado é você que registra — a
            plataforma não movimenta dinheiro nem lê a sua poupança.
          </DialogDescription>
        </DialogHeader>

        <form action={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={titleId}>Nome da meta</Label>
            <Input
              id={titleId}
              name="title"
              className="h-10"
              type="text"
              autoComplete="off"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={GOAL_TITLE_MINIMUM_LENGTH}
              maxLength={GOAL_TITLE_MAXIMUM_LENGTH}
              required
            />
          </div>

          <PurposeField purpose={purpose} onPurposeChange={setPurpose} />

          <div className="space-y-1">
            <p className="text-sm font-medium">Quanto quer juntar</p>
            <p className="font-heading text-xl font-semibold tracking-tight">
              {formatBRL(goal.targetInCents)}
            </p>
            <p className="text-xs text-muted-foreground">O valor do card, pelo preço aproximado.</p>
            <input
              type="hidden"
              name="targetInCents"
              value={toAmountFieldValue(goal.targetInCents)}
            />
          </div>

          <FormError message={error} />

          <DialogFooter>
            <Button type="submit" className="h-10 w-full" disabled={isSaving}>
              {isSaving ? 'Salvando…' : 'Criar meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
